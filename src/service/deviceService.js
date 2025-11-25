// src/service/deviceService.js
// Service layer for device-related operations

import { availableDevices } from '../data/mockData';
import { 
  getStorageJSON, 
  setStorageJSON, 
  getStorageItem, 
  setStorageItem, 
  notifyPairedDevicesChange, 
  notifyUserChange,
  recordDeviceConnected,
  recordDeviceDisconnected,
  getHistoricalDeviceIdsForUser
} from './storageService';

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

// Get ALL available devices with ownership info (for nearby devices list)
export const getAllAvailableDevicesWithOwnership = async () => {
  const allDevices = availableDevices;
  const users = await getAllUsers();
  const ownershipMap = await getStorageJSON('deviceOwnership', {});
  
  const devicesWithOwnership = await Promise.all(
    allDevices.map(async (device) => {
      const deviceIdStr = String(device.id);
      
      // Check ownership map first, then fallback to user devices lists
      let owner = null;
      const ownerUserId = ownershipMap[deviceIdStr];
      
      if (ownerUserId) {
        owner = users.find(u => String(u.id) === String(ownerUserId));
      } else {
        // Fallback: check users' devices lists (backwards compatibility)
        owner = users.find(user => {
          const userDevices = user.devices || [];
          return userDevices.some(id => String(id) === deviceIdStr);
        });
      }
      
      return {
        ...device,
        ownerId: owner ? owner.id : null,
        ownerName: owner ? owner.name : null,
        isOwnedByOther: !!owner
      };
    })
  );
  
  return devicesWithOwnership;
};

// Get all users (currentUser + users)
export const getAllUsers = async () => {
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  // Ensure every user has an id
  const ensureId = (user) => {
    if (!user) return user;
    if (!user.id) {
      return { ...user, id: `user_${Date.now()}_${Math.random().toString(36).slice(2,8)}` };
    }
    return user;
  };
  
  const normalizedCurrentUser = currentUser ? ensureId(currentUser) : null;
  const normalizedOtherUsers = Array.isArray(otherUsers) ? otherUsers.map(ensureId) : [];
  
  return normalizedCurrentUser 
    ? [{ ...normalizedCurrentUser, self: true }, ...normalizedOtherUsers]
    : normalizedOtherUsers;
};

// Get the current owner of a device from the ownership map
export const getDeviceOwner = async (deviceId) => {
  const ownershipMap = await getStorageJSON('deviceOwnership', {});
  return ownershipMap[String(deviceId)] || null;
};

// Set the owner of a device
export const setDeviceOwner = async (deviceId, userId) => {
  const ownershipMap = await getStorageJSON('deviceOwnership', {});
  ownershipMap[String(deviceId)] = userId ? String(userId) : null;
  await setStorageJSON('deviceOwnership', ownershipMap);
};

// Get the user assigned to a specific device (current owner)
export const getUserForDevice = async (deviceId) => {
  const deviceIdStr = String(deviceId);
  const ownerUserId = await getDeviceOwner(deviceIdStr);
  
  if (ownerUserId) {
    return await getUserById(ownerUserId);
  }
  
  // Fallback: check users' devices lists (backwards compatibility)
  const users = await getAllUsers();
  return users.find(user => {
    const userDevices = user.devices || [];
    return userDevices.some(id => String(id) === deviceIdStr);
  }) || null;
};

// Reassign a device to a different user
// Note: This keeps the device in the old user's list for historical tracking (offline state)
// but adds it to the new user's list. The current owner is determined by who has it most recently.
export const reassignDevice = async (deviceId, newUserId) => {
  const deviceIdStr = String(deviceId);
  const newUserIdStr = String(newUserId);
  
  // Get current owner before reassignment for history tracking
  const oldOwnerId = await getDeviceOwner(deviceIdStr);
  
  // Get all users
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  let updatedCurrentUser = currentUser;
  let updatedOtherUsers = [...otherUsers];
  
  // Clear default device for old owners if this was their default
  if (updatedCurrentUser && Array.isArray(updatedCurrentUser.devices)) {
    if (String(updatedCurrentUser.defaultDevice) === deviceIdStr && String(updatedCurrentUser.id) !== newUserIdStr) {
      // Find another device to set as default, or null
      const otherDevices = updatedCurrentUser.devices.filter(id => String(id) !== deviceIdStr);
      updatedCurrentUser = {
        ...updatedCurrentUser,
        defaultDevice: otherDevices.length > 0 ? otherDevices[0] : null
      };
    }
  }
  
  updatedOtherUsers = updatedOtherUsers.map(user => {
    if (!Array.isArray(user.devices)) return user;
    if (String(user.defaultDevice) === deviceIdStr && String(user.id) !== newUserIdStr) {
      const otherDevices = user.devices.filter(id => String(id) !== deviceIdStr);
      return {
        ...user,
        defaultDevice: otherDevices.length > 0 ? otherDevices[0] : null
      };
    }
    return user;
  });
  
  // Add device to the new user
  if (updatedCurrentUser && String(updatedCurrentUser.id) === newUserIdStr) {
    const devices = [...(updatedCurrentUser.devices || [])];
    if (!devices.includes(deviceIdStr)) {
      devices.push(deviceIdStr);
    }
    updatedCurrentUser = {
      ...updatedCurrentUser,
      devices,
      // Set as default if no default device
      defaultDevice: updatedCurrentUser.defaultDevice || deviceIdStr
    };
  } else {
    updatedOtherUsers = updatedOtherUsers.map(user => {
      if (String(user.id) === newUserIdStr) {
        const devices = [...(user.devices || [])];
        if (!devices.includes(deviceIdStr)) {
          devices.push(deviceIdStr);
        }
        return {
          ...user,
          devices,
          // Set as default if no default device
          defaultDevice: user.defaultDevice || deviceIdStr
        };
      }
      return user;
    });
  }
  
  // Save updated users
  if (updatedCurrentUser) {
    await setStorageJSON('currentUser', updatedCurrentUser);
  }
  await setStorageJSON('users', updatedOtherUsers);
  
  // Update device ownership map
  await setDeviceOwner(deviceIdStr, newUserIdStr);
  
  // Record history events in IndexedDB
  // If there was an old owner, record disconnection
  if (oldOwnerId && oldOwnerId !== newUserIdStr) {
    await recordDeviceDisconnected(deviceIdStr, oldOwnerId);
  }
  // Record connection to new user
  await recordDeviceConnected(deviceIdStr, newUserIdStr);
  
  // Notify listeners
  notifyUserChange();
  
  return { success: true };
};

// Unassign a device from all users
export const unassignDevice = async (deviceId) => {
  const deviceIdStr = String(deviceId);
  
  // Get current owner before unassignment for history tracking
  const oldOwnerId = await getDeviceOwner(deviceIdStr);
  
  // Get all users
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  let updatedCurrentUser = currentUser;
  let updatedOtherUsers = [...otherUsers];
  
  // Remove device from all users
  if (updatedCurrentUser && Array.isArray(updatedCurrentUser.devices)) {
    const devices = updatedCurrentUser.devices.filter(id => String(id) !== deviceIdStr);
    updatedCurrentUser = {
      ...updatedCurrentUser,
      devices,
      // If removing the default device, clear it or set to first available
      defaultDevice: String(updatedCurrentUser.defaultDevice) === deviceIdStr 
        ? (devices[0] ?? null)
        : updatedCurrentUser.defaultDevice
    };
  }
  
  updatedOtherUsers = updatedOtherUsers.map(user => {
    if (!Array.isArray(user.devices)) return user;
    const devices = user.devices.filter(id => String(id) !== deviceIdStr);
    return {
      ...user,
      devices,
      // If removing the default device, clear it or set to first available
      defaultDevice: String(user.defaultDevice) === deviceIdStr 
        ? (devices.length > 0 ? devices[0] : null)
        : user.defaultDevice
    };
  });
  
  // Save updated users
  if (updatedCurrentUser) {
    await setStorageJSON('currentUser', updatedCurrentUser);
  }
  await setStorageJSON('users', updatedOtherUsers);
  
  // Clear device ownership
  await setDeviceOwner(deviceIdStr, null);
  
  // Record disconnection event in IndexedDB if there was an owner
  if (oldOwnerId) {
    await recordDeviceDisconnected(deviceIdStr, oldOwnerId);
  }
  
  // Notify listeners
  notifyUserChange();
  
  return { success: true };
};

// Get the active user (used for dashboard context)
export const getActiveUser = async () => {
  const activeUserId = await getStorageItem('activeUserId');
  
  if (!activeUserId) {
    // Fallback to default user
    const defaultUserId = await getStorageItem('defaultUserId');
    if (defaultUserId) {
      return await getUserById(defaultUserId);
    }
    return null;
  }
  
  return await getUserById(activeUserId);
};

// Set the active user (used for dashboard context)
export const setActiveUser = async (userId) => {
  await setStorageItem('activeUserId', String(userId));
  notifyUserChange();
};

// Get user by ID
export const getUserById = async (userId) => {
  const users = await getAllUsers();
  return users.find(u => String(u.id) === String(userId)) || null;
};

// Get devices for a specific user
export const getDevicesForUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user) return [];
  
  const pairedDevices = await getPairedDevices();
  const userDeviceIds = user.devices || [];
  
  return pairedDevices.filter(device => 
    userDeviceIds.some(id => String(id) === String(device.id))
  );
};

// Get default device for a user
export const getDefaultDeviceForUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user || !user.defaultDevice) return null;
  
  const pairedDevices = await getPairedDevices();
  return pairedDevices.find(d => String(d.id) === String(user.defaultDevice)) || null;
};

// Set default device for a user
export const setDefaultDeviceForUser = async (userId, deviceId) => {
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  const userIdStr = String(userId);
  const deviceIdStr = String(deviceId);
  
  if (currentUser && String(currentUser.id) === userIdStr) {
    await setStorageJSON('currentUser', { ...currentUser, defaultDevice: deviceIdStr });
  } else {
    const updatedOtherUsers = otherUsers.map(u => 
      String(u.id) === userIdStr ? { ...u, defaultDevice: deviceIdStr } : u
    );
    await setStorageJSON('users', updatedOtherUsers);
  }
  
  notifyUserChange();
};

// Get devices for a user with ownership status
// A device is "offline" if it was historically assigned to this user but is now owned by someone else
export const getDevicesForUserWithStatus = async (userId) => {
  const user = await getUserById(userId);
  if (!user) return [];
  
  const pairedDevices = await getPairedDevices();
  const userDeviceIds = user.devices || [];
  const allUsers = await getAllUsers();
  const ownershipMap = await getStorageJSON('deviceOwnership', {});
  
  return pairedDevices
    .filter(device => userDeviceIds.some(id => String(id) === String(device.id)))
    .map(device => {
      const deviceIdStr = String(device.id);
      
      // Check ownership map first, then fallback to user devices lists
      let currentOwner = null;
      const ownerUserId = ownershipMap[deviceIdStr];
      
      if (ownerUserId) {
        currentOwner = allUsers.find(u => String(u.id) === String(ownerUserId));
      } else {
        // Fallback: check users' devices lists (backwards compatibility)
        currentOwner = allUsers.find(u => {
          const uDevices = u.devices || [];
          return uDevices.some(id => String(id) === deviceIdStr);
        });
      }
      
      const isOwnedByThisUser = currentOwner && String(currentOwner.id) === String(userId);
      const isOwnedByOther = currentOwner && String(currentOwner.id) !== String(userId);
      
      return {
        ...device,
        isOffline: isOwnedByOther,
        currentOwnerId: currentOwner?.id || null,
        currentOwnerName: currentOwner?.name || null,
        isOwnedByOther
      };
    });
};

// Transfer device ownership from one user to another
export const transferDeviceOwnership = async (deviceId, newUserId) => {
  const deviceIdStr = String(deviceId);
  const newUserIdStr = String(newUserId);
  
  // Get current owner before transfer for history tracking
  const oldOwnerId = await getDeviceOwner(deviceIdStr);
  
  // Get all users
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  let updatedCurrentUser = currentUser;
  let updatedOtherUsers = [...otherUsers];
  
  // Remove device from all users
  if (updatedCurrentUser && Array.isArray(updatedCurrentUser.devices)) {
    const devices = updatedCurrentUser.devices.filter(id => String(id) !== deviceIdStr);
    updatedCurrentUser = {
      ...updatedCurrentUser,
      devices,
      defaultDevice: String(updatedCurrentUser.defaultDevice) === deviceIdStr 
        ? (devices.length > 0 ? devices[0] : null)
        : updatedCurrentUser.defaultDevice
    };
  }
  
  updatedOtherUsers = updatedOtherUsers.map(user => {
    if (!Array.isArray(user.devices)) return user;
    const devices = user.devices.filter(id => String(id) !== deviceIdStr);
    return {
      ...user,
      devices,
      defaultDevice: String(user.defaultDevice) === deviceIdStr 
        ? (devices.length > 0 ? devices[0] : null)
        : user.defaultDevice
    };
  });
  
  // Add device to the new user
  if (updatedCurrentUser && String(updatedCurrentUser.id) === newUserIdStr) {
    const devices = [...(updatedCurrentUser.devices || [])];
    if (!devices.includes(deviceIdStr)) {
      devices.push(deviceIdStr);
    }
    updatedCurrentUser = {
      ...updatedCurrentUser,
      devices,
      defaultDevice: updatedCurrentUser.defaultDevice || deviceIdStr
    };
  } else {
    updatedOtherUsers = updatedOtherUsers.map(user => {
      if (String(user.id) === newUserIdStr) {
        const devices = [...(user.devices || [])];
        if (!devices.includes(deviceIdStr)) {
          devices.push(deviceIdStr);
        }
        return {
          ...user,
          devices,
          defaultDevice: user.defaultDevice || deviceIdStr
        };
      }
      return user;
    });
  }
  
  // Save updated users
  if (updatedCurrentUser) {
    await setStorageJSON('currentUser', updatedCurrentUser);
  }
  await setStorageJSON('users', updatedOtherUsers);
  
  // Update device ownership map
  await setDeviceOwner(deviceIdStr, newUserIdStr);
  
  // Record history events in IndexedDB
  // If there was an old owner different from new owner, record disconnection
  if (oldOwnerId && oldOwnerId !== newUserIdStr) {
    await recordDeviceDisconnected(deviceIdStr, oldOwnerId);
  }
  // Record connection to new user
  await recordDeviceConnected(deviceIdStr, newUserIdStr);
  
  // Notify listeners
  notifyUserChange();
  
  return { success: true };
};

// Get both current and historical devices for a user
// Returns devices that are currently paired to this user + devices that were historically paired
// Historical devices that are now owned by someone else will have isOffline=true
export const getCurrentAndHistoricalDevicesForUser = async (userId) => {
  const userIdStr = String(userId);
  const user = await getUserById(userIdStr);
  if (!user) return [];
  
  const pairedDevices = await getPairedDevices();
  const allUsers = await getAllUsers();
  const ownershipMap = await getStorageJSON('deviceOwnership', {});
  
  // Get historical device IDs for this user from IndexedDB
  const historicalDeviceIds = await getHistoricalDeviceIdsForUser(userIdStr);
  
  // Get current user device IDs (from user object)
  const currentDeviceIds = user.devices || [];
  
  // Combine current and historical (deduplicated)
  const allDeviceIds = new Set([
    ...currentDeviceIds.map(id => String(id)),
    ...historicalDeviceIds
  ]);
  
  // Filter paired devices to only include those in our combined set
  const relevantDevices = pairedDevices.filter(device => 
    allDeviceIds.has(String(device.id))
  );
  
  // Also check for historical devices that might not be in pairedDevices yet
  // (edge case where device was paired before)
  const pairedDeviceIds = new Set(pairedDevices.map(d => String(d.id)));
  const missingHistoricalIds = historicalDeviceIds.filter(id => !pairedDeviceIds.has(id));
  
  // Get missing historical devices from availableDevices
  const additionalHistoricalDevices = availableDevices
    .filter(device => missingHistoricalIds.includes(String(device.id)));
  
  // Combine all relevant devices
  const allRelevantDevices = [...relevantDevices, ...additionalHistoricalDevices];
  
  // Map to include ownership status
  return allRelevantDevices.map(device => {
    const deviceIdStr = String(device.id);
    
    // Determine current owner
    let currentOwner = null;
    const ownerUserId = ownershipMap[deviceIdStr];
    
    if (ownerUserId) {
      currentOwner = allUsers.find(u => String(u.id) === String(ownerUserId));
    } else {
      // Fallback: check users' devices lists
      currentOwner = allUsers.find(u => {
        const uDevices = u.devices || [];
        return uDevices.some(id => String(id) === deviceIdStr);
      });
    }
    
    const isOwnedByThisUser = currentOwner && String(currentOwner.id) === userIdStr;
    const isOwnedByOther = currentOwner && String(currentOwner.id) !== userIdStr;
    
    return {
      ...device,
      isOffline: isOwnedByOther,
      currentOwnerId: currentOwner?.id || null,
      currentOwnerName: currentOwner?.name || null,
      isOwnedByOther,
      isHistorical: historicalDeviceIds.includes(deviceIdStr) && !currentDeviceIds.some(id => String(id) === deviceIdStr)
    };
  });
};
