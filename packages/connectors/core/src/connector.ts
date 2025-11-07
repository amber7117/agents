import { EventEmitter } from 'node:events';

/**
 * 统一的连接器事件类型定义
 */

export type ConnectorEvents =
    | { type: 'qr'; payload: { uid: string; channelId: string; qr: string } }
    | { type: 'ready'; payload: { uid: string; channelId: string } }
    | { type: 'status'; payload: { uid: string; channelId: string; state: 'connecting' | 'open' | 'closed' | 'reconnecting' } }
    | { type: 'message'; payload: { uid: string; channelId: string; from: string; text: string; ts: number; messageId?: string } }
    | { type: 'error'; payload: { uid: string; channelId: string; error: unknown } };

/**
 * 聊天连接器接口 - 所有通讯平台的基类
 * 支持 WhatsApp, Telegram, 以及未来的其他平台
 */
export interface ChatConnector extends EventEmitter {
    /**
     * 为用户启动连接器会话
     * @param uid - 用户唯一标识
     * @param channelId - 频道标识（多账号支持）
     */
    start(uid: string, channelId?: string): Promise<void>;

    /**
     * 停止用户的连接器会话
     * @param uid - 用户唯一标识
     * @param channelId - 频道标识（多账号支持）
     */
    stop(uid: string, channelId?: string): Promise<void>;

    /**
     * 发送消息
     * @param uid - 用户唯一标识
     * @param channelId - 频道标识（多账号支持）
     * @param to - 接收者标识（如电话号码、聊天ID等）
     * @param text - 消息文本内容
     */
    send(uid: string, channelId: string | undefined, to: string, text: string): Promise<void>;

    /**
     * 检查连接器是否就绪
     * @param uid - 用户唯一标识
     * @param channelId - 频道标识（多账号支持）
     * @returns 是否已连接且就绪
     */
    isReady(uid: string, channelId?: string): boolean;
}

export { EventEmitter };
