import { io, Socket } from 'socket.io-client';

interface LiveChatConfig {
    api: string;
    key: string;
}

declare global {
    interface Window {
        LiveChatConfig?: LiveChatConfig;
        LiveChatWidget?: LiveChatWidget;
    }
}

class LiveChatWidget {
    private config: LiveChatConfig;
    private socket: Socket | null = null;
    private visitorId: string = '';
    private container: HTMLElement | null = null;
    private shadowRoot: ShadowRoot | null = null;
    private isOpen: boolean = false;
    private messages: Array<{ from: string; text: string; ts: string }> = [];

    constructor(config: LiveChatConfig) {
        this.config = config;
        this.visitorId = this.getOrCreateVisitorId();
    }

    private getOrCreateVisitorId(): string {
        const key = 'livechat_visitor_id';
        let id = localStorage.getItem(key);
        if (!id) {
            id = `visitor_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(key, id);
        }
        return id;
    }

    public init(): void {
        this.createUI();
        this.connect();
    }

    private createUI(): void {
        // 创建容器
        this.container = document.createElement('div');
        this.container.id = 'livechat-widget';
        document.body.appendChild(this.container);

        // 创建 Shadow DOM
        this.shadowRoot = this.container.attachShadow({ mode: 'open' });

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
      :host {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .chat-bubble {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .chat-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .chat-bubble svg {
        width: 32px;
        height: 32px;
        fill: white;
      }

      .chat-panel {
        display: none;
        flex-direction: column;
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 360px;
        height: 520px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        overflow: hidden;
      }

      .chat-panel.open {
        display: flex;
      }

      .chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chat-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .chat-header .close-btn {
        background: transparent;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .chat-header .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f7f8fa;
      }

      .message {
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
      }

      .message.visitor {
        align-items: flex-end;
      }

      .message.agent {
        align-items: flex-start;
      }

      .message-bubble {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 16px;
        word-wrap: break-word;
      }

      .message.visitor .message-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .message.agent .message-bubble {
        background: white;
        color: #333;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .message-time {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }

      .chat-input {
        border-top: 1px solid #e5e7eb;
        padding: 12px 16px;
        background: white;
        display: flex;
        gap: 8px;
      }

      .chat-input input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .chat-input input:focus {
        border-color: #667eea;
      }

      .chat-input button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 20px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .chat-input button:hover {
        opacity: 0.9;
      }

      .chat-input button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .status-text {
        text-align: center;
        padding: 8px;
        font-size: 12px;
        color: #666;
        background: #f0f0f0;
      }
    `;

        // 创建 HTML 结构
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
      <div class="chat-bubble" id="chat-bubble">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      </div>
      <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
          <h3>在线客服</h3>
          <button class="close-btn" id="close-btn">×</button>
        </div>
        <div id="status" class="status-text">正在连接...</div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input">
          <input type="text" id="message-input" placeholder="输入消息..." />
          <button id="send-btn">发送</button>
        </div>
      </div>
    `;

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(wrapper);

        // 绑定事件
        this.shadowRoot.getElementById('chat-bubble')?.addEventListener('click', () => {
            this.togglePanel();
        });

        this.shadowRoot.getElementById('close-btn')?.addEventListener('click', () => {
            this.togglePanel();
        });

        this.shadowRoot.getElementById('send-btn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        this.shadowRoot.getElementById('message-input')?.addEventListener('keypress', (e: Event) => {
            if ((e as KeyboardEvent).key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    private togglePanel(): void {
        this.isOpen = !this.isOpen;
        const panel = this.shadowRoot?.getElementById('chat-panel');
        if (panel) {
            if (this.isOpen) {
                panel.classList.add('open');
            } else {
                panel.classList.remove('open');
            }
        }
    }

    private connect(): void {
        const url = this.config.api;
        this.socket = io(`${url}/widget`, {
            query: {
                key: this.config.key,
                visitor: this.visitorId,
            },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('[LiveChat] Connected');
            this.updateStatus('已连接');
        });

        this.socket.on('disconnect', () => {
            console.log('[LiveChat] Disconnected');
            this.updateStatus('连接已断开');
        });

        this.socket.on('widget.welcome', (data: { visitorId: string; message: string }) => {
            console.log('[LiveChat] Welcome:', data);
            if (data.visitorId) {
                this.visitorId = data.visitorId;
                localStorage.setItem('livechat_visitor_id', data.visitorId);
            }
            this.updateStatus('');
        });

        this.socket.on('widget.message', (data: { text: string; ts: string; from: string }) => {
            console.log('[LiveChat] Message received:', data);
            this.addMessage('agent', data.text, data.ts);
        });

        this.socket.on('widget.error', (data: { error: string }) => {
            console.error('[LiveChat] Error:', data.error);
            this.updateStatus(`错误: ${data.error}`);
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error('[LiveChat] Connection error:', error);
            this.updateStatus('连接失败');
        });
    }

    private updateStatus(text: string): void {
        const status = this.shadowRoot?.getElementById('status');
        if (status) {
            if (text) {
                status.textContent = text;
                status.style.display = 'block';
            } else {
                status.style.display = 'none';
            }
        }
    }

    private sendMessage(): void {
        const input = this.shadowRoot?.getElementById('message-input') as HTMLInputElement;
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        if (!this.socket || !this.socket.connected) {
            alert('未连接到服务器');
            return;
        }

        // 发送消息
        this.socket.emit('widget.message', { text });

        // 添加到本地显示
        this.addMessage('visitor', text, new Date().toISOString());

        // 清空输入框
        input.value = '';
    }

    private addMessage(from: string, text: string, ts: string): void {
        this.messages.push({ from, text, ts });

        const container = this.shadowRoot?.getElementById('chat-messages');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${from}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date(ts).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.appendChild(bubble);
        messageEl.appendChild(time);
        container.appendChild(messageEl);

        // 滚动到底部
        container.scrollTop = container.scrollHeight;
    }
}

// 自动初始化
(function () {
    if (typeof window !== 'undefined' && window.LiveChatConfig) {
        const widget = new LiveChatWidget(window.LiveChatConfig);
        widget.init();
        window.LiveChatWidget = widget;
    }
})();

export default LiveChatWidget;
