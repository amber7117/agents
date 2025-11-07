import path from 'node:path';
import type { Server as SocketServer } from 'socket.io';
import { BaileysConnector } from '@pkg/connectors-whatsapp';
import { prisma } from '@pkg/db';
import { log } from '../utils/logger';
import { handleInbound } from '../ai/orchestrator';

/**
 * WhatsApp 胶水层
 * 连接 BaileysConnector 和 Socket.IO，同时更新数据库
 */
export class WhatsAppChannel {
    private connector: BaileysConnector;
    private io: SocketServer;

    constructor(io: SocketServer) {
        this.io = io;
        const authRoot = path.resolve(process.cwd(), 'apps/api/wa-auth');

        this.connector = new BaileysConnector({
            authRoot,
            maxReconnectAttempts: 5,
            reconnectDelay: 5000,
        });

        this.setupEventListeners();
    }

    /**
     * 初始化 connector
     */
    async init(): Promise<void> {
        await this.connector.init();
        log('[WhatsAppChannel] Initialized');
    }

    /**
     * 设置事件监听器，将 connector 事件映射到 Socket.IO 事件
     */
    private setupEventListeners(): void {
        // QR 码事件
        this.connector.on('qr', ({ uid, channelId, qr }) => {
            log(`[WhatsAppChannel] QR generated: ${uid}:${channelId}`);
            this.io.to(uid).emit('wa.qr', { channelId, qr });

            // 更新数据库会话状态
            this.upsertChannelSession(uid, channelId, 'waiting_qr', {
                lastQRAt: new Date()
            }).catch(console.error);
        });

        // 连接就绪事件
        this.connector.on('ready', ({ uid, channelId }) => {
            log(`[WhatsAppChannel] Ready: ${uid}:${channelId}`);
            this.io.to(uid).emit('wa.ready', { channelId });

            // 更新数据库会话状态
            this.upsertChannelSession(uid, channelId, 'open', {
                lastConnected: new Date()
            }).catch(console.error);
        });

        // 状态变化事件
        this.connector.on('status', ({ uid, channelId, state }) => {
            log(`[WhatsAppChannel] Status ${state}: ${uid}:${channelId}`);
            this.io.to(uid).emit('wa.status', { channelId, state });

            // 更新数据库会话状态
            this.upsertChannelSession(uid, channelId, state).catch(console.error);
        });

        // 消息接收事件
        this.connector.on('message', async ({ uid, channelId, from, text, ts, messageId }) => {
            log(`[WhatsAppChannel] Message: ${uid}:${channelId} from ${from}`);

            // 先向前端发送消息事件
            this.io.to(uid).emit('wa.message', { channelId, from, text, ts });

            // 保存消息到数据库
            this.saveMessage(uid, channelId, {
                whatsappMessageId: messageId,
                contactWhatsappId: from,
                direction: 'INCOMING',
                content: text,
                sentAt: new Date(ts),
            }).catch(console.error);

            // 调用 AI orchestrator 处理消息
            try {
                const reply = await handleInbound({
                    uid,
                    channel: 'WA',
                    from,
                    text,
                });

                // 如果有回复，发送消息
                if (reply) {
                    await this.send(uid, channelId, from, reply);
                    log(`[WhatsAppChannel] AI reply sent to ${from}`);
                }
            } catch (error) {
                console.error('[AI][WA] Error processing message:', error);
            }
        });

        // 错误事件
        this.connector.on('error', ({ uid, channelId, error }) => {
            log(`[WhatsAppChannel] Error: ${uid}:${channelId}`, error);
            this.io.to(uid).emit('wa.error', {
                channelId,
                error: error instanceof Error ? error.message : String(error)
            });
        });

        // 联系人更新事件
        this.connector.on('contacts.update', ({ uid, contacts }) => {
            log(`[WhatsAppChannel] Contacts updated for user ${uid}`);
            // 可以在这里同步联系人到数据库
        });

        // 群组更新事件
        this.connector.on('groups.update', ({ uid, groups }) => {
            log(`[WhatsAppChannel] Groups updated for user ${uid}`);
            // 可以在这里同步群组到数据库
        });
    }

    /**
     * 确保用户的 WhatsApp 连接已启动
     */
    async ensure(uid: string, channelId: string = 'default', name?: string): Promise<void> {
        if (!this.connector.isReady(uid, channelId)) {
            await this.connector.start(uid, channelId);
        }
    }

    /**
     * 发送消息
     */
    async send(uid: string, channelId: string = 'default', to: string, text: string): Promise<void> {
        await this.connector.send(uid, channelId, to, text);

        // 保存发送的消息到数据库
        await this.saveMessage(uid, channelId, {
            contactWhatsappId: to,
            direction: 'OUTGOING',
            content: text,
            sentAt: new Date(),
        });
    }

    /**
     * 停止用户的 WhatsApp 连接
     */
    async stop(uid: string, channelId: string = 'default'): Promise<void> {
        await this.connector.stop(uid, channelId);
        await this.upsertChannelSession(uid, channelId, 'closed');
    }

    /**
     * 检查用户是否已连接
     */
    isReady(uid: string, channelId: string = 'default'): boolean {
        return this.connector.isReady(uid, channelId);
    }

    /**
     * 获取 connector 实例（用于高级操作）
     */
    getConnector(): BaileysConnector {
        return this.connector;
    }

    /**
     * 更新或创建 ChannelSession 记录
     */
    private async upsertChannelSession(
        uid: string,
        channelId: string,
        state: string,
        extra?: { lastQRAt?: Date; lastConnected?: Date }
    ): Promise<void> {
        try {
            await prisma.channelSession.upsert({
                where: {
                    userId_channelId: {
                        userId: uid,
                        channelId,
                    },
                },
                update: {
                    state,
                    ...(extra?.lastQRAt && { lastQRAt: extra.lastQRAt }),
                    ...(extra?.lastConnected && { lastConnected: extra.lastConnected }),
                },
                create: {
                    userId: uid,
                    channelId,
                    channel: 'WA',
                    state,
                    ...(extra?.lastQRAt && { lastQRAt: extra.lastQRAt }),
                    ...(extra?.lastConnected && { lastConnected: extra.lastConnected }),
                },
            });
        } catch (err) {
            console.error(`Failed to upsert channel session: ${uid}:${channelId}`, err);
        }
    }

    /**
     * 保存消息到数据库
     */
    private async saveMessage(
        uid: string,
        channelId: string,
        data: {
            whatsappMessageId?: string;
            contactWhatsappId: string;
            direction: 'INCOMING' | 'OUTGOING';
            content: string;
            sentAt: Date;
        }
    ): Promise<void> {
        try {
            // 查找或创建联系人
            const contact = await prisma.contact.upsert({
                where: {
                    userId_whatsappId: {
                        userId: uid,
                        whatsappId: data.contactWhatsappId,
                    },
                },
                update: {},
                create: {
                    userId: uid,
                    whatsappId: data.contactWhatsappId,
                },
            });

            // 查找或创建聊天
            const chat = await prisma.chat.upsert({
                where: {
                    userId_contactId: {
                        userId: uid,
                        contactId: contact.id,
                    },
                },
                update: {
                    lastMessage: data.content,
                    lastMessageAt: data.sentAt,
                    ...(data.direction === 'INCOMING' && {
                        unreadCount: { increment: 1 },
                    }),
                },
                create: {
                    userId: uid,
                    contactId: contact.id,
                    lastMessage: data.content,
                    lastMessageAt: data.sentAt,
                    unreadCount: data.direction === 'INCOMING' ? 1 : 0,
                },
            });

            // 创建消息记录
            await prisma.message.create({
                data: {
                    userId: uid,
                    chatId: chat.id,
                    contactId: contact.id,
                    whatsappMessageId: data.whatsappMessageId,
                    direction: data.direction,
                    content: data.content,
                    sentAt: data.sentAt,
                    status: 'SENT',
                },
            });
        } catch (err) {
            console.error(`Failed to save message: ${uid}:${channelId}`, err);
        }
    }
}
