import { useState, useEffect } from 'react';
import { MdEdit } from 'react-icons/md';
import { getStorageJSON, setStorageJSON, notifyPairedDevicesChange, subscribeToPairedDevicesChange, subscribeToUserChange, getAllUsers, getUserForDevice, reassignDevice, unassignDevice } from '../../service';
import './Devices.css';
import ReassignDeviceModal from '../../common/ReassignDeviceModal/ReassignDeviceModal';
import watchImg from '../../assets/images/watch.png';
import ringImg from '../../assets/images/ring.webp';
import scaleImg from '../../assets/images/weighing-scale.avif';

const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

const getRandomBatteryLevel = () => Math.floor(Math.random() * 100) + 1;
const randomizeBatteryLevels = (devices) =>
  devices.map(device => ({
    ...device,
    batteryLevel: getRandomBatteryLevel()
  }));

const Devices = () => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [deviceUserMap, setDeviceUserMap] = useState({});
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const loadDevicesAndUsers = async () => {
    try {
      const storedPairedDevices = await getStorageJSON('pairedDevices', []);
      const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
      setPairedDevices(randomizedPaired);

      // Load users
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      // Build device-to-user mapping
      const userMap = {};
      for (const device of randomizedPaired) {
        const user = await getUserForDevice(device.id);
        if (user) {
          userMap[device.id] = user;
        }
      }
      setDeviceUserMap(userMap);
    } catch (err) {
      console.error('Failed to load device data from IndexedDB', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadDevicesAndUsers();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to changes
  useEffect(() => {
    const unsubscribeDevices = subscribeToPairedDevicesChange(() => {
      loadDevicesAndUsers();
    });
    const unsubscribeUsers = subscribeToUserChange(() => {
      loadDevicesAndUsers();
    });
    return () => {
      unsubscribeDevices();
      unsubscribeUsers();
    };
  }, []);

  const handleRemoveDevice = async (device) => {
    if (!device) return;
    if (!window.confirm(`Unpair ${device.name}?`)) return;

    // First unassign from users
    await unassignDevice(device.id);

    // Then remove from paired devices
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await setStorageJSON('pairedDevices', updatedPairedDevices);
    notifyPairedDevicesChange();
  };

  const handleOpenReassignModal = (device) => {
    setSelectedDevice(device);
    setShowReassignModal(true);
  };

  const handleCloseReassignModal = () => {
    setShowReassignModal(false);
    setSelectedDevice(null);
  };

  const handleReassign = async (deviceId, newUserId) => {
    await reassignDevice(deviceId, newUserId);
    await loadDevicesAndUsers();
  };

  const handleUnassign = async (deviceId) => {
    await unassignDevice(deviceId);
    await loadDevicesAndUsers();
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
        </div>

        <div className="devices-section">
          <div className="devices-section-title">Paired Devices</div>
          {pairedDevices.length === 0 ? (
            <div className="devices-empty">No paired devices</div>
          ) : (
            <div className="devices-list">
              {pairedDevices.map(device => {
                const assignedUser = deviceUserMap[device.id];
                const imageSrc = deviceImageMap[device.image] || device.image;
                
                return (
                  <div key={device.id} className="device-card">
                    <div className="device-card-left">
                      <img src={imageSrc} alt={device.name} className="device-card-image" />
                    </div>
                    <div className="device-card-meta">
                      <div className="device-card-name">{device.name}</div>
                      <div className="device-card-model">{device.model}</div>
                      <div className="device-card-user">
                        {assignedUser ? (
                          <span className="assigned-user">
                            👤 {assignedUser.name || 'Unnamed'}
                          </span>
                        ) : (
                          <span className="unassigned-label">Unassigned</span>
                        )}
                      </div>
                    </div>
                    <div className="device-card-actions">
                      <button
                        className="device-edit-btn"
                        onClick={() => handleOpenReassignModal(device)}
                        title="Reassign device"
                        aria-label="Reassign device"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button 
                        className="device-unpair-btn" 
                        onClick={() => handleRemoveDevice(device)}
                      >
                        Unpair
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showReassignModal && selectedDevice && (
        <ReassignDeviceModal
          device={selectedDevice}
          currentUserId={deviceUserMap[selectedDevice.id]?.id}
          users={users}
          onReassign={handleReassign}
          onUnassign={handleUnassign}
          onClose={handleCloseReassignModal}
        />
      )}
    </div>
  );
};

export default Devices;

