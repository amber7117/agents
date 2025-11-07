import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../api';
import { tokenStore } from '../store';
import { ChatList } from '../components/ChatList';
import { MessagePane } from '../components/MessagePane';
import { ChatSearch } from '../components/ChatSearch';
import { useNavigate } from 'react-router-dom';
import { chatHistoryManager } from '../utils/chatHistory';
import { dbSyncService } from '../services/dbSync';
export default function Chat() {
    const [sock, setSock] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState([]);
    const [active, setActive] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const nav = useNavigate();
    // 检查登录状态
    useEffect(() => {
        if (!tokenStore.token) {
            nav('/login');
            return;
        }
    }, [nav]);
    // 初始化时加载聊天历史（本地+数据库）
    useEffect(() => {
        const loadChatsHistory = async () => {
            setIsLoadingChats(true);
            try {
                // 1. 从数据库获取聊天
                const dbChats = await dbSyncService.getChats();
                const dbChatIds = dbChats.map((chat) => chat.contact.whatsappId);
                // 2. 从本地存储获取聊天
                const localContacts = chatHistoryManager.getAllContacts();
                // 3. 合并去重
                const allChats = Array.from(new Set([...dbChatIds, ...localContacts]));
                setChats(allChats);
            }
            catch (error) {
                console.error('加载聊天历史失败:', error);
                // 回退到本地存储
                const savedContacts = chatHistoryManager.getAllContacts();
                setChats(savedContacts);
            }
            finally {
                setIsLoadingChats(false);
            }
        };
        loadChatsHistory();
    }, []);
    // 当选择联系人时加载历史消息（本地+数据库）
    useEffect(() => {
        const loadContactHistory = async () => {
            if (!active) {
                setMessages([]);
                return;
            }
            // 立即清空消息，防止显示其他联系人的消息
            setMessages([]);
            try {
                // 1. 从本地存储获取消息（快速显示）
                const localHistory = chatHistoryManager.getContactHistory(active);
                const localMessages = localHistory.map(msg => ({
                    from: msg.from, // 保持原始的 from 字段
                    text: msg.text,
                    ts: msg.timestamp
                }));
                console.log(`[Debug] 加载联系人 ${active} 的本地消息:`, localMessages);
                setMessages(localMessages);
                // 2. 尝试从数据库获取更完整的历史（异步更新）
                try {
                    const dbChats = await dbSyncService.getChats();
                    const targetChat = dbChats.find((chat) => chat.contact.whatsappId === active);
                    if (targetChat) {
                        const dbMessages = await dbSyncService.getChatMessages(targetChat.id);
                        const formattedDbMessages = dbMessages.messages.map((msg) => ({
                            from: msg.direction === 'INCOMING' ? msg.sender?.whatsappId || active : 'me',
                            text: msg.content,
                            ts: new Date(msg.sentAt).getTime()
                        }));
                        // 合并并去重消息（以数据库为准）
                        setMessages(formattedDbMessages.length > 0 ? formattedDbMessages : localMessages);
                    }
                }
                catch (dbError) {
                    console.log('数据库获取失败，使用本地历史:', dbError);
                }
            }
            catch (error) {
                console.error('加载联系人历史失败:', error);
            }
        };
        loadContactHistory();
    }, [active]);
    useEffect(() => {
        if (!tokenStore.token)
            return;
        const s = io(API_URL, { auth: { token: tokenStore.token } });
        s.on('connect', () => {
            setConnectionStatus('connected');
        });
        s.on('disconnect', () => {
            setConnectionStatus('disconnected');
        });
        s.on('wa.message', async (m) => {
            // 保存到本地历史记录
            chatHistoryManager.addMessage(m.from, {
                from: m.from,
                text: m.text,
                timestamp: m.ts,
                direction: 'incoming'
            });
            // 异步保存到数据库
            dbSyncService.saveMessage(m.from, {
                direction: 'INCOMING',
                content: m.text,
                sentAt: new Date(m.ts).toISOString()
            }).catch(console.error);
            // 只有当前激活的聊天才更新UI
            if (active === m.from) {
                console.log(`[Debug] 接收到来自 ${m.from} 的消息:`, m);
                // 确保消息的 from 字段正确设置为发送方
                const incomingMessage = {
                    from: m.from, // 保持原始发送方
                    text: m.text,
                    ts: m.ts
                };
                setMessages(prev => {
                    const newMessages = [...prev, incomingMessage];
                    console.log(`[Debug] 接收消息后的消息列表:`, newMessages);
                    return newMessages;
                });
            }
            // 更新联系人列表
            if (!chats.includes(m.from)) {
                setChats(prev => Array.from(new Set([...prev, m.from])));
            }
        });
        setSock(s);
        return () => {
            s.close();
        };
    }, [active, chats]);
    const send = async (text) => {
        if (!active) {
            alert('请选择一个联系人 (JID 格式如: 6012xxxx@s.whatsapp.net)');
            return;
        }
        if (!text.trim())
            return;
        sock?.emit('wa.send', { to: active, text });
        const timestamp = Date.now();
        // 保存到本地历史记录
        chatHistoryManager.addMessage(active, {
            from: 'me',
            text,
            timestamp,
            direction: 'outgoing'
        });
        // 异步保存到数据库
        dbSyncService.saveMessage(active, {
            direction: 'OUTGOING',
            content: text,
            sentAt: new Date(timestamp).toISOString()
        }).catch(console.error);
        // 添加发送的消息到本地显示
        const newMessage = {
            from: 'me',
            text,
            ts: timestamp
        };
        console.log(`[Debug] 发送消息到 ${active}:`, newMessage);
        setMessages(prev => {
            const newMessages = [...prev, newMessage];
            console.log(`[Debug] 更新后的消息列表:`, newMessages);
            return newMessages;
        });
    };
    const handleSyncFromWhatsApp = async () => {
        try {
            await dbSyncService.syncFromWhatsApp();
            alert('同步请求已发送，数据将在后台更新');
            // 重新加载聊天列表
            window.location.reload();
        }
        catch (error) {
            console.error('同步失败:', error);
            alert('同步失败，请稍后再试');
        }
    };
    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return '#4facfe';
            case 'connecting': return '#ffecd2';
            default: return '#ff9a9e';
        }
    };
    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return '已连接';
            case 'connecting': return '连接中';
            default: return '已断开';
        }
    };
    return (_jsxs("div", { style: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
        }, children: [_jsxs("div", { style: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }, children: [_jsx("div", { style: {
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                }, children: "\uD83D\uDCAC" }), _jsxs("div", { children: [_jsx("h2", { style: {
                                            fontSize: '22px',
                                            fontWeight: '600',
                                            margin: '0 0 4px',
                                            color: '#ffffff'
                                        }, children: "WhatsApp \u804A\u5929" }), _jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }, children: [_jsx("div", { style: {
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: getConnectionStatusColor()
                                                } }), _jsx("span", { style: {
                                                    color: getConnectionStatusColor(),
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }, children: getConnectionStatusText() }), connectionStatus === 'connecting' && (_jsx("div", { className: "loading", style: { marginLeft: '4px' } }))] })] })] }), _jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }, children: [_jsx("div", { style: { width: '280px' }, children: _jsx(ChatSearch, { onSelectContact: setActive }) }), _jsxs("span", { style: {
                                    color: '#b3b3b3',
                                    fontSize: '14px',
                                    padding: '8px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px'
                                }, children: ["\uD83D\uDCCA ", chats.length, " \u4E2A\u804A\u5929"] }), _jsx("button", { onClick: handleSyncFromWhatsApp, style: {
                                    padding: '10px 18px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                    transition: 'all 0.3s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                                }, title: "\u4ECEWhatsApp\u540C\u6B65\u8054\u7CFB\u4EBA\u548C\u804A\u5929\u8BB0\u5F55", children: "\uD83D\uDCF1 \u540C\u6B65\u6570\u636E" }), _jsx("button", { onClick: () => window.location.reload(), style: {
                                    padding: '10px 14px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '10px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }, title: "\u5237\u65B0\u9875\u9762", children: "\uD83D\uDD04" })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    gap: '20px',
                    flex: 1,
                    minHeight: 0,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }, children: [_jsx(ChatList, { chats: chats, onPick: setActive, activeChat: active }), _jsx(MessagePane, { jid: active, messages: messages, onSend: send, connectionStatus: connectionStatus })] })] }));
}
