import { db } from "@/db/index.js";

/**
 * Menyimpan entities yang berubah ke IndexedDB
 * @param {string} sceneId 
 * @param {Array} dirtyEntitiesData - Array perubahan parsial atau full entity
 */
export async function updateSceneEntities(sceneId, dirtyEntitiesData) {
    if (!dirtyEntitiesData || dirtyEntitiesData.length === 0) return;

    await db.transaction('rw', db.scenes, async () => {
        const scene = await db.scenes.get(sceneId);
        if (!scene) return;

        // Map untuk update cepat O(1)
        const updateMap = new Map(dirtyEntitiesData.map(e => [e._id, e]));

        const updatedEntities = scene.entities.map(entity => {
            if (updateMap.has(entity._id)) {
                // Merge data lama dengan perubahan baru
                // Set flag _isDirty agar sync service tahu ini perlu diupload
                return { 
                    ...entity, 
                    ...updateMap.get(entity._id), 
                    _isDirty: true 
                };
            }
            return entity;
        });

        await db.scenes.update(sceneId, { entities: updatedEntities });
    });
}

/**
 * Mengambil entities yang memiliki flag _isDirty = true
 */
export async function getDirtyEntities(sceneId) {
    const scene = await db.scenes.get(sceneId);
    if (!scene || !scene.entities) return [];
    
    return scene.entities.filter(e => e._isDirty);
}

/**
 * Menandai entities sebagai sudah tersinkron (Clean)
 */
export async function markSceneAsSynced(sceneId) {
    await db.transaction('rw', db.scenes, async () => {
        const scene = await db.scenes.get(sceneId);
        if (!scene) return;

        const cleanEntities = scene.entities.map(e => {
            if (e._isDirty) {
                const { _isDirty, ...clean } = e; // Hapus flag
                return clean;
            }
            return e;
        });

        await db.scenes.update(sceneId, { entities: cleanEntities });
    });
}

/**
 * Cek cepat apakah ada pending sync (untuk inisialisasi warna dot)
 */
export async function hasPendingCloudSync(sceneId) {
    const scene = await db.scenes.get(sceneId);
    if (!scene || !scene.entities) return false;
    
    // some() lebih cepat dari filter() karena berhenti saat nemu satu
    return scene.entities.some(e => e._isDirty); 
}