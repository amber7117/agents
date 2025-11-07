import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { API_URL } from '../api';
import { tokenStore } from '../store';

export default function QRPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'waiting' | 'ready' | 'scanning' | 'connecting'>('waiting');
  const [isRetrying, setIsRetrying] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [qrData, setQrData] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    let sock: Socket | null = null;
    const token = tokenStore.token!;
    
    if (!token) {
      addDebugInfo('❌ No token found');
      return;
    }

    addDebugInfo('🔌 Connecting to server...');
    sock = io(API_URL, { auth: { token } });
    socketRef.current = sock;

    sock.on('connect', () => {
      setStatus('connecting');
      setIsRetrying(false);
      addDebugInfo('✅ Connected to server');
    });

    sock.on('wa.qr', async (payload: { qr: string }) => {
      addDebugInfo('📱 QR code received');
      setStatus('scanning');
      setQrData(payload.qr);
      
      if (canvasRef.current) {
        try {
          await QRCode.toCanvas(canvasRef.current, payload.qr, { 
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          addDebugInfo('✅ QR code rendered');
        } catch (error) {
          console.error('QR code generation failed:', error);
          addDebugInfo(`❌ QR code render failed: ${error}`);
        }
      } else {
        addDebugInfo('❌ Canvas ref not found');
      }
    });

    sock.on('wa.ready', () => {
      setStatus('ready');
      addDebugInfo('✅ WhatsApp connected');
    });

    sock.on('wa.stopped', () => {
      setStatus('waiting');
      addDebugInfo('✅ WhatsApp disconnected successfully');
    });

    sock.on('disconnect', () => {
      setStatus('waiting');
      setIsRetrying(true);
      addDebugInfo('❌ Server disconnected');
    });

    sock.on('connect_error', (error) => {
      addDebugInfo(`❌ Connection error: ${error.message}`);
    });

    return () => {
      if (sock) {
        addDebugInfo('🔌 Disconnecting...');
        sock.close();
      }
      socketRef.current = null;
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return '#4facfe';
      case 'scanning': return '#ffecd2';
      case 'connecting': return '#667eea';
      default: return '#ff9a9e';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ready': return '已连接';
      case 'scanning': return '等待扫描';
      case 'connecting': return '连接中';
      default: return isRetrying ? '重新连接中' : '等待连接';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ready': return '✅';
      case 'scanning': return '📱';
      case 'connecting': return '🔄';
      default: return '⏳';
    }
  };

  const handleDisconnect = () => {
    if (socketRef.current && status === 'ready') {
      addDebugInfo('🔌 Requesting disconnect...');
      socketRef.current.emit('wa.stop');
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* 标题和状态 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          📱
        </div>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 4px',
            color: '#ffffff'
          }}>
            连接 WhatsApp
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>{getStatusIcon()}</span>
            <span style={{
              color: getStatusColor(),
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {getStatusText()}
            </span>
            {(status === 'connecting' || isRetrying) && (
              <div className="loading" style={{ marginLeft: '4px' }}></div>
            )}
          </div>
        </div>
      </div>

      {/* QR码区域 */}
      {status === 'scanning' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'inline-block',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
        }}>
          <canvas 
            ref={canvasRef}
            style={{
              borderRadius: '8px'
            }}
          />
        </div>
      )}

      {/* 调试信息面板 */}
      {debugInfo.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <h4 style={{
            fontSize: '14px',
            color: '#b3b3b3',
            margin: '0 0 8px',
            fontWeight: '500'
          }}>
            连接调试信息:
          </h4>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#e0e0e0',
            lineHeight: '1.4'
          }}>
            {debugInfo.map((info, i) => (
              <div key={i} style={{ marginBottom: '2px' }}>
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 成功状态 */}
      {status === 'ready' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
          border: '1px solid rgba(79, 172, 254, 0.3)',
          borderRadius: '16px',
          padding: '40px 20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}>
            ✅
          </div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px',
            color: '#4facfe'
          }}>
            连接成功！
          </h4>
          <p style={{
            color: '#b3b3b3',
            fontSize: '14px',
            margin: '0 0 20px'
          }}>
            您的 WhatsApp 已成功连接到业务桌面
          </p>
          
          {/* 断开连接按钮 */}
          <button
            className="btn btn-secondary"
            onClick={handleDisconnect}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
              border: 'none',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
            }}
          >
            🔌 断开 WhatsApp
          </button>
        </div>
      )}

      {/* 等待/连接状态 */}
      {(status === 'waiting' || status === 'connecting') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '40px 20px',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px'
          }}>
            {status === 'connecting' ? '🔄' : '⏳'}
          </div>
          <h4 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px',
            color: '#ffffff'
          }}>
            {status === 'connecting' ? '正在连接...' : '准备连接'}
          </h4>
          <p style={{
            color: '#b3b3b3',
            fontSize: '14px',
            margin: 0
          }}>
            请稍候，正在初始化连接
          </p>
        </div>
      )}

      {/* 使用说明 */}
      {status === 'scanning' && (
        <div style={{
          background: 'rgba(255, 238, 210, 0.05)',
          border: '1px solid rgba(255, 238, 210, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'left'
        }}>
          <h5 style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 12px',
            color: '#ffecd2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📖 扫描步骤
          </h5>
          <ol style={{
            color: '#b3b3b3',
            fontSize: '14px',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li style={{ marginBottom: '8px' }}>
              打开手机上的 WhatsApp 应用
            </li>
            <li style={{ marginBottom: '8px' }}>
              点击右上角的菜单 (⋮) 或设置
            </li>
            <li style={{ marginBottom: '8px' }}>
              选择"关联设备"或"WhatsApp Web"
            </li>
            <li>
              扫描上方的二维码
            </li>
          </ol>
        </div>
      )}

      {/* 重连按钮 */}
      {(status === 'waiting' && !isRetrying) && (
        <button
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
          style={{
            width: '100%',
            marginTop: '16px'
          }}
        >
          🔄 重新连接
        </button>
      )}
    </div>
  );
}