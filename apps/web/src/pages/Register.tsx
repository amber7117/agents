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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMsg(''); // 清除错误消息
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return '#ff9a9e';
    if (strength <= 4) return '#ffecd2';
    return '#4facfe';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return '弱';
    if (strength <= 4) return '中';
    return '强';
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (e: any) {
      setMsg(e.response?.data?.error || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
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
          }}>
            🚀
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            创建账户
          </h1>
          <p style={{
            color: '#b3b3b3',
            fontSize: '16px',
            margin: 0
          }}>
            开始您的 WhatsApp 业务之旅
          </p>
        </div>

        {/* 注册表单 */}
        <form className="form" onSubmit={handleSubmit}>
          {/* 姓名字段 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input
                className="input"
                type="text"
                placeholder="姓"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={isLoading}
                style={{
                  borderColor: formData.firstName && !validations.firstName ? '#ff9a9e' : undefined
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">姓氏</label>
              <input
                className="input"
                type="text"
                placeholder="名"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 邮箱字段 */}
          <div className="form-group">
            <label className="form-label">邮箱地址 *</label>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              style={{
                borderColor: formData.email && !validations.email ? '#ff9a9e' : 
                           validations.email ? '#4facfe' : undefined
              }}
            />
            {formData.email && validations.email && (
              <div style={{ color: '#4facfe', fontSize: '12px', marginTop: '4px' }}>
                ✅ 邮箱格式正确
              </div>
            )}
          </div>

          {/* 手机号字段 */}
          <div className="form-group">
            <label className="form-label">手机号码</label>
            <input
              className="input"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* 密码字段 */}
          <div className="form-group">
            <label className="form-label">密码 *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="至少6个字符"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                style={{
                  paddingRight: '48px',
                  borderColor: formData.password && !validations.password ? '#ff9a9e' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* 密码强度指示器 */}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '12px', color: '#b3b3b3' }}>密码强度</span>
                  <span style={{
                    fontSize: '12px',
                    color: getStrengthColor(passwordStrength),
                    fontWeight: '600'
                  }}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength / 6) * 100}%`,
                    height: '100%',
                    background: getStrengthColor(passwordStrength),
                    transition: 'all 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}
          </div>

          {/* 确认密码字段 */}
          <div className="form-group">
            <label className="form-label">确认密码 *</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                style={{
                  paddingRight: '48px',
                  borderColor: formData.confirmPassword && !validations.confirmPassword ? '#ff9a9e' : 
                             validations.confirmPassword ? '#4facfe' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.confirmPassword && validations.confirmPassword && (
              <div style={{ color: '#4facfe', fontSize: '12px', marginTop: '4px' }}>
                ✅ 密码匹配
              </div>
            )}
          </div>

          {msg && (
            <div className={`message ${msg.includes('成功') ? 'message-success' : 'message-error'}`}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !Object.values(validations).every(Boolean)}
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600',
              background: Object.values(validations).every(Boolean) ? 
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 
                'rgba(255, 255, 255, 0.1)'
            }}
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                创建账户中...
              </>
            ) : (
              '🚀 创建账户'
            )}
          </button>

          {/* 分割线 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ color: '#808080', fontSize: '14px' }}>或</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          </div>

          {/* 登录链接 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
              已有账户？{' '}
              <button
                type="button"
                onClick={() => nav('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f093fb',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                立即登录
              </button>
            </span>
          </div>

          {/* 服务条款 */}
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#808080',
            textAlign: 'center'
          }}>
            创建账户即表示您同意我们的{' '}
            <span style={{ color: '#f093fb', cursor: 'pointer' }}>服务条款</span>{' '}
            和{' '}
            <span style={{ color: '#f093fb', cursor: 'pointer' }}>隐私政策</span>
          </div>
        </form>
      </div>
    </div>
  );
}