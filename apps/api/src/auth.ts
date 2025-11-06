import { Router, type Router as RouterType } from 'express';
import { prisma } from '@pkg/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

export const authRouter: RouterType = Router();

authRouter.post('/register', async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    const hashed = await bcrypt.hash(password, 10);
    try {
        const user = await prisma.user.create({ data: { email, password: hashed } });
        return res.json({ id: user.id, email: user.email });
    } catch (e: any) {
        return res.status(400).json({ error: 'email exists?' });
    }
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: '7d' });
    res.json({ token });
});

export function requireAuth(req: any, res: any, next: any) {
    const hdr = req.headers.authorization?.toString() || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    try {
        const dec = jwt.verify(token, config.jwtSecret) as any;
        (req as any).uid = dec.uid;
        next();
    } catch {
        return res.status(401).json({ error: 'invalid token' });
    }
}