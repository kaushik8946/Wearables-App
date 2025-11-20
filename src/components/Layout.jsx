import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useLocation } from 'react-router-dom';
import { idbGet, idbGetJSON, onUserChange } from '../data/db';
import '../styles/components/Layout.css';


const Layout = () => {
  const [defaultUserName, setDefaultUserName] = useState('');
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

  return (
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
  );
};

export default Layout;
