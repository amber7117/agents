import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenStore } from '../store';
import { chatHistoryManager } from '../utils/chatHistory';
export default function Settings() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
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
    const [chatStats, setChatStats] = useState(null);
    // 获取聊天统计信息
    useEffect(() => {
        const stats = chatHistoryManager.getStats();
        setChatStats(stats);
    }, []);
    const handleSettingChange = (key, value) => {
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
    return (_jsxs("div", { style: {
            maxWidth: '900px',
            margin: '0 auto',
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
                        }, children: "\u2699\uFE0F" }), _jsxs("div", { children: [_jsx("h1", { style: {
                                    fontSize: '22px',
                                    fontWeight: '600',
                                    margin: '0 0 4px',
                                    color: '#ffffff'
                                }, children: "\u8BBE\u7F6E\u4E2D\u5FC3" }), _jsx("p", { style: {
                                    color: '#b3b3b3',
                                    fontSize: '14px',
                                    margin: 0
                                }, children: "\u7BA1\u7406\u60A8\u7684\u8D26\u6237\u548C\u5E94\u7528\u504F\u597D\u8BBE\u7F6E" })] })] }), _jsxs("div", { style: {
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: '8px'
                }, children: [_jsxs("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '20px'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: '0 0 20px',
                                    color: '#ffffff'
                                }, children: "\uD83D\uDCAC \u804A\u5929\u8BBE\u7F6E" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { color: '#ffffff', fontSize: '14px', fontWeight: '500' }, children: "\u81EA\u52A8\u4FDD\u5B58\u804A\u5929\u8BB0\u5F55" }), _jsx("div", { style: { color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }, children: "\u81EA\u52A8\u4FDD\u5B58\u6240\u6709\u804A\u5929\u6D88\u606F\u5230\u672C\u5730" })] }), _jsx("input", { type: "checkbox", checked: settings.autoSaveChats, onChange: (e) => handleSettingChange('autoSaveChats', e.target.checked), style: { transform: 'scale(1.2)' } })] }), _jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { color: '#ffffff', fontSize: '14px', fontWeight: '500' }, children: "\u6D88\u606F\u901A\u77E5\u58F0\u97F3" }), _jsx("div", { style: { color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }, children: "\u65B0\u6D88\u606F\u65F6\u64AD\u653E\u63D0\u793A\u97F3" })] }), _jsx("input", { type: "checkbox", checked: settings.notificationSound, onChange: (e) => handleSettingChange('notificationSound', e.target.checked), style: { transform: 'scale(1.2)' } })] }), _jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 0'
                                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { color: '#ffffff', fontSize: '14px', fontWeight: '500' }, children: "\u6700\u5927\u804A\u5929\u5386\u53F2\u8BB0\u5F55" }), _jsx("div", { style: { color: '#b3b3b3', fontSize: '12px', marginTop: '2px' }, children: "\u6BCF\u4E2A\u8054\u7CFB\u4EBA\u4FDD\u5B58\u7684\u6D88\u606F\u6570\u91CF" })] }), _jsxs("select", { value: settings.maxChatHistory, onChange: (e) => handleSettingChange('maxChatHistory', parseInt(e.target.value)), style: {
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    color: '#ffffff',
                                                    fontSize: '14px'
                                                }, children: [_jsx("option", { value: 100, children: "100\u6761" }), _jsx("option", { value: 500, children: "500\u6761" }), _jsx("option", { value: 1000, children: "1000\u6761" }), _jsx("option", { value: 5000, children: "5000\u6761" })] })] })] })] }), _jsxs("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '20px'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: '0 0 20px',
                                    color: '#ffffff'
                                }, children: "\uD83D\uDDC3\uFE0F \u6570\u636E\u7BA1\u7406" }), chatStats && (_jsxs("div", { style: {
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '16px'
                                }, children: [_jsx("h4", { style: {
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            margin: '0 0 12px',
                                            color: '#ffffff'
                                        }, children: "\uD83D\uDCCA \u804A\u5929\u7EDF\u8BA1" }), _jsxs("div", { style: {
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '12px',
                                            fontSize: '12px'
                                        }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: '#b3b3b3' }, children: "\u8054\u7CFB\u4EBA\u603B\u6570: " }), _jsx("span", { style: { color: '#ffffff', fontWeight: '500' }, children: chatStats.totalContacts })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#b3b3b3' }, children: "\u6D88\u606F\u603B\u6570: " }), _jsx("span", { style: { color: '#ffffff', fontWeight: '500' }, children: chatStats.totalMessages })] }), chatStats.oldestMessage && (_jsxs("div", { children: [_jsx("span", { style: { color: '#b3b3b3' }, children: "\u6700\u65E9\u6D88\u606F: " }), _jsx("span", { style: { color: '#ffffff', fontWeight: '500' }, children: chatStats.oldestMessage.toLocaleDateString() })] })), chatStats.newestMessage && (_jsxs("div", { children: [_jsx("span", { style: { color: '#b3b3b3' }, children: "\u6700\u65B0\u6D88\u606F: " }), _jsx("span", { style: { color: '#ffffff', fontWeight: '500' }, children: chatStats.newestMessage.toLocaleDateString() })] }))] })] })), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsx("button", { onClick: exportChatHistory, style: {
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 16px',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease'
                                        }, onMouseOver: (e) => e.currentTarget.style.transform = 'translateY(-2px)', onMouseOut: (e) => e.currentTarget.style.transform = 'translateY(0)', children: "\uD83D\uDCE5 \u5BFC\u51FA\u804A\u5929\u8BB0\u5F55" }), _jsx("button", { onClick: clearChatHistory, style: {
                                            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '12px 16px',
                                            color: '#ffffff',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            transition: 'all 0.3s ease'
                                        }, onMouseOver: (e) => e.currentTarget.style.transform = 'translateY(-2px)', onMouseOut: (e) => e.currentTarget.style.transform = 'translateY(0)', children: "\uD83D\uDDD1\uFE0F \u6E05\u9664\u804A\u5929\u8BB0\u5F55" })] })] }), _jsxs("div", { style: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            padding: '24px'
                        }, children: [_jsx("h3", { style: {
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    margin: '0 0 20px',
                                    color: '#ffffff'
                                }, children: "\uD83D\uDC64 \u8D26\u6237\u7BA1\u7406" }), _jsx("button", { onClick: handleLogout, disabled: isLoading, style: {
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
                                }, onMouseOver: (e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)'), onMouseOut: (e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)'), children: isLoading ? '退出中...' : '🚪 退出登录' })] })] })] }));
}
