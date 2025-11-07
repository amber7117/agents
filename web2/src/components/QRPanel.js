import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import QRCode from 'qrcode';
import { API_URL } from '../api';
import { tokenStore } from '../store';
export default function QRPanel() {
    const canvasRef = useRef(null);
    const [status, setStatus] = useState('waiting');
    const [isRetrying, setIsRetrying] = useState(false);
    const [debugInfo, setDebugInfo] = useState([]);
    const [qrData, setQrData] = useState('');
    const addDebugInfo = (info) => {
        console.log(info);
        setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]);
    };
    useEffect(() => {
        let sock = null;
        const token = tokenStore.token;
        if (!token) {
            addDebugInfo('❌ No token found');
            return;
        }
        addDebugInfo('🔌 Connecting to server...');
        sock = io(API_URL, { auth: { token } });
        sock.on('connect', () => {
            setStatus('connecting');
            setIsRetrying(false);
            addDebugInfo('✅ Connected to server');
        });
        sock.on('wa.qr', async (payload) => {
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
                }
                catch (error) {
                    console.error('QR code generation failed:', error);
                    addDebugInfo(`❌ QR code render failed: ${error}`);
                }
            }
            else {
                addDebugInfo('❌ Canvas ref not found');
            }
        });
        sock.on('wa.ready', () => {
            setStatus('ready');
            addDebugInfo('✅ WhatsApp connected');
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
    return (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '24px'
                }, children: [_jsx("div", { style: {
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                        }, children: "\uD83D\uDCF1" }), _jsxs("div", { style: { textAlign: 'left' }, children: [_jsx("h3", { style: {
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    margin: '0 0 4px',
                                    color: '#ffffff'
                                }, children: "\u8FDE\u63A5 WhatsApp" }), _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }, children: [_jsx("span", { style: { fontSize: '16px' }, children: getStatusIcon() }), _jsx("span", { style: {
                                            color: getStatusColor(),
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }, children: getStatusText() }), (status === 'connecting' || isRetrying) && (_jsx("div", { className: "loading", style: { marginLeft: '4px' } }))] })] })] }), status === 'scanning' && (_jsx("div", { style: {
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'inline-block',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
                }, children: _jsx("canvas", { ref: canvasRef, style: {
                        borderRadius: '8px'
                    } }) })), debugInfo.length > 0 && (_jsxs("div", { style: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    textAlign: 'left'
                }, children: [_jsx("h4", { style: {
                            fontSize: '14px',
                            color: '#b3b3b3',
                            margin: '0 0 8px',
                            fontWeight: '500'
                        }, children: "\u8FDE\u63A5\u8C03\u8BD5\u4FE1\u606F:" }), _jsx("div", { style: {
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: '#e0e0e0',
                            lineHeight: '1.4'
                        }, children: debugInfo.map((info, i) => (_jsx("div", { style: { marginBottom: '2px' }, children: info }, i))) })] })), status === 'ready' && (_jsxs("div", { style: {
                    background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
                    border: '1px solid rgba(79, 172, 254, 0.3)',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    marginBottom: '20px'
                }, children: [_jsx("div", { style: {
                            fontSize: '64px',
                            marginBottom: '16px'
                        }, children: "\u2705" }), _jsx("h4", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px',
                            color: '#4facfe'
                        }, children: "\u8FDE\u63A5\u6210\u529F\uFF01" }), _jsx("p", { style: {
                            color: '#b3b3b3',
                            fontSize: '14px',
                            margin: 0
                        }, children: "\u60A8\u7684 WhatsApp \u5DF2\u6210\u529F\u8FDE\u63A5\u5230\u4E1A\u52A1\u684C\u9762" })] })), (status === 'waiting' || status === 'connecting') && (_jsxs("div", { style: {
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '40px 20px',
                    marginBottom: '20px'
                }, children: [_jsx("div", { style: {
                            fontSize: '64px',
                            marginBottom: '16px'
                        }, children: status === 'connecting' ? '🔄' : '⏳' }), _jsx("h4", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px',
                            color: '#ffffff'
                        }, children: status === 'connecting' ? '正在连接...' : '准备连接' }), _jsx("p", { style: {
                            color: '#b3b3b3',
                            fontSize: '14px',
                            margin: 0
                        }, children: "\u8BF7\u7A0D\u5019\uFF0C\u6B63\u5728\u521D\u59CB\u5316\u8FDE\u63A5" })] })), status === 'scanning' && (_jsxs("div", { style: {
                    background: 'rgba(255, 238, 210, 0.05)',
                    border: '1px solid rgba(255, 238, 210, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left'
                }, children: [_jsx("h5", { style: {
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0 0 12px',
                            color: '#ffecd2',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }, children: "\uD83D\uDCD6 \u626B\u63CF\u6B65\u9AA4" }), _jsxs("ol", { style: {
                            color: '#b3b3b3',
                            fontSize: '14px',
                            margin: 0,
                            paddingLeft: '20px'
                        }, children: [_jsx("li", { style: { marginBottom: '8px' }, children: "\u6253\u5F00\u624B\u673A\u4E0A\u7684 WhatsApp \u5E94\u7528" }), _jsx("li", { style: { marginBottom: '8px' }, children: "\u70B9\u51FB\u53F3\u4E0A\u89D2\u7684\u83DC\u5355 (\u22EE) \u6216\u8BBE\u7F6E" }), _jsx("li", { style: { marginBottom: '8px' }, children: "\u9009\u62E9\"\u5173\u8054\u8BBE\u5907\"\u6216\"WhatsApp Web\"" }), _jsx("li", { children: "\u626B\u63CF\u4E0A\u65B9\u7684\u4E8C\u7EF4\u7801" })] })] })), (status === 'waiting' && !isRetrying) && (_jsx("button", { className: "btn btn-secondary", onClick: () => window.location.reload(), style: {
                    width: '100%',
                    marginTop: '16px'
                }, children: "\uD83D\uDD04 \u91CD\u65B0\u8FDE\u63A5" }))] }));
}
