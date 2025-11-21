import { X, Moon } from 'lucide-react';
import '../../styles/components/StatsModal.css';

const SleepModal = ({ onClose }) => {
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
          5h 22m <span>sleep</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>10</span>
            <span>7.5</span>
            <span>5</span>
            <span>2.5</span>
            <span>0</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 7.2 },
              { day: 'Mon', val: 6.8 },
              { day: 'Tue', val: 5.5 },
              { day: 'Wed', val: 7.5 },
              { day: 'Thu', val: 5.4 },
              { day: 'Fri', val: 6.2 },
              { day: 'Sat', val: 8.1 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${(item.val / 10) * 100}%` }}
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Avg Sleep</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>6.7 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>hours</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Moon size={20} color="#6366f1" fill="#6366f1" />
            </div>
            <p className="stat-title">Deep Sleep</p>
            <h4 className="stat-val">2.1</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>hrs</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Moon size={20} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p className="stat-title">Light Sleep</p>
            <h4 className="stat-val">3.2</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepModal;
