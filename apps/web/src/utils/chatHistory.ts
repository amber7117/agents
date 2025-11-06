// 聊天历史管理工具
export interface ChatMessage {
    id: string;
    from: string;
    text: string;
    timestamp: number;
    direction: 'incoming' | 'outgoing';
}

export interface ChatHistory {
    [contactId: string]: ChatMessage[];
}

class ChatHistoryManager {
    private storageKey = 'chat-history';
    private maxHistoryPerContact = 1000;

    constructor() {
        // 从设置中读取最大历史记录数
        const settings = this.getSettings();
        if (settings?.maxChatHistory) {
            this.maxHistoryPerContact = settings.maxChatHistory;
        }
    }

    private getSettings() {
        const settings = localStorage.getItem('user-settings');
        return settings ? JSON.parse(settings) : null;
    }

    // 获取所有聊天历史
    getAllHistory(): ChatHistory {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    // 获取特定联系人的聊天历史
    getContactHistory(contactId: string): ChatMessage[] {
        const allHistory = this.getAllHistory();
        return allHistory[contactId] || [];
    }

    // 添加新消息
    addMessage(contactId: string, message: Omit<ChatMessage, 'id'>) {
        const settings = this.getSettings();
        if (!settings?.autoSaveChats) {
            return; // 如果设置中关闭了自动保存，则不保存
        }

        const allHistory = this.getAllHistory();
        const contactHistory = allHistory[contactId] || [];

        const newMessage: ChatMessage = {
            ...message,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        contactHistory.push(newMessage);

        // 保持历史记录在限制范围内
        if (contactHistory.length > this.maxHistoryPerContact) {
            contactHistory.splice(0, contactHistory.length - this.maxHistoryPerContact);
        }

        allHistory[contactId] = contactHistory;
        localStorage.setItem(this.storageKey, JSON.stringify(allHistory));
    }

    // 获取所有有聊天记录的联系人
    getAllContacts(): string[] {
        const allHistory = this.getAllHistory();
        return Object.keys(allHistory);
    }

    // 删除特定联系人的聊天历史
    deleteContactHistory(contactId: string) {
        const allHistory = this.getAllHistory();
        delete allHistory[contactId];
        localStorage.setItem(this.storageKey, JSON.stringify(allHistory));
    }

    // 清除所有聊天历史
    clearAllHistory() {
        localStorage.removeItem(this.storageKey);
    }

    // 导出聊天历史
    exportHistory(): string {
        const allHistory = this.getAllHistory();
        return JSON.stringify(allHistory, null, 2);
    }

    // 导入聊天历史
    importHistory(data: string) {
        try {
            const parsedData = JSON.parse(data);
            localStorage.setItem(this.storageKey, JSON.stringify(parsedData));
            return true;
        } catch (error) {
            console.error('导入聊天历史失败:', error);
            return false;
        }
    }

    // 搜索聊天历史
    searchMessages(query: string, contactId?: string): ChatMessage[] {
        const allHistory = this.getAllHistory();
        const results: ChatMessage[] = [];

        const contactsToSearch = contactId ? [contactId] : Object.keys(allHistory);

        contactsToSearch.forEach(contact => {
            const messages = allHistory[contact] || [];
            messages.forEach(message => {
                if (message.text.toLowerCase().includes(query.toLowerCase())) {
                    results.push(message);
                }
            });
        });

        return results.sort((a, b) => b.timestamp - a.timestamp);
    }

    // 获取统计信息
    getStats() {
        const allHistory = this.getAllHistory();
        const contacts = Object.keys(allHistory);
        let totalMessages = 0;
        let oldestMessage = Date.now();
        let newestMessage = 0;

        contacts.forEach(contact => {
            const messages = allHistory[contact];
            totalMessages += messages.length;

            messages.forEach(message => {
                if (message.timestamp < oldestMessage) {
                    oldestMessage = message.timestamp;
                }
                if (message.timestamp > newestMessage) {
                    newestMessage = message.timestamp;
                }
            });
        });

        return {
            totalContacts: contacts.length,
            totalMessages,
            oldestMessage: oldestMessage === Date.now() ? null : new Date(oldestMessage),
            newestMessage: newestMessage === 0 ? null : new Date(newestMessage),
        };
    }
}

export const chatHistoryManager = new ChatHistoryManager();