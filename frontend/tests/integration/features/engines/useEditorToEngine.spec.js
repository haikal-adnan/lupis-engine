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

    // Reset dan spy semua method di engineBridge, pastikan getCameraPosition mengembalikan koordinat default
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
    it('mengirim updateProjectSettings saat toggleGrid dipanggil', () => {
      projectStore.toggleGrid();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { visible: false } });
    });

    it('mengirim updateProjectSettings saat toggleMagnet dipanggil', () => {
      projectStore.toggleMagnet();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { snap: true } });
    });

    it('mengirim updateProjectSettings saat setGridSize dipanggil', () => {
      projectStore.setGridSize(64, 64);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { width: 64, height: 64 } });
    });

    it('mengirim updateProjectSettings saat setGridColor dipanggil', () => {
      projectStore.setGridColor('#00ff00');
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { color: '#00ff00' } });
    });

    it('mengirim updateProjectSettings saat setGridOpacity dipanggil', () => {
      projectStore.setGridOpacity(0.8);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ grid: { opacity: 0.8 } });
    });

    it('mengirim updateProjectSettings saat setTickRate dipanggil', () => {
      projectStore.setTickRate(120);
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ tickRate: 120 });
    });

    it('mengirim updateProjectSettings saat toggleUIBorder dipanggil', () => {
      projectStore.toggleUIBorder();
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ ui: { showUIBorder: false } });
    });

    it('mengirim updateProjectSettings saat updateUISettings dipanggil', () => {
      projectStore.updateUISettings({ scale: 2 });
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ ui: { scale: 2 } });
    });

    it('mengirim updateProjectSettings saat updateCameraSettings dipanggil', () => {
      projectStore.updateCameraSettings({ zoom: 1.5 });
      expect(engineBridge.updateProjectSettings).toHaveBeenCalledWith({ camera: { zoom: 1.5 } });
    });
  });

  /* =========================================================================
   * 2. SCENE STORE SYNC
   * ========================================================================= */
  describe('SceneStore Sync', () => {
    it('mengirim updateSceneSettings saat setBackgroundColor dipanggil', () => {
      sceneStore.setBackgroundColor('#ff0000');
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ backgroundColor: '#ff0000' });
    });

    it('mengirim updateSceneSettings saat updateWorldBounds dipanggil', () => {
      const bounds = { x1: 0, x2: 1000, y1: 0, y2: 1000 };
      sceneStore.updateWorldBounds(bounds);
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ worldBounds: bounds });
    });

    it('mengirim updateSceneSettings saat updatePhysicsSettings dipanggil', () => {
      sceneStore.updatePhysicsSettings({ gravity: 980 });
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ physics: { gravity: 980 } });
    });

    it('mengirim updateSceneSettings saat toggleRulers dipanggil', () => {
      sceneStore.toggleRulers();
      expect(engineBridge.updateSceneSettings).toHaveBeenCalledWith({ showRulers: false });
    });

    it('mengirim clearSelection saat clearSelection dipanggil', () => {
      sceneStore.clearSelection();
      expect(engineBridge.clearSelection).toHaveBeenCalled();
    });

    it('mengirim createEntity saat createEntity dipanggil', () => {
      const entity = sceneStore.createEntity('sprite');
      expect(engineBridge.createEntity).toHaveBeenCalledWith(entity);
    });

    it('mengirim deleteEntity saat deleteEntity dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_123', name: 'Player', layerId: 'layer_world_1', components: {} });
      sceneStore.deleteEntity('ent_123');
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_123');
    });

    it('mengirim updateEntityName saat updateEntityName dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_123', name: 'Player' });
      sceneStore.updateEntityName('ent_123', 'Hero');
      expect(engineBridge.updateEntityName).toHaveBeenCalledWith('ent_123', 'Hero');
    });

    it('mengirim moveEntity saat moveEntity dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', layerId: 'layer_world_1', parentId: null });
      sceneStore.moveEntity('ent_1', { newParentId: 'ent_parent', newLayerId: 'layer_world_1' });
      expect(engineBridge.moveEntity).toHaveBeenCalledWith({
        id: 'ent_1',
        parentId: 'ent_parent',
        layerId: 'layer_world_1'
      });
    });

    it('mengirim updateComponentProp saat updateComponentProp dipanggil', () => {
      sceneStore.activeScene.entities.push({
        id: 'ent_1',
        components: { Transform: { x: 0, y: 0 } }
      });
      const res = sceneStore.updateComponentProp('ent_1', 'Transform', 'x', 100);
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith(res);
    });

    it('mengirim updateEntityProp saat updateEntityProp dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', active: true });
      const res = sceneStore.updateEntityProp('ent_1', 'active', false);
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith(res);
    });

    it('mengirim updateLayerProp saat updateLayerProp dipanggil', () => {
      sceneStore.updateLayerProp('layer_world_1', 'visible', false);
      expect(engineBridge.updateLayerProp).toHaveBeenCalledWith('layer_world_1', 'visible', false);
    });

    it('mengirim addComponent saat addComponent dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: {} });
      const res = sceneStore.addComponent('ent_1', 'Physics');
      expect(engineBridge.addComponent).toHaveBeenCalledWith(res);
    });

    it('mengirim removeComponent saat removeComponent dipanggil', async () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: { Physics: {} } });
      await sceneStore.removeComponent('ent_1', 'Physics', false);
      expect(engineBridge.removeComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Physics'
      });
    });

    it('mengirim patchComponent saat patchComponent dipanggil', () => {
      sceneStore.activeScene.entities.push({ id: 'ent_1', components: { Transform: { x: 0 } } });
      sceneStore.patchComponent('ent_1', 'Transform', { x: 50 });
      expect(engineBridge.patchComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        updates: { x: 50 }
      });
    });

    it('mengirim addLayer saat addLayer dipanggil', () => {
      const res = sceneStore.addLayer('Background', 'world', false);
      expect(engineBridge.addLayer).toHaveBeenCalledWith(res);
    });

    it('mengirim updateLayerName saat updateLayerName dipanggil', () => {
      sceneStore.updateLayerName('layer_world_1', 'Foreground');
      expect(engineBridge.updateLayerName).toHaveBeenCalledWith('layer_world_1', 'Foreground');
    });

    it('mengirim deleteLayer saat deleteLayer dipanggil', () => {
      sceneStore.activeScene.layersWorld.push({ id: 'layer_world_2', name: 'Layer 2' });
      sceneStore.deleteLayer('layer_world_2', false);
      expect(engineBridge.deleteLayer).toHaveBeenCalledWith('layer_world_2');
    });

    it('mengirim reorderLayer saat reorderLayer dipanggil', () => {
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
    it('mengirim createAsset saat addAsset dipanggil', async () => {
      const assetObj = { id: 'asset_1', fileKey: 'tex1', meta: { extension: '.png' } };
      await assetStore.addAsset(assetObj, new Blob(['']), []);
      expect(engineBridge.createAsset).toHaveBeenCalledWith(assetObj);
    });

    it('mengirim deleteAsset saat removeAsset dipanggil', async () => {
      assetStore.assets = [{ id: 'asset_1', fileKey: 'tex1', meta: { extension: '.png' } }];
      await assetStore.removeAsset('asset_1');
      expect(engineBridge.deleteAsset).toHaveBeenCalledWith('asset_1');
    });
  });

  /* =========================================================================
   * 4. WORKSPACE STORE SYNC
   * ========================================================================= */
  describe('WorkspaceStore Sync', () => {
    it('mengirim updateEditorState saat setActiveTab dipanggil', () => {
      workspaceStore.setActiveTab('scene');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ activeTabId: 'scene' });
    });

    it('mengirim updateEditorState saat openTab atau closeTab dipanggil', () => {
      workspaceStore.openTab({ id: 'tab_2', name: 'Tab 2', type: 'script' });
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tabs: workspaceStore.tabs });

      workspaceStore.closeTab('tab_2');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tabs: workspaceStore.tabs });
    });

    it('mengirim updateEditorState saat setTool dipanggil', () => {
      workspaceStore.setTool('hand');
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ activeTool: 'hand' });
    });

    it('mengirim updateEditorState saat setContextOpacity dipanggil', () => {
      workspaceStore.setContextOpacity(0.5);
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { opacity: 0.5 } });
    });

    it('mengirim updateEditorState saat toggleContextVisibility dipanggil', () => {
      workspaceStore.toggleContextVisibility();
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tilemapContext: { showOthers: workspaceStore.tilemapContext.showOthers } });
    });

    it('mengirim updateEditorState saat setTileSelection dan clearTileSelection dipanggil', () => {
      const rect = { x: 0, y: 0, w: 2, h: 2 };
      workspaceStore.setTileSelection(rect);
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tileSelection: rect });

      workspaceStore.clearTileSelection();
      expect(engineBridge.updateEditorState).toHaveBeenCalledWith({ tileSelection: null });
    });
  });

  /* =========================================================================
   * 5. SCRIPT STORE SYNC
   * ========================================================================= */
  /* =========================================================================
   * 5. SCRIPT STORE SYNC
   * ========================================================================= */
  describe('ScriptStore Sync', () => {
    it('mengirim createScript saat addScript dipanggil', async () => {
      const scriptData = { id: 'script_101', name: 'PlayerLogic' };
      
      // Memanggil action Pinia asli
      await scriptStore.addScript(scriptData);

      expect(engineBridge.createScript).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'script_101', name: 'PlayerLogic' })
      );
    });

    it('mengirim updateScript saat updateScriptInList dipanggil', () => {
      scriptStore.scripts = [{ id: 'script_1', name: 'OldScript' }];

      // Memanggil action Pinia asli
      scriptStore.updateScriptInList('script_1', { name: 'UpdatedScript' });

      expect(engineBridge.updateScript).toHaveBeenCalledWith('script_1', { name: 'UpdatedScript' });
    });

    it('mengirim deleteScript saat removeScript dipanggil', async () => {
      scriptStore.scripts = [{ id: 'script_1', name: 'ScriptToDelete' }];

      // Memanggil action Pinia asli
      await scriptStore.removeScript('script_1');

      expect(engineBridge.deleteScript).toHaveBeenCalledWith('script_1');
    });

    it('mengirim updateScript saat saveActiveScript dipanggil', () => {
      scriptStore.activeScript = {
        id: 'script_1',
        nodes: [{ id: 'node_1' }],
        edges: [],
        localVariables: []
      };

      // Memanggil action Pinia asli
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
    it('mengirim createPrefab saat addPrefab dipanggil', async () => {
      const prefabObj = { id: 'prefab_1', name: 'Coin' };
      await prefabStore.addPrefab(prefabObj);
      expect(engineBridge.createPrefab).toHaveBeenCalledWith(prefabObj);
    });

    it('mengirim updatePrefab saat updatePrefab dipanggil', async () => {
      prefabStore.prefabs = [{ id: 'prefab_player_1', name: 'Old Player' }];
      await prefabStore.updatePrefab('prefab_player_1', { name: 'New Player' });
      expect(engineBridge.updatePrefab).toHaveBeenCalledWith('prefab_player_1', { name: 'New Player' });
    });

    it('mengirim updatePrefab(id, null) saat updateComponentProp dipanggil', () => {
      prefabStore.prefabs = [{ id: 'prefab_1', data: { components: { SpriteRenderer: { color: '#ffffff' } } } }];
      prefabStore.updateComponentProp('prefab_1', 'SpriteRenderer', 'color', '#ff0000');
      expect(engineBridge.updatePrefab).toHaveBeenCalledWith('prefab_1', null);
    });

    it('mengirim deletePrefab saat removePrefab dipanggil', async () => {
      prefabStore.prefabs = [{ id: 'prefab_1', name: 'Prefab 1' }];
      await prefabStore.removePrefab('prefab_1');
      expect(engineBridge.deletePrefab).toHaveBeenCalledWith('prefab_1');
    });
  });

  /* =========================================================================
   * 7. EDGE CASES & BRANCH COVERAGE
   * ========================================================================= */
  describe('Edge Cases & Branch Coverage', () => {
    it('tidak memanggil engineBridge jika projectStore.project bernilai null', () => {
      projectStore.project = null;
      projectStore.$patch({});
      expect(engineBridge.updateProjectSettings).not.toHaveBeenCalled();
    });

    it('tidak memanggil engineBridge jika result action sceneStore bernilai false', () => {
      vi.spyOn(sceneStore, 'deleteLayer').mockReturnValueOnce(false);
      sceneStore.deleteLayer('non_existent_layer', false);
      expect(engineBridge.deleteLayer).not.toHaveBeenCalled();
    });

    it('tidak memanggil createEntity jika result bernilai null/falsy', () => {
      vi.spyOn(sceneStore, 'createEntity').mockReturnValueOnce(null);
      sceneStore.createEntity('invalid');
      expect(engineBridge.createEntity).not.toHaveBeenCalled();
    });

    it('tidak memanggil saveActiveScript jika activeScript bernilai null', () => {
      scriptStore.activeScript = null;
      scriptStore.saveActiveScript();
      expect(engineBridge.updateScript).not.toHaveBeenCalled();
    });
  });
});