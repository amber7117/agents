import { prisma } from '@pkg/db';
import type { InboundMessage, ChannelName } from './types';
import { decrypt } from './crypto';
import { getClient } from './providers';
import crypto from 'node:crypto';

/**
 * 简单的限流器：记录用户最后触发时间
 */
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2000; // 2 秒

/**
 * 防止回环：记录最近发出的消息哈希
 */
interface RecentMessage {
    hash: string;
    timestamp: number;
}
const recentOutbound = new Map<string, RecentMessage>();
const LOOP_PREVENTION_MS = 10000; // 10 秒

/**
 * 计算文本的简单哈希
 */
function hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

/**
 * 检查是否是我们最近发出的消息（防止回环）
 */
function isRecentOutbound(peer: string, text: string): boolean {
    const key = peer;
    const recent = recentOutbound.get(key);

    if (!recent) return false;

    const now = Date.now();
    if (now - recent.timestamp > LOOP_PREVENTION_MS) {
        recentOutbound.delete(key);
        return false;
    }

    return recent.hash === hashText(text);
}

/**
 * 记录发出的消息（用于防止回环）
 */
function recordOutbound(peer: string, text: string): void {
    recentOutbound.set(peer, {
        hash: hashText(text),
        timestamp: Date.now(),
    });
}

/**
 * 处理入站消息，如果满足条件则调用 AI 生成回复
 * 
 * @param message 入站消息
 * @returns AI 生成的回复文本，如果不满足条件或出错则返回 null
 */
export async function handleInbound(message: InboundMessage): Promise<string | null> {
    const { uid, channel, from, text } = message;

    try {
        // 1. 简单限流：同一用户 2 秒内只触发一次
        const now = Date.now();
        const lastTrigger = rateLimitMap.get(uid);

        if (lastTrigger && now - lastTrigger < RATE_LIMIT_MS) {
            console.log(`[AI Orchestrator] Rate limit: user ${uid} triggered too soon`);
            return null;
        }

        rateLimitMap.set(uid, now);

        // 2. 防止回环：检查是否是我们最近发出的消息
        if (isRecentOutbound(from, text)) {
            console.log(`[AI Orchestrator] Loop prevention: ignoring our recent message`);
            return null;
        }

        // 3. 检查用户模块开关（如果表存在）
        try {
            const userModule = await prisma.userModule.findUnique({
                where: { userId: uid },
            });

            if (userModule && !userModule.aiEnabled) {
                console.log(`[AI Orchestrator] AI disabled for user ${uid}`);
                return null;
            }
        } catch (error) {
            // 如果 UserModule 表不存在，跳过此检查
            console.log(`[AI Orchestrator] UserModule check skipped (table may not exist)`);
        }

        // 4. 查询用户在该渠道的 AI 绑定
        let binding;
        try {
            // Check if userAgentBinding model exists by attempting to access it
            if ('userAgentBinding' in prisma) {
                binding = await (prisma as any).userAgentBinding.findUnique({
                    where: {
                        userId_channel: {
                            userId: uid,
                            channel: channel as any,
                        },
                    },
                    include: {
                        template: true,
                    },
                });
            } else {
                console.log(`[AI Orchestrator] userAgentBinding model not found in Prisma schema`);
                return null;
            }
        } catch (error) {
            console.error(`[AI Orchestrator] Error accessing userAgentBinding model:`, error);
            return null;
        }

        if (!binding || !binding.enabled) {
            console.log(`[AI Orchestrator] No active binding for user ${uid} on channel ${channel}`);
            return null;
        }

        // 5. 查询用户的 API 凭证
        let credential;
        try {
            // Check if apiCredential model exists by attempting to access it
            if ('apiCredential' in prisma) {
                credential = await (prisma as any).apiCredential.findUnique({
                    where: {
                        userId_provider: {
                            userId: uid,
                            provider: binding.template.provider as any,
                        },
                    },
                });
            } else {
                console.log(`[AI Orchestrator] apiCredential model not found in Prisma schema`);
                return null;
            }
        } catch (error) {
            console.error(`[AI Orchestrator] Error accessing apiCredential model:`, error);
            return null;
        }

        if (!credential) {
            console.log(`[AI Orchestrator] No API credential for user ${uid} with provider ${binding.template.provider}`);
            return null;
        }

        // 6. 解密 API Key
        const apiKey = decrypt(credential.apiKeyEnc);

        // 7. 调用 AI Provider
        const client = getClient(binding.template.provider as any);
        const model = binding.modelOverride || binding.template.model;

        console.log(`[AI Orchestrator] Calling ${binding.template.provider} (${model}) for user ${uid}`);

        const reply = await client.chat({
            apiKey,
            model,
            system: binding.template.systemPrompt,
            user: text,
            temperature: binding.template.temperature,
        });

        // 8. 记录消息日志（入站 + 出站）
        try {
            // Check if message model exists by attempting to access it
            if ('message' in prisma) {
                await (prisma as any).message.createMany({
                    data: [
                        {
                            userId: uid,
                            channel: channel as any,
                            direction: 'INCOMING',
                            peer: from,
                            text,
                            aiUsed: false,
                        },
                        {
                            userId: uid,
                            channel: channel as any,
                            direction: 'OUTGOING',
                            peer: from,
                            text: reply,
                            aiUsed: true,
                        },
                    ],
                });
            } else {
                console.log(`[AI Orchestrator] message model not found in Prisma schema`);
            }
        } catch (error) {
            console.error(`[AI Orchestrator] Error logging messages:`, error);
            // Continue execution even if logging fails
        }

        // 9. 记录发出的消息（防止回环）
        recordOutbound(from, reply);

        console.log(`[AI Orchestrator] Generated reply for user ${uid}: ${reply.substring(0, 50)}...`);

        return reply;
    } catch (error) {
        console.error(`[AI Orchestrator] Error handling inbound message for user ${uid}:`, error);
        return null;
    }
}
