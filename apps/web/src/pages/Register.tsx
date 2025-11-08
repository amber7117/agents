import { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

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
    setMsg('');
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
    if (strength <= 2) return 'text-red-500';
    if (strength <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return '弱';
    if (strength <= 4) return '中';
    return '强';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="auth-page">
      <div className="card auth-form" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-xl mb-4">
            <span className="text-5xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            创建账户
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            开始您的 WhatsApp 业务之旅
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">姓名 *</label>
              <input
                className={`input ${formData.firstName && !validations.firstName ? 'border-red-500' : ''}`}
                type="text"
                placeholder="姓"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={isLoading}
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

          <div className="form-group">
            <label className="form-label">邮箱地址 *</label>
            <input
              className={`input ${formData.email && !validations.email ? 'border-red-500' :
                  validations.email ? 'border-green-500' : ''
                }`}
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
            />
            {formData.email && validations.email && (
              <div className="text-green-500 text-xs mt-1">
                ✅ 邮箱格式正确
              </div>
            )}
          </div>

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

          <div className="form-group">
            <label className="form-label">密码 *</label>
            <div className="relative">
              <input
                className={`input pr-12 ${formData.password && !validations.password ? 'border-red-500' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="至少6个字符"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? '🙈' : '👁️'}
              </Button>
            </div>

            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">密码强度</span>
                  <span className={`text-xs font-semibold ${getStrengthColor(passwordStrength)}`}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength <= 2 ? 'bg-red-500' :
                        passwordStrength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${(passwordStrength / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">确认密码 *</label>
            <div className="relative">
              <input
                className={`input pr-12 ${formData.confirmPassword && !validations.confirmPassword ? 'border-red-500' :
                    validations.confirmPassword ? 'border-green-500' : ''
                  }`}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </Button>
            </div>
            {formData.confirmPassword && validations.confirmPassword && (
              <div className="text-green-500 text-xs mt-1">
                ✅ 密码匹配
              </div>
            )}
          </div>

          {msg && (
            <div className={`p-3 rounded-lg text-sm font-medium ${msg.includes('成功')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
              {msg}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !Object.values(validations).every(Boolean)}
            className={`w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] focus:ring-4 ${Object.values(validations).every(Boolean)
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white focus:ring-pink-500/50'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                创建账户中...
              </>
            ) : (
              <>
                <span className="mr-2">🚀</span>
                创建账户
              </>
            )}
          </Button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">或</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          </div>

          <div className="text-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              已有账户？{' '}
              <button
                type="button"
                onClick={() => nav('/login')}
                className="text-pink-500 dark:text-pink-400 font-semibold hover:text-pink-600 dark:hover:text-pink-300 transition-colors"
              >
                立即登录
              </button>
            </span>
          </div>

          <div className="mt-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 text-center">
            创建账户即表示您同意我们的{' '}
            <span className="text-pink-500 dark:text-pink-400 cursor-pointer hover:underline">服务条款</span>{' '}
            和{' '}
            <span className="text-pink-500 dark:text-pink-400 cursor-pointer hover:underline">隐私政策</span>
          </div>
        </form>
      </div>
    </div>
  );
}
