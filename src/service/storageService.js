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
  onPairedDevicesChange
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
