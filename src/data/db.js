// src/data/db.js
// Simple IndexedDB wrapper for get/set/remove (multi-store)

const DB_NAME = 'wearables-app-db';
const STORE_NAME = 'app-store';
const HISTORY_STORE_NAME = 'device-user-history';
// Bump DB version to 2 to match previously-created databases and avoid
// "requested version is less than the existing version" errors in runtime.
const DB_VERSION = 2;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // Add device-user history store with auto-increment key
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        const historyStore = db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('deviceId', 'deviceId', { unique: false });
        historyStore.createIndex('userId', 'userId', { unique: false });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemove(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function parseMaybeJSON(raw, fallback) {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to parse stored JSON value', err);
      return fallback;
    }
  }
  return raw;
}

export async function idbGetJSON(key, fallback = null) {
  const raw = await idbGet(key);
  return parseMaybeJSON(raw, fallback);
}

export async function idbSetJSON(key, value) {
  return idbSet(key, value);
}

export async function idbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Event system for user data changes
const USER_CHANGE_EVENT = 'user-data-changed';

export function emitUserChange() {
  window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT));
}

export function onUserChange(callback) {
  window.addEventListener(USER_CHANGE_EVENT, callback);
  return () => window.removeEventListener(USER_CHANGE_EVENT, callback);
}

// Event system for paired devices changes
const PAIRED_DEVICES_EVENT = 'paired-devices-changed';

export function emitPairedDevicesChange() {
  window.dispatchEvent(new CustomEvent(PAIRED_DEVICES_EVENT));
}

export function onPairedDevicesChange(callback) {
  window.addEventListener(PAIRED_DEVICES_EVENT, callback);
  return () => window.removeEventListener(PAIRED_DEVICES_EVENT, callback);
}

// ============================================
// Device-User History Store Functions
// ============================================

/**
 * Add a device-user history event (connected or disconnected)
 * @param {Object} event - { deviceId, userId, eventType: 'connected'|'disconnected', timestamp }
 * @returns {Promise<number>} - The auto-generated ID of the new record
 */
export async function addDeviceHistoryEvent(event) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const record = {
      deviceId: String(event.deviceId),
      userId: String(event.userId),
      eventType: event.eventType, // 'connected' or 'disconnected'
      timestamp: event.timestamp || Date.now()
    };
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all history events for a specific user
 * @param {string} userId
 * @returns {Promise<Array>} - Array of history events sorted by timestamp desc
 */
export async function getDeviceHistoryForUser(userId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const index = store.index('userId');
    const req = index.getAll(String(userId));
    req.onsuccess = () => {
      const results = req.result || [];
      // Sort by timestamp descending (most recent first)
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all history events for a specific device
 * @param {string} deviceId
 * @returns {Promise<Array>} - Array of history events sorted by timestamp desc
 */
export async function getDeviceHistoryForDevice(deviceId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const index = store.index('deviceId');
    const req = index.getAll(String(deviceId));
    req.onsuccess = () => {
      const results = req.result || [];
      // Sort by timestamp descending (most recent first)
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all device-user history events
 * @returns {Promise<Array>}
 */
export async function getAllDeviceHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = req.result || [];
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all device-user history
 * @returns {Promise<void>}
 */
export async function clearDeviceHistory() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(HISTORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
