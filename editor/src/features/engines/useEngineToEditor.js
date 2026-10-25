import { engineBridge } from "@engines/engines.js";
import { useTilemapHistory } from "@historys/historys.js";
import { useEntityActions } from "@scenes/scenes.js";

// Coalescing state for frame-boundary batching
const pendingTransforms = new Map();
const pendingShapeUpdates = new Map();
const pendingTextUpdates = new Map();
let rafId = null;

const isTestEnvironment = () => {
  return typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST);
};

export function flushPendingEngineUpdates(sceneStore) {
  if (rafId) {
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  }

  if (pendingTransforms.size === 0 && pendingShapeUpdates.size === 0 && pendingTextUpdates.size === 0) {
    return;
  }

  const { updateComponentProp } = useEntityActions();

  // 1. Flush transforms & UITransforms
  pendingTransforms.forEach(({ payload, isOverridden, compName }, id) => {
    sceneStore.syncTransformFromEngine(id, payload);
    if (isOverridden) {
      updateComponentProp(id, compName, 'overridden', true);
    }
  });
  pendingTransforms.clear();

  // 2. Flush ShapeRenderer elements
  pendingShapeUpdates.forEach((elements, id) => {
    updateComponentProp(id, 'ShapeRenderer', 'elements', elements);
  });
  pendingShapeUpdates.clear();

  // 3. Flush TextRenderer fontSize
  pendingTextUpdates.forEach((fontSize, id) => {
    const cur = sceneStore.activeScene?.entities?.find(e => String(e.id) === String(id));
    const curFontSize = cur?.components?.TextRenderer?.fontSize;
    if (curFontSize !== undefined && curFontSize !== fontSize) {
      sceneStore.updateComponentData(id, 'TextRenderer', { fontSize });
    }
  });
  pendingTextUpdates.clear();
}

export function clearPendingEngineUpdates() {
  if (rafId && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId);
  }
  rafId = null;
  pendingTransforms.clear();
  pendingShapeUpdates.clear();
  pendingTextUpdates.clear();
}

export function useEngineToEditor(sceneStore) {
  const tilemapHistory = useTilemapHistory();
  
  const listen = () => {
    engineBridge.onEntityModified((engineEntities) => {
      const list = Array.isArray(engineEntities) ? engineEntities : (engineEntities ? [engineEntities] : []);
      if (list.length === 0) return;
      
      list.forEach((engEnt) => {
        const rawId = engEnt.id;
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

          pendingTransforms.set(id, {
            payload,
            isOverridden: !!t.overridden,
            compName
          });
        }

        if (comps.ShapeRenderer && comps.ShapeRenderer.elements !== undefined) {
          pendingShapeUpdates.set(id, comps.ShapeRenderer.elements);
        }

        if (comps.TextRenderer && comps.TextRenderer.fontSize !== undefined) {
          pendingTextUpdates.set(id, comps.TextRenderer.fontSize);
        }
      });

      // Synchronize to store: immediate in test environment, or coalesced via rAF in browser
      if (isTestEnvironment()) {
        flushPendingEngineUpdates(sceneStore);
      } else if (!rafId && typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(() => flushPendingEngineUpdates(sceneStore));
      } else if (typeof requestAnimationFrame !== 'function') {
        flushPendingEngineUpdates(sceneStore);
      }
    });

    engineBridge.onTilemapDataUpdated((payload) => {
      if (payload && payload.entityId && payload.newData) {
        const { syncTilemapDataFromEngine } = useEntityActions();
        syncTilemapDataFromEngine(payload.entityId, payload.newData);
        if (payload.oldData && JSON.stringify(payload.oldData) !== JSON.stringify(payload.newData)) {
          tilemapHistory.recordTilemapDataChange(
            payload.entityId,
            payload.oldData,
            payload.newData,
            payload.description || 'Update Tilemap'
          );
        }
      }
    });
  };

  return {
    listen,
    flush: () => flushPendingEngineUpdates(sceneStore)
  };
}