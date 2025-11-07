import { Router } from 'express';
import { prisma } from '@pkg/db';
import { auth } from '../middleware/auth';
import { encrypt } from './crypto';
import type { ProviderName, ChannelName } from './types';

export const aiRouter = Router();

/**
 * POST /ai/key
 * 保存或更新用户的 API Key（加密存储）
 */
aiRouter.post('/key', auth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { provider, apiKey } = req.body as {
            provider: ProviderName;
            apiKey: string;
        };

        if (!provider || !apiKey) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both "provider" and "apiKey" are required',
            });
        }

        // 验证 provider 是否有效
        const validProviders = ['OPENAI', 'DEEPSEEK', 'ANTHROPIC', 'GROK', 'GEMINI'];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                error: 'Invalid provider',
                message: `Provider must be one of: ${validProviders.join(', ')}`,
            });
        }

        // 加密 API Key
        const apiKeyEnc = encrypt(apiKey);

        // Upsert 凭证
        const credential = await prisma.apiCredential.upsert({
            where: {
                userId_provider: {
                    userId,
                    provider: provider,
                },
            },
            update: {
                apiKeyEnc,
            },
            create: {
                userId,
                provider: provider,
                apiKeyEnc,
            },
        });

        res.json({
            ok: true,
            message: 'API key saved successfully',
            id: credential.id,
        });
    } catch (error) {
        console.error('[AI Routes] Error saving API key:', error);
        res.status(500).json({
            error: 'Failed to save API key',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /ai/templates
 * 获取所有可用的 AI 模板
 */
aiRouter.get('/templates', auth, async (req, res) => {
    try {
        const templates = await prisma.agentTemplate.findMany({
            orderBy: { name: 'asc' },
        });

        res.json({ templates });
    } catch (error) {
        console.error('[AI Routes] Error fetching templates:', error);
        res.status(500).json({
            error: 'Failed to fetch templates',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /ai/bind
 * 绑定或更新用户在某个渠道的 AI 模板
 */
aiRouter.post('/bind', auth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { channel, templateId, enabled, modelOverride } = req.body as {
            channel: ChannelName;
            templateId: string;
            enabled?: boolean;
            modelOverride?: string;
        };

        if (!channel || !templateId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both "channel" and "templateId" are required',
            });
        }

        // 验证 channel 是否有效
        const validChannels = ['WA', 'TG'];
        if (!validChannels.includes(channel)) {
            return res.status(400).json({
                error: 'Invalid channel',
                message: `Channel must be one of: ${validChannels.join(', ')}`,
            });
        }

        // 验证模板是否存在
        const template = await prisma.agentTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                message: `No template found with id: ${templateId}`,
            });
        }

        // Upsert 绑定
        const binding = await prisma.userAgentBinding.upsert({
            where: {
                userId_channel: {
                    userId,
                    channel: channel,
                },
            },
            update: {
                templateId,
                enabled: enabled ?? true,
                modelOverride: modelOverride || null,
            },
            create: {
                userId,
                channel: channel,
                templateId,
                enabled: enabled ?? true,
                modelOverride: modelOverride || null,
            },
            include: {
                template: true,
            },
        });

        res.json({
            ok: true,
            message: 'Binding saved successfully',
            binding,
        });
    } catch (error) {
        console.error('[AI Routes] Error saving binding:', error);
        res.status(500).json({
            error: 'Failed to save binding',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * GET /ai/bind/:channel
 * 获取用户在指定渠道的 AI 绑定信息
 */
aiRouter.get('/bind/:channel', auth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { channel } = req.params as { channel: ChannelName };

        // 验证 channel 是否有效
        const validChannels = ['WA', 'TG'];
        if (!validChannels.includes(channel)) {
            return res.status(400).json({
                error: 'Invalid channel',
                message: `Channel must be one of: ${validChannels.join(', ')}`,
            });
        }

        const binding = await prisma.userAgentBinding.findUnique({
            where: {
                userId_channel: {
                    userId,
                    channel: channel,
                },
            },
            include: {
                template: true,
            },
        });

        if (!binding) {
            return res.json({ binding: null });
        }

        res.json({ binding });
    } catch (error) {
        console.error('[AI Routes] Error fetching binding:', error);
        res.status(500).json({
            error: 'Failed to fetch binding',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
