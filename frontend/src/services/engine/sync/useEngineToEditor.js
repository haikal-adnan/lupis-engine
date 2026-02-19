import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEngineToEditor(sceneStore) {
  
  const listen = () => {
    // Listener: Menerima array entities yang dimodifikasi dari SyncComponent
    EngineBridge.onEntityModified((engineEntities) => {
      if (!Array.isArray(engineEntities) || engineEntities.length === 0) return;
      
      // Batch update ke Vue store
      engineEntities.forEach((engEnt) => {
        const rawId = engEnt._id || engEnt.id;
        if (!rawId) return;
        
        const id = String(rawId); 
        const comps = engEnt.components;

        if (!comps) return;

        // --- SYNC TRANSFORM (X, Y, WIDTH, HEIGHT) ---
        // Ini menangani update Group (W/H) dan update Child (X/Y)
        const t = comps.Transform || comps.UITransform;
        const compName = comps.UITransform ? 'UITransform' : 'Transform';
        
        if (t) {
          const payload = {
            x: t.x, 
            y: t.y,
            width: t.width,    // Group width yang baru dihitung
            height: t.height,  // Group height yang baru dihitung
            rotation: t.rotation,
            scaleX: t.scaleX, 
            scaleY: t.scaleY,
            pivotX: t.pivotX, 
            pivotY: t.pivotY,
            flipX: t.flipX ?? false,
            flipY: t.flipY ?? false,
            isRatioLocked: t.isRatioLocked ?? false,
            isOverridden: t.isOverridden ?? false
          };

          if (t.anchorX !== undefined) payload.anchorX = t.anchorX;
          if (t.anchorY !== undefined) payload.anchorY = t.anchorY;

          // Kirim ke SceneStore
          // Pastikan di scenestore action ini melakukan patch/merge ke state entity
          sceneStore.syncTransformFromEngine(id, payload);
          
          if (t.isOverridden) {
             sceneStore.updateComponentProp(id, compName, 'isOverridden', true);
          }
        }
      });
    });

    // ... listener lain (tilemap, tool pickup, dll)
    EngineBridge.onTilemapDataUpdated((payload) => {
        if(payload && payload.entityId && payload.newData) {
            sceneStore.syncTilemapDataFromEngine(payload.entityId, payload.newData);
        }
    });
  };

  return { listen };
}