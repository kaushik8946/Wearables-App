import { X, CalendarHeart } from 'lucide-react';
import '../../styles/components/StatsModal.css';

const CyclesModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content hide-scrollbar">
        <button onClick={onClose} className="close-btn">
          <X size={20} color="#4b5563" />
        </button>

        <div className="tabs-container">
          <button className="tab-btn active">Overview</button>
          <button className="tab-btn">Calendar</button>
          <button className="tab-btn">History</button>
        </div>

        <div className="big-stat">
          Day 12 <span>Follicular</span>
        </div>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Current Cycle Day</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: i === 11 ? '#ec4899' : i < 12 ? '#fbcfe8' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: i === 11 ? '700' : '500',
                  color: i === 11 ? 'white' : '#6b7280'
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="total-card">
          <div>
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Next Period</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>16 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>days</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <CalendarHeart size={20} color="#ec4899" fill="#ec4899" />
            </div>
            <p className="stat-title">Cycle Length</p>
            <h4 className="stat-val">28</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>days</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <CalendarHeart size={20} color="#fbbf24" fill="#fbbf24" />
            </div>
            <p className="stat-title">Period Length</p>
            <h4 className="stat-val">5</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>days</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyclesModal;
