import path from 'node:path';
import fs from 'node:fs/promises';

/**
 * WhatsApp 会话存储管理器
 * 负责管理每个用户的会话文件存储路径
 */
export class WAStorage {
    private authRoot: string;

    constructor(authRoot: string) {
        this.authRoot = authRoot;
    }

    /**
     * 获取用户的会话目录路径
     */
    getUserDir(uid: string): string {
        return path.join(this.authRoot, `user-${uid}`);
    }

    /**
     * 确保用户目录存在
     */
    async ensureUserDir(uid: string): Promise<string> {
        const dir = this.getUserDir(uid);
        await fs.mkdir(dir, { recursive: true });
        return dir;
    }

    /**
     * 检查用户会话是否存在
     */
    async hasSession(uid: string): Promise<boolean> {
        const dir = this.getUserDir(uid);
        try {
            const credsPath = path.join(dir, 'creds.json');
            await fs.access(credsPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 删除用户会话
     */
    async deleteSession(uid: string): Promise<void> {
        const dir = this.getUserDir(uid);
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (err) {
            console.error(`Failed to delete session for ${uid}:`, err);
        }
    }

    /**
     * 初始化存储根目录
     */
    async init(): Promise<void> {
        await fs.mkdir(this.authRoot, { recursive: true });
    }
}
