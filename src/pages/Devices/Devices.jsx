import { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
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
      const devicesForActive = active ? await deviceService.getDevicesForUser(active.id) : [];
      const randomizedForActive = randomizeBatteryLevels(devicesForActive || []);
      setUserDevices(randomizedForActive);

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

      const updated = [...pairedDevices, pairDevice];
      await deviceService.setStorageJSON('pairedDevices', updated);
      deviceService.notifyPairedDevicesChange();

      setShowPairDeviceModal(false);

      await loadDevicesAndUsers();

      setSelectedDevice(pairDevice);
      setIsNewlyPaired(true);
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

                  return (
                    <div key={device.id} className="device-card">
                      <div className="device-card-left">
                        <img src={imageSrc} alt={device.name} className="device-card-image" />
                      </div>

                      <div className="device-card-meta">
                        <div className="device-card-name">{device.name}</div>
                        <div className="device-card-model">{device.model}</div>

                        <div className="device-card-user">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {assignedUser ? null : (
                              <span className="unassigned-label">Unpaired</span>
                            )}

                            {/* show Default tag if this device is the active user's default */}
                            {activeUser && String(activeUser.defaultDevice) === String(device.id) && (
                              <span style={{ marginLeft: 6, padding: '2px 8px', background: '#667eea', color: 'white', fontSize: 12, borderRadius: 8 }}>Default</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="device-card-actions">
                        <button
                          className="device-edit-btn"
                          onClick={() => handleOpenReassignModal(device)}
                          title="Pair device"
                          aria-label="Pair device"
                        >
                          <MdEdit size={18} />
                        </button>

                        <button
                          className="device-unpair-btn"
                          onClick={() => handleRemoveDevice(device)}
                          title="Unpair device"
                          aria-label="Unpair device"
                        >
                          <MdDelete size={16} />
                        </button>
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
          <div className="devices-menu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="devices-menu-modal-header">
              <h3>Change default device</h3>
              <button className="devices-menu-modal-close" onClick={() => setShowChangeDefaultModal(false)}>✕</button>
            </div>
            <div style={{ padding: '8px 0 16px 0' }}>
              <p style={{ margin: 0, color: '#64748b' }}>Select a device to become the default for {activeUser.name}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {userDevices.map(d => (
                <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, border: '1px solid #e6e7ea', cursor: 'pointer' }}>
                  <input type="radio" name="defaultDevice" value={d.id} checked={String(selectedDefaultDeviceId) === String(d.id)} onChange={() => setSelectedDefaultDeviceId(String(d.id))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={d.image} alt={d.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{d.model}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="modal-buttons" style={{ marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setShowChangeDefaultModal(false)}>Cancel</button>
              <button className="btn-primary btn-submit" onClick={handleSaveDefault} disabled={!selectedDefaultDeviceId}>Save</button>
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
    </div>
  );
};

export default Devices;
