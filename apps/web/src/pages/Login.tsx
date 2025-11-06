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

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (e: any) {
      setMsg(e.response?.data?.error || '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

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
        maxWidth: '420px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
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
          }}>
            💬
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            欢迎回来
          </h1>
          <p style={{
            color: '#b3b3b3',
            fontSize: '16px',
            margin: 0
          }}>
            登录到 WA Business Desk
          </p>
        </div>

        {/* 登录表单 */}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱地址</label>
            <input
              className="input"
              type="email"
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{ paddingRight: '48px' }}
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
          </div>

          {msg && (
            <div className={`message ${msg.includes('成功') ? 'message-success' : 'message-error'}`}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            {isLoading ? (
              <>
                <div className="loading"></div>
                登录中...
              </>
            ) : (
              '🔑 登录'
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

          {/* 注册链接 */}
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#b3b3b3', fontSize: '14px' }}>
              还没有账户？{' '}
              <button
                type="button"
                onClick={() => nav('/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                立即注册
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}