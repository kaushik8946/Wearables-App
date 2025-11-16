import '../styles/pages/Profile.css';

const Profile = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h2>User Profile</h2>
        <p className="page-subtitle">Manage your personal information</p>
        
        <div className="placeholder-box">
          <p>👤 User profile details will be displayed here</p>
          <p className="hint">Name, age, gender, email, health goals, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
