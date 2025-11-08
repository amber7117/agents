/**
 * AI配置路由 - 管理全局和用户级AI配置
 */

import express, { Router, Request, Response } from 'express';
import { prisma } from '@pkg/db';
import { auth } from '../../middleware/auth';

const router: Router = express.Router();

/**
 * 🔍 获取AI配置
 * GET /api/ai/config
 * 优先返回用户配置，fallback到全局配置
 */
router.get('/config', auth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        // 查找用户特定配置
        let config = null;
        if (userId) {
            config = await prisma.aIConfig.findFirst({
                where: { userId, enabled: true },
                orderBy: { updatedAt: 'desc' }
            });
        }

        // 如果没有用户配置，查找全局配置
        if (!config) {
            config = await prisma.aIConfig.findFirst({
                where: { userId: null, enabled: true },
                orderBy: { updatedAt: 'desc' }
            });
        }

        // 如果仍然没有配置，返回默认值
        if (!config) {
            config = {
                provider: 'OPENAI',
                model: 'gpt-4o',
                temperature: 0.7,
                topP: 1.0,
                frequencyPenalty: 0.0,
                presencePenalty: 0.0,
                maxTokens: 4096,
                systemPrompt: '你是一个友好且高效的AI助手。',
                persona: '智能助手',
                replyStyle: 'friendly',
                language: 'zh-CN',
                dailyBudgetUSD: 1.00,
                enabled: true
            };
        }

        res.json({
            success: true,
            config,
            isGlobal: !config.userId,
            message: config.userId ? '用户配置' : '全局配置'
        });
    } catch (error) {
        console.error('获取AI配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取AI配置失败'
        });
    }
});

/**
 * 💾 保存AI配置
 * POST /api/ai/config
 * 支持全局配置（isGlobal=true）和用户配置
 */
router.post('/config', auth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { config, isGlobal = false } = req.body;

        // 验证必要字段
        const {
            provider,
            model,
            temperature = 0.7,
            topP = 1.0,
            frequencyPenalty = 0.0,
            presencePenalty = 0.0,
            maxTokens = 4096,
            systemPrompt,
            persona,
            replyStyle,
            language = 'zh-CN',
            dailyBudgetUSD = 1.00,
            enabled = true
        } = config;

        // 确定配置的归属
        const targetUserId = isGlobal ? null : userId;

        // 检查权限：只有管理员可以修改全局配置
        if (isGlobal && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以修改全局配置'
            });
        }

        // 创建或更新配置
        const aiConfig = await prisma.aIConfig.upsert({
            where: {
                userId_provider: {
                    userId: targetUserId,
                    provider
                }
            },
            update: {
                model,
                temperature,
                topP,
                frequencyPenalty,
                presencePenalty,
                maxTokens,
                systemPrompt,
                persona,
                replyStyle,
                language,
                dailyBudgetUSD,
                enabled,
                updatedAt: new Date()
            },
            create: {
                userId: targetUserId,
                provider,
                model,
                temperature,
                topP,
                frequencyPenalty,
                presencePenalty,
                maxTokens,
                systemPrompt,
                persona,
                replyStyle,
                language,
                dailyBudgetUSD,
                enabled
            }
        });

        res.json({
            success: true,
            config: aiConfig,
            message: `${isGlobal ? '全局' : '用户'}AI配置已保存`
        });
    } catch (error) {
        console.error('保存AI配置失败:', error);
        res.status(500).json({
            success: false,
            message: '保存AI配置失败'
        });
    }
});

/**
 * 🗑️ 删除AI配置
 * DELETE /api/ai/config/:id
 */
router.delete('/config/:id', auth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // 查找配置
        const config = await prisma.aIConfig.findUnique({
            where: { id }
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: '配置不存在'
            });
        }

        // 权限检查
        if (config.userId === null && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以删除全局配置'
            });
        }

        if (config.userId && config.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权删除其他用户的配置'
            });
        }

        // 删除配置
        await prisma.aIConfig.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: '配置已删除'
        });
    } catch (error) {
        console.error('删除AI配置失败:', error);
        res.status(500).json({
            success: false,
            message: '删除AI配置失败'
        });
    }
});

/**
 * 📋 获取所有AI配置列表
 * GET /api/ai/configs
 * 管理员可以看到所有配置，普通用户只能看到自己的配置
 */
router.get('/configs', auth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'ADMIN';

        let configs;

        if (isAdmin) {
            // 管理员看到所有配置
            configs = await prisma.aIConfig.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true }
                    }
                }
            });
        } else {
            // 普通用户只看到自己的配置和全局配置
            configs = await prisma.aIConfig.findMany({
                where: {
                    OR: [
                        { userId: null }, // 全局配置
                        { userId }        // 用户配置
                    ]
                },
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, email: true }
                    }
                }
            });
        }

        res.json({
            success: true,
            configs,
            total: configs.length
        });
    } catch (error) {
        console.error('获取AI配置列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取AI配置列表失败'
        });
    }
});

export default router;