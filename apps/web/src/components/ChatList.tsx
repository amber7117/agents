import { chatHistoryManager } from '../utils/chatHistory';
import { API_URL } from '../api';
import { tokenStore } from '../store';
import { metronicTheme } from '../theme/metronic-theme';

export function ChatList({
  chats,
  onPick,
  activeChat,
  onDelete
}: {
  chats: string[];
  onPick: (jid: string) => void;
  activeChat?: string | null;
  onDelete?: (jid: string) => void;
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
      width: '360px',
      borderRight: `1px solid ${metronicTheme.colors.gray200}`,
      background: metronicTheme.colors.gray100,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '24px',
        borderBottom: `1px solid ${metronicTheme.colors.gray200}`,
        background: metronicTheme.colors.white
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          margin: '0 0 8px',
          color: metronicTheme.colors.gray900,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '22px' }}>👥</span>
          <span>联系人列表</span>
        </h3>
        <p style={{
          color: metronicTheme.colors.gray600,
          fontSize: '13px',
          margin: 0,
          fontWeight: '500'
        }}>
          {chats.length > 0 ? `${chats.length} 个联系人` : '暂无联系人'}
        </p>
      </div>

      {/* 聊天列表 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px'
      }}>
        {chats.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: metronicTheme.colors.gray500
          }}>
            <div style={{
              fontSize: '56px',
              marginBottom: '20px',
              opacity: 0.6
            }}>💬</div>
            <p style={{
              fontSize: '15px',
              margin: 0,
              color: metronicTheme.colors.gray600,
              lineHeight: '1.6'
            }}>
              还没有任何聊天记录
              <br />
              等待消息到达...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chats.map(c => {
              const handleDelete = async (e: React.MouseEvent) => {
                e.stopPropagation(); // 防止触发选中聊天

                if (!confirm(`确定要删除与 ${formatJid(c)} 的聊天记录吗？\n此操作将同时从 WhatsApp 和本地删除。`)) {
                  return;
                }

                try {
                  const response = await fetch(`${API_URL}/channels/wa/chats/${encodeURIComponent(c)}?channelId=default`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${tokenStore.token}`
                    }
                  });

                  if (response.ok) {
                    console.log('✅ Chat deleted successfully');
                    onDelete?.(c);
                  } else {
                    const error = await response.json();
                    alert(`删除失败: ${error.message || '未知错误'}`);
                  }
                } catch (error) {
                  console.error('删除聊天失败:', error);
                  alert('删除失败，请稍后重试');
                }
              };

              return (
                <div
                  key={c}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    gap: '8px'
                  }}
                >
                  <button
                    onClick={() => onPick(c)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      background: activeChat === c ?
                        metronicTheme.colors.white :
                        metronicTheme.colors.gray100,
                      border: activeChat === c ?
                        `2px solid ${metronicTheme.colors.primary}` :
                        `1px solid ${metronicTheme.colors.gray200}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: activeChat === c ?
                        `0 0 0 3px ${metronicTheme.colors.primary}20` :
                        'none'
                    }}
                    onMouseOver={(e) => {
                      if (activeChat !== c) {
                        e.currentTarget.style.background = metronicTheme.colors.white;
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeChat !== c) {
                        e.currentTarget.style.background = metronicTheme.colors.gray100;
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* 头像 */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: metronicTheme.colors.white,
                      flexShrink: 0
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
                          fontSize: '15px',
                          fontWeight: '600',
                          color: activeChat === c ? metronicTheme.colors.gray900 : metronicTheme.colors.gray800,
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
                              color: metronicTheme.colors.gray500,
                              marginLeft: '8px',
                              fontWeight: '500'
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
                          fontSize: '13px',
                          color: metronicTheme.colors.gray600,
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
                              background: metronicTheme.colors.primary,
                              color: metronicTheme.colors.white,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              marginLeft: '8px',
                              fontWeight: '600',
                              minWidth: '24px',
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
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: metronicTheme.colors.success,
                        boxShadow: `0 0 8px ${metronicTheme.colors.success}`
                      }}></div>
                    )}
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={handleDelete}
                    style={{
                      width: '44px',
                      height: '44px',
                      padding: '0',
                      background: `${metronicTheme.colors.danger}15`,
                      border: `1px solid ${metronicTheme.colors.danger}30`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      alignSelf: 'center',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = `${metronicTheme.colors.danger}25`;
                      e.currentTarget.style.borderColor = `${metronicTheme.colors.danger}50`;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = `${metronicTheme.colors.danger}15`;
                      e.currentTarget.style.borderColor = `${metronicTheme.colors.danger}30`;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="删除聊天"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加联系人按钮 */}
      <div style={{
        padding: '20px',
        borderTop: `1px solid ${metronicTheme.colors.gray200}`,
        background: metronicTheme.colors.white
      }}>
        <button
          onClick={() => {
            const jid = prompt('请输入联系人的 JID (格式: 6012xxxx@s.whatsapp.net):');
            if (jid && jid.includes('@')) {
              onPick(jid);
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
            color: metronicTheme.colors.white,
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 12px ${metronicTheme.colors.primary}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 16px ${metronicTheme.colors.primary}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${metronicTheme.colors.primary}30`;
          }}
        >
          <span style={{ fontSize: '18px' }}>➕</span>
          <span>添加联系人</span>
        </button>
      </div>
    </div>
  );
}