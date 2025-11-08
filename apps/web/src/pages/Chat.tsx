import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api';
import { tokenStore } from '../store';
import { ChatList } from '../components/ChatList';
import { MessagePane } from '../components/MessagePane';
import { ChatSearch } from '../components/ChatSearch';
import { useNavigate } from 'react-router-dom';
import { chatHistoryManager, ChatMessage } from '../utils/chatHistory';
import { dbSyncService } from '../services/dbSync';
import { metronicTheme } from '../theme/metronic-theme';

// 扩展消息类型，包含频道信息
interface ExtendedMessage {
  from: string;
  text: string;
  ts: number;
  channel?: 'WA' | 'TG' | 'WEB';
  channelId?: string;
}

export default function Chat() {
  const [sock, setSock] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [chats, setChats] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
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
      if (!tokenStore.token) return; // 确保有 token 才加载

      setIsLoadingChats(true);
      try {
        // 1. 从数据库获取聊天
        const dbChats = await dbSyncService.getChats();
        const dbChatIds = dbChats.map((chat: any) => chat.contact.whatsappId);

        // 2. 从本地存储获取聊天
        const localContacts = chatHistoryManager.getAllContacts();

        // 3. 合并去重
        const allChats = Array.from(new Set([...dbChatIds, ...localContacts]));
        setChats(allChats);
      } catch (error: any) {
        console.error('加载聊天历史失败:', error);
        // 如果是 401 错误，不做额外处理（拦截器会处理）
        // 其他错误则回退到本地存储
        if (error.response?.status !== 401) {
          const savedContacts = chatHistoryManager.getAllContacts();
          setChats(savedContacts);
        }
      } finally {
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
          const targetChat = dbChats.find((chat: any) => chat.contact.whatsappId === active);

          if (targetChat) {
            const dbMessages = await dbSyncService.getChatMessages(targetChat.id);
            const formattedDbMessages = dbMessages.messages.map((msg: any) => ({
              from: msg.direction === 'INCOMING' ? msg.sender?.whatsappId || active : 'me',
              text: msg.content,
              ts: new Date(msg.sentAt).getTime()
            }));

            // 合并并去重消息（以数据库为准）
            setMessages(formattedDbMessages.length > 0 ? formattedDbMessages : localMessages);
          }
        } catch (dbError) {
          console.log('数据库获取失败，使用本地历史:', dbError);
        }
      } catch (error) {
        console.error('加载联系人历史失败:', error);
      }
    };

    loadContactHistory();
  }, [active]);

  // Socket.IO 连接（只在组件挂载时创建一次）
  useEffect(() => {
    if (!tokenStore.token) return;

    console.log('🔌 [Chat] Initializing Socket.IO connection...');
    const s = io(API_URL, { auth: { token: tokenStore.token } });

    s.on('connect', () => {
      console.log('✅ [Chat] Connected to server, socket ID:', s.id);
      setConnectionStatus('connected');
    });

    s.on('disconnect', () => {
      console.log('❌ [Chat] Disconnected from server');
      setConnectionStatus('disconnected');
    });

    s.on('connect_error', (error) => {
      console.error('❌ [Chat] Connection error:', error);
    });

    // 监听统一的 chat.message 事件（包含频道信息）
    s.on('chat.message', async (m: {
      channel: 'WA' | 'TG' | 'WEB';
      from: string;
      text: string;
      ts: number;
      direction: 'in' | 'out';
      channelId?: string;
    }) => {
      console.log(`📨 [Chat] Received ${m.channel} message:`, {
        channel: m.channel,
        from: m.from,
        text: m.text ? (m.text.substring(0, 30) + (m.text.length > 30 ? '...' : '')) : '[empty]',
        ts: m.ts,
        channelId: m.channelId
      });

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

      // 创建消息对象
      const incomingMessage: ExtendedMessage = {
        from: m.from,
        text: m.text,
        ts: m.ts,
        channel: m.channel,
        channelId: m.channelId
      };

      // 更新消息列表 - 使用 ref 来访问最新的 active 状态
      setActive(currentActive => {
        console.log(`🔍 [Chat] Current active: ${currentActive}, message from: ${m.from}`);

        if (currentActive === m.from) {
          console.log(`✅ [Chat] Adding message to active chat`);
          setMessages(currentMessages => [...currentMessages, incomingMessage]);
        } else {
          console.log(`ℹ️ [Chat] Message from ${m.from}, but active chat is ${currentActive || 'none'}`);
        }

        return currentActive; // 返回不变的 active 值
      });

      // 更新联系人列表
      setChats(prev => {
        if (!prev.includes(m.from)) {
          return Array.from(new Set([...prev, m.from]));
        }
        return prev;
      });
    });

    // 保留兼容旧的 wa.message 事件
    s.on('wa.message', async (m: { channelId: string; from: string; text: string; ts: number }) => {
      console.log(`📨 [Chat] Received legacy WA message from ${m.from}`);

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

      // 创建消息对象
      const incomingMessage: ExtendedMessage = {
        from: m.from,
        text: m.text,
        ts: m.ts,
        channel: 'WA',
        channelId: m.channelId
      };

      // 更新消息列表 - 使用相同的模式
      setActive(currentActive => {
        console.log(`🔍 [Chat] (wa.message) Current active: ${currentActive}, message from: ${m.from}`);

        if (currentActive === m.from) {
          console.log(`✅ [Chat] (wa.message) Adding message to active chat`);
          setMessages(currentMessages => [...currentMessages, incomingMessage]);
        } else {
          console.log(`ℹ️ [Chat] (wa.message) Message from ${m.from}, but active chat is ${currentActive || 'none'}`);
        }

        return currentActive; // 返回不变的 active 值
      });

      // 更新联系人列表
      setChats(prev => {
        if (!prev.includes(m.from)) {
          return Array.from(new Set([...prev, m.from]));
        }
        return prev;
      });
    });

    // 监听 WhatsApp 连接完成事件，自动同步聊天记录和联系人
    s.on('wa.connected', async (payload: { channelId: string; phoneNumber?: string }) => {
      console.log('✅ [Chat] WhatsApp connected! Syncing chats and contacts...', payload);

      try {
        // 调用同步 API 获取所有聊天记录
        const response = await fetch(`${API_URL}/sync/chats`, {
          headers: { Authorization: `Bearer ${tokenStore.token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`📥 [Chat] Synced ${data.length} chats from server`);

          // 提取联系人列表并更新
          const contactIds = data.map((chat: any) => chat.contact.whatsappId);
          setChats(prev => {
            const combined = Array.from(new Set([...prev, ...contactIds]));
            console.log(`📇 [Chat] Updated contact list: ${combined.length} contacts`);
            return combined;
          });
        } else {
          console.error('❌ [Chat] Failed to sync chats:', response.status);
        }
      } catch (error) {
        console.error('❌ [Chat] Error syncing chats:', error);
      }
    });

    setSock(s);

    return () => {
      console.log('🔌 [Chat] Closing Socket.IO connection');
      s.close();
    };
  }, []); // 空依赖数组 - 只在组件挂载时创建一次

  const send = async (text: string) => {
    if (!active) {
      alert('请选择一个联系人 (JID 格式如: 6012xxxx@s.whatsapp.net)');
      return;
    }
    if (!text.trim()) return;

    // 发送消息，使用默认频道
    sock?.emit('wa.send', { channelId: 'default', to: active, text });

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
    } catch (error) {
      console.error('同步失败:', error);
      alert('同步失败，请稍后再试');
    }
  };

  const handleDeleteChat = (jid: string) => {
    // 从聊天列表中移除
    setChats(prev => prev.filter(c => c !== jid));

    // 如果删除的是当前活跃聊天，清空选中
    if (active === jid) {
      setActive(null);
      setMessages([]);
    }

    // 清理本地历史记录
    chatHistoryManager.deleteContactHistory(jid);
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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '0'
    }}>
      {/* 页面标题栏 */}
      <div style={{
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
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}>
            💬
          </div>
          <div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: '0 0 4px',
              color: '#ffffff'
            }}>
              WhatsApp 聊天
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getConnectionStatusColor()
              }}></div>
              <span style={{
                color: getConnectionStatusColor(),
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {getConnectionStatusText()}
              </span>
              {connectionStatus === 'connecting' && (
                <div className="loading" style={{ marginLeft: '4px' }}></div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* 搜索框 */}
          <div style={{ width: '280px' }}>
            <ChatSearch onSelectContact={setActive} />
          </div>

          <span style={{
            color: '#b3b3b3',
            fontSize: '14px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            📊 {chats.length} 个聊天
          </span>

          <button
            onClick={handleSyncFromWhatsApp}
            style={{
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
            title="从WhatsApp同步联系人和聊天记录"
          >
            📱 同步数据
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            title="刷新页面"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 聊天界面 */}
      {/* 聊天界面 */}
      <div style={{
        display: 'flex',
        gap: '0',
        flex: 1,
        minHeight: 0,
        background: metronicTheme.colors.white,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <ChatList chats={chats} onPick={setActive} activeChat={active} onDelete={handleDeleteChat} />
        <MessagePane
          jid={active}
          messages={messages}
          onSend={send}
          connectionStatus={connectionStatus}
        />
      </div>
    </div>
  );
}
