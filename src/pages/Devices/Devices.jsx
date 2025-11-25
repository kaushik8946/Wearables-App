import { useState, useEffect } from 'react';
import { MdEdit, MdDelete, MdRefresh, MdLinkOff } from 'react-icons/md';
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
  const [activeUser, setActiveUser] = useState(null);
  const [userDevices, setUserDevices] = useState([]);
  const [deviceUserMap, setDeviceUserMap] = useState({});
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isNewlyPaired, setIsNewlyPaired] = useState(false);
  const [showChangeDefaultModal, setShowChangeDefaultModal] = useState(false);
  const [selectedDefaultDeviceId, setSelectedDefaultDeviceId] = useState(null);
  const [showPairDeviceModal, setShowPairDeviceModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showReconnectWarning, setShowReconnectWarning] = useState(false);
  const [reconnectDevice, setReconnectDevice] = useState(null);

  const loadDevicesAndUsers = async () => {
    try {
      const storedPairedDevices = await deviceService.getStorageJSON('pairedDevices', []);
      const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
      setPairedDevices(randomizedPaired);

      const allUsers = await deviceService.getAllUsers();
      setUsers(allUsers);

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

      const active = await deviceService.getActiveUser();
      setActiveUser(active);
      
      // Get devices with status (including offline/historical devices)
      // Use getCurrentAndHistoricalDevicesForUser to show both current and historical devices
      const devicesWithStatus = active ? await deviceService.getCurrentAndHistoricalDevicesForUser(active.id) : [];
      const randomizedForActive = randomizeBatteryLevels(devicesWithStatus || []);
      setUserDevices(randomizedForActive);

      // Get ALL available devices with ownership info for nearby devices list
      // and filter out devices that are already paired to the current (active) user
      const allDevicesWithOwnership = await deviceService.getAllAvailableDevicesWithOwnership();
      const filteredNearby = active
        ? allDevicesWithOwnership.filter(d => String(d.ownerId) !== String(active.id))
        : allDevicesWithOwnership;
      setAvailableDevices(filteredNearby);
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

    await deviceService.unassignDevice(device.id);

    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await deviceService.setStorageJSON('pairedDevices', updatedPairedDevices);
    deviceService.notifyPairedDevicesChange();
  };

  // Unlink device from user (device stays in app but not assigned)
  const handleUnlinkDevice = async (device) => {
    if (!device) return;
    if (!window.confirm(`Unlink ${device.name} from its user? The device will remain in the app but not assigned to anyone.`)) return;

    try {
      const result = await deviceService.unlinkDeviceFromUser(device.id, deviceUserMap[device.id]?.id);
      if (result.success) {
        await loadDevicesAndUsers();
      }
    } catch (err) {
      console.error('Failed to unlink device', err);
    }
  };

  // Delete device completely from the app
  const handleDeleteDevice = async (device) => {
    if (!device) return;
    if (!window.confirm(`Delete ${device.name} from the app? This will remove it from all users and the paired devices list. The device will only appear in Nearby Devices when scanning.`)) return;

    try {
      const result = await deviceService.deleteDevice(device.id);
      if (result.success) {
        await loadDevicesAndUsers();
      }
    } catch (err) {
      console.error('Failed to delete device', err);
    }
  };

  const handleOpenReassignModal = (device) => {
    setSelectedDevice(device);
    setShowReassignModal(true);
  };

  const handleOpenChangeDefault = () => {
    // preselect current default for active user (if available)
    setSelectedDefaultDeviceId(activeUser?.defaultDevice || '');
    setShowChangeDefaultModal(true);
  };

  const handleSaveDefault = async () => {
    if (!activeUser) return;
    try {
      await deviceService.setDefaultDeviceForUser(activeUser.id, selectedDefaultDeviceId);
      setShowChangeDefaultModal(false);
      // reload lists to reflect new default
      await loadDevicesAndUsers();
    } catch (err) {
      console.error('Failed to set default device', err);
      alert('Failed to change default device');
    }
  };

  const handleCloseReassignModal = () => {
    setShowReassignModal(false);
    setSelectedDevice(null);
    setIsNewlyPaired(false);
  };

  const handleCancelDuringPair = async (deviceId) => {
    try {
      const updated = pairedDevices.filter(d => String(d.id) !== String(deviceId));
      await deviceService.setStorageJSON('pairedDevices', updated);
      deviceService.notifyPairedDevicesChange();

      setShowReassignModal(false);
      setSelectedDevice(null);
      setIsNewlyPaired(false);

      await loadDevicesAndUsers();
    } catch (err) {
      console.error('Failed to cancel pairing and remove device', err);
    }
  };

  const handleReassign = async (deviceId, newUserId) => {
    await deviceService.reassignDevice(deviceId, newUserId);
    await loadDevicesAndUsers();
  };

  const handleUnassign = async (deviceId) => {
    await deviceService.unassignDevice(deviceId);
    await loadDevicesAndUsers();
  };

  // Handle reconnect button click
  const handleReconnectClick = (device) => {
    // If device is owned by another user, show warning
    if (device.isOwnedByOther && device.currentOwnerName) {
      setReconnectDevice(device);
      setShowReconnectWarning(true);
    } else {
      // Device is not owned by anyone else, reconnect directly
      handleReconnectConfirm(device);
    }
  };

  // Confirm reconnect - transfer ownership
  const handleReconnectConfirm = async (device) => {
    const deviceToReconnect = device || reconnectDevice;
    if (!deviceToReconnect || !activeUser) return;
    
    try {
      await deviceService.transferDeviceOwnership(deviceToReconnect.id, activeUser.id);
      setShowReconnectWarning(false);
      setReconnectDevice(null);
      await loadDevicesAndUsers();
    } catch (err) {
      console.error('Failed to reconnect device', err);
    }
  };

  // Cancel reconnect
  const handleReconnectCancel = () => {
    setShowReconnectWarning(false);
    setReconnectDevice(null);
  };

  const handlePairNewDevice = async (device) => {
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

      // If the device is already owned/paired by another user, automatically transfer
      // ownership to the currently active user and skip the reassign modal.
      // This makes pairing a device that's already paired to someone else behave as
      // a direct reconnect to the active user.
      if (device.isOwnedByOther && activeUser) {
        try {
          await deviceService.transferDeviceOwnership(device.id, activeUser.id);
        } catch (err) {
          // don't block pairing on transfer failure; log and continue
          console.error('Failed to transfer ownership while pairing device', err);
        }
      }
      
      await deviceService.setStorageJSON('pairedDevices', updated);
      deviceService.notifyPairedDevicesChange();

      setShowPairDeviceModal(false);

      await loadDevicesAndUsers();

      // If this is a brand-new pairing and the device isn't owned by someone else,
      // open the reassign modal so the user can pick an owner. If the device was
      // previously owned by someone else we already transferred ownership above
      // and skip the modal (pair directly to the active user).
      if (!device.isOwnedByOther) {
        setSelectedDevice(pairDevice);
        setIsNewlyPaired(true);
        setShowReassignModal(true);
      }
    } catch (err) {
      console.error('Failed to pair device', err);
    }
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">

        <div className="devices-header">
          <h1>Devices</h1>
        </div>

        {/* action buttons moved into a dedicated block below the heading */}
        <div className="devices-actions">
          <button
            className="btn-pair-new"
            onClick={() => setShowPairDeviceModal(true)}
            title="Pair new device"
            aria-label="Pair new device"
          >
            + Pair New Device
          </button>

          {activeUser && userDevices.length > 0 && (
            <button
              className="btn-manage-default"
              onClick={handleOpenChangeDefault}
            >
              Change default device
            </button>
          )}
        </div>

        {activeUser && userDevices.length === 0 && !showPairDeviceModal ? (
          <div style={{
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
                no devices paired for: {activeUser.name}
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
                onClick={() => setShowPairDeviceModal(true)}
              >
                Pair device
              </button>
            </div>
          </div>
        ) : (
          <div className="devices-section">
            <div className="devices-section-title">Available Devices</div>

            {((activeUser ? userDevices : pairedDevices).length === 0) ? (
              <div className="devices-empty">No available devices</div>
            ) : (
              <div className="devices-list">
                {(activeUser ? userDevices : pairedDevices).map(device => {
                  const assignedUser = deviceUserMap[device.id];
                  const imageSrc = deviceImageMap[device.image] || device.image;
                  // isOffline is set by the service layer when device is owned by another user
                  const isOffline = device.isOffline;

                  return (
                    <div key={device.id} className={`device-card ${isOffline ? 'device-card-offline' : ''}`}>
                      <div className="device-card-left">
                        <img src={imageSrc} alt={device.name} className="device-card-image" />
                      </div>

                      <div className="device-card-meta">
                        <div className="device-card-name">{device.name}</div>
                        <div className="device-card-model">{device.model}</div>

                        <div className="device-card-user">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {/* Show offline status when device is owned by another user */}
                            {isOffline && (
                              <span className="offline-label">Offline</span>
                            )}
                            
                            {/* Show current owner if device is owned by another user */}
                            {isOffline && device.currentOwnerName && (
                              <span className="current-owner-label">
                                Now with: {device.currentOwnerName}
                              </span>
                            )}

                            {!isOffline && !assignedUser && (
                              <span className="unassigned-label">Unpaired</span>
                            )}

                            {/* show Default tag if this device is the active user's default and not offline */}
                            {!isOffline && activeUser && String(activeUser.defaultDevice) === String(device.id) && (
                              <span style={{ marginLeft: 6, padding: '2px 8px', background: '#667eea', color: 'white', fontSize: 12, borderRadius: 8 }}>Default</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="device-card-actions">
                        {/* Show reconnect button for offline devices */}
                        {isOffline ? (
                          <button
                            className="device-reconnect-btn"
                            onClick={() => handleReconnectClick(device)}
                            title="Reconnect device"
                            aria-label="Reconnect device"
                          >
                            <MdRefresh size={18} />
                          </button>
                        ) : (
                          <>
                            {/* Only show edit button for paired devices (assigned to a user) */}
                            {assignedUser && (
                              <button
                                className="device-edit-btn"
                                onClick={() => handleOpenReassignModal(device)}
                                title="Reassign device"
                                aria-label="Reassign device"
                              >
                                <MdEdit size={18} />
                              </button>
                            )}

                            {/* Show unlink button for paired devices (assigned to a user) */}
                            {assignedUser && (
                              <button
                                className="device-unlink-btn"
                                onClick={() => handleUnlinkDevice(device)}
                                title="Unlink device from user"
                                aria-label="Unlink device from user"
                                style={{
                                  background: 'rgba(249, 115, 22, 0.1)',
                                  color: '#f97316',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <MdLinkOff size={18} />
                              </button>
                            )}

                            {/* Show delete button for all devices */}
                            <button
                              className="device-delete-btn"
                              onClick={() => handleDeleteDevice(device)}
                              title="Delete device from app"
                              aria-label="Delete device from app"
                            >
                              <MdDelete size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {showReassignModal && selectedDevice && (
        <ReassignDeviceModal
          device={selectedDevice}
          currentUserId={deviceUserMap[selectedDevice.id]?.id}
          users={users}
          onReassign={handleReassign}
          onUnassign={handleUnassign}
          onClose={handleCloseReassignModal}
          requireAssignment={isNewlyPaired}
          onCancelDuringPair={handleCancelDuringPair}
        />
      )}

      {showChangeDefaultModal && activeUser && (
        <div className="devices-menu-overlay" onClick={() => setShowChangeDefaultModal(false)}>
          <div className="devices-menu-modal" role="dialog" aria-modal="true" aria-labelledby="change-default-title" onClick={(e) => e.stopPropagation()}>
            <div className="devices-menu-modal-header">
              <h3 id="change-default-title">Change default device</h3>
              <button className="devices-menu-modal-close" aria-label="close" onClick={() => setShowChangeDefaultModal(false)}>✕</button>
            </div>

            <div className="devices-menu-modal-body">
              <p style={{ margin: 0, color: '#64748b' }}>Select a device to become the default for <strong style={{ color: '#0f172a' }}>{activeUser.name}</strong></p>

              <div className="default-device-list">
                {userDevices.map(d => (
                  <label
                    key={d.id}
                    className="default-device-item"
                    onClick={() => setSelectedDefaultDeviceId(String(d.id))}
                    aria-label={`Select ${d.name} as default`}
                  >
                    <input
                      type="radio"
                      name="defaultDevice"
                      value={d.id}
                      checked={String(selectedDefaultDeviceId) === String(d.id)}
                      onChange={() => setSelectedDefaultDeviceId(String(d.id))}
                    />

                    <div className="device-preview">
                      <img src={d.image} alt={d.name} />
                      <div className="device-meta">
                        <div className="device-name">{d.name}</div>
                        <div className="device-model">{d.model}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="devices-menu-modal-footer">
                <button className="btn-secondary" onClick={() => setShowChangeDefaultModal(false)}>Cancel</button>
                <button className="btn-primary btn-submit" onClick={handleSaveDefault} disabled={!selectedDefaultDeviceId}>Save</button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Reconnect Warning Dialog */}
      {showReconnectWarning && reconnectDevice && (
        <div className="reconnect-warning-overlay">
          <div className="reconnect-warning-dialog">
            <div className="reconnect-warning-icon">⚠️</div>
            <h4 className="reconnect-warning-title">Device Already Paired</h4>
            <p className="reconnect-warning-message">
              This device is already paired to <strong>{reconnectDevice.currentOwnerName}</strong>, your pairing will unpair it from them.
            </p>
            <div className="reconnect-warning-buttons">
              <button 
                className="reconnect-warning-btn reconnect-warning-btn-cancel"
                onClick={handleReconnectCancel}
              >
                Cancel
              </button>
              <button 
                className="reconnect-warning-btn reconnect-warning-btn-confirm"
                onClick={() => handleReconnectConfirm()}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devices;
