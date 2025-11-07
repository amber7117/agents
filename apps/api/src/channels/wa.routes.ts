import type { Express } from 'express';
import type { Server as SocketServer } from 'socket.io';
import { Router } from 'express';
import { WhatsAppChannel } from './whatsapp';
import { auth } from '../middleware/auth';
import { prisma } from '@pkg/db';

// 全局 WhatsApp 频道实例（避免重复实例化）
let waChannel: WhatsAppChannel | null = null;

/**
 * 获取 WhatsApp 频道实例
 */
function getWAChannel(io?: SocketServer): WhatsAppChannel {
    if (!waChannel && io) {
        waChannel = new WhatsAppChannel(io);
        waChannel.init().catch(console.error);
    }
    if (!waChannel) {
        throw new Error('WhatsApp channel not initialized');
    }
    return waChannel;
}

/**
 * 挂载 WhatsApp 路由
 * @param app - Express 应用实例
 * @param io - Socket.IO 服务器实例
 */
export function mountWARoutes(app: Express, io: SocketServer): void {
    const router = Router();

    // 初始化 WhatsApp 频道
    getWAChannel(io);

    /**
     * GET /channels/wa/list
     * 获取用户的所有 WhatsApp 频道列表
     */
    router.get('/list', auth, async (req, res) => {
        try {
            const uid = req.user?.id;
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const sessions = await prisma.channelSession.findMany({
                where: {
                    userId: uid,
                    channel: 'WA',
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });

            const wa = getWAChannel();
            const channels = sessions.map(session => ({
                channelId: session.channelId,
                name: session.name,
                phoneNumber: session.phoneNumber,
                state: session.state,
                isReady: wa.isReady(uid, session.channelId),
                lastConnected: session.lastConnected,
                createdAt: session.createdAt,
            }));

            res.json({ channels });
        } catch (err) {
            console.error('Failed to list WA channels:', err);
            res.status(500).json({
                error: 'Failed to list channels',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    });

    /**
     * GET /channels/wa/status
     * 获取 WhatsApp 会话状态
     * Query: ?channelId=default
     */
    router.get('/status', auth, async (req, res) => {
        try {
            const uid = req.user?.id;
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const channelId = (req.query.channelId as string) || 'default';

            // 从数据库读取会话状态
            const session = await prisma.channelSession.findUnique({
                where: {
                    userId_channelId: {
                        userId: uid,
                        channelId,
                    },
                },
            });

            // 如果没有记录，返回默认状态
            if (!session) {
                return res.json({
                    channelId,
                    state: 'waiting_qr',
                    isReady: false,
                });
            }

            const wa = getWAChannel();
            const isReady = wa.isReady(uid, channelId);

            res.json({
                channelId,
                state: session.state,
                deviceLabel: session.deviceLabel,
                phoneNumber: session.phoneNumber,
                name: session.name,
                lastQRAt: session.lastQRAt,
                lastConnected: session.lastConnected,
                isReady,
                updatedAt: session.updatedAt,
            });
        } catch (err) {
            console.error('Failed to get WA status:', err);
            res.status(500).json({
                error: 'Failed to get status',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    });

    /**
     * POST /channels/wa/start
     * 启动 WhatsApp 连接
     * Body: { channelId?: string, name?: string }
     */
    router.post('/start', auth, async (req, res) => {
        try {
            const uid = req.user?.id;
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { channelId = 'default', name } = req.body;

            const wa = getWAChannel();
            await wa.ensure(uid, channelId, name);

            res.json({ ok: true, channelId });
        } catch (err) {
            console.error('Failed to start WA:', err);
            res.status(500).json({
                error: 'Failed to start connection',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    });

    /**
     * POST /channels/wa/stop
     * 停止 WhatsApp 连接
     * Body: { channelId?: string }
     */
    router.post('/stop', auth, async (req, res) => {
        try {
            const uid = req.user?.id;
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { channelId = 'default' } = req.body;

            const wa = getWAChannel();
            await wa.stop(uid, channelId);

            res.json({ ok: true, channelId });
        } catch (err) {
            console.error('Failed to stop WA:', err);
            res.status(500).json({
                error: 'Failed to stop connection',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    });

    /**
     * POST /channels/wa/send
     * 发送 WhatsApp 消息
     * Body: { channelId?: string, to: string, text: string }
     */
    router.post('/send', auth, async (req, res) => {
        try {
            const uid = req.user?.id;
            if (!uid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { channelId = 'default', to, text } = req.body;

            // 验证参数
            if (!to || !text) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'Both "to" and "text" are required',
                });
            }

            if (typeof to !== 'string' || typeof text !== 'string') {
                return res.status(400).json({
                    error: 'Invalid field types',
                    message: 'Both "to" and "text" must be strings',
                });
            }

            const wa = getWAChannel();

            // 检查是否已连接
            if (!wa.isReady(uid, channelId)) {
                return res.status(400).json({
                    error: 'Not connected',
                    message: 'WhatsApp is not connected. Please connect first.',
                });
            }

            await wa.send(uid, channelId, to, text);

            res.json({
                ok: true,
                message: 'Message sent successfully',
            });
        } catch (err) {
            console.error('Failed to send WA message:', err);
            res.status(500).json({
                error: 'Failed to send message',
                message: err instanceof Error ? err.message : String(err),
            });
        }
    });

    // 挂载路由
    app.use('/channels/wa', router);
}

/**
 * 导出 getWAChannel 供其他模块使用
 */
export { getWAChannel };
