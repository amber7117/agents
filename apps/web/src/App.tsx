import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { tokenStore } from './store';
import { Sidebar } from './components/Sidebar';


export default function App(){
  const nav = useNavigate();
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <>
     
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        background: '#FFFFFF'
      }}>
        {!isAuthPage && <Sidebar />}
        
        <main style={{
          flex: 1,
          marginLeft: isAuthPage ? '0' : '250px',
          minHeight: '100vh',
          padding: isAuthPage ? '0' : '0',
          width: isAuthPage ? '100%' : 'calc(100% - 250px)',
          backgroundColor: '#FFFFFF'
        }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}