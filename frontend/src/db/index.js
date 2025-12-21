import Dexie from 'dexie';

export const db = new Dexie('GameEngineDB');

db.version(1).stores({
    projects: '_id',
    assets: '_id, projectId, folderId, isSynced',
    scenes: '_id, projectId'
});

export default db;