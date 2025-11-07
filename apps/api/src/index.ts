import { webcrypto } from 'node:crypto';

// Polyfill for crypto in Node.js environment
if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
}

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { config } from './config';
import { authRouter } from './auth';
import { apiRouter } from './routes';
import { syncRouter } from './sync';
import { initIO } from './socket';
import { mountWARoutes } from './channels/wa.routes';
import { aiRouter } from './ai/routes';
import { modulesRouter } from './modules.routes';
import { seedTemplates } from './ai/templates';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/sync', syncRouter);
app.use('/ai', aiRouter);
app.use('/modules', modulesRouter);

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