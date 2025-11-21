import { X, Scale } from 'lucide-react';
import '../../styles/components/StatsModal.css';

const WeightModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content hide-scrollbar">
        <button onClick={onClose} className="close-btn">
          <X size={20} color="#4b5563" />
        </button>

        <div className="tabs-container">
          <button className="tab-btn">Daily</button>
          <button className="tab-btn active">Weekly</button>
          <button className="tab-btn">Monthly</button>
        </div>

        <div className="big-stat">
          77.9 <span>kg</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>82</span>
            <span>80</span>
            <span>78</span>
            <span>76</span>
            <span>74</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 78.5 },
              { day: 'Mon', val: 78.2 },
              { day: 'Tue', val: 78.0 },
              { day: 'Wed', val: 77.8 },
              { day: 'Thu', val: 77.9 },
              { day: 'Fri', val: 77.7 },
              { day: 'Sat', val: 77.5 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${((item.val - 74) / 8) * 100}%` }}
                ></div>
                <span className="day-label">{item.day}</span>
              </div>
            ))}
          </div>
          <div className="grid-lines-container">
            {[0, 25, 50, 75, 100].map((pos) => (
              <div key={pos} className="grid-line" style={{ bottom: `${pos}%`, marginBottom: '1.5rem' }}></div>
            ))}
          </div>
        </div>

        <div className="total-card">
          <div>
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Weight Change</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>-1.0 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>kg this week</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Scale size={20} color="#0ea5e9" />
            </div>
            <p className="stat-title">Starting</p>
            <h4 className="stat-val">78.5</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>kg</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Scale size={20} color="#fbbf24" />
            </div>
            <p className="stat-title">Goal</p>
            <h4 className="stat-val">75.0</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;
