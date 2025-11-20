import { NavLink } from 'react-router-dom';
import { MdDashboard, MdWatch, MdGroup, MdFitnessCenter, MdPerson } from 'react-icons/md';
import { BsBoxArrowLeft } from 'react-icons/bs';
import '../styles/components/BottomNav.css';

const BottomNav = ({ onLogout }) => {
  const menuItems = [
    { id: 1, path: '/dashboard', label: 'Dashboard', icon: MdDashboard },
    { id: 2, path: '/devices', label: 'Devices', icon: MdWatch },
    { id: 3, path: '/users', label: 'Users', icon: MdGroup },
    { id: 4, path: '/class-workout', label: 'Workout', icon: MdFitnessCenter },
    { id: 5, path: '/manage-account', label: 'Account', icon: MdPerson },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent className="bottom-nav-icon" size={24} />
              <span className="bottom-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
        <button className="bottom-nav-item bottom-nav-logout" onClick={onLogout}>
          <BsBoxArrowLeft className="bottom-nav-icon" size={24} />
          <span className="bottom-nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
