import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { tokenStore } from '../store';
import { API_URL } from '../api';

interface Channel {
  id: string;
  type: 'whatsapp';
  name: string;
  phoneNumber?: string;
  status: 'connected' | 'disconnected' | 'connecting';
  createdAt: Date;
}

export default function Channels() {
  const nav = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // 检查登录状态
  useEffect(() => {
    if (!tokenStore.token) {
      nav('/login');
    }
  }, [nav]);

  // 初始化 Socket.IO
  useEffect(() => {
    const token = tokenStore.token;
    if (!token) return;

    const sock = io(API_URL, { auth: { token } });
    socketRef.current = sock;

    sock.on('connect', () => {
      console.log('Connected to server');
    });

    sock.on('wa.qr', async (payload: { channelId: string; qr: string }) => {
      console.log('QR code received for channel:', payload.channelId);
      setQrData(payload.qr);
      
      if (canvasRef.current && payload.channelId === currentChannelId) {
        try {
          await QRCode.toCanvas(canvasRef.current, payload.qr, { 
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (error) {
          console.error('QR code generation failed:', error);
        }
      }
    });

    sock.on('wa.ready', (payload: { channelId: string }) => {
      console.log('WhatsApp connected:', payload.channelId);
      updateChannelStatus(payload.channelId, 'connected');
      if (payload.channelId === currentChannelId) {
        setShowQRModal(false);
        setCurrentChannelId(null);
      }
    });

    sock.on('wa.stopped', (payload: { channelId: string }) => {
      console.log('WhatsApp disconnected:', payload.channelId);
      updateChannelStatus(payload.channelId, 'disconnected');
    });

    sock.on('wa.error', (payload: { channelId: string; error: string }) => {
      console.error('WhatsApp error:', payload.channelId, payload.error);
      updateChannelStatus(payload.channelId, 'disconnected');
      alert(`频道错误: ${payload.error}`);
    });

    return () => {
      sock.close();
    };
  }, [currentChannelId]);

  // 加载频道列表（从 localStorage）
  useEffect(() => {
    const savedChannels = localStorage.getItem('channels');
    if (savedChannels) {
      setChannels(JSON.parse(savedChannels));
    }
  }, []);

  // 保存频道列表到 localStorage
  const saveChannels = (newChannels: Channel[]) => {
    setChannels(newChannels);
    localStorage.setItem('channels', JSON.stringify(newChannels));
  };

  const updateChannelStatus = (id: string, status: Channel['status']) => {
    const updated = channels.map(ch => 
      ch.id === id ? { ...ch, status } : ch
    );
    saveChannels(updated);
  };

  const handleAddChannel = (type: 'whatsapp') => {
    const newChannel: Channel = {
      id: `${type}-${Date.now()}`,
      type,
      name: `WhatsApp ${channels.filter(c => c.type === 'whatsapp').length + 1}`,
      status: 'disconnected',
      createdAt: new Date()
    };
    
    saveChannels([...channels, newChannel]);
    setShowAddDropdown(false);
  };

  const handleConnect = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;

    setCurrentChannelId(channelId);
    updateChannelStatus(channelId, 'connecting');
    setShowQRModal(true);
    setQrData('');

    // 发送 Socket.IO 事件启动连接
    if (socketRef.current) {
      socketRef.current.emit('wa.start', { 
        channelId: channelId,
        name: channel.name 
      });
    }
  };

  const handleDisconnect = (channelId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('wa.stop', { channelId });
      updateChannelStatus(channelId, 'disconnected');
    }
  };

  const handleDeleteChannel = (channelId: string) => {
    if (confirm('确定要删除此频道吗？')) {
      const updated = channels.filter(ch => ch.id !== channelId);
      saveChannels(updated);
    }
  };

  const getStatusColor = (status: Channel['status']) => {
    switch (status) {
      case 'connected': return '#4facfe';
      case 'connecting': return '#ffa502';
      case 'disconnected': return '#ff6b6b';
    }
  };

  const getStatusText = (status: Channel['status']) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'disconnected': return '未连接';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            📡
          </div>
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: '0 0 4px',
              color: '#ffffff'
            }}>
              频道管理
            </h1>
            <p style={{
              color: '#b3b3b3',
              fontSize: '14px',
              margin: 0
            }}>
              管理您的通讯频道连接
            </p>
          </div>
        </div>

        {/* 添加频道按钮 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            <span>添加频道</span>
          </button>

          {/* 下拉菜单 */}
          {showAddDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '8px',
              minWidth: '200px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              zIndex: 1000
            }}>
              <button
                onClick={() => handleAddChannel('whatsapp')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '20px' }}>📱</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>WhatsApp</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>添加 WhatsApp 账号</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 频道列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {channels.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📡</div>
            <h3 style={{ fontSize: '18px', color: '#ffffff', margin: '0 0 12px' }}>
              还没有添加任何频道
            </h3>
            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 24px' }}>
              点击右上角的"添加频道"按钮开始
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '20px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'
          }}>
            {channels.map((channel) => (
              <div
                key={channel.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 频道头部 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
                  }}>
                    📱
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: '0 0 6px',
                      color: '#ffffff'
                    }}>
                      {channel.name}
                    </h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      background: `${getStatusColor(channel.status)}20`,
                      border: `1px solid ${getStatusColor(channel.status)}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: getStatusColor(channel.status)
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: getStatusColor(channel.status),
                        animation: channel.status === 'connecting' ? 'pulse 2s infinite' : 'none'
                      }} />
                      {getStatusText(channel.status)}
                    </div>
                  </div>
                </div>

                {/* 频道信息 */}
                <div style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#b3b3b3'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>类型：</strong> WhatsApp Business
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>ID：</strong> {channel.id}
                  </div>
                  <div>
                    <strong style={{ color: '#ffffff' }}>创建时间：</strong>{' '}
                    {new Date(channel.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  {channel.status === 'connected' ? (
                    <button
                      onClick={() => handleDisconnect(channel.id)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600',
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
                      🔌 断开连接
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(channel.id)}
                      disabled={channel.status === 'connecting'}
                      style={{
                        flex: 1,
                        background: channel.status === 'connecting' 
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: channel.status === 'connecting' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: channel.status === 'connecting' 
                          ? 'none' 
                          : '0 4px 12px rgba(37, 211, 102, 0.3)',
                        opacity: channel.status === 'connecting' ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (channel.status !== 'connecting') {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (channel.status !== 'connecting') {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.3)';
                        }
                      }}
                    >
                      {channel.status === 'connecting' ? '🔄 连接中...' : '🔗 连接'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '12px',
                      color: '#ff6b6b',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '48px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                      e.currentTarget.style.borderColor = '#ff6b6b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR 码弹窗 */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowQRModal(false);
                setCurrentChannelId(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: '#ffffff',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 24px',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)'
              }}>
                📱
              </div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 12px'
              }}>
                扫描二维码连接
              </h2>
              
              <p style={{
                color: '#b3b3b3',
                fontSize: '14px',
                margin: '0 0 32px',
                lineHeight: 1.6
              }}>
                使用 WhatsApp 手机应用扫描下方二维码完成绑定
              </p>

              {/* QR 码容器 */}
              <div style={{
                background: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '24px',
                display: 'inline-block'
              }}>
                {qrData ? (
                  <canvas ref={canvasRef} />
                ) : (
                  <div style={{
                    width: '300px',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888'
                  }}>
                    <div>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                      <div style={{ fontSize: '14px' }}>正在生成二维码...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 使用说明 */}
              <div style={{
                background: 'rgba(37, 211, 102, 0.1)',
                border: '1px solid rgba(37, 211, 102, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'left'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#25D366',
                  margin: '0 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📖 扫描步骤
                </h4>
                <ol style={{
                  color: '#b3b3b3',
                  fontSize: '13px',
                  margin: 0,
                  paddingLeft: '20px',
                  lineHeight: 2
                }}>
                  <li>打开手机上的 WhatsApp 应用</li>
                  <li>点击右上角的菜单 (⋮) 或设置</li>
                  <li>选择"关联设备"或"WhatsApp Web"</li>
                  <li>扫描上方的二维码</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {showAddDropdown && (
        <div
          onClick={() => setShowAddDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
