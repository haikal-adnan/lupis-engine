import { bus } from "./EventBus.js";

export function SyncHierarchyComponents(game) {
    if (!game || !game.world) {
        console.error("❌ SyncHierarchy: Game or World not initialized");
        return;
    }

    // Listener: Update Struktur Hierarki (Parent/Layer/ZIndex)
    bus.on("entity:update-hierarchy", (payload) => {
        const { _id, parentId, layerId, transform } = payload;
        
        // SEKARANG FUNGSI INI SUDAH ADA DI WORLD
        const entity = game.world.getEntityById(_id); 

        if (entity) {
            console.log(`⚙️ Engine: Sync Hierarchy for [${entity.name}]`);

            // 1. Update Data Parent
            entity.parentId = parentId;

            // 2. Update Layer (Pindah Array Layer jika perlu)
            if (layerId && entity.layer !== layerId) {
                // Hapus dari layer lama
                const oldLayer = game.world.layers.get(entity.layer);
                if (oldLayer) {
                    const idx = oldLayer.indexOf(entity);
                    if (idx > -1) oldLayer.splice(idx, 1);
                }
                
                // Masukkan ke layer baru
                entity.layer = layerId;
                if (!game.world.layers.has(layerId)) game.world.layers.set(layerId, []);
                game.world.layers.get(layerId).push(entity);
            }

            // 3. Update Z-Index
            if (transform && transform.zIndex !== undefined) {
                if (!entity.transform) entity.transform = {};
                entity.transform.zIndex = transform.zIndex;
            }

            // 4. Sort Ulang agar tampilan visual di Canvas berubah
            if (game.world.sortEntities) {
                game.world.sortEntities();
            }
        } else {
            console.warn(`⚠️ Engine: Entity ${_id} not found for hierarchy update`);
        }
    });
}