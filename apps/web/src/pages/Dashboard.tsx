import QRPanel from '../components/QRPanel';
import { tokenStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Dashboard() {
  const nav = useNavigate();

  // 检查登录状态
  useEffect(() => {
    if (!tokenStore.token) {
      nav('/login');
    }
  }, [nav]);

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
          🏠
        </div>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: '600',
            margin: '0 0 4px',
            color: '#ffffff'
          }}>
            仪表盘
          </h1>
          <p style={{
            color: '#b3b3b3',
            fontSize: '14px',
            margin: 0
          }}>
            欢迎使用 WhatsApp Business Desk
          </p>
        </div>
      </div>

      {/* Dashboard内容 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
    <div style={{
      display: 'grid',
      gap: '24px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
    }}>
      {/* 欢迎卡片 */}
      <div className="card" style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}>
            👋
          </div>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              欢迎使用 WA Business Desk
            </h1>
            <p style={{
              color: '#b3b3b3',
              fontSize: '18px',
              margin: 0
            }}>
              连接您的 WhatsApp，开始管理业务消息
            </p>
          </div>
        </div>
      </div>

      {/* QR码连接卡片 */}
      <div className="card">
        <QRPanel />
      </div>

      {/* 功能介绍卡片 */}
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            ✨
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: '#ffffff'
          }}>
            功能特色
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <span style={{ color: '#b3b3b3' }}>实时消息收发</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <span style={{ color: '#b3b3b3' }}>端到端加密</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📱</span>
            <span style={{ color: '#b3b3b3' }}>多设备同步</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ color: '#b3b3b3' }}>即时连接</span>
          </div>
        </div>
      </div>

      {/* 使用指南卡片 */}
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📋
          </div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: '#ffffff'
          }}>
            使用指南
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#667eea',
              minWidth: '24px'
            }}>
              1
            </span>
            <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
              使用手机WhatsApp扫描左侧二维码
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#667eea',
              minWidth: '24px'
            }}>
              2
            </span>
            <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
              等待连接成功提示
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px'
          }}>
            <span style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#667eea',
              minWidth: '24px'
            }}>
              3
            </span>
            <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
              前往聊天页面开始使用
            </span>
          </div>
        </div>
      </div>

      {/* 快速操作卡片 */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          margin: '0 0 20px',
          color: '#ffffff'
        }}>
          快速操作
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => nav('/chat')}
            style={{
              height: '64px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            💬 进入聊天界面
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
            style={{
              height: '64px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            🔄 重新连接
          </button>
          
          <button
            className="btn btn-secondary"
            style={{
              height: '64px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            ⚙️ 设置
          </button>
          
          <button
            className="btn btn-secondary"
            style={{
              height: '64px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            📊 统计
          </button>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}