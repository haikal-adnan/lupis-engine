import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { engineBridge, useEditorToEngine } from '@engines/engines.js';
import { useProjectStore } from '@projects/projects.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useAssetStore } from '@assets/assets.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptStore } from '@scripts/scripts.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { setupMockOPFS } from '@tests/tests.js';

// Mock UI Composables
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn(() => Promise.resolve(true)) }),
  usePrompt: () => ({ prompt: vi.fn(() => Promise.resolve('TestScript')) })
}));

describe('Integration Test: useEditorToEngine (100% Coverage)', () => {
  let projectStore;
  let sceneStore;
  let assetStore;
  let workspaceStore;
  let scriptStore;
  let prefabStore;

  beforeEach(() => {
    setupMockOPFS();
    setActivePinia(createPinia());

    // Reset and spy all methods on engineBridge, ensure getCameraPosition returns default coordinates
    Object.keys(engineBridge).forEach((key) => {
      if (typeof engineBridge[key] === 'function') {
        if (key === 'getCameraPosition') {
          vi.spyOn(engineBridge, key).mockReturnValue({ x: 0, y: 0 });
        } else {
          vi.spyOn(engineBridge, key).mockImplementation(() => {});
        }
      }
    });

    projectStore = useProjectStore();
    sceneStore = useSceneStore();
    assetStore = useAssetStore();
    workspaceStore = useWorkspaceStore();
    scriptStore = useScriptStore();
    prefabStore = usePrefabStore();

    workspaceStore.setProjectId('proj_test_123');

    projectStore.project = {
      id: 'proj_test_123',
      name: 'Test Project',
      tags: [],
      settings: {
        grid: { visible: true, snap: false, width: 32, height: 32, color: '#ffffff', opacity: 0.5 },
        tickRate: 60,
        ui: { showUIBorder: true },
        camera: { zoom: 1 }
      }
    };

    sceneStore.scenes = [{
      id: 'scene_main_1',
      name: 'Main Scene',
      settings: { backgroundColor: '#1a1a1a', showRulers: true, worldBounds: { x1: -960, x2: 2880, y1: -540, y2: 1620 } },
      layersWorld: [{ id: 'layer_world_1', name: 'Default', orderIndex: 0, zIndex: 0 }],
      layersUI: [{ id: 'layer_ui_1', name: 'UI Layer', orderIndex: 0, zIndex: 0 }],
      entities: []
    }];
    sceneStore.activeSceneId = 'scene_main_1';

    const { listen } = useEditorToEngine(
      projectStore,
      sceneStore,
      assetStore,
      workspaceStore,
      scriptStore,
      prefabStore
    );
    listen();
  });

  /* =========================================================================
   * 1. PROJECT STORE SYNC
   * ========================================================================= */
  describe('ProjectStore Sync', () => {
    it('sends updateProjectSettings when toggleGrid is called', () => {
      projectStore.toggleGrid();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { visible: false } });
    });

    it('sends updateProjectSettings when toggleMagnet is called', () => {
      projectStore.toggleMagnet();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { snap: true } });
    });

    it('sends updateProjectSettings when setGridSize is called', () => {
      projectStore.setGridSize(64, 64);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { width: 64, height: 64 } });
    });

    it('sends updateProjectSettings when setGridColor is called', () => {
      projectStore.setGridColor('#00ff00');
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { color: '#00ff00' } });
    });

    it('sends updateProjectSettings when setGridOpacity is called', () => {
      projectStore.setGridOpacity(0.8);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { opacity: 0.8 } });
    });

    it('sends updateProjectSettings when setTickRate is called', () => {
      projectStore.setTickRate(120);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ tickRate: 120 });
    });

    it('sends updateProjectSettings when toggleUIBorder is called', () => {
      projectStore.toggleUIBorder();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ ui: { showUIBorder: false } });
    });

    it('sends updateProjectSettings when updateUISettings is called', () => {
      projectStore.updateUISettings({ scale: 2 });
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ ui: { scale: 2 } });
    });

    it('sends updateProjectSettings when updateCameraSettings is called', () => {
      projectStore.updateCameraSettings({ zoom: 1.5 });
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ camera: { zoom: 1.5 } });
    });
  });

  /* =========================================================================
   * 2. SCENE STORE SYNC
   * ========================================================================= */
  describe('SceneStore Sync', () => {
    it('sends updateSceneSettings when setBackgroundColor is called', () => {
      sceneStore.setBackgroundColor('#ff0000');
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ backgroundColor: '#ff0000' });
    });

    it('sends updateSceneSettings when updateWorldBounds is called', () => {
      const bounds = { x1: 0, x2: 1000, y1: 0, y2: 1000 };
      sceneStore.updateWorldBounds(bounds);
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ worldBounds: bounds });
    });

    it('sends updateSceneSettings when updatePhysicsSettings is called', () => {
      sceneStore.updatePhysicsSettings({ gravity: 980 });
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ physics: { gravity: 980 } });
    });

    it('sends updateSceneSettings when toggleRulers is called', () => {
      sceneStore.toggleRulers();
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ showRulers: false });
    });

    it('sends clearSelection when clearSelection is called', () => {
      sceneStore.clearSelection();
      expect(engineBridge.clearSelection).toHaveBeenCalled();
    });

    it('sends createEntity when createEntity is called', () => {
      const entity = sceneStore.createEntity('sprite');
      expect(engineBridge.createEntity).toHaveBeenCalledWith(entity);
    });

    it('sends deleteEntity when deleteEntity is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_123', name: 'Player', layerId: 'layer_world_1', components: {} });
      sceneStore.deleteEntity('ent_123');
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_123');
    });

    it('sends updateEntityScriptId when updateEntityScriptId is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_123', scriptId: 'player' });
      sceneStore.updateEntityScriptId('ent_123', 'hero');
      expect(engineBridge.updateEntityScriptId).toHaveBeenCalledWith('ent_123', 'hero');
    });

    it('sends moveEntity when moveEntity is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', layerId: 'layer_world_1', parentId: null });
      sceneStore.moveEntity('ent_1', { newParentId: 'ent_parent', newLayerId: 'layer_world_1' });
      expect(engineBridge.moveEntity).toHaveBeenCalledWith({
        id: 'ent_1',
        parentId: 'ent_parent',
        layerId: 'layer_world_1'
      });
    });

    it('sends updateComponentProp when updateComponentProp is called', () => {
      sceneStore.activeScene.entities.push({
        id: 'ent_1',
        components: { Transform: { x: 0, y: 0 } }
      });
      const res = sceneStore.updateComponentProp('ent_1', 'Transform', 'x', 100);
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith(res);
    });

    it('sends updateEntityProp when updateEntityProp is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', active: true });
      const res = sceneStore.updateEntityProp('ent_1', 'active', false);
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith(res);
    });

    it('sends updateLayerProp when updateLayerProp is called', () => {
      sceneStore.updateLayerProp('layer_world_1', 'visible', false);
      expect(engineBridge.updateLayerProp).toHaveBeenCalledWith('layer_world_1', 'visible', false);
    });

    it('sends addComponent when addComponent is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: {} });
      const res = sceneStore.addComponent('ent_1', 'Physics');
      expect(engineBridge.addComponent).toHaveBeenCalledWith(res);
    });

    it('sends removeComponent when removeComponent is called', async () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: { Physics: {} } });
      await sceneStore.removeComponent('ent_1', 'Physics', false);
      expect(engineBridge.removeComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Physics'
      });
    });

    it('sends patchComponent when patchComponent is called', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: { Transform: { x: 0 } } });
      sceneStore.patchComponent('ent_1', 'Transform', { x: 50 });
      expect(engineBridge.patchComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        updates: { x: 50 }
      });
    });

    it('sends addLayer when addLayer is called', () => {
      const res = sceneStore.addLayer('Background', 'world', false);
      expect(engineBridge.addLayer).toHaveBeenCalledWith(res);
    });

    it('sends updateLayerScriptId when updateLayerScriptId is called', () => {
      sceneStore.updateLayerScriptId('layer_world_1', 'foreground');
      expect(engineBridge.updateLayerScriptId).toHaveBeenCalledWith('layer_world_1', 'foreground');
    });

    it('sends deleteLayer when deleteLayer is called', () => {
      sceneStore.activeScene.layersWorld.push({ id: 'layer_world_2', name: 'Layer 2' });
      sceneStore.deleteLayer('layer_world_2', false);
      expect(engineBridge.deleteLayer).toHaveBeenCalledWith('layer_world_2');
    });

    it('sends reorderLayer when reorderLayer is called', () => {
      sceneStore.activeScene.layersWorld.push({ id: 'layer_world_2', name: 'Layer 2' });
      sceneStore.reorderLayer('layer_world_1', 'layer_world_2', 'bottom');
      expect(engineBridge.reorderLayer).toHaveBeenCalledWith({
        id: 'layer_world_1',
        targetId: 'layer_world_2',
        position: 'bottom'
      });
    });
  });

  /* =========================================================================
   * 3. ASSET STORE SYNC
   * ========================================================================= */
  describe('AssetStore Sync', () => {
    it('sends createAsset when addAsset is called', async () => {
      const assetObj = { id: 'asset_1', fileKey: 'tex1', meta: { extension: '.png' } };
      await assetStore.addAsset(assetObj, new Blob(['']), []);
      expect(engineBridge.createAsset).toHaveBeenCalledWith(assetObj);
    });

    it('sends deleteAsset when removeAsset is called', async () => {
      assetStore.assets = [{ id: 'asset_1', fileKey: 'tex1', meta: { extension: '.png' } }];
      await assetStore.removeAsset('asset_1');
      expect(engineBridge.deleteAsset).toHaveBeenCalledWith('asset_1');
    });
  });

  /* =========================================================================
   * 4. WORKSPACE STORE SYNC
   * ========================================================================= */
  describe('WorkspaceStore Sync', () => {
    it('sends updateEditorState when setActiveTab is called', () => {
      workspaceStore.setActiveTab('scene');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ activeTabId: 'scene' });
    });

    it('sends updateEditorState when openTab or closeTab is called', () => {
      workspaceStore.openTab({ id: 'tab_2', name: 'Tab 2', type: 'script' });
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tabs: workspaceStore.tabs });

      workspaceStore.closeTab('tab_2');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tabs: workspaceStore.tabs });
    });

    it('sends updateEditorState when setTool is called', () => {
      workspaceStore.setTool('hand');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ activeTool: 'hand' });
    });

    it('sends updateEditorState when setContextOpacity is called', () => {
      workspaceStore.setContextOpacity(0.5);
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { opacity: 0.5 } });
    });

    it('sends updateEditorState when toggleContextVisibility is called', () => {
      workspaceStore.toggleContextVisibility();
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { showOthers: workspaceStore.tilemapContext.showOthers } });
    });

    it('sends updateEditorState when toggleGridVisibility is called', () => {
      workspaceStore.toggleGridVisibility();
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { showGrid: workspaceStore.tilemapContext.showGrid } });
    });

    it('sends updateEditorState when setGridVisibility is called', () => {
      workspaceStore.setGridVisibility(false);
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { showGrid: false } });
    });

    it('sends updateEditorState when setTileSelection and clearTileSelection are called', () => {
      const rect = { x: 0, y: 0, w: 2, h: 2 };
      workspaceStore.setTileSelection(rect);
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tileSelection: rect, activeTool: 'brush' });

      workspaceStore.clearTileSelection();
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tileSelection: null, activeTool: 'select' });
    });
  });

  /* =========================================================================
   * 5. SCRIPT STORE SYNC
   * ========================================================================= */
  describe('ScriptStore Sync', () => {
    it('sends createScript when addScript is called', async () => {
      const scriptData = { id: 'script_101', name: 'PlayerLogic' };
      
      // Call native Pinia action
      await scriptStore.addScript(scriptData);

      expect(engineBridge.createScript).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'script_101', name: 'PlayerLogic' })
      );
    });

    it('sends updateScript when updateScriptInList is called', () => {
      scriptStore.scripts = [{ id: 'script_1', name: 'OldScript' }];

      // Call native Pinia action
      scriptStore.updateScriptInList('script_1', { name: 'UpdatedScript' });

      expect(engineBridge.updateScript).toHaveBeenCalledWith('script_1', { name: 'UpdatedScript' });
    });

    it('sends deleteScript when removeScript is called', async () => {
      scriptStore.scripts = [{ id: 'script_1', name: 'ScriptToDelete' }];

      // Call native Pinia action
      await scriptStore.removeScript('script_1');

      expect(engineBridge.deleteScript).toHaveBeenCalledWith('script_1');
    });

    it('sends updateScript when saveActiveScript is called', () => {
      scriptStore.activeScript = {
        id: 'script_1',
        nodes: [{ id: 'node_1' }],
        edges: [],
        localVariables: []
      };

      // Call native Pinia action
      scriptStore.saveActiveScript();

      expect(engineBridge.updateScript).toHaveBeenCalledWith('script_1', {
        nodes: [{ id: 'node_1' }],
        edges: [],
        localVariables: []
      });
    });
  });

  /* =========================================================================
   * 6. PREFAB STORE SYNC
   * ========================================================================= */
  describe('PrefabStore Sync', () => {
    it('sends createPrefab when addPrefab is called', async () => {
      const prefabObj = { id: 'prefab_1', name: 'Coin' };
      await prefabStore.addPrefab(prefabObj);
      expect(engineBridge.createPrefab).toHaveBeenCalledWith(prefabObj);
    });

    it('sends updatePrefab when updatePrefab is called', async () => {
      prefabStore.prefabs = [{ id: 'prefab_player_1', name: 'Old Player' }];
      await prefabStore.updatePrefab('prefab_player_1', { name: 'New Player' });
      expect(engineBridge.updatePrefab).toHaveBeenCalledWith('prefab_player_1', { name: 'New Player' });
    });

    it('sends updatePrefab(id, null) when updateComponentProp is called', () => {
      prefabStore.prefabs = [{ id: 'prefab_1', data: { components: { SpriteRenderer: { color: '#ffffff' } } } }];
      prefabStore.updateComponentProp('prefab_1', 'SpriteRenderer', 'color', '#ff0000');
      expect(engineBridge.updatePrefab).toHaveBeenCalledWith('prefab_1', null);
    });

    it('sends deletePrefab when removePrefab is called', async () => {
      prefabStore.prefabs = [{ id: 'prefab_1', name: 'Prefab 1' }];
      await prefabStore.removePrefab('prefab_1');
      expect(engineBridge.deletePrefab).toHaveBeenCalledWith('prefab_1');
    });
  });

  /* =========================================================================
   * 7. EDGE CASES & BRANCH COVERAGE
   * ========================================================================= */
  describe('Edge Cases & Branch Coverage', () => {
    it('does not call engineBridge when projectStore.project is null', () => {
      projectStore.project = null;
      projectStore.$patch({});
      expect(engineBridge.updateProjectSettings).not.toHaveBeenCalled();
    });

    it('does not call engineBridge when sceneStore action result is false', () => {
      vi.spyOn(sceneStore, 'deleteLayer').mockReturnValueOnce(false);
      sceneStore.deleteLayer('non_existent_layer', false);
      expect(engineBridge.deleteLayer).not.toHaveBeenCalled();
    });

    it('does not call createEntity when result is null/falsy', () => {
      vi.spyOn(sceneStore, 'createEntity').mockReturnValueOnce(null);
      sceneStore.createEntity('invalid');
      expect(engineBridge.createEntity).not.toHaveBeenCalled();
    });

    it('does not call saveActiveScript when activeScript is null', () => {
      scriptStore.activeScript = null;
      scriptStore.saveActiveScript();
      expect(engineBridge.updateScript).not.toHaveBeenCalled();
    });
  });
});