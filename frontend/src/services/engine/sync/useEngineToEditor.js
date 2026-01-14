// src/modules/engine/composables/sync/useEngineToEditor.js
import { EngineBridge } from "@/services/engine/EngineBridge.js";

/**
 * Menangani update DARI Engine KE Editor (Pinia)
 * Contoh: Gizmo drag, Physics simulation result
 */
export function useEngineToEditor(sceneStore) {
  
  const listen = () => {
    // 1. Listen Transform Changes (Gizmo Drag)
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

          // Panggil Action KHUSUS 'syncTransformFromEngine'
          // Action ini update state tapi tidak mentrigger $onAction 'outgoing'
          sceneStore.syncTransformFromEngine(id, payload);
        }
      });
    });

    // Nanti bisa tambah listener lain disini:
    // EngineBridge.onSelectionChanged(...)
    // EngineBridge.onPlayModeState(...)
  };

  EngineBridge.onTilemapResized((data) => {
        // data: { id, width (cols), height (rows) }
        // Pastikan sceneStore memiliki action 'syncTilemapFromEngine'
        if (sceneStore.syncTilemapFromEngine) {
            sceneStore.syncTilemapFromEngine(data.id, {
                width: data.width,   // Jumlah Kolom
                height: data.height  // Jumlah Baris
            });
        }
    });

  return { listen };
}