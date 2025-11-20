// src/data/db.js
// Simple IndexedDB wrapper for get/set/remove (single-store)

const DB_NAME = 'wearables-app-db';
const STORE_NAME = 'app-store';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
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
