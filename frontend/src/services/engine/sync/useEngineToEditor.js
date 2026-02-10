import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEngineToEditor(sceneStore) {
  
  const listen = () => {
    EngineBridge.onEntityModified((engineEntities) => {
      if (!Array.isArray(engineEntities)) return;
      
      engineEntities.forEach((engEnt) => {
        const rawId = engEnt._id || engEnt.id;
        if (!rawId) return;
        
        const id = String(rawId); 
        const comps = engEnt.components;

        // --- 1. SYNC TRANSFORM ---
        const t = comps.Transform || comps.UITransform;
        
        if (t) {
          const payload = {
            x: t.x, y: t.y,
            width: t.width, height: t.height,
            rotation: t.rotation,
            scaleX: t.scaleX, scaleY: t.scaleY,
            pivotX: t.pivotX, pivotY: t.pivotY,
            flipX: t.flipX ?? false,
            flipY: t.flipY ?? false,
            isRatioLocked: t.isRatioLocked ?? false
          };

          if (t.anchorX !== undefined) payload.anchorX = t.anchorX;
          if (t.anchorY !== undefined) payload.anchorY = t.anchorY;

          sceneStore.syncTransformFromEngine(id, payload);
        }

        if (comps.SpriteRenderer) {
            sceneStore.syncComponentFromEngine(id, 'SpriteRenderer', {
                assetId: comps.SpriteRenderer.assetId,
                color: comps.SpriteRenderer.color,
                opacity: comps.SpriteRenderer.opacity,
                sourceX: comps.SpriteRenderer.sourceX,
                sourceY: comps.SpriteRenderer.sourceY,
                sourceWidth: comps.SpriteRenderer.sourceWidth,
                sourceHeight: comps.SpriteRenderer.sourceHeight
            });
        }

        // --- 3. SYNC TEXT RENDERER ---
        if (comps.TextRenderer) {
            sceneStore.syncComponentFromEngine(id, 'TextRenderer', {
                value: comps.TextRenderer.value,
                fontSize: comps.TextRenderer.fontSize,
                color: comps.TextRenderer.color,
                align: comps.TextRenderer.align,
                assetId: comps.TextRenderer.assetId,
                opacity: comps.TextRenderer.opacity
            });
        }

        // --- 4. SYNC SHAPE RENDERER ---
        if (comps.ShapeRenderer) {
            sceneStore.syncComponentFromEngine(id, 'ShapeRenderer', {
                type: comps.ShapeRenderer.type,
                color: comps.ShapeRenderer.color,
                width: comps.ShapeRenderer.width,
                height: comps.ShapeRenderer.height,
                thickness: comps.ShapeRenderer.thickness,
                opacity: comps.ShapeRenderer.opacity
            });
        }

        // --- 5. SYNC TILEMAP (Metadata) ---
        if (comps.Tilemap) {
            sceneStore.syncComponentFromEngine(id, 'Tilemap', {
                tileWidth: comps.Tilemap.tileWidth,
                tileHeight: comps.Tilemap.tileHeight,
                width: comps.Tilemap.width,
                height: comps.Tilemap.height,
                assetId: comps.Tilemap.assetId,
                opacity: comps.Tilemap.opacity,
                isSolid: comps.Tilemap.isSolid
            });
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