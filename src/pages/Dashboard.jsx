import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { idbGet, idbGetJSON } from '../data/db';

import { FaShoePrints } from 'react-icons/fa6';
import { FiClock } from 'react-icons/fi';
import { PiDropFill } from 'react-icons/pi';
import '../styles/pages/Dashboard.css';
import WeightHistory from '../components/WeightHistory';

// ActivityRings Component
const ActivityRings = ({ steps, stepsGoal, active, activeGoal, cals, calsGoal }) => {
  // Adjusted radii and SVG size to prevent cropping
  const ringProps = [
    {
      value: steps,
      goal: stepsGoal,
      color: '#21bf73',   // Darker green
      bgColor: '#b3eac2', // Lighter green
      radius: 70,
      stroke: 18
    },
    {
      value: active,
      goal: activeGoal,
      color: '#268ed9',   // Darker blue
      bgColor: '#b0dbf6', // Lighter blue
      radius: 52,
      stroke: 18
    },
    {
      value: cals,
      goal: calsGoal,
      color: '#e04085',   // Darker pink
      bgColor: '#fdc5ec', // Light pink
      radius: 32,
      stroke: 18
    }
  ];
  // Center at 90,90, but SVG is 200x200 for padding
  const rotate = 'rotate(-90 100 100)';
  return (
    <div className="activity-rings-container">
      <svg className="activity-rings-graphic" width="200" height="200" viewBox="0 0 200 200">
        {ringProps.map((ring, idx) => {
          const progress = Math.min(ring.value / ring.goal, 1);
          const circum = 2 * Math.PI * ring.radius;
          return (
            <g key={idx}>
              {/* Light background circle */}
              <circle
                cx="100"
                cy="100"
                r={ring.radius}
                fill="none"
                stroke={ring.bgColor}
                strokeWidth={ring.stroke}
                style={{ opacity: 0.7 }}
                transform={rotate}
              />
              {/* Dark progress path */}
              <circle
                cx="100"
                cy="100"
                r={ring.radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={ring.stroke}
                strokeDasharray={circum}
                strokeDashoffset={circum * (1 - progress)}
                strokeLinecap="round"
                style={{ opacity: 0.93 }}
                transform={rotate}
              />
            </g>
          );
        })}
        <circle cx="100" cy="100" r="22" fill="#f0f4fa" />
      </svg>
      {/* Fitness icons below are not SVGs and do not use the svg CSS class */}
      <div className="activity-rings-stats-row dark-style">
        <div className="stat-col" style={{marginBottom: 0, gap: 0, padding: 0}}>
          <FaShoePrints className="activity-ring-icon" style={{color:'#21bf73'}} />
          <span className="stat-value dark">{steps.toLocaleString()}</span>
          <span className="stat-label dark">Steps</span>
          <span className="stat-goal dark">/ {stepsGoal.toLocaleString()}</span>
        </div>
        <div className="stat-col" style={{marginBottom: 0, gap: 0, padding: 0}}>
          <FiClock className="activity-ring-icon" style={{color:'#268ed9'}} />
          <span className="stat-value dark">{active}</span>
          <span className="stat-label dark">Active time</span>
          <span className="stat-goal dark">/ {activeGoal} mins</span>
        </div>
        <div className="stat-col" style={{marginBottom: 0, gap: 0, padding: 0}}>
          <PiDropFill className="activity-ring-icon" style={{color:'#e04085'}} />
          <span className="stat-value dark">{cals}</span>
          <span className="stat-label dark">Activity calories</span>
          <span className="stat-goal dark">/ {calsGoal.toLocaleString()} kcal</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [familyUsers, setFamilyUsers] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [devices, defaultDeviceId, storedCurrentUser, storedUsers] = await Promise.all([
          idbGetJSON('pairedDevices', []),
          idbGet('defaultDeviceId'),
          idbGetJSON('currentUser', null),
          idbGetJSON('users', []),
        ]);
        if (!isMounted) return;
        setConnectedDevices(devices);
        if (devices.length > 0) {
          const device = devices.find(d => String(d.id) === String(defaultDeviceId)) || devices[0];
          setSelectedDevice(device);
        }
        setCurrentUser(storedCurrentUser);
        setFamilyUsers(storedUsers);
      } catch (err) {
        console.error('Failed to load dashboard data from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const deviceTypeLower = (selectedDevice?.deviceType || selectedDevice?.type || '').toLowerCase();
  const isWeighingScale = deviceTypeLower.includes('scale') || deviceTypeLower.includes('weight');
  const isWatchOrRing = deviceTypeLower.includes('watch') || deviceTypeLower.includes('ring') || deviceTypeLower.includes('band');

  useEffect(() => {
    if (!selectedDevice) return;
    const mockMetrics = {
      steps: {
        count: Math.floor(Math.random() * 5000) + 2000,
        goal: 20000,
        distance: (Math.random() * 500 + 200).toFixed(0),
        calories: Math.floor(Math.random() * 50) + 100,
        time: Math.floor(Math.random() * 10) + 2,
        timestamp: new Date().toLocaleString()
      },
      active: 39,
      sleep: {
        hours: Math.floor(Math.random() * 3) + 5,
        minutes: Math.floor(Math.random() * 60),
        goal: 8,
        timestamp: new Date().toLocaleString(),
        hasData: Math.random() > 0.3
      },
      heartRate: {
        value: Math.floor(Math.random() * 30) + 70,
        timestamp: new Date().toLocaleString(),
        min: 52,
        max: 118
      },
      bp: {
        systolic: Math.floor(Math.random() * 20) + 110,
        diastolic: Math.floor(Math.random() * 15) + 70,
        timestamp: new Date().toLocaleString(),
        min: 0,
        max: 200
      },
      oxygen: {
        value: Math.floor(Math.random() * 5) + 95,
        timestamp: new Date().toLocaleString(),
        min: 80,
        max: 100
      },
      stress: {
        value: Math.floor(Math.random() * 60) + 20,
        label: 'Average Stress',
        timestamp: new Date().toLocaleString(),
        min: 0,
        max: 100
      },
      weight: {
        value: (Math.random() * 30 + 50).toFixed(1),
        unit: 'kg',
        timestamp: new Date().toLocaleString()
      }
    };

    if (isWeighingScale) {
      const historyBase = Number(mockMetrics.weight.value);
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const fluctuation = (Math.random() - 0.5) * 0.8;
        const val = (historyBase + fluctuation - (i * 0.05)).toFixed(1);
        history.push({ label, value: val });
      }
      mockMetrics.weight.history = history;
    }

    setMetrics(mockMetrics);
  }, [selectedDevice]);

  const handleGoToDevices = () => {
    navigate('/devices');
  };

  if (connectedDevices.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="empty-state-card">
            <div className="empty-state-icon">⌚</div>
            <div className="empty-state-title">No devices paired</div>
            <div className="empty-state-description">
              You have not paired any devices yet. To get started, pair a device.
            </div>
            <button className="btn-connect-device" onClick={handleGoToDevices}>
              Go to Device Management
            </button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="dashboard-container-light">
      <div className="dashboard-content-light">
        <div className="device-selector-row" style={{ justifyContent: 'flex-start', gap: '18px', background: 'none', boxShadow: 'none', padding: '0', marginBottom: '18px' }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>
            {selectedDevice?.name || selectedDevice?.deviceType || selectedDevice?.type || 'Device'}
            {(() => {
              const userIdentifier = selectedDevice?.assignedTo || selectedDevice?.user || selectedDevice?.owner;
              if (!userIdentifier || userIdentifier === 'none') return ' (No user)';
              const identifierStr = String(userIdentifier).trim();
              // Normalize all ids for comparison
              const normalize = v => (v === undefined || v === null) ? '' : String(v).trim();
              if (currentUser && (normalize(currentUser.id) === identifierStr || normalize(currentUser.mobile) === identifierStr)) {
                return ' — User: Self';
              }
              const matchedUser = familyUsers.find(u => normalize(u.id) === identifierStr || normalize(u.mobile) === identifierStr);
              //
              return matchedUser && matchedUser.name ? ` — User: ${matchedUser.name}` : ' — User: Unknown';
            })()}
          </span>
        </div>

        {/* Activity rings above cards */}
        {metrics && (
          <ActivityRings
            steps={metrics.steps.count}
            stepsGoal={metrics.steps.goal}
            active={metrics.active}
            activeGoal={100}
            cals={metrics.steps.calories}
            calsGoal={1000}
          />
        )}

        {metrics ? (
          <div className="health-cards">
            {isWeighingScale && (
              <div className="health-card">
                <div className="card-header">
                  <div className="card-icon" style={{ background: 'rgba(100, 200, 255, 0.15)' }}>
                    <span style={{ color: '#64c8ff' }}>⚖️</span>
                  </div>
                  <div className="card-title-section">
                    <h3>Weight</h3>
                    <p className="card-timestamp">{metrics.weight.timestamp}</p>
                  </div>
                </div>
                <div className="card-main-value">
                  <span className="value-large">{metrics.weight.value}</span>
                  <span className="value-unit">{metrics.weight.unit}</span>
                </div>
                {metrics.weight && metrics.weight.history && (
                  <WeightHistory data={metrics.weight.history} />
                )}
              </div>
            )}

            {isWatchOrRing && (
              <>
                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(0, 200, 200, 0.15)' }}>
                      <span style={{ color: '#00c8c8' }}>👟</span>
                    </div>
                    <div className="card-title-section">
                      <h3>Steps</h3>
                      <p className="card-timestamp">{metrics.steps.timestamp}</p>
                    </div>
                  </div>
                  <div className="card-main-value">
                    <span className="value-large">{metrics.steps.count}</span>
                    <span className="value-unit">Steps</span>
                    <span className="value-goal">{metrics.steps.goal} Steps</span>
                  </div>
                  <div className="card-mini-stats">
                    <div className="mini-stat">
                      <span className="mini-icon">📍</span>
                      <span>{metrics.steps.distance} m</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-icon">🔥</span>
                      <span>{metrics.steps.calories} kcal</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-icon">⏱️</span>
                      <span>{metrics.steps.time} min</span>
                    </div>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(180, 100, 255, 0.15)' }}>
                      <span style={{ color: '#b464ff' }}>🛏️</span>
                    </div>
                    <div className="card-title-section">
                      <h3>Sleep</h3>
                      <p className="card-timestamp">{metrics.sleep.timestamp}</p>
                    </div>
                  </div>
                  {metrics.sleep.hasData ? (
                    <div className="card-main-value">
                      <span className="value-large">{metrics.sleep.hours}</span>
                      <span className="value-unit">h</span>
                      <span className="value-large">{metrics.sleep.minutes}</span>
                      <span className="value-unit">m</span>
                      <span className="value-goal-right">{metrics.sleep.goal} Hours</span>
                    </div>
                  ) : (
                    <div className="no-data">No Data</div>
                  )}
                </div>

                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(255, 80, 120, 0.15)' }}>
                      <span style={{ color: '#ff5078' }}>❤️</span>
                    </div>
                    <div className="card-title-section">
                      <h3>Heart Rate</h3>
                      <p className="card-timestamp">{metrics.heartRate.timestamp}</p>
                    </div>
                  </div>
                  <div className="card-main-value">
                    <span className="value-large">{metrics.heartRate.value}</span>
                    <span className="value-unit">BPM</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${((metrics.heartRate.value - metrics.heartRate.min) / (metrics.heartRate.max - metrics.heartRate.min)) * 100}%`,
                        background: 'linear-gradient(to right, #ffeb3b, #ff9800, #f44336)'
                      }}
                    />
                  </div>
                  <div className="metric-scale">
                    <span>{metrics.heartRate.min}</span>
                    <span>82</span>
                    <span>{metrics.heartRate.max}</span>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(100, 150, 255, 0.15)' }}>
                      <span style={{ color: '#6496ff' }}>💙</span>
                    </div>
                    <div className="card-title-section">
                      <h3>BP</h3>
                      <p className="card-timestamp">{metrics.bp.timestamp}</p>
                    </div>
                  </div>
                  <div className="card-main-value">
                    <span className="value-large">{metrics.bp.systolic}/{metrics.bp.diastolic}</span>
                    <span className="value-unit">mmHg</span>
                    <span className="value-goal-right">SBP/DBP</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${(metrics.bp.systolic / metrics.bp.max) * 100}%`,
                        background: 'linear-gradient(to right, #2196f3, #03a9f4)'
                      }}
                    />
                  </div>
                  <div className="metric-scale">
                    <span>{metrics.bp.min}</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>{metrics.bp.max}</span>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(100, 220, 180, 0.15)' }}>
                      <span style={{ color: '#64dcb4' }}>💧</span>
                    </div>
                    <div className="card-title-section">
                      <h3>Blood Oxygen</h3>
                      <p className="card-timestamp">{metrics.oxygen.timestamp}</p>
                    </div>
                  </div>
                  <div className="card-main-value">
                    <span className="value-large">{metrics.oxygen.value}</span>
                    <span className="value-unit">%</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${((metrics.oxygen.value - metrics.oxygen.min) / (metrics.oxygen.max - metrics.oxygen.min)) * 100}%`,
                        background: '#4caf50'
                      }}
                    />
                  </div>
                  <div className="metric-scale">
                    <span>{metrics.oxygen.min}</span>
                    <span>85</span>
                    <span>90</span>
                    <span>95</span>
                    <span>{metrics.oxygen.max}</span>
                  </div>
                </div>

                <div className="health-card">
                  <div className="card-header">
                    <div className="card-icon" style={{ background: 'rgba(200, 220, 100, 0.15)' }}>
                      <span style={{ color: '#c8dc64' }}>😌</span>
                    </div>
                    <div className="card-title-section">
                      <h3>Stress</h3>
                      <p className="card-timestamp">{metrics.stress.timestamp}</p>
                    </div>
                  </div>
                  <div className="stress-label">{metrics.stress.label}</div>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill"
                      style={{
                        width: `${(metrics.stress.value / metrics.stress.max) * 100}%`,
                        background: '#8bc34a'
                      }}
                    />
                  </div>
                  <div className="metric-scale">
                    <span>{metrics.stress.min}</span>
                    <span>50</span>
                    <span>{metrics.stress.max}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="page-content" style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Loading health data...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
