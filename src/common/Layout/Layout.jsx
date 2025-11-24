import { useState, useEffect } from 'react';
import { MdMenu, MdKeyboardArrowDown } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStorageItem, getStorageJSON, clearStorage, subscribeToUserChange, setStorageItem } from '../../service';
import './Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeUserName, setActiveUserName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [activeUserId, setActiveUserId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      try {
        // Get active user ID (or fall back to default)
        let activeId = await getStorageItem('activeUserId');
        const defaultUserId = await getStorageItem('defaultUserId');
        
        if (!activeId) {
          activeId = defaultUserId;
        }
        
        if (!isMounted) return;
        
        // Get all users
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const users = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        setAllUsers(users);
        
        // Find active user
        const activeUser = users.find(u => String(u.id) === String(activeId));
        setActiveUserName(activeUser?.name || '');
        setActiveUserId(activeId || '');
      } catch {
        if (isMounted) {
          setActiveUserName('');
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
        // Get active user ID (or fall back to default)
        let activeId = await getStorageItem('activeUserId');
        const defaultUserId = await getStorageItem('defaultUserId');
        
        if (!activeId) {
          activeId = defaultUserId;
        }
        
        if (!isMounted) return;
        
        // Get all users
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const users = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        setAllUsers(users);
        
        // Find active user
        const activeUser = users.find(u => String(u.id) === String(activeId));
        setActiveUserName(activeUser?.name || '');
        setActiveUserId(activeId || '');
      } catch {
        if (isMounted) {
          setActiveUserName('');
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserDropdown && !e.target.closest('.user-dropdown-wrapper')) {
        setShowUserDropdown(false);
      }
    };
    
    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserDropdown]);

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

  const handleUserSelect = async (userId) => {
    try {
      await setStorageItem('activeUserId', String(userId));
      const selectedUser = allUsers.find(u => String(u.id) === String(userId));
      setActiveUserName(selectedUser?.name || '');
      setActiveUserId(String(userId));
      setShowUserDropdown(false);
      
      // Trigger a user change event to update dashboard
      window.dispatchEvent(new CustomEvent('user-data-changed'));
    } catch (err) {
      console.error('Failed to set active user', err);
    }
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div 
          className="user-dropdown-wrapper"
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => setShowUserDropdown(!showUserDropdown)}
        >
          <h1 className="app-title">Welcome{activeUserName ? `, ${activeUserName}` : ''}</h1>
          {allUsers.length > 1 && (
            <MdKeyboardArrowDown 
              size={24} 
              style={{ 
                color: '#333', 
                transition: 'transform 0.2s',
                transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
              }} 
            />
          )}
          
          {showUserDropdown && allUsers.length > 1 && (
            <div 
              className="user-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '200px',
                zIndex: 1000,
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {allUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: String(user.id) === String(activeUserId) ? '#f0f0f0' : 'white',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                    fontWeight: String(user.id) === String(activeUserId) ? '600' : '400'
                  }}
                  onMouseEnter={(e) => {
                    if (String(user.id) !== String(activeUserId)) {
                      e.target.style.background = '#f8f8f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (String(user.id) !== String(activeUserId)) {
                      e.target.style.background = 'white';
                    }
                  }}
                >
                  {user.name || 'Unnamed'}
                  {user.self && <span style={{ marginLeft: '8px', color: '#667eea', fontSize: '12px' }}>(Self)</span>}
                </div>
              ))}
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
