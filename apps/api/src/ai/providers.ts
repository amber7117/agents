import type { AIClient, ProviderName } from './types';

/**
 * OpenAI Provider
 */
export class OpenAIClient implements AIClient {
    async chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${opts.apiKey}`,
            },
            body: JSON.stringify({
                model: opts.model,
                messages: [
                    { role: 'system', content: opts.system },
                    { role: 'user', content: opts.user },
                ],
                temperature: opts.temperature ?? 0.7,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
}

/**
 * DeepSeek Provider
 */
export class DeepSeekClient implements AIClient {
    async chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string> {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${opts.apiKey}`,
            },
            body: JSON.stringify({
                model: opts.model,
                messages: [
                    { role: 'system', content: opts.system },
                    { role: 'user', content: opts.user },
                ],
                temperature: opts.temperature ?? 0.7,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
}

/**
 * Anthropic Provider
 */
export class AnthropicClient implements AIClient {
    async chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': opts.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: opts.model,
                system: opts.system,
                messages: [
                    { role: 'user', content: opts.user },
                ],
                temperature: opts.temperature ?? 0.7,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }
}

/**
 * Grok (xAI) Provider - OpenAI 兼容接口
 */
export class GrokClient implements AIClient {
    async chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string> {
        const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${opts.apiKey}`,
            },
            body: JSON.stringify({
                model: opts.model,
                messages: [
                    { role: 'system', content: opts.system },
                    { role: 'user', content: opts.user },
                ],
                temperature: opts.temperature ?? 0.7,
                max_tokens: 512,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Grok API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
}

/**
 * Gemini (Google) Provider
 */
export class GeminiClient implements AIClient {
    async chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string> {
        const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

        const response = await fetch(
            `${baseUrl}/v1beta/models/${opts.model}:generateContent?key=${opts.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        role: 'system',
                        parts: [{ text: opts.system }],
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: opts.user }],
                        },
                    ],
                    generationConfig: {
                        temperature: opts.temperature ?? 0.7,
                        maxOutputTokens: 512,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
}

/**
 * 获取指定 Provider 的 Client 实例
 */
export function getClient(provider: ProviderName): AIClient {
    switch (provider) {
        case 'OPENAI':
            return new OpenAIClient();
        case 'DEEPSEEK':
            return new DeepSeekClient();
        case 'ANTHROPIC':
            return new AnthropicClient();
        case 'GROK':
            return new GrokClient();
        case 'GEMINI':
            return new GeminiClient();
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
