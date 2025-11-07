import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
    default as makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    type WASocket,
    type ConnectionState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { ChatConnector } from '@pkg/connectors-core';
import { WAStorage } from './storage';

/**
 * Baileys 连接器配置
 */
export interface BaileysConnectorConfig {
    /**
     * 会话文件存储根目录
     */
    authRoot: string;

    /**
     * 最大重连尝试次数
     */
    maxReconnectAttempts?: number;

    /**
     * 重连延迟（毫秒）
     */
    reconnectDelay?: number;
}

/**
 * 用户会话信息
 */
interface UserSession {
    socket: WASocket;
    reconnectAttempts: number;
    ready: boolean;
}

/**
 * Baileys WhatsApp 连接器实现
 * 支持多频道：每个用户可以有多个 WhatsApp 账号
 */
export class BaileysConnector extends EventEmitter implements ChatConnector {
    private storage: WAStorage;
    private sessions = new Map<string, UserSession>();
    private maxReconnectAttempts: number;
    private reconnectDelay: number;

    constructor(config: BaileysConnectorConfig) {
        super();
        this.storage = new WAStorage(config.authRoot);
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
        this.reconnectDelay = config.reconnectDelay ?? 3000;
    }

    /**
     * 生成会话 key: uid:channelId
     */
    private getSessionKey(uid: string, channelId: string): string {
        return `${uid}:${channelId}`;
    }

    /**
     * 生成用户频道目录
     */
    private getUserChannelDir(uid: string, channelId: string): string {
        return `user-${uid}-${channelId}`;
    }

    /**
     * 初始化连接器
     */
    async init(): Promise<void> {
        await this.storage.init();
    }

    /**
     * 启动用户的 WhatsApp 连接
     * @param uid 用户 ID
     * @param channelId 频道 ID
     */
    async start(uid: string, channelId: string = 'default'): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);

        if (this.sessions.has(sessionKey)) {
            console.log(`[BaileysConnector] Session already exists: ${sessionKey}`);
            return;
        }

        const userDirName = this.getUserChannelDir(uid, channelId);
        const userDir = await this.storage.ensureUserDir(userDirName);
        const { state, saveCreds } = await useMultiFileAuthState(userDir);
        const { version } = await fetchLatestBaileysVersion();

        const socket = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, undefined as any)
            },
            printQRInTerminal: false,
            browser: ['Chrome (Linux)', '', ''],
            getMessage: async () => undefined
        });

        // 创建会话记录
        const session: UserSession = {
            socket,
            reconnectAttempts: 0,
            ready: false
        };
        this.sessions.set(sessionKey, session);

        // 监听连接状态更新
        socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            await this.handleConnectionUpdate(uid, channelId, update, saveCreds);
        });

        // 监听凭证更新
        socket.ev.on('creds.update', saveCreds);

        // 监听消息
        socket.ev.on('messages.upsert', async ({ messages }: any) => {
            await this.handleMessagesUpsert(uid, channelId, messages);
        });

        console.log(`[BaileysConnector] Started session: ${sessionKey}`);
    }

    /**
     * 处理连接状态更新
     */
    private async handleConnectionUpdate(
        uid: string,
        channelId: string,
        update: Partial<ConnectionState>,
        saveCreds: () => Promise<void>
    ): Promise<void> {
        const { connection, lastDisconnect, qr } = update;
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);

        if (!session) return;

        // QR 码生成
        if (qr) {
            console.log(`[BaileysConnector] QR code generated: ${sessionKey}`);
            this.emit('qr', { uid, channelId, qr });
        }

        // 连接状态变化
        if (connection === 'open') {
            console.log(`[BaileysConnector] Connection opened: ${sessionKey}`);
            session.ready = true;
            session.reconnectAttempts = 0;
            this.emit('ready', { uid, channelId });
            this.emit('status', { uid, channelId, state: 'open' });
        } else if (connection === 'connecting') {
            console.log(`[BaileysConnector] Connecting: ${sessionKey}`);
            this.emit('status', { uid, channelId, state: 'connecting' });
        } else if (connection === 'close') {
            session.ready = false;
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(
                `[BaileysConnector] Connection closed: ${sessionKey}`,
                { statusCode, shouldReconnect }
            );

            if (shouldReconnect && session.reconnectAttempts < this.maxReconnectAttempts) {
                session.reconnectAttempts++;
                console.log(
                    `[BaileysConnector] Reconnecting (${session.reconnectAttempts}/${this.maxReconnectAttempts}): ${sessionKey}`
                );
                this.emit('status', { uid, channelId, state: 'reconnecting' });

                // 延迟重连
                setTimeout(async () => {
                    try {
                        await this.stop(uid, channelId);
                        await this.start(uid, channelId);
                    } catch (error) {
                        console.error(`[BaileysConnector] Reconnect failed: ${sessionKey}`, error);
                        this.emit('error', { uid, channelId, error });
                    }
                }, this.reconnectDelay);
            } else {
                console.log(`[BaileysConnector] Session closed permanently: ${sessionKey}`);
                this.emit('status', { uid, channelId, state: 'closed' });
                this.sessions.delete(sessionKey);

                // 如果是 loggedOut，删除会话文件
                if (statusCode === DisconnectReason.loggedOut) {
                    const userDirName = this.getUserChannelDir(uid, channelId);
                    await this.storage.deleteSession(userDirName);
                }
            }
        }
    }

    /**
     * 处理接收到的消息
     */
    private async handleMessagesUpsert(uid: string, channelId: string, messages: any[]): Promise<void> {
        for (const msg of messages) {
            // 只处理非自己发送的消息
            if (!msg.message || msg.key.fromMe) continue;

            try {
                const from = msg.key.remoteJid;
                const text = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '';
                const ts = msg.messageTimestamp * 1000;
                const messageId = msg.key.id;

                if (text) {
                    console.log(`[BaileysConnector] Message received: ${uid}:${channelId} from ${from}`);
                    this.emit('message', { uid, channelId, from, text, ts, messageId });
                }
            } catch (error) {
                console.error(`[BaileysConnector] Error processing message: ${uid}:${channelId}`, error);
                this.emit('error', { uid, channelId, error });
            }
        }
    }

    /**
     * 停止用户的 WhatsApp 连接
     * @param uid 用户 ID
     * @param channelId 频道 ID
     */
    async stop(uid: string, channelId: string = 'default'): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);

        if (!session) {
            console.log(`[BaileysConnector] No session to stop: ${sessionKey}`);
            return;
        }

        try {
            await session.socket.logout();
        } catch (error) {
            console.error(`[BaileysConnector] Error during logout: ${sessionKey}`, error);
        } finally {
            session.socket.end(undefined);
            this.sessions.delete(sessionKey);
            console.log(`[BaileysConnector] Stopped session: ${sessionKey}`);
        }
    }

    /**
     * 发送消息
     */
    async send(uid: string, channelId: string = 'default', to: string, text: string): Promise<void> {
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);
        if (!session || !session.ready) {
            throw new Error(`Socket not ready for ${sessionKey}`);
        }

        try {
            await session.socket.sendMessage(to, { text });
            console.log(`[BaileysConnector] Message sent: ${sessionKey} to ${to}`);
        } catch (error) {
            console.error(`[BaileysConnector] Failed to send message from ${sessionKey}:`, error);
            throw error;
        }
    }

    /**
     * 检查用户的连接是否就绪
     */
    isReady(uid: string, channelId: string = 'default'): boolean {
        const sessionKey = this.getSessionKey(uid, channelId);
        const session = this.sessions.get(sessionKey);
        return session?.ready ?? false;
    }

    /**
     * 获取用户的 socket 实例（用于高级操作）
     */
    getSocket(uid: string, channelId: string = 'default'): WASocket | undefined {
        const sessionKey = this.getSessionKey(uid, channelId);
        return this.sessions.get(sessionKey)?.socket;
    }
}
