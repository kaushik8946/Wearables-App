import { X, Flame } from 'lucide-react';
import '../StepsModal/StatsModal.css';

const StepsModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content hide-scrollbar">

        {/* Close Button */}
        <button onClick={onClose} className="close-btn">
          <X size={20} color="#4b5563" />
        </button>

        {/* Header Tabs */}
        <div className="tabs-container">
          <button className="tab-btn">Daily</button>
          <button className="tab-btn active">Weekly</button>
          <button className="tab-btn">Monthly</button>
        </div>

        {/* Main Stat */}
        <div className="big-stat">
          512 <span>Kcal</span>
        </div>

        {/* Bar Chart Area */}
        <div className="modal-chart-area">
          {/* Y-Axis Labels */}
          <div className="y-axis">
            <span>160</span>
            <span>120</span>
            <span>80</span>
            <span>40</span>
            <span>0</span>
          </div>

          {/* Bars */}
          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 80, type: 'indigo' },
              { day: 'Mon', val: 45, type: 'indigo' },
              { day: 'Tue', val: 25, type: 'indigo' },
              { day: 'Wed', val: 105, type: 'indigo' },
              { day: 'Thu', val: 150, type: 'amber' }, // Highlighted
              { day: 'Fri', val: 105, type: 'indigo' },
              { day: 'Sat', val: 75, type: 'indigo' },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className={`chart-bar-visual ${item.type === 'amber' ? 'bar-amber' : 'bar-indigo'}`}
                  style={{ height: `${(item.val / 160) * 100}%` }}
                ></div>
                <span className="day-label">{item.day}</span>
              </div>
            ))}
          </div>
          {/* Grid Lines */}
          <div className="grid-lines-container">
            {[0, 25, 50, 75, 100].map((pos) => (
              <div key={pos} className="grid-line" style={{ bottom: `${pos}%`, marginBottom: '1.5rem' }}></div>
            ))}
          </div>
        </div>

        {/* Total Steps Card */}
        <div className="total-card">
          <div>
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Total steps</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>3500 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>(Kcal)</span></h3>
          </div>

          {/* Donut Chart */}
          <div className="donut-chart">
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#fbbf24" strokeWidth="4" strokeDasharray="73, 100" strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '50%', margin: '6px' }}>
              <span style={{ fontSize: '0.625rem', fontWeight: '700', color: '#1f2937' }}>73%</span>
            </div>
          </div>
        </div>

        {/* Bottom Stats Grid */}
        <div className="stats-grid">
          {/* Calories Burnt */}
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Flame size={20} color="#4f46e5" fill="#4f46e5" />
            </div>
            <p className="stat-title">Calories burnt</p>
            <h4 className="stat-val">512</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Kcal</span>
          </div>

          {/* Calories Left */}
          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Flame size={20} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p className="stat-title">Calories left</p>
            <h4 className="stat-val">102</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Kcal</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default StepsModal;
