import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSceneHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { setupMockSceneEnvironment, createMockEntity, createMockLayer } from '@tests/tests.js';

// Mock dependencies external di luar batas pengujian integrasi
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateEntity: vi.fn(),
    updateComponentProp: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    clearSelection: vi.fn(),
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    updateLayerProp: vi.fn(),
    reorderLayer: vi.fn()
  }
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    getProjectsRootDirectory: vi.fn().mockResolvedValue({}),
    resolveDirectoryPath: vi.fn().mockResolvedValue({}),
    writeFileToHandle: vi.fn().mockResolvedValue(true),
    removeFileFromHandle: vi.fn().mockResolvedValue(true)
  })
}));

describe('useSceneHistory Integration', () => {
  let sceneStore;
  let prefabStore;
  let workspaceStore;
  let sceneHistory;
  let targetScene;

  beforeEach(() => {
    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia());

    sceneStore = useSceneStore();
    prefabStore = usePrefabStore();
    workspaceStore = useWorkspaceStore();

    // Setup active tab di workspace agar history key dapat dibuat (`scene_${sceneId}`)
    const { scene } = setupMockSceneEnvironment();
    targetScene = scene;
    workspaceStore.tabs = [{ id: 'tab_scene_1', type: 'scene', sceneId: targetScene.id }];

    sceneHistory = useSceneHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Properties Recording and Undo/Redo Integration', () => {
    it('records component property change and restores original state upon undo, then reapplies on redo', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_1',
        entityType: 'sprite',
        attachComponents: {
          SpriteRenderer: { color: '#FFFFFF' }
        }
      });
      targetScene.entities.push(entity);

      const oldColor = '#FFFFFF';
      const newColor = '#FF0000';

      // Act
      sceneHistory.recordComponentChange('ent_1', 'SpriteRenderer', 'color', oldColor, newColor);
      sceneStore.updateComponentProp('ent_1', 'SpriteRenderer', 'color', newColor);

      expect(targetScene.entities[0].components.SpriteRenderer.color).toBe('#FF0000');

      // Assert Undo
      sceneHistory.undo();
      expect(targetScene.entities[0].components.SpriteRenderer.color).toBe('#FFFFFF');

      // Assert Redo
      sceneHistory.redo();
      expect(targetScene.entities[0].components.SpriteRenderer.color).toBe('#FF0000');
    });

    it('[Bad Path] ignores component change recording when old and new values are identical', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_1', entityType: 'sprite' });
      targetScene.entities.push(entity);

      // Act
      sceneHistory.recordComponentChange('ent_1', 'SpriteRenderer', 'color', '#FFFFFF', '#FFFFFF');

      // Assert: Stack undo/redo tidak berubah
      const initialEntityState = JSON.stringify(targetScene.entities[0]);
      sceneHistory.undo();
      const afterUndoState = JSON.stringify(targetScene.entities[0]);

      expect(initialEntityState).toBe(afterUndoState);
    });
  });

  describe('Entity Lifecycle (Create and Delete) Integration', () => {
    it('records entity creation and removes it from store on undo, then restores it on redo', () => {
      // Arrange
      const newEntity = createMockEntity({ id: 'ent_created', name: 'New Character' });

      // Act
      targetScene.entities.push(newEntity);
      sceneHistory.recordEntityCreate(newEntity);

      expect(targetScene.entities).toHaveLength(1);

      // Assert Undo
      sceneHistory.undo();
      expect(targetScene.entities).toHaveLength(0);

      // Assert Redo
      sceneHistory.redo();
      expect(targetScene.entities).toHaveLength(1);
      expect(targetScene.entities[0].id).toBe('ent_created');
    });

    it('records entity deletion and restores deleted entities to store on undo', () => {
      // Arrange
      const entityToDelete = createMockEntity({ id: 'ent_to_delete', name: 'Enemy' });
      targetScene.entities.push(entityToDelete);

      // Act
      const deletedList = [entityToDelete];
      sceneStore.deleteEntity('ent_to_delete', false);
      sceneHistory.recordEntityDelete(deletedList);

      expect(targetScene.entities).toHaveLength(0);

      // Assert Undo
      sceneHistory.undo();
      expect(targetScene.entities).toHaveLength(1);
      expect(targetScene.entities[0].id).toBe('ent_to_delete');

      // Assert Redo
      sceneHistory.redo();
      expect(targetScene.entities).toHaveLength(0);
    });
  });

  describe('Layer Management Integration', () => {
    it('records adding layer and syncs layer deletion and restoration on undo/redo', () => {
      // Arrange
      const newLayer = createMockLayer({ id: 'layer_foreground', name: 'Foreground', section: 'world' });

      // Act
      sceneStore.restoreLayer(newLayer, 'world');
      sceneHistory.recordAddLayer(newLayer, 'world');

      expect(targetScene.layersWorld.some(l => l.id === 'layer_foreground')).toBe(true);

      // Assert Undo
      sceneHistory.undo();
      expect(targetScene.layersWorld.some(l => l.id === 'layer_foreground')).toBe(false);

      // Assert Redo
      sceneHistory.redo();
      expect(targetScene.layersWorld.some(l => l.id === 'layer_foreground')).toBe(true);
    });

    it('records layer property change and reverts store state on undo', () => {
      // Arrange
      const layerId = targetScene.layersWorld[0].id;
      const oldName = targetScene.layersWorld[0].name;
      const newName = 'Renamed Layer';

      // Act
      sceneHistory.recordLayerPropChange(layerId, 'name', oldName, newName);
      sceneStore.updateLayerProp(layerId, 'name', newName, false);

      expect(targetScene.layersWorld[0].name).toBe('Renamed Layer');

      // Assert Undo
      sceneHistory.undo();
      expect(targetScene.layersWorld[0].name).toBe(oldName);

      // Assert Redo
      sceneHistory.redo();
      expect(targetScene.layersWorld[0].name).toBe('Renamed Layer');
    });
  });

  describe('Prefab Management Integration', () => {
    it('records prefab creation and synchronizes prefab store state on undo and redo', async () => {
      // Arrange
      const prefabData = {
        id: 'prefab_hero',
        name: 'Hero Prefab',
        type: 'sprite',
        folderId: null,
        data: { components: {} }
      };

      // Act
      await prefabStore.addPrefab(prefabData);
      sceneHistory.recordCreatePrefab(prefabData);

      expect(prefabStore.prefabs).toHaveLength(1);

      // Assert Undo: Gunakan vi.waitFor untuk menunggu penyelesaian async OPFS pada removePrefab
      sceneHistory.undo();
      await vi.waitFor(() => {
        expect(prefabStore.prefabs).toHaveLength(0);
      });

      // Assert Redo: Gunakan vi.waitFor untuk menunggu penyelesaian async OPFS pada addPrefab
      sceneHistory.redo();
      await vi.waitFor(() => {
        expect(prefabStore.prefabs).toHaveLength(1);
        expect(prefabStore.prefabs[0].id).toBe('prefab_hero');
      });
    });

    it('records prefab renaming and updates prefab name upon undo/redo', async () => {
      // Arrange
      const prefabData = {
        id: 'prefab_1',
        name: 'Old Name',
        data: { name: 'Old Name' }
      };
      await prefabStore.addPrefab(prefabData);

      // Act
      sceneHistory.recordRenamePrefab('prefab_1', 'Old Name', 'New Name');
      await prefabStore.updatePrefab('prefab_1', { name: 'New Name', data: { name: 'New Name' } });

      expect(prefabStore.getPrefabById('prefab_1').name).toBe('New Name');

      // Assert Undo
      sceneHistory.undo();
      expect(prefabStore.getPrefabById('prefab_1').name).toBe('Old Name');

      // Assert Redo
      sceneHistory.redo();
      expect(prefabStore.getPrefabById('prefab_1').name).toBe('New Name');
    });
  });

  describe('Edge Cases and Inactive Scene Handling', () => {
    it('[Bad Path] rejects history recording when active scene ID is null', () => {
      // Arrange
      sceneStore.activeSceneId = null;
      const entity = createMockEntity({ id: 'ent_orphan' });

      // Act
      sceneHistory.recordEntityCreate(entity);

      // Assert: Kembalikan active scene untuk verifikasi bahwa undo tidak melakukan aksi
      sceneStore.activeSceneId = targetScene.id;
      const initialCount = targetScene.entities.length;

      sceneHistory.undo();
      expect(targetScene.entities.length).toBe(initialCount);
    });
  });
});