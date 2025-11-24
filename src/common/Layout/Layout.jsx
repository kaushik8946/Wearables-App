import { useState, useEffect } from 'react';
import { MdMenu } from 'react-icons/md';
import { ChevronDown } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStorageItem, setStorageItem, clearStorage, subscribeToUserChange, getAllUsers, notifyUserChange } from '../../service';
import './Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defaultUserName, setDefaultUserName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        const defaultUserId = await getStorageItem('defaultUserId');
        
        if (!isMounted) return;
        
        setAllUsers(users);
        setSelectedUserId(defaultUserId || '');
        
        if (defaultUserId) {
          const defUser = users.find(u => String(u.id) === String(defaultUserId));
          setDefaultUserName(defUser?.name || '');
        } else {
          setDefaultUserName('');
        }
      } catch {
        if (isMounted) {
          setDefaultUserName('');
          setAllUsers([]);
        }
      }
    };
    
    loadUsers();
    
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      try {
        const users = await getAllUsers();
        const defaultUserId = await getStorageItem('defaultUserId');
        
        if (!isMounted) return;
        
        setAllUsers(users);
        setSelectedUserId(defaultUserId || '');
        
        if (defaultUserId) {
          const defUser = users.find(u => String(u.id) === String(defaultUserId));
          setDefaultUserName(defUser?.name || '');
        } else {
          setDefaultUserName('');
        }
      } catch {
        if (isMounted) {
          setDefaultUserName('');
          setAllUsers([]);
        }
      }
    };
    
    // Listen for user data changes
    const unsubscribe = subscribeToUserChange(() => {
      loadUsers();
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

  const handleUserSwitch = async (userId) => {
    try {
      await setStorageItem('defaultUserId', userId);
      const user = allUsers.find(u => String(u.id) === String(userId));
      setDefaultUserName(user?.name || '');
      setSelectedUserId(userId);
      setShowUserDropdown(false);
      
      // Trigger user change notification to update dashboard
      notifyUserChange();
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div className="header-user-section">
          <h1 className="app-title">Welcome{defaultUserName ? `, ${defaultUserName}` : ''}</h1>
          {allUsers.length > 1 && (
            <div className="user-dropdown-container">
              <button 
                className="user-dropdown-trigger" 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                aria-label="Switch user"
              >
                <ChevronDown size={20} />
              </button>
              {showUserDropdown && (
                <div className="user-dropdown-menu">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      className={`user-dropdown-item ${String(user.id) === String(selectedUserId) ? 'active' : ''}`}
                      onClick={() => handleUserSwitch(user.id)}
                    >
                      {user.name || 'Unnamed User'}
                      {user.self && <span className="user-badge">Self</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
