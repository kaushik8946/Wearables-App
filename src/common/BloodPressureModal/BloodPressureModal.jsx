import { X, Stethoscope } from 'lucide-react';
import '../StepsModal/StatsModal.css';

const BloodPressureModal = ({ onClose }) => {
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
          119/82 <span>mmHg</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>140</span>
            <span>105</span>
            <span>70</span>
            <span>35</span>
            <span>0</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 115 },
              { day: 'Mon', val: 118 },
              { day: 'Tue', val: 112 },
              { day: 'Wed', val: 120 },
              { day: 'Thu', val: 119 },
              { day: 'Fri', val: 116 },
              { day: 'Sat', val: 114 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${(item.val / 140) * 100}%` }}
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Avg BP</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>117/80 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>mmHg</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Stethoscope size={20} color="#0ea5e9" />
            </div>
            <p className="stat-title">Systolic</p>
            <h4 className="stat-val">117</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>mmHg</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Stethoscope size={20} color="#fbbf24" />
            </div>
            <p className="stat-title">Diastolic</p>
            <h4 className="stat-val">80</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>mmHg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloodPressureModal;
