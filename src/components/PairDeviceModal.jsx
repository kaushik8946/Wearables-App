import React, { useMemo } from 'react';
import '../styles/components/PairDeviceModal.css';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';

const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

const PairDeviceModal = ({ device, availableDevices = [], onClose, onPair, onOpenDevice }) => {
  // If no device provided, open in 'browse' mode where the user can choose among availableDevices
  const allAvailable = useMemo(() => availableDevices.map(d => ({ ...d, image: deviceImageMap[d.image] || d.image })), [availableDevices]);

  // If no device is selected and availableDevices is empty, we will still show modal
  return (
    <div className="pair-modal-overlay" onClick={onClose}>
      <div className="pair-modal-content" onClick={e => e.stopPropagation()}>
        <div className="pair-modal-header">
          <h3>Pair Device</h3>
          <button className="pair-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className={`pair-modal-body ${device ? 'pair-modal-two-column' : ''}`}>
          {allAvailable.length > 0 && !device && (
            <div className="pair-modal-available-list">
              {allAvailable.map(dev => (
                <div
                  key={dev.id}
                  className={`pair-device-item`}
                  onClick={() => {
                    // Ask parent to open the item in details mode so user can pair
                    onOpenDevice?.(dev);
                  }}
                >
                  <div className="pair-device-left">
                    <div className="pair-modal-device-image-wrapper">
                      <img src={dev.image} alt={dev.name} className="pair-modal-device-image" />
                    </div>
                  </div>
                  <div className="pair-device-meta">
                    <div className="pair-device-name">{dev.name}</div>
                    <div className="pair-device-model">{dev.model}</div>
                  </div>
                  </div>
                ))}
            </div>
          )}

          {allAvailable.length === 0 && !device && (
            <div className="pair-modal-empty" style={{ padding: 12 }}>
              <div style={{ fontSize: 14, color: '#333', fontWeight: 700 }}>No devices available</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>No devices were found to pair. You can try again later.</div>
            </div>
          )}

          {device && (
            <div className="pair-modal-device-preview">
              <div className="pair-modal-device-image-wrapper">
                <img src={device.image} alt={device.name} className="pair-modal-device-image" />
              </div>
              <div className="pair-modal-device-info">
                <h4>{device.name}</h4>
                <p>{device.model}</p>
                <span className="pair-modal-device-brand">{device.brand}</span>
              </div>
            </div>
          )}
        </div>

        <div className="pair-modal-footer">
          <button className="btn-pair" onClick={() => onPair(device)} disabled={!device}>Pair Device</button>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PairDeviceModal;
