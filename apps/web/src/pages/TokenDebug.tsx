import { useEffect, useState } from 'react';
import { tokenStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function TokenDebug() {
  const nav = useNavigate();
  const [tokenInfo, setTokenInfo] = useState({
    exists: false,
    value: '',
    localStorageValue: '',
  });

  useEffect(() => {
    const token = tokenStore.token;
    const lsToken = localStorage.getItem('token');
    
    setTokenInfo({
      exists: !!token,
      value: token || '(empty)',
      localStorageValue: lsToken || '(empty)',
    });

    console.log('=== Token Debug Info ===');
    console.log('tokenStore.token:', token);
    console.log('localStorage token:', lsToken);
    console.log('Token exists:', !!token);
    console.log('=======================');
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1 style={{ marginBottom: '30px' }}>🔍 Token 调试信息</h1>
      
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Token 状态</h3>
        <p><strong>Token 存在:</strong> {tokenInfo.exists ? '✅ 是' : '❌ 否'}</p>
        <p><strong>tokenStore.token:</strong></p>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {tokenInfo.value}
        </pre>
        
        <p><strong>localStorage['token']:</strong></p>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {tokenInfo.localStorageValue}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => nav('/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          返回 Dashboard
        </button>
        
        <button 
          onClick={() => {
            console.log('Current token:', tokenStore.token);
            console.log('Current localStorage:', localStorage.getItem('token'));
            alert(`Token: ${tokenStore.token ? '存在' : '不存在'}`);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          刷新检查
        </button>
        
        <button 
          onClick={() => {
            tokenStore.token = 'test-token-' + Date.now();
            window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          设置测试 Token
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p>💡 提示:</p>
        <ul>
          <li>如果 token 存在但仍然跳转到登录页，可能是 API 请求返回 401</li>
          <li>检查浏览器控制台查看详细的 API 请求日志</li>
          <li>确保后端服务器正在运行</li>
        </ul>
      </div>
    </div>
  );
}
