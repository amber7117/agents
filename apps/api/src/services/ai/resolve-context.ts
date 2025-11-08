/**
 * 统一AI决策服务 - 根据最新逻辑智能选择AI模型和模板
 * 
 * 决策流程：
 * 1. 检查全局模块开关：ModuleSettings.aiEnabled
 * 2. 检查用户模块开关：UserModule.aiEnabled  
 * 3. 查找 AIConfig：优先 userId=X，fallback userId=null（全局）
 * 4. 查找智能体绑定（UserAgentBinding）：按优先级和匹配度
 * 5. 返回最终参数（provider、model、prompt、temperature等）
 */

import { prisma, type AiProvider, type Channel } from '@pkg/db';

// 🧠 AI决策结果接口
export interface AIResolveResult {
    enabled: boolean;
    provider: AiProvider;
    model: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    systemPrompt?: string;
    persona?: string;
    replyStyle?: string;
    language: string;
    dailyBudgetUSD: number;
    templateId?: string;
    templateName?: string;
    prompt?: string;
    reason: string; // 决策原因，用于调试
}

// 🔍 AI决策上下文
export interface AIResolveContext {
    userId?: string;
    channel?: Channel;
    messageContent?: string;
    keywords?: string[];
    contextTags?: string[];
}

// 数据库记录的类型定义
interface AIConfigRecord {
    id: string;
    userId: string | null;
    provider: AiProvider;
    model: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    systemPrompt: string | null;
    persona: string | null;
    replyStyle: string | null;
    language: string;
    dailyBudgetUSD: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface UserAgentBindingRecord {
    id: string;
    userId: string | null;
    templateId: string;
    channel: Channel | null;
    triggerKeywords: string[] | null;
    contextTags: string[] | null;
    modelOverride: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    template?: {
        id: string;
        name: string;
        prompt: string;
        temperature?: number;
    };
}

interface ModuleSettingsRecord {
    id: string;
    userId: string | null;
    aiEnabled: boolean;
}

interface UserModuleRecord {
    id: string;
    userId: string;
    module: string;
    enabled: boolean;
}

/**
 * 🧠 统一AI决策入口
 * @param context - 决策上下文
 * @returns AI配置决策结果
 */
export async function resolveAIContext(context: AIResolveContext): Promise<AIResolveResult> {
    const { userId, channel, messageContent, keywords = [], contextTags = [] } = context;

    try {
        // 1️⃣ 检查全局模块开关 - 添加表存在性检查
        let globalSettings = null;
        try {
            globalSettings = await prisma.moduleSettings.findFirst({
                where: { userId: null }
            });
        } catch (error) {
            console.warn('ModuleSettings表不存在或查询失败，跳过模块开关检查:', error);
            // 如果表不存在，默认启用AI模块
        }
        
        if (globalSettings?.aiEnabled === false) {
            return createDisabledResult('全局AI模块已禁用');
        }

        // 2️⃣ 检查用户模块开关（如果有userId）- 添加表存在性检查
        if (userId) {
            let userModule = null;
            try {
                userModule = await prisma.userModule.findFirst({
                    where: { 
                        userId,
                        aiEnabled: true
                    }
                });
            } catch (error) {
                console.warn('UserModule表不存在或查询失败，跳过用户模块检查:', error);
                // 如果表不存在，默认启用AI模块
            }
            
            if (userModule && !userModule.aiEnabled) {
                return createDisabledResult('用户AI模块已禁用');
            }
        }

        // 3️⃣ 查找AI配置：优先用户配置，fallback全局配置
        const aiConfig = await findAIConfig(userId);
        if (!aiConfig) {
            return createDefaultResult('未找到AI配置，使用默认设置');
        }

        // 4️⃣ 查找智能体绑定（UserAgentBinding）
        const binding = await findBestAgentBinding(userId, channel, messageContent, keywords, contextTags);

        // 5️⃣ 组合最终配置
        return createResolveResult(aiConfig, binding);
    } catch (error) {
        console.error('AI决策失败:', error);
        return createDefaultResult('决策过程出错，使用默认配置');
    }
}

/**
 * 🎯 查找最佳智能体绑定
 */
async function findBestAgentBinding(
    userId?: string,
    channel?: Channel,
    messageContent?: string,
    keywords: string[] = [],
    contextTags: string[] = []
): Promise<UserAgentBindingRecord | null> {
    try {
        // 构建查询条件的优先级列表
        const searchConditions = [
            { userId, channel },           // 用户+频道特定
            { userId, channel: null },     // 用户默认
            { userId: null, channel },     // 频道默认
            { userId: null, channel: null } // 全局默认
        ];

        for (const condition of searchConditions) {
            let whereClause: any = {
                enabled: true
            };

            // 处理userId条件 - 修复这里的逻辑
            if (condition.userId === null) {
                whereClause.userId = null;
            } else if (condition.userId !== undefined) {
                whereClause.userId = condition.userId;
            }

            // 处理channel条件
            if (condition.channel === null) {
                whereClause.channel = null;
            } else if (condition.channel !== undefined) {
                whereClause.channel = condition.channel;
            }

            const bindings = await prisma.userAgentBinding.findMany({
                where: whereClause,
                include: {
                    template: {
                        select: {
                            id: true,
                            name: true,
                            prompt: true,
                            temperature: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (bindings.length === 0) continue;

            // 🎯 智能匹配：根据关键词和上下文标签打分
            const scoredBindings = bindings.map(binding => ({
                binding: binding as UserAgentBindingRecord,
                score: calculateMatchingScore(binding, messageContent, keywords, contextTags)
            })).sort((a, b) => b.score - a.score);

            if (scoredBindings.length > 0) {
                return scoredBindings[0].binding;
            }
        }

        return null;
    } catch (error) {
        console.error('查找智能体绑定失败:', error);
        return null;
    }
}

/**
 * 📋 查找AI配置：优先用户配置，fallback全局配置
 */
async function findAIConfig(userId?: string): Promise<AIConfigRecord | null> {
    try {
        // 如果有userId，优先查找用户配置
        if (userId) {
            const userConfig = await prisma.aIConfig.findFirst({
                where: { 
                    userId, 
                    enabled: true 
                },
                orderBy: { updatedAt: 'desc' }
            });
            if (userConfig) return userConfig as AIConfigRecord;
        }

        // Fallback到全局配置（userId=null）
        const globalConfig = await prisma.aIConfig.findFirst({
            where: { 
                userId: null,
                enabled: true 
            },
            orderBy: { updatedAt: 'desc' }
        });

        return globalConfig as AIConfigRecord | null;
    } catch (error) {
        console.error('查找AI配置失败:', error);
        // 如果AIConfig表也不存在，返回null让系统使用默认配置
        return null;
    }
}

/**
 * 🎯 计算匹配分数
 * 基于triggerKeywords和contextTags进行智能匹配
 */
function calculateMatchingScore(
    binding: any,
    messageContent?: string,
    keywords: string[] = [],
    contextTags: string[] = []
): number {
    let score = 50; // 默认基础分数

    // 关键词匹配加分
    if (binding.triggerKeywords && Array.isArray(binding.triggerKeywords) && binding.triggerKeywords.length > 0) {
        const matchedKeywords = binding.triggerKeywords.filter((kw: string) =>
            keywords.some(k => k.toLowerCase().includes(kw.toLowerCase())) ||
            messageContent?.toLowerCase().includes(kw.toLowerCase())
        );
        score += matchedKeywords.length * 10; // 每个匹配关键词+10分
    }

    // 上下文标签匹配加分
    if (binding.contextTags && Array.isArray(binding.contextTags) && binding.contextTags.length > 0) {
        const matchedTags = binding.contextTags.filter((tag: string) =>
            contextTags.some(ct => ct.toLowerCase() === tag.toLowerCase())
        );
        score += matchedTags.length * 5; // 每个匹配标签+5分
    }

    // 如果有具体的频道匹配，额外加分
    if (binding.channel) {
        score += 20;
    }

    // 如果是用户特定绑定，额外加分
    if (binding.userId) {
        score += 30;
    }

    return score;
}

/**
 * ✅ 创建最终决策结果
 */
function createResolveResult(aiConfig: AIConfigRecord, binding?: UserAgentBindingRecord | null): AIResolveResult {
    const result: AIResolveResult = {
        enabled: true,
        provider: aiConfig.provider,
        model: binding?.modelOverride || aiConfig.model,
        temperature: aiConfig.temperature || 0.7,
        topP: aiConfig.topP || 1,
        frequencyPenalty: aiConfig.frequencyPenalty || 0,
        presencePenalty: aiConfig.presencePenalty || 0,
        maxTokens: aiConfig.maxTokens || 4096,
        systemPrompt: aiConfig.systemPrompt || '你是一个友好且高效的AI助手。',
        persona: aiConfig.persona || undefined,
        replyStyle: aiConfig.replyStyle || undefined,
        language: aiConfig.language || 'zh-CN',
        dailyBudgetUSD: aiConfig.dailyBudgetUSD || 1,
        reason: `使用${aiConfig.userId ? '用户' : '全局'}配置`
    };

    // 如果有智能体绑定，使用模板的prompt
    if (binding?.template) {
        result.templateId = binding.template.id;
        result.templateName = binding.template.name;
        result.prompt = binding.template.prompt;
        result.reason += ` + 智能体模板[${binding.template.name}]`;
        
        // 如果模板有temperature设置，使用模板的设置
        if (binding.template.temperature !== undefined) {
            result.temperature = binding.template.temperature;
        }
    }

    return result;
}

/**
 * ❌ 创建禁用状态结果
 */
function createDisabledResult(reason: string): AIResolveResult {
    return {
        enabled: false,
        provider: 'OPENAI' as AiProvider,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        maxTokens: 4096,
        language: 'zh-CN',
        dailyBudgetUSD: 1,
        reason
    };
}

/**
 * ✅ 创建默认配置结果（当没有找到配置时）
 */
function createDefaultResult(reason: string): AIResolveResult {
    return {
        enabled: true,
        provider: 'OPENAI' as AiProvider,
        model: 'gpt-4o',
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
        maxTokens: 4096,
        systemPrompt: '你是一个友好且高效的AI助手。',
        language: 'zh-CN',
        dailyBudgetUSD: 1,
        reason
    };
}

/**
 * 🧪 测试函数：验证决策逻辑
 */
export async function testAIResolve() {
    console.log('🧪 测试AI决策逻辑...');

    const testCases = [
        { userId: 'user1', channel: 'WA' as Channel, messageContent: '客服问题' },
        { userId: 'user1', channel: 'TG' as Channel },
        { channel: 'WEB' as Channel },
        { messageContent: '技术支持' }
    ];

    for (const testCase of testCases) {
        const result = await resolveAIContext(testCase);
        console.log(`测试用例:`, testCase);
        console.log(`决策结果:`, result);
        console.log('---');
    }
}