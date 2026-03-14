import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEngineToEditor(sceneStore) {
  
  const listen = () => {
    EngineBridge.onEntityModified((engineEntities) => {
      if (!Array.isArray(engineEntities) || engineEntities.length === 0) return;
      
      engineEntities.forEach((engEnt) => {
        const rawId = engEnt._id || engEnt.id;
        if (!rawId) return;
        
        const id = String(rawId); 
        const comps = engEnt.components;

        if (!comps) return;

        const t = comps.Transform || comps.UITransform;
        const compName = comps.UITransform ? 'UITransform' : 'Transform';
        
        if (t) {
          const payload = {
            x: t.x, 
            y: t.y,
            width: t.width,    
            height: t.height, 
            rotation: t.rotation,
            scaleX: t.scaleX, 
            scaleY: t.scaleY,
            pivotX: t.pivotX, 
            pivotY: t.pivotY,
            flipX: t.flipX ?? false,
            flipY: t.flipY ?? false,
            isRatioLocked: t.isRatioLocked ?? false,
            overridden: t.overridden ?? false
          };

          if (t.anchorX !== undefined) payload.anchorX = t.anchorX;
          if (t.anchorY !== undefined) payload.anchorY = t.anchorY;

          sceneStore.syncTransformFromEngine(id, payload);
          
          if (t.overridden) {
             sceneStore.updateComponentProp(id, compName, 'overridden', true);
          }
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