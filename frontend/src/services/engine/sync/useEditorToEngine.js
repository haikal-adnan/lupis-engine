import { EngineBridge } from "@/services/engine/EngineBridge.js";

/**
 * Menangani update DARI Editor (Pinia) KE Engine
 * Menggunakan format Partial Object Payload agar efisien.
 */
export function useEditorToEngine(sceneStore, assetStore, editorStore) {

  const listen = () => {
    // --- SCENE STORE LISTENER ---
    sceneStore.$onAction(({ name, args, after, onError }) => {
      after((result) => {
        // PERINGATAN: Jangan masukkan 'syncTransformFromEngine' disini
        switch (name) {
          case 'createEntity':
            if (result) EngineBridge.createEntity(result);
            break;
          case 'deleteEntity':
            EngineBridge.deleteEntity(args[0]);
            break;
          case 'updateEntityName':
            EngineBridge.updateEntityName(args[0], args[1]);
            break;
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

    // --- EDITOR STORE LISTENER (UPDATED) ---
    editorStore.$onAction(({ name, args, after }) => {
      after(() => {
        switch (name) {
          // 1. Kirim Active Tab sebagai object { activeTabId: ... }
          case 'setActiveTab':
            console.log("ini halan")
            EngineBridge.updateEditorState({ 
                activeTabId: args[0] 
            });
            break;


          // 2. Kirim Active Tool sebagai object { activeTool: ... }
          case 'setTool':
            EngineBridge.updateEditorState({ 
                activeTool: args[0] 
            });
            break;

          // 3. Kirim Tilemap Opacity sebagai Nested Object
          // Payload: { tilemapContext: { opacity: 0.5 } }
          case 'setContextOpacity':
            EngineBridge.updateEditorState({
              tilemapContext: { 
                opacity: args[0] // Nilai opacity baru
              }
            });
            break;

          // 4. Kirim Visibility sebagai Nested Object
          // Karena ini toggle (tidak ada args), kita ambil value dari store state
          case 'toggleContextVisibility':
            EngineBridge.updateEditorState({
              tilemapContext: {
                showOthers: editorStore.tilemapContext.showOthers
              }
            });
            break;

          case 'toggleGrid':
          case 'toggleMagnet':
          case 'setGridSize':
             // Kirim seluruh object gridContext agar sinkron
             EngineBridge.updateEditorState({
                gridContext: { ...editorStore.gridContext }
             });
             break;
          case 'setTileSelection':
          case 'clearTileSelection':
            EngineBridge.updateEditorState({
              tileSelection: editorStore.tileSelection
            });
            break;
        }
      });
    });
  };

  return { listen };
}