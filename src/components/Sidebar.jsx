import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/profile', icon: '👤', label: 'User Profile' },
    { path: '/workouts', icon: '💪', label: 'Class & Workout' },
    { path: '/devices', icon: '⌚', label: 'Manage Devices' },
    { path: '/family', icon: '👨‍👩‍👧‍👦', label: 'Manage Family' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Wearables App</h2>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-logout" onClick={onClose}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Logout</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
