/**
 * AI 决策服务 - 统一的 AI 上下文解析逻辑（兼容性包装）
 * 
 * @deprecated 请使用 ./ai/resolve-context.ts 中的新实现
 */

import { resolveAIContext as newResolveAIContext, type AIResolveContext, type AIResolveResult } from './ai/resolve-context';
import type { Channel } from '@pkg/db';

interface ResolveContextParams {
    userId?: string;
    channel?: 'WHATSAPP' | 'TELEGRAM' | 'WEB' | 'API';
    message?: string;
    context?: any;
}

interface ResolvedAIContext {
    enabled: boolean;
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    maxTokens: number;
    systemPrompt: string;
    persona?: string;
    replyStyle?: string;
    language?: string;
    templateId?: string;
    bindingId?: string;
    configId?: string;
    reason?: string;
}

// 修复Channel类型映射
const mapChannelType = (channel?: 'WHATSAPP' | 'TELEGRAM' | 'WEB' | 'API'): Channel | undefined => {
    switch (channel) {
        case 'WHATSAPP': return 'WA' as Channel;
        case 'TELEGRAM': return 'TG' as Channel;
        case 'WEB': return 'WEB' as Channel;
        case 'API': return 'API' as Channel;
        default: return undefined;
    }
};

/**
 * 🔍 解析 AI 上下文（兼容性函数）
 * @deprecated 请使用 ./ai/resolve-context.ts 中的新实现
 */
export async function resolveAIContext(params: ResolveContextParams): Promise<ResolvedAIContext> {
    // 转换参数格式
    const context: AIResolveContext = {
        userId: params.userId,
        channel: mapChannelType(params.channel),
        messageContent: params.message,
        keywords: params.message ? params.message.split(' ').filter(w => w.length > 2) : [],
        contextTags: []
    };

    // 调用新的实现
    const result: AIResolveResult = await newResolveAIContext(context);

    // 转换返回格式以保持兼容性
    return {
        enabled: result.enabled,
        provider: result.provider,
        model: result.model,
        temperature: result.temperature,
        topP: result.topP,
        frequencyPenalty: result.frequencyPenalty,
        presencePenalty: result.presencePenalty,
        maxTokens: result.maxTokens,
        systemPrompt: result.systemPrompt || '',
        persona: result.persona,
        replyStyle: result.replyStyle,
        language: result.language,
        templateId: result.templateId,
        reason: result.reason
    };
}

/**
 * 🧪 测试用例
 */
export async function testResolveAIContext() {
    console.log('🧪 测试 AI 上下文解析...\n');

    const testCases = [
        {},
        { userId: 'test-user-id' },
        { userId: 'test-user-id', channel: 'WHATSAPP' as const },
        { userId: 'test-user-id', channel: 'WEB' as const, message: '你好，我需要帮助' }
    ];

    for (const [index, testCase] of testCases.entries()) {
        console.log(`测试${index + 1}:`, testCase);
        const result = await resolveAIContext(testCase);
        console.log(result);
        console.log('');
    }
}
