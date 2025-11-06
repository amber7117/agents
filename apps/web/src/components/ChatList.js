import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { chatHistoryManager } from '../utils/chatHistory';
export function ChatList({ chats, onPick, activeChat }) {
    const formatJid = (jid) => {
        // 简化JID显示，只显示号码部分
        const phoneNumber = jid.split('@')[0];
        if (phoneNumber.length > 10) {
            return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
        }
        return phoneNumber;
    };
    const getInitials = (jid) => {
        const phoneNumber = jid.split('@')[0];
        return phoneNumber.slice(-2).toUpperCase();
    };
    const getLastMessage = (jid) => {
        const history = chatHistoryManager.getContactHistory(jid);
        if (history.length === 0)
            return null;
        const lastMessage = history[history.length - 1];
        return {
            text: lastMessage.text.length > 30
                ? lastMessage.text.substring(0, 30) + '...'
                : lastMessage.text,
            time: new Date(lastMessage.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            count: history.length
        };
    };
    return (_jsxs("div", { style: {
            width: '320px',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            flexDirection: 'column'
        }, children: [_jsxs("div", { style: {
                    padding: '20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }, children: [_jsx("h3", { style: {
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }, children: "\uD83D\uDC65 \u8054\u7CFB\u4EBA\u5217\u8868" }), _jsx("p", { style: {
                            color: '#b3b3b3',
                            fontSize: '14px',
                            margin: 0
                        }, children: chats.length > 0 ? `${chats.length} 个联系人` : '暂无联系人' })] }), _jsx("div", { style: {
                    flex: 1,
                    overflow: 'auto',
                    padding: '12px'
                }, children: chats.length === 0 ? (_jsxs("div", { style: {
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#808080'
                    }, children: [_jsx("div", { style: { fontSize: '48px', marginBottom: '16px' }, children: "\uD83D\uDCAC" }), _jsxs("p", { style: { fontSize: '14px', margin: 0 }, children: ["\u8FD8\u6CA1\u6709\u4EFB\u4F55\u804A\u5929\u8BB0\u5F55", _jsx("br", {}), "\u7B49\u5F85\u6D88\u606F\u5230\u8FBE..."] })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: chats.map(c => (_jsxs("button", { onClick: () => onPick(c), style: {
                            width: '100%',
                            padding: '16px',
                            background: activeChat === c ?
                                'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' :
                                'rgba(255, 255, 255, 0.05)',
                            border: activeChat === c ?
                                '1px solid rgba(102, 126, 234, 0.4)' :
                                '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }, onMouseOver: (e) => {
                            if (activeChat !== c) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            }
                        }, onMouseOut: (e) => {
                            if (activeChat !== c) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                        }, children: [_jsx("div", { style: {
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#ffffff'
                                }, children: getInitials(c) }), _jsxs("div", { style: { flex: 1, overflow: 'hidden' }, children: [_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '4px'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '16px',
                                                    fontWeight: '500',
                                                    color: '#ffffff',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }, children: formatJid(c) }), (() => {
                                                const lastMsg = getLastMessage(c);
                                                return lastMsg && (_jsx("div", { style: {
                                                        fontSize: '11px',
                                                        color: '#808080',
                                                        marginLeft: '8px'
                                                    }, children: lastMsg.time }));
                                            })()] }), _jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }, children: [_jsx("div", { style: {
                                                    fontSize: '12px',
                                                    color: '#b3b3b3',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    flex: 1
                                                }, children: (() => {
                                                    const lastMsg = getLastMessage(c);
                                                    return lastMsg ? lastMsg.text : c;
                                                })() }), (() => {
                                                const lastMsg = getLastMessage(c);
                                                return lastMsg && lastMsg.count > 0 && (_jsx("div", { style: {
                                                        background: 'rgba(102, 126, 234, 0.3)',
                                                        color: '#667eea',
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        marginLeft: '8px',
                                                        fontWeight: '500',
                                                        minWidth: '20px',
                                                        textAlign: 'center'
                                                    }, children: lastMsg.count }));
                                            })()] })] }), activeChat === c && (_jsx("div", { style: {
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#4facfe'
                                } }))] }, c))) })) }), _jsx("div", { style: {
                    padding: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }, children: _jsx("button", { className: "btn btn-primary", onClick: () => {
                        const jid = prompt('请输入联系人的 JID (格式: 6012xxxx@s.whatsapp.net):');
                        if (jid && jid.includes('@')) {
                            onPick(jid);
                        }
                    }, style: {
                        width: '100%',
                        fontSize: '14px'
                    }, children: "\u2795 \u6DFB\u52A0\u8054\u7CFB\u4EBA" }) })] }));
}
