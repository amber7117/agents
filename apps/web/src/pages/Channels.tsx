import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { tokenStore } from '../store';
import { API_URL } from '../api';

type ChannelStatus = 'connected' | 'disconnected' | 'connecting';
interface Channel {
  id: string;
  type: 'whatsapp';
  name: string;
  phoneNumber?: string;
  status: ChannelStatus;
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
  const channelsRef = useRef<Channel[]>([]);
  const mountedRef = useRef(true);

  // ---------- Helpers ----------
  const persist = useCallback((list: Channel[]) => {
    setChannels(list);
    // store as strings; restore to Date on read
    localStorage.setItem(
      'channels',
      JSON.stringify(
        list.map(c => ({ ...c, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt }))
      )
    );
  }, []);

  const updateChannelStatus = useCallback((id: string, status: ChannelStatus) => {
    setChannels(prev => {
      const next = prev.map(ch => (ch.id === id ? { ...ch, status } : ch));
      localStorage.setItem(
        'channels',
        JSON.stringify(next.map(c => ({ ...c, createdAt: (c.createdAt as Date).toISOString?.() ?? c.createdAt })))
      );
      return next;
    });
  }, []);

  const emitStart = useCallback((channelId: string, name: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('wa.start', { channelId, name });
  }, []);

  const emitStop = useCallback((channelId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('wa.stop', { channelId });
  }, []);

  // ---------- Mount / Unmount ----------
  useEffect(() => {
    // keep a ref in sync so socket handlers can read latest channels without
    // needing to re-create listeners (avoids stale closures)
    channelsRef.current = channels;
  }, [channels]);

  // ---------- Mount / Unmount ----------
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------- Style keyframes once ----------
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.2)} }
      @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // ---------- Guard: redirect if no token ----------
  useEffect(() => {
    if (!tokenStore.token) {
      nav('/login');
      return;
    }
  }, [nav]);

  // ---------- Socket lifecycle (init once per token) ----------
  useEffect(() => {
    const token = tokenStore.token;
    if (!token || socketRef.current) return;

    const sock = io(API_URL, { auth: { token } });
    socketRef.current = sock;

    const onConnect = () => console.log('[socket] connected');
    const onQR = (payload: { channelId: string; qr: string }) => {
      console.log('📨 [Frontend] Received wa.qr event');
      console.log('   channelId:', payload.channelId);
      console.log('   qr length:', payload.qr?.length);
      console.log('   qr preview:', payload.qr?.substring(0, 50) + '...');
      console.log('   showQRModal:', showQRModal);

      // If this channel is already connected, skip showing/creating QR
      const existing = channelsRef.current.find(c => c.id === payload.channelId);
      if (existing && existing.status === 'connected') {
        console.log('♻️ Skipping QR for already connected channel', payload.channelId);
        return;
      }

      // just set data; a separate effect will render when modal + canvas are ready
      console.log('✅ [Frontend] Setting QR data...');
      setQrData(payload.qr);
      console.log('✅ [Frontend] QR data set');

      // If modal is not open yet (e.g., auto reconnect), open it for this channel
      if (!showQRModal) {
        console.log('📖 [Frontend] Opening QR modal...');
        setCurrentChannelId(payload.channelId);
        setShowQRModal(true);
      } else {
        console.log('ℹ️ [Frontend] QR modal already open');
      }
    };

    const onReady = (payload: { channelId: string; phoneNumber?: string }) => {
      console.log('✅ wa.ready', payload.channelId, payload.phoneNumber);

      // Create/update atomically; no stale closure.
      setChannels(prev => {
        const exist = prev.find(ch => ch.id === payload.channelId);
        if (exist) {
          const next = prev.map(ch =>
            ch.id === payload.channelId
              ? { ...ch, status: 'connected' as const, phoneNumber: payload.phoneNumber }
              : ch
          );
          localStorage.setItem('channels', JSON.stringify(next.map(c => ({
            ...c, createdAt: (c.createdAt as Date).toISOString?.() ?? c.createdAt
          }))));
          return next;
        } else {
          const name = `WhatsApp ${prev.filter(c => c.type === 'whatsapp').length + 1}`;
          const newChannel: Channel = {
            id: payload.channelId,
            type: 'whatsapp',
            name,
            status: 'connected',
            phoneNumber: payload.phoneNumber,
            createdAt: new Date()
          };
          const next = [...prev, newChannel];
          localStorage.setItem('channels', JSON.stringify(next.map(c => ({
            ...c, createdAt: (c.createdAt as Date).toISOString?.() ?? c.createdAt
          }))));
          return next;
        }
      });

      if (payload.channelId === currentChannelId) {
        setShowQRModal(false);
        setCurrentChannelId(null);
        setQrData('');
      }
    };

    const onStatus = (payload: { channelId: string; state: string }) => {
      console.log('📊 wa.status', payload.channelId, payload.state);
      const map: Record<string, ChannelStatus> = {
        open: 'connected',
        connecting: 'connecting',
        reconnecting: 'connecting',
        close: 'disconnected',
        waiting_qr: 'disconnected'
      };
      updateChannelStatus(payload.channelId, map[payload.state] ?? 'disconnected');
    };

    const onStopped = (payload: { channelId: string }) => {
      console.log('🛑 wa.stopped', payload.channelId);
      updateChannelStatus(payload.channelId, 'disconnected');
    };

    const onError = (payload: { channelId: string; error: string }) => {
      console.error('❌ wa.error', payload.channelId, payload.error);

      // 特殊处理 already-running 错误
      if (payload.error === 'already-running') {
        console.log('⚠️ 会话已在另一个实例中运行，更新为连接中状态');
        updateChannelStatus(payload.channelId, 'connecting');
        // 不显示 alert，这是正常的并发保护
        return;
      }

      updateChannelStatus(payload.channelId, 'disconnected');
      alert(`频道错误: ${payload.error}`);
    };

    sock.on('connect', onConnect);
    sock.on('wa.qr', onQR);
    sock.on('wa.ready', onReady);
    sock.on('wa.status', onStatus);
    sock.on('wa.stopped', onStopped);
    sock.on('wa.error', onError);

    return () => {
      try {
        sock.off('connect', onConnect);
        sock.off('wa.qr', onQR);
        sock.off('wa.ready', onReady);
        sock.off('wa.status', onStatus);
        sock.off('wa.stopped', onStopped);
        sock.off('wa.error', onError);
        sock.close();
      } finally {
        socketRef.current = null;
      }
    };
  }, [updateChannelStatus, showQRModal, currentChannelId]);

  // ---------- QR render (single place; no racing setTimeout) ----------
  useEffect(() => {
    console.log('🎨 [QR Render Effect] Triggered');
    console.log('   qrData:', qrData ? `${qrData.substring(0, 30)}... (${qrData.length} chars)` : 'null');
    console.log('   showQRModal:', showQRModal);
    console.log('   canvasRef.current:', !!canvasRef.current);

    if (!qrData || !showQRModal || !canvasRef.current) {
      console.log('❌ [QR Render] Conditions not met, skipping render');
      return;
    }

    console.log('✅ [QR Render] All conditions met, rendering...');
    (async () => {
      try {
        await QRCode.toCanvas(canvasRef.current!, qrData, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        console.log('✅ [QR Render] QR rendered successfully');
      } catch (e) {
        console.error('❌ [QR Render] QR render failed:', e);
      }
    })();
  }, [qrData, showQRModal]);

  // ---------- Initial load: API then fallback to localStorage; NO auto-reconnect ----------
  useEffect(() => {
    const load = async () => {
      const token = tokenStore.token;
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/channels/wa/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();

        if (!data.channels || !Array.isArray(data.channels)) throw new Error('Invalid API payload');

        const loaded: Channel[] = data.channels.map((ch: any) => ({
          id: ch.channelId,
          type: 'whatsapp' as const,
          name: ch.name || `WhatsApp ${ch.phoneNumber || ch.channelId}`,
          phoneNumber: ch.phoneNumber,
          status:
            ch.state === 'open' ? 'connected' :
              ch.state === 'connecting' || ch.state === 'reconnecting' ? 'connecting' :
                'disconnected',
          createdAt: new Date(ch.createdAt)
        }));

        persist(loaded);
        console.log('✅ Loaded channels from API (no auto-reconnect):', loaded);

        // ❌ 不自动重连 - 用户需要手动连接
        // loaded.forEach(ch => {
        //   if (socketRef.current) emitStart(ch.id, ch.name);
        // });
      } catch (err) {
        console.warn('Load API failed, fallback to localStorage', err);
        const raw = localStorage.getItem('channels');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Array<Omit<Channel, 'createdAt'> & { createdAt: string | Date }>;
            const fixed = parsed.map(c => ({
              ...c,
              createdAt: new Date(c.createdAt)
            })) as Channel[];
            setChannels(fixed);
            console.log('✅ Loaded channels from localStorage (no auto-reconnect):', fixed);

            // ❌ 不自动重连 - 用户需要手动连接
            // fixed.forEach(ch => {
            //   if (socketRef.current) emitStart(ch.id, ch.name);
            // });
          } catch (e) {
            console.error('localStorage parse failed', e);
          }
        }
      }
    };

    // Wait a tick for socket to be ready
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [persist, emitStart]);

  // ---------- UI helpers ----------
  const getStatusColor = (status: ChannelStatus) => {
    switch (status) {
      case 'connected': return '#4facfe';
      case 'connecting': return '#ffa502';
      case 'disconnected': return '#ff6b6b';
    }
  };
  const getStatusText = (status: ChannelStatus) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'disconnected': return '未连接';
    }
  };

  // ---------- Actions ----------
  const handleAddChannel = (type: 'whatsapp') => {
    const tempId = `${type}-${Date.now()}`;
    const tempName = `WhatsApp ${channels.filter(c => c.type === 'whatsapp').length + 1}`;

    setShowAddDropdown(false);
    setCurrentChannelId(tempId);
    setShowQRModal(true);
    setQrData('');

    if (!socketRef.current) {
      console.error('Socket not connected');
      alert('连接失败：Socket 未连接，请刷新页面重试');
      return;
    }
    emitStart(tempId, tempName);
  };

  const handleConnect = (channelId: string) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;
    if (channel.status === 'connected') {
      alert('该频道已连接，无需再次生成二维码');
      return;
    }
    setCurrentChannelId(channelId);
    updateChannelStatus(channelId, 'connecting');
    setShowQRModal(true);
    setQrData('');
    emitStart(channelId, channel.name);
  };

  const handleDisconnect = (channelId: string) => {
    emitStop(channelId);
    updateChannelStatus(channelId, 'disconnected');
  };

  const handleDeleteChannel = (channelId: string) => {
    if (!confirm('确定要删除此频道吗？')) return;
    setChannels(prev => {
      const next = prev.filter(ch => ch.id !== channelId);
      localStorage.setItem('channels', JSON.stringify(next.map(c => ({
        ...c, createdAt: (c.createdAt as Date).toISOString?.() ?? c.createdAt
      }))));
      return next;
    });
  };

  // ---------- Render ----------
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '16px 24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48,
            background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
          }}>📡</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px', color: '#fff' }}>频道管理</h1>
            <p style={{ color: '#b3b3b3', fontSize: 14, margin: 0 }}>管理您的通讯频道连接</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAddDropdown(v => !v)}
            style={{
              background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
              border: 'none', borderRadius: 12, padding: '12px 24px',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 12px rgba(102,126,234,0.4)', transition: 'all .3s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102,126,234,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)';
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            <span>添加频道</span>
          </button>

          {showAddDropdown && (
            <div
              onClick={e => { e.stopPropagation(); setShowAddDropdown(false); }}
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            />
          )}

          {showAddDropdown && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'rgba(30,30,30,0.95)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: 8, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 1000
              }}
            >
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddChannel('whatsapp'); }}
                style={{
                  width: '100%', background: 'transparent', border: 'none', borderRadius: 8, padding: '12px 16px',
                  color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all .2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 20 }}>📱</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>WhatsApp</div>
                  <div style={{ fontSize: 12, color: '#888' }}>添加 WhatsApp 账号</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
        {channels.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📡</div>
            <h3 style={{ fontSize: 18, color: '#fff', margin: '0 0 12px' }}>还没有添加任何频道</h3>
            <p style={{ color: '#888', fontSize: 14, margin: 0 }}>点击右上角的"添加频道"按钮开始</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {channels.map(channel => (
              <div
                key={channel.id}
                style={{
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, transition: 'all .3s'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 56, height: 56, background: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)',
                    borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, boxShadow: '0 4px 12px rgba(37,211,102,0.3)'
                  }}>📱</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px', color: '#fff' }}>
                      {channel.name}
                    </h3>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
                      background: `${getStatusColor(channel.status)}20`,
                      border: `1px solid ${getStatusColor(channel.status)}`,
                      borderRadius: 6, fontSize: 12, fontWeight: 600,
                      color: getStatusColor(channel.status)
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: getStatusColor(channel.status),
                        animation: channel.status === 'connecting' ? 'pulse 2s infinite' : 'none'
                      }} />
                      {getStatusText(channel.status)}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{
                  marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                  fontSize: 13, color: '#b3b3b3'
                }}>
                  {channel.phoneNumber && (
                    <div style={{
                      marginBottom: 12, padding: 12,
                      background: 'linear-gradient(135deg, rgba(37,211,102,.1) 0%, rgba(18,140,126,.1) 100%)',
                      border: '1px solid rgba(37,211,102,.3)', borderRadius: 8,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <span style={{ fontSize: 16 }}>📞</span>
                      <div>
                        <div style={{ fontSize: 11, color: '#25D366', fontWeight: 600, marginBottom: 4 }}>
                          绑定手机号
                        </div>
                        <div style={{ fontSize: 15, color: '#fff', fontWeight: 600, fontFamily: 'Monaco, monospace' }}>
                          {channel.phoneNumber}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>类型：</strong> WhatsApp Business
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: '#fff' }}>频道 ID：</strong>
                    <span style={{ fontFamily: 'Monaco, monospace', fontSize: 11, color: '#888' }}>
                      {' '}{channel.id.substring(0, 24)}...
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>创建时间：</strong>{' '}
                    {new Date(channel.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {channel.status === 'connected' ? (
                    <button
                      onClick={() => {
                        if (confirm(`确定要断开 ${channel.phoneNumber || channel.name} 的连接吗？`)) {
                          handleDisconnect(channel.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(255,107,107,0.1)',
                        border: '1px solid rgba(255,107,107,0.3)',
                        borderRadius: 10, padding: '12px 16px',
                        color: '#ff6b6b', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', transition: 'all .3s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg,#ff6b6b 0%,#ee5a6f 100%)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,107,107,0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,107,107,0.1)';
                        e.currentTarget.style.color = '#ff6b6b';
                        e.currentTarget.style.borderColor = 'rgba(255,107,107,0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span>🔌</span>
                      <span>断开连接</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(channel.id)}
                      disabled={channel.status === 'connecting'}
                      style={{
                        flex: 1,
                        background: channel.status === 'connecting'
                          ? 'rgba(255,165,2,0.1)'
                          : 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)',
                        border: channel.status === 'connecting' ? '1px solid rgba(255,165,2,0.3)' : 'none',
                        borderRadius: 10, padding: '12px 16px',
                        color: channel.status === 'connecting' ? '#ffa502' : '#fff',
                        fontSize: 14, fontWeight: 600,
                        cursor: channel.status === 'connecting' ? 'not-allowed' : 'pointer',
                        transition: 'all .3s',
                        boxShadow: channel.status === 'connecting' ? 'none' : '0 4px 12px rgba(37,211,102,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                      onMouseEnter={e => {
                        if (channel.status !== 'connecting') {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,211,102,0.4)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (channel.status !== 'connecting') {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,211,102,0.3)';
                        }
                      }}
                    >
                      <span style={{ animation: channel.status === 'connecting' ? 'spin 1s linear infinite' : 'none' }}>
                        {channel.status === 'connecting' ? '🔄' : '🔗'}
                      </span>
                      <span>{channel.status === 'connecting' ? '连接中...' : '连接'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: 12,
                      color: '#ff6b6b', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .3s', minWidth: 48
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,107,107,0.1)';
                      e.currentTarget.style.borderColor = '#ff6b6b';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
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

      {/* QR Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 40,
            maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative'
          }}>
            <button
              onClick={() => {
                if (currentChannelId) emitStop(currentChannelId);
                setShowQRModal(false);
                setCurrentChannelId(null);
                setQrData('');
              }}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >✕</button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, background: 'linear-gradient(135deg,#25D366 0%,#128C7E 100%)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(37,211,102,0.3)'
              }}>📱</div>

              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>扫描二维码连接</h2>
              <p style={{ color: '#b3b3b3', fontSize: 14, margin: '0 0 32px', lineHeight: 1.6 }}>
                使用 WhatsApp 手机应用扫描下方二维码完成绑定
              </p>

              <div style={{ background: '#fff', padding: 24, borderRadius: 16, marginBottom: 24, display: 'inline-block' }}>
                {qrData ? (
                  <div>
                    <canvas ref={canvasRef} width={300} height={300} style={{ display: 'block', width: 300, height: 300 }} />
                    <p style={{ color: '#888', fontSize: 12, marginTop: 12, marginBottom: 0 }}>✅ 二维码已生成</p>
                  </div>
                ) : (
                  <div style={{
                    width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
                  }}>
                    <div>
                      <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🔄</div>
                      <div style={{ fontSize: 14 }}>正在生成二维码...</div>
                      <div style={{ fontSize: 12, marginTop: 8, color: '#666' }}>请稍候</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)',
                borderRadius: 12, padding: 20, textAlign: 'left'
              }}>
                <h4 style={{
                  fontSize: 14, fontWeight: 600, color: '#25D366', margin: '0 0 12px',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>📖 扫描步骤</h4>
                <ol style={{ color: '#b3b3b3', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                  <li>打开手机上的 WhatsApp 应用</li>
                  <li>点击右上角的菜单 (⋮) 或设置</li>
                  <li>选择“关联设备”或 “WhatsApp Web”</li>
                  <li>扫描上方的二维码</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse {0%,100%{opacity:1} 50%{opacity:.5}}`}</style>
    </div>
  );
}
