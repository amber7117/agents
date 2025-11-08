import { webcrypto } from 'node:crypto';
import * as Baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Server } from 'socket.io';
import { log } from '../utils/logger';
import { prisma, Channel, MessageDirection, MessageType, MessageStatus } from '@pkg/db';
import { makeDbAuthState } from './db-auth-store';

// Polyfill for crypto in Node.js environment
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

const { makeWASocket, Browsers, DisconnectReason, fetchLatestBaileysVersion } = Baileys;
type WASocket = Baileys.WASocket;

const ROOT = path.resolve(process.cwd(), 'apps/api/wa-auth');
await fs.mkdir(ROOT, { recursive: true });

export class WARegistry {
    private sockets: Map<string, WASocket> = new Map();
    private connectionAttempts: Map<string, number> = new Map();
    private maxConnectionAttempts = 3;
    private reconnectDelay = 5000; // 5秒重连延迟
    constructor(private io: Server) { }

    async startForUser(uid: string, channelId: string = 'default'): Promise<WASocket> {
        const sessionKey = `${uid}:${channelId}`;

        // Use database auth state instead of file-based
        log(`[WARegistry] Starting session with DATABASE auth: ${sessionKey}`);
        const { state, saveCreds } = await makeDbAuthState(channelId, uid);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: Baileys.makeCacheableSignalKeyStore(state.keys, undefined as any)
            },
            printQRInTerminal: false,
            browser: Browsers.macOS('Desktop'), // Desktop for full history sync
            getMessage: async (key) => {
                // TODO: Implement getMessage to fetch from database
                log(`[WARegistry] getMessage requested for ${key.remoteJid}`);
                return undefined;
            },
            syncFullHistory: true, // Enable full history sync
            markOnlineOnConnect: true,
            shouldSyncHistoryMessage: () => true, // Process all history messages
        });

        // Listen to creds.update and save to database
        sock.ev.on('creds.update', saveCreds);

        // Listen to history sync (automatic after login)
        sock.ev.on('messaging-history.set', async ({ chats, contacts, messages, syncType }) => {
            log(`[WARegistry] History sync received for ${sessionKey}:`, {
                chats: chats.length,
                contacts: contacts.length,
                messages: messages.length,
                syncType
            });

            // Save contacts to database
            for (const contact of contacts) {
                await this.saveContactToDatabase(uid, contact).catch(console.error);
            }

            // Save chats to database
            for (const chat of chats) {
                await this.saveChatToDatabase(uid, chat).catch(console.error);
            }

            // Save historical messages to database
            for (const msg of messages) {
                if (!msg.key.remoteJid) continue;

                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
                if (text) {
                    await this.saveMessageToDatabase(uid, {
                        whatsappMessageId: msg.key.id || '',
                        contactWhatsappId: msg.key.remoteJid,
                        direction: msg.key.fromMe ? 'OUTGOING' : 'INCOMING',
                        content: text,
                        sentAt: new Date(msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now())
                    }).catch(console.error);
                }
            }

            // Notify frontend
            this.io.to(uid).emit('wa.history-synced', {
                chatsCount: chats.length,
                contactsCount: contacts.length,
                messagesCount: messages.length
            });
        });

        sock.ev.on('connection.update', (u) => {
            const { connection, lastDisconnect, qr } = u as any;
            if (qr) {
                // tell this user's room the QR
                this.io.to(uid).emit('wa.qr', { qr });
            }
            if (connection === 'open') {
                log(`WA connected for ${uid}`);
                this.io.to(uid).emit('wa.ready');
                // 重置连接尝试次数
                this.connectionAttempts.set(uid, 0);

                // 连接成功后自动同步联系人和聊天
                this.syncContactsAndChats(uid, sock).catch(console.error);
            }
            if (connection === 'close') {
                const reason = new Boom((lastDisconnect as any)?.error)?.output?.statusCode;
                log('WA closed', reason);
                if (reason !== DisconnectReason.loggedOut) {
                    // 限制重连频率
                    const attempts = this.connectionAttempts.get(uid) || 0;
                    if (attempts < this.maxConnectionAttempts) {
                        this.connectionAttempts.set(uid, attempts + 1);
                        log(`Reconnecting attempt ${attempts + 1} for ${uid} in ${this.reconnectDelay}ms`);
                        setTimeout(() => this.startForUser(uid), this.reconnectDelay);
                    } else {
                        log(`Max connection attempts (${this.maxConnectionAttempts}) reached for ${uid}, stopping auto-reconnect`);
                    }
                }
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages?.[0];
            if (!msg || !msg.key.remoteJid) return;

            // 检查消息是否来自自己（自己发送的消息）
            if (msg.key.fromMe) {
                // 自己发送的消息，不转发到前端（前端已经显示）
                return;
            }

            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

            // 保存消息到数据库
            await this.saveMessageToDatabase(uid, {
                whatsappMessageId: msg.key.id || '',
                contactWhatsappId: from,
                direction: 'INCOMING',
                content: text,
                sentAt: new Date(msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now())
            }).catch(console.error);

            // forward to UI - 只转发来自对方的消息
            this.io.to(uid).emit('wa.message', { from, text, ts: Date.now() });
        });

        // 监听消息状态更新（送达、已读）
        sock.ev.on('message-receipt.update', async (updates) => {
            for (const update of updates) {
                const { key, receipt } = update;
                if (key.remoteJid && key.id) {
                    // 使用类型断言解决TypeScript类型问题
                    const receiptType = (receipt as any).type;
                    if (receiptType) {
                        await this.updateMessageStatus(uid, key.id, receiptType);
                    }
                }
            }
        });

        // 监听联系人最后上线时间
        sock.ev.on('presence.update', async (update) => {
            const { id, presences } = update;
            if (id && presences) {
                const presence = presences[id];
                if (presence && presence.lastKnownPresence === 'available') {
                    await this.updateContactLastSeen(uid, id, new Date());
                }
            }
        });

        this.sockets.set(uid, sock);
        return sock;
    }

    async send(uid: string, to: string, text: string) {
        const sock = this.sockets.get(uid) || (await this.startForUser(uid));
        await sock.sendMessage(to, { text });

        // 保存发送的消息到数据库
        await this.saveMessageToDatabase(uid, {
            whatsappMessageId: '',
            contactWhatsappId: to,
            direction: 'OUTGOING',
            content: text,
            sentAt: new Date()
        }).catch(console.error);
    }

    // 同步联系人和聊天到数据库
    async syncContactsAndChats(uid: string, sock: WASocket) {
        try {
            log(`Starting sync for user ${uid}`);

            // 使用Baileys的store来获取联系人和聊天
            // 注意：这需要在实际的WhatsApp连接建立后才能获取到数据

            // 由于Baileys不直接提供联系人列表API，我们将依赖消息事件来收集联系人信息
            // 这里先创建一个基础的同步框架

            log(`Sync framework initialized for user ${uid}`);
        } catch (error) {
            console.error(`Sync failed for user ${uid}:`, error);
        }
    }    // 保存联系人到数据库
    async saveContactToDatabase(uid: string, contact: any) {
        try {
            const whatsappId = contact.id || contact.jid;
            if (!whatsappId) return;

            await prisma.contact.upsert({
                where: {
                    userId_whatsappId: {
                        userId: uid,
                        whatsappId
                    }
                },
                update: {
                    name: contact.name || contact.pushName || contact.verifiedName,
                    phoneNumber: this.formatPhoneNumber(whatsappId),
                    avatar: contact.profilePictureUrl,
                    updatedAt: new Date()
                },
                create: {
                    userId: uid,
                    whatsappId,
                    name: contact.name || contact.pushName || contact.verifiedName,
                    phoneNumber: this.formatPhoneNumber(whatsappId),
                    avatar: contact.profilePictureUrl
                }
            });
        } catch (error) {
            console.error('保存联系人失败:', error);
        }
    }

    // 保存聊天到数据库
    async saveChatToDatabase(uid: string, chat: any) {
        try {
            const whatsappId = chat.id;
            if (!whatsappId) return;

            // 确保联系人存在
            const contact = await prisma.contact.upsert({
                where: {
                    userId_whatsappId: {
                        userId: uid,
                        whatsappId
                    }
                },
                update: {},
                create: {
                    userId: uid,
                    whatsappId,
                    phoneNumber: this.formatPhoneNumber(whatsappId)
                }
            });

            // 创建或更新聊天
            await prisma.chat.upsert({
                where: {
                    userId_contactId: {
                        userId: uid,
                        contactId: contact.id
                    }
                },
                update: {
                    unreadCount: chat.unreadCount || 0,
                    isArchived: chat.archived || false,
                    isPinned: chat.pinned || false,
                    lastMessageAt: chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000) : null,
                    updatedAt: new Date()
                },
                create: {
                    userId: uid,
                    contactId: contact.id,
                    unreadCount: chat.unreadCount || 0,
                    isArchived: chat.archived || false,
                    isPinned: chat.pinned || false,
                    lastMessageAt: chat.conversationTimestamp ? new Date(chat.conversationTimestamp * 1000) : null
                }
            });
        } catch (error) {
            console.error('保存聊天失败:', error);
        }
    }

    // 保存消息到数据库
    async saveMessageToDatabase(uid: string, messageData: {
        whatsappMessageId: string;
        contactWhatsappId: string; // 完整的 JID 格式
        direction: 'INCOMING' | 'OUTGOING';
        content: string;
        sentAt: Date;
    }) {
        try {
            // 保留完整的 JID 格式（如 "+60123456789@s.whatsapp.net"）
            const fullJid = messageData.contactWhatsappId;

            // 确保联系人存在，使用完整的 JID
            const contact = await prisma.contact.upsert({
                where: {
                    userId_whatsappId: {
                        userId: uid,
                        whatsappId: fullJid
                    }
                },
                update: {
                    lastSeen: new Date()
                },
                create: {
                    userId: uid,
                    whatsappId: fullJid, // 保留完整 JID
                    phoneNumber: this.extractPhoneFromJid(fullJid) // 提取纯手机号用于显示
                }
            });

            // 确保聊天存在
            const chat = await prisma.chat.upsert({
                where: {
                    userId_contactId: {
                        userId: uid,
                        contactId: contact.id
                    }
                },
                update: {
                    lastMessage: messageData.content,
                    lastMessageAt: messageData.sentAt,
                    updatedAt: new Date()
                },
                create: {
                    userId: uid,
                    contactId: contact.id,
                    lastMessage: messageData.content,
                    lastMessageAt: messageData.sentAt
                }
            });

            // 创建消息，添加 channel 字段
            await prisma.message.create({
                data: {
                    userId: uid,
                    chatId: chat.id,
                    contactId: contact.id,
                    whatsappMessageId: messageData.whatsappMessageId,
                    direction: messageData.direction,
                    content: messageData.content,
                    sentAt: messageData.sentAt,
                    channel: 'WA', // ✅ 标记消息来源为 WhatsApp
                    status: 'SENT'
                }
            });
        } catch (error) {
            console.error('保存消息失败:', error);
        }
    }

    /**
     * 从 WhatsApp JID 中提取纯手机号用于显示
     * 例如: "60123456789@s.whatsapp.net" -> "+60 123 456789"
     */
    private extractPhoneFromJid(jid: string): string | null {
        try {
            const phoneNumber = jid.split('@')[0];

            // 如果已经有 + 号，移除它
            const cleanPhone = phoneNumber.replace(/^\+/, '');

            // 格式化显示（如果号码够长）
            if (cleanPhone && cleanPhone.length > 10) {
                return `+${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
            }

            // 太短的号码直接加 + 返回
            return `+${cleanPhone}`;
        } catch {
            return null;
        }
    }

    // 保留原有的 formatPhoneNumber 方法以保持向后兼容
    private formatPhoneNumber(whatsappId: string): string | null {
        return this.extractPhoneFromJid(whatsappId);
    }

    // 更新消息状态（送达、已读）
    private async updateMessageStatus(uid: string, whatsappMessageId: string, receiptType: string) {
        try {
            let status: 'DELIVERED' | 'READ' = 'DELIVERED';
            let updateData: any = { status: 'DELIVERED' };

            if (receiptType === 'read') {
                status = 'READ';
                updateData = {
                    status: 'READ',
                    readAt: new Date()
                };
            } else if (receiptType === 'delivered') {
                updateData = {
                    status: 'DELIVERED',
                    deliveredAt: new Date()
                };
            }

            // 更新消息状态
            await prisma.message.updateMany({
                where: {
                    userId: uid,
                    whatsappMessageId: whatsappMessageId
                },
                data: updateData
            });

            // 通知前端消息状态更新
            this.io.to(uid).emit('wa.message.status', {
                whatsappMessageId,
                status
            });

            log(`Message ${whatsappMessageId} status updated to ${status} for user ${uid}`);
        } catch (error) {
            console.error('更新消息状态失败:', error);
        }
    }

    // 更新联系人最后上线时间
    private async updateContactLastSeen(uid: string, whatsappId: string, lastSeen: Date) {
        try {
            // 先查找联系人
            const contact = await prisma.contact.findFirst({
                where: {
                    userId: uid,
                    whatsappId: whatsappId
                }
            });

            if (contact) {
                // 更新最后上线时间
                await prisma.contact.update({
                    where: {
                        id: contact.id
                    },
                    data: {
                        lastSeen: lastSeen
                    }
                });

                // 通知前端联系人最后上线时间更新
                this.io.to(uid).emit('wa.contact.lastSeen', {
                    whatsappId,
                    lastSeen: lastSeen.getTime()
                });

                log(`Contact ${whatsappId} last seen updated to ${lastSeen} for user ${uid}`);
            }
        } catch (error) {
            console.error('更新联系人最后上线时间失败:', error);
        }
    }

    // 改进的发送消息方法，包含消息状态跟踪
    async sendWithStatus(uid: string, to: string, text: string) {
        const sock = this.sockets.get(uid) || (await this.startForUser(uid));

        // 生成临时消息ID用于跟踪
        const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 先保存消息到数据库（状态为SENT）
        const message = await prisma.message.create({
            data: {
                userId: uid,
                chatId: '', // 需要先获取或创建聊天
                contactId: '', // 需要先获取或创建联系人
                whatsappMessageId: tempMessageId,
                direction: 'OUTGOING',
                content: text,
                status: 'SENT',
                sentAt: new Date()
            }
        });

        try {
            // 发送消息
            const result = await sock.sendMessage(to, { text });

            // 获取WhatsApp返回的真实消息ID
            const realMessageId = result?.key?.id;

            if (realMessageId) {
                // 更新消息的WhatsApp消息ID
                await prisma.message.update({
                    where: { id: message.id },
                    data: {
                        whatsappMessageId: realMessageId,
                        status: 'SENT'
                    }
                });

                // 通知前端消息已发送
                this.io.to(uid).emit('wa.message.status', {
                    whatsappMessageId: realMessageId,
                    status: 'SENT'
                });
            }

            return message;
        } catch (error) {
            console.error('发送消息失败:', error);

            // 更新消息状态为失败
            await prisma.message.update({
                where: { id: message.id },
                data: { status: 'FAILED' }
            });

            throw error;
        }
    }
}
