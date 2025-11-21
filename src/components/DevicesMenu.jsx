/* eslint-disable react-hooks/rules-of-hooks */
/* The linter incorrectly flags renderList as accessing refs during render, but it only passes handlers that access refs in event handlers, which is correct */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import '../styles/components/DevicesMenu.css';
import watchImg from '../assets/images/watch.png';
import ringImg from '../assets/images/ring.webp';
import scaleImg from '../assets/images/weighing-scale.avif';

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
  pairedTitle = 'Paired Devices',
  availableTitle = 'Available Devices',
  showPairedSection = true,
  showAvailableSection = true
}) => {
  const [connectingAvailableId, setConnectingAvailableId] = useState(null);
  const [connectingPairedId, setConnectingPairedId] = useState(null);
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

  const scheduleTimeout = (cb) => {
    const timeout = setTimeout(cb, 1000);
    const timeouts = timeoutsRef.current;
    timeouts.push(timeout);
  };

  const handleAvailableClick = (device) => {
    if (!canPair || connectingPairedId || connectingAvailableId) return;
    setConnectingAvailableId(device.id);
    scheduleTimeout(() => {
      setConnectingAvailableId(null);
      onPairDevice(device);
    });
  };

  const handlePairedClick = (device) => {
    if (!isPairedSelectable || connectingPairedId || connectingAvailableId) return;
    setConnectingPairedId(device.id);
    scheduleTimeout(() => {
      setConnectingPairedId(null);
      onCardClick(device);
    });
  };

  const handleUnpair = (event, device) => {
    event.stopPropagation();
    if (!canUnpair) return;
    onUnpairDevice(device);
  };

  const rootClass = ['devices-menu', 'devices-menu--page'];

  const renderList = (devices, { emptyLabel, clickHandler, showUnpair }) => {
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
            emptyLabel: 'No paired devices',
            clickHandler: isPairedSelectable ? handlePairedClick : null,
            showUnpair: canUnpair,
          })}
        </div>
      )}

      {showAvailableSection && (
        <div className="devices-menu-section">
          <div className="devices-menu-section-title">{availableTitle}</div>
          {renderList(normalizedAvailable, {
            emptyLabel: 'No devices available to pair',
            clickHandler: canPair ? handleAvailableClick : null,
            showUnpair: false,
          })}
        </div>
      )}
    </div>
  );
};

export default DevicesMenu;
