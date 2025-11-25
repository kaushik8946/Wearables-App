// src/service/storageService.js
// Service layer for storage operations (wraps IndexedDB)

import { 
  idbGet, 
  idbSet, 
  idbGetJSON, 
  idbSetJSON, 
  idbRemove, 
  idbClear,
  emitUserChange,
  onUserChange,
  emitPairedDevicesChange,
  onPairedDevicesChange,
  addDeviceHistoryEvent,
  getDeviceHistoryForUser,
  getDeviceHistoryForDevice,
  getAllDeviceHistory,
  clearDeviceHistory
} from '../data/db';

// Storage operations
export const getStorageItem = async (key) => {
  return await idbGet(key);
};

export const setStorageItem = async (key, value) => {
  return await idbSet(key, value);
};

export const getStorageJSON = async (key, fallback = null) => {
  return await idbGetJSON(key, fallback);
};

export const setStorageJSON = async (key, value) => {
  return await idbSetJSON(key, value);
};

export const removeStorageItem = async (key) => {
  return await idbRemove(key);
};

export const clearStorage = async () => {
  return await idbClear();
};

// Event handlers for user changes
export const notifyUserChange = () => {
  emitUserChange();
};

export const subscribeToUserChange = (callback) => {
  return onUserChange(callback);
};

// Event handlers for paired devices changes
export const notifyPairedDevicesChange = () => {
  emitPairedDevicesChange();
};

export const subscribeToPairedDevicesChange = (callback) => {
  return onPairedDevicesChange(callback);
};

// ============================================
// Device-User History Service Functions
// ============================================

/**
 * Record a device connection event (device paired to user)
 * @param {string} deviceId
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const recordDeviceConnected = async (deviceId, userId) => {
  return await addDeviceHistoryEvent({
    deviceId: String(deviceId),
    userId: String(userId),
    eventType: 'connected',
    timestamp: Date.now()
  });
};

/**
 * Record a device disconnection event (device unpaired from user)
 * @param {string} deviceId
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const recordDeviceDisconnected = async (deviceId, userId) => {
  return await addDeviceHistoryEvent({
    deviceId: String(deviceId),
    userId: String(userId),
    eventType: 'disconnected',
    timestamp: Date.now()
  });
};

/**
 * Get all historical device-user relations for a given user
 * @param {string} userId
 * @returns {Promise<Array>} - Array of history events
 */
export const getHistoryForUser = async (userId) => {
  return await getDeviceHistoryForUser(String(userId));
};

/**
 * Get all historical device-user relations for a given device
 * @param {string} deviceId
 * @returns {Promise<Array>} - Array of history events
 */
export const getHistoryForDevice = async (deviceId) => {
  return await getDeviceHistoryForDevice(String(deviceId));
};

/**
 * Get all device-user history
 * @returns {Promise<Array>}
 */
export const getAllHistory = async () => {
  return await getAllDeviceHistory();
};

/**
 * Clear all device-user history (for testing/reset)
 * @returns {Promise<void>}
 */
export const clearHistory = async () => {
  return await clearDeviceHistory();
};

/**
 * Get unique device IDs that a user has historically been connected to
 * @param {string} userId
 * @returns {Promise<Array<string>>} - Array of device IDs
 */
export const getHistoricalDeviceIdsForUser = async (userId) => {
  const history = await getDeviceHistoryForUser(String(userId));
  const deviceIds = new Set();
  for (const event of history) {
    if (event.eventType === 'connected') {
      deviceIds.add(event.deviceId);
    }
  }
  return Array.from(deviceIds);
};
