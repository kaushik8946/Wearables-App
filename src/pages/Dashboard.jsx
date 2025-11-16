import '../styles/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h2>Health Tracker Dashboard</h2>
        <p className="page-subtitle">Your daily health overview</p>
        
        <div className="placeholder-box">
          <p>📊 Health metrics and stats will be displayed here</p>
          <p className="hint">Heart rate, steps, calories, sleep data, etc.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
