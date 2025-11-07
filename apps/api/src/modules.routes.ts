import { Router } from 'express';
import { prisma } from '@pkg/db';
import { auth } from './middleware/auth';

export const modulesRouter = Router();

/**
 * GET /modules
 * 获取用户的模块开关配置
 * 如果不存在则创建默认配置
 */
modulesRouter.get('/', auth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        let userModule = await prisma.userModule.findUnique({
            where: { userId },
        });

        // 如果不存在，创建默认配置
        if (!userModule) {
            userModule = await prisma.userModule.create({
                data: {
                    userId,
                    waEnabled: true,
                    tgEnabled: false,
                    aiEnabled: false,
                    flowEnabled: false,
                },
            });
        }

        res.json({ modules: userModule });
    } catch (error) {
        console.error('[Modules Routes] Error fetching modules:', error);
        res.status(500).json({
            error: 'Failed to fetch modules',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /modules
 * 更新用户的模块开关配置
 * 只更新传入的字段
 */
modulesRouter.post('/', auth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { waEnabled, tgEnabled, aiEnabled, flowEnabled } = req.body as {
            waEnabled?: boolean;
            tgEnabled?: boolean;
            aiEnabled?: boolean;
            flowEnabled?: boolean;
        };

        // 构建更新数据（只包含传入的字段）
        const updateData: any = {};
        if (typeof waEnabled === 'boolean') updateData.waEnabled = waEnabled;
        if (typeof tgEnabled === 'boolean') updateData.tgEnabled = tgEnabled;
        if (typeof aiEnabled === 'boolean') updateData.aiEnabled = aiEnabled;
        if (typeof flowEnabled === 'boolean') updateData.flowEnabled = flowEnabled;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No fields to update',
                message: 'At least one field must be provided',
            });
        }

        // 先确保记录存在
        let userModule = await prisma.userModule.findUnique({
            where: { userId },
        });

        if (!userModule) {
            // 创建默认配置并应用更新
            userModule = await prisma.userModule.create({
                data: {
                    userId,
                    waEnabled: updateData.waEnabled ?? true,
                    tgEnabled: updateData.tgEnabled ?? false,
                    aiEnabled: updateData.aiEnabled ?? false,
                    flowEnabled: updateData.flowEnabled ?? false,
                },
            });
        } else {
            // 更新现有配置
            userModule = await prisma.userModule.update({
                where: { userId },
                data: updateData,
            });
        }

        res.json({
            ok: true,
            message: 'Modules updated successfully',
            modules: userModule,
        });
    } catch (error) {
        console.error('[Modules Routes] Error updating modules:', error);
        res.status(500).json({
            error: 'Failed to update modules',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
