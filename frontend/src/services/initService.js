import { db } from "@/db/index.js";

export async function initLocalDB(serverData) {
    // 1. Strip Vue Reactivity (Wajib untuk Dexie)
    const rawData = JSON.parse(JSON.stringify(serverData));

    await db.transaction('rw', db.projects, db.assets, db.scenes, async () => {
        
        // 1. Project
        if (rawData.project) {
            await db.projects.put({ ...rawData.project });
        }

        // 2. Assets
        if (rawData.assets && Array.isArray(rawData.assets)) {
            for (const asset of rawData.assets) {
                await db.assets.put({
                    ...asset,
                    isSynced: true,
                    localBlob: null
                });
            }
        }

        // 3. Scenes
        if (rawData.scenes && Array.isArray(rawData.scenes)) {
            for (const scene of rawData.scenes) {
                
                // --- PERBAIKAN DI SINI ---
                // Pastikan scene.entities ada. Jika undefined, pakai []
                const sourceEntities = scene.entities || []; 

                const cleanEntities = sourceEntities.map(e => ({
                    ...e, 
                    _isDirty: false
                }));
                
                await db.scenes.put({
                    ...scene,
                    entities: cleanEntities
                });
            }
        }
    });
}