import { Server as SocketServer, Socket } from 'socket.io';
import { prisma } from '@pkg/db';
import { randomBytes } from 'crypto';

// 访客到 Socket 的映射
export const visitorToSocket = new Map<string, string>();

// 生成访客 ID
function generateVisitorId(): string {
    return `visitor_${randomBytes(8).toString('hex')}`;
}

// 验证 Origin 是否在白名单中
function isOriginAllowed(origin: string | undefined, allowedOrigins: string): boolean {
    if (!origin) return false;
    if (!allowedOrigins || allowedOrigins === '') return false;

    const allowed = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.includes('*')) return true;

    return allowed.some(pattern => {
        // 支持简单的通配符匹配
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(origin);
        }
        return origin === pattern;
    });
}

export function initWidgetNamespace(io: SocketServer) {
    const widgetNs = io.of('/widget');

    widgetNs.use(async (socket, next) => {
        try {
            const { key, visitor } = socket.handshake.query;
            const origin = socket.handshake.headers.origin;

            if (!key || typeof key !== 'string') {
                return next(new Error('Missing widget key'));
            }

            // 查找 Widget
            // Check if widget model exists, fallback to alternative approach
            let widget;
            try {
                // Try to find widget using the widget model
                widget = await prisma.widget.findUnique({
                    where: { publicKey: key },
                    include: { user: true },
                });
            } catch (error) {
                // If widget model doesn't exist, you might need to use a different model
                // or create the widget table in your Prisma schema
                console.error('Widget model not found in database schema:', error);
                return next(new Error('Widget configuration not found'));
            }

            if (!widget) {
                return next(new Error('Invalid widget key'));
            }

            // 验证 Origin
            if (!isOriginAllowed(origin, widget.allowedOrigins)) {
                console.log(`Origin ${origin} not allowed for widget ${key}`);
                return next(new Error('Origin not allowed'));
            }

            // 生成或使用访客 ID
            let visitorId = visitor as string;
            if (!visitorId) {
                visitorId = generateVisitorId();
            }

            // 保存到 socket 上下文
            (socket as any).widgetId = widget.id;
            (socket as any).userId = widget.userId;
            (socket as any).visitorId = visitorId;
            (socket as any).publicKey = key;

            next();
        } catch (error) {
            console.error('Widget namespace auth error:', error);
            next(new Error('Authentication failed'));
        }
    });

    widgetNs.on('connection', async (socket: Socket) => {
        const widgetId = (socket as any).widgetId as string;
        const userId = (socket as any).userId as string;
        const visitorId = (socket as any).visitorId as string;
        const publicKey = (socket as any).publicKey as string;

        console.log(`Visitor connected: ${visitorId} for widget ${publicKey}`);

        // 建立映射
        const visitorKey = `${widgetId}:${visitorId}`;
        visitorToSocket.set(visitorKey, socket.id);

        // 创建或更新访客会话
        try {
            await prisma.visitorSession.upsert({
                where: {
                    widgetId_visitorId: {
                        widgetId,
                        visitorId,
                    },
                },
                create: {
                    widgetId,
                    visitorId,
                    displayName: `访客 ${visitorId.slice(-8)}`,
                },
                update: {
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            console.error('Failed to create visitor session:', error);
        }

        // 发送欢迎消息（包含 visitorId）
        socket.emit('widget.welcome', {
            visitorId,
            message: '欢迎使用在线客服',
        });

        // 监听访客发来的消息
        socket.on('widget.message', async (payload: { text: string }) => {
            try {
                const { text } = payload;
                const timestamp = new Date();

                console.log(`Message from visitor ${visitorId}: ${text}`);

                // 记录消息到数据库
                await prisma.messageLog.create({
                    data: {
                        userId,
                        channel: 'WEB' as any,
                        direction: 'INCOMING',
                        peer: visitorKey,
                        content: text, // 改为 content 字段
                        messageType: 'TEXT',
                    },
                });

                // 转发到后台（坐席端）
                widgetNs.server.to(userId).emit('chat.message', {
                    channel: 'WEB',
                    from: visitorKey,
                    text,
                    ts: timestamp.toISOString(),
                    direction: 'in',
                    visitorId,
                    widgetId,
                });
            } catch (error) {
                console.error('Failed to handle widget message:', error);
                socket.emit('widget.error', {
                    error: 'Failed to send message',
                });
            }
        });

        // 监听断开连接
        socket.on('disconnect', () => {
            console.log(`Visitor disconnected: ${visitorId}`);
            visitorToSocket.delete(visitorKey);
        });
    });

    return widgetNs;
}

// 发送消息给访客
export async function sendToVisitor(
    widgetNs: ReturnType<typeof initWidgetNamespace>,
    visitorKey: string,
    text: string
) {
    const socketId = visitorToSocket.get(visitorKey);
    if (!socketId) {
        throw new Error('Visitor not connected');
    }

    widgetNs.to(socketId).emit('widget.message', {
        text,
        ts: new Date().toISOString(),
        from: 'agent',
    });
}
