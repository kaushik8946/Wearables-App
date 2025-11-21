import { X, Heart } from 'lucide-react';
import '../StepsModal/StatsModal.css';

const HeartRateModal = ({ onClose }) => {
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
          82 <span>bpm</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>120</span>
            <span>90</span>
            <span>60</span>
            <span>30</span>
            <span>0</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 78 },
              { day: 'Mon', val: 85 },
              { day: 'Tue', val: 72 },
              { day: 'Wed', val: 88 },
              { day: 'Thu', val: 82 },
              { day: 'Fri', val: 79 },
              { day: 'Sat', val: 84 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${(item.val / 120) * 100}%` }}
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Avg Heart Rate</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>81 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>bpm</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Heart size={20} color="#84cc16" fill="#84cc16" />
            </div>
            <p className="stat-title">Resting</p>
            <h4 className="stat-val">65</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>bpm</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Heart size={20} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p className="stat-title">Max</p>
            <h4 className="stat-val">122</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>bpm</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateModal;
