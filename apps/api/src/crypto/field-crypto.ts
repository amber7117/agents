/**
 * 字段级加密工具 - AES-256-GCM
 * 帧格式: [12B IV][16B Tag][Ciphertext]
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * 从环境变量读取密钥
 * 格式: base64:xxxxxxxxxxxxx (32 bytes base64 encoded)
 */
function getEncryptionKey(): Buffer {
    const keyStr = process.env.AUTH_CRYPTO_KEY;
    if (!keyStr) {
        throw new Error('AUTH_CRYPTO_KEY environment variable is not set');
    }

    if (!keyStr.startsWith('base64:')) {
        throw new Error('AUTH_CRYPTO_KEY must start with "base64:" prefix');
    }

    const keyBase64 = keyStr.slice(7); // Remove 'base64:' prefix
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
        throw new Error(`AUTH_CRYPTO_KEY must be 32 bytes, got ${key.length} bytes`);
    }

    return key;
}

/**
 * 加密 JSON 对象
 * @param obj 要加密的对象
 * @returns Buffer [IV][Tag][Ciphertext]
 */
export function encryptJSON(obj: any): Buffer {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const plaintext = JSON.stringify(obj);
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // 组帧: [IV][Tag][Ciphertext]
    return Buffer.concat([iv, tag, ciphertext]);
}

/**
 * 解密到 JSON 对象
 * @param buf 加密的 Buffer [IV][Tag][Ciphertext]
 * @returns 解密后的对象
 */
export function decryptJSON(buf: Buffer): any {
    const key = getEncryptionKey();

    if (buf.length < IV_LENGTH + TAG_LENGTH) {
        throw new Error('Invalid encrypted data: too short');
    }

    const iv = buf.subarray(0, IV_LENGTH);
    const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return JSON.parse(plaintext.toString('utf8'));
}

/**
 * 生成新的加密密钥（base64 格式）
 * 用于初始化 .env 配置
 */
export function generateEncryptionKey(): string {
    const key = randomBytes(32);
    return `base64:${key.toString('base64')}`;
}
