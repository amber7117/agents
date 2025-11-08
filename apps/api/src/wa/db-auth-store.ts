// src/wa/db-auth-store.ts
import {
    initAuthCreds,
    BufferJSON,
    AuthenticationCreds,
    SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { prisma } from '@pkg/db';
import { encryptJSON, decryptJSON } from '../crypto/field-crypto';

type KeyType = keyof SignalDataTypeMap;

// Baileys 目前有效的 key 类型（与 SignalDataTypeMap 对齐）
const KEY_TYPES: KeyType[] = [
    'pre-key',
    'session',
    'sender-key',
    'app-state-sync-key',
    'app-state-sync-version',
    'sender-key-memory',
];

// 安全的序列化和加密
function encodeEncrypted(value: unknown): string {
    try {
        // 确保使用 BufferJSON.replacer 处理二进制数据
        const json = JSON.stringify(value, BufferJSON.replacer);

        // 验证 JSON 是否有效
        if (!json || json === 'null') {
            throw new Error('Invalid JSON data to encrypt');
        }

        const encrypted = encryptJSON(json);
        // Convert Buffer to base64 string for database storage
        return encrypted.toString('base64');
    } catch (error) {
        console.error('[DbAuthStore] encodeEncrypted error:', error);
        throw new Error(`Failed to encode data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// 安全的解密和反序列化
function parseEncrypted<T = any>(cipherString: string): T {
    try {
        if (!cipherString || cipherString.length === 0) {
            throw new Error('Empty cipher data');
        }

        // Convert base64 string back to Buffer
        const cipher = Buffer.from(cipherString, 'base64');
        const decrypted = decryptJSON(cipher);

        // 处理不同的返回类型
        let jsonString: string;
        if (typeof decrypted === 'string') {
            jsonString = decrypted;
        } else if (typeof decrypted === 'object') {
            jsonString = JSON.stringify(decrypted);
        } else {
            throw new Error(`Unexpected decrypted type: ${typeof decrypted}`);
        }

        // 使用 BufferJSON.reviver 恢复二进制数据
        return JSON.parse(jsonString, BufferJSON.reviver) as T;
    } catch (error) {
        console.error('[DbAuthStore] parseEncrypted error:', error);
        throw new Error(`Failed to parse encrypted data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// 验证和清理认证数据
function validateAndCleanCreds(creds: any): AuthenticationCreds {
    if (!creds || typeof creds !== 'object') {
        console.warn('[DbAuthStore] Invalid creds, initializing new ones');
        return initAuthCreds();
    }

    // 确保必要的字段存在
    const requiredFields = ['noiseKey', 'signedIdentityKey', 'signedPreKey'];
    for (const field of requiredFields) {
        if (!creds[field]) {
            console.warn(`[DbAuthStore] Missing required field ${field}, reinitializing creds`);
            return initAuthCreds();
        }
    }

    return creds as AuthenticationCreds;
}

export async function makeDbAuthState(channelId: string, userId: string) {
    console.log(`[DbAuthStore] Initializing auth state for channel: ${channelId}`);

    let creds: AuthenticationCreds;
    let keys: { [T in KeyType]: Map<string, SignalDataTypeMap[T]> } = Object.fromEntries(
        KEY_TYPES.map((t) => [t, new Map<string, any>()])
    ) as any;

    try {
        // Check if the waAuth model exists in the Prisma client
        if (!('waAuth' in prisma)) {
            throw new Error('WaAuth model not found in Prisma schema. Please run: npx prisma db push && npx prisma generate');
        }

        // 尝试从数据库读取现有认证数据
        const found = await (prisma as any).waAuth.findUnique({
            where: { channelId },
            select: { credsCipher: true, keysCipher: true }
        });

        if (found?.credsCipher) {
            try {
                const decodedCreds = parseEncrypted<AuthenticationCreds>(found.credsCipher);
                creds = validateAndCleanCreds(decodedCreds);
                console.log(`[DbAuthStore] Loaded existing creds for channel: ${channelId}`);
            } catch (error) {
                console.error(`[DbAuthStore] Failed to parse creds for ${channelId}, initializing new:`, error);
                creds = initAuthCreds();
            }

            // 加载 keys
            if (found.keysCipher) {
                try {
                    const decodedKeys = parseEncrypted<Record<KeyType, Record<string, any>>>(found.keysCipher);
                    for (const keyType of KEY_TYPES) {
                        const keyData = decodedKeys?.[keyType] ?? {};
                        const keyMap = new Map<string, any>();

                        for (const [key, value] of Object.entries(keyData)) {
                            if (value !== null && value !== undefined) {
                                keyMap.set(key, value);
                            }
                        }
                        (keys as any)[keyType] = keyMap;
                    }
                    console.log(`[DbAuthStore] Loaded keys for channel: ${channelId}`);
                } catch (error) {
                    console.error(`[DbAuthStore] Failed to parse keys for ${channelId}, using empty keys:`, error);
                    // 保持空的 keys map
                }
            }
        } else {
            // 没有找到现有数据，初始化新的
            creds = initAuthCreds();
            console.log(`[DbAuthStore] Initialized new creds for channel: ${channelId}`);
        }
    } catch (error) {
        console.error(`[DbAuthStore] Critical error loading auth state for ${channelId}:`, error);
        // 降级处理：使用全新的认证数据
        creds = initAuthCreds();
    }

    // 防抖保存机制
    let saveTimeout: NodeJS.Timeout | null = null;
    let isSaving = false;
    let pendingSave = false;

    async function flushCreds() {
        if (isSaving) {
            pendingSave = true;
            return;
        }

        isSaving = true;

        try {
            // Check if the waAuth model exists before attempting to save
            if (!('waAuth' in prisma)) {
                throw new Error('WaAuth model not found in Prisma schema. Please run: npx prisma db push && npx prisma generate');
            }

            // 准备 creds 数据
            const credsCipher = encodeEncrypted(creds);

            // 准备 keys 数据
            const plainKeysObj: Record<KeyType, Record<string, any>> = {} as any;
            for (const keyType of KEY_TYPES) {
                plainKeysObj[keyType] = {};
                keys[keyType].forEach((value, key) => {
                    if (value !== null && value !== undefined) {
                        plainKeysObj[keyType][key] = value;
                    }
                });
            }
            const keysCipher = encodeEncrypted(plainKeysObj);

            // 保存到数据库
            await (prisma as any).waAuth.upsert({
                where: { channelId },
                update: {
                    credsCipher,
                    keysCipher,
                    userId, // 确保 userId 是最新的
                    updatedAt: new Date()
                },
                create: {
                    channelId,
                    userId,
                    credsCipher,
                    keysCipher
                },
            });

            console.log(`[DbAuthStore] Successfully saved auth state for channel: ${channelId}`);
        } catch (error) {
            console.error(`[DbAuthStore] Failed to save auth state for ${channelId}:`, error);
            // 这里可以添加重试逻辑或错误上报
        } finally {
            isSaving = false;

            // 检查是否有挂起的保存请求
            if (pendingSave) {
                pendingSave = false;
                setTimeout(flushCreds, 100);
            }
        }
    }

    // 带防抖的保存函数
    const saveCreds = async () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(async () => {
            await flushCreds();
        }, 1000); // 1秒防抖
    };

    // 立即保存初始状态（如果是新会话）
    const shouldSaveInitial = async () => {
        try {
            if (!('waAuth' in prisma)) {
                console.warn('[DbAuthStore] WaAuth model not available, skipping initial save');
                return;
            }

            const existing = await (prisma as any).waAuth.findUnique({ where: { channelId } });
            if (!existing) {
                console.log(`[DbAuthStore] Saving initial auth state for new channel: ${channelId}`);
                await flushCreds();
            }
        } catch (error) {
            console.error(`[DbAuthStore] Error checking existing auth state for ${channelId}:`, error);
        }
    };

    // 立即执行初始保存检查（不阻塞返回）
    shouldSaveInitial().catch(error => {
        console.error(`[DbAuthStore] Failed to save initial auth state for ${channelId}:`, error);
    });

    const state = {
        creds,
        keys: {
            get: async (type: KeyType, ids: string[]) => {
                const map = keys[type];
                const result: { [id: string]: any } = {};

                for (const id of ids) {
                    const value = map.get(id);
                    if (value !== undefined) {
                        result[id] = value;
                    }
                }

                return result;
            },

            set: async (data: any) => {
                let hasChanges = false;

                // data structure: { [category]: { [id]: value | null } }
                for (const category in data) {
                    const categoryData = data[category];
                    const map = keys[category as KeyType];

                    if (!map) continue;

                    for (const id in categoryData) {
                        const value = categoryData[id];

                        if (value === null || value === undefined) {
                            if (map.has(id)) {
                                map.delete(id);
                                hasChanges = true;
                            }
                        } else {
                            map.set(id, value);
                            hasChanges = true;
                        }
                    }
                }

                // 只有实际有变化时才保存
                if (hasChanges) {
                    await saveCreds();
                }
            },
        },
    };

    return {
        state,
        saveCreds,
        // 添加一些调试方法
        _debug: {
            getCreds: () => ({ ...creds }),
            getKeysStats: () => {
                const stats: Record<string, number> = {};
                for (const keyType of KEY_TYPES) {
                    stats[keyType] = keys[keyType].size;
                }
                return stats;
            },
            forceSave: flushCreds
        }
    };
}

// 清理无效的认证数据
export async function cleanupAuthData(channelId: string): Promise<boolean> {
    try {
        if (!('waAuth' in prisma)) {
            console.warn('[DbAuthStore] WaAuth model not available, cannot cleanup');
            return false;
        }

        await (prisma as any).waAuth.delete({
            where: { channelId }
        });
        console.log(`[DbAuthStore] Successfully cleaned up auth data for channel: ${channelId}`);
        return true;
    } catch (error) {
        console.error(`[DbAuthStore] Failed to cleanup auth data for ${channelId}:`, error);
        return false;
    }
}