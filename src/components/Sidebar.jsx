import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/components/Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/profile', icon: '👤', label: 'User Profile' },
    { path: '/workouts', icon: '💪', label: 'Class & Workout' },
    { path: '/devices', icon: '⌚', label: 'Manage Devices' },
    { path: '/family', icon: '👨‍👩‍👧‍👦', label: 'Manage Family' },
  ];

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.clear();
    sessionStorage.clear();
    
    // Close sidebar
    onClose();
    
    // Redirect to login page
    navigate('/', { replace: true });
  };

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
          <button className="sidebar-logout" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
