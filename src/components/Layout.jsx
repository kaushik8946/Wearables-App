import { useState, useEffect } from 'react';
import { MdMenu } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { idbClear, idbGet, idbGetJSON, onUserChange } from '../data/db';
import '../styles/components/Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    } catch (err) {
      setDefaultUserName('');
    }
  };

  useEffect(() => {
    loadDefaultUserName();
  }, [location.pathname]);

  useEffect(() => {
    // Listen for user data changes
    const unsubscribe = onUserChange(() => {
      loadDefaultUserName();
    });
    return unsubscribe;
  }, []);

  const menuItems = [
    { id: 1, label: 'Home', icon: '🏠', link: '/dashboard', active: location.pathname === '/dashboard' },
    { id: 2, label: 'User Profile', icon: '👤', link: '/profile', active: location.pathname === '/profile' },
    { id: 3, label: 'Class & Workout', icon: '💪', link: '/workouts', active: location.pathname === '/workouts' },
    { id: 4, label: 'Manage Devices', icon: '⌚', link: '/devices', active: location.pathname === '/devices' },
    { id: 5, label: 'Manage Family', icon: '👨‍👩‍👧‍👦', link: '/family', active: location.pathname === '/family' },
  ];

  const handleLogout = async () => {
    try {
      await idbClear();
    } catch (err) {
      console.error('Failed to clear IndexedDB during logout', err);
    }
    sessionStorage.clear();
    setSidebarOpen(false);
    navigate('/', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      <header className="app-header">
        <h1 className="app-title">Welcome{", " + defaultUserName || ' '}</h1>
        <button className="sidebar-toggle" onClick={toggleSidebar} style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MdMenu size={32} style={{ fontWeight: 'bold', color: '#222', filter: 'none' }} />
        </button>
      </header>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={menuItems}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
