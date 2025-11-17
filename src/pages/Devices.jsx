import { useState, useEffect } from 'react';
import '../styles/pages/Devices.css';
import { availableDevices as initialAvailableDevices } from '../data/mockData';

const Devices = () => {
  // Default device state
  const [defaultDeviceId, setDefaultDeviceId] = useState(() => {
    const saved = localStorage.getItem('defaultDeviceId');
    return saved || '';
  });
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [pairedDevices, setPairedDevices] = useState(() => {
    const saved = localStorage.getItem('pairedDevices');
    return saved ? JSON.parse(saved) : [];
  });

  // Removed defaultDeviceId state

  const [availableDevices, setAvailableDevices] = useState(() => {
    const saved = localStorage.getItem('pairedDevices');
    const pairedIds = saved ? JSON.parse(saved).map(d => d.id) : [];
    return initialAvailableDevices.filter(device => !pairedIds.includes(device.id));
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('');
  // Settings modal state
  const [settingsModal, setSettingsModal] = useState({ open: false, device: null, newMember: '' });
  // Removed makeDefault state

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const otherMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
    // Ensure all mobile values are strings
    const normalize = m => ({ ...m, mobile: String(m.mobile) });
    setFamilyMembers([{ ...normalize(currentUser), self: true }, ...otherMembers.map(normalize)]);
  }, []);

  // Auto-set first paired device as default if none
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
    setSelectedFamilyMember('');
    setShowModal(true);
  };

  const handlePairDevice = () => {
    if (!selectedFamilyMember) {
      alert('Please select a family member to assign this device');
      return;
    }
    if (selectedDevice) {
      const pairedDevice = {
        ...selectedDevice,
        assignedTo: selectedFamilyMember,
        connectionStatus: 'connected',
        batteryLevel: Math.floor(Math.random() * 30) + 70,
        lastSync: new Date().toISOString()
      };

      const updatedPairedDevices = [...pairedDevices, pairedDevice];
      setPairedDevices(updatedPairedDevices);
      localStorage.setItem('pairedDevices', JSON.stringify(updatedPairedDevices));

      const updatedAvailableDevices = availableDevices.filter(d => d.id !== selectedDevice.id);
      setAvailableDevices(updatedAvailableDevices);

      setShowModal(false);
      setSelectedDevice(null);
      setSelectedFamilyMember('');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
    setSelectedFamilyMember('');
  };

  const getAssignedMemberName = (mobile) => {
    if (!mobile) return 'Unknown';
    const member = familyMembers.find(m => String(m.mobile) === String(mobile));
    return member ? member.name + (member.self ? ' (You)' : '') : 'Unknown';
  };

  const handleSettings = (e, deviceId) => {
    e.stopPropagation();
    const device = pairedDevices.find(d => d.id === deviceId);
    setSettingsModal({ open: true, device, newMember: device.assignedTo });
  };

  const handleCloseSettingsModal = () => {
    setSettingsModal({ open: false, device: null, newMember: '' });
  };

  const handleReassign = () => {
    if (!settingsModal.newMember) {
      alert('Please select a family member to assign this device');
      return;
    }
    const updatedPairedDevices = pairedDevices.map(d =>
      d.id === settingsModal.device.id ? { ...d, assignedTo: settingsModal.newMember } : d
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

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
          {pairedDevices.length > 0 && (
            <button className="btn-manage-default" onClick={() => setShowDefaultModal(true)}>
              Manage Default
            </button>
          )}
        </div>

        <div className="section-title">Paired Devices</div>
        <div className="device-list">
          {pairedDevices.length === 0 ? (
            <div className="device-card empty">No paired devices</div>
          ) : (
            pairedDevices.map(device => (
              <div className="device-card" key={device.id}>
                <div className="device-content">
                  <div className="device-image-wrapper">
                    <img src={device.image} alt={device.name} className="device-image" />
                  </div>
                  <div className="device-info">
                    <span className="device-name">
                      {device.name}
                      {String(defaultDeviceId) === String(device.id) && (
                        <span className="device-default-badge">Default</span>
                      )}
                    </span>
                    <span className="device-model">{device.model}</span>
                    <span className="device-assigned">
                      Assigned to: {getAssignedMemberName(device.assignedTo)}
                    </span>
                  </div>
                </div>
                <button 
                  className="device-settings"
                  onClick={(e) => handleSettings(e, device.id)}
                  title="Device settings"
                >
                  ⚙️
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
                    <img src={device.image} alt={device.name} className="device-image" />
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
                  <img src={selectedDevice.image} alt={selectedDevice.name} className="modal-device-image" />
                </div>
                <div className="modal-device-info">
                  <h4>{selectedDevice.name}</h4>
                  <p>{selectedDevice.model}</p>
                  <span className="modal-device-brand">{selectedDevice.brand}</span>
                </div>
              </div>

              <p className="modal-message">Select family member to assign this device:</p>
              <select
                className="family-member-dropdown"
                value={selectedFamilyMember}
                onChange={(e) => setSelectedFamilyMember(e.target.value)}
              >
                <option value="">-- Choose Family Member --</option>
                {familyMembers.map((member, idx) => (
                  <option key={idx} value={member.mobile}>
                    {member.name} {member.self ? "(You)" : ""}
                  </option>
                ))}
              </select>
              

            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button className="btn-pair" onClick={handlePairDevice}>Pair Device</button>
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
                  <img src={settingsModal.device.image} alt={settingsModal.device.name} className="modal-device-image" />
                </div>
                <div className="modal-device-info">
                  <h4>{settingsModal.device.name}</h4>
                  <p>{settingsModal.device.model}</p>
                  <span className="modal-device-brand">{settingsModal.device.brand}</span>
                </div>
              </div>
              <p className="modal-message">Reassign this device to another family member:</p>
              <select
                className="family-member-dropdown"
                value={settingsModal.newMember}
                onChange={e => setSettingsModal(s => ({ ...s, newMember: e.target.value }))}
              >
                <option value="">-- Choose Family Member --</option>
                {familyMembers.map((member, idx) => (
                  <option key={idx} value={member.mobile}>
                    {member.name} {member.self ? "(You)" : ""}
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
              <h3>Manage Default Device</h3>
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
                    {device.name} ({device.model}) - {getAssignedMemberName(device.assignedTo)}
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
    </div>
  );
};

export default Devices;
