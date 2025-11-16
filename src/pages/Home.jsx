import { useState } from 'react';
import '../styles/Home.css';
import { availableDevices as initialAvailable, mockDevices as initialPaired, getDeviceTypeIcon, getSignalStrengthText, getSignalStrengthColor } from '../data/mockData';

const Home = () => {
  const [pairedDevices, setPairedDevices] = useState(initialPaired);
  const [availableDevices, setAvailableDevices] = useState(initialAvailable);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    setShowModal(true);
  };

  const handlePairDevice = () => {
    if (selectedDevice) {
      // Add device to paired list with battery level
      const pairedDevice = {
        ...selectedDevice,
        connectionStatus: 'connected',
        batteryLevel: Math.floor(Math.random() * 30) + 70, // Random battery 70-100%
        lastSync: new Date().toISOString()
      };

      setPairedDevices([...pairedDevices, pairedDevice]);
      
      // Remove from available devices
      setAvailableDevices(availableDevices.filter(d => d.id !== selectedDevice.id));
      
      // Close modal
      setShowModal(false);
      setSelectedDevice(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDevice(null);
  };

  return (
    <div className="home-container">
      <div className="bluetooth-ui">
        {/* Simple Header */}
        <div className="page-header">
          <h1>Devices</h1>
        </div>

        {/* Info Section */}
        <div className="bluetooth-info">
          Make sure the device you want to connect to is in pairing mode. Your phone is currently visible to nearby devices.
        </div>

        {/* Paired Devices Section */}
        <div className="section-title">Paired Devices</div>
        <div className="device-list">
          {pairedDevices.length === 0 ? (
            <div className="device-card empty">No paired devices</div>
          ) : (
            pairedDevices.map(device => (
              <div className="device-card" key={device.id}>
                <div className="device-content">
                  <span className="device-icon">{getDeviceTypeIcon(device.deviceType)}</span>
                  <div className="device-info">
                    <span className="device-name">{device.name}</span>
                    <span className="device-model">{device.model}</span>
                  </div>
                </div>
                <span className="device-settings">⚙️</span>
              </div>
            ))
          )}
        </div>

        {/* Available Devices Section */}
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
                  <span className="device-icon">{getDeviceTypeIcon(device.deviceType)}</span>
                  <div className="device-info">
                    <span className="device-name">{device.name}</span>
                    <span className="device-model">{device.model}</span>
                  </div>
                </div>
                <div className="device-details">
                  <span className="device-signal">
                    <span 
                      className="signal-indicator" 
                      style={{ background: getSignalStrengthColor(device.signalStrength) }}
                    ></span>
                    {getSignalStrengthText(device.signalStrength)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pairing Confirmation Modal */}
      {showModal && selectedDevice && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pair Device</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-device-preview">
                <span className="modal-device-icon">{getDeviceTypeIcon(selectedDevice.deviceType)}</span>
                <div className="modal-device-info">
                  <h4>{selectedDevice.name}</h4>
                  <p>{selectedDevice.model}</p>
                  <span className="modal-device-brand">{selectedDevice.brand}</span>
                </div>
              </div>

              <p className="modal-message">
                Do you want to pair with this device? Make sure the device is in pairing mode and nearby.
              </p>

              <div className="device-features">
                <p className="features-title">Features:</p>
                <div className="features-list">
                  {selectedDevice.features.map((feature, index) => (
                    <span key={index} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn-pair" onClick={handlePairDevice}>
                Pair Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
