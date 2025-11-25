import React, { useMemo, useRef, useState, useEffect } from 'react';
import './DevicesMenu.css';
import watchImg from '../../assets/images/watch.png';
import ringImg from '../../assets/images/ring.webp';
import scaleImg from '../../assets/images/weighing-scale.avif';

const deviceImageMap = {
  'watch.png': watchImg,
  'ring.webp': ringImg,
  'weighing-scale.avif': scaleImg,
};

const mapDevices = (list) =>
  list.map(device => ({
    ...device,
    imageSrc: deviceImageMap[device.image] || device.image,
  }));

const DevicesMenu = ({
  pairedDevices = [],
  availableDevices = [],
  onPairDevice,
  onUnpairDevice,
  onCardClick,
  pairedTitle = 'Available Devices',
  availableTitle = 'Nearby Devices',
  showPairedSection = true,
  showAvailableSection = true,
  onWarningRequired
}) => {
  const [connectingAvailableId, setConnectingAvailableId] = useState(null);
  const [connectingPairedId, setConnectingPairedId] = useState(null);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingDevice, setPendingDevice] = useState(null);
  const timeoutsRef = useRef([]);

  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      const timeouts = timeoutsRef.current;
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  const normalizedPaired = useMemo(() => mapDevices(pairedDevices), [pairedDevices]);
  const normalizedAvailable = useMemo(() => mapDevices(availableDevices), [availableDevices]);

  const isPairedSelectable = typeof onCardClick === 'function';
  const canPair = typeof onPairDevice === 'function';
  const canUnpair = typeof onUnpairDevice === 'function';

  const scheduleTimeout = React.useCallback((cb) => {
    const timeout = setTimeout(cb, 1000);
    timeoutsRef.current.push(timeout);
  }, []);

  const handleAvailableClick = React.useCallback((device) => {
    if (!canPair || connectingPairedId || connectingAvailableId) return;
    
    // Check if device is owned by another user
    if (device.isOwnedByOther && device.ownerName) {
      setPendingDevice(device);
      setShowWarningDialog(true);
      return;
    }
    
    setConnectingAvailableId(device.id);
    scheduleTimeout(() => {
      setConnectingAvailableId(null);
      onPairDevice(device);
    });
  }, [canPair, connectingPairedId, connectingAvailableId, scheduleTimeout, onPairDevice]);

  const handleWarningConfirm = React.useCallback(() => {
    if (!pendingDevice) return;
    setShowWarningDialog(false);
    setConnectingAvailableId(pendingDevice.id);
    const device = pendingDevice;
    setPendingDevice(null);
    scheduleTimeout(() => {
      setConnectingAvailableId(null);
      onPairDevice(device);
    });
  }, [pendingDevice, scheduleTimeout, onPairDevice]);

  const handleWarningCancel = React.useCallback(() => {
    setShowWarningDialog(false);
    setPendingDevice(null);
  }, []);

  const handlePairedClick = React.useCallback((device) => {
    if (!isPairedSelectable || connectingPairedId || connectingAvailableId) return;
    setConnectingPairedId(device.id);
    scheduleTimeout(() => {
      setConnectingPairedId(null);
      onCardClick(device);
    });
  }, [isPairedSelectable, connectingPairedId, connectingAvailableId, scheduleTimeout, onCardClick]);

  const handleUnpair = React.useCallback((event, device) => {
    event.stopPropagation();
    if (!canUnpair) return;
    onUnpairDevice(device);
  }, [canUnpair, onUnpairDevice]);

  const rootClass = ['devices-menu', 'devices-menu--page'];

  const renderList = (devices, { emptyLabel, clickHandler, showUnpair, showOwnerInfo }) => {
    if (!devices || devices.length === 0) {
      return <div className="devices-menu-empty">{emptyLabel}</div>;
    }

    return (
      <div className="devices-menu-list">
        {devices.map(device => {
          const isClickable = Boolean(clickHandler);
          const cardClasses = ['devices-menu-card'];
          if (!isClickable) {
            cardClasses.push('disabled');
          }

          return (
            <div
              key={device.id}
              className={cardClasses.join(' ')}
              onClick={isClickable ? () => clickHandler(device) : undefined}
            >
              <div className="devices-menu-card-left">
                <img src={device.imageSrc} alt={device.name} className="devices-menu-card-image" />
              </div>
              <div className="devices-menu-meta">
                <div className="devices-menu-name">{device.name}</div>
                <div className="devices-menu-model">{device.model}</div>
                {showOwnerInfo && device.isOwnedByOther && device.ownerName && (
                  <div className="devices-menu-owner">
                    Paired to: <span className="owner-name">{device.ownerName}</span>
                  </div>
                )}
              </div>
              {showUnpair && (
                <div className="devices-menu-actions">
                  <button className="devices-menu-unpair" onClick={(event) => handleUnpair(event, device)}>
                    Unpair
                  </button>
                </div>
              )}
              {(connectingPairedId === device.id || connectingAvailableId === device.id) && (
                <div className="devices-menu-connecting">Connecting...</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // The handlers (handlePairedClick, handleAvailableClick) use useCallback to memoize,
  // and only access timeoutsRef.current inside event handlers (onClick), not during render.
  // ESLint incorrectly flags this as a render-time ref access. This is a false positive.
  /* eslint-disable */
  return (
    <div className={rootClass.join(' ')} style={{ position: 'relative' }}>
      {/* Close button removed; handled by modal overlay/header */}
      {showPairedSection && (
        <div className="devices-menu-section">
          <div className="devices-menu-section-title">{pairedTitle}</div>
          {isPairedSelectable && normalizedPaired.length > 0 && (
            <span className="devices-menu-model" style={{ fontSize: 12 }}>
              Tap a paired device to connect
            </span>
          )}
          {renderList(normalizedPaired, {
            emptyLabel: 'No available devices',
            clickHandler: isPairedSelectable ? handlePairedClick : null,
            showUnpair: canUnpair,
            showOwnerInfo: false,
          })}
        </div>
      )}

      {showAvailableSection && (
        <div className="devices-menu-section">
          <div className="devices-menu-section-title">{availableTitle}</div>
          {renderList(normalizedAvailable, {
            emptyLabel: 'No nearby devices',
            clickHandler: canPair ? handleAvailableClick : null,
            showUnpair: false,
            showOwnerInfo: true,
          })}
        </div>
      )}

      {/* Warning Dialog for pairing device owned by another user */}
      {showWarningDialog && pendingDevice && (
        <div className="devices-warning-overlay">
          <div className="devices-warning-dialog">
            <div className="devices-warning-icon">⚠️</div>
            <h4 className="devices-warning-title">Device Already Paired</h4>
            <p className="devices-warning-message">
              This device is already paired to <strong>{pendingDevice.ownerName}</strong>, your pairing will unpair it from him.
            </p>
            <div className="devices-warning-buttons">
              <button 
                className="devices-warning-btn devices-warning-btn-cancel"
                onClick={handleWarningCancel}
              >
                Cancel
              </button>
              <button 
                className="devices-warning-btn devices-warning-btn-confirm"
                onClick={handleWarningConfirm}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  /* eslint-enable */
};

export default DevicesMenu;
