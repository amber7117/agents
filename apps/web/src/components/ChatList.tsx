import { chatHistoryManager } from '../utils/chatHistory';

export function ChatList({ 
  chats, 
  onPick, 
  activeChat 
}: { 
  chats: string[]; 
  onPick: (jid: string) => void; 
  activeChat?: string | null; 
}) {
  const formatJid = (jid: string) => {
    // 简化JID显示，只显示号码部分
    const phoneNumber = jid.split('@')[0];
    if (phoneNumber.length > 10) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
    return phoneNumber;
  };

  const getInitials = (jid: string) => {
    const phoneNumber = jid.split('@')[0];
    return phoneNumber.slice(-2).toUpperCase();
  };

  const getLastMessage = (jid: string) => {
    const history = chatHistoryManager.getContactHistory(jid);
    if (history.length === 0) return null;
    
    const lastMessage = history[history.length - 1];
    return {
      text: lastMessage.text.length > 30 
        ? lastMessage.text.substring(0, 30) + '...' 
        : lastMessage.text,
      time: new Date(lastMessage.timestamp).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      count: history.length
    };
  };

  return (
    <div style={{
      width: '320px',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(255, 255, 255, 0.02)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 8px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          👥 联系人列表
        </h3>
        <p style={{
          color: '#b3b3b3',
          fontSize: '14px',
          margin: 0
        }}>
          {chats.length > 0 ? `${chats.length} 个联系人` : '暂无联系人'}
        </p>
      </div>

      {/* 聊天列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px'
      }}>
        {chats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#808080'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '14px', margin: 0 }}>
              还没有任何聊天记录
              <br />
              等待消息到达...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chats.map(c => (
              <button
                key={c}
                onClick={() => onPick(c)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: activeChat === c ? 
                    'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' : 
                    'rgba(255, 255, 255, 0.05)',
                  border: activeChat === c ? 
                    '1px solid rgba(102, 126, 234, 0.4)' : 
                    '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseOver={(e) => {
                  if (activeChat !== c) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }
                }}
                onMouseOut={(e) => {
                  if (activeChat !== c) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                {/* 头像 */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  {getInitials(c)}
                </div>
                
                {/* 信息 */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {formatJid(c)}
                    </div>
                    {(() => {
                      const lastMsg = getLastMessage(c);
                      return lastMsg && (
                        <div style={{
                          fontSize: '11px',
                          color: '#808080',
                          marginLeft: '8px'
                        }}>
                          {lastMsg.time}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: '#b3b3b3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {(() => {
                        const lastMsg = getLastMessage(c);
                        return lastMsg ? lastMsg.text : c;
                      })()}
                    </div>
                    {(() => {
                      const lastMsg = getLastMessage(c);
                      return lastMsg && lastMsg.count > 0 && (
                        <div style={{
                          background: 'rgba(102, 126, 234, 0.3)',
                          color: '#667eea',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          marginLeft: '8px',
                          fontWeight: '500',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {lastMsg.count}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 在线状态指示器 */}
                {activeChat === c && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#4facfe'
                  }}></div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 添加联系人按钮 */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            const jid = prompt('请输入联系人的 JID (格式: 6012xxxx@s.whatsapp.net):');
            if (jid && jid.includes('@')) {
              onPick(jid);
            }
          }}
          style={{
            width: '100%',
            fontSize: '14px'
          }}
        >
          ➕ 添加联系人
        </button>
      </div>
    </div>
  );
}