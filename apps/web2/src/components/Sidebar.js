import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useLocation } from 'react-router-dom';
import { tokenStore } from '../store';
export function Sidebar() {
    const nav = useNavigate();
    const location = useLocation();
    const menuItems = [
        { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/chat', icon: '💬', label: 'Chat' },
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];
    const handleLogout = () => {
        if (confirm('确定要退出登录吗？')) {
            tokenStore.token = null;
            localStorage.removeItem('token');
            nav('/login');
        }
    };
    return (_jsxs("aside", { style: {
            width: '260px',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '4px 0 12px rgba(0, 0, 0, 0.3)'
        }, children: [_jsx("div", { style: {
                    padding: '24px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }, children: _jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }, children: [_jsx("div", { style: {
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }, children: "\uD83D\uDCAC" }), _jsxs("div", { children: [_jsx("h1", { style: {
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        margin: 0,
                                        lineHeight: 1.2
                                    }, children: "WA Business" }), _jsx("p", { style: {
                                        fontSize: '12px',
                                        color: '#808080',
                                        margin: '4px 0 0 0'
                                    }, children: "Desk Platform" })] })] }) }), _jsx("nav", { style: {
                    flex: 1,
                    padding: '20px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    overflowY: 'auto'
                }, children: menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (_jsxs("button", { onClick: () => nav(item.path), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '10px',
                            background: isActive
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'transparent',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: isActive ? '600' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            textAlign: 'left',
                            position: 'relative',
                            overflow: 'hidden'
                        }, onMouseEnter: (e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }
                        }, onMouseLeave: (e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                            }
                        }, children: [_jsx("span", { style: { fontSize: '20px' }, children: item.icon }), _jsx("span", { children: item.label }), isActive && (_jsx("div", { style: {
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '4px',
                                    height: '60%',
                                    background: '#ffffff',
                                    borderRadius: '0 4px 4px 0'
                                } }))] }, item.path));
                }) }), _jsx("div", { style: {
                    padding: '16px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }, children: _jsxs("button", { onClick: handleLogout, style: {
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        border: '1px solid rgba(255, 154, 158, 0.3)',
                        borderRadius: '10px',
                        background: 'rgba(255, 154, 158, 0.1)',
                        color: '#ff9a9e',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }, onMouseEnter: (e) => {
                        e.currentTarget.style.background = 'rgba(255, 154, 158, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255, 154, 158, 0.5)';
                    }, onMouseLeave: (e) => {
                        e.currentTarget.style.background = 'rgba(255, 154, 158, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 154, 158, 0.3)';
                    }, children: [_jsx("span", { style: { fontSize: '20px' }, children: "\uD83D\uDEAA" }), _jsx("span", { children: "Logout" })] }) })] }));
}
