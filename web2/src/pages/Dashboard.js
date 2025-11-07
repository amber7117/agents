import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { style: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '0'
        }, children: [_jsxs("div", { style: {
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
                }, children: [_jsx("div", { style: {
                            width: '48px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                        }, children: "\uD83C\uDFE0" }), _jsxs("div", { children: [_jsx("h1", { style: {
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    margin: '0 0 4px',
                                    color: '#ffffff'
                                }, children: "\u4EEA\u8868\u76D8" }), _jsx("p", { style: {
                                    color: '#b3b3b3',
                                    fontSize: '14px',
                                    margin: 0
                                }, children: "\u6B22\u8FCE\u4F7F\u7528 WhatsApp Business Desk" })] })] }), _jsx("div", { style: {
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '8px'
                }, children: _jsxs("div", { style: {
                        display: 'grid',
                        gap: '24px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
                    }, children: [_jsx("div", { className: "card", style: {
                                gridColumn: '1 / -1',
                                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                border: '1px solid rgba(102, 126, 234, 0.2)'
                            }, children: _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px'
                                }, children: [_jsx("div", { style: {
                                            width: '80px',
                                            height: '80px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '40px',
                                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                                        }, children: "\uD83D\uDC4B" }), _jsxs("div", { children: [_jsx("h1", { style: {
                                                    fontSize: '32px',
                                                    fontWeight: '700',
                                                    margin: '0 0 8px',
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent'
                                                }, children: "\u6B22\u8FCE\u4F7F\u7528 WA Business Desk" }), _jsx("p", { style: {
                                                    color: '#b3b3b3',
                                                    fontSize: '18px',
                                                    margin: 0
                                                }, children: "\u8FDE\u63A5\u60A8\u7684 WhatsApp\uFF0C\u5F00\u59CB\u7BA1\u7406\u4E1A\u52A1\u6D88\u606F" })] })] }) }), _jsx("div", { className: "card", children: _jsx(QRPanel, {}) }), _jsxs("div", { className: "card", children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        marginBottom: '20px'
                                    }, children: [_jsx("div", { style: {
                                                width: '48px',
                                                height: '48px',
                                                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '24px'
                                            }, children: "\u2728" }), _jsx("h3", { style: {
                                                fontSize: '20px',
                                                fontWeight: '600',
                                                margin: 0,
                                                color: '#ffffff'
                                            }, children: "\u529F\u80FD\u7279\u8272" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\uD83D\uDCAC" }), _jsx("span", { style: { color: '#b3b3b3' }, children: "\u5B9E\u65F6\u6D88\u606F\u6536\u53D1" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\uD83D\uDD12" }), _jsx("span", { style: { color: '#b3b3b3' }, children: "\u7AEF\u5230\u7AEF\u52A0\u5BC6" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\uD83D\uDCF1" }), _jsx("span", { style: { color: '#b3b3b3' }, children: "\u591A\u8BBE\u5907\u540C\u6B65" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\u26A1" }), _jsx("span", { style: { color: '#b3b3b3' }, children: "\u5373\u65F6\u8FDE\u63A5" })] })] })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        marginBottom: '20px'
                                    }, children: [_jsx("div", { style: {
                                                width: '48px',
                                                height: '48px',
                                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '24px'
                                            }, children: "\uD83D\uDCCB" }), _jsx("h3", { style: {
                                                fontSize: '20px',
                                                fontWeight: '600',
                                                margin: 0,
                                                color: '#ffffff'
                                            }, children: "\u4F7F\u7528\u6307\u5357" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: {
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '8px'
                                            }, children: [_jsx("span", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#667eea',
                                                        minWidth: '24px'
                                                    }, children: "1" }), _jsx("span", { style: { color: '#b3b3b3', fontSize: '14px' }, children: "\u4F7F\u7528\u624B\u673AWhatsApp\u626B\u63CF\u5DE6\u4FA7\u4E8C\u7EF4\u7801" })] }), _jsxs("div", { style: {
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '8px'
                                            }, children: [_jsx("span", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#667eea',
                                                        minWidth: '24px'
                                                    }, children: "2" }), _jsx("span", { style: { color: '#b3b3b3', fontSize: '14px' }, children: "\u7B49\u5F85\u8FDE\u63A5\u6210\u529F\u63D0\u793A" })] }), _jsxs("div", { style: {
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '8px'
                                            }, children: [_jsx("span", { style: {
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#667eea',
                                                        minWidth: '24px'
                                                    }, children: "3" }), _jsx("span", { style: { color: '#b3b3b3', fontSize: '14px' }, children: "\u524D\u5F80\u804A\u5929\u9875\u9762\u5F00\u59CB\u4F7F\u7528" })] })] })] }), _jsxs("div", { className: "card", style: { gridColumn: '1 / -1' }, children: [_jsx("h3", { style: {
                                        fontSize: '20px',
                                        fontWeight: '600',
                                        margin: '0 0 20px',
                                        color: '#ffffff'
                                    }, children: "\u5FEB\u901F\u64CD\u4F5C" }), _jsxs("div", { style: {
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '16px'
                                    }, children: [_jsx("button", { className: "btn btn-primary", onClick: () => nav('/chat'), style: {
                                                height: '64px',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }, children: "\uD83D\uDCAC \u8FDB\u5165\u804A\u5929\u754C\u9762" }), _jsx("button", { className: "btn btn-secondary", onClick: () => window.location.reload(), style: {
                                                height: '64px',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }, children: "\uD83D\uDD04 \u91CD\u65B0\u8FDE\u63A5" }), _jsx("button", { className: "btn btn-secondary", style: {
                                                height: '64px',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }, children: "\u2699\uFE0F \u8BBE\u7F6E" }), _jsx("button", { className: "btn btn-secondary", style: {
                                                height: '64px',
                                                fontSize: '16px',
                                                fontWeight: '600'
                                            }, children: "\uD83D\uDCCA \u7EDF\u8BA1" })] })] })] }) })] }));
}
