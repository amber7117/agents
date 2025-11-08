import express, { Router } from "express";
import { auth } from '../middleware/auth';
import { prisma } from '@pkg/db';
import { randomBytes } from 'crypto';
import { config } from '../config';


export const widgetRouter: Router = express.Router();


// 生成唯一的 publicKey
function generatePublicKey(): string {
    return `wid_${randomBytes(16).toString('hex')}`;
}

// 生成 secret
function generateSecret(): string {
    return randomBytes(32).toString('hex');
}

// 生成嵌入代码
function generateEmbedCode(publicKey: string, apiOrigin: string): string {
    return `<script>
  (function(w,d,s,u,k){
    w.LiveChatConfig = { api: u, key: k };
    var js=d.createElement(s); 
    js.src = u + '/widget/sdk.js'; 
    js.async=1;
    d.head.appendChild(js);
  })(window,document,'script','${apiOrigin}','${publicKey}');
</script>`;
}

// POST /widget - 创建或返回用户的 Widget
widgetRouter.post('/', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        // 检查是否已存在 - Try different possible model names
        let widget = await prisma.widget.findFirst({
            where: { userId },
        });

        if (!widget) {
            // 创建新 Widget - Try different possible model names
            widget = await prisma.widget.create({
                data: {
                    userId,
                    publicKey: generatePublicKey(),
                    allowedOrigins: [], // 改为空数组
                    name: 'Default Widget',
                },
            });
        }

        const apiOrigin = process.env.API_ORIGIN || `http://localhost:${config.port}`;
        const embedCode = generateEmbedCode(widget.publicKey, apiOrigin);

        res.json({
            widget,
            embedCode,
        });
    } catch (error) {
        console.error('Failed to create widget:', error);
        res.status(500).json({ error: 'Failed to create widget' });
    }
});

// GET /widget - 获取用户的 Widget
widgetRouter.get('/', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        const widget = await prisma.widget.findFirst({
            where: { userId },
        });

        if (!widget) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        const apiOrigin = process.env.API_ORIGIN || `http://localhost:${config.port}`;
        const embedCode = generateEmbedCode(widget.publicKey, apiOrigin);

        res.json({
            widget,
            embedCode,
        });
    } catch (error) {
        console.error('Failed to get widget:', error);
        res.status(500).json({ error: 'Failed to get widget' });
    }
});

// POST /widget/origins - 更新 allowedOrigins
widgetRouter.post('/origins', auth, async (req, res) => {
    try {
        const userId = req.user!.id;
        const { allowedOrigins } = req.body;

        if (typeof allowedOrigins !== 'string') {
            return res.status(400).json({ error: 'allowedOrigins must be a string' });
        }

        const widget = await prisma.widget.findFirst({
            where: { userId },
        });

        if (!widget) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        const updatedWidget = await prisma.widget.update({
            where: { id: widget.id },
            data: { allowedOrigins },
        });

        res.json({ widget: updatedWidget });
    } catch (error) {
        console.error('Failed to update origins:', error);
        res.status(500).json({ error: 'Failed to update origins' });
    }
});

// GET /widget/public/:publicKey - 验证 publicKey（公开接口）
widgetRouter.get('/public/:publicKey', async (req, res) => {
    try {
        const { publicKey } = req.params;

        const widget = await prisma.widget.findUnique({
            where: { publicKey },
            select: {
                id: true,
                publicKey: true,
                allowedOrigins: true,
                name: true,
            },
        });

        if (!widget) {
            return res.status(404).json({ error: 'Widget not found' });
        }

        res.json({ widget });
    } catch (error) {
        console.error('Failed to get public widget:', error);
        res.status(500).json({ error: 'Failed to get widget' });
    }
});