import React, { useState, useEffect } from 'react';
import { MdDelete } from 'react-icons/md';
import { getUserDevices, removeUserDevice, setUserDefaultDevice } from '../../service';
import './ManageDevicesModal.css';

const ManageDevicesModal = ({ userId, userName, onClose, onUpdate }) => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    loadDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadDevices = async () => {
    try {
      const userDevices = await getUserDevices(userId);
      setDevices(userDevices);
    } catch (err) {
      console.error('Failed to load user devices', err);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!window.confirm('Remove this device from user?')) return;
    
    try {
      await removeUserDevice(userId, deviceId);
      await loadDevices();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to remove device', err);
    }
  };

  const handleSetDefault = async (deviceId) => {
    try {
      await setUserDefaultDevice(userId, deviceId);
      await loadDevices();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to set default device', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content manage-devices-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Manage Devices for {userName}</h3>
            <p className="modal-subtitle">Manage devices assigned to this user</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>

        <div className="devices-list">
          {devices.length === 0 ? (
            <div className="empty-devices">
              <p>No devices assigned to this user</p>
            </div>
          ) : (
            devices.map((device) => (
              <div key={device.id} className="device-item">
                <div className="device-info">
                  <div className="device-name">{device.name}</div>
                  <div className="device-model">{device.model}</div>
                  {device.isDefault && <span className="default-badge">Default</span>}
                </div>
                <div className="device-actions">
                  {!device.isDefault && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleSetDefault(device.id)}
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    className="btn-delete-icon"
                    onClick={() => handleRemoveDevice(device.id)}
                    title="Remove device"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-buttons">
          <button className="btn-primary btn-submit" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageDevicesModal;
