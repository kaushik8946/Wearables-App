import React, { useState, useEffect } from 'react';
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
import { 
  getAvailableDevices, 
  getUserDevices, 
  getAllUsers, 
  addUserDevice, 
  setStorageJSON, 
  subscribeToUserChange, 
  subscribeToPairedDevicesChange, 
  getStorageJSON, 
  getStorageItem,
  notifyPairedDevicesChange 
} from '../../service';
import watchImg from '../../assets/images/watch.png';
import ringImg from '../../assets/images/ring.webp';
import scaleImg from '../../assets/images/weighing-scale.avif';
import './Dashboard.css';

// map file names to assets
const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

// Device Selection Dropdown Component
const DeviceSelector = ({ devices, selectedDevice, onSelectDevice, userName }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!devices || devices.length === 0) return null;

  return (
    <div className="device-selector">
      <div className="device-selector-label">Active Device for {userName}</div>
      <button 
        className="device-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedDevice ? selectedDevice.name : 'Select Device'}</span>
        <ChevronDown size={16} />
      </button>
      {isOpen && (
        <div className="device-selector-dropdown">
          {devices.map(device => (
            <button
              key={device.id}
              className={`device-selector-item ${selectedDevice?.id === device.id ? 'active' : ''}`}
              onClick={() => {
                onSelectDevice(device);
                setIsOpen(false);
              }}
            >
              <span>{device.name}</span>
              {device.isDefault && <span className="default-badge">Default</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// No Devices Placeholder Component
const NoDevicesPlaceholder = ({ userName, onAssignDevice }) => {
  return (
    <div className="no-devices-placeholder">
      <div className="placeholder-content">
        <Scale size={64} className="placeholder-icon" />
        <h3 className="placeholder-title">{userName} has no device assigned</h3>
        <p className="placeholder-message">Assign a device to start tracking health metrics</p>
        <button className="btn-primary" onClick={onAssignDevice}>
          Assign Device
        </button>
      </div>
    </div>
  );
};

// Dashboard View Component
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
  deviceType
}) => {
  // If deviceType is 'scale', show only weight card
  const showOnlyWeight = deviceType === 'scale';
  
  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {!showOnlyWeight && (
          <>
            {/* Activity Rings */}
            <ActivityRings
              steps={connectedDevice ? 4784 : null}
              stepsGoal={8000}
              active={connectedDevice ? 45 : null}
              activeGoal={60}
              cals={connectedDevice ? 512 : null}
              calsGoal={800}
            />
          </>
        )}

        {/* Cards Grid (2 Columns) */}
        <div className="grid-2">
          {!showOnlyWeight && (
            <>
              {/* 1. Steps */}
              <div onClick={onOpenSteps} className="card card-rose">
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

              {/* 4. Blood Pressure */}
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
                <div className="dots-container">
                  {[1, 2, 3, 4, 5].map(d => (
                    <div key={d} className={`dot ${d === 3 ? 'active' : ''}`}></div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 8. Weight */}
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

// Main Dashboard Component
const Dashboard = () => {
  const [showSteps, setShowSteps] = useState(false);
  const [showHeartRate, setShowHeartRate] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showBloodPressure, setShowBloodPressure] = useState(false);
  const [showSpO2, setShowSpO2] = useState(false);
  const [showStress, setShowStress] = useState(false);
  const [showCycles, setShowCycles] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showDevicesMenuModal, setShowDevicesMenuModal] = useState(false);

  // Load current user and their devices
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        // Get default user ID
        const defaultUserId = await getStorageItem('defaultUserId');
        if (!defaultUserId) return;
        
        // Get all users
        const users = await getAllUsers();
        const user = users.find(u => String(u.id) === String(defaultUserId));
        
        if (!mounted) return;
        setCurrentUser(user);
        
        // Get user's devices from new userDevices storage
        const devices = await getUserDevices(defaultUserId);
        setUserDevices(devices);
        
        // Set default device or first device
        const defaultDevice = devices.find(d => d.isDefault) || devices[0] || null;
        setSelectedDevice(defaultDevice);
        
        // Load paired devices for modal
        const paired = await getStorageJSON('pairedDevices', []);
        setPairedDevices(paired);
        
        // Load available devices
        const pairedIds = paired.map(d => d.id);
        const available = getAvailableDevices().filter(d => !pairedIds.includes(d.id));
        setAvailableDevices(available);
        
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };
    
    loadData();
    
    // Subscribe to changes
    const unsubUser = subscribeToUserChange(() => {
      loadData();
    });
    
    const unsubDevices = subscribeToPairedDevicesChange(() => {
      loadData();
    });
    
    return () => {
      mounted = false;
      unsubUser();
      unsubDevices();
    };
  }, []);

  const handleSelectDevice = (device) => {
    setSelectedDevice(device);
  };

  const handleAssignDevice = () => {
    setShowDevicesMenuModal(true);
  };

  const handlePairDevice = async (device) => {
    if (!currentUser) return;
    
    try {
      // Add to paired devices
      const mappedImage = deviceImageMap[device.image] || device.image;
      const pairDevice = { 
        ...device, 
        image: mappedImage, 
        connectionStatus: 'connected', 
        batteryLevel: 70, 
        lastSync: new Date().toISOString() 
      };
      
      const updated = [...pairedDevices, pairDevice];
      await setStorageJSON('pairedDevices', updated);
      setPairedDevices(updated);
      
      // Add to user's devices
      await addUserDevice(currentUser.id, pairDevice, userDevices.length === 0);
      const devices = await getUserDevices(currentUser.id);
      setUserDevices(devices);
      
      // Set as selected device if it's the first one
      if (userDevices.length === 0) {
        setSelectedDevice(pairDevice);
        setShowDevicesMenuModal(false);
      }
      
      notifyPairedDevicesChange();
    } catch (err) {
      console.error('Failed to pair device', err);
    }
  };

  const handleUnpairDevice = async () => {
    // Implementation for unpair if needed
  };

  const handleCardClick = async (device) => {
    if (!currentUser) return;
    
    try {
      // Add device to user if not already added
      const existingDevice = userDevices.find(d => String(d.id) === String(device.id));
      if (!existingDevice) {
        await addUserDevice(currentUser.id, device, userDevices.length === 0);
        const devices = await getUserDevices(currentUser.id);
        setUserDevices(devices);
      }
      
      setSelectedDevice(device);
      setShowDevicesMenuModal(false);
    } catch (err) {
      console.error('Failed to assign device', err);
    }
  };

  // Determine device type
  const deviceType = selectedDevice?.deviceType?.toLowerCase() || '';

  // Show placeholder if no devices
  if (userDevices.length === 0) {
    return (
      <>
        <NoDevicesPlaceholder 
          userName={currentUser?.name || 'User'} 
          onAssignDevice={handleAssignDevice}
        />
        {showDevicesMenuModal && (
          <div className="devices-menu-overlay" onClick={() => setShowDevicesMenuModal(false)}>
            <div className="devices-menu-modal" onClick={(e) => e.stopPropagation()}>
              <div className="devices-menu-modal-header">
                <h3>Pair a device to get started</h3>
                <button className="devices-menu-modal-close" onClick={() => setShowDevicesMenuModal(false)}>✕</button>
              </div>
              <div className="devices-menu-modal-body">
                <DevicesMenu
                  pairedDevices={pairedDevices}
                  availableDevices={availableDevices}
                  onPairDevice={handlePairDevice}
                  onUnpairDevice={handleUnpairDevice}
                  onCardClick={handleCardClick}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div style={{ padding: '20px 16px' }}>
        <DeviceSelector 
          devices={userDevices}
          selectedDevice={selectedDevice}
          onSelectDevice={handleSelectDevice}
          userName={currentUser?.name || 'User'}
        />
      </div>
      
      <DashboardView
        onOpenSteps={() => setShowSteps(true)}
        onOpenHeartRate={() => setShowHeartRate(true)}
        onOpenSleep={() => setShowSleep(true)}
        onOpenBloodPressure={() => setShowBloodPressure(true)}
        onOpenSpO2={() => setShowSpO2(true)}
        onOpenStress={() => setShowStress(true)}
        onOpenCycles={() => setShowCycles(true)}
        onOpenWeight={() => setShowWeight(true)}
        connectedDevice={selectedDevice}
        deviceType={deviceType}
      />
      
      {showSteps && <StepsModal onClose={() => setShowSteps(false)} />}
      {showHeartRate && <HeartRateModal onClose={() => setShowHeartRate(false)} />}
      {showSleep && <SleepModal onClose={() => setShowSleep(false)} />}
      {showBloodPressure && <BloodPressureModal onClose={() => setShowBloodPressure(false)} />}
      {showSpO2 && <SpO2Modal onClose={() => setShowSpO2(false)} />}
      {showStress && <StressModal onClose={() => setShowStress(false)} />}
      {showCycles && <CyclesModal onClose={() => setShowCycles(false)} />}
      {showWeight && <WeightModal onClose={() => setShowWeight(false)} />}
    </>
  );
};

export default Dashboard;
