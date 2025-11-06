import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { tokenStore } from './store';
import { Sidebar } from './components/Sidebar';

// 内联样式来避免CSS导入问题
const globalStyles = `
:root {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #252525;
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-tertiary: #808080;
  --border-color: rgba(255, 255, 255, 0.1);
  --border-radius: 12px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 24px;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: var(--transition);
}

.card:hover {
  background: var(--bg-card-hover);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  transform: translateY(-2px);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
  border-color: rgba(102, 126, 234, 0.5);
}

.btn-danger {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: white;
}

.btn-success {
  background: var(--gradient-success);
  color: white;
}

.input {
  width: 100%;
  padding: 14px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 14px;
  transition: var(--transition);
}

.input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.8);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.message {
  padding: 12px 16px;
  border-radius: var(--border-radius);
  font-size: 14px;
  font-weight: 500;
}

.message-success {
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  color: #4facfe;
}

.message-error {
  background: rgba(255, 154, 158, 0.1);
  border: 1px solid rgba(255, 154, 158, 0.3);
  color: #ff9a9e;
}

.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

export default function App(){
  const nav = useNavigate();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)'
      }}>
        {!isAuthPage && <Sidebar />}
        
        <main style={{
          flex: 1,
          marginLeft: isAuthPage ? '0' : '260px',
          minHeight: '100vh',
          padding: isAuthPage ? '0' : '24px',
          width: isAuthPage ? '100%' : 'calc(100% - 260px)'
        }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}