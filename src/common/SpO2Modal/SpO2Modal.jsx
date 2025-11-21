import { X, Wind } from 'lucide-react';
import '../StepsModal/StatsModal.css';

const SpO2Modal = ({ onClose }) => {
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
          95 <span>%</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 96 },
              { day: 'Mon', val: 94 },
              { day: 'Tue', val: 95 },
              { day: 'Wed', val: 97 },
              { day: 'Thu', val: 95 },
              { day: 'Fri', val: 96 },
              { day: 'Sat', val: 98 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${(item.val / 100) * 100}%` }}
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Avg SpO2</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>96 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>%</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Wind size={20} color="#14b8a6" />
            </div>
            <p className="stat-title">Min</p>
            <h4 className="stat-val">94</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>%</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Wind size={20} color="#fbbf24" />
            </div>
            <p className="stat-title">Max</p>
            <h4 className="stat-val">98</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpO2Modal;
