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
  clearDeviceHistory,
} from "../data/db";

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
    eventType: "connected",
    timestamp: Date.now(),
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
    eventType: "disconnected",
    timestamp: Date.now(),
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
    if (event.eventType === "connected") {
      deviceIds.add(event.deviceId);
    }
  }
  return Array.from(deviceIds);
};

// ============================================
// MedPlus Users Sync Functions
// ============================================

/**
 * Generate a unique patient ID in format ptXXX (e.g., pt001, pt002)
 * @param {Array} existingUsers - Array of existing medplus users
 * @returns {string} - New patient ID
 */
const generatePatientId = (existingUsers) => {
  if (!existingUsers || existingUsers.length === 0) {
    return "PT001";
  }

  // Find the highest existing ID number
  let maxNum = 0;
  existingUsers.forEach((user) => {
    if (user.patientId && user.patientId.toUpperCase().startsWith("PT")) {
      const num = parseInt(user.patientId.slice(2), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Return next ID with zero-padding (uppercase)
  return `PT${String(maxNum + 1).padStart(3, "0")}`;
};

/**
 * Sync medplusUsers list with current users and registeredUser
 * Call this whenever users or registeredUser changes
 * @returns {Promise<Array>} - Updated medplusUsers array
 */
export const syncMedplusUsers = async () => {
  // Get current data
  const users = await idbGetJSON("users", []);
  const registeredUser = await idbGetJSON("registeredUser", null);
  const currentMedplusUsers = await idbGetJSON("medplusUsers", []);

  // Build a map of existing users by userId for stability
  const existingUsersMap = new Map();
  currentMedplusUsers.forEach((mpUser) => {
    if (mpUser.userId) {
      existingUsersMap.set(mpUser.userId, mpUser);
    }
  });

  // Collect all current users
  const allCurrentUsers = [];
  if (registeredUser && registeredUser.name) {
    allCurrentUsers.push({
      fullName: registeredUser.name,
      gender: registeredUser.gender || "",
      age: registeredUser.age || "",
      userId: registeredUser.id || "registered",
      source: "registeredUser",
    });
  }
  if (users && users.length > 0) {
    users.forEach((user, index) => {
      if (user && user.name) {
        allCurrentUsers.push({
          fullName: user.name,
          gender: user.gender || "",
          age: user.age || "",
          userId: user.id || `user_${index}`,
          source: "users",
        });
      }
    });
  }

  // Build updated medplusUsers list
  const updatedMedplusUsers = [];

  allCurrentUsers.forEach((user) => {
    const existing = existingUsersMap.get(user.userId);

    // Determine the single word name to use
    let nameToUse;
    const nameParts = user.fullName.trim().split(/\s+/);

    if (existing) {
      // Check if the existing single name is still part of the full name (case-insensitive)
      const existingNameLower = existing.name.toLowerCase();
      const isStillValid = nameParts.some(
        (part) => part.toLowerCase() === existingNameLower
      );

      if (isStillValid) {
        // Keep the existing name (preserve casing from existing record)
        nameToUse = existing.name;
      } else {
        // Name changed significantly, pick a new random part
        nameToUse = nameParts[Math.floor(Math.random() * nameParts.length)];
      }

      updatedMedplusUsers.push({
        ...existing,
        name: nameToUse,
        gender: user.gender,
        age: user.age,
        userId: user.userId,
        source: user.source,
      });
    } else {
      // New user, pick a random word from the name
      nameToUse = nameParts[Math.floor(Math.random() * nameParts.length)];

      // Generate new patientId
      const newPatientId = generatePatientId([
        ...currentMedplusUsers,
        ...updatedMedplusUsers,
      ]);

      updatedMedplusUsers.push({
        patientId: newPatientId,
        name: nameToUse,
        gender: user.gender,
        age: user.age,
        userId: user.userId,
        source: user.source,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Save updated list
  await idbSetJSON("medplusUsers", updatedMedplusUsers);

  return updatedMedplusUsers;
};

/**
 * Get all medplus users
 * @returns {Promise<Array>}
 */
export const getMedplusUsers = async () => {
  return await idbGetJSON("medplusUsers", []);
};
