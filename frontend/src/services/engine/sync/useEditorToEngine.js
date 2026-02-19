import { EngineBridge } from "@/services/engine/EngineBridge.js";

export function useEditorToEngine(sceneStore, assetStore, editorStore, scriptStore, prefabStore) {

  const listen = () => {
    
    // --- SCENE STORE ---
    sceneStore.$onAction(({ name, args, after, onError }) => {
      console.log(`%c[SceneStore] Action: ${name}`, "color: #4CAF50; font-weight: bold;", { args });
      
      after((result) => {
        const s = sceneStore.activeScene?.settings;
        if (!s) return;

        switch (name) {
          case 'toggleGrid': 
              EngineBridge.updateSceneSettings({ grid: { visible: s.grid.visible } }); 
              break;
          case 'toggleMagnet': 
              EngineBridge.updateSceneSettings({ grid: { snap: s.grid.snap } }); 
              break;
          case 'setGridSize': 
              EngineBridge.updateSceneSettings({ grid: { width: s.grid.width, height: s.grid.height } }); 
              break;
          case 'setGridColor': 
              EngineBridge.updateSceneSettings({ grid: { color: s.grid.color } }); 
              break;
          case 'setGridOpacity': 
              EngineBridge.updateSceneSettings({ grid: { opacity: s.grid.opacity } }); 
              break;

          case 'setBackgroundColor': 
              EngineBridge.updateSceneSettings({ backgroundColor: s.backgroundColor }); 
              break;
          case 'setTickRate': 
              EngineBridge.updateSceneSettings({ tickRate: s.tickRate }); 
              break;
          
          case 'updateWorldBounds':
              EngineBridge.updateSceneSettings({ worldBounds: args[0] });
              break;

          case 'updatePhysicsSettings':
              EngineBridge.updateSceneSettings({ physics: args[0] });
              break;

          case 'toggleRulers': 
              EngineBridge.updateSceneSettings({ showRulers: s.showRulers }); 
              break;

          case 'toggleUIBorder':
              if (s.ui) {
                  EngineBridge.updateSceneSettings({ showUIBorder: s.ui.showUIBorder });
              }
              break;

          case 'updateUISettings':
              EngineBridge.updateSceneSettings({ ui: args[0] });
              break;

          case 'clearSelection':
              EngineBridge.clearSelection();
              break;

          case 'createEntity': if (result) EngineBridge.createEntity(result); break;
          case 'deleteEntity': EngineBridge.deleteEntity(args[0]); break;
          case 'updateEntityName': EngineBridge.updateEntityName(args[0], args[1]); break;
          case 'moveEntity': 
            EngineBridge.moveEntity({ 
                id: args[0], 
                parentId: args[1].newParentId, 
                layerId: args[1].newLayerId 
            }); 
            break;
          case 'updateComponentProp': if (result) EngineBridge.updateComponentProp(result); break;
          case 'updateEntityProp': if (result) EngineBridge.updateEntityProp(result); break;
          case 'addComponent': if (result) EngineBridge.addComponent(result); break;
          case 'removeComponent': EngineBridge.removeComponent({ entityId: args[0], componentName: args[1] }); break;
          case 'patchComponent': EngineBridge.patchComponent({ entityId: args[0], componentName: args[1], updates: args[2] }); break;

          case 'addLayer': if (result) EngineBridge.addLayer(result); break;
          case 'updateLayerName': EngineBridge.updateLayerName(args[0], args[1]); break;
          case 'deleteLayer': EngineBridge.deleteLayer(args[0]); break;
          case 'reorderLayer': EngineBridge.reorderLayer({ id: args[0], targetId: args[1], position: args[2] }); break;
        }
      });
      onError((err) => console.error(`[Sync] Error on ${name}:`, err));
    });

    // --- ASSET STORE ---
    assetStore.$onAction(({ name, args, after }) => {
      console.log(`%c[AssetStore] Action: ${name}`, "color: #2196F3; font-weight: bold;", { args });
      
      after(() => {
        switch (name) {
          case 'addAsset': if (args[0]) EngineBridge.createAsset(args[0]); break;
          case 'removeAsset': EngineBridge.deleteAsset(args[0]); break;
        }
      });
    });

    // --- EDITOR STORE ---
    editorStore.$onAction(({ name, args, after }) => {
      console.log(`%c[EditorStore] Action: ${name}`, "color: #FF9800; font-weight: bold;", { args });
      
      after(() => {
        switch (name) {
          case 'setActiveTab': EngineBridge.updateEditorState({ activeTabId: args[0] }); break;
          case 'openTab':
          case 'closeTab': EngineBridge.updateEditorState({ tabs: JSON.parse(JSON.stringify(editorStore.tabs)) }); break;
          case 'setTool': EngineBridge.updateEditorState({ activeTool: args[0] }); break;
          case 'setContextOpacity': EngineBridge.updateEditorState({ tilemapContext: { opacity: args[0] } }); break;
          case 'toggleContextVisibility': EngineBridge.updateEditorState({ tilemapContext: { showOthers: editorStore.tilemapContext.showOthers } }); break;
          case 'setTileSelection':
          case 'clearTileSelection': EngineBridge.updateEditorState({ tileSelection: editorStore.tileSelection }); break;
        }
      });
    });

    // --- SCRIPT STORE ---
    scriptStore.$onAction(({ name, args, after }) => {
      console.log(`%c[ScriptStore] Action: ${name}`, "color: #9C27B0; font-weight: bold;", { args });
      
      after((result) => {
        switch (name) {
          case 'createScript': if (result) EngineBridge.createScript(result); break;
          case 'updateScript': EngineBridge.updateScript(args[0], args[1]); break;
          case 'deleteScript': EngineBridge.deleteScript(args[0]); break;
          case 'saveActiveScript': 
              if (scriptStore.activeScript) {
                  EngineBridge.updateScript(scriptStore.activeScript._id, {
                      nodes: scriptStore.activeScript.nodes,
                      edges: scriptStore.activeScript.edges,
                      exposedVariables: scriptStore.activeScript.exposedVariables
                  });
              }
              break;
        }
      });
    });

    prefabStore.$onAction(({ name, args, after }) => {
      console.log(`%c[PrefabStore] Action: ${name}`, "color: #E91E63; font-weight: bold;", { args });
      after(() => {
        switch (name) {
          case 'addPrefab': EngineBridge.createPrefab(args[0]); break;
          case 'updatePrefab': EngineBridge.updatePrefab(args[0], args[1]); break;
          case 'updateComponentProp': 
              // Jika store mendukung updateComponentProp langsung
              EngineBridge.updatePrefab(args[0], null); 
              break;
          case 'removePrefab': EngineBridge.deletePrefab(args[0]); break;
        }
      });
    });

  };

  return { listen };
}