import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { getWAChannel } from './channels/wa.routes';

export function initIO(httpServer: HTTPServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin, credentials: true },
    });

    io.use((socket, next) => {
        const token = (socket.handshake.auth as any)?.token;
        if (!token) return next(new Error('missing token'));
        try {
            const dec = jwt.verify(token, config.jwtSecret) as any;
            (socket as any).uid = dec.uid;
            next();
        } catch {
            next(new Error('invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const uid = (socket as any).uid as string;
        socket.join(uid);

        // 获取共享的 WhatsApp 频道实例
        const waChannel = getWAChannel();

        // 监听启动 WhatsApp 连接请求（带 channelId）
        socket.on('wa.start', async (payload: { channelId: string }) => {
            try {
                await waChannel.ensure(uid, payload.channelId);
            } catch (err) {
                console.error(`Failed to start WhatsApp for ${uid}:`, err);
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

        // 监听断开连接
        socket.on('disconnect', () => {
            console.log(`User ${uid} disconnected`);
        });
    });

    return io;
}