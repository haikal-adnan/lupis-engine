// src/modules/engine/composables/useEngineSync.js
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEngineSync() {
  const sceneStore = useSceneStore();

  const initSync = () => {
    // Listener untuk setiap Action di SceneStore
    sceneStore.$onAction(({ name, store, args, after, onError }) => {
      
      after((result) => {
        // 'result' adalah nilai return dari action (entity baru, layer baru, dll)
        
        switch (name) {
          // --- Entity Sync ---
          case 'createEntity':
            // Asumsi action createEntity mereturn object entity baru
            if (result) EngineBridge.createEntity(result);
            break;

          case 'updateEntityName':
            EngineBridge.updateEntityName(args[0], args[1]);
            break;

          case 'deleteEntity':
            EngineBridge.deleteEntity(args[0]);
            break;

          case 'moveEntity':
            // args[0]: draggedId, args[1]: context
            EngineBridge.moveEntity({ id: args[0], context: args[1] });
            break;

          // --- Layer Sync ---
          case 'addLayer':
            if (result) EngineBridge.addLayer(result);
            break;

          case 'updateLayerName':
            EngineBridge.updateLayerName(args[0], args[1]);
            break;

          case 'deleteLayer':
            EngineBridge.deleteLayer(args[0]);
            break;

          case 'reorderLayer':
             // args[0]: draggedId, args[1]: targetId, args[2]: position
             EngineBridge.reorderLayer({ 
                id: args[0], 
                targetId: args[1], 
                position: args[2] 
             });
             break;
        }
      });

      onError((error) => {
        console.error(`[Sync] Action ${name} failed:`, error);
      });
    });

    console.log("[Sync] Initialized Pinia-to-Engine Sync");
  };

  return { initSync };
}