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

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/sync', syncRouter);

const server = http.createServer(app);
initIO(server);

server.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
});