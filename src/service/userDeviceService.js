// src/service/userDeviceService.js
// Service layer for user-device relationship management

import { getStorageJSON, setStorageJSON, notifyUserChange, notifyPairedDevicesChange } from './storageService';

/**
 * Get all devices mapped to a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of device IDs
 */
export const getUserDevices = async (userId) => {
  const userDeviceMap = await getStorageJSON('userDeviceMap', {});
  return userDeviceMap[userId] || [];
};

/**
 * Get the default device for a specific user
 * @param {string} userId - The user ID
 * @returns {Promise<string|null>} Device ID or null
 */
export const getUserDefaultDevice = async (userId) => {
  const defaultDevices = await getStorageJSON('userDefaultDevices', {});
  return defaultDevices[userId] || null;
};

/**
 * Set the default device for a specific user
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID to set as default
 * @returns {Promise<void>}
 */
export const setUserDefaultDevice = async (userId, deviceId) => {
  const defaultDevices = await getStorageJSON('userDefaultDevices', {});
  defaultDevices[userId] = deviceId;
  await setStorageJSON('userDefaultDevices', defaultDevices);
  notifyUserChange();
};

/**
 * Add a device to a user's device list
 * If this is the user's first device, it becomes the default
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID to add
 * @returns {Promise<void>}
 */
export const addDeviceToUser = async (userId, deviceId) => {
  const userDeviceMap = await getStorageJSON('userDeviceMap', {});
  const userDevices = userDeviceMap[userId] || [];
  
  // Don't add if already present
  if (userDevices.includes(deviceId)) {
    return;
  }
  
  userDevices.push(deviceId);
  userDeviceMap[userId] = userDevices;
  await setStorageJSON('userDeviceMap', userDeviceMap);
  
  // If this is the first device, make it default
  const defaultDevices = await getStorageJSON('userDefaultDevices', {});
  if (!defaultDevices[userId]) {
    defaultDevices[userId] = deviceId;
    await setStorageJSON('userDefaultDevices', defaultDevices);
  }
  
  notifyUserChange();
  notifyPairedDevicesChange();
};

/**
 * Remove a device from a user's device list
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID to remove
 * @returns {Promise<void>}
 */
export const removeDeviceFromUser = async (userId, deviceId) => {
  const userDeviceMap = await getStorageJSON('userDeviceMap', {});
  const userDevices = userDeviceMap[userId] || [];
  
  userDeviceMap[userId] = userDevices.filter(id => id !== deviceId);
  await setStorageJSON('userDeviceMap', userDeviceMap);
  
  // If this was the default device, clear it and set new default if available
  const defaultDevices = await getStorageJSON('userDefaultDevices', {});
  if (defaultDevices[userId] === deviceId) {
    const remainingDevices = userDeviceMap[userId];
    defaultDevices[userId] = remainingDevices.length > 0 ? remainingDevices[0] : null;
    await setStorageJSON('userDefaultDevices', defaultDevices);
  }
  
  notifyUserChange();
  notifyPairedDevicesChange();
};

/**
 * Get which user a device is assigned to
 * @param {string} deviceId - The device ID
 * @returns {Promise<string|null>} User ID or null
 */
export const getDeviceOwner = async (deviceId) => {
  const userDeviceMap = await getStorageJSON('userDeviceMap', {});
  
  for (const [userId, devices] of Object.entries(userDeviceMap)) {
    if (devices.includes(deviceId)) {
      return userId;
    }
  }
  
  return null;
};

/**
 * Reassign a device from one user to another
 * @param {string} deviceId - The device ID
 * @param {string} newUserId - The new user ID
 * @returns {Promise<void>}
 */
export const reassignDevice = async (deviceId, newUserId) => {
  // Remove from current owner
  const currentOwner = await getDeviceOwner(deviceId);
  if (currentOwner) {
    await removeDeviceFromUser(currentOwner, deviceId);
  }
  
  // Add to new user
  await addDeviceToUser(newUserId, deviceId);
};

/**
 * Get all devices for a user with full device info
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of device objects
 */
export const getUserDevicesWithInfo = async (userId) => {
  const deviceIds = await getUserDevices(userId);
  const pairedDevices = await getStorageJSON('pairedDevices', []);
  
  return pairedDevices.filter(device => deviceIds.includes(String(device.id)));
};
