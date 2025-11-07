import crypto from 'node:crypto';

/**
 * 获取加密密钥（从环境变量），不足 32 字节则右填充
 */
function getEncryptionKey(): Buffer {
    const key = process.env.SECRET_ENC_KEY || 'default_dev_key_change_me';
    const keyBuffer = Buffer.from(key, 'utf8');

    // 确保密钥长度为 32 字节（AES-256）
    if (keyBuffer.length >= 32) {
        return keyBuffer.subarray(0, 32);
    }

    // 右填充到 32 字节
    const paddedKey = Buffer.alloc(32);
    keyBuffer.copy(paddedKey);
    return paddedKey;
}

/**
 * 使用 AES-256-GCM 加密文本
 * @param plaintext 明文
 * @returns base64 编码的加密结果（格式：iv:authTag:ciphertext）
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 IV

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // 格式：iv:authTag:ciphertext（均为 base64）
    return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted
    ].join(':');
}

/**
 * 使用 AES-256-GCM 解密文本
 * @param encryptedData base64 编码的加密数据（格式：iv:authTag:ciphertext）
 * @returns 解密后的明文
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
