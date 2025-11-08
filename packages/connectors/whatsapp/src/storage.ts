import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * WhatsApp 会话存储管理器
 * 负责管理每个用户的会话文件存储路径
 * 支持多频道：每个用户可以有多个 WhatsApp 账号
 */
export class WAStorage {
    private authRoot: string;

    constructor(authRoot: string) {
        this.authRoot = authRoot;
    }

    /**
     * 获取用户频道的会话目录路径
     * @param userChannelDir 用户频道目录名（格式：user-{uid}-{channelId}）
     */
    getUserDir(userChannelDir: string): string {
        return path.join(this.authRoot, userChannelDir);
    }

    /**
     * 确保用户频道目录存在
     * @param userChannelDir 用户频道目录名（格式：user-{uid}-{channelId}）
     */
    async ensureUserDir(userChannelDir: string): Promise<string> {
        const dir = this.getUserDir(userChannelDir);
        await fs.mkdir(dir, { recursive: true });
        return dir;
    }

    /**
     * 检查用户频道会话是否存在
     * @param userChannelDir 用户频道目录名（格式：user-{uid}-{channelId}）
     */
    async hasSession(userChannelDir: string): Promise<boolean> {
        const dir = this.getUserDir(userChannelDir);
        try {
            const credsPath = path.join(dir, 'creds.json');
            await fs.access(credsPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 删除用户频道会话
     * @param userChannelDir 用户频道目录名（格式：user-{uid}-{channelId}）
     */
    async deleteSession(userChannelDir: string): Promise<void> {
        const dir = this.getUserDir(userChannelDir);
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (err) {
            console.error(`Failed to delete session for ${userChannelDir}:`, err);
        }
    }

    /**
     * 初始化存储根目录
     */
    async init(): Promise<void> {
        await fs.mkdir(this.authRoot, { recursive: true });
    }
}
