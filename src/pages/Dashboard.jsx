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
import PairDeviceModal from '../components/PairDeviceModal';
import { availableDevices as initialAvailableDevices } from '../data/mockData';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';
import '../styles/pages/Dashboard.css';
import { idbGet, idbGetJSON, idbSetJSON } from '../data/db';
import { getDeviceTypeIcon } from '../data/mockData';

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

// 1. MAIN DASHBOARD (Light Mode)
const DashboardView = ({ onOpenSteps, onNavigateDevices, connectedDevice }) => {
  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {/* Show connected device name near the top */}
        {connectedDevice && (
          <div className="connected-device-row">
            {/* <div className="connected-label">Connected</div> */}
            <div className="connected-device-name">
              <span className="connected-device-icon" style={{ marginRight: 8 }}>{getDeviceTypeIcon(connectedDevice.deviceType)}</span>
              {connectedDevice.name}
            </div>
            <div className="connected-device-model">{connectedDevice.model}</div>
          </div>
        )}
        {/* Removed large placeholder; dashboards will show placeholder values when no device is connected */}
        <>
          {/* Quick access: Pair device (same style as Devices page) */}
          {/* pair device button removed; modal will auto-open based on default user + paired/unpaired device logic */}
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
            <div className="card card-lime">
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
            <div className="card card-indigo">
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
            <div className="card card-sky">
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
            <div className="card card-teal">
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
            <div className="card card-amber">
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
            <div className="card card-pink">
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
                {connectedDevice ? (<><span>77.9</span><span className="weight-unit-text">kg</span></>) : '— kg'}
              </div>
            </div>

          </div>
        </>
        {/* Assign default device modal moved to Dashboard component for correct scope */}
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

  const [showAssignDefaultModal, setShowAssignDefaultModal] = useState(false);
  const [availableUnassignedDevices, setAvailableUnassignedDevices] = useState([]);
  const [selectedAssignDevice, setSelectedAssignDevice] = useState('');
  // For the "no paired devices/unassigned" -> show available devices to pair
  const [showAvailableDevicesModal, setShowAvailableDevicesModal] = useState(false);
  const [availablePairDevices, setAvailablePairDevices] = useState([]);
  const [selectedAvailableDevice, setSelectedAvailableDevice] = useState(null);


  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [storedDefaultUserId, storedPairedDevices] = await Promise.all([
          idbGet('defaultUserId'),
          idbGetJSON('pairedDevices', []),
        ]);

        if (!mounted) return;

        if (!storedPairedDevices || storedPairedDevices.length === 0) {
          setConnectedDevice(null);
          // If there are mock available devices, show the pair flow when default user exists
          // Log debug info for troubleshooting modal visibility
          console.log('[Dashboard] No paired devices. storedDefaultUserId:', await idbGet('defaultUserId'));
          // Always show pair devices modal when there are zero paired devices; this lets
          // the user add a device so they can then pick a default. Previously we only
          // opened the modal when `defaultUserId` existed which prevented the flow.
          setAvailablePairDevices(initialAvailableDevices.map(d => ({ ...d })));
          setShowAvailableDevicesModal(true);
          return;
        }

        // If there is a default user selected, load their mapping from users/currentUser
        const currentUser = await idbGetJSON('currentUser', null);
        const otherUsers = await idbGetJSON('users', []);
        const allUsers = [ ...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u })) ];

        let connected = null;
        // local flags for whether we intend to open a modal during this effect
        let openAssignDefault = false;
        let openPairModal = false;
        if (storedDefaultUserId) {
          const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
          if (defUser && defUser.deviceId) {
            connected = storedPairedDevices.find(d => String(d.id) === String(defUser.deviceId));
          }
          // if no device assigned to default user, but paired unassigned devices exist, prompt to assign
            if (!connected) {
            // find unassigned devices
            const assignedIds = allUsers.filter(u => u.deviceId).map(u => String(u.deviceId));
            const unassigned = storedPairedDevices.filter(d => !assignedIds.includes(String(d.id)));
            if (unassigned.length > 0) {
              setAvailableUnassignedDevices(unassigned);
                // When there is at least one unassigned paired device, prompt to pick a default device
                setShowAssignDefaultModal(true);
                openAssignDefault = true;
            }
            console.log('[Dashboard] storedDefaultUserId found; unassigned:', unassigned.length, 'openAssignDefault:', openAssignDefault);
              // If there are no unassigned paired devices (but default user exists), let the user pair
              if (unassigned.length === 0) {
                // compute available devices not in paired
                const pairedIds = storedPairedDevices.map(d => d.id);
                const availToPair = initialAvailableDevices.filter(d => !pairedIds.includes(d.id)).map(d => ({ ...d }));
                if (availToPair.length > 0) {
                  setAvailablePairDevices(availToPair);
                  setShowAvailableDevicesModal(true);
                  openPairModal = true;
                }
                console.log('[Dashboard] availToPair', availToPair.length, 'openPairModal:', openPairModal);
              }
          }
        }

        // fallback - only show the first paired device if none assigned AND we're not
        // prompting the user to select/assign the device or pair a new one.
        if (!connected && storedPairedDevices.length > 0 && !openAssignDefault && !openPairModal) {
          connected = storedPairedDevices[0];
        }
        setConnectedDevice(connected);
      } catch (err) {
        console.error('Failed to load connected device for dashboard', err);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const handleAssignDefaultDevice = async () => {
    try {
      const currentUser = await idbGetJSON('currentUser', null);
      const otherUsers = await idbGetJSON('users', []);
      const allUsers = [ ...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u })) ];
      const storedDefaultUserId = await idbGet('defaultUserId');
      if (!storedDefaultUserId) return;
      const updatedUsers = allUsers.map(u => {
        if (String(u.id) === String(storedDefaultUserId)) {
          return { ...u, deviceId: selectedAssignDevice };
        }
        return u;
      });

      // Persist: update currentUser and users arrays separately
      const updatedCurrent = updatedUsers.find(u => u.self);
      if (updatedCurrent) {
        const { self, ...rest } = updatedCurrent;
        await idbSetJSON('currentUser', rest);
      }
      const otherOnly = updatedUsers.filter(u => !u.self);
      await idbSetJSON('users', otherOnly);

      // Update dashboard connected device
      const pairedDevices = await idbGetJSON('pairedDevices', []);
      const newDevice = pairedDevices.find(d => String(d.id) === String(selectedAssignDevice));
      setConnectedDevice(newDevice || null);
      setShowAssignDefaultModal(false);
      setSelectedAssignDevice('');
    } catch (err) {
      console.error('Failed assigning default device', err);
      // On error, close modal and show placeholders
      setShowAssignDefaultModal(false);
      setSelectedAssignDevice('');
      setConnectedDevice(null);
    }
  };

  const handleCancelAssignDefault = () => {
    // Close modal and show placeholders only (no connected device)
    setShowAssignDefaultModal(false);
    setSelectedAssignDevice('');
    setConnectedDevice(null);
  };

  // Pair selected available device from mock list and then open Assign modal so it can be assigned
  const handlePairAvailableDevice = async (device) => {
    try {
      // Map image to local asset
      const mappedImage = deviceImageMap[device.image] || device.image;
      const pairDevice = { ...device, image: mappedImage, connectionStatus: 'connected', batteryLevel: 70, lastSync: new Date().toISOString() };

      const existing = await idbGetJSON('pairedDevices', []);
      const updated = [...existing, pairDevice];
      await idbSetJSON('pairedDevices', updated);

      // Recompute unassigned devices and open assign modal
      const currentUser = await idbGetJSON('currentUser', null);
      const otherUsers = await idbGetJSON('users', []);
      const allUsers = [ ...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u })) ];
      const assignedIds = allUsers.filter(u => u.deviceId).map(u => String(u.deviceId));
      const unassigned = updated.filter(d => !assignedIds.includes(String(d.id)));
      setAvailableUnassignedDevices(unassigned);
      setShowAvailableDevicesModal(false);
      setSelectedAvailableDevice(null);
      setShowAssignDefaultModal(true);
    } catch (err) {
      console.error('Failed to pair mock available device', err);
    }
  };

  return (
    <>
      <DashboardView
        onOpenSteps={() => setShowSteps(true)}
        onNavigateDevices={() => navigate('/devices')}
        connectedDevice={connectedDevice}
      />
      {/* Assign default device modal - rendered in Dashboard scope */}
      {showAssignDefaultModal && (
        <div className="modal-overlay" onClick={handleCancelAssignDefault}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign device to default user</h3>
              <button className="modal-close" onClick={handleCancelAssignDefault}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-message">Choose a device to assign to the default user so dashboard metrics show.</p>
              <select className="family-member-dropdown" value={selectedAssignDevice} onChange={e => setSelectedAssignDevice(e.target.value)}>
                <option value="">-- Choose device --</option>
                {availableUnassignedDevices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.model})</option>
                ))}
              </select>
            </div>
              <div className="modal-footer">
              <button className="btn-pair" onClick={handleAssignDefaultDevice} disabled={!selectedAssignDevice}>Assign</button>
              <button className="btn-cancel" onClick={handleCancelAssignDefault}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showSteps && <StepsModal onClose={() => setShowSteps(false)} />}
      {/* If there are no paired/unassigned devices, show available devices for pairing */}
      {showAvailableDevicesModal && (
        <PairDeviceModal
          availableDevices={availablePairDevices}
          device={selectedAvailableDevice ? { ...selectedAvailableDevice, image: deviceImageMap[selectedAvailableDevice.image] || selectedAvailableDevice.image } : null}
          onClose={() => { setShowAvailableDevicesModal(false); setSelectedAvailableDevice(null); setConnectedDevice(null); }}
          onPair={(dev) => handlePairAvailableDevice(dev)}
          onOpenDevice={(dev) => setSelectedAvailableDevice(dev)}
        />
      )}
    </>
  );
}