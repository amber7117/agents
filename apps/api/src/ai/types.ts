/**
 * AI Provider 类型定义
 */
export type ProviderName = 'OPENAI' | 'DEEPSEEK' | 'ANTHROPIC' | 'GROK' | 'GEMINI';

/**
 * Channel 类型定义
 */
export type ChannelName = 'WA' | 'TG';

/**
 * AI Client 接口 - 所有 Provider 必须实现此接口
 */
export interface AIClient {
    /**
     * 发送聊天请求并获取回复
     * @param opts 聊天选项
     * @returns AI 生成的回复文本
     */
    chat(opts: {
        apiKey: string;
        model: string;
        system: string;
        user: string;
        temperature?: number;
    }): Promise<string>;
}

/**
 * AI 请求处理结果
 */
export interface AIResponse {
    text: string;
    provider: ProviderName;
    model: string;
    tokensUsed?: number;
}

/**
 * Inbound 消息处理参数
 */
export interface InboundMessage {
    uid: string;
    channel: ChannelName;
    from: string;
    text: string;
}
