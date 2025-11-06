import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../store';
import { chatHistoryManager } from '../utils/chatHistory';

interface UserSettings {
  autoSaveChats: boolean;
  notificationSound: boolean;
  darkMode: boolean;
  language: string;
  maxChatHistory: number;
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('user-settings');
    return saved ? JSON.parse(saved) : {
      autoSaveChats: true,
      notificationSound: true,
      darkMode: true,
      language: 'zh-CN',
      maxChatHistory: 1000
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [chatStats, setChatStats] = useState<any>(null);

  // 获取聊天统计信息
  useEffect(() => {
    const stats = chatHistoryManager.getStats();
    setChatStats(stats);
  }, []);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('user-settings', JSON.stringify(newSettings));
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      tokenStore.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('chat-history');
      navigate('/login');
    }
  };

  const clearChatHistory = () => {
    if (confirm('确定要清除所有聊天记录吗？此操作不可撤销。')) {
      localStorage.removeItem('chat-history');
      alert('聊天记录已清除');
    }
  };

  const exportChatHistory = () => {
    const history = localStorage.getItem('chat-history');
    if (!history) {
      alert('没有聊天记录可导出');
      return;
    }

    const blob = new Blob([history], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto',
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
        gap: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
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
          ⚙️
        </div>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '600',
            margin: '0 0 4px',
            color: '#ffffff'
          }}>
            设置中心
          </h1>
          <p style={{
            color: '#b3b3b3',
            fontSize: '14px',
            margin: 0
          }}>
            管理您的账户和应用偏好设置
          </p>
        </div>
      </div>

      {/* 设置内容 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
      {/* 设置卡片 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 20px',
          color: '#ffffff'
        }}>
          💬 聊天设置
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 自动保存聊天 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                自动保存聊天记录
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }}>
                自动保存所有聊天消息到本地
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSaveChats}
              onChange={(e) => handleSettingChange('autoSaveChats', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
          </div>

          {/* 通知声音 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                消息通知声音
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }}>
                新消息时播放提示音
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationSound}
              onChange={(e) => handleSettingChange('notificationSound', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
          </div>

          {/* 最大历史记录 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0'
          }}>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                最大聊天历史记录
              </div>
              <div style={{ color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }}>
                每个联系人保存的消息数量
              </div>
            </div>
            <select
              value={settings.maxChatHistory}
              onChange={(e) => handleSettingChange('maxChatHistory', parseInt(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '14px'
              }}
            >
              <option value={100}>100条</option>
              <option value={500}>500条</option>
              <option value={1000}>1000条</option>
              <option value={5000}>5000条</option>
            </select>
          </div>
        </div>
      </div>

      {/* 数据管理 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 20px',
          color: '#ffffff'
        }}>
          🗃️ 数据管理
        </h3>

        {/* 聊天统计 */}
        {chatStats && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '500',
              margin: '0 0 12px',
              color: '#ffffff'
            }}>
              📊 聊天统计
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '12px'
            }}>
              <div>
                <span style={{ color: '#b3b3b3' }}>联系人总数: </span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{chatStats.totalContacts}</span>
              </div>
              <div>
                <span style={{ color: '#b3b3b3' }}>消息总数: </span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>{chatStats.totalMessages}</span>
              </div>
              {chatStats.oldestMessage && (
                <div>
                  <span style={{ color: '#b3b3b3' }}>最早消息: </span>
                  <span style={{ color: '#ffffff', fontWeight: '500' }}>
                    {chatStats.oldestMessage.toLocaleDateString()}
                  </span>
                </div>
              )}
              {chatStats.newestMessage && (
                <div>
                  <span style={{ color: '#b3b3b3' }}>最新消息: </span>
                  <span style={{ color: '#ffffff', fontWeight: '500' }}>
                    {chatStats.newestMessage.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={exportChatHistory}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📥 导出聊天记录
          </button>

          <button
            onClick={clearChatHistory}
            style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🗑️ 清除聊天记录
          </button>
        </div>
      </div>

      {/* 账户管理 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 20px',
          color: '#ffffff'
        }}>
          👤 账户管理
        </h3>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {isLoading ? '退出中...' : '🚪 退出登录'}
        </button>
      </div>
      </div>
    </div>
  );
}