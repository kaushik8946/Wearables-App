import { useState, useEffect, createContext } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useNavigate, useLocation } from 'react-router-dom';
import { idbClear, idbGet, idbGetJSON, onUserChange } from '../data/db';
import '../styles/components/Layout.css';

export const LogoutContext = createContext();


const Layout = () => {
  const [defaultUserName, setDefaultUserName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  const loadDefaultUserName = async () => {
    try {
      const defaultUserId = await idbGet('defaultUserId');
      if (!defaultUserId) {
        setDefaultUserName('');
        return;
      }
      const currentUser = await idbGetJSON('currentUser', null);
      const otherUsers = await idbGetJSON('users', []);
      const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
      const defUser = allUsers.find(u => String(u.id) === String(defaultUserId));
      setDefaultUserName(defUser?.name || '');
    } catch {
      setDefaultUserName('');
    }
  };

  useEffect(() => {
    const loadName = async () => {
      await loadDefaultUserName();
    };
    loadName();
  }, [location.pathname]);

  useEffect(() => {
    // Listen for user data changes
    const unsubscribe = onUserChange(() => {
      loadDefaultUserName();
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await idbClear();
    } catch (err) {
      console.error('Failed to clear IndexedDB during logout', err);
    }
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  return (
    <LogoutContext.Provider value={handleLogout}>
      <div className="layout">
        <header className="app-header">
          <h1 className="app-title">Welcome{defaultUserName ? ", " + defaultUserName : ''}</h1>
        </header>

        {/* Main Content */}
        <main className="app-content">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </LogoutContext.Provider>
  );
};

export default Layout;
