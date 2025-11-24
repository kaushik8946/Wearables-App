import { useState, useEffect } from 'react';
import { MdMenu, MdArrowDropDown } from 'react-icons/md';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStorageItem, getStorageJSON, setStorageItem, clearStorage, subscribeToUserChange, notifyUserChange } from '../../service';
import './Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [defaultUserName, setDefaultUserName] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [currentDefaultUserId, setCurrentDefaultUserId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    let isMounted = true;
    
    const loadUsers = async () => {
      try {
        const defaultUserId = await getStorageItem('defaultUserId');
        if (!isMounted) return;
        
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const users = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        setAllUsers(users);
        setCurrentDefaultUserId(defaultUserId || '');
        
        const defUser = users.find(u => String(u.id) === String(defaultUserId));
        setDefaultUserName(defUser?.name || '');
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
        const defaultUserId = await getStorageItem('defaultUserId');
        if (!isMounted) return;
        
        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
        if (!isMounted) return;
        
        const users = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
        setAllUsers(users);
        setCurrentDefaultUserId(defaultUserId || '');
        
        const defUser = users.find(u => String(u.id) === String(defaultUserId));
        setDefaultUserName(defUser?.name || '');
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
      
      // Update defaultUser in storage
      const user = allUsers.find(u => String(u.id) === String(userId));
      if (user) {
        const { self: _self, ...rest } = user;
        await getStorageJSON('defaultUser', rest);
      }
      
      setCurrentDefaultUserId(userId);
      setDefaultUserName(user?.name || '');
      setShowUserDropdown(false);
      notifyUserChange();
    } catch (err) {
      console.error('Failed to switch user', err);
    }
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
          <h1 className="app-title">Welcome{defaultUserName ? `, ${defaultUserName}` : ''}</h1>
          {allUsers.length > 1 && (
            <>
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  color: '#333'
                }}
                aria-label="Switch user"
              >
                <MdArrowDropDown size={24} />
              </button>
              {showUserDropdown && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '8px',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 999,
                      overflow: 'hidden'
                    }}
                  >
                    {allUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSwitch(user.id)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: String(user.id) === String(currentDefaultUserId) ? '#f0f0f0' : 'white',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: String(user.id) === String(currentDefaultUserId) ? '600' : '400',
                          color: '#333',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (String(user.id) !== String(currentDefaultUserId)) {
                            e.currentTarget.style.background = '#f8f8f8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (String(user.id) !== String(currentDefaultUserId)) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        {user.name}
                        {user.self && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>(You)</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
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
