// src/service/deviceService.js
// Service layer for device-related operations

import { availableDevices } from '../data/mockData';
import { getStorageJSON, setStorageJSON, notifyPairedDevicesChange } from './storageService';

// Helper functions for device information
export const getSignalStrengthText = (rssi) => {
  if (rssi >= -50) return "Excellent";
  if (rssi >= -60) return "Good";
  if (rssi >= -70) return "Fair";
  if (rssi >= -80) return "Weak";
  return "Very Weak";
};

export const getSignalStrengthColor = (rssi) => {
  if (rssi >= -50) return "#4CAF50";
  if (rssi >= -60) return "#8BC34A";
  if (rssi >= -70) return "#FF9800";
  if (rssi >= -80) return "#F44336";
  return "#9E9E9E";
};

export const getSignalBars = (rssi) => {
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -80) return 1;
  return 0;
};

export const getBatteryIcon = (level) => {
  if (level >= 80) return "🔋";
  if (level >= 50) return "🔋";
  if (level >= 20) return "🪫";
  return "🪫";
};

export const getBatteryColor = (level) => {
  if (level >= 50) return "#4CAF50";
  if (level >= 20) return "#FF9800";
  return "#F44336";
};

export const getConnectionStatusColor = (status) => {
  if (status === "connected") return "#4CAF50";
  if (status === "available") return "#2196F3";
  return "#999999";
};

export const getDeviceTypeIcon = (type) => {
  switch(type) {
    case "watch": return "⌚";
    case "ring": return "💍";
    case "scale": return "⚖️";
    default: return "📱";
  }
};

// Get all available devices for pairing
export const getAvailableDevices = () => {
  return availableDevices;
};

// Get paired devices from storage
export const getPairedDevices = async () => {
  return await getStorageJSON('pairedDevices', []);
};

// Pair a device (add to paired devices)
export const pairDevice = async (device) => {
  const pairedDevices = await getPairedDevices();
  const updatedDevices = [...pairedDevices, device];
  await setStorageJSON('pairedDevices', updatedDevices);
  notifyPairedDevicesChange();
  return updatedDevices;
};

// Unpair a device (remove from paired devices)
export const unpairDevice = async (deviceId) => {
  const pairedDevices = await getPairedDevices();
  const updatedDevices = pairedDevices.filter(d => d.id !== deviceId);
  await setStorageJSON('pairedDevices', updatedDevices);
  notifyPairedDevicesChange();
  return updatedDevices;
};

// Get available devices that are not yet paired
export const getUnpairedDevices = async () => {
  const pairedDevices = await getPairedDevices();
  const pairedIds = new Set(pairedDevices.map(d => d.id));
  return availableDevices.filter(device => !pairedIds.has(device.id));
};
