import Dexie from 'dexie';

export const db = new Dexie('GameEngineDB');

// Update version ke 2 untuk memaksa refresh schema
db.version(2).stores({
    projects: 'id',          // Primary key 'id'
    assets: '_id, projectId, folderId, isSynced', // Asset tetap '_id'
    scenes: 'id, projectId'  // Scene 'id'
}).upgrade(tx => {
    // Opsional: Hapus data lama jika struktur key berubah drastis agar tidak error
    return tx.table('projects').clear();
});

export default db;