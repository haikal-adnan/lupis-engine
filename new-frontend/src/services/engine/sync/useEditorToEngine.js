// src/modules/engine/composables/sync/useEditorToEngine.js
import { EngineBridge } from "@/services/engine/EngineBridge.js";

/**
 * Menangani update DARI Editor (Pinia) KE Engine
 * Contoh: Input field change, Drag & Drop hierarchy
 */
export function useEditorToEngine(sceneStore, assetStore) {

  const listen = () => {
    // --- SCENE STORE LISTENER ---
    sceneStore.$onAction(({ name, args, after, onError }) => {
      after((result) => {
        // PERINGATAN: Jangan masukkan 'syncTransformFromEngine' disini (Loop Hazard)
        
        switch (name) {
          // Entity Lifecycle
          case 'createEntity':
            if (result) EngineBridge.createEntity(result);
            break;
          case 'deleteEntity':
            EngineBridge.deleteEntity(args[0]);
            break;
          case 'updateEntityName':
            EngineBridge.updateEntityName(args[0], args[1]);
            break;

          // Hierarchy & Layering
          case 'moveEntity':
            EngineBridge.moveEntity({ id: args[0], context: args[1] });
            break;
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
            EngineBridge.reorderLayer({ id: args[0], targetId: args[1], position: args[2] });
            break;

          // Properties (Inspector)
          case 'updateComponentProp':
            if (result) EngineBridge.updateComponentProp(result);
            break;
          case 'updateEntityProp':
            if (result) EngineBridge.updateEntityProp(result);
            break;
        }
      });

      onError((error) => console.error(`[Sync-Outgoing] Error on ${name}:`, error));
    });

    // --- ASSET STORE LISTENER ---
    assetStore.$onAction(({ name, args, after }) => {
      after(() => {
        switch (name) {
          case 'addAsset':
            if (args[0]) EngineBridge.createAsset(args[0]);
            break;
          case 'removeAsset':
            EngineBridge.deleteAsset(args[0]);
            break;
        }
      });
    });
  };

  return { listen };
}