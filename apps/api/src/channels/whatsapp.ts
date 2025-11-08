import type { Server as SocketServer } from 'socket.io';
import { prisma, ChannelState, Channel, MessageDirection, MessageType, MessageStatus } from '@pkg/db';
import { log } from '../utils/logger';
import { handleInbound } from '../ai/orchestrator';
import { sessionManager } from '../wa/SessionManager';

/**
 * WhatsApp 胶水层
 * 连接 SessionManager 和 Socket.IO，同时更新数据库
 */
export class WhatsAppChannel {
    private io: SocketServer;

    constructor(io: SocketServer) {
        this.io = io;
        this.setupEventListeners();
    }

    /**
     * 初始化会话管理器，恢复所有活跃会话
     */
    async init(): Promise<void> {
        // 从数据库恢复所有 "open" 状态的会话

        const sessions = await prisma.channelSession.findMany({
            where: {
                channel: Channel.WA,
                state: {
                    in: [ChannelState.OPEN, ChannelState.WAITING_QR],
                },
            },
        });

        log(`[WhatsAppChannel] Recovering ${sessions.length} sessions`);

        for (const session of sessions) {
            try {
                await sessionManager.ensureRunning({
                    channelId: session.channelId,
                    userId: session.userId,
                    name: session.name || undefined,
                });
                log(`[WhatsAppChannel] Recovered session: ${session.channelId}`);
            } catch (error) {
                console.error(`[WhatsAppChannel] Failed to recover session ${session.channelId}:`, error);
            }
        }

        log('[WhatsAppChannel] Initialized');
    }



    /**
     * 设置事件监听器，将 SessionManager 事件映射到 Socket.IO 事件
     */
    private setupEventListeners(): void {
        // QR 码事件
        sessionManager.on('qr', (data: { channelId: string; qr: string }) => {
            log(`[WhatsAppChannel] QR generated: ${data.channelId}`);
            console.log(`📱 [WhatsAppChannel] QR code received for channel: ${data.channelId}`);
            console.log(`📱 [WhatsAppChannel] QR code length: ${data.qr?.length || 0}`);

            // 先尝试从 SessionManager 获取 userId（因为此时数据库可能还没有记录）
            const sessionInfo = sessionManager.getSessionInfo(data.channelId);
            const userId = sessionInfo?.userId;

            if (userId) {
                console.log(`✅ [WhatsAppChannel] Found userId from SessionManager: ${userId}`);

                // 检查 Socket.IO 房间中的连接
                this.io.in(userId).fetchSockets().then(sockets => {
                    console.log(`🔌 [WhatsAppChannel] Sockets in room '${userId}': ${sockets.length}`);
                    sockets.forEach((socket, idx) => {
                        console.log(`   Socket ${idx + 1}: ${socket.id}`);
                    });
                });

                console.log(`📤 [WhatsAppChannel] Emitting wa.qr to room: ${userId}`);
                console.log(`📤 [WhatsAppChannel] QR data preview: ${data.qr.substring(0, 50)}...`);

                this.io.to(userId).emit('wa.qr', { channelId: data.channelId, qr: data.qr });

                // 创建或更新数据库会话状态（waiting_qr）
                // 这样可以让前端显示等待扫码的状态，并在后续查询时找到 userId
                this.upsertChannelSession(userId, data.channelId, ChannelState.WAITING_QR, {
                    lastQRAt: new Date(),
                    name: sessionInfo?.name
                }).catch(console.error);
            } else {
                console.error(`❌ [WhatsAppChannel] No userId found for channel: ${data.channelId}`);
                // 如果找不到 userId，尝试从数据库查找
                this.getUserIdForChannel(data.channelId).then(dbUserId => {
                    if (dbUserId) {
                        console.log(`✅ [WhatsAppChannel] Found userId from database: ${dbUserId}`);
                        this.io.to(dbUserId).emit('wa.qr', { channelId: data.channelId, qr: data.qr });
                    } else {
                        console.error(`❌ [WhatsAppChannel] Cannot emit QR - no userId found in SessionManager or database`);
                    }
                }).catch(console.error);
            }
        });

        // 连接就绪事件
        sessionManager.on('ready', (data: { channelId: string; phoneNumber?: string }) => {
            log(`[WhatsAppChannel] Ready: ${data.channelId}, phone: ${data.phoneNumber}`);

            this.getUserIdForChannel(data.channelId).then(async userId => {
                if (userId) {
                    this.io.to(userId).emit('wa.ready', { channelId: data.channelId, phoneNumber: data.phoneNumber });

                    // 发送连接完成事件，通知前端同步聊天记录和联系人
                    this.io.to(userId).emit('wa.connected', { channelId: data.channelId, phoneNumber: data.phoneNumber });
                    log(`[WhatsAppChannel] Emitted wa.connected event for sync trigger`);

                    // ✅ 重要：只在连接成功后才创建/更新数据库记录
                    // 这样可以确保数据库中只有真正连接成功的频道
                    // 获取 session name（如果有的话）
                    const sessionName = await this.getSessionName(data.channelId);

                    await this.upsertChannelSession(userId, data.channelId, ChannelState.OPEN, {
                        lastConnected: new Date(),
                        phoneNumber: data.phoneNumber,
                        name: sessionName
                    }).catch(console.error);
                }
            }).catch(console.error);
        });

        // 状态变化事件
        sessionManager.on('status', (data: { channelId: string; state: string }) => {
            log(`[WhatsAppChannel] Status ${data.state}: ${data.channelId}`);

            this.getUserIdForChannel(data.channelId).then(userId => {
                if (userId) {
                    this.io.to(userId).emit('wa.status', { channelId: data.channelId, state: data.state });

                    // 更新数据库会话状态
                    this.upsertChannelSession(userId, data.channelId, data.state as ChannelState).catch(console.error);
                }
            }).catch(console.error);
        });

        // 消息接收事件
        sessionManager.on('message', (data: { channelId: string; from: string; text: string; ts: number; messageId?: string }) => {
            log(`[WhatsAppChannel] Message: ${data.channelId} from ${data.from}`);
            console.log(`📥 [WhatsAppChannel] Received message:`, {
                channelId: data.channelId,
                from: data.from,
                text: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''),
                ts: data.ts
            });

            this.getUserIdForChannel(data.channelId).then(async userId => {
                if (!userId) return;

                // 检查 Socket.IO 房间
                const socketsInRoom = await this.io.in(userId).fetchSockets();
                console.log(`🔌 [WhatsAppChannel] Sockets in room '${userId}':`, socketsInRoom.length);

                // 先向前端发送消息事件（保留原有事件）
                console.log(`📤 [WhatsAppChannel] Emitting wa.message to room '${userId}'`);
                this.io.to(userId).emit('wa.message', { channelId: data.channelId, from: data.from, text: data.text, ts: data.ts });

                // 同时发送统一的 chat.message 事件
                console.log(`📤 [WhatsAppChannel] Emitting chat.message to room '${userId}'`);
                this.io.to(userId).emit('chat.message', {
                    channel: 'WA',
                    from: data.from,
                    text: data.text,
                    ts: data.ts,
                    direction: 'in',
                    channelId: data.channelId
                });

                // 保存消息到数据库
                await this.saveMessage(userId, data.channelId, {
                    whatsappMessageId: data.messageId,
                    contactWhatsappId: data.from,
                    direction: 'INCOMING',
                    content: data.text,
                    sentAt: new Date(data.ts),
                }).catch(console.error);

                // 保存消息日志
                await this.saveMessageLog(userId, 'WA', 'INCOMING', data.from, data.text, false).catch(console.error);

                // 调用 AI orchestrator 处理消息
                try {
                    const reply = await handleInbound({
                        uid: userId,
                        channel: 'WA',
                        from: data.from,
                        text: data.text,
                    });

                    // 如果有回复，发送消息
                    if (reply) {
                        await this.send(userId, data.channelId, data.from, reply);
                        log(`[WhatsAppChannel] AI reply sent to ${data.from}`);

                        // 保存 AI 回复的消息日志
                        await this.saveMessageLog(userId, 'WA', 'OUTGOING', data.from, reply, true).catch(console.error);
                    }
                } catch (error) {
                    console.error('[AI][WA] Error processing message:', error);
                }
            }).catch(console.error);
        });

        // 错误事件
        sessionManager.on('error', (data: { channelId: string; error: string }) => {
            log(`[WhatsAppChannel] Error: ${data.channelId}`, data.error);

            this.getUserIdForChannel(data.channelId).then(userId => {
                if (userId) {
                    this.io.to(userId).emit('wa.error', {
                        channelId: data.channelId,
                        error: data.error
                    });
                }
            }).catch(console.error);
        });

        // 会话停止事件
        sessionManager.on('stopped', (data: { channelId: string }) => {
            log(`[WhatsAppChannel] Stopped: ${data.channelId}`);

            this.getUserIdForChannel(data.channelId).then(userId => {
                if (userId) {
                    this.io.to(userId).emit('wa.stopped', { channelId: data.channelId });
                    this.upsertChannelSession(userId, data.channelId, ChannelState.DISCONNECTED).catch(console.error);
                }
            }).catch(console.error);
        });
    }    /**
     * 从数据库获取 channelId 对应的 userId
     */
    private async getUserIdForChannel(channelId: string): Promise<string | null> {
        const session = await prisma.channelSession.findFirst({
            where: { channelId },
            select: { userId: true },
        });
        return session?.userId || null;
    }

    /**
     * 从 SessionManager 获取 session 的名称
     */
    private async getSessionName(channelId: string): Promise<string | undefined> {
        const sessionInfo = sessionManager.getSessionInfo(channelId);
        return sessionInfo?.name;
    }

    /**
     * 确保用户的 WhatsApp 连接已启动
     * 注意：不在这里创建数据库记录，只有在连接成功后（ready 事件）才创建
     */
    async ensure(uid: string, channelId: string = 'default', name?: string): Promise<void> {
        console.log(`🔍 [WhatsAppChannel] Checking if ${channelId} is ready...`);
        const isReady = sessionManager.isSessionReady(channelId);
        console.log(`📊 [WhatsAppChannel] Session ready:`, isReady);

        if (!isReady) {
            console.log(`🚀 [WhatsAppChannel] Starting session for ${channelId}...`);
            // ensureRunning 需要传入对象参数
            await sessionManager.ensureRunning({ channelId, userId: uid, name });
            console.log(`✅ [WhatsAppChannel] Session started for ${channelId}`);

            // ❌ 不在这里创建数据库记录！
            // 只有在 'ready' 事件中连接成功后才创建 ChannelSession 记录
            // 这样可以避免失败连接留下孤立的数据库记录
        } else {
            console.log(`ℹ️ [WhatsAppChannel] Already connected for ${channelId}`);
        }
    }    /**
     * 发送消息
     */
    async send(uid: string, channelId: string = 'default', to: string, text: string, aiUsed: boolean = false): Promise<void> {
        await sessionManager.sendMessage(channelId, to, text);

        // 保存发送的消息到数据库
        await this.saveMessage(uid, channelId, {
            contactWhatsappId: to,
            direction: 'OUTGOING',
            content: text,
            sentAt: new Date(),
        });

        // 保存消息日志（如果不是 AI 发送的话，需要单独记录）
        if (!aiUsed) {
            await this.saveMessageLog(uid, 'WA', 'OUTGOING', to, text, false);
        }
    }

    /**
     * 停止用户的 WhatsApp 连接
     */
    async stop(uid: string, channelId: string = 'default'): Promise<void> {
        await sessionManager.stop(channelId);
        await this.upsertChannelSession(uid, channelId, ChannelState.DISCONNECTED);
    }

    /**
     * 检查用户是否已连接
     */
    isReady(uid: string, channelId: string = 'default'): boolean {
        return sessionManager.isSessionReady(channelId);
    }

    /**
     * 删除聊天（从 WhatsApp 和本地数据库）
     */
    async deleteChat(uid: string, channelId: string = 'default', chatId: string): Promise<void> {
        // 调用 SessionManager 删除 WhatsApp 聊天
        await sessionManager.deleteChat(channelId, chatId);

        // 从本地数据库删除
        await this.deleteLocalChat(uid, chatId);
    }

    /**
     * 归档聊天
     */
    async archiveChat(uid: string, channelId: string = 'default', chatId: string, archive: boolean = true): Promise<void> {
        await sessionManager.archiveChat(channelId, chatId, archive);
    }

    /**
     * 从本地数据库删除聊天记录
     */
    async deleteLocalChat(uid: string, contactWhatsappId: string): Promise<void> {
        try {
            // 查找联系人
            const contact = await prisma.contact.findFirst({
                where: {
                    userId: uid,
                    whatsappId: contactWhatsappId,
                },
                include: {
                    chats: true,
                },
            });

            if (!contact) {
                console.log(`[WhatsAppChannel] No contact found for ${contactWhatsappId}`);
                return;
            }

            // 删除所有相关的消息
            await prisma.message.deleteMany({
                where: {
                    chat: {
                        contactId: contact.id,
                    },
                },
            });

            // 删除聊天记录
            await prisma.chat.deleteMany({
                where: {
                    contactId: contact.id,
                },
            });

            // 可选：删除联系人本身
            await prisma.contact.delete({
                where: {
                    id: contact.id,
                },
            });

            console.log(`[WhatsAppChannel] Deleted local chat for ${contactWhatsappId}`);
        } catch (error) {
            console.error(`[WhatsAppChannel] Error deleting local chat:`, error);
            throw error;
        }
    }

    /**
     * 更新或创建 ChannelSession 记录
     */
    private async upsertChannelSession(
        uid: string,
        channelId: string,
        state: ChannelState,
        extra?: { lastQRAt?: Date; lastConnected?: Date; phoneNumber?: string; name?: string }
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
                    ...(extra?.phoneNumber && { phoneNumber: extra.phoneNumber }),
                    ...(extra?.name && { name: extra.name }),
                },
                create: {
                    userId: uid,
                    channelId,
                    channel: Channel.WA,
                    state,
                    ...(extra?.lastQRAt && { lastQRAt: extra.lastQRAt }),
                    ...(extra?.lastConnected && { lastConnected: extra.lastConnected }),
                    ...(extra?.phoneNumber && { phoneNumber: extra.phoneNumber }),
                    ...(extra?.name && { name: extra.name }),
                },
            });
        } catch (err) {
            console.error(`Failed to upsert channel session: ${uid}:${channelId}`, err);
        }
    }

    /**
     * 保存消息到数据库
     * contactWhatsappId 可以是完整的 JID 格式，如 "60123456789@s.whatsapp.net" 或 "+60123456789@s.whatsapp.net"
     */
    private async saveMessage(
        uid: string,
        channelId: string,
        data: {
            whatsappMessageId?: string;
            contactWhatsappId: string; // 完整的 WhatsApp JID
            direction: 'INCOMING' | 'OUTGOING';
            content: string;
            sentAt: Date;
        }
    ): Promise<void> {
        try {
            // 保留完整的 JID 格式（包括 @s.whatsapp.net）
            // 这样可以保留手机号的完整信息，包括国家代码
            const fullJid = data.contactWhatsappId;

            console.log(`💾 [WhatsAppChannel] Saving message from/to: ${fullJid}`);

            // 查找或创建联系人（使用完整的 JID）
            const contact = await prisma.contact.upsert({
                where: {
                    userId_whatsappId: {
                        userId: uid,
                        whatsappId: fullJid,
                    },
                },
                update: {
                    // 如果联系人已存在，可以更新 lastSeen
                    lastSeen: new Date(),
                },
                create: {
                    userId: uid,
                    whatsappId: fullJid,
                    // 尝试从 JID 中提取电话号码
                    phoneNumber: this.extractPhoneFromJid(fullJid),
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

            // 创建消息记录，添加 channel 字段
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
                    channel: 'WA',
                },
            });

            console.log(`✅ [WhatsAppChannel] Message saved successfully`);
        } catch (err) {
            console.error(`Failed to save message: ${uid}:${channelId}`, err);
            console.error(`Error details:`, err);
        }
    }

    /**
     * 从 WhatsApp JID 中提取电话号码
     * 例如: "60123456789@s.whatsapp.net" -> "+60123456789"
     * 或者: "1234567890@s.whatsapp.net" -> "+1234567890"
     */
    private extractPhoneFromJid(jid: string): string | null {
        try {
            // 移除 @s.whatsapp.net 部分
            const phone = jid.split('@')[0];

            // 如果已经有 + 号，直接返回
            if (phone.startsWith('+')) {
                return phone;
            }

            // 添加 + 号
            return `+${phone}`;
        } catch (err) {
            console.error(`Failed to extract phone from JID: ${jid}`, err);
            return null;
        }
    }

    /**
     * 保存消息日志到 MessageLog 表
     */
    private async saveMessageLog(
        uid: string,
        channel: 'WA' | 'TG' | 'WEB',
        direction: 'INCOMING' | 'OUTGOING',
        peer: string,
        text: string,
        aiUsed: boolean
    ): Promise<void> {
        try {
            await prisma.messageLog.create({
                data: {
                    userId: uid,
                    channel,
                    direction,
                    peer,
                    content: text, // 改为 content 字段
                    messageType: 'TEXT',
                },
            });
            log(`[WhatsAppChannel] Message log saved: ${uid} ${direction} ${peer}`);
        } catch (err) {
            console.error(`Failed to save message log: ${uid}`, err);
        }
    }
}
