import { useState, useEffect } from 'react';
import { getStorageJSON, setStorageJSON, notifyPairedDevicesChange } from '../../service';
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

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const storedPairedDevices = await getStorageJSON('pairedDevices', []);
        if (!isMounted) return;
        const randomizedPaired = randomizeBatteryLevels(storedPairedDevices);
        setPairedDevices(randomizedPaired);
      } catch (err) {
        console.error('Failed to load device data from IndexedDB', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemoveDevice = async (device) => {
    if (!device) return;
    const updatedPairedDevices = pairedDevices.filter(d => d.id !== device.id);
    setPairedDevices(updatedPairedDevices);
    await setStorageJSON('pairedDevices', updatedPairedDevices);
    notifyPairedDevicesChange();
  };

  return (
    <div className="devices-container">
      <div className="devices-ui">
        <div className="devices-header">
          <h1>Devices</h1>
        </div>

        <DevicesMenu
          pairedDevices={pairedDevices}
          onUnpairDevice={handleRemoveDevice}
          showAvailableSection={false}
        />
      </div>
    </div>
  );
};

export default Devices;
