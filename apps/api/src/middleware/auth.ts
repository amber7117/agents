import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@pkg/db';

// 扩展Request接口
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: 'ADMIN' | 'USER' | string;
            };
        }
    }
}

interface JWTPayload {
    userId: string;
    email: string;
     role: 'ADMIN' | 'USER' | string;
    iat?: number;
    exp?: number;
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || 
                     req.header('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '访问被拒绝，无有效token'
            });
        }

        const jwtSecret = process.env.JWT_SECRET || 'whatsappme';
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        
        // 验证用户是否存在
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户不存在'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: 'USER'
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Token无效'
        });
    }
};

// 管理员权限中间件
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    await auth(req, res, () => {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '需要管理员权限'
            });
        }
        next();
    });
};

// 可选的auth中间件（不强制要求登录）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return next(); // 没有token也继续
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true
            }
        });

        if (user) {
            req.user = {
                id: user.id,
                email: user.email,
                role: 'USER' // Default role since role field doesn't exist in schema
            };
        }
        next();
    } catch (error) {
        // 即使token无效也继续，只是不设置user
        next();
    }
};