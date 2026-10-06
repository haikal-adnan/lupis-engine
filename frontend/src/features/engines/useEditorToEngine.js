import { engineBridge } from "@engines/engines.js";

const ENABLE_LOGGING = false;

const log = (message, style, data = "") => {
  if (ENABLE_LOGGING) {
    console.log(message, style, data);
  }
};

export function useEditorToEngine(projectStore, sceneStore, assetStore, workspaceStore, scriptStore, prefabStore) {

  const listen = () => {
    
    projectStore.$onAction(({ name, args, after, onError }) => {
      after(() => {
        const s = projectStore.project?.settings;
        if (!s) return;

        switch (name) {
          case 'toggleGrid': engineBridge.updateProjectSettings({ grid: { visible: s.grid.visible } }); break;
          case 'toggleMagnet': engineBridge.updateProjectSettings({ grid: { snap: s.grid.snap } }); break;
          case 'setGridSize': engineBridge.updateProjectSettings({ grid: { width: s.grid.width, height: s.grid.height } }); break;
          case 'setGridColor': engineBridge.updateProjectSettings({ grid: { color: s.grid.color } }); break;
          case 'setGridOpacity': engineBridge.updateProjectSettings({ grid: { opacity: s.grid.opacity } }); break;
          
          case 'setTickRate': engineBridge.updateProjectSettings({ tickRate: s.tickRate }); break;
          
          case 'toggleUIBorder': engineBridge.updateProjectSettings({ ui: { showUIBorder: s.ui.showUIBorder } }); break;
          case 'updateUISettings': engineBridge.updateProjectSettings({ ui: args[0] }); break;
          case 'updateCameraSettings': engineBridge.updateProjectSettings({ camera: args[0] }); break;
        }
      });
      onError((err) => console.error(`[Sync] Error on ProjectStore ${name}:`, err));
    });

    sceneStore.$onAction(({ name, args, after, onError }) => {
      log(`%c[SceneStore] Action: ${name}`, "color: #4CAF50; font-weight: bold;", { args });
      
      after((result) => {
        
        if (result === false) return;

        const s = sceneStore.activeScene?.settings;
        
        switch (name) {
          case 'setBackgroundColor': 
            if(s) engineBridge.updateSceneSettings({ backgroundColor: s.backgroundColor }); 
            break;
          case 'updateWorldBounds':
            engineBridge.updateSceneSettings({ worldBounds: args[0] });
            break;
          case 'updatePhysicsSettings':
            engineBridge.updateSceneSettings({ physics: args[0] });
            break;
          case 'toggleRulers': 
            if(s) engineBridge.updateSceneSettings({ showRulers: s.showRulers }); 
            break;

          case 'clearSelection':
              engineBridge.clearSelection();
              break;

          case 'createEntity': if (result) engineBridge.createEntity(result); break;
          case 'deleteEntity': engineBridge.deleteEntity(args[0]); break;
          case 'updateEntityName': engineBridge.updateEntityName(args[0], args[1]); break;
          case 'moveEntity': 
            engineBridge.moveEntity({ 
                id: args[0], 
                parentId: args[1].newParentId, 
                layerId: args[1].newLayerId 
            }); 
            break;
          case 'updateComponentProp': if (result) engineBridge.updateComponentProp(result); break;
          case 'updateEntityProp': if (result) engineBridge.updateEntityProp(result); break;
          case 'updateLayerProp': engineBridge.updateLayerProp(args[0], args[1], args[2]); break;
          case 'addComponent': if (result) engineBridge.addComponent(result); break;
          case 'removeComponent': engineBridge.removeComponent({ entityId: args[0], componentName: args[1] }); break;
          case 'patchComponent': engineBridge.patchComponent({ entityId: args[0], componentName: args[1], updates: args[2] }); break;

          case 'addLayer': if (result) engineBridge.addLayer(result); break;
          case 'updateLayerName': engineBridge.updateLayerName(args[0], args[1]); break;
          case 'deleteLayer': engineBridge.deleteLayer(args[0]); break;
          case 'reorderLayer': engineBridge.reorderLayer({ id: args[0], targetId: args[1], position: args[2] }); break;
        }
      });
      onError((err) => console.error(`[Sync] Error on ${name}:`, err));
    });

    assetStore.$onAction(({ name, args, after }) => {
      log(`%c[AssetStore] Action: ${name}`, "color: #2196F3; font-weight: bold;", { args });
      after(() => {
        switch (name) {
          case 'addAsset': if (args[0]) engineBridge.createAsset(args[0]); break;
          case 'removeAsset': engineBridge.deleteAsset(args[0]); break;
        }
      });
    });

    workspaceStore.$onAction(({ name, args, after }) => {
      log(`%c[WorkspaceStore] Action: ${name}`, "color: #FF9800; font-weight: bold;", { args });
      after(() => {
        switch (name) {
          case 'setActiveTab': engineBridge.updateEditorState({ activeTabId: args[0] }); break;
          case 'openTab':
          case 'closeTab': engineBridge.updateEditorState({ tabs: JSON.parse(JSON.stringify(workspaceStore.tabs)) }); break;
          case 'setTool': engineBridge.updateEditorState({ activeTool: args[0] }); break;
          case 'setContextOpacity': engineBridge.updateEditorState({ tilemapContext: { opacity: args[0] } }); break;
          case 'toggleContextVisibility': engineBridge.updateEditorState({ tilemapContext: { showOthers: workspaceStore.tilemapContext.showOthers } }); break;
          case 'setTileSelection':
          case 'clearTileSelection': engineBridge.updateEditorState({ tileSelection: workspaceStore.tileSelection }); break;
        }
      });
    });

    scriptStore.$onAction(({ name, args, after }) => {
      log(`%c[ScriptStore] Action: ${name}`, "color: #9C27B0; font-weight: bold;", { args });
      after((result) => {
        switch (name) {
          case 'addScript': 
            if (args[0]) engineBridge.createScript(args[0]); 
            break;
          case 'updateScriptInList': 
            engineBridge.updateScript(args[0], args[1]); 
            break;
          case 'removeScript': 
            engineBridge.deleteScript(args[0]); 
            break;
          case 'saveActiveScript': 
            if (scriptStore.activeScript) {
              engineBridge.updateScript(scriptStore.activeScript.id, {
                nodes: scriptStore.activeScript.nodes,
                edges: scriptStore.activeScript.edges,
                localVariables: scriptStore.activeScript.localVariables
              });
            }
            break;
        }
      });
    });

    prefabStore.$onAction(({ name, args, after }) => {
      log(`%c[PrefabStore] Action: ${name}`, "color: #E91E63; font-weight: bold;", { args });
      after(() => {
        switch (name) {
          case 'addPrefab': engineBridge.createPrefab(args[0]); break;
          case 'updatePrefab': engineBridge.updatePrefab(args[0], args[1]); break;
          case 'updateComponentProp': engineBridge.updatePrefab(args[0], null); break;
          case 'removePrefab': engineBridge.deletePrefab(args[0]); break;
        }
      });
    });

  };

  return { listen };
}