import { useState, useRef, useEffect } from 'react';

export function MessagePane({ 
  jid, 
  messages, 
  onSend,
  connectionStatus = 'connected'
}: { 
  jid: string | null; 
  messages: {from: string; text: string; ts: number}[]; 
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

  if (!jid) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#808080'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 8px',
            color: '#ffffff'
          }}>
            选择一个聊天
          </h3>
          <p style={{ fontSize: '14px', margin: 0 }}>
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
      background: 'rgba(255, 255, 255, 0.02)'
    }}>
      {/* 聊天头部 */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff'
        }}>
          {jid.split('@')[0].slice(-2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 4px',
            color: '#ffffff'
          }}>
            {formatJid(jid)}
          </h3>
          <div style={{
            fontSize: '12px',
            color: '#b3b3b3',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: connectionStatus === 'connected' ? '#4facfe' : '#ff9a9e'
            }}></div>
            {connectionStatus === 'connected' ? '在线' : '离线'}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{
            padding: '8px 12px',
            fontSize: '12px'
          }}
        >
          ⚙️
        </button>
      </div>

      {/* 消息区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#808080',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <p style={{ fontSize: '14px', margin: 0 }}>
              还没有消息记录
              <br />
              发送第一条消息开始对话
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
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
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
                  'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '18px',
                borderBottomRightRadius: m.from === 'me' ? '6px' : '18px',
                borderBottomLeftRadius: m.from === 'me' ? '18px' : '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                position: 'relative'
              }}>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.4',
                  wordBreak: 'break-word'
                }}>
                  {m.text}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: m.from === 'me' ? 'rgba(255, 255, 255, 0.7)' : '#b3b3b3',
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {formatTime(m.ts)}
                  {m.from === 'me' && (
                    <span style={{ marginLeft: '4px' }}>✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              className="input"
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
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px',
                paddingRight: '50px'
              }}
              rows={1}
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              😊
            </button>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!inputText.trim() || connectionStatus !== 'connected'}
            style={{
              height: '44px',
              width: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              padding: 0
            }}
          >
            ➤
          </button>
        </form>
        <div style={{
          fontSize: '12px',
          color: '#808080',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}