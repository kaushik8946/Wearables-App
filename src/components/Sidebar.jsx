import { NavLink } from 'react-router-dom';
import { BsHouse, BsSmartwatch, BsPeople, BsActivity, BsPersonCircle, BsBoxArrowRight, BsX } from 'react-icons/bs';
import '../styles/components/Sidebar.css';

const Sidebar = ({ isOpen, onClose, onLogout }) => {
  const menuItems = [
    { id: 1, path: '/dashboard', label: 'Dashboard', icon: BsHouse },
    { id: 2, path: '/devices', label: 'Devices', icon: BsSmartwatch },
    { id: 3, path: '/users', label: 'Users', icon: BsPeople },
    { id: 4, path: '/class-workout', label: 'Class & Workout', icon: BsActivity },
    { id: 5, path: '/manage-account', label: 'Manage Account', icon: BsPersonCircle },
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
            <BsX size={24} />
          </button>
        </div>

        <ul className="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id} className="sidebar-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-icon"><IconComponent size={24} /></span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon"><BsBoxArrowRight size={24} /></span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
