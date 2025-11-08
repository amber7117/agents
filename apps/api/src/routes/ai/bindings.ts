/**
 * 智能体绑定路由 - 管理 AgentTemplate 与 UserAgentBinding
 */

import express, { Router, Request, Response } from 'express';
import { prisma, type Channel } from '@pkg/db';
import { auth } from '../../middleware/auth';
import { resolveAIContext } from '../../services/ai/resolve-context';

// 扩展 Request 接口以包含 user 属性
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

// 创建绑定的请求体接口
interface CreateBindingRequest {
    templateId: string;
    channel?: Channel | null;
    triggerKeywords?: string[];
    contextTags?: string[];
    enabled?: boolean;
    isGlobal?: boolean;
    modelOverride?: string;
}

// 更新绑定的请求体接口
interface UpdateBindingRequest {
    templateId?: string;
    channel?: Channel | null;
    triggerKeywords?: string[];
    contextTags?: string[];
    enabled?: boolean;
    modelOverride?: string;
}

// 解析请求的请求体接口
interface ResolveRequest {
    channel?: Channel;
    message?: string;
    context?: {
        tags?: string[];
        [key: string]: any;
    };
}

const router: Router = express.Router();

/**
 * 📋 获取智能体绑定列表
 * GET /api/ai/bindings
 */
router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { channel } = req.query;

        const where: any = {
            OR: [
                { userId: null },  // 全局绑定
                { userId }         // 用户绑定
            ]
        };

        // 如果指定了频道，则过滤
        if (channel) {
            where.channel = channel as string;
        }

        const bindings = await prisma.userAgentBinding.findMany({
            where,
            include: {
                template: true,
                user: {
                    select: { id: true, email: true }
                }
            },
            orderBy: [
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            bindings,
            total: bindings.length
        });
    } catch (error) {
        console.error('获取绑定列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取绑定列表失败'
        });
    }
});

/**
 * ➕ 创建智能体绑定
 * POST /api/ai/bindings
 */
router.post('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const {
            templateId,
            channel,
            triggerKeywords = [],
            contextTags = [],
            enabled = true,
            isGlobal = false,
            modelOverride
        }: CreateBindingRequest = req.body;

        // 验证必要字段
        if (!templateId) {
            return res.status(400).json({
                success: false,
                message: 'templateId 是必需的'
            });
        }

        // 检查模板是否存在
        const template = await prisma.agentTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: '智能体模板不存在'
            });
        }

        // 权限检查：只有管理员可以创建全局绑定
        if (isGlobal && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以创建全局绑定'
            });
        }

        // 创建绑定数据
        const bindingData: any = {
            templateId,
            channel: channel || null,
            triggerKeywords,
            contextTags,
            enabled
        };

        // 如果有模型覆盖，添加到数据中
        if (modelOverride) {
            bindingData.modelOverride = modelOverride;
        }

        // 如果不是全局绑定，添加userId
        if (!isGlobal && userId) {
            bindingData.userId = userId;
        }

        // 创建绑定
        const binding = await prisma.userAgentBinding.create({
            data: bindingData,
            include: {
                template: true,
                user: {
                    select: { id: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            binding,
            message: `${isGlobal ? '全局' : '用户'}绑定已创建`
        });
    } catch (error) {
        console.error('创建绑定失败:', error);
        res.status(500).json({
            success: false,
            message: '创建绑定失败'
        });
    }
});

/**
 * ✏️ 更新智能体绑定
 * PUT /api/ai/bindings/:id
 */
router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const {
            templateId,
            channel,
            triggerKeywords,
            contextTags,
            enabled,
            modelOverride
        }: UpdateBindingRequest = req.body;

        // 查找绑定
        const existingBinding = await prisma.userAgentBinding.findUnique({
            where: { id }
        });

        if (!existingBinding) {
            return res.status(404).json({
                success: false,
                message: '绑定不存在'
            });
        }

        // 权限检查
        if (existingBinding.userId === null && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以修改全局绑定'
            });
        }

        if (existingBinding.userId && existingBinding.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权修改其他用户的绑定'
            });
        }

        // 构建更新数据
        const updateData: any = {};
        if (templateId !== undefined) updateData.templateId = templateId;
        if (channel !== undefined) updateData.channel = channel;
        if (triggerKeywords !== undefined) updateData.triggerKeywords = triggerKeywords;
        if (contextTags !== undefined) updateData.contextTags = contextTags;
        if (enabled !== undefined) updateData.enabled = enabled;
        if (modelOverride !== undefined) updateData.modelOverride = modelOverride;

        // 更新绑定
        const binding = await prisma.userAgentBinding.update({
            where: { id },
            data: updateData,
            include: {
                template: true,
                user: {
                    select: { id: true, email: true }
                }
            }
        });

        res.json({
            success: true,
            binding,
            message: '绑定已更新'
        });
    } catch (error) {
        console.error('更新绑定失败:', error);
        res.status(500).json({
            success: false,
            message: '更新绑定失败'
        });
    }
});

/**
 * 🗑️ 删除智能体绑定
 * DELETE /api/ai/bindings/:id
 */
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // 查找绑定
        const binding = await prisma.userAgentBinding.findUnique({
            where: { id }
        });

        if (!binding) {
            return res.status(404).json({
                success: false,
                message: '绑定不存在'
            });
        }

        // 权限检查
        if (binding.userId === null && req.user?.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: '只有管理员可以删除全局绑定'
            });
        }

        if (binding.userId && binding.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: '无权删除其他用户的绑定'
            });
        }

        // 删除绑定
        await prisma.userAgentBinding.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: '绑定已删除'
        });
    } catch (error) {
        console.error('删除绑定失败:', error);
        res.status(500).json({
            success: false,
            message: '删除绑定失败'
        });
    }
});

/**
 * 🔍 根据条件查找最佳匹配的智能体
 * POST /api/ai/bindings/resolve
 */
router.post('/resolve', auth, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { channel, message, context }: ResolveRequest = req.body;

        // 使用统一的AI决策服务
        const aiResult = await resolveAIContext({
            userId,
            channel,
            messageContent: message,
            keywords: message ? message.split(' ').filter((w: string) => w.length > 2) : [],
            contextTags: context?.tags || []
        });

        // 如果有模板ID，查找完整的绑定信息
        let binding = null;
        if (aiResult.templateId) {
            binding = await prisma.userAgentBinding.findFirst({
                where: {
                    templateId: aiResult.templateId,
                    enabled: true
                },
                include: {
                    template: true,
                    user: {
                        select: { id: true, email: true }
                    }
                }
            });
        }

        res.json({
            success: true,
            enabled: aiResult.enabled,
            aiResult,
            binding,
            templateName: aiResult.templateName,
            reason: aiResult.reason
        });
    } catch (error) {
        console.error('解析智能体失败:', error);
        res.status(500).json({
            success: false,
            message: '解析智能体失败',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

export default router;
