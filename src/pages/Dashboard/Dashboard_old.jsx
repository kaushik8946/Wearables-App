import React, { useMemo, useState } from 'react';
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
import { getAvailableDevices, getUserDevices, getUserDefaultDevice, setUserDefaultDevice } from '../../service';
import watchImg from '../../assets/images/watch.png';
import ringImg from '../../assets/images/ring.webp';
import scaleImg from '../../assets/images/weighing-scale.avif';
import './Dashboard.css';
import { getStorageItem, getStorageJSON, setStorageItem, setStorageJSON, notifyUserChange, subscribeToUserChange, subscribeToPairedDevicesChange, notifyPairedDevicesChange } from '../../service';

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
  deviceType 
}) => {
  const isScale = deviceType === 'scale';
  
  return (
    <div className="app-container">
      <div className="max-w-wrapper">
        {/* Activity Rings - hide for scale devices */}
        {!isScale && (
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
          {/* Show only Weight card for scale devices */}
          {isScale && (
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

          {/* Show all cards except Weight for non-scale devices */}
          {!isScale && (
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
  const [availableDevices, setAvailableDevices] = useState(getAvailableDevices());
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
    await setStorageJSON('userDeviceMap', map);
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedPairedDevices = await getStorageJSON('pairedDevices', []);
        if (!mounted) return;
        setPairedDevices(storedPairedDevices);
      } catch (err) {
        console.error('Failed to load paired devices for dashboard', err);
      }
    })();
    // Subscribe to paired devices changes so dashboard reacts to pair/unpair events
    const unsub = subscribeToPairedDevicesChange(() => {
      (async () => {
        try {
          const devices = await getStorageJSON('pairedDevices', []);
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
    setAvailableDevices(getAvailableDevices().filter(device => !pairedIds.includes(device.id)));
  }, [pairedDevices]);

  React.useEffect(() => {
    const unsubscribe = subscribeToUserChange(() => {
      setUserVersion(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedDefaultUserId = await getStorageItem('defaultUserId');
        const userDeviceMap = await getStorageJSON('userDeviceMap', {});
        debugLog('Evaluating default user', { storedDefaultUserId, userDeviceMap, pairedCount: pairedDevices?.length });

        if (!mounted) return;

        const currentUser = await getStorageJSON('currentUser', null);
        const otherUsers = await getStorageJSON('users', []);
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
      const currentUser = await getStorageJSON('currentUser', null);
      const otherUsers = await getStorageJSON('users', []);
      const allUsers = [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u }))];
      if (allUsers.length === 0) return false;

      let storedDefaultUserId = await getStorageItem('defaultUserId');
      let defaultUser = storedDefaultUserId
        ? allUsers.find(u => String(u.id) === String(storedDefaultUserId))
        : null;

      if (!defaultUser) {
        defaultUser = allUsers[0];
        storedDefaultUserId = defaultUser.id;
        await setStorageItem('defaultUserId', storedDefaultUserId);
      }

      const updatedUsers = allUsers.map(u => (
        String(u.id) === String(storedDefaultUserId)
          ? { ...u, deviceId }
          : u
      ));

      const updatedCurrent = updatedUsers.find(u => u.self);
      if (updatedCurrent) {
        const { self: _self, ...rest } = updatedCurrent;
        await setStorageJSON('currentUser', rest);
      }
      const otherOnly = updatedUsers.filter(u => !u.self);
      await setStorageJSON('users', otherOnly);
      const defaultUserRecord = updatedUsers.find(u => String(u.id) === String(storedDefaultUserId));
      await setStorageJSON('defaultUser', sanitizeUserForStorage(defaultUserRecord));
      await persistUserDeviceMap(updatedUsers);
      debugLog('Assigned device to default user', { deviceId, defaultUserId: storedDefaultUserId });
      notifyUserChange();
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
      await setStorageJSON('pairedDevices', updated);
      setPairedDevices(updated);
      setDevicesMenuDismissed(false);
      notifyPairedDevicesChange();

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
      await setStorageJSON('pairedDevices', updated);
      setPairedDevices(updated);
      if (connectedDevice && String(connectedDevice.id) === String(device.id)) {
        setConnectedDevice(null);
      }
      setDevicesMenuDismissed(false);
      notifyPairedDevicesChange();
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