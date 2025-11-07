import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
export function MessagePane({ jid, messages, onSend, connectionStatus = 'connected' }) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    // 自动滚动到最新消息
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !jid)
            return;
        onSend(inputText);
        setInputText('');
    };
    const formatJid = (jid) => {
        const phoneNumber = jid.split('@')[0];
        if (phoneNumber.length > 10) {
            return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
        }
        return phoneNumber;
    };
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };
    if (!jid) {
        return (_jsx("div", { style: {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.02)'
            }, children: _jsxs("div", { style: {
                    textAlign: 'center',
                    color: '#808080'
                }, children: [_jsx("div", { style: { fontSize: '64px', marginBottom: '16px' }, children: "\uD83D\uDCAC" }), _jsx("h3", { style: {
                            fontSize: '20px',
                            fontWeight: '600',
                            margin: '0 0 8px',
                            color: '#ffffff'
                        }, children: "\u9009\u62E9\u4E00\u4E2A\u804A\u5929" }), _jsxs("p", { style: { fontSize: '14px', margin: 0 }, children: ["\u4ECE\u5DE6\u4FA7\u5217\u8868\u9009\u62E9\u8054\u7CFB\u4EBA\u5F00\u59CB\u804A\u5929", _jsx("br", {}), "\u6216\u70B9\u51FB\"\u6DFB\u52A0\u8054\u7CFB\u4EBA\"\u5F00\u59CB\u65B0\u5BF9\u8BDD"] })] }) }));
    }
    return (_jsxs("div", { style: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.02)'
        }, children: [_jsxs("div", { style: {
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }, children: [_jsx("div", { style: {
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
                        }, children: jid.split('@')[0].slice(-2).toUpperCase() }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { style: {
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    margin: '0 0 4px',
                                    color: '#ffffff'
                                }, children: formatJid(jid) }), _jsxs("div", { style: {
                                    fontSize: '12px',
                                    color: '#b3b3b3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }, children: [_jsx("div", { style: {
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: connectionStatus === 'connected' ? '#4facfe' : '#ff9a9e'
                                        } }), connectionStatus === 'connected' ? '在线' : '离线'] })] }), _jsx("button", { className: "btn btn-secondary", style: {
                            padding: '8px 12px',
                            fontSize: '12px'
                        }, children: "\u2699\uFE0F" })] }), _jsxs("div", { style: {
                    flex: 1,
                    overflow: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }, children: [messages.length === 0 ? (_jsxs("div", { style: {
                            textAlign: 'center',
                            color: '#808080',
                            padding: '40px 20px'
                        }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\uD83D\uDCF1" }), _jsxs("p", { style: { fontSize: '14px', margin: 0 }, children: ["\u8FD8\u6CA1\u6709\u6D88\u606F\u8BB0\u5F55", _jsx("br", {}), "\u53D1\u9001\u7B2C\u4E00\u6761\u6D88\u606F\u5F00\u59CB\u5BF9\u8BDD"] })] })) : (messages.map((m, i) => (_jsx("div", { style: {
                            display: 'flex',
                            justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start',
                            marginBottom: '8px'
                        }, children: _jsxs("div", { style: {
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
                            }, children: [_jsx("div", { style: {
                                        fontSize: '14px',
                                        lineHeight: '1.4',
                                        wordBreak: 'break-word'
                                    }, children: m.text }), _jsxs("div", { style: {
                                        fontSize: '11px',
                                        color: m.from === 'me' ? 'rgba(255, 255, 255, 0.7)' : '#b3b3b3',
                                        marginTop: '4px',
                                        textAlign: 'right'
                                    }, children: [formatTime(m.ts), m.from === 'me' && (_jsx("span", { style: { marginLeft: '4px' }, children: "\u2713" }))] })] }) }, i)))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { style: {
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)'
                }, children: [_jsxs("form", { onSubmit: handleSubmit, style: {
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-end'
                        }, children: [_jsxs("div", { style: { flex: 1, position: 'relative' }, children: [_jsx("textarea", { className: "input", placeholder: connectionStatus === 'connected' ?
                                            "输入消息..." :
                                            "等待连接...", value: inputText, onChange: (e) => setInputText(e.target.value), disabled: connectionStatus !== 'connected', onKeyDown: (e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }, style: {
                                            resize: 'none',
                                            minHeight: '44px',
                                            maxHeight: '120px',
                                            paddingRight: '50px'
                                        }, rows: 1 }), _jsx("button", { type: "button", style: {
                                            position: 'absolute',
                                            right: '12px',
                                            bottom: '12px',
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '20px',
                                            cursor: 'pointer'
                                        }, children: "\uD83D\uDE0A" })] }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: !inputText.trim() || connectionStatus !== 'connected', style: {
                                    height: '44px',
                                    width: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '18px',
                                    padding: 0
                                }, children: "\u27A4" })] }), _jsx("div", { style: {
                            fontSize: '12px',
                            color: '#808080',
                            marginTop: '8px',
                            textAlign: 'center'
                        }, children: "\u6309 Enter \u53D1\u9001\uFF0CShift + Enter \u6362\u884C" })] })] }));
}
