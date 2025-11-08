import { EventEmitter } from 'node:events';
import path from 'node:path';
import {
    default as makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';
import type {
    WASocket,
    ConnectionState,
    WAMessage,
    MessageUpsertType,
    BaileysEventMap,
    Contact,
    Chat,
    MessageUserReceipt,
    GroupMetadata,
    GroupParticipant,
    ParticipantAction
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import type { ChatConnector } from '@pkg/connectors-core';
import { WAStorage } from './storage';

/**
 * Distributed lock interface
 */
interface Lock {
    release(): Promise<void>;
}

/**
 * Redlock interface for distributed locking
 */
interface Redlock {
    acquire(resources: string[], ttl: number): Promise<Lock>;
}

/**
 * Message event payload
 */
interface MessageEvent {
    uid: string;
    channelId: string;
    from: string;
    text: string;
    ts: number;
    messageId: string;
}

/**
 * QR code event payload
 */
interface QREvent {
    uid: string;
    channelId: string;
    qr: string;
}

/**
 * Ready event payload
 */
interface ReadyEvent {
    uid: string;
    channelId: string;
    phoneNumber?: string;
}

/**
 * Status event payload
 */
interface StatusEvent {
    uid: string;
    channelId: string;
    state: 'open' | 'connecting' | 'reconnecting' | 'closed';
}

/**
 * Error event payload
 */
interface ErrorEvent {
    uid: string;
    channelId: string;
    error: any;
}

/**
 * Messages upsert event data
 */
interface MessagesUpsertEvent {
    messages: WAMessage[];
    type: MessageUpsertType;
}

/**
 * Messages update event payload
 */
interface MessagesUpdateEvent {
    uid: string;
    channelId: string;
    updates: any[]; // Baileys MessageUpdate type
}

/**
 * Messages delete event payload
 */
interface MessagesDeleteEvent {
    uid: string;
    channelId: string;
    deletion: { fromMe?: boolean; id: string; participant?: string; remoteJid?: string };
}

/**
 * Messages reaction event payload
 */
interface MessagesReactionEvent {
    uid: string;
    channelId: string;
    reactions: {
        key: { remoteJid?: string; fromMe?: boolean; id?: string; participant?: string };
        reaction: { text?: string; senderTimestampMs?: number };
    }[];
}

/**
 * Message receipt event payload
 */
interface MessageReceiptEvent {
    uid: string;
    channelId: string;
    receipts: MessageUserReceipt[];
}

/**
 * Chats upsert event payload
 */
interface ChatsUpsertEvent {
    uid: string;
    channelId: string;
    chats: Chat[];
}

/**
 * Chats update event payload
 */
interface ChatsUpdateEvent {
    uid: string;
    channelId: string;
    updates: Partial<Chat>[];
}

/**
 * Chats delete event payload
 */
interface ChatsDeleteEvent {
    uid: string;
    channelId: string;
    deletions: string[];
}

/**
 * Contacts upsert event payload
 */
interface ContactsUpsertEvent {
    uid: string;
    channelId: string;
    contacts: Contact[];
}

/**
 * Contacts update event payload
 */
interface ContactsUpdateEvent {
    uid: string;
    channelId: string;
    updates: Partial<Contact>[];
}

/**
 * Groups upsert event payload
 */
interface GroupsUpsertEvent {
    uid: string;
    channelId: string;
    groups: GroupMetadata[];
}

/**
 * Groups update event payload
 */
interface GroupsUpdateEvent {
    uid: string;
    channelId: string;
    updates: Partial<GroupMetadata>[];
}

/**
 * Group participants update event payload
 */
interface GroupParticipantsUpdateEvent {
    uid: string;
    channelId: string;
    update: {
        id: string;
        participants: string[];
        action: ParticipantAction;
        author?: string;
    };
}

/**
 * Blocklist set event payload
 */
interface BlocklistSetEvent {
    uid: string;
    channelId: string;
    blocklist: string[];
}

/**
 * Blocklist update event payload
 */
interface BlocklistUpdateEvent {
    uid: string;
    channelId: string;
    blocklist: string[];
    type: 'add' | 'remove';
}

/**
 * Call event payload
 */
interface CallEvent {
    uid: string;
    channelId: string;
    calls: {
        chatId: string;
        from: string;
        id: string;
        date: Date;
        offline: boolean;
        status: string;
    }[];
}

/**
 * Labels edit event payload
 */
interface LabelsEditEvent {
    uid: string;
    channelId: string;
    label: {
        id: string;
        name: string;
        color: number;
        deleted?: boolean;
    };
}

/**
 * Labels association event payload
 */
interface LabelsAssociationEvent {
    uid: string;
    channelId: string;
    association: any; // Baileys LabelAssociation type
}

/**
 * History sync event payload
 */
interface HistorySyncEvent {
    uid: string;
    channelId: string;
    chats: Chat[];
    contacts: Contact[];
    messages: WAMessage[];
    syncType?: any; // Baileys HistorySyncType enum
}

/**
 * Auth state interface for database storage
 */
interface AuthState {
    state: any;
    saveCreds: () => Promise<void>;
}

/**
 * Baileys 连接器配置
 */
export interface BaileysConnectorConfig {
    /**
     * 会话文件存储根目录（当 useDatabase = false 时使用）
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

    /**
     * Redlock 实例（可选，用于分布式锁）
     */
    redlock?: Redlock;

    /**
     * 使用数据库存储认证信息（推荐）
     * 默认: true
     */
    useDatabase?: boolean;

    /**
     * 数据库认证状态生成器（当 useDatabase = true 时必需）
     */
    makeAuthState?: (channelId: string, userId: string) => Promise<AuthState>;
}

/**
 * 用户会话信息
 */
interface UserSession {
    socket: WASocket;
    reconnectAttempts: number;
    ready: boolean;
    lock?: Lock;
}

/**
 * Baileys WhatsApp 连接器实现
 * 支持多频道：每个用户可以有多个 WhatsApp 账号
 */
export class BaileysConnector extends EventEmitter implements ChatConnector {
    private readonly storage: WAStorage;
    private readonly sessions = new Map<string, UserSession>();
    private readonly maxReconnectAttempts: number;
    private readonly reconnectDelay: number;
    private readonly redlock?: Redlock;
    private readonly useDatabase: boolean;
    private readonly makeAuthState?: (channelId: string, userId: string) => Promise<AuthState>;

    constructor(config: BaileysConnectorConfig) {
        super();
        this.storage = new WAStorage(config.authRoot);
        this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
        this.reconnectDelay = config.reconnectDelay ?? 3000;
        this.redlock = config.redlock;
        this.useDatabase = config.useDatabase ?? true; // 默认使用数据库
        this.makeAuthState = config.makeAuthState;
    }

    /**
     * Override emit to satisfy TypeScript type checking
     */
    declare emit: (event: string | symbol, ...args: any[]) => boolean;

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
        const sessionKey: string = this.getSessionKey(uid, channelId);

        // 尝试获取分布式锁（防止并发连接同一账号）
        let lock: Lock | undefined;
        if (this.redlock) {
            const lockKey: string = `lock:wa:session:${channelId}`;
            try {
                lock = await this.redlock.acquire([lockKey], 15000); // 15秒 TTL
                console.log(`[BaileysConnector] Acquired lock for ${sessionKey}`);
            } catch (error) {
                console.warn(`[BaileysConnector] Failed to acquire lock for ${sessionKey}, session may already be running`);
                this.emit('error', { uid, channelId, error: 'already-running' } satisfies ErrorEvent);
                return;
            }
        }

        if (this.sessions.has(sessionKey)) {
            console.log(`[BaileysConnector] Session already exists: ${sessionKey}`);
            if (lock) await lock.release().catch(console.error);
            return;
        }

        // 获取认证状态（数据库或文件）
        let state: any;
        let saveCreds: () => Promise<void>;

        if (this.useDatabase && this.makeAuthState) {
            console.log(`[BaileysConnector] Using DATABASE auth for ${sessionKey}`);
            const authState: AuthState = await this.makeAuthState(channelId, uid);
            state = authState.state;
            saveCreds = authState.saveCreds;
        } else {
            console.log(`[BaileysConnector] Using FILE auth for ${sessionKey}`);
            const userDirName: string = this.getUserChannelDir(uid, channelId);
            const userDir: string = await this.storage.ensureUserDir(userDirName);
            const fileAuthState = await useMultiFileAuthState(userDir);
            state = fileAuthState.state;
            saveCreds = fileAuthState.saveCreds;
        }

        const { version } = await fetchLatestBaileysVersion();

        const socket: WASocket = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, console as any)
            },
            // printQRInTerminal is deprecated - handle QR in connection.update event
            browser: Browsers.macOS('Desktop'), // Desktop browser for full history sync
            getMessage: async (key: any) => {
                // getMessage is used for:
                // 1. Message resending (if message was not delivered)
                // 2. Poll vote decryption
                // 3. Forwarding messages with quotes

                // TODO: Implement getMessage to fetch from database
                // For now, returning undefined means:
                // - Poll votes won't be decrypted
                // - Message resending won't work
                // - Quote forwarding won't work

                console.log(`[BaileysConnector] getMessage requested for ${key.remoteJid}, id: ${key.id}`);
                return undefined;
            },
            // Enable full history sync (desktop mode)
            syncFullHistory: true,
            // Mark as online on connect (set to false if you want to avoid notifications on phone)
            markOnlineOnConnect: true,
            // Handle history sync messages
            shouldSyncHistoryMessage: (msg: any) => {
                // Return true to process history messages
                // You can add filtering logic here if needed
                return true;
            },
            // Log QR codes to console if needed (deprecated, use connection.update event instead)
            printQRInTerminal: false,
            // Default query timeout
            defaultQueryTimeoutMs: undefined,
        });

        // 创建会话记录
        const session: UserSession = {
            socket,
            reconnectAttempts: 0,
            ready: false,
            lock
        };
        this.sessions.set(sessionKey, session);

        // 监听认证更新并保存（Baileys 官方推荐）
        socket.ev.on('creds.update', saveCreds);

        // 监听连接状态更新
        socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
            await this.handleConnectionUpdate(uid, channelId, update, saveCreds);
        });

        // 监听历史消息同步（登录后自动触发）
        socket.ev.on('messaging-history.set', async (data: { chats: Chat[]; contacts: Contact[]; messages: WAMessage[]; syncType?: any }) => {
            const { chats, contacts, messages, syncType } = data;
            console.log(`[BaileysConnector] History sync received for ${sessionKey}:`, {
                chats: chats.length,
                contacts: contacts.length,
                messages: messages.length,
                syncType
            });

            // 发出历史同步事件
            this.emit('history-sync', {
                uid,
                channelId,
                chats,
                contacts,
                messages,
                syncType
            } satisfies HistorySyncEvent);
        });

        // === MESSAGE EVENTS ===

        // 监听新消息和离线同步消息
        socket.ev.on('messages.upsert', async ({ type, messages }: { type: MessageUpsertType; messages: WAMessage[] }) => {
            if (type === 'notify') {
                // 新消息 - 处理数组中的所有消息
                for (const message of messages) {
                    await this.handleNewMessage(uid, channelId, message);
                }
            } else {
                // 旧消息/已处理的消息 (append)
                console.log(`[BaileysConnector] Received ${messages.length} old messages for ${sessionKey}`);
            }
        });

        // 监听消息更新（编辑、删除、状态变化）
        socket.ev.on('messages.update', async (updates: any[]) => {
            console.log(`[BaileysConnector] Message updates for ${sessionKey}:`, updates.length);
            this.emit('messages-update', { uid, channelId, updates } satisfies MessagesUpdateEvent);
        });

        // 监听消息删除
        socket.ev.on('messages.delete', async (deletion: any) => {
            console.log(`[BaileysConnector] Message deletion for ${sessionKey}:`, deletion);
            this.emit('messages-delete', { uid, channelId, deletion } satisfies MessagesDeleteEvent);
        });

        // 监听消息反应（表情回复）
        socket.ev.on('messages.reaction', async (reactions: any[]) => {
            console.log(`[BaileysConnector] Message reactions for ${sessionKey}:`, reactions.length);
            this.emit('messages-reaction', { uid, channelId, reactions } satisfies MessagesReactionEvent);
        });

        // 监听消息回执更新（已读、已送达等）
        socket.ev.on('message-receipt.update', async (receipts: any[]) => {
            console.log(`[BaileysConnector] Message receipts for ${sessionKey}:`, receipts.length);
            this.emit('message-receipt', { uid, channelId, receipts } satisfies MessageReceiptEvent);
        });

        // === CHAT EVENTS ===

        // 监听新聊天创建
        socket.ev.on('chats.upsert', async (chats: Chat[]) => {
            console.log(`[BaileysConnector] New chats for ${sessionKey}:`, chats.length);
            this.emit('chats-upsert', { uid, channelId, chats } satisfies ChatsUpsertEvent);
        });

        // 监听聊天更新（未读数、最新消息等）
        socket.ev.on('chats.update', async (updates: Partial<Chat>[]) => {
            console.log(`[BaileysConnector] Chat updates for ${sessionKey}:`, updates.length);
            this.emit('chats-update', { uid, channelId, updates } satisfies ChatsUpdateEvent);
        });

        // 监听聊天删除
        socket.ev.on('chats.delete', async (deletions: string[]) => {
            console.log(`[BaileysConnector] Chat deletions for ${sessionKey}:`, deletions.length);
            this.emit('chats-delete', { uid, channelId, deletions } satisfies ChatsDeleteEvent);
        });

        // === CONTACT EVENTS ===

        // 监听新联系人添加
        socket.ev.on('contacts.upsert', async (contacts: Contact[]) => {
            console.log(`[BaileysConnector] New contacts for ${sessionKey}:`, contacts.length);
            this.emit('contacts-upsert', { uid, channelId, contacts } satisfies ContactsUpsertEvent);
        });

        // 监听联系人更新
        socket.ev.on('contacts.update', async (updates: Partial<Contact>[]) => {
            console.log(`[BaileysConnector] Contact updates for ${sessionKey}:`, updates.length);
            this.emit('contacts-update', { uid, channelId, updates } satisfies ContactsUpdateEvent);
        });

        // === GROUP EVENTS ===

        // 监听新群组加入
        socket.ev.on('groups.upsert', async (groups: GroupMetadata[]) => {
            console.log(`[BaileysConnector] New groups for ${sessionKey}:`, groups.length);
            this.emit('groups-upsert', { uid, channelId, groups } satisfies GroupsUpsertEvent);
        });

        // 监听群组元数据更新
        socket.ev.on('groups.update', async (updates: Partial<GroupMetadata>[]) => {
            console.log(`[BaileysConnector] Group updates for ${sessionKey}:`, updates.length);
            this.emit('groups-update', { uid, channelId, updates } satisfies GroupsUpdateEvent);
        });

        // 监听群组参与者变化
        socket.ev.on('group-participants.update', async (update: GroupParticipantsUpdateEvent['update']) => {
            console.log(`[BaileysConnector] Group participants update for ${sessionKey}:`, update);
            this.emit('group-participants-update', { uid, channelId, update } satisfies GroupParticipantsUpdateEvent);
        });

        // === OTHER EVENTS ===

        // 监听黑名单更新
        socket.ev.on('blocklist.set', async ({ blocklist }: { blocklist: string[] }) => {
            console.log(`[BaileysConnector] Blocklist set for ${sessionKey}:`, blocklist.length);
            this.emit('blocklist-set', { uid, channelId, blocklist } satisfies BlocklistSetEvent);
        });

        socket.ev.on('blocklist.update', async ({ blocklist, type }: { blocklist: string[]; type: 'add' | 'remove' }) => {
            console.log(`[BaileysConnector] Blocklist ${type} for ${sessionKey}:`, blocklist.length);
            this.emit('blocklist-update', { uid, channelId, blocklist, type } satisfies BlocklistUpdateEvent);
        });

        // 监听通话事件
        socket.ev.on('call', async (calls: CallEvent['calls']) => {
            console.log(`[BaileysConnector] Call events for ${sessionKey}:`, calls.length);
            this.emit('call', { uid, channelId, calls } satisfies CallEvent);
        });

        // 监听 LID 映射更新（v7.0.0 新特性）
        socket.ev.on('labels.edit', async (label: LabelsEditEvent['label']) => {
            console.log(`[BaileysConnector] Label edit for ${sessionKey}:`, label);
            this.emit('labels-edit', { uid, channelId, label } satisfies LabelsEditEvent);
        });

        socket.ev.on('labels.association', async (association: any) => {
            console.log(`[BaileysConnector] Label association for ${sessionKey}:`, association);
            this.emit('labels-association', { uid, channelId, association } satisfies LabelsAssociationEvent);
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
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);

        if (!session) return;

        // QR 码生成
        if (qr) {
            console.log(`[BaileysConnector] QR code generated: ${sessionKey}`);
            this.emit('qr', { uid, channelId, qr } satisfies QREvent);
        }

        // 连接状态变化
        if (connection === 'open') {
            console.log(`[BaileysConnector] Connection opened: ${sessionKey}`);
            session.ready = true;
            session.reconnectAttempts = 0;

            // 获取已登录的手机号
            const phoneNumber: string | undefined = session.socket.user?.id?.split(':')[0] || session.socket.user?.id;
            console.log(`[BaileysConnector] Phone number: ${phoneNumber}`);

            this.emit('ready', { uid, channelId, phoneNumber } satisfies ReadyEvent);
            this.emit('status', { uid, channelId, state: 'open' } satisfies StatusEvent);
        } else if (connection === 'connecting') {
            console.log(`[BaileysConnector] Connecting: ${sessionKey}`);
            this.emit('status', { uid, channelId, state: 'connecting' } satisfies StatusEvent);
        } else if (connection === 'close') {
            session.ready = false;
            const statusCode: number | undefined = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect: boolean = statusCode !== DisconnectReason.loggedOut;

            console.log(
                `[BaileysConnector] Connection closed: ${sessionKey}`,
                { statusCode, shouldReconnect }
            );

            if (shouldReconnect && session.reconnectAttempts < this.maxReconnectAttempts) {
                session.reconnectAttempts++;
                console.log(
                    `[BaileysConnector] Reconnecting (${session.reconnectAttempts}/${this.maxReconnectAttempts}): ${sessionKey}`
                );
                this.emit('status', { uid, channelId, state: 'reconnecting' } satisfies StatusEvent);

                // 延迟重连
                setTimeout(async () => {
                    try {
                        await this.stop(uid, channelId);
                        await this.start(uid, channelId);
                    } catch (error) {
                        console.error(`[BaileysConnector] Reconnect failed: ${sessionKey}`, error);
                        this.emit('error', { uid, channelId, error } satisfies ErrorEvent);
                    }
                }, this.reconnectDelay);
            } else {
                console.log(`[BaileysConnector] Session closed permanently: ${sessionKey}`);
                this.emit('status', { uid, channelId, state: 'closed' } satisfies StatusEvent);
                this.sessions.delete(sessionKey);

                // 如果是 loggedOut，删除会话文件
                if (statusCode === DisconnectReason.loggedOut) {
                    const userDirName: string = this.getUserChannelDir(uid, channelId);
                    await this.storage.deleteSession(userDirName);
                }
            }
        }
    }

    /**
     * 解析 WhatsApp JID 获取电话号码
     * 将 "165348254949562@lid" 或 "1234567890@s.whatsapp.net" 转换为 "+165348254949562" 或 "+1234567890"
     */
    private parsePhoneNumber(jid: string): string {
        if (!jid) return jid;

        // 提取 @ 之前的数字部分
        const match: RegExpMatchArray | null = jid.match(/^(\d+)@/);
        if (match && match[1]) {
            const phoneNumber: string = match[1];
            // 添加 + 前缀以表示这是国际格式
            return `+${phoneNumber}`;
        }

        // 如果无法解析，返回原始值
        return jid;
    }

    /**
     * 处理接收到的消息
     */
    private async handleMessagesUpsert(uid: string, channelId: string, messages: WAMessage[]): Promise<void> {
        // 只处理非自己发送的消息
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            try {
                const rawJid: string = msg.key.remoteJid!;
                const from: string = this.parsePhoneNumber(rawJid); // 解析成电话号码格式
                const text: string = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '';
                const ts: number = (msg.messageTimestamp as number) * 1000;
                const messageId: string = msg.key.id!;

                if (text) {
                    console.log(`[BaileysConnector] Message received: ${uid}:${channelId} from ${rawJid} (parsed: ${from})`);
                    this.emit('message', { uid, channelId, from, text, ts, messageId } satisfies MessageEvent);
                }
            } catch (error) {
                console.error(`[BaileysConnector] Error processing message: ${uid}:${channelId}`, error);
                this.emit('error', { uid, channelId, error } satisfies ErrorEvent);
            }
        }
    }

    /**
     * 处理单个新消息
     */
    private async handleNewMessage(uid: string, channelId: string, message: WAMessage): Promise<void> {
        // 只处理非自己发送的消息
        if (!message.message || message.key.fromMe) return;

        try {
            const rawJid: string = message.key.remoteJid!;
            const from: string = this.parsePhoneNumber(rawJid); // 解析成电话号码格式
            const text: string = message.message.conversation ||
                message.message.extendedTextMessage?.text ||
                '';
            const ts: number = (message.messageTimestamp as number) * 1000;
            const messageId: string = message.key.id!;

            if (text) {
                console.log(`[BaileysConnector] Message received: ${uid}:${channelId} from ${rawJid} (parsed: ${from})`);
                this.emit('message', { uid, channelId, from, text, ts, messageId } satisfies MessageEvent);
            }
        } catch (error) {
            console.error(`[BaileysConnector] Error processing message: ${uid}:${channelId}`, error);
            this.emit('error', { uid, channelId, error } satisfies ErrorEvent);
        }
    }

    /**
     * 停止用户的 WhatsApp 连接
     * @param uid 用户 ID
     * @param channelId 频道 ID
     */
    async stop(uid: string, channelId: string = 'default'): Promise<void> {
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);

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

            // 释放分布式锁
            if (session.lock) {
                await session.lock.release().catch((err: Error) =>
                    console.error(`[BaileysConnector] Failed to release lock for ${sessionKey}:`, err)
                );
                console.log(`[BaileysConnector] Released lock for ${sessionKey}`);
            }

            this.sessions.delete(sessionKey);
            console.log(`[BaileysConnector] Stopped session: ${sessionKey}`);
        }
    }

    /**
     * 将电话号码转换为 WhatsApp JID 格式
     * "+1234567890" 或 "1234567890" → "1234567890@s.whatsapp.net"
     */
    private toWhatsAppJid(phoneNumber: string): string {
        // 如果已经是 JID 格式（包含 @），直接返回
        if (phoneNumber.includes('@')) {
            return phoneNumber;
        }

        // 移除 + 前缀和所有非数字字符
        const cleanNumber: string = phoneNumber.replace(/[^\d]/g, '');

        // 转换为 WhatsApp JID 格式
        return `${cleanNumber}@s.whatsapp.net`;
    }

    /**
     * 发送消息
     */
    async send(uid: string, channelId: string = 'default', to: string, text: string): Promise<void> {
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);
        if (!session || !session.ready) {
            throw new Error(`Socket not ready for ${sessionKey}`);
        }

        try {
            // 将电话号码转换为 WhatsApp JID 格式
            const jid: string = this.toWhatsAppJid(to);
            await session.socket.sendMessage(jid, { text });
            console.log(`[BaileysConnector] Message sent: ${sessionKey} to ${to} (jid: ${jid})`);
        } catch (error) {
            console.error(`[BaileysConnector] Failed to send message from ${sessionKey}:`, error);
            throw error;
        }
    }

    /**
     * 删除聊天（通过 Baileys API）
     * @param uid 用户 ID
     * @param channelId 频道 ID
     * @param chatJid 聊天 JID（电话号码或群组 JID）
     */
    async deleteChat(uid: string, channelId: string = 'default', chatJid: string): Promise<void> {
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);
        if (!session || !session.ready) {
            throw new Error(`Socket not ready for ${sessionKey}`);
        }

        try {
            const jid: string = this.toWhatsAppJid(chatJid);

            // 使用 Baileys chatModify 删除聊天
            await session.socket.chatModify(
                { delete: true, lastMessages: [] },
                jid
            );

            console.log(`[BaileysConnector] Chat deleted: ${sessionKey}, jid: ${jid}`);
        } catch (error) {
            console.error(`[BaileysConnector] Failed to delete chat from ${sessionKey}:`, error);
            throw error;
        }
    }

    /**
     * 归档聊天（通过 Baileys API）
     * @param uid 用户 ID
     * @param channelId 频道 ID
     * @param chatJid 聊天 JID
     * @param archive true=归档, false=取消归档
     */
    async archiveChat(uid: string, channelId: string = 'default', chatJid: string, archive: boolean = true): Promise<void> {
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);
        if (!session || !session.ready) {
            throw new Error(`Socket not ready for ${sessionKey}`);
        }

        try {
            const jid: string = this.toWhatsAppJid(chatJid);

            // 使用 Baileys chatModify 归档/取消归档
            await session.socket.chatModify(
                { archive, lastMessages: [] },
                jid
            );

            console.log(`[BaileysConnector] Chat ${archive ? 'archived' : 'unarchived'}: ${sessionKey}, jid: ${jid}`);
        } catch (error) {
            console.error(`[BaileysConnector] Failed to ${archive ? 'archive' : 'unarchive'} chat from ${sessionKey}:`, error);
            throw error;
        }
    }

    /**
     * 检查用户的连接是否就绪
     */
    isReady(uid: string, channelId: string = 'default'): boolean {
        const sessionKey: string = this.getSessionKey(uid, channelId);
        const session: UserSession | undefined = this.sessions.get(sessionKey);
        return session?.ready ?? false;
    }
}