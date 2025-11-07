import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../api';
import { tokenStore } from '../store';
import { useNavigate } from 'react-router-dom';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const nav = useNavigate();
    // 如果已登录则重定向
    useEffect(() => {
        if (tokenStore.token) {
            nav('/dashboard');
        }
    }, [nav]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setMsg('请填写所有字段');
            return;
        }
        setIsLoading(true);
        setMsg('');
        try {
            const r = await api.post('/auth/login', { email, password });
            tokenStore.token = r.data.token;
            setMsg('登录成功！正在跳转...');
            setTimeout(() => nav('/dashboard'), 1000);
        }
        catch (e) {
            setMsg(e.response?.data?.error || '登录失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }, children: _jsxs("div", { className: "card", style: {
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '32px' }, children: [_jsx("div", { style: {
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                            }, children: "\uD83D\uDCAC" }), _jsx("h1", { style: {
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 8px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }, children: "\u6B22\u8FCE\u56DE\u6765" }), _jsx("p", { style: {
                                color: '#b3b3b3',
                                fontSize: '16px',
                                margin: 0
                            }, children: "\u767B\u5F55\u5230 WA Business Desk" })] }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u90AE\u7BB1\u5730\u5740" }), _jsx("input", { className: "input", type: "email", placeholder: "\u8BF7\u8F93\u5165\u60A8\u7684\u90AE\u7BB1", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u5BC6\u7801" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { className: "input", type: showPassword ? 'text' : 'password', placeholder: "\u8BF7\u8F93\u5165\u60A8\u7684\u5BC6\u7801", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, style: { paddingRight: '48px' } }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: {
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#b3b3b3',
                                                cursor: 'pointer',
                                                fontSize: '18px'
                                            }, children: showPassword ? '🙈' : '👁️' })] })] }), msg && (_jsx("div", { className: `message ${msg.includes('成功') ? 'message-success' : 'message-error'}`, children: msg })), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading, style: {
                                width: '100%',
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: '600'
                            }, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "loading" }), "\u767B\u5F55\u4E2D..."] })) : ('🔑 登录') }), _jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                margin: '24px 0'
                            }, children: [_jsx("div", { style: { flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' } }), _jsx("span", { style: { color: '#808080', fontSize: '14px' }, children: "\u6216" }), _jsx("div", { style: { flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' } })] }), _jsx("div", { style: { textAlign: 'center' }, children: _jsxs("span", { style: { color: '#b3b3b3', fontSize: '14px' }, children: ["\u8FD8\u6CA1\u6709\u8D26\u6237\uFF1F", ' ', _jsx("button", { type: "button", onClick: () => nav('/register'), style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#667eea',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '14px'
                                        }, children: "\u7ACB\u5373\u6CE8\u518C" })] }) })] })] }) }));
}
