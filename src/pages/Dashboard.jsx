import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Footprints, 
  Clock,
  Moon, 
  Wind, 
  Zap, 
  Scale, 
  CalendarHeart, 
  Stethoscope, 
  Flame, 
  X,
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import '../styles/pages/Dashboard.css';
import { idbGet, idbGetJSON } from '../data/db';
import { getDeviceTypeIcon } from '../data/mockData';

// Helper for SVG Curved Lines (Heart Rate) - Now accepting hex color
const SineWave = ({ color = "#ffffff", width = 100, height = 50 }) => (
  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
    <path
      d={`M0 ${height/2} Q ${width/4} ${height} ${width/2} ${height/2} T ${width} ${height/2}`}
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Fill Area */}
    <path
      d={`M0 ${height/2} Q ${width/4} ${height} ${width/2} ${height/2} T ${width} ${height/2} V ${height} H 0 Z`}
      fill={color}
      fillOpacity="0.2"
    />
  </svg>
);

const BarChart = () => (
  <div className="barchart-container">
    {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
      <div 
        key={i} 
        className="barchart-bar"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

// ActivityRings component - integrated to show Steps/Active/Calories in rings
const ActivityRings = ({ steps = 4784, stepsGoal = 8000, active = 45, activeGoal = 60, cals = 512, calsGoal = 800 }) => {
  const ringProps = [
    { value: steps, goal: stepsGoal, color: '#21bf73', bgColor: '#b3eac2', radius: 70, stroke: 18 },
    { value: active, goal: activeGoal, color: '#268ed9', bgColor: '#b0dbf6', radius: 52, stroke: 18 },
    { value: cals, goal: calsGoal, color: '#e04085', bgColor: '#fdc5ec', radius: 32, stroke: 18 }
  ];

  const rotate = 'rotate(-90 100 100)';

  return (
    <div className="activity-rings-container">
      <svg className="activity-rings-graphic" width="200" height="200" viewBox="0 0 200 200">
        {ringProps.map((ring, idx) => {
          const progress = Math.min(ring.value / ring.goal, 1);
          const circum = 2 * Math.PI * ring.radius;
          return (
            <g key={idx}>
              <circle cx="100" cy="100" r={ring.radius} fill="none" stroke={ring.bgColor} strokeWidth={ring.stroke} style={{ opacity: 0.7 }} transform={rotate} />
              <circle cx="100" cy="100" r={ring.radius} fill="none" stroke={ring.color} strokeWidth={ring.stroke} strokeDasharray={circum} strokeDashoffset={circum * (1 - progress)} strokeLinecap="round" style={{ opacity: 0.93 }} transform={rotate} />
            </g>
          );
        })}
        <circle cx="100" cy="100" r="22" fill="#f0f4fa" />
      </svg>

      <div className="activity-rings-stats-row">
        <div className="stat-col">
          <Footprints className="activity-ring-icon" size={20} style={{ color: '#21bf73' }} />
          <span className="stat-value">{steps.toLocaleString()}</span>
          <span className="stat-label">Steps</span>
          <span className="stat-goal">/ {stepsGoal.toLocaleString()}</span>
        </div>

        <div className="stat-col">
          <Clock className="activity-ring-icon" size={20} style={{ color: '#268ed9' }} />
          <span className="stat-value">{active}</span>
          <span className="stat-label">Active time</span>
          <span className="stat-goal">/ {activeGoal} mins</span>
        </div>

        <div className="stat-col">
          <Flame className="activity-ring-icon" size={20} style={{ color: '#e04085' }} />
          <span className="stat-value">{cals}</span>
          <span className="stat-label">Activity calories</span>
          <span className="stat-goal">/ {calsGoal.toLocaleString()} kcal</span>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: STEPS MODAL ---
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

// 1. MAIN DASHBOARD (Light Mode)
const DashboardView = ({ onOpenSteps, onNavigateDevices, connectedDevice }) => {
  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {/* Show connected device name near the top */}
        {connectedDevice && (
          <div className="connected-device-row">
            <div className="connected-label">Connected</div>
            <div className="connected-device-name">
              <span className="connected-device-icon" style={{ marginRight: 8 }}>{ getDeviceTypeIcon(connectedDevice.deviceType) }</span>
              {connectedDevice.name}
            </div>
            <div className="connected-device-model">{connectedDevice.model}</div>
          </div>
        )}
        {!connectedDevice && (
          <div className="no-device-placeholder">
            <div>
              <p className="placeholder-title">No devices connected</p>
              <p className="placeholder-copy">Pair a wearable to unlock live health stats.</p>
            </div>
            <button
              type="button"
              className="placeholder-cta"
              onClick={onNavigateDevices}
            >
              Go to device management
            </button>
          </div>
        )}
        {connectedDevice && (
          <>
            {/* Activity Rings */}
            <ActivityRings steps={4784} stepsGoal={8000} active={45} activeGoal={60} cals={512} calsGoal={800} />
        
            {/* Cards Grid (2 Columns) */}
            <div className="grid-2">
          
          {/* 1. Steps - CLICKABLE */}
          <div 
            onClick={onOpenSteps}
            className="card card-rose"
          >
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-rose-100">Steps</span>
                <Footprints size={16} className="text-rose-200" />
              </div>
              <h3 className="title-main">4,784 <span className="subtitle text-rose-100">steps</span></h3>
            </div>
            <div className="mt-4 width-full">
              <BarChart />
            </div>
          </div>

          {/* 2. Heart Rate */}
          <div className="card card-lime">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-lime-900">Heart Rate</span>
                <Heart size={16} className="icon-lime-bg" />
              </div>
              <h3 className="title-main">82 <span className="subtitle text-lime-800">bpm</span></h3>
            </div>
            
            {/* Graph Visualization */}
            <div className="graph-container">
               <SineWave color="#ffffff" />
            </div>
          </div>

          {/* 3. Sleep */}
          <div className="card card-indigo">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-indigo-100">Sleep</span>
                <Moon size={16} className="text-indigo-200" />
              </div>
              <h3 className="title-main">5<span className="text-lg opacity-80 font-normal">h</span> 22<span className="text-lg opacity-80 font-normal">m</span></h3>
              <p className="mt-1 tag-indigo text-indigo-100">Light Sleep</p>
            </div>
            <div className="sleep-bars mt-4">
               <div className="bar bar-light" style={{ height: '40%' }}></div>
               <div className="bar bar-white" style={{ height: '80%' }}></div>
               <div className="bar bar-light" style={{ height: '60%' }}></div>
               <div className="bar bar-light" style={{ height: '30%' }}></div>
               <div className="bar bar-light" style={{ height: '50%' }}></div>
            </div>
          </div>

          {/* 4. Blood Pressure (BP) */}
          <div className="card card-sky">
             <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-sky-100">BP</span>
                <Stethoscope size={16} className="text-sky-200" />
              </div>
              <h3 className="title-main">119<span className="subtitle text-sky-200 inline">/</span>82</h3>
              <p className="text-sky-100 subtitle mt-1">mmHg</p>
            </div>
            {/* Line Graph */}
            <div className="graph-bp-container">
              <svg viewBox="0 0 100 40" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                 <path d="M0,20 L20,20 L30,5 L40,35 L50,20 L100,20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* 5. Blood Oxygen */}
          <div className="card card-teal">
             <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-teal-100">SpO2</span>
                <Wind size={16} className="text-teal-200" />
              </div>
              <h3 className="title-main">95 <span className="subtitle text-teal-200 inline">%</span></h3>
            </div>
            {/* Circular Indicator */}
            <div className="circular-indicator">
               <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                 <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
                 <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="6" fill="none" strokeDasharray="175" strokeDashoffset="10" strokeLinecap="round" />
               </svg>
               <div className="pulse-dot">
                 <div className="pulse-dot-inner"></div>
               </div>
            </div>
          </div>

          {/* 6. Stress */}
          <div className="card card-amber">
             <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-amber-900">Stress</span>
                <Zap size={16} className="text-amber-800" />
              </div>
              <h3 className="title-main">Average</h3>
               <p className="mt-1 tag-amber text-amber-800">Relaxed</p>
            </div>
             {/* Face graphic */}
             <div className="face-graphic">
               <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="8" y1="9" x2="10" y2="9"></line>
                 <line x1="14" y1="9" x2="16" y2="9"></line>
                 <path d="M8 14c1.5 1 4.5 1 6 0"></path>
               </svg>
             </div>
          </div>

          {/* 7. Periods */}
          <div className="card card-pink">
             <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-pink-100">Cycles</span>
                <CalendarHeart size={16} className="text-pink-200" />
              </div>
              <h3 className="title-main">Day 12</h3>
               <p className="text-pink-100 subtitle mt-1">Follicular Phase</p>
            </div>
             {/* Period dots */}
             <div className="dots-container">
               {[1,2,3,4,5].map(d => (
                  <div key={d} className={`dot ${d === 3 ? 'active' : ''}`}></div>
               ))}
             </div>
          </div>

           {/* 8. Weight (NEW LIGHT CARD) */}
          <div className="card card-white-clean">
             <div className="weight-header">
               <div className="weight-icon-box">
                 <Scale size={20} color="#0ea5e9" />
               </div>
               <div className="weight-title-group">
                 <div className="weight-label">Weight</div>
                 <div className="weight-timestamp">19/11/2025, 11:07:09</div>
               </div>
             </div>
             <div className="weight-big-number">
                77.9<span className="weight-unit-text">kg</span>
             </div>
          </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

// MAIN APP COMPONENT
export default function Dashboard() {
  const [showSteps, setShowSteps] = useState(false);
  // Connected/Default device to display on the dashboard
  const [connectedDevice, setConnectedDevice] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedDefaultId, storedPairedDevices] = await Promise.all([
          idbGet('defaultDeviceId'),
          idbGetJSON('pairedDevices', []),
        ]);

        if (!mounted) return;

        if (!storedPairedDevices || storedPairedDevices.length === 0) {
          setConnectedDevice(null);
          return;
        }

        const fallbackId = String(storedPairedDevices[0].id);
        const targetId = storedDefaultId ? String(storedDefaultId) : fallbackId;
        const found = storedPairedDevices.find(d => String(d.id) === String(targetId));
        setConnectedDevice(found || storedPairedDevices[0]);
      } catch (err) {
        console.error('Failed to load connected device for dashboard', err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <>
      <DashboardView
        onOpenSteps={() => setShowSteps(true)}
        onNavigateDevices={() => navigate('/devices')}
        connectedDevice={connectedDevice}
      />
      {showSteps && <StepsModal onClose={() => setShowSteps(false)} />}
    </>
  );
}