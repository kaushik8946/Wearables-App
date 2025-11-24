// src/service/userDeviceService.js
// Service for managing user-device relationships with multi-device support

import { getStorageJSON, setStorageJSON, notifyUserChange } from './storageService';

/**
 * Get all devices for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of device objects
 */
export const getUserDevices = async (userId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  return userDevices[userId] || [];
};

/**
 * Get the default device for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Default device object or null
 */
export const getUserDefaultDevice = async (userId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  const devices = userDevices[userId] || [];
  return devices.find(d => d.isDefault) || null;
};

/**
 * Add a device to a user's device list
 * @param {string} userId - User ID
 * @param {Object} device - Device object
 * @param {boolean} setAsDefault - Whether to set as default device
 * @returns {Promise<void>}
 */
export const addUserDevice = async (userId, device, setAsDefault = false) => {
  const userDevices = await getStorageJSON('userDevices', {});
  const devices = userDevices[userId] || [];
  
  // If this is the first device, always set as default
  const isFirstDevice = devices.length === 0;
  const shouldBeDefault = isFirstDevice || setAsDefault;
  
  // If setting as default, clear default flag from other devices
  if (shouldBeDefault) {
    devices.forEach(d => {
      d.isDefault = false;
    });
  }
  
  // Add the new device
  devices.push({
    ...device,
    isDefault: shouldBeDefault
  });
  
  userDevices[userId] = devices;
  await setStorageJSON('userDevices', userDevices);
  notifyUserChange();
};

/**
 * Remove a device from a user's device list
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID to remove
 * @returns {Promise<void>}
 */
export const removeUserDevice = async (userId, deviceId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  const devices = userDevices[userId] || [];
  
  const removedDevice = devices.find(d => String(d.id) === String(deviceId));
  const updatedDevices = devices.filter(d => String(d.id) !== String(deviceId));
  
  // If the removed device was default and there are remaining devices, set the first as default
  if (removedDevice?.isDefault && updatedDevices.length > 0) {
    updatedDevices[0].isDefault = true;
  }
  
  userDevices[userId] = updatedDevices;
  await setStorageJSON('userDevices', userDevices);
  notifyUserChange();
};

/**
 * Set a device as the default for a user
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID to set as default
 * @returns {Promise<void>}
 */
export const setUserDefaultDevice = async (userId, deviceId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  const devices = userDevices[userId] || [];
  
  devices.forEach(d => {
    d.isDefault = String(d.id) === String(deviceId);
  });
  
  userDevices[userId] = devices;
  await setStorageJSON('userDevices', userDevices);
  notifyUserChange();
};

/**
 * Get the user ID that owns a specific device
 * @param {string} deviceId - Device ID
 * @returns {Promise<string|null>} User ID or null
 */
export const getDeviceOwner = async (deviceId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  
  for (const [userId, devices] of Object.entries(userDevices)) {
    if (devices.some(d => String(d.id) === String(deviceId))) {
      return userId;
    }
  }
  
  return null;
};

/**
 * Reassign a device from one user to another
 * @param {string} deviceId - Device ID
 * @param {string} newUserId - New user ID
 * @returns {Promise<void>}
 */
export const reassignDevice = async (deviceId, newUserId) => {
  const userDevices = await getStorageJSON('userDevices', {});
  const pairedDevices = await getStorageJSON('pairedDevices', []);
  
  // Find and remove device from current owner
  let deviceToReassign = null;
  for (const [userId, devices] of Object.entries(userDevices)) {
    const deviceIndex = devices.findIndex(d => String(d.id) === String(deviceId));
    if (deviceIndex !== -1) {
      deviceToReassign = devices[deviceIndex];
      const wasDefault = deviceToReassign.isDefault;
      devices.splice(deviceIndex, 1);
      
      // If removed device was default and there are remaining devices, set first as default
      if (wasDefault && devices.length > 0) {
        devices[0].isDefault = true;
      }
      
      userDevices[userId] = devices;
      break;
    }
  }
  
  // If device not found in userDevices, get it from pairedDevices
  if (!deviceToReassign) {
    deviceToReassign = pairedDevices.find(d => String(d.id) === String(deviceId));
  }
  
  if (!deviceToReassign) {
    throw new Error('Device not found');
  }
  
  // Add device to new user
  const newUserDevices = userDevices[newUserId] || [];
  const isFirstDevice = newUserDevices.length === 0;
  
  if (isFirstDevice) {
    newUserDevices.forEach(d => {
      d.isDefault = false;
    });
  }
  
  newUserDevices.push({
    ...deviceToReassign,
    isDefault: isFirstDevice
  });
  
  userDevices[newUserId] = newUserDevices;
  await setStorageJSON('userDevices', userDevices);
  notifyUserChange();
};

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  return [...(currentUser ? [{ ...currentUser, self: true }] : []), ...otherUsers];
};
