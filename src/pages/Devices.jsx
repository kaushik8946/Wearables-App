import { useState, useEffect } from 'react';
import { MdSettings } from 'react-icons/md';
import { idbGet, idbGetJSON, idbSet, idbSetJSON, idbRemove } from '../data/db';
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
import PairDeviceModal from '../components/PairDeviceModal';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';

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
  // Default device state removed
  const [pairedDevices, setPairedDevices] = useState([]);
  const [defaultUserDeviceId, setDefaultUserDeviceId] = useState('');

  // Removed defaultDeviceId state

  const [availableDevices, setAvailableDevices] = useState(initialAvailableDevices);

  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  // User-related state removed

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [_, storedPairedDevices, currentUser, otherUsers] = await Promise.all([
          idbGet('defaultDeviceId'), // we will look up user mapping instead
          idbGetJSON('pairedDevices', []),
          idbGetJSON('currentUser', null),
          idbGetJSON('users', []),
        ]);
        if (!isMounted) return;
        const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
        setPairedDevices(randomizedPaired);
        // Compute default user's mapped device id
        const allUsers = [ ...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u })) ];
        const storedDefaultUserId = await idbGet('defaultUserId');
        if (storedDefaultUserId) {
          const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
          setDefaultUserDeviceId(defUser?.deviceId ? String(defUser.deviceId) : '');
        } else {
          setDefaultUserDeviceId('');
        }
        const pairedIds = storedPairedDevices.map(d => d.id);
        setAvailableDevices(initialAvailableDevices.filter(device => !pairedIds.includes(device.id)));
      } catch (err) {
        console.error('Failed to load device data from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Recompute default user's device mapping when paired devices change - helps keep UI up to date
  useEffect(() => {
    (async () => {
      try {
        const currentUser = await idbGetJSON('currentUser', null);
        const otherUsers = await idbGetJSON('users', []);
        const storedDefaultUserId = await idbGet('defaultUserId');
        const allUsers = [ ...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers.map(u => ({ ...u })) ];
        if (storedDefaultUserId) {
          const defUser = allUsers.find(u => String(u.id) === String(storedDefaultUserId));
          setDefaultUserDeviceId(defUser?.deviceId ? String(defUser.deviceId) : '');
        } else {
          setDefaultUserDeviceId('');
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [pairedDevices]);

  // Default device effect removed

  const handleDeviceClick = (device) => {
    // map images to local asset when opening the modal
    const mappedImage = deviceImageMap[device.image] || device.image;
    setSelectedDevice({ ...device, image: mappedImage });
    setShowModal(true);
  };

  const handlePairDevice = async (deviceOrNull) => {
    // Accept device argument from modal to support picking from list; fall back to selectedDevice
    const deviceToPair = deviceOrNull || selectedDevice;
    if (!deviceToPair) return;

    const pairedDevice = {
      ...deviceToPair,
      connectionStatus: 'connected',
      batteryLevel: getRandomBatteryLevel(),
      lastSync: new Date().toISOString()
    };

    const updatedPairedDevices = [...pairedDevices, pairedDevice];
    setPairedDevices(updatedPairedDevices);
    await idbSetJSON('pairedDevices', updatedPairedDevices);

    const updatedAvailableDevices = availableDevices.filter(d => d.id !== deviceToPair.id);
    setAvailableDevices(updatedAvailableDevices);

    setShowModal(false);
    setSelectedDevice(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
  };

  // User-related functions removed
  const handleSettings = (e, deviceId) => {
    e.stopPropagation();
    // No-op or could show a simple settings modal if needed
  };

  const handleRemoveDevice = async (deviceId) => {
    // Remove from paired, add back to available
    const device = pairedDevices.find(d => d.id === deviceId);
    if (!device) return;
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== deviceId);
    setPairedDevices(updatedPairedDevices);
    await idbSetJSON('pairedDevices', updatedPairedDevices);
    setAvailableDevices([...availableDevices, device]);
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
          {/* Default device button removed */}
        </div>

        <div className="section-title">Paired Devices</div>
        <div className="device-list">
          {pairedDevices.length === 0 ? (
            <div className="device-card empty">No paired devices</div>
          ) : (
            pairedDevices.map(device => (
              <div className="device-card" key={device.id} style={{ cursor: 'pointer' }}>
                <div className="device-content">
                  <div className="device-image-wrapper">
                    <img src={deviceImageMap[device.image] || device.image} alt={device.name} className="device-image" />
                  </div>
                  <div className="device-info">
                    <span className="device-name">
                      {device.name}
                    </span>
                    <span className="device-model">{device.model}</span>
                  </div>
                </div>
                <button
                  className="btn-unlink"
                  onClick={e => { e.stopPropagation(); handleRemoveDevice(device.id); }}
                  title="Unlink device"
                  style={{ fontWeight: 'bold' }}
                >
                  Unlink
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0 20px 0' }}>
          <button
            className="btn-pair-new"
            onClick={() => { setSelectedDevice(null); setShowModal(true); }}
            title="Pair new device"
          >
            Pair new device
          </button>
        </div>
      </div>

      {showModal && (
        <PairDeviceModal
          device={selectedDevice}
          availableDevices={availableDevices}
          onClose={handleCloseModal}
          onPair={handlePairDevice}
          onOpenDevice={(dev) => {
            // Map image to local asset then open detailed device preview inside modal
            const mappedImage = deviceImageMap[dev.image] || dev.image;
            setSelectedDevice({ ...dev, image: mappedImage });
          }}
        />
      )}
      {/* Settings Modal removed (user-related) */}
      {/* Default Device Modal removed */}
      
      {/* Assign User Modal removed */}
    </div>
  );
};

export default Devices;
