import { webcrypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Polyfill for crypto in Node.js environment
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import path from 'path';
import { config } from './config';
import { authRouter } from './auth';
import { apiRouter } from './routes';
import { syncRouter } from './sync';
import { initIO } from './socket';
import { mountWARoutes } from './channels/wa.routes';
import { aiRouter } from './ai/routes';
import { modulesRouter } from './modules.routes';
import { seedTemplates } from './ai/templates';
import { widgetRouter } from './widget/routes';
import { redis } from './bootstrap/locks.js';

// ES 模块中的 __dirname 替代方案
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true }));

// Health check endpoint with lock owner information
app.get('/healthz', async (_req, res) => {
    try {
        // Check Redis connection
        const redisPing = await redis.ping();
        const redisConnected = redisPing === 'PONG';

        // Get all lock keys
        const lockKeys = await redis.keys('lock:wa:session:*');
        const locks: Record<string, { owner: string | null; ttl: number }> = {};

        for (const key of lockKeys) {
            const value = await redis.get(key);
            const ttl = await redis.ttl(key);
            locks[key] = {
                owner: value,
                ttl: ttl
            };
        }

        // Get session metrics from SessionManager (if available)
        const sessionManager = (global as any).sessionManager;
        const sessions: Record<string, any> = {};

        if (sessionManager) {
            const allMetrics = sessionManager.getAllMetrics();
            allMetrics.forEach((metrics: any, channelId: string) => {
                sessions[channelId] = {
                    ready: sessionManager.isSessionReady(channelId),
                    startedAt: metrics.startedAt,
                    messageCount: metrics.messageCount,
                    lastActivity: metrics.lastActivity
                };
            });
        }

        res.json({
            status: 'ok',
            redis: redisConnected ? 'connected' : 'disconnected',
            locks,
            sessions
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/sync', syncRouter);
app.use('/ai', aiRouter);
app.use('/modules', modulesRouter);
app.use('/widget', widgetRouter);

// 静态文件服务（用于 Widget SDK）
app.use('/widget', express.static(path.join(__dirname, '../public/widget')));

const server = http.createServer(app);
const io = initIO(server);

// 挂载 WhatsApp 路由
mountWARoutes(app, io);

// 初始化 AI 模板数据
seedTemplates().catch((error) => {
    console.error('[Startup] Failed to seed AI templates:', error);
});

server.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
});
