import { NavLink } from 'react-router-dom';
import '../styles/components/Sidebar.css';

const Sidebar = ({ isOpen, onClose, onLogout }) => {
  const menuItems = [
    { id: 1, path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { id: 2, path: '/devices', label: 'Devices', icon: '⌚' },
    { id: 3, path: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { id: 4, path: '/class-workout', label: 'Class & Workout', icon: '🏋️' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay sidebar-overlay-open"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>

        <ul className="sidebar-nav">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon">↩️</span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
