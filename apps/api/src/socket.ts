import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { getWAChannel } from './channels/wa.routes';
import { initWidgetNamespace, visitorToSocket, sendToVisitor } from './widget/ns';
import { prisma } from '@pkg/db';

export function initIO(httpServer: HTTPServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin, credentials: true },
    });

    // JWT 认证中间件（仅用于主命名空间）
    io.use((socket, next) => {
        const token = (socket.handshake.auth as any)?.token;
        console.log('🔐 [Socket.IO Auth] Token received:', token ? 'Yes' : 'No');
        if (!token) {
            console.log('❌ [Socket.IO Auth] Missing token');
            return next(new Error('missing token'));
        }
        try {
            const dec = jwt.verify(token, config.jwtSecret) as any;
            // 兼容新旧 token 格式：优先使用 userId，回退到 uid
            const userId = dec.userId || dec.uid;
            (socket as any).uid = userId;
            (socket as any).userId = userId;
            console.log('✅ [Socket.IO Auth] Token valid for user:', userId);
            next();
        } catch (err) {
            console.log('❌ [Socket.IO Auth] Invalid token:', err);
            next(new Error('invalid token'));
        }
    });

    // 初始化 Widget 命名空间
    const widgetNs = initWidgetNamespace(io);

    // 主命名空间：客服连接
    io.on('connection', async (socket) => {
        const uid = (socket as any).uid as string;
        console.log(`🔌 [Socket.IO] New connection from user: ${uid}, socket ID: ${socket.id}`);
        socket.join(uid);
        console.log(`✅ [Socket.IO] User ${uid} joined room: ${uid}`);

        // 获取共享的 WhatsApp 频道实例
        const waChannel = getWAChannel();


        // ===== 保留原有 WA 事件（向后兼容）=====

        // 监听启动 WhatsApp 连接请求（带 channelId 和 name）
        socket.on('wa.start', async (payload: { channelId: string; name?: string }) => {
            console.log(`🚀 [Socket] Received wa.start event from ${uid}, channelId:`, payload.channelId, 'name:', payload.name);
            try {
                console.log(`📞 [Socket] Calling waChannel.ensure(${uid}, ${payload.channelId}, ${payload.name})...`);
                await waChannel.ensure(uid, payload.channelId, payload.name);
                console.log(`✅ [Socket] waChannel.ensure completed for ${uid}:${payload.channelId}`);
            } catch (err) {
                console.error(`❌ [Socket] Failed to start WhatsApp for ${uid}:`, err);
                socket.emit('wa.error', {
                    channelId: payload.channelId,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        });

        // 监听客户端发送消息请求
        socket.on('wa.send', async (payload: { channelId: string; to: string; text: string }) => {
            try {
                await waChannel.send(uid, payload.channelId, payload.to, payload.text);
            } catch (err) {
                console.error(`Failed to send message for ${uid}:`, err);
                socket.emit('wa.error', {
                    channelId: payload.channelId,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        });

        // 监听停止 WhatsApp 连接请求
        socket.on('wa.stop', async (payload: { channelId: string }) => {
            try {
                await waChannel.stop(uid, payload.channelId);
                socket.emit('wa.stopped', { channelId: payload.channelId, success: true });
            } catch (err) {
                console.error(`Failed to stop WhatsApp for ${uid}:`, err);
                socket.emit('wa.error', {
                    channelId: payload.channelId,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        });

        // ===== 新增统一 chat 事件 =====

        // 统一发送消息事件
        socket.on('chat.send', async (payload: {
            channel: 'WA' | 'TG' | 'WEB';
            to: string;
            text: string;
            channelId?: string; // WA 需要
        }) => {
            try {
                const { channel, to, text, channelId } = payload;
                const timestamp = new Date();

                if (channel === 'WA') {
                    // WhatsApp 消息
                    const cid = channelId || 'default';
                    await waChannel.send(uid, cid, to, text);

                    // 本地回显
                    socket.emit('chat.message', {
                        channel: 'WA',
                        from: uid,
                        to,
                        text,
                        ts: timestamp.toISOString(),
                        direction: 'out',
                        channelId: cid,
                    });
                } else if (channel === 'WEB') {
                    // Web 访客消息 (to 格式: widgetId:visitorId)
                    const socketId = visitorToSocket.get(to);

                    if (!socketId) {
                        throw new Error('Visitor not connected');
                    }

                    // 发送给访客
                    await sendToVisitor(widgetNs, to, text);

                    // 记录到数据库
                    await prisma.messageLog.create({
                        data: {
                            userId: uid,
                            channel: 'WEB' as any,
                            direction: 'OUTGOING',
                            peer: to,
                            content: text, // 改为 content 字段
                            messageType: 'TEXT',
                        },
                    });

                    // 本地回显（不广播给坐席自己，避免重复）
                    socket.emit('chat.message', {
                        channel: 'WEB',
                        from: uid,
                        to,
                        text,
                        ts: timestamp.toISOString(),
                        direction: 'out',
                    });
                } else if (channel === 'TG') {
                    // TODO: Telegram 实现
                    socket.emit('chat.error', {
                        channel: 'TG',
                        error: 'Telegram not implemented yet',
                    });
                }
            } catch (err) {
                console.error(`Failed to send chat message for ${uid}:`, err);
                socket.emit('chat.error', {
                    channel: payload.channel,
                    error: err instanceof Error ? err.message : String(err)
                });
            }
        });

        // 监听断开连接
        socket.on('disconnect', (reason) => {
            console.log(`🔌 [Socket.IO] User ${uid} disconnected. Reason:`, reason);
            console.log(`   Socket ID: ${socket.id}`);
        });
    });

    return io;
}
