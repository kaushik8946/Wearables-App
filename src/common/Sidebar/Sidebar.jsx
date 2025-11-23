import { NavLink } from 'react-router-dom';
import { MdDashboard, MdWatch, MdGroup, MdFitnessCenter, MdPerson } from 'react-icons/md';
import { BsBoxArrowLeft } from 'react-icons/bs';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, onLogout }) => {
  const menuItems = [
    { id: 1, path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { id: 2, path: '/devices', label: 'Devices', icon: '⌚' },
    { id: 3, path: '/users', label: 'Users', icon: '👨‍👩‍👧‍👦' },
    { id: 4, path: '/class-workout', label: 'Class & Workout', icon: '🏋️' },
    { id: 5, path: '/manage-account', label: 'Manage Account', icon: '🧑‍💼' },
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
          {menuItems.map((item) => {
            const icons = {
              '/dashboard': <MdDashboard size={22} style={{ fontWeight: 'bold', color: '#111' }} />,
              '/devices': <MdWatch size={22} style={{ fontWeight: 'bold', color: '#111' }} />,
              '/users': <MdGroup size={22} style={{ fontWeight: 'bold', color: '#111' }} />,
              '/class-workout': <MdFitnessCenter size={22} style={{ fontWeight: 'bold', color: '#111' }} />,
              '/manage-account': <MdPerson size={22} style={{ fontWeight: 'bold', color: '#111' }} />,
            };
            return (
              <li key={item.id} className="sidebar-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-icon" style={{ fontWeight: 'bold', color: '#111' }}>
                    {icons[item.path]}
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon" style={{ fontWeight: 'bold', color: '#111' }}>
              <BsBoxArrowLeft size={22} style={{ fontWeight: 'bold', color: '#111' }} />
            </span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
