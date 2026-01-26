// src/services/db/index.js
import { openDB } from 'idb';

const DB_NAME = 'LupisEngineDB';
const DB_VERSION = 1;

export const STORES = {
  PROJECT: 'projects',
  SCENES: 'scenes',
  ASSETS: 'assets',
  PREFABS: 'prefabs',
  FOLDERS: 'folders',
  SCRIPTS: 'scripts'
};

// ... initDB dan saveProjectToLocalDB yang sudah ada ...

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.PROJECT)) db.createObjectStore(STORES.PROJECT, { keyPath: '_id' });
      
      const storesWithIndex = [STORES.SCENES, STORES.ASSETS, STORES.PREFABS, STORES.FOLDERS, STORES.SCRIPTS];
      storesWithIndex.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: '_id' });
          // Pastikan index projectId dibuat agar kita bisa query relasinya
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      });
    },
  });
};

export const saveProjectToLocalDB = async (fullPayload) => {
    // ... kode save yang sebelumnya (biarkan sama) ...
    const db = await initDB();
    const tx = db.transaction(Object.values(STORES), 'readwrite');
    const { project, scenes, assets, prefabs, folders, scripts } = fullPayload;

    if (project) await tx.objectStore(STORES.PROJECT).put(project);

    const saveArray = (storeName, items) => {
        const store = tx.objectStore(storeName);
        if (Array.isArray(items)) items.forEach(item => store.put(item));
    };

    saveArray(STORES.SCENES, scenes);
    saveArray(STORES.ASSETS, assets);
    saveArray(STORES.PREFABS, prefabs);
    saveArray(STORES.FOLDERS, folders);
    saveArray(STORES.SCRIPTS, scripts);
    
    await tx.done;
};

// --- TAMBAHAN BARU: LOAD FUNCTION ---

export const getProjectFromLocalDB = async (projectId) => {
  const db = await initDB();
  
  // 1. Cek apakah Project ada di store 'projects'
  const project = await db.get(STORES.PROJECT, projectId);

  // Jika Project tidak ada, return null agar logic lanjut ke fetch API
  if (!project) return null;

  // 2. Jika ada, ambil semua resources terkait menggunakan Index 'projectId'
  const [scenes, assets, prefabs, folders, scripts] = await Promise.all([
    db.getAllFromIndex(STORES.SCENES, 'projectId', projectId),
    db.getAllFromIndex(STORES.ASSETS, 'projectId', projectId),
    db.getAllFromIndex(STORES.PREFABS, 'projectId', projectId),
    db.getAllFromIndex(STORES.FOLDERS, 'projectId', projectId),
    db.getAllFromIndex(STORES.SCRIPTS, 'projectId', projectId),
  ]);

  return {
    project,
    scenes,
    assets,
    prefabs,
    folders,
    scripts
  };
};