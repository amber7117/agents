import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [msg, setMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validations, setValidations] = useState({
        email: false,
        password: false,
        confirmPassword: false,
        firstName: false
    });
    const nav = useNavigate();
    // 表单验证
    useEffect(() => {
        setValidations({
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
            password: formData.password.length >= 6,
            confirmPassword: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
            firstName: formData.firstName.trim().length >= 2
        });
    }, [formData]);
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setMsg(''); // 清除错误消息
    };
    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6)
            strength++;
        if (password.length >= 8)
            strength++;
        if (/[A-Z]/.test(password))
            strength++;
        if (/[a-z]/.test(password))
            strength++;
        if (/[0-9]/.test(password))
            strength++;
        if (/[^A-Za-z0-9]/.test(password))
            strength++;
        return strength;
    };
    const getStrengthColor = (strength) => {
        if (strength <= 2)
            return '#ff9a9e';
        if (strength <= 4)
            return '#ffecd2';
        return '#4facfe';
    };
    const getStrengthText = (strength) => {
        if (strength <= 2)
            return '弱';
        if (strength <= 4)
            return '中';
        return '强';
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        // 验证所有字段
        if (!validations.email) {
            setMsg('请输入有效的邮箱地址');
            return;
        }
        if (!validations.password) {
            setMsg('密码至少需要6个字符');
            return;
        }
        if (!validations.confirmPassword) {
            setMsg('密码确认不匹配');
            return;
        }
        if (!validations.firstName) {
            setMsg('姓名至少需要2个字符');
            return;
        }
        setIsLoading(true);
        setMsg('');
        try {
            await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone
            });
            setMsg('注册成功！正在跳转到登录页面...');
            setTimeout(() => nav('/login'), 2000);
        }
        catch (e) {
            setMsg(e.response?.data?.error || '注册失败，请稍后重试');
        }
        finally {
            setIsLoading(false);
        }
    };
    const passwordStrength = getPasswordStrength(formData.password);
    return (_jsx("div", { style: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }, children: _jsxs("div", { className: "card", style: {
                width: '100%',
                maxWidth: '480px',
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: '32px' }, children: [_jsx("div", { style: {
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '40px',
                                margin: '0 auto 16px',
                                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)'
                            }, children: "\uD83D\uDE80" }), _jsx("h1", { style: {
                                fontSize: '28px',
                                fontWeight: '700',
                                margin: '0 0 8px',
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }, children: "\u521B\u5EFA\u8D26\u6237" }), _jsx("p", { style: {
                                color: '#b3b3b3',
                                fontSize: '16px',
                                margin: 0
                            }, children: "\u5F00\u59CB\u60A8\u7684 WhatsApp \u4E1A\u52A1\u4E4B\u65C5" })] }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u59D3\u540D *" }), _jsx("input", { className: "input", type: "text", placeholder: "\u59D3", value: formData.firstName, onChange: (e) => handleInputChange('firstName', e.target.value), disabled: isLoading, style: {
                                                borderColor: formData.firstName && !validations.firstName ? '#ff9a9e' : undefined
                                            } })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u59D3\u6C0F" }), _jsx("input", { className: "input", type: "text", placeholder: "\u540D", value: formData.lastName, onChange: (e) => handleInputChange('lastName', e.target.value), disabled: isLoading })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u90AE\u7BB1\u5730\u5740 *" }), _jsx("input", { className: "input", type: "email", placeholder: "your@email.com", value: formData.email, onChange: (e) => handleInputChange('email', e.target.value), disabled: isLoading, style: {
                                        borderColor: formData.email && !validations.email ? '#ff9a9e' :
                                            validations.email ? '#4facfe' : undefined
                                    } }), formData.email && validations.email && (_jsx("div", { style: { color: '#4facfe', fontSize: '12px', marginTop: '4px' }, children: "\u2705 \u90AE\u7BB1\u683C\u5F0F\u6B63\u786E" }))] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u624B\u673A\u53F7\u7801" }), _jsx("input", { className: "input", type: "tel", placeholder: "+1 (555) 123-4567", value: formData.phone, onChange: (e) => handleInputChange('phone', e.target.value), disabled: isLoading })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u5BC6\u7801 *" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { className: "input", type: showPassword ? 'text' : 'password', placeholder: "\u81F3\u5C116\u4E2A\u5B57\u7B26", value: formData.password, onChange: (e) => handleInputChange('password', e.target.value), disabled: isLoading, style: {
                                                paddingRight: '48px',
                                                borderColor: formData.password && !validations.password ? '#ff9a9e' : undefined
                                            } }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), style: {
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#b3b3b3',
                                                cursor: 'pointer',
                                                fontSize: '18px'
                                            }, children: showPassword ? '🙈' : '👁️' })] }), formData.password && (_jsxs("div", { style: { marginTop: '8px' }, children: [_jsxs("div", { style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '4px'
                                            }, children: [_jsx("span", { style: { fontSize: '12px', color: '#b3b3b3' }, children: "\u5BC6\u7801\u5F3A\u5EA6" }), _jsx("span", { style: {
                                                        fontSize: '12px',
                                                        color: getStrengthColor(passwordStrength),
                                                        fontWeight: '600'
                                                    }, children: getStrengthText(passwordStrength) })] }), _jsx("div", { style: {
                                                width: '100%',
                                                height: '4px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '2px',
                                                overflow: 'hidden'
                                            }, children: _jsx("div", { style: {
                                                    width: `${(passwordStrength / 6) * 100}%`,
                                                    height: '100%',
                                                    background: getStrengthColor(passwordStrength),
                                                    transition: 'all 0.3s ease'
                                                } }) })] }))] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", children: "\u786E\u8BA4\u5BC6\u7801 *" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { className: "input", type: showConfirmPassword ? 'text' : 'password', placeholder: "\u518D\u6B21\u8F93\u5165\u5BC6\u7801", value: formData.confirmPassword, onChange: (e) => handleInputChange('confirmPassword', e.target.value), disabled: isLoading, style: {
                                                paddingRight: '48px',
                                                borderColor: formData.confirmPassword && !validations.confirmPassword ? '#ff9a9e' :
                                                    validations.confirmPassword ? '#4facfe' : undefined
                                            } }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), style: {
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#b3b3b3',
                                                cursor: 'pointer',
                                                fontSize: '18px'
                                            }, children: showConfirmPassword ? '🙈' : '👁️' })] }), formData.confirmPassword && validations.confirmPassword && (_jsx("div", { style: { color: '#4facfe', fontSize: '12px', marginTop: '4px' }, children: "\u2705 \u5BC6\u7801\u5339\u914D" }))] }), msg && (_jsx("div", { className: `message ${msg.includes('成功') ? 'message-success' : 'message-error'}`, children: msg })), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading || !Object.values(validations).every(Boolean), style: {
                                width: '100%',
                                height: '48px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: Object.values(validations).every(Boolean) ?
                                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                                    'rgba(255, 255, 255, 0.1)'
                            }, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "loading" }), "\u521B\u5EFA\u8D26\u6237\u4E2D..."] })) : ('🚀 创建账户') }), _jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                margin: '24px 0'
                            }, children: [_jsx("div", { style: { flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' } }), _jsx("span", { style: { color: '#808080', fontSize: '14px' }, children: "\u6216" }), _jsx("div", { style: { flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' } })] }), _jsx("div", { style: { textAlign: 'center' }, children: _jsxs("span", { style: { color: '#b3b3b3', fontSize: '14px' }, children: ["\u5DF2\u6709\u8D26\u6237\uFF1F", ' ', _jsx("button", { type: "button", onClick: () => nav('/login'), style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#f093fb',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontSize: '14px'
                                        }, children: "\u7ACB\u5373\u767B\u5F55" })] }) }), _jsxs("div", { style: {
                                marginTop: '16px',
                                padding: '16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: '#808080',
                                textAlign: 'center'
                            }, children: ["\u521B\u5EFA\u8D26\u6237\u5373\u8868\u793A\u60A8\u540C\u610F\u6211\u4EEC\u7684", ' ', _jsx("span", { style: { color: '#f093fb', cursor: 'pointer' }, children: "\u670D\u52A1\u6761\u6B3E" }), ' ', "\u548C", ' ', _jsx("span", { style: { color: '#f093fb', cursor: 'pointer' }, children: "\u9690\u79C1\u653F\u7B56" })] })] })] }) }));
}
