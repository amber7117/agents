import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { WARegistry } from './wa/manager';

export function initIO(httpServer: HTTPServer) {
    const io = new Server(httpServer, {
        cors: { origin: config.corsOrigin, credentials: true },
    });

    const registry = new WARegistry(io);

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
        // ensure WA session is started; QR will be emitted if needed
        await registry.startForUser(uid);

        socket.on('wa.send', async (payload: { to: string; text: string }) => {
            await registry.send(uid, payload.to, payload.text);
        });
    });

    return io;
}