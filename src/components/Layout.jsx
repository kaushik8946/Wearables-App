import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/components/Layout.css';


const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 1, label: 'Home', icon: '🏠', link: '/dashboard', active: location.pathname === '/dashboard' },
    { id: 2, label: 'User Profile', icon: '👤', link: '/profile', active: location.pathname === '/profile' },
    { id: 3, label: 'Class & Workout', icon: '💪', link: '/workouts', active: location.pathname === '/workouts' },
    { id: 4, label: 'Manage Devices', icon: '⌚', link: '/devices', active: location.pathname === '/devices' },
    { id: 5, label: 'Manage Family', icon: '👨‍👩‍👧‍👦', link: '/family', active: location.pathname === '/family' },
  ];

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setSidebarOpen(false);
    navigate('/', { replace: true });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      {/* Top Header with Hamburger */}
      <header className="app-header">
        <h1 className="app-title">Wearables App</h1>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
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
