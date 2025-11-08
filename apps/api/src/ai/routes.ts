import express, { Router, Request, Response } from 'express';
import { prisma, Channel } from '@pkg/db';
import { auth } from '../middleware/auth';
import { encrypt } from './crypto';
import type { ProviderName, ChannelName } from './types';





// Prisma model types
interface ApiCredential {
    id: string;
    userId: string;
    provider: ProviderName;
    apiKeyEnc: string;
    createdAt: Date;
    updatedAt: Date;
}

interface AgentTemplate {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string | null;
    character: string | null;
    expertise: string | null;
    responseStyle: string | null;
    prompt: string;
    provider: ProviderName;
    model: string;
    temperature: number;
    createdAt: Date;
    updatedAt: Date;
    bindings?: UserAgentBinding[];
}

interface UserAgentBinding {
    id: string;
    userId: string | null; // 更新为可空，匹配 schema
    channel: Channel | null; // 更新为可空，匹配 schema
    templateId: string;
    enabled: boolean;
    modelOverride: string | null;
    priority: number; // 添加缺失的字段
    triggerKeywords: string[]; // 添加缺失的字段
    contextTags: string[]; // 添加缺失的字段
    createdAt: Date;
    updatedAt: Date;
    template?: AgentTemplate;
}

// Request/Response interfaces
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

interface ApiKeysResponse {
    keys: Record<string, boolean>;
}

interface SaveApiKeyRequest {
    provider: ProviderName;
    apiKey: string;
}

interface SaveApiKeyResponse {
    ok: boolean;
    message: string;
    id: string;
}

interface CreateTemplateRequest {
    name: string;
    avatarUrl?: string;
    color?: string;
    description?: string;
    role?: string;
    character?: string;
    expertise?: string;
    language?: string;
    background?: string;
    prompt: string;
    responseStyle?: string;
    constraints?: string;
    examples?: string[];
    tags?: string[];
    provider: ProviderName;
    model: string;
    temperature?: number;
}

interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> { }

interface TemplateResponse {
    ok: boolean;
    message: string;
    template: AgentTemplate;
}

interface TemplatesResponse {
    templates: AgentTemplate[];
}

interface BindRequest {
    channel: ChannelName;
    templateId: string;
    enabled?: boolean;
    modelOverride?: string;
}

interface BindResponse {
    ok: boolean;
    message: string;
    binding: UserAgentBinding;
}

interface GetBindingResponse {
    binding: UserAgentBinding | null;
}

interface BindingsResponse {
    bindings: (UserAgentBinding & { template: AgentTemplate | null })[];
}

interface ErrorResponse {
    error: string;
    message?: string;
}

interface DeleteResponse {
    ok: boolean;
    message: string;
}


export const aiRouter: Router = express.Router();
/**
 * GET /ai/keys
 * 获取用户已保存的 API Keys 状态（不返回实际密钥）
 */
aiRouter.get('/keys', auth, async (req: AuthenticatedRequest, res: Response<ApiKeysResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 查询该用户已保存的所有 API credentials
        const credentials: Pick<ApiCredential, 'provider'>[] = await prisma.apiCredential.findMany({
            where: { userId },
            select: { provider: true } // 只选择 provider 字段
        });

        // 转换为 { OPENAI: true, DEEPSEEK: true, ... } 格式
        const keys: Record<string, boolean> = {};
        credentials.forEach((cred: Pick<ApiCredential, 'provider'>) => {
            keys[cred.provider] = true;
        });

        res.json({ keys });
    } catch (error) {
        console.error('[AI Routes] Error fetching API keys status:', error);
        res.status(500).json({
            error: 'Failed to fetch API keys status',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /ai/key
 * 保存或更新用户的 API Key（加密存储）
 */
aiRouter.post('/key', auth, async (req: AuthenticatedRequest, res: Response<SaveApiKeyResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { provider, apiKey }: SaveApiKeyRequest = req.body as SaveApiKeyRequest;

        if (!provider || !apiKey) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both "provider" and "apiKey" are required',
            });
        }

        // 验证 provider 是否有效
        const validProviders: ProviderName[] = ['OPENAI', 'DEEPSEEK', 'ANTHROPIC', 'GROK', 'GEMINI'];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                error: 'Invalid provider',
                message: `Provider must be one of: ${validProviders.join(', ')}`,
            });
        }

        // 加密 API Key
        const apiKeyEnc: string = encrypt(apiKey);

        // Upsert 凭证
        const credential: ApiCredential = await prisma.apiCredential.upsert({
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
aiRouter.get('/templates', auth, async (req: AuthenticatedRequest, res: Response<TemplatesResponse | ErrorResponse>) => {
    try {
        const templates: AgentTemplate[] = await prisma.agentTemplate.findMany({
            orderBy: { createdAt: 'desc' },
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
 * POST /ai/templates
 * 创建新的 AI 模板
 */
aiRouter.post('/templates', auth, async (req: AuthenticatedRequest, res: Response<TemplateResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            name,
            avatarUrl,
            color,
            description,
            role,
            character,
            expertise,
            language,
            background,
            prompt,
            responseStyle,
            constraints,
            examples,
            tags,
            provider,
            model,
            temperature,
        }: CreateTemplateRequest = req.body;

        // 验证必填字段
        if (!name || !prompt || !provider || !model) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'name, prompt, provider, and model are required',
            });
        }

        // 验证 provider
        const validProviders: ProviderName[] = ['OPENAI', 'DEEPSEEK', 'ANTHROPIC', 'GROK', 'GEMINI'];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({
                error: 'Invalid provider',
                message: `Provider must be one of: ${validProviders.join(', ')}`,
            });
        }

        // 验证 temperature
        const temp: number = temperature !== undefined ? parseFloat(temperature.toString()) : 0.7;
        if (isNaN(temp) || temp < 0 || temp > 2) {
            return res.status(400).json({
                error: 'Invalid temperature',
                message: 'Temperature must be a number between 0 and 2',
            });
        }

        // 验证 examples 和 tags 数组
        const examplesArray: string[] = Array.isArray(examples) ? examples : [];
        const tagsArray: string[] = Array.isArray(tags) ? tags : [];

        // 创建模板
        const template: AgentTemplate = await prisma.agentTemplate.create({
            data: {
                name,
                avatarUrl: avatarUrl || null,
                color: color || 'blue',
                description: description || null,
                role: role || null,
                character: character || null,
                expertise: expertise || null,
                language: language || null,
                background: background || null,
                prompt,
                responseStyle: responseStyle || null,
                constraints: constraints || null,
                examples: examplesArray,
                tags: tagsArray,
                provider,
                model,
                temperature: temp
            },
        });

        res.json({
            ok: true,
            message: 'Template created successfully',
            template,
        });
    } catch (error) {
        console.error('[AI Routes] Error creating template:', error);
        res.status(500).json({
            error: 'Failed to create template',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * PUT /ai/templates/:id
 * 更新 AI 模板
 */
aiRouter.put('/templates/:id', auth, async (req: AuthenticatedRequest, res: Response<TemplateResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const id: string = req.params.id as string;
        const {
            name,
            avatarUrl,
            color,
            description,
            role,
            character,
            expertise,
            language,
            background,
            prompt,
            responseStyle,
            constraints,
            examples,
            tags,
            provider,
            model,
            temperature,
        }: UpdateTemplateRequest = req.body;

        // 检查模板是否存在
        const existingTemplate: AgentTemplate | null = await prisma.agentTemplate.findUnique({
            where: { id },
        });

        if (!existingTemplate) {
            return res.status(404).json({
                error: 'Template not found',
                message: `No template found with id: ${id}`,
            });
        }

        // 验证 provider（如果提供）
        if (provider) {
            const validProviders: ProviderName[] = ['OPENAI', 'DEEPSEEK', 'ANTHROPIC', 'GROK', 'GEMINI'];
            if (!validProviders.includes(provider)) {
                return res.status(400).json({
                    error: 'Invalid provider',
                    message: `Provider must be one of: ${validProviders.join(', ')}`,
                });
            }
        }

        // 验证 temperature（如果提供）
        if (temperature !== undefined) {
            const temp: number = parseFloat(temperature.toString());
            if (isNaN(temp) || temp < 0 || temp > 2) {
                return res.status(400).json({
                    error: 'Invalid temperature',
                    message: 'Temperature must be a number between 0 and 2',
                });
            }
        }

        // 更新模板
        const template: AgentTemplate = await prisma.agentTemplate.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(avatarUrl !== undefined && { avatarUrl }),
                ...(color !== undefined && { color }),
                ...(description !== undefined && { description }),
                ...(role !== undefined && { role }),
                ...(character !== undefined && { character }),
                ...(expertise !== undefined && { expertise }),
                ...(language !== undefined && { language }),
                ...(background !== undefined && { background }),
                ...(prompt && { prompt }),
                ...(responseStyle !== undefined && { responseStyle }),
                ...(constraints !== undefined && { constraints }),
                ...(examples !== undefined && { examples }),
                ...(tags !== undefined && { tags }),
                ...(provider && { provider }),
                ...(model && { model }),
                ...(temperature !== undefined && { temperature: parseFloat(temperature.toString()) }),
            },
        });

        res.json({
            ok: true,
            message: 'Template updated successfully',
            template,
        });
    } catch (error) {
        console.error('[AI Routes] Error updating template:', error);
        res.status(500).json({
            error: 'Failed to update template',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * DELETE /ai/templates/:id
 * 删除 AI 模板
 */
aiRouter.delete('/templates/:id', auth, async (req: AuthenticatedRequest, res: Response<DeleteResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const id: string = req.params.id as string;

        // 检查模板是否存在
        const existingTemplate: (AgentTemplate & { bindings: UserAgentBinding[] }) | null = await prisma.agentTemplate.findUnique({
            where: { id },
            include: {
                bindings: true,
            },
        });

        if (!existingTemplate) {
            return res.status(404).json({
                error: 'Template not found',
                message: `No template found with id: ${id}`,
            });
        }

        // 检查是否有绑定
        if (existingTemplate.bindings.length > 0) {
            return res.status(400).json({
                error: 'Template in use',
                message: 'Cannot delete template that is currently bound to channels. Please unbind it first.',
            });
        }

        // 删除模板
        await prisma.agentTemplate.delete({
            where: { id },
        });

        res.json({
            ok: true,
            message: 'Template deleted successfully',
        });
    } catch (error) {
        console.error('[AI Routes] Error deleting template:', error);
        res.status(500).json({
            error: 'Failed to delete template',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * POST /ai/bind
 * 绑定或更新用户在某个渠道的 AI 模板
 */
aiRouter.post('/bind', auth, async (req: AuthenticatedRequest, res: Response<BindResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { channel, templateId, enabled, modelOverride }: BindRequest = req.body as BindRequest;

        if (!channel || !templateId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Both "channel" and "templateId" are required',
            });
        }

        // 验证 channel 是否有效
        const validChannels: Channel[] = [Channel.WA, Channel.TG, Channel.WEB];
        if (!validChannels.includes(channel as Channel)) {
            return res.status(400).json({
                error: 'Invalid channel',
                message: `Channel must be one of: ${validChannels.join(', ')}`,
            });
        }

        // 验证模板是否存在
        const template: AgentTemplate | null = await prisma.agentTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            return res.status(404).json({
                error: 'Template not found',
                message: `No template found with id: ${templateId}`,
            });
        }

        // Upsert 绑定
        const binding: UserAgentBinding & { template: AgentTemplate } = await prisma.userAgentBinding.upsert({
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
aiRouter.get('/bind/:channel', auth, async (req: AuthenticatedRequest, res: Response<GetBindingResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const channel: ChannelName = req.params.channel as ChannelName;

        // 验证 channel 是否有效
        const validChannels: Channel[] = [Channel.WA, Channel.TG, Channel.WEB];
        if (!validChannels.includes(channel as Channel)) {
            return res.status(400).json({
                error: 'Invalid channel',
                message: `Channel must be one of: ${validChannels.join(', ')}`,
            });
        }

        const binding: (UserAgentBinding & { template: AgentTemplate }) | null = await prisma.userAgentBinding.findUnique({
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

/**
 * GET /ai/bindings
 * 获取当前用户的所有智能体绑定
 */
aiRouter.get('/bindings', auth, async (req: AuthenticatedRequest, res: Response<BindingsResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 查询该用户的所有绑定
        const bindings = await prisma.userAgentBinding.findMany({
            where: {
                userId,
            },
            include: {
                template: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({ bindings });
    } catch (error) {
        console.error('[AI Routes] Error fetching bindings:', error);
        res.status(500).json({
            error: 'Failed to fetch bindings',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

/**
 * DELETE /ai/bindings/:id
 * 删除指定的智能体绑定
 */
aiRouter.delete('/bindings/:id', auth, async (req: AuthenticatedRequest, res: Response<DeleteResponse | ErrorResponse>) => {
    try {
        const userId: string | undefined = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const bindingId: string = req.params.id;

        // 验证绑定是否存在且属于当前用户
        const binding = await prisma.userAgentBinding.findUnique({
            where: { id: bindingId },
        });

        if (!binding) {
            return res.status(404).json({
                error: 'Binding not found',
                message: `No binding found with id: ${bindingId}`,
            });
        }

        if (binding.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to delete this binding',
            });
        }

        // 删除绑定
        await prisma.userAgentBinding.delete({
            where: { id: bindingId },
        });

        res.json({
            ok: true,
            message: 'Binding deleted successfully',
        });
    } catch (error) {
        console.error('[AI Routes] Error deleting binding:', error);
        res.status(500).json({
            error: 'Failed to delete binding',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
