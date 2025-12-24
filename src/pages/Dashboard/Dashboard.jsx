import React, { useState } from 'react';
import {
  Heart,
  Footprints,
  Moon,
  Wind,
  Zap,
  Scale,
  CalendarHeart,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import DevicesMenu from '../../common/DevicesMenu/DevicesMenu';
import SineWave from '../../common/SineWave/SineWave';
import BarChart from '../../common/BarChart/BarChart';
import ActivityRings from '../../common/ActivityRings/ActivityRings';
import StepsModal from '../../common/StepsModal/StepsModal';
import HeartRateModal from '../../common/HeartRateModal/HeartRateModal';
import SleepModal from '../../common/SleepModal/SleepModal';
import BloodPressureModal from '../../common/BloodPressureModal/BloodPressureModal';
import SpO2Modal from '../../common/SpO2Modal/SpO2Modal';
import StressModal from '../../common/StressModal/StressModal';
import CyclesModal from '../../common/CyclesModal/CyclesModal';
import WeightModal from '../../common/WeightModal/WeightModal';
import { getAvailableDevices, getDevicesForUser, getDefaultDeviceForUser, setDefaultDeviceForUser, getUserById } from '../../service';
import watchImg from '../../assets/images/watch.png';
import ringImg from '../../assets/images/ring.webp';
import scaleImg from '../../assets/images/weighing-scale.avif';
import './Dashboard.css';
import { getStorageItem, getStorageJSON, setStorageJSON, notifyUserChange, subscribeToUserChange, subscribeToPairedDevicesChange, notifyPairedDevicesChange } from '../../service';

// map file names to assets (same mapping as in Devices.jsx)
const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

// 1. MAIN DASHBOARD (Light Mode)
const DashboardView = ({
  onOpenSteps,
  onOpenHeartRate,
  onOpenSleep,
  onOpenBloodPressure,
  onOpenSpO2,
  onOpenStress,
  onOpenCycles,
  onOpenWeight,
  connectedDevice,
  userDevices,
  onDeviceSelect
}) => {
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  // Determine which cards to show based on device type
  const isScale = connectedDevice?.deviceType === 'scale';
  const showWeightOnly = isScale;
  const showAllExceptWeight = !isScale && connectedDevice;

  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {/* Device Selector */}
        {connectedDevice && userDevices && userDevices.length > 0 && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                Active Device:
              </span>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <div
                  onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'white',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <span>{connectedDevice.name}</span>
                  <ChevronDown size={18} style={{
                    transition: 'transform 0.2s',
                    transform: showDeviceDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </div>

                {showDeviceDropdown && userDevices.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    overflow: 'hidden'
                  }}>
                    {userDevices.map(device => (
                      <div
                        key={device.id}
                        onClick={() => {
                          onDeviceSelect(device);
                          setShowDeviceDropdown(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          background: String(device.id) === String(connectedDevice.id) ? '#f0f0f0' : 'white',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '14px',
                          fontWeight: String(device.id) === String(connectedDevice.id) ? '600' : '400'
                        }}
                        onMouseEnter={(e) => {
                          if (String(device.id) !== String(connectedDevice.id)) {
                            e.target.style.background = '#f8f8f8';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (String(device.id) !== String(connectedDevice.id)) {
                            e.target.style.background = 'white';
                          }
                        }}
                      >
                        {device.name}
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                          {device.brand} • {device.model}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Rings - only show if not scale */}
        {!showWeightOnly && (
          <ActivityRings
            steps={connectedDevice ? 4784 : null}
            stepsGoal={8000}
            active={connectedDevice ? 45 : null}
            activeGoal={60}
            cals={connectedDevice ? 512 : null}
            calsGoal={800}
          />
        )}

        {/* Cards Grid (2 Columns) */}
        <div className="grid-2">
          {/* Show only Weight card for scale */}
          {showWeightOnly && (
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
          )}

          {/* Show all cards except Weight for other devices */}
          {showAllExceptWeight && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
// Simplified Dashboard Component
// Main Dashboard component for wearables app
const Dashboard = () => {
  const [showSteps, setShowSteps] = useState(false);
  const [showHeartRate, setShowHeartRate] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showBloodPressure, setShowBloodPressure] = useState(false);
  const [showSpO2, setShowSpO2] = useState(false);
  const [showStress, setShowStress] = useState(false);
  const [showCycles, setShowCycles] = useState(false);
  const [showWeight, setShowWeight] = useState(false);

  // User and device state
  const [activeUser, setActiveUser] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [showDevicesMenuModal, setShowDevicesMenuModal] = useState(false);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState(getAvailableDevices());

  // Load active user and their devices
  React.useEffect(() => {
    let mounted = true;

    const loadUserAndDevices = async () => {
      try {
        // Get active user (or fall back to default)
        let activeId = await getStorageItem('activeUserId');
        if (!activeId) {
          activeId = await getStorageItem('defaultUserId');
        }

        if (!activeId) {
          // No user set yet - wait for onboarding
          if (mounted) {
            setActiveUser(null);
            setUserDevices([]);
            setConnectedDevice(null);
          }
          return;
        }

        const user = await getUserById(activeId);
        if (!mounted) return;

        if (!user) {
          setActiveUser(null);
          setUserDevices([]);
          setConnectedDevice(null);
          return;
        }

        setActiveUser(user);

        // Get user's devices
        const devices = await getDevicesForUser(user.id);
        setUserDevices(devices);

        // Get default device for user
        const defaultDevice = await getDefaultDeviceForUser(user.id);
        setConnectedDevice(defaultDevice);

        // Don't automatically show modal - let user click button instead
      } catch (err) {
        console.error('Failed to load user and devices', err);
      }
    };

    loadUserAndDevices();

    // Subscribe to user changes (from header dropdown)
    const unsubUser = subscribeToUserChange(() => {
      loadUserAndDevices();
    });

    return () => {
      mounted = false;
      unsubUser();
    };
  }, []);

  // Load paired devices
  React.useEffect(() => {
    let mounted = true;

    const loadPairedDevices = async () => {
      try {
        const devices = await getStorageJSON('pairedDevices', []);
        if (mounted) {
          setPairedDevices(devices);
        }
      } catch (err) {
        console.error('Failed to load paired devices', err);
      }
    };

    loadPairedDevices();

    const unsub = subscribeToPairedDevicesChange(() => {
      loadPairedDevices();
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Update available devices
  React.useEffect(() => {
    const pairedIds = pairedDevices.map(d => d.id);
    setAvailableDevices(getAvailableDevices().filter(d => !pairedIds.includes(d.id)));
  }, [pairedDevices]);

  // Handle device selection
  const handleDeviceSelect = async (device) => {
    if (!activeUser) return;

    try {
      // Set as default device for active user
      await setDefaultDeviceForUser(activeUser.id, device.id);
      setConnectedDevice(device);
    } catch (err) {
      console.error('Failed to set device as default', err);
    }
  };

  // Handle pairing device
  const handlePairDevice = async (device) => {
    try {
      const mappedImage = deviceImageMap[device.image] || device.image;
      const pairDevice = {
        ...device,
        image: mappedImage,
        connectionStatus: 'connected',
        batteryLevel: 70,
        lastSync: new Date().toISOString()
      };

      // Check if device already exists in pairedDevices to avoid duplicates
      const existingDevice = pairedDevices.find(d => String(d.id) === String(device.id));
      let updated;
      if (existingDevice) {
        // Update existing device
        updated = pairedDevices.map(d =>
          String(d.id) === String(device.id) ? pairDevice : d
        );
      } else {
        // Add new device
        updated = [...pairedDevices, pairDevice];
      }

      await setStorageJSON('pairedDevices', updated);
      setPairedDevices(updated);
      notifyPairedDevicesChange();

      // If active user has no devices, pair this one
      if (activeUser && userDevices.length === 0) {
        // Add device to user's devices
        const defaultUser = await getStorageJSON('defaultUser', null);
        const otherUsers = await getStorageJSON('users', []);

        if (defaultUser && String(defaultUser.id) === String(activeUser.id)) {
          const updatedUser = {
            ...defaultUser,
            devices: [String(pairDevice.id)],
            defaultDevice: String(pairDevice.id)
          };
          await setStorageJSON('defaultUser', updatedUser);
        } else {
          const updatedOthers = otherUsers.map(u =>
            String(u.id) === String(activeUser.id)
              ? {
                ...u,
                devices: [String(pairDevice.id)],
                defaultDevice: String(pairDevice.id)
              }
              : u
          );
          await setStorageJSON('users', updatedOthers);
        }

        notifyUserChange();
        setConnectedDevice(pairDevice);
        setUserDevices([pairDevice]);
        setShowDevicesMenuModal(false);
      }
    } catch (err) {
      console.error('Failed to pair device', err);
    }
  };

  // Handle unpairing device
  const handleUnpairDevice = async (device) => {
    try {
      const updated = pairedDevices.filter(d => d.id !== device.id);
      await setStorageJSON('pairedDevices', updated);
      setPairedDevices(updated);

      if (connectedDevice && String(connectedDevice.id) === String(device.id)) {
        setConnectedDevice(null);
      }

      notifyPairedDevicesChange();
    } catch (err) {
      console.error('Failed to unpair device', err);
    }
  };

  // Show empty state if user has no devices
  if (activeUser && userDevices.length === 0 && !showDevicesMenuModal) {
    return (
      <div className="app-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '40px 20px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          background: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '16px', fontSize: '24px', color: '#334155' }}>
            No devices paired for: {activeUser.name}
          </h2>
          <button
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '12px 24px',
              fontSize: '16px',
              borderRadius: '8px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => setShowDevicesMenuModal(true)}
          >
            Pair Device
          </button>
        </div>
      </div>
    );
  }

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
        userDevices={userDevices}
        onDeviceSelect={handleDeviceSelect}
      />

      {/* Modals */}
      {showSteps && <StepsModal onClose={() => setShowSteps(false)} />}
      {showHeartRate && <HeartRateModal onClose={() => setShowHeartRate(false)} />}
      {showSleep && <SleepModal onClose={() => setShowSleep(false)} />}
      {showBloodPressure && <BloodPressureModal onClose={() => setShowBloodPressure(false)} />}
      {showSpO2 && <SpO2Modal onClose={() => setShowSpO2(false)} />}
      {showStress && <StressModal onClose={() => setShowStress(false)} />}
      {showCycles && <CyclesModal onClose={() => setShowCycles(false)} />}
      {showWeight && <WeightModal onClose={() => setShowWeight(false)} />}

      {/* Device Pairing Modal */}
      {showDevicesMenuModal && (
        <div className="devices-menu-overlay" onClick={() => setShowDevicesMenuModal(false)}>
          <div className="devices-menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="devices-menu-modal-header">
              <h3>{pairedDevices.length === 0 ? 'Pair a device to get started' : 'Pair a device'}</h3>
              <button
                className="devices-menu-modal-close"
                onClick={() => setShowDevicesMenuModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="devices-menu-modal-body">
              <DevicesMenu
                pairedDevices={pairedDevices}
                availableDevices={availableDevices}
                onPairDevice={handlePairDevice}
                onUnpairDevice={handleUnpairDevice}
                onCardClick={handlePairDevice}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
