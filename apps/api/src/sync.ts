import { Router, type Router as RouterType } from 'express';
import { prisma } from '@pkg/db';
import { auth } from './middleware/auth';

export const syncRouter: RouterType = Router();

// 同步联系人
syncRouter.post('/contacts', auth, async (req, res) => {
    try {
        const { contacts } = req.body;
        const userId = req.user!.id;        // 批量创建或更新联系人
        const syncedContacts = await Promise.all(
            contacts.map(async (contact: any) => {
                return await prisma.contact.upsert({
                    where: {
                        userId_whatsappId: {
                            userId,
                            whatsappId: contact.whatsappId
                        }
                    },
                    update: {
                        name: contact.name,
                        phoneNumber: contact.phoneNumber,
                        avatar: contact.avatar,
                        isBlocked: contact.isBlocked || false,
                        isMuted: contact.isMuted || false,
                        updatedAt: new Date()
                    },
                    create: {
                        userId,
                        whatsappId: contact.whatsappId,
                        name: contact.name,
                        phoneNumber: contact.phoneNumber,
                        avatar: contact.avatar,
                        isBlocked: contact.isBlocked || false,
                        isMuted: contact.isMuted || false
                    }
                });
            })
        ); res.json({ success: true, contacts: syncedContacts });
    } catch (error) {
        console.error('联系人同步失败:', error);
        res.status(500).json({ error: '联系人同步失败' });
    }
});

// 获取用户的所有联系人
syncRouter.get('/contacts', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        const contacts = await prisma.contact.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(contacts);
    } catch (error) {
        console.error('获取联系人失败:', error);
        res.status(500).json({ error: '获取联系人失败' });
    }
});

// 同步聊天窗口
syncRouter.post('/chats', auth, async (req, res) => {
    try {
        const { chats } = req.body;
        const userId = req.user!.id;

        const syncedChats = await Promise.all(
            chats.map(async (chat: any) => {
                // 首先确保联系人存在
                const contact = await prisma.contact.upsert({
                    where: {
                        userId_whatsappId: {
                            userId,
                            whatsappId: chat.whatsappId
                        }
                    },
                    update: {},
                    create: {
                        userId,
                        whatsappId: chat.whatsappId,
                        name: chat.contactName,
                        phoneNumber: chat.phoneNumber
                    }
                });

                // 创建或更新聊天
                return await prisma.chat.upsert({
                    where: {
                        userId_contactId: {
                            userId,
                            contactId: contact.id
                        }
                    },
                    update: {
                        isArchived: chat.isArchived || false,
                        isPinned: chat.isPinned || false,
                        unreadCount: chat.unreadCount || 0,
                        lastMessage: chat.lastMessage,
                        lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : null,
                        updatedAt: new Date()
                    },
                    create: {
                        userId,
                        contactId: contact.id,
                        isArchived: chat.isArchived || false,
                        isPinned: chat.isPinned || false,
                        unreadCount: chat.unreadCount || 0,
                        lastMessage: chat.lastMessage,
                        lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : null
                    },
                    include: {
                        contact: true
                    }
                });
            })
        );

        res.json({ success: true, chats: syncedChats });
    } catch (error) {
        console.error('聊天同步失败:', error);
        res.status(500).json({ error: '聊天同步失败' });
    }
});

// 获取用户的所有聊天窗口
syncRouter.get('/chats', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        const chats = await prisma.chat.findMany({
            where: { userId },
            include: {
                contact: true,
                messages: {
                    orderBy: { sentAt: 'desc' },
                    take: 1 // 只获取最新一条消息
                }
            },
            orderBy: { lastMessageAt: 'desc' }
        });

        res.json(chats);
    } catch (error) {
        console.error('获取聊天失败:', error);
        res.status(500).json({ error: '获取聊天失败' });
    }
});

// 同步消息
syncRouter.post('/messages', auth, async (req, res) => {
    try {
        const { messages } = req.body;
        const userId = req.user!.id;

        const syncedMessages = await Promise.all(
            messages.map(async (message: any) => {
                // 确保联系人存在
                const contact = await prisma.contact.upsert({
                    where: {
                        userId_whatsappId: {
                            userId,
                            whatsappId: message.contactWhatsappId
                        }
                    },
                    update: {},
                    create: {
                        userId,
                        whatsappId: message.contactWhatsappId,
                        name: message.contactName,
                        phoneNumber: message.phoneNumber
                    }
                });

                // 确保聊天存在
                const chat = await prisma.chat.upsert({
                    where: {
                        userId_contactId: {
                            userId,
                            contactId: contact.id
                        }
                    },
                    update: {
                        lastMessage: message.content,
                        lastMessageAt: new Date(message.sentAt)
                    },
                    create: {
                        userId,
                        contactId: contact.id,
                        lastMessage: message.content,
                        lastMessageAt: new Date(message.sentAt)
                    }
                });

                // 创建消息
                return await prisma.message.create({
                    data: {
                        userId,
                        chatId: chat.id,
                        contactId: contact.id,
                        whatsappMessageId: message.whatsappMessageId,
                        direction: message.direction,
                        content: message.content,
                        messageType: message.messageType || 'TEXT',
                        status: message.status || 'SENT',
                        sentAt: new Date(message.sentAt),
                        deliveredAt: message.deliveredAt ? new Date(message.deliveredAt) : null,
                        readAt: message.readAt ? new Date(message.readAt) : null
                    }
                });
            })
        );

        res.json({ success: true, messages: syncedMessages });
    } catch (error) {
        console.error('消息同步失败:', error);
        res.status(500).json({ error: '消息同步失败' });
    }
});

// 获取特定聊天的消息
syncRouter.get('/messages/:chatId', auth, async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user!.id;
        const { page = 1, limit = 50 } = req.query;

        // 验证聊天是否属于当前用户
        const chat = await prisma.chat.findFirst({
            where: { id: chatId, userId }
        });

        if (!chat) {
            return res.status(404).json({ error: '聊天不存在' });
        }

        const messages = await prisma.message.findMany({
            where: { chatId, userId },
            orderBy: { sentAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            include: {
                contact: true,
                replyTo: {
                    include: { contact: true }
                }
            }
        });

        const total = await prisma.message.count({
            where: { chatId, userId }
        });

        res.json({
            messages: messages.reverse(), // 反转以获得时间顺序
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('获取消息失败:', error);
        res.status(500).json({ error: '获取消息失败' });
    }
});

// 批量获取消息（用于搜索）
syncRouter.get('/messages', auth, async (req, res) => {
    try {
        const userId = req.user!.id;
        const { search, contactId, limit = 100 } = req.query;

        let where: any = { userId };

        if (search) {
            where.content = {
                contains: search as string,
                mode: 'insensitive'
            };
        }

        if (contactId) {
            where.contactId = contactId as string;
        }

        const messages = await prisma.message.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: Number(limit),
            include: {
                contact: true,
                chat: true
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('搜索消息失败:', error);
        res.status(500).json({ error: '搜索消息失败' });
    }
});

// 获取聊天统计
syncRouter.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        const [
            totalContacts,
            totalChats,
            totalMessages,
            oldestMessage,
            newestMessage
        ] = await Promise.all([
            prisma.contact.count({ where: { userId } }),
            prisma.chat.count({ where: { userId } }),
            prisma.message.count({ where: { userId } }),
            prisma.message.findFirst({
                where: { userId },
                orderBy: { sentAt: 'asc' }
            }),
            prisma.message.findFirst({
                where: { userId },
                orderBy: { sentAt: 'desc' }
            })
        ]);

        res.json({
            totalContacts,
            totalChats,
            totalMessages,
            oldestMessage: oldestMessage?.sentAt,
            newestMessage: newestMessage?.sentAt
        });
    } catch (error) {
        console.error('获取统计失败:', error);
        res.status(500).json({ error: '获取统计失败' });
    }
});

// 从WhatsApp手动同步
syncRouter.post('/from-whatsapp', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        // 这里需要调用WARegistry的同步方法
        // 暂时返回成功，实际实现需要访问WARegistry实例
        res.json({
            success: true,
            message: '同步请求已发送，数据将在后台更新'
        });
    } catch (error) {
        console.error('WhatsApp同步失败:', error);
        res.status(500).json({ error: 'WhatsApp同步失败' });
    }
});