// src/modules/engine/composables/sync/useEngineToEditor.js
import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEngineToEditor(sceneStore) {
  
  const listen = () => {
    EngineBridge.onEntityModified((engineEntities) => {
      if (!Array.isArray(engineEntities)) return;
      engineEntities.forEach((engEnt) => {
        const id = engEnt._id || engEnt.id;
        const t = engEnt.components.Transform;
        if (t) {
          const payload = {
            x: t.x, y: t.y,
            width: t.width, height: t.height,
            rotation: t.rotation,
            scaleX: t.scaleX, scaleY: t.scaleY,
            pivotX: t.pivotX, pivotY: t.pivotY
          };
          sceneStore.syncTransformFromEngine(id, payload);
        }
      });
    });

    EngineBridge.onTilemapDataUpdated((payload) => {
        if(payload && payload.entityId && payload.newData) {
            sceneStore.syncTilemapDataFromEngine(payload.entityId, payload.newData);
        }
    });
  };

  return { listen };
}