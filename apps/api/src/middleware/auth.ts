import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@pkg/db';
import { config } from '../config';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: '缺少授权头' });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        try {
            const decoded = jwt.verify(token, config.jwtSecret) as { uid: string };
            const user = await prisma.user.findUnique({
                where: { id: decoded.uid },
                select: { id: true, email: true }
            });

            if (!user) {
                return res.status(401).json({ error: '用户不存在' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).json({ error: '无效的令牌' });
        }
    } catch (error) {
        console.error('认证中间件错误:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
};