import { api } from '../api';
import { tokenStore } from '../store';
class DatabaseSyncService {
    getAuthHeaders() {
        const token = tokenStore.token;
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    // 同步联系人到数据库
    async syncContacts(contacts) {
        try {
            const response = await api.post('/sync/contacts', { contacts }, { headers: this.getAuthHeaders() });
            return response.data;
        }
        catch (error) {
            console.error('联系人同步失败:', error);
            throw error;
        }
    }
    // 从数据库获取联系人
    async getContacts() {
        try {
            const response = await api.get('/sync/contacts', {
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('获取联系人失败:', error);
            throw error;
        }
    }
    // 同步聊天窗口到数据库
    async syncChats(chats) {
        try {
            const response = await api.post('/sync/chats', { chats }, { headers: this.getAuthHeaders() });
            return response.data;
        }
        catch (error) {
            console.error('聊天同步失败:', error);
            throw error;
        }
    }
    // 从数据库获取聊天窗口
    async getChats() {
        try {
            const response = await api.get('/sync/chats', {
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('获取聊天失败:', error);
            throw error;
        }
    }
    // 同步消息到数据库
    async syncMessages(messages) {
        try {
            const response = await api.post('/sync/messages', { messages }, { headers: this.getAuthHeaders() });
            return response.data;
        }
        catch (error) {
            console.error('消息同步失败:', error);
            throw error;
        }
    }
    // 获取特定聊天的消息
    async getChatMessages(chatId, page = 1, limit = 50) {
        try {
            const response = await api.get(`/sync/messages/${chatId}`, {
                params: { page, limit },
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('获取消息失败:', error);
            throw error;
        }
    }
    // 搜索消息
    async searchMessages(query, contactId, limit = 100) {
        try {
            const response = await api.get('/sync/messages', {
                params: { search: query, contactId, limit },
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('搜索消息失败:', error);
            throw error;
        }
    }
    // 获取统计信息
    async getStats() {
        try {
            const response = await api.get('/sync/stats', {
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('获取统计失败:', error);
            throw error;
        }
    }
    // 从WhatsApp数据自动同步（这个函数将在后端通过Baileys实现）
    async syncFromWhatsApp() {
        try {
            // 这里将触发后端从WhatsApp获取联系人和聊天列表
            const response = await api.post('/sync/from-whatsapp', {}, {
                headers: this.getAuthHeaders()
            });
            return response.data;
        }
        catch (error) {
            console.error('WhatsApp同步失败:', error);
            throw error;
        }
    }
    // 本地存储和数据库双重保存消息
    async saveMessage(contactWhatsappId, message) {
        const fullMessage = {
            ...message,
            contactWhatsappId
        };
        try {
            // 1. 保存到本地存储（立即生效）
            const localHistory = JSON.parse(localStorage.getItem('chat-history') || '{}');
            if (!localHistory[contactWhatsappId]) {
                localHistory[contactWhatsappId] = [];
            }
            localHistory[contactWhatsappId].push({
                id: Date.now().toString(),
                from: message.direction === 'INCOMING' ? contactWhatsappId : 'me',
                text: message.content,
                timestamp: new Date(message.sentAt).getTime(),
                direction: message.direction.toLowerCase()
            });
            localStorage.setItem('chat-history', JSON.stringify(localHistory));
            // 2. 异步保存到数据库
            this.syncMessages([fullMessage]).catch(console.error);
            return fullMessage;
        }
        catch (error) {
            console.error('保存消息失败:', error);
            throw error;
        }
    }
    // 合并本地存储和数据库的聊天记录
    async mergeLocalAndRemoteHistory() {
        try {
            const [localHistory, remoteChats] = await Promise.all([
                JSON.parse(localStorage.getItem('chat-history') || '{}'),
                this.getChats()
            ]);
            // 合并逻辑：以数据库为准，本地作为补充
            const merged = {};
            // 先加载数据库数据
            for (const chat of remoteChats) {
                const contactId = chat.contact.whatsappId;
                merged[contactId] = {
                    chat,
                    messages: [] // 消息将按需加载
                };
            }
            // 补充本地数据中数据库没有的联系人
            for (const contactId in localHistory) {
                if (!merged[contactId]) {
                    merged[contactId] = {
                        chat: null,
                        messages: localHistory[contactId]
                    };
                }
            }
            return merged;
        }
        catch (error) {
            console.error('合并历史记录失败:', error);
            return JSON.parse(localStorage.getItem('chat-history') || '{}');
        }
    }
}
export const dbSyncService = new DatabaseSyncService();
