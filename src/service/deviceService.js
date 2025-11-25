// src/service/deviceService.js
// Service layer for device-related operations

import { availableDevices } from '../data/mockData';
import { getStorageJSON, setStorageJSON, getStorageItem, setStorageItem, notifyPairedDevicesChange, notifyUserChange } from './storageService';

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
  
  const devicesWithOwnership = await Promise.all(
    allDevices.map(async (device) => {
      const owner = users.find(user => {
        const userDevices = user.devices || [];
        return userDevices.some(id => String(id) === String(device.id));
      });
      return {
        ...device,
        ownerId: owner ? owner.id : null,
        ownerName: owner ? owner.name : null,
        isOwnedByOther: owner ? true : false
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

// Get the user assigned to a specific device
export const getUserForDevice = async (deviceId) => {
  const users = await getAllUsers();
  const deviceIdStr = String(deviceId);
  
  return users.find(user => {
    const userDevices = user.devices || [];
    return userDevices.some(id => String(id) === deviceIdStr);
  }) || null;
};

// Reassign a device to a different user
// Note: This keeps the device in the old user's list for historical tracking
// but marks it as owned by the new user
export const reassignDevice = async (deviceId, newUserId) => {
  const deviceIdStr = String(deviceId);
  const newUserIdStr = String(newUserId);
  
  // Get all users
  const currentUser = await getStorageJSON('currentUser', null);
  const otherUsers = await getStorageJSON('users', []);
  
  let updatedCurrentUser = currentUser;
  let updatedOtherUsers = [...otherUsers];
  
  // Remove device from all users (to transfer ownership)
  if (updatedCurrentUser && Array.isArray(updatedCurrentUser.devices)) {
    const devices = updatedCurrentUser.devices.filter(id => String(id) !== deviceIdStr);
    updatedCurrentUser = {
      ...updatedCurrentUser,
      devices,
      // If removing the default device, clear it
      defaultDevice: String(updatedCurrentUser.defaultDevice) === deviceIdStr ? null : updatedCurrentUser.defaultDevice
    };
  }
  
  updatedOtherUsers = updatedOtherUsers.map(user => {
    if (!Array.isArray(user.devices)) return user;
    const devices = user.devices.filter(id => String(id) !== deviceIdStr);
    return {
      ...user,
      devices,
      // If removing the default device, clear it
      defaultDevice: String(user.defaultDevice) === deviceIdStr ? null : user.defaultDevice
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
  
  // Notify listeners
  notifyUserChange();
  
  return { success: true };
};

// Unassign a device from all users
export const unassignDevice = async (deviceId) => {
  const deviceIdStr = String(deviceId);
  
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
  
  return pairedDevices
    .filter(device => userDeviceIds.some(id => String(id) === String(device.id)))
    .map(device => {
      // Check if this device is currently owned by another user
      const currentOwner = allUsers.find(u => {
        const uDevices = u.devices || [];
        return uDevices.some(id => String(id) === String(device.id));
      });
      
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
  
  // Notify listeners
  notifyUserChange();
  
  return { success: true };
};
