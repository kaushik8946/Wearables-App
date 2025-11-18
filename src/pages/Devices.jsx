import { useState, useEffect } from 'react';
import { MdSettings } from 'react-icons/md';
// Battery icon SVGs
const BatteryIcon = ({ level }) => {
  let color = '#4caf50';
  if (level <= 20) color = '#e74c3c';
  else if (level <= 50) color = '#fbc02d';
  else if (level <= 80) color = '#ffb300';
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" style={{ verticalAlign: 'middle', marginRight: 4 }}>
      <rect x="1" y="3" width="22" height="10" rx="3" fill="none" stroke={color} strokeWidth="2" />
      <rect x="24" y="6" width="3" height="4" rx="1" fill={color} />
      <rect x="3" y="5" width={Math.max(0, Math.round(18 * (level / 100)))} height="6" rx="2" fill={color} />
    </svg>
  );
};
import '../styles/pages/Devices.css';
import { availableDevices as initialAvailableDevices } from '../data/mockData';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';

const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

const Devices = () => {
  // Default device state
  const [defaultDeviceId, setDefaultDeviceId] = useState(() => {
    const saved = localStorage.getItem('defaultDeviceId');
    return saved || '';
  });
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [pairedDevices, setPairedDevices] = useState(() => {
    const saved = localStorage.getItem('pairedDevices');
    if (!saved) return [];
    // On every reload, assign a new random batteryLevel to each device
    return JSON.parse(saved).map(device => ({
      ...device,
      batteryLevel: Math.floor(Math.random() * 100) + 1
    }));
  });

  // Removed defaultDeviceId state

  const [availableDevices, setAvailableDevices] = useState(() => {
    const saved = localStorage.getItem('pairedDevices');
    const pairedIds = saved ? JSON.parse(saved).map(d => d.id) : [];
    return initialAvailableDevices.filter(device => !pairedIds.includes(device.id));
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [users, setUsers] = useState([]);
  const [settingsModal, setSettingsModal] = useState({ open: false, device: null, newMember: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deviceToAssign, setDeviceToAssign] = useState(null);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState('');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const otherUsers = JSON.parse(localStorage.getItem('users') || '[]');
    // Ensure all mobile values are strings
    const normalize = m => ({ ...m, mobile: String(m.mobile) });
    setUsers([{ ...normalize(currentUser), self: true }, ...otherUsers.map(normalize)]);
  }, []);

  useEffect(() => {
    if (pairedDevices.length > 0 && !defaultDeviceId) {
      setDefaultDeviceId(String(pairedDevices[0].id));
      localStorage.setItem('defaultDeviceId', String(pairedDevices[0].id));
    }
    if (pairedDevices.length === 0 && defaultDeviceId) {
      setDefaultDeviceId('');
      localStorage.removeItem('defaultDeviceId');
    }
  }, [pairedDevices, defaultDeviceId]);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    setShowModal(true);
  };

  const handlePairDevice = () => {
    if (selectedDevice) {
      const pairedDevice = {
        ...selectedDevice,
        assignedTo: 'none', 
        connectionStatus: 'connected',
        batteryLevel: Math.floor(Math.random() * 100) + 1,
        lastSync: new Date().toISOString()
      };

      const updatedPairedDevices = [...pairedDevices, pairedDevice];
      setPairedDevices(updatedPairedDevices);
      localStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));

      const updatedAvailableDevices = availableDevices.filter(d => d.id !== selectedDevice.id);
      setAvailableDevices(updatedAvailableDevices);

      setShowModal(false);
      
      // Show assign user modal after pairing
      setDeviceToAssign(pairedDevice);
      setSelectedUserForAssign('');
      setShowAssignModal(true);
      
      setSelectedDevice(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
  };

  const getAssignedUserName = (mobile) => {
    if (!mobile || mobile === 'none') return 'User not assigned';
    const user = users.find(m => String(m.mobile) === String(mobile));
    return user ? user.name + (user.self ? ' (Self)' : '') : 'Unknown';
  };

  const handleSettings = (e, deviceId) => {
    e.stopPropagation();
    const device = pairedDevices.find(d => d.id === deviceId);
    setSettingsModal({ open: true, device, newUser: device.assignedTo });
  };

  const handleCloseSettingsModal = () => {
    setSettingsModal({ open: false, device: null, newMember: '' });
  };

  const handleReassign = () => {
    if (!settingsModal.newUser) {
      alert('Please select a user to assign this device');
      return;
    }
    const updatedPairedDevices = pairedDevices.map(d =>
      d.id === settingsModal.device.id ? { ...d, assignedTo: settingsModal.newUser } : d
    );
    setPairedDevices(updatedPairedDevices);
    localStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));
    handleCloseSettingsModal();
  };

  const handleRemoveDevice = () => {
    // Remove from paired, add back to available
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== settingsModal.device.id);
    setPairedDevices(updatedPairedDevices);
    localStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));
    setAvailableDevices([...availableDevices, settingsModal.device]);
    handleCloseSettingsModal();
  };

  const handleAssignUser = () => {
    if (!selectedUserForAssign) {
      alert('Please select a user to assign this device');
      return;
    }
    
    const updatedPairedDevices = pairedDevices.map(d =>
      d.id === deviceToAssign.id ? { ...d, assignedTo: selectedUserForAssign } : d
    );
    setPairedDevices(updatedPairedDevices);
    localStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));
    
    setShowAssignModal(false);
    setDeviceToAssign(null);
    setSelectedUserForAssign('');
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setDeviceToAssign(null);
    setSelectedUserForAssign('');
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
          {pairedDevices.length > 0 && (
            <button className="btn-manage-default" onClick={() => setShowDefaultModal(true)}>
              Change Default
            </button>
          )}
        </div>

        <div className="section-title">Paired Devices</div>
        <div className="device-list">
          {pairedDevices.length === 0 ? (
            <div className="device-card empty">No paired devices</div>
          ) : (
            pairedDevices.map(device => (
              <div className="device-card" key={device.id} onClick={e => handleSettings(e, device.id)} style={{ cursor: 'pointer' }}>
                <div className="device-content">
                  <div className="device-image-wrapper">
                    <img src={deviceImageMap[device.image] || device.image} alt={device.name} className="device-image" />
                  </div>
                  <div className="device-info">
                    <span className="device-name">
                      {device.name}
                      {String(defaultDeviceId) === String(device.id) && (
                        <span className="device-default-badge">Default</span>
                      )}
                      {device.assignedTo === 'none' && (
                        <span className="device-default-badge" style={{ background: '#9e9e9e' }}>User not assigned</span>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <BatteryIcon level={device.batteryLevel || 0} />
                      <span style={{ fontSize: 12, color: device.batteryLevel <= 20 ? '#e74c3c' : '#333', fontWeight: 600 }}>{device.batteryLevel}%</span>
                    </span>
                    <span className="device-model">{device.model}</span>
                    {device.assignedTo !== 'none' ? (
                      <span className="device-assigned">
                        Assigned to: {getAssignedUserName(device.assignedTo)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button 
                  className="device-settings"
                  onClick={e => { e.stopPropagation(); handleSettings(e, device.id); }}
                  title="Device settings"
                  style={{ fontWeight: 'bold', color: '#111' }}
                >
                  <MdSettings size={24} style={{ fontWeight: 'bold', color: '#111' }} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="section-title">Available Devices</div>
        <div className="device-list">
          {availableDevices.length === 0 ? (
            <div className="device-card empty">No available devices</div>
          ) : (
            availableDevices.map(device => (
              <div 
                className="device-card" 
                key={device.id}
                onClick={() => handleDeviceClick(device)}
              >
                <div className="device-content">
                  <div className="device-image-wrapper">
                    <img src={deviceImageMap[device.image] || device.image} alt={device.name} className="device-image" />
                  </div>
                  <div className="device-info">
                    <span className="device-name">{device.name}</span>
                    <span className="device-model">{device.model}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && selectedDevice && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pair Device</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-device-preview">
                <div className="modal-device-image-wrapper">
                  <img src={deviceImageMap[selectedDevice.image] || selectedDevice.image} alt={selectedDevice.name} className="modal-device-image" />
                </div>
                <div className="modal-device-info">
                  <h4>{selectedDevice.name}</h4>
                  <p>{selectedDevice.model}</p>
                  <span className="modal-device-brand">{selectedDevice.brand}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-pair" onClick={handlePairDevice}>Pair Device</button>
              <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {settingsModal.open && settingsModal.device && (
        <div className="modal-overlay" onClick={handleCloseSettingsModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Device Settings</h3>
              <button className="modal-close" onClick={handleCloseSettingsModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-device-preview">
                <div className="modal-device-image-wrapper">
                  <img src={deviceImageMap[settingsModal.device.image] || settingsModal.device.image} alt={settingsModal.device.name} className="modal-device-image" />
                </div>
                <div className="modal-device-info">
                  <h4>{settingsModal.device.name}</h4>
                  <p>{settingsModal.device.model}</p>
                  <span className="modal-device-brand">{settingsModal.device.brand}</span>
                </div>
              </div>
              <p className="modal-message">Reassign this device to another user:</p>
              <select
                className="user-dropdown"
                value={settingsModal.newUser}
                onChange={e => setSettingsModal(s => ({ ...s, newUser: e.target.value }))}
              >
                <option value="">-- Choose User --</option>
                {users.map((user, idx) => (
                  <option key={idx} value={user.mobile}>
                    {user.name} {user.self ? "(Self)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-pair" onClick={handleReassign}>Reassign</button>
              <button className="btn-remove" onClick={handleRemoveDevice}>Remove Device</button>
              <button className="btn-cancel" onClick={handleCloseSettingsModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Default Device Modal */}
      {showDefaultModal && (
        <div className="modal-overlay" onClick={() => setShowDefaultModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Default Device</h3>
              <button className="modal-close" onClick={() => setShowDefaultModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-message">Select your default device:</p>
              <select
                className="family-member-dropdown"
                value={defaultDeviceId}
                onChange={e => {
                  setDefaultDeviceId(e.target.value);
                  localStorage.setItem('defaultDeviceId', e.target.value);
                }}
              >
                <option value="">-- Select Device --</option>
                {pairedDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.model}) - {getAssignedUserName(device.assignedTo)}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDefaultModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign User Modal */}
      {showAssignModal && deviceToAssign && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Device to User</h3>
            </div>
            <div className="modal-body">
              <div className="modal-device-preview">
                <div className="modal-device-image-wrapper">
                  <img src={deviceImageMap[deviceToAssign.image] || deviceToAssign.image} alt={deviceToAssign.name} className="modal-device-image" />
                </div>
                <div className="modal-device-info">
                  <h4>{deviceToAssign.name}</h4>
                  <p>{deviceToAssign.model}</p>
                  <span className="modal-device-brand">{deviceToAssign.brand}</span>
                </div>
              </div>
              <p className="modal-message">Assign this device to a user: <span style={{color: 'red'}}>*</span></p>
              <select
                className="family-member-dropdown"
                value={selectedUserForAssign}
                onChange={e => setSelectedUserForAssign(e.target.value)}
              >
                <option value="">-- Choose User --</option>
                {users.map((user, idx) => (
                  <option key={idx} value={user.mobile}>
                    {user.name} {user.self ? "(Self)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-pair" onClick={handleAssignUser}>Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
