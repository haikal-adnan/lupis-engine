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

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORES.PROJECT)) db.createObjectStore(STORES.PROJECT, { keyPath: '_id' });
      
      const storesWithIndex = [STORES.SCENES, STORES.ASSETS, STORES.PREFABS, STORES.FOLDERS, STORES.SCRIPTS];
      storesWithIndex.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: '_id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      });
    },
  });
};

export const saveProjectToLocalDB = async (fullPayload) => {
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

export const getProjectFromLocalDB = async (projectId) => {
  const db = await initDB();
  
  const project = await db.get(STORES.PROJECT, projectId);

  if (!project) return null;

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