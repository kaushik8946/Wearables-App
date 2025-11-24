import { useState, useEffect } from 'react';
import { MdEdit } from 'react-icons/md';
import { getStorageJSON, setStorageJSON, notifyPairedDevicesChange, getDeviceOwner, getAllUsers, reassignDevice, notifyUserChange } from '../../service';
import './Devices.css';
import DevicesMenu from '../../common/DevicesMenu/DevicesMenu';

const getRandomBatteryLevel = () => Math.floor(Math.random() * 100) + 1;
const randomizeBatteryLevels = (devices) =>
  devices.map(device => ({
    ...device,
    batteryLevel: getRandomBatteryLevel()
  }));

const Devices = () => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [deviceOwners, setDeviceOwners] = useState({});
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [reassignToUserId, setReassignToUserId] = useState('');

  const loadData = async () => {
    try {
      const storedPairedDevices = await getStorageJSON('pairedDevices', []);
      const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
      setPairedDevices(randomizedPaired);

      // Get device owners
      const owners = {};
      for (const device of randomizedPaired) {
        const ownerId = await getDeviceOwner(device.id);
        if (ownerId) {
          owners[device.id] = ownerId;
        }
      }
      setDeviceOwners(owners);

      // Get all users
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load device data from IndexedDB', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedPairedDevices = await getStorageJSON('pairedDevices', []);
        const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
        setPairedDevices(randomizedPaired);

        // Get device owners
        const owners = {};
        for (const device of randomizedPaired) {
          const ownerId = await getDeviceOwner(device.id);
          if (ownerId) {
            owners[device.id] = ownerId;
          }
        }
        setDeviceOwners(owners);

        // Get all users
        const users = await getAllUsers();
        setAllUsers(users);
      } catch (err) {
        console.error('Failed to load device data from IndexedDB', err);
      }
    };
    
    loadInitialData();
  }, []);

  const handleRemoveDevice = async (device) => {
    if (!device) return;
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await setStorageJSON('pairedDevices', updatedPairedDevices);
    notifyPairedDevicesChange();
    await loadData();
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setReassignToUserId('');
    setShowReassignModal(true);
  };

  const handleReassign = async () => {
    if (!selectedDevice || !reassignToUserId) return;

    try {
      await reassignDevice(selectedDevice.id, reassignToUserId);
      notifyUserChange();
      setShowReassignModal(false);
      setSelectedDevice(null);
      setReassignToUserId('');
      await loadData();
    } catch (err) {
      console.error('Failed to reassign device', err);
      alert('Failed to reassign device');
    }
  };

  const getUserName = (userId) => {
    const user = allUsers.find(u => String(u.id) === String(userId));
    return user ? user.name : 'Unknown User';
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
        </div>

        {/* Custom Device List with Owner Info */}
        <div className="custom-devices-list">
          {pairedDevices.length === 0 ? (
            <div className="empty-state">
              <p>No paired devices</p>
            </div>
          ) : (
            pairedDevices.map((device) => (
              <div key={device.id} className="custom-device-card">
                <img src={device.image} alt={device.name} className="device-card-image" />
                <div className="device-card-info">
                  <div className="device-card-name">{device.name}</div>
                  <div className="device-card-model">{device.model}</div>
                  {deviceOwners[device.id] && (
                    <div className="device-card-owner">
                      Assigned to: {getUserName(deviceOwners[device.id])}
                    </div>
                  )}
                </div>
                <div className="device-card-actions">
                  <button
                    className="device-edit-btn"
                    onClick={() => handleEditDevice(device)}
                    title="Reassign device"
                  >
                    <MdEdit size={20} />
                  </button>
                  <button
                    className="device-unpair-btn"
                    onClick={() => handleRemoveDevice(device)}
                  >
                    Unpair
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reassign Device Modal */}
      {showReassignModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => setShowReassignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h3>Reassign Device</h3>
                <p className="modal-subtitle">Assign {selectedDevice.name} to a different user</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReassignModal(false)}>
                X
              </button>
            </div>
            <div className="form-group">
              <label>Select User</label>
              <select
                className="form-input"
                value={reassignToUserId}
                onChange={(e) => setReassignToUserId(e.target.value)}
              >
                <option value="">-- Select User --</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || 'Unnamed User'}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-primary btn-submit"
                onClick={handleReassign}
                disabled={!reassignToUserId}
              >
                Reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
