import { X, Zap } from 'lucide-react';
import '../StepsModal/StatsModal.css';

const StressModal = ({ onClose }) => {
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
          Average <span>Stress</span>
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
              { day: 'Sun', val: 35 },
              { day: 'Mon', val: 55 },
              { day: 'Tue', val: 42 },
              { day: 'Wed', val: 68 },
              { day: 'Thu', val: 45 },
              { day: 'Fri', val: 38 },
              { day: 'Sat', val: 28 },
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Avg Stress Level</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>44 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>/100</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Zap size={20} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p className="stat-title">Relaxed Days</p>
            <h4 className="stat-val">4</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>days</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Zap size={20} color="#f43f5e" fill="#f43f5e" />
            </div>
            <p className="stat-title">Stressed Days</p>
            <h4 className="stat-val">3</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressModal;
