// /**
//  * DUMMY IMPLEMENTATION
//  * Menggantikan fungsi IndexedDB asli agar aplikasi bisa jalan hanya dengan Pinia/API.
//  */

// export function useLocalDB() {
    
//     // 1. Init selalu berhasil
//     const initDB = async () => {
//         console.warn("⚠️ [MockDB] Running in Memory-Only mode (IndexedDB Disabled)");
//         return true; 
//     };

//     // 2. Selalu return NULL agar EngineBootstrapper mengambil data dari Pinia/API
//     const getSceneFromLocal = async (sceneId) => {
//         console.log(`🔎 [MockDB] Skipping local lookup for scene: ${sceneId}`);
//         return null; 
//     };

//     // 3. Pura-pura menyimpan data (hanya log console)
//     const hydrateFromBackend = async (payload) => {
//         // Kita tidak menyimpan apa-apa, karena ini dummy.
//         // Payload tetap ada di memori (Pinia) untuk sesi ini.
//         console.log("💾 [MockDB] 'hydrateFromBackend' called. Data not persisted.");
//         // console.log(payload); // Uncomment jika ingin melihat struktur data
//         return true;
//     };

//     return {
//         initDB,
//         getSceneFromLocal,
//         hydrateFromBackend
//     };
// }


// // import { db } from "@/services/db/index.js";

// // /**
// //  * Menyimpan data bersih (Normalized Data) ke IndexedDB sebagai cache offline.
// //  * Dipanggil setelah project berhasil di-load dan dinormalisasi di Store.
// //  * @param {Object} normalizedData { project, scenes, assets, prefabs }
// //  */
// // export async function initLocalDB(normalizedData) {
// //     // Clone untuk menghilangkan reactivity Vue (Proxy)
// //     const data = JSON.parse(JSON.stringify(normalizedData));

// //     console.log("💾 [DB] Initializing Local DB with normalized data...");

// //     await db.transaction('rw', db.projects, db.assets, db.scenes, async () => {
        
// //         // 1. Project (Sekarang pakai 'id')
// //         if (data.project) {
// //             await db.projects.put(data.project);
// //         }

// //         // 2. Assets (Server Assets)
// //         // Note: Asset lokal yang punya blob tidak ditimpa di sini agar Blob tidak hilang,
// //         // karena data dari server (API) tidak membawa Blob.
// //         if (data.assets && Array.isArray(data.assets)) {
// //             // Kita hanya simpan asset yang datang dari server (yg punya fileUrl http)
// //             // Atau update metadata asset lokal jika perlu.
// //             // Untuk simplifikasi FASE 1: Kita bulkPut semua, tapi hati-hati menimpa localBlob.
            
// //             const serverAssets = data.assets.map(a => ({
// //                 ...a,
// //                 isSynced: true // Asumsi yang datang dari loadProject adalah synced
// //             }));
            
// //             // Gunakan bulkPut agar performa cepat
// //             await db.assets.bulkPut(serverAssets);
// //         }

// //         // 3. Scenes
// //         if (data.scenes && Array.isArray(data.scenes)) {
// //             const scenesToSave = data.scenes.map(scene => {
// //                 const cleanEntities = (scene.entities || []).map(e => ({
// //                     ...e,
// //                     _isDirty: false // Reset flag dirty saat init awal
// //                 }));

// //                 return {
// //                     ...scene,
// //                     entities: cleanEntities
// //                 };
// //             });

// //             await db.scenes.bulkPut(scenesToSave);
// //         }
// //     });
    
// //     console.log("✅ [DB] Local DB Synced.");
// // }

// // /**
// //  * Menyimpan entities yang berubah ke IndexedDB
// //  * @param {string} sceneId 
// //  * @param {Array} dirtyEntitiesData 
// //  */
// // export async function updateSceneEntities(sceneId, dirtyEntitiesData) {
// //     if (!dirtyEntitiesData || dirtyEntitiesData.length === 0) return;

// //     await db.transaction('rw', db.scenes, async () => {
// //         const scene = await db.scenes.get(sceneId);
// //         if (!scene) return;

// //         // Map menggunakan _id entity
// //         const updateMap = new Map(dirtyEntitiesData.map(e => [e._id, e]));

// //         const updatedEntities = scene.entities.map(entity => {
// //             if (updateMap.has(entity._id)) {
// //                 return { 
// //                     ...entity, 
// //                     ...updateMap.get(entity._id), 
// //                     _isDirty: true 
// //                 };
// //             }
// //             return entity;
// //         });

// //         await db.scenes.update(sceneId, { entities: updatedEntities });
// //     });
// // }

// // /**
// //  * Mengambil entities yang memiliki flag _isDirty = true
// //  */
// // export async function getDirtyEntities(sceneId) {
// //     const scene = await db.scenes.get(sceneId);
// //     if (!scene || !scene.entities) return [];
    
// //     return scene.entities.filter(e => e._isDirty);
// // }

// // /**
// //  * Menandai entities sebagai sudah tersinkron (Clean)
// //  */
// // export async function markSceneAsSynced(sceneId) {
// //     await db.transaction('rw', db.scenes, async () => {
// //         const scene = await db.scenes.get(sceneId);
// //         if (!scene) return;

// //         const cleanEntities = scene.entities.map(e => {
// //             if (e._isDirty) {
// //                 // eslint-disable-next-line no-unused-vars
// //                 const { _isDirty, ...clean } = e;
// //                 return clean;
// //             }
// //             return e;
// //         });

// //         await db.scenes.update(sceneId, { entities: cleanEntities });
// //     });
// // }

// // export async function hasPendingCloudSync(sceneId) {
// //     const scene = await db.scenes.get(sceneId);
// //     if (!scene || !scene.entities) return false;
// //     return scene.entities.some(e => e._isDirty); 
// // }