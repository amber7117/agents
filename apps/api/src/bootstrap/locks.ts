/**
 * Redis 和分布式锁初始化
 */
import Redis from 'ioredis';
import Redlock from 'redlock';

// Redis 客户端
export const redis = new Redis(process.env.REDIS_URL || 'redis://default:iP1JYoGjXYhpjxp7RxPHDUCR9z8znSmj@redis-18577.c9.us-east-1-4.ec2.redns.redis-cloud.com:18577', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        if (times > 3) {
            console.error('[Redis] Max retries reached, giving up');
            return null;
        }
        const delay = Math.min(times * 100, 2000);
        console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
    },
    reconnectOnError: (err) => {
        console.error('[Redis] Reconnect on error:', err.message);
        return true;
    },
});

redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
    console.error('[Redis] Error:', err);
});

redis.on('close', () => {
    console.warn('[Redis] Connection closed');
});

// Redlock 分布式锁（retryCount: 0 表示不重试，快速失败）
export const redlock = new Redlock([redis], {
    retryCount: 0, // 不重试，快速返回"already-running"
    retryDelay: 0,
    retryJitter: 0,
    automaticExtensionThreshold: 0,
});

redlock.on('error', (err) => {
    // 忽略预期的锁冲突错误
    if (!err.message.includes('already locked')) {
        console.error('[Redlock] Error:', err);
    }
});

/**
 * 锁键生成器
 */
export function getLockKey(channelId: string): string {
    return `lock:wa:session:${channelId}`;
}

/**
 * 会话键生成器（Redis Hash）
 */
export function getSessionKey(channelId: string): string {
    return `wa:session:${channelId}`;
}

/**
 * QR 码键生成器
 */
export function getQRKey(channelId: string): string {
    return `wa:qr:${channelId}`;
}

/**
 * 限流键生成器
 */
export function getRateLimitKey(channelId: string, minute: number): string {
    return `rl:reply:${channelId}:${minute}`;
}
