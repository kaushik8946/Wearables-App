import { useState, useEffect } from 'react';
import { MdMenu } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStorageItem, getStorageJSON, clearStorage, subscribeToUserChange } from '../../service';
import './Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defaultUserName, setDefaultUserName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    let isMounted = true;
    
    const loadDefaultUserName = async () => {
      try {
        const defaultUserId = await getStorageItem('defaultUserId');
        if (!isMounted) return;
        
        if (!defaultUserId) {
          setDefaultUserName('');
          return;
        }
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        const defUser = allUsers.find(u => String(u.id) === String(defaultUserId));
        setDefaultUserName(defUser?.name || '');
      } catch {
        if (isMounted) {
          setDefaultUserName('');
        }
      }
    };
    
    loadDefaultUserName();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    
    const loadDefaultUserName = async () => {
      try {
        const defaultUserId = await getStorageItem('defaultUserId');
        if (!isMounted) return;
        
        if (!defaultUserId) {
          setDefaultUserName('');
          return;
        }
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        const defUser = allUsers.find(u => String(u.id) === String(defaultUserId));
        setDefaultUserName(defUser?.name || '');
      } catch {
        if (isMounted) {
          setDefaultUserName('');
        }
      }
    };
    
    // Listen for user data changes
    const unsubscribe = subscribeToUserChange(() => {
      loadDefaultUserName();
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
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
      await clearStorage();
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
