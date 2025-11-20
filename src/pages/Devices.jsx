import { useState, useEffect } from 'react';
import { idbGetJSON, idbSetJSON } from '../data/db';
import '../styles/pages/Devices.css';
import { availableDevices as initialAvailableDevices } from '../data/mockData';
import DevicesMenu from '../components/DevicesMenu';
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

const deriveAvailableDevices = (paired) => {
  const pairedIds = paired.map(device => device.id);
  return initialAvailableDevices.filter(device => !pairedIds.includes(device.id));
};

const Devices = () => {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [availableDevices, setAvailableDevices] = useState(initialAvailableDevices);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedPairedDevices = await idbGetJSON('pairedDevices', []);
        if (!isMounted) return;
        const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
        setPairedDevices(randomizedPaired);
        setAvailableDevices(deriveAvailableDevices(randomizedPaired));
      } catch (err) {
        console.error('Failed to load device data from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Default device effect removed

  const handlePairDevice = async (device) => {
    if (!device) return;
    const mappedImage = deviceImageMap[device.image] || device.image;
    const pairedDevice = {
      ...device,
      image: mappedImage,
      connectionStatus: 'connected',
      batteryLevel: getRandomBatteryLevel(),
      lastSync: new Date().toISOString()
    };

    const updatedPairedDevices = [...pairedDevices, pairedDevice];
    setPairedDevices(updatedPairedDevices);
    await idbSetJSON('pairedDevices', updatedPairedDevices);
    setAvailableDevices(deriveAvailableDevices(updatedPairedDevices));
  };

  const handleRemoveDevice = async (device) => {
    if (!device) return;
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await idbSetJSON('pairedDevices', updatedPairedDevices);
    setAvailableDevices(deriveAvailableDevices(updatedPairedDevices));
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
        </div>

        <DevicesMenu
          variant="page"
          pairedDevices={pairedDevices}
          availableDevices={availableDevices}
          onPairDevice={handlePairDevice}
          onUnpairDevice={handleRemoveDevice}
          isCloseButtonRequired={false}
        />
      </div>
    </div>
  );
};

export default Devices;
