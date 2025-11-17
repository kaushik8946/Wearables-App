import React, { useState } from 'react';
import '../styles/pages/Workout.css';
import mapImage from '../assets/images/map.png';

const Workout = () => {
  const [activeTab, setActiveTab] = useState('running');

  return (
    <div className="workout-root">
      <div className="workout-container">
        {/* Stats Cards */}
        <div className="workout-stats">
          <div className="workout-stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <div className="workout-stat-value">0</div>
              <div className="workout-stat-label">Total Minutes</div>
            </div>
          </div>
          <div className="workout-stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="workout-stat-value">0</div>
              <div className="workout-stat-label">Total Sessions</div>
            </div>
          </div>
        </div>

        {/* Map Container with Modern Design */}
        <div className="workout-map-container">
          <div className="map-wrapper">
            <img src={mapImage} alt="Map" className="workout-map-img" />
            <div className="map-overlay"></div>
            
            {/* GPS Status Badge */}
            <div className="workout-gps-badge">
              <span className="gps-dot"></span>
              <span className="gps-text">GPS Connected</span>
            </div>
          </div>

          {/* Info Banner */}
          <div className="workout-banner">
            <div className="banner-content">
              <span className="banner-icon">💡</span>
              <div className="banner-text">
                <span className="banner-title">How to start sports training?</span>
                <a href="#" className="banner-link">Learn More →</a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="workout-actions">
          <button className="workout-action-btn" title="Settings">
            <span className="action-icon">⚙️</span>
          </button>
          
          <button className="workout-start-btn">
            <span className="start-icon">▶</span>
            <span className="start-text">Start</span>
          </button>
          
          <button className="workout-action-btn" title="History">
            <span className="action-icon">📊</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Workout;
