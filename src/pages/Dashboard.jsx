import React, { useMemo, useState } from 'react';
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
  X
} from 'lucide-react';
import DevicesMenu from '../components/DevicesMenu';
import { availableDevices as initialAvailableDevices } from '../data/mockData';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';
import '../styles/pages/Dashboard.css';
import { idbGet, idbGetJSON, idbSet, idbSetJSON, emitUserChange, onUserChange, onPairedDevicesChange, emitPairedDevicesChange } from '../data/db';

// Helper for SVG Curved Lines (Heart Rate) - Now accepting hex color
const SineWave = ({ color = "#ffffff", width = 100, height = 50 }) => (
  <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} fill="none" className="overflow-visible">
    <path
      d={`M0 ${height / 2} Q ${width / 4} ${height} ${width / 2} ${height / 2} T ${width} ${height / 2}`}
      stroke={color}
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    {/* Fill Area */}
    <path
      d={`M0 ${height / 2} Q ${width / 4} ${height} ${width / 2} ${height / 2} T ${width} ${height / 2} V ${height} H 0 Z`}
      fill={color}
      fillOpacity="0.2"
    />
  </svg>
);

// map file names to assets (same mapping as in Devices.jsx)
const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

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
const ActivityRings = ({ steps = null, stepsGoal = 8000, active = null, activeGoal = 60, cals = null, calsGoal = 800 }) => {
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
          const progress = (ring.value == null) ? 0 : Math.min(ring.value / ring.goal, 1);
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
          <span className="stat-value">{steps == null ? '—' : String(steps).toLocaleString()}</span>
          <span className="stat-label">Steps</span>
          <span className="stat-goal">/ {stepsGoal.toLocaleString()}</span>
        </div>

        <div className="stat-col">
          <Clock className="activity-ring-icon" size={20} style={{ color: '#268ed9' }} />
          <span className="stat-value">{active == null ? '—' : String(active)}</span>
          <span className="stat-label">Active time</span>
          <span className="stat-goal">/ {activeGoal} mins</span>
        </div>

        <div className="stat-col">
          <Flame className="activity-ring-icon" size={20} style={{ color: '#e04085' }} />
          <span className="stat-value">{cals == null ? '—' : String(cals)}</span>
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

// --- HEART RATE MODAL ---
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

// --- SLEEP MODAL ---
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

// --- BLOOD PRESSURE MODAL ---
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

// --- SPO2 MODAL ---
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

// --- STRESS MODAL ---
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

// --- CYCLES MODAL ---
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

// --- WEIGHT MODAL ---
const WeightModal = ({ onClose }) => {
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
          77.9 <span>kg</span>
        </div>

        <div className="modal-chart-area">
          <div className="y-axis">
            <span>82</span>
            <span>80</span>
            <span>78</span>
            <span>76</span>
            <span>74</span>
          </div>

          <div className="chart-bars-container">
            {[
              { day: 'Sun', val: 78.5 },
              { day: 'Mon', val: 78.2 },
              { day: 'Tue', val: 78.0 },
              { day: 'Wed', val: 77.8 },
              { day: 'Thu', val: 77.9 },
              { day: 'Fri', val: 77.7 },
              { day: 'Sat', val: 77.5 },
            ].map((item, i) => (
              <div key={i} className="chart-col">
                <div
                  className="chart-bar-visual bar-indigo"
                  style={{ height: `${((item.val - 74) / 8) * 100}%` }}
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
            <p style={{ fontSize: '0.75rem', color: '#e0e7ff', marginBottom: '0.25rem' }}>Weight Change</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>-1.0 <span style={{ fontSize: '0.75rem', fontWeight: '400', opacity: 0.6 }}>kg this week</span></h3>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box bg-gray">
            <div className="icon-circle">
              <Scale size={20} color="#0ea5e9" />
            </div>
            <p className="stat-title">Starting</p>
            <h4 className="stat-val">78.5</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>kg</span>
          </div>

          <div className="stat-box bg-amber">
            <div className="icon-circle">
              <Scale size={20} color="#fbbf24" />
            </div>
            <p className="stat-title">Goal</p>
            <h4 className="stat-val">75.0</h4>
            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 1. MAIN DASHBOARD (Light Mode)
const DashboardView = ({ onOpenSteps, onOpenHeartRate, onOpenSleep, onOpenBloodPressure, onOpenSpO2, onOpenStress, onOpenCycles, onOpenWeight, connectedDevice }) => {
  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {/* Activity Rings */}
        <ActivityRings
          steps={connectedDevice ? 4784 : null}
          stepsGoal={8000}
          active={connectedDevice ? 45 : null}
          activeGoal={60}
          cals={connectedDevice ? 512 : null}
          calsGoal={800}
        />

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
              <h3 className="title-main">{connectedDevice ? '4,784' : '—'} <span className="subtitle text-rose-100">steps</span></h3>
            </div>
            <div className="mt-4 width-full">
              <BarChart />
            </div>
          </div>

          {/* 2. Heart Rate */}
          <div onClick={onOpenHeartRate} className="card card-lime">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-lime-900">Heart Rate</span>
                <Heart size={16} className="icon-lime-bg" />
              </div>
              <h3 className="title-main">{connectedDevice ? '82' : '—'} <span className="subtitle text-lime-800">bpm</span></h3>
            </div>

            {/* Graph Visualization */}
            <div className="graph-container">
              <SineWave color="#ffffff" />
            </div>
          </div>

          {/* 3. Sleep */}
          <div onClick={onOpenSleep} className="card card-indigo">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-indigo-100">Sleep</span>
                <Moon size={16} className="text-indigo-200" />
              </div>
              <h3 className="title-main">{connectedDevice ? (
                <><span>5</span><span className="text-lg opacity-80 font-normal">h</span> 22<span className="text-lg opacity-80 font-normal">m</span></>
              ) : '—'}</h3>
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
          <div onClick={onOpenBloodPressure} className="card card-sky">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-sky-100">BP</span>
                <Stethoscope size={16} className="text-sky-200" />
              </div>
              <h3 className="title-main">{connectedDevice ? (
                <>119<span className="subtitle text-sky-200 inline">/</span>82</>
              ) : '—/—'}</h3>
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
          <div onClick={onOpenSpO2} className="card card-teal">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-teal-100">SpO2</span>
                <Wind size={16} className="text-teal-200" />
              </div>
              <h3 className="title-main">{connectedDevice ? '95' : '—'} <span className="subtitle text-teal-200 inline">%</span></h3>
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
          <div onClick={onOpenStress} className="card card-amber">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-amber-900">Stress</span>
                <Zap size={16} className="text-amber-800" />
              </div>
              <h3 className="title-main">{connectedDevice ? 'Average' : '—'}</h3>
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
          <div onClick={onOpenCycles} className="card card-pink">
            <div className="card-content">
              <div className="flex-between-start mb-2">
                <span className="card-label text-pink-100">Cycles</span>
                <CalendarHeart size={16} className="text-pink-200" />
              </div>
              <h3 className="title-main">{connectedDevice ? 'Day 12' : '—'}</h3>
              <p className="text-pink-100 subtitle mt-1">Follicular Phase</p>
            </div>
            {/* Period dots */}
            <div className="dots-container">
              {[1, 2, 3, 4, 5].map(d => (
                <div key={d} className={`dot ${d === 3 ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>

          {/* 8. Weight (NEW LIGHT CARD) */}
          <div onClick={onOpenWeight} className="card card-white-clean">
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
              {connectedDevice ? (<><span>77.9</span><span className="weight-unit-text">kg</span></>) : '— kg'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// MAIN APP COMPONENT
const Dashboard = () => {
  const [showSteps, setShowSteps] = useState(false);
  const [showHeartRate, setShowHeartRate] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showBloodPressure, setShowBloodPressure] = useState(false);
  const [showSpO2, setShowSpO2] = useState(false);
  const [showStress, setShowStress] = useState(false);
  const [showCycles, setShowCycles] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  // Connected/Default device to display on the dashboard
  const [connectedDevice, setConnectedDevice] = useState(null);

  const [pairedDevices, setPairedDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState(initialAvailableDevices);
  const [showDevicesMenuModal, setShowDevicesMenuModal] = useState(false);
  const [devicesMenuDismissed, setDevicesMenuDismissed] = useState(false);
  const [shouldAssignDefaultInModal, setShouldAssignDefaultInModal] = useState(false);
  const [userVersion, setUserVersion] = useState(0);
  const [currentUserDeviceMap, setCurrentUserDeviceMap] = useState({});
  const [activeDefaultUserId, setActiveDefaultUserId] = useState('');

  // Modal for 'no device assigned to default user'
  const [showNoDeviceAssignedModal, setShowNoDeviceAssignedModal] = useState(false);
  // Default user name shown in the 'no device assigned' modal
  const [defaultUserName, setDefaultUserName] = useState('');

  const sanitizeUserForStorage = (user) => {
    if (!user) return null;
    const { self: _self, ...rest } = user;
    return rest;
  };

  const debugLog = (...args) => {
    // Debug logging disabled in production
    // Note: Using Vite's import.meta.env.MODE instead of process.env.NODE_ENV
    if (import.meta.env.MODE !== 'production') {
      console.log('[Dashboard]', ...args);
    }
  };

  const persistUserDeviceMap = async (usersSnapshot) => {
    const map = {};
    usersSnapshot.forEach(u => {
      if (u.deviceId) {
        map[u.id] = String(u.deviceId);
      }
    });
    await idbSetJSON('userDeviceMap', map);
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedPairedDevices = await idbGetJSON('pairedDevices', []);
        if (!mounted) return;
        setPairedDevices(storedPairedDevices);
      } catch (err) {
        console.error('Failed to load paired devices for dashboard', err);
      }
    })();
    // Subscribe to paired devices changes so dashboard reacts to pair/unpair events
    const unsub = onPairedDevicesChange(() => {
      (async () => {
        try {
          const devices = await idbGetJSON('pairedDevices', []);
          if (!mounted) return;
          setPairedDevices(devices);
        } catch (err) {
          console.error('Failed to reload paired devices after change', err);
        }
      })();
    });
    return () => { mounted = false; unsub(); };
  }, []);

  React.useEffect(() => {
    const pairedIds = pairedDevices.map(device => device.id);
    setAvailableDevices(initialAvailableDevices.filter(device => !pairedIds.includes(device.id)));
  }, [pairedDevices]);

  React.useEffect(() => {
    const unsubscribe = onUserChange(() => {
      setUserVersion(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedDefaultUserId = await idbGet('defaultUserId');
        const userDeviceMap = await idbGetJSON('userDeviceMap', {});
        debugLog('Evaluating default user', { storedDefaultUserId, userDeviceMap, pairedCount: pairedDevices?.length });

        if (!mounted) return;

        const currentUser = await idbGetJSON('currentUser', null);
        const otherUsers = await idbGetJSON('users', []);
        const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u }))];

        // If no paired devices at all, show modal to pair devices
        // But if a default user is set and they have NO assigned device, show the "No device assigned" modal first.
        if (!pairedDevices || pairedDevices.length === 0) {
          setConnectedDevice(null);
          setShouldAssignDefaultInModal(false);

          if (!devicesMenuDismissed) {
            // If there's a default user with no device, show the informative modal first.
            if (storedDefaultUserId) {
              const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
              const hasDevice = defUser && defUser.deviceId && String(defUser.deviceId) !== '';
              const mappedDevice = hasDevice ? pairedDevices.find(d => String(d.id) === String(defUser.deviceId)) : null;
              // If default user has a deviceId but the device is not in paired list (unpaired elsewhere), treat as unassigned
              if (!hasDevice || !mappedDevice) {
                setDefaultUserName(defUser?.name || 'user');
                setShowNoDeviceAssignedModal(true);
                setShowDevicesMenuModal(false);
              } else {
                setShowNoDeviceAssignedModal(false);
                setShowDevicesMenuModal(true);
              }
            } else {
              setShowNoDeviceAssignedModal(false);
              setShowDevicesMenuModal(true);
            }
          }

          return;
        }

        let connected = null;
        let needsDefault = false;

        setActiveDefaultUserId(storedDefaultUserId || '');
        const derivedDeviceMap = {};
        allUsers.forEach(u => {
          if (u.deviceId) {
            derivedDeviceMap[u.id] = String(u.deviceId);
          }
        });
        setCurrentUserDeviceMap(derivedDeviceMap);

        if (storedDefaultUserId) {
          const mappedDeviceId = userDeviceMap ? userDeviceMap[storedDefaultUserId] : null;
          if (mappedDeviceId) {
            const mappedDevice = pairedDevices.find(d => String(d.id) === String(mappedDeviceId));
            if (mappedDevice) {
              connected = mappedDevice;
            } else {
              needsDefault = true;
              debugLog('Mapped device missing from paired list', { mappedDeviceId });
            }
          }

          if (!connected) {
            // Find the DEFAULT user (not necessarily the current user)
            const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
            debugLog('Fallback to default user record', { defUserExists: Boolean(defUser) });

            // Use DEFAULT user's deviceId
            if (defUser && defUser.deviceId && String(defUser.deviceId) !== '') {
              connected = pairedDevices.find(d => String(d.id) === String(defUser.deviceId)) || null;

              if (!connected) {
                needsDefault = true;
                debugLog('User had deviceId but not in paired list', { deviceId: defUser.deviceId });
              }
            } else {
              needsDefault = true;
              debugLog('Default user missing device assignment');
            }
          }

          if (!connected) {
            const assignedIds = allUsers.filter(u => u.deviceId).map(u => String(u.deviceId));
            const unassigned = pairedDevices.filter(d => !assignedIds.includes(String(d.id)));
            needsDefault = true;
            debugLog('Default user lacks device; unassigned pool size', { unassignedCount: unassigned.length });
          }
        } else {
          needsDefault = true;
          debugLog('No stored default user id');
        }

        setConnectedDevice(connected);
        debugLog('Connected device resolved', { connectedId: connected ? connected.id : null, needsDefault });
        setShouldAssignDefaultInModal(needsDefault || !connected);
        if (needsDefault || !connected) {
          // Find default user name and save to state
          let foundDefaultUserName = '';
          if (storedDefaultUserId) {
            const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
            if (defUser) foundDefaultUserName = defUser.name || 'User';
          }
          setDefaultUserName(foundDefaultUserName);
          // Only show the 'no device assigned' modal if there are paired devices to assign
          if (!devicesMenuDismissed && pairedDevices.length > 0) {
            setShowNoDeviceAssignedModal(true);
            setShowDevicesMenuModal(false);
          } else if (!devicesMenuDismissed) {
            setShowDevicesMenuModal(true);
            setShowNoDeviceAssignedModal(false);
          } else {
            setShowNoDeviceAssignedModal(false);
          }
        } else {
          if (devicesMenuDismissed) {
            setDevicesMenuDismissed(false);
          }
          setShowDevicesMenuModal(false);
          setShowNoDeviceAssignedModal(false);
        }
      } catch (err) {
        console.error('Failed to load connected device for dashboard', err);
      }
    })();

    return () => { mounted = false; };
  }, [pairedDevices, devicesMenuDismissed, userVersion]);

  const deviceOwnerMap = useMemo(() => {
    const entries = Object.entries(currentUserDeviceMap || {});
    const map = new Map();
    entries.forEach(([userId, deviceId]) => {
      if (deviceId) {
        map.set(String(deviceId), String(userId));
      }
    });
    return map;
  }, [currentUserDeviceMap]);

  const pairedDevicesForModal = useMemo(() => {
    if (!shouldAssignDefaultInModal) return pairedDevices;
    return pairedDevices.filter(device => {
      const ownerId = deviceOwnerMap.get(String(device.id));
      return !ownerId || ownerId === activeDefaultUserId;
    });
  }, [pairedDevices, deviceOwnerMap, shouldAssignDefaultInModal, activeDefaultUserId]);

  const assignDeviceToDefaultUser = async (deviceId) => {
    try {
      const currentUser = await idbGetJSON('currentUser', null);
      const otherUsers = await idbGetJSON('users', []);
      const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u }))];
      if (allUsers.length === 0) return false;

      let storedDefaultUserId = await idbGet('defaultUserId');
      let defaultUser = storedDefaultUserId
        ? allUsers.find(u => String(u.id) === String(storedDefaultUserId))
        : null;

      if (!defaultUser) {
        defaultUser = allUsers[0];
        storedDefaultUserId = defaultUser.id;
        await idbSet('defaultUserId', storedDefaultUserId);
      }

      const updatedUsers = allUsers.map(u => (
        String(u.id) === String(storedDefaultUserId)
          ? { ...u, deviceId }
          : u
      ));

      const updatedCurrent = updatedUsers.find(u => u.self);
      if (updatedCurrent) {
        const { self: _self, ...rest } = updatedCurrent;
        await idbSetJSON('currentUser', rest);
      }
      const otherOnly = updatedUsers.filter(u => !u.self);
      await idbSetJSON('users', otherOnly);
      const defaultUserRecord = updatedUsers.find(u => String(u.id) === String(storedDefaultUserId));
      await idbSetJSON('defaultUser', sanitizeUserForStorage(defaultUserRecord));
      await persistUserDeviceMap(updatedUsers);
      debugLog('Assigned device to default user', { deviceId, defaultUserId: storedDefaultUserId });
      emitUserChange();
      return true;
    } catch (err) {
      console.error('Failed assigning default device', err);
      return false;
    }
  };

  const handleAssignDefaultFromMenu = async (device) => {
    if (!device) return;
    const success = await assignDeviceToDefaultUser(device.id);
    if (!success) return;
    setConnectedDevice(device);
    setDevicesMenuDismissed(false);
    setShowDevicesMenuModal(false);
  };

  const handlePairDeviceFromMenu = async (device) => {
    if (!device) return;
    try {
      const mappedImage = deviceImageMap[device.image] || device.image;
      const pairDevice = { ...device, image: mappedImage, connectionStatus: 'connected', batteryLevel: 70, lastSync: new Date().toISOString() };
      const updated = [...pairedDevices, pairDevice];
      await idbSetJSON('pairedDevices', updated);
      setPairedDevices(updated);
      setDevicesMenuDismissed(false);
      emitPairedDevicesChange();

      // If user has no paired devices, assign this device to default user and close modal
      if (pairedDevices.length === 0) {
        await assignDeviceToDefaultUser(pairDevice.id);
        setConnectedDevice(pairDevice);
        setShowDevicesMenuModal(false);
      }
    } catch (err) {
      console.error('Failed to pair mock available device', err);
    }
  };

  const handleUnpairDeviceFromMenu = async (device) => {
    if (!device) return;
    try {
      const updated = pairedDevices.filter(d => d.id !== device.id);
      await idbSetJSON('pairedDevices', updated);
      setPairedDevices(updated);
      if (connectedDevice && String(connectedDevice.id) === String(device.id)) {
        setConnectedDevice(null);
      }
      setDevicesMenuDismissed(false);
      emitPairedDevicesChange();
    } catch (err) {
      console.error('Failed to unpair device', err);
    }
  };

  const handleDismissDevicesMenu = () => {
    setShowDevicesMenuModal(false);
    setDevicesMenuDismissed(true);
  };

  return (
    <>
      <DashboardView
        onOpenSteps={() => setShowSteps(true)}
        onOpenHeartRate={() => setShowHeartRate(true)}
        onOpenSleep={() => setShowSleep(true)}
        onOpenBloodPressure={() => setShowBloodPressure(true)}
        onOpenSpO2={() => setShowSpO2(true)}
        onOpenStress={() => setShowStress(true)}
        onOpenCycles={() => setShowCycles(true)}
        onOpenWeight={() => setShowWeight(true)}
        connectedDevice={connectedDevice}
      />
      {showSteps && <StepsModal onClose={() => setShowSteps(false)} />}
      {showHeartRate && <HeartRateModal onClose={() => setShowHeartRate(false)} />}
      {showSleep && <SleepModal onClose={() => setShowSleep(false)} />}
      {showBloodPressure && <BloodPressureModal onClose={() => setShowBloodPressure(false)} />}
      {showSpO2 && <SpO2Modal onClose={() => setShowSpO2(false)} />}
      {showStress && <StressModal onClose={() => setShowStress(false)} />}
      {showCycles && <CyclesModal onClose={() => setShowCycles(false)} />}
      {showWeight && <WeightModal onClose={() => setShowWeight(false)} />}
      {showNoDeviceAssignedModal && (
        <div className="modal-overlay" onClick={() => setShowNoDeviceAssignedModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16 }}>{defaultUserName || 'User'} has no assigned device</h3>
            <button
              className="btn-primary btn-submit"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                setShowNoDeviceAssignedModal(false);
                setShowDevicesMenuModal(true);
              }}
            >
              Assign Device
            </button>
          </div>
        </div>
      )}
      {showDevicesMenuModal && (
        <div className="devices-menu-overlay" onClick={handleDismissDevicesMenu}>
          <div className="devices-menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="devices-menu-modal-header">
              <h3>
                {pairedDevices.length === 0 
                  ? 'Pair a device to get started' 
                  : shouldAssignDefaultInModal 
                    ? 'Choose a device to connect' 
                    : 'Manage devices'}
              </h3>
              <button className="devices-menu-modal-close" onClick={handleDismissDevicesMenu}>✕</button>
            </div>
            <div className="devices-menu-modal-body">
              <DevicesMenu
                pairedDevices={pairedDevicesForModal}
                availableDevices={availableDevices}
                onPairDevice={handlePairDeviceFromMenu}
                onUnpairDevice={handleUnpairDeviceFromMenu}
                onCardClick={shouldAssignDefaultInModal ? handleAssignDefaultFromMenu : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;