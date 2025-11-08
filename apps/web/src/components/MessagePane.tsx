import { useState, useRef, useEffect } from 'react';
import { metronicTheme } from '../theme/metronic-theme';

// 扩展消息类型，包含频道信息
interface ExtendedMessage {
  from: string;
  text: string;
  ts: number;
  channel?: 'WA' | 'TG' | 'WEB';
  channelId?: string;
}

export function MessagePane({
  jid,
  messages,
  onSend,
  connectionStatus = 'connected'
}: {
  jid: string | null;
  messages: ExtendedMessage[];
  onSend: (t: string) => void;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !jid) return;
    onSend(inputText);
    setInputText('');
  };

  const formatJid = (jid: string) => {
    const phoneNumber = jid.split('@')[0];
    if (phoneNumber.length > 10) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
    return phoneNumber;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 获取频道图标和颜色
  const getChannelIcon = (channel?: 'WA' | 'TG' | 'WEB') => {
    switch (channel) {
      case 'WA': return { icon: '📱', color: '#25D366', name: 'WhatsApp' };
      case 'TG': return { icon: '✈️', color: '#0088cc', name: 'Telegram' };
      case 'WEB': return { icon: '🌐', color: '#667eea', name: 'Web' };
      default: return { icon: '💬', color: '#808080', name: 'Unknown' };
    }
  };

  if (!jid) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: metronicTheme.colors.white
      }}>
        <div style={{
          textAlign: 'center',
          color: metronicTheme.colors.gray600
        }}>
          <div style={{
            fontSize: '80px',
            marginBottom: '24px',
            opacity: 0.5
          }}>💬</div>
          <h3 style={{
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 12px',
            color: metronicTheme.colors.gray900
          }}>
            选择一个聊天
          </h3>
          <p style={{
            fontSize: '15px',
            margin: 0,
            color: metronicTheme.colors.gray600,
            lineHeight: '1.6'
          }}>
            从左侧列表选择联系人开始聊天
            <br />
            或点击"添加联系人"开始新对话
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: metronicTheme.colors.white
    }}>
      {/* 聊天头部 */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${metronicTheme.colors.gray200}`,
        background: metronicTheme.colors.gray100,
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '700',
          color: metronicTheme.colors.white,
          flexShrink: 0
        }}>
          {jid.split('@')[0].slice(-2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '17px',
            fontWeight: '700',
            margin: '0 0 4px',
            color: metronicTheme.colors.gray900
          }}>
            {formatJid(jid)}
          </h3>
          <div style={{
            fontSize: '13px',
            color: metronicTheme.colors.gray600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connectionStatus === 'connected' ? metronicTheme.colors.success : metronicTheme.colors.danger,
              boxShadow: connectionStatus === 'connected' ? `0 0 8px ${metronicTheme.colors.success}` : 'none'
            }}></div>
            {connectionStatus === 'connected' ? '在线' : '离线'}
          </div>
        </div>
        <button
          style={{
            padding: '10px 16px',
            background: metronicTheme.colors.white,
            border: `1px solid ${metronicTheme.colors.gray300}`,
            borderRadius: '10px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: metronicTheme.colors.gray700,
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = metronicTheme.colors.gray100;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = metronicTheme.colors.white;
          }}
        >
          <span style={{ fontSize: '16px' }}>⚙️</span>
          <span>设置</span>
        </button>
      </div>

      {/* 消息区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: metronicTheme.colors.gray100
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: metronicTheme.colors.gray600,
            padding: '60px 20px'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              opacity: 0.5
            }}>📱</div>
            <p style={{
              fontSize: '15px',
              margin: 0,
              lineHeight: '1.6'
            }}>
              还没有消息记录
              <br />
              发送第一条消息开始对话
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const channelInfo = getChannelIcon(m.channel);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start',
                  marginBottom: '8px'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  background: m.from === 'me' ?
                    `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)` :
                    metronicTheme.colors.white,
                  color: m.from === 'me' ? metronicTheme.colors.white : metronicTheme.colors.gray900,
                  padding: '14px 18px',
                  borderRadius: '16px',
                  borderBottomRightRadius: m.from === 'me' ? '4px' : '16px',
                  borderBottomLeftRadius: m.from === 'me' ? '16px' : '4px',
                  boxShadow: m.from === 'me' ?
                    `0 4px 12px ${metronicTheme.colors.primary}30` :
                    '0 2px 8px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  border: m.from === 'me' ? 'none' : `1px solid ${metronicTheme.colors.gray200}`
                }}>
                  {/* 频道标识（仅显示在接收的消息上） */}
                  {m.from !== 'me' && m.channel && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      borderBottom: `1px solid ${metronicTheme.colors.gray200}`
                    }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: channelInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {channelInfo.icon}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: metronicTheme.colors.gray600,
                        fontWeight: '600'
                      }}>
                        来自 {channelInfo.name}
                      </span>
                    </div>
                  )}
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    {m.text}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: m.from === 'me' ? 'rgba(255, 255, 255, 0.8)' : metronicTheme.colors.gray500,
                    marginTop: '6px',
                    textAlign: 'right',
                    fontWeight: '500'
                  }}>
                    {formatTime(m.ts)}
                    {m.from === 'me' && (
                      <span style={{ marginLeft: '6px', fontSize: '14px' }}>✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: '20px 24px',
        borderTop: `1px solid ${metronicTheme.colors.gray200}`,
        background: metronicTheme.colors.white
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              placeholder={connectionStatus === 'connected' ?
                "输入消息..." :
                "等待连接..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={connectionStatus !== 'connected'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                width: '100%',
                resize: 'none',
                minHeight: '48px',
                maxHeight: '120px',
                padding: '12px 50px 12px 16px',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: metronicTheme.fonts.family,
                color: metronicTheme.colors.gray900,
                background: metronicTheme.colors.gray100,
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              rows={1}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = metronicTheme.colors.primary;
                e.currentTarget.style.background = metronicTheme.colors.white;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = metronicTheme.colors.gray300;
                e.currentTarget.style.background = metronicTheme.colors.gray100;
              }}
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '14px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              😊
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || connectionStatus !== 'connected'}
            style={{
              height: '48px',
              width: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              padding: 0,
              background: !inputText.trim() || connectionStatus !== 'connected' ?
                metronicTheme.colors.gray300 :
                `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
              color: metronicTheme.colors.white,
              border: 'none',
              cursor: !inputText.trim() || connectionStatus !== 'connected' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: !inputText.trim() || connectionStatus !== 'connected' ?
                'none' :
                `0 4px 12px ${metronicTheme.colors.primary}30`
            }}
            onMouseEnter={(e) => {
              if (inputText.trim() && connectionStatus === 'connected') {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                e.currentTarget.style.boxShadow = `0 6px 16px ${metronicTheme.colors.primary}40`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${metronicTheme.colors.primary}30`;
            }}
          >
            ➤
          </button>
        </form>
        <div style={{
          fontSize: '12px',
          color: metronicTheme.colors.gray500,
          marginTop: '12px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}