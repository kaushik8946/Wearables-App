import { useState, useEffect } from 'react';
import { MdEdit } from 'react-icons/md';
import * as deviceService from '../../service';
import './Devices.css';
import ReassignDeviceModal from '../../common/ReassignDeviceModal/ReassignDeviceModal';
import DevicesMenu from '../../common/DevicesMenu/DevicesMenu';
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
  const [showPairDeviceModal, setShowPairDeviceModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);

  const loadDevicesAndUsers = async () => {
    try {
      const storedPairedDevices = await deviceService.getStorageJSON('pairedDevices', []);
      const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
      setPairedDevices(randomizedPaired);

      // Load users
      const allUsers = await deviceService.getAllUsers();
      setUsers(allUsers);

      // Build device-to-user mapping in parallel
      const userMapEntries = await Promise.all(
        randomizedPaired.map(async (device) => {
          const user = await deviceService.getUserForDevice(device.id);
          return [device.id, user];
        })
      );
      
      const userMap = Object.fromEntries(
        userMapEntries.filter(([, user]) => user !== null)
      );
      setDeviceUserMap(userMap);

      // Load available devices (not yet paired)
      const allAvailableDevices = deviceService.getAvailableDevices();
      const pairedIds = new Set(randomizedPaired.map(d => String(d.id)));
      const unpaired = allAvailableDevices.filter(d => !pairedIds.has(String(d.id)));
      setAvailableDevices(unpaired);
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
    const unsubscribeDevices = deviceService.subscribeToPairedDevicesChange(() => {
      loadDevicesAndUsers();
    });
    const unsubscribeUsers = deviceService.subscribeToUserChange(() => {
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
    await deviceService.unassignDevice(device.id);

    // Then remove from paired devices
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await deviceService.setStorageJSON('pairedDevices', updatedPairedDevices);
    deviceService.notifyPairedDevicesChange();
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
    await deviceService.reassignDevice(deviceId, newUserId);
    await loadDevicesAndUsers();
  };

  const handleUnassign = async (deviceId) => {
    await deviceService.unassignDevice(deviceId);
    await loadDevicesAndUsers();
  };

  const handlePairNewDevice = async (device) => {
    try {
      // Map the device image
      const mappedImage = deviceImageMap[device.image] || device.image;
      const pairDevice = {
        ...device,
        image: mappedImage,
        connectionStatus: 'connected',
        batteryLevel: 70,
        lastSync: new Date().toISOString()
      };
      
      // Add to paired devices
      const updated = [...pairedDevices, pairDevice];
      await deviceService.setStorageJSON('pairedDevices', updated);
      deviceService.notifyPairedDevicesChange();
      
      // Close the pairing modal
      setShowPairDeviceModal(false);
      
      // Refresh the list
      await loadDevicesAndUsers();
      
      // Show assignment modal for the newly paired device
      setSelectedDevice(pairDevice);
      setShowReassignModal(true);
    } catch (err) {
      console.error('Failed to pair device', err);
    }
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
          <button
            className="btn-primary"
            style={{ 
              padding: '10px 20px',
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={() => setShowPairDeviceModal(true)}
          >
            + Pair New Device
          </button>
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

      {showPairDeviceModal && (
        <div 
          className="devices-menu-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowPairDeviceModal(false)}
        >
          <div 
            className="devices-menu-modal" 
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0 }}>Pair New Device</h3>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setShowPairDeviceModal(false)}
              >
                ✕
              </button>
            </div>
            <DevicesMenu
              pairedDevices={[]}
              availableDevices={availableDevices}
              onPairDevice={handlePairNewDevice}
              onCardClick={handlePairNewDevice}
              showPairedSection={false}
              showAvailableSection={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;

