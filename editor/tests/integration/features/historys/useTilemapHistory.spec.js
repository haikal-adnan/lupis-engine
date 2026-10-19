import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTilemapHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { setupMockSceneEnvironment, createMockEntity } from '@tests/tests.js';

// Mock dependencies external di luar batas pengujian integrasi
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateComponentProp: vi.fn(),
    updateEntityProp: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));

describe('useTilemapHistory Integration', () => {
  let sceneStore;
  let workspaceStore;
  let tilemapHistory;
  let targetScene;
  let entityId;

  beforeEach(() => {
    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia());

    sceneStore = useSceneStore();
    workspaceStore = useWorkspaceStore();

    // Setup active tab di workspace agar history key dapat dibuat (`scene_${sceneId}`)
    const { scene } = setupMockSceneEnvironment();
    targetScene = scene;
    workspaceStore.tabs = [{ id: 'tab_scene_1', type: 'scene', sceneId: targetScene.id }];

    // Buat entitas dengan komponen Tilemap
    entityId = 'ent_tilemap_1';
    const tilemapEntity = createMockEntity({
      id: entityId,
      name: 'Test Tilemap',
      entityType: 'tilemap',
      attachComponents: {
        Tilemap: {
          width: 2,
          height: 2,
          tileWidth: 16,
          tileHeight: 16,
          data: [0, 0, 0, 0]
        }
      }
    });

    targetScene.entities.push(tilemapEntity);
    tilemapHistory = useTilemapHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tilemap Stroke Transaction (Painting Tiles)', () => {
    it('records stroke transaction from start to end and reverts tile data on undo, then reapplies on redo', () => {
      // Arrange
      const initialTileData = [0, 0, 0, 0];
      const newTileData = [1, 1, 0, 0];

      // Act: Mulai transaksi stroke paint
      tilemapHistory.startStrokeTransaction(entityId, initialTileData);

      // Simulasi pengubahan data tilemap pada store selama proses painting
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', newTileData);

      // Akhiri stroke transaction
      tilemapHistory.endStrokeTransaction('Paint Grass Tiles');

      expect(targetScene.entities[0].components.Tilemap.data).toEqual([1, 1, 0, 0]);

      // Assert Undo: Mengembalikan data tilemap ke kondisi awal
      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual([0, 0, 0, 0]);

      // Assert Redo: Mengaplikasikan kembali data tilemap baru
      tilemapHistory.redo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual([1, 1, 0, 0]);
    });

    it('[Bad Path] ignores stroke transaction recording if initial and final tile data are identical', () => {
      // Arrange
      const tileData = [0, 0, 0, 0];

      // Act
      tilemapHistory.startStrokeTransaction(entityId, tileData);
      // Tidak ada perubahan data pada store
      tilemapHistory.endStrokeTransaction('Paint Unchanged Tiles');

      // Assert: Stack undo/redo tidak berubah saat dipanggil
      const initialDataState = JSON.stringify(targetScene.entities[0].components.Tilemap.data);
      tilemapHistory.undo();
      const afterUndoState = JSON.stringify(targetScene.entities[0].components.Tilemap.data);

      expect(initialDataState).toBe(afterUndoState);
    });

    it('[Bad Path] ignores stroke transaction when entity ID is missing or stroke not started', () => {
      // Act
      tilemapHistory.startStrokeTransaction(null, [0, 0, 0, 0]);
      tilemapHistory.endStrokeTransaction('Invalid Stroke');

      // Assert
      const initialDataState = JSON.stringify(targetScene.entities[0].components.Tilemap.data);
      tilemapHistory.undo();
      const afterUndoState = JSON.stringify(targetScene.entities[0].components.Tilemap.data);

      expect(initialDataState).toBe(afterUndoState);
    });
  });

  describe('Tilemap Component Property Changes', () => {
    it('records tilemap property changes (e.g. tileWidth) and updates store on undo and redo', () => {
      // Arrange
      const oldWidth = 16;
      const newWidth = 32;

      // Act
      tilemapHistory.recordTilemapPropChange(entityId, 'tileWidth', oldWidth, newWidth);
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'tileWidth', newWidth);

      expect(targetScene.entities[0].components.Tilemap.tileWidth).toBe(32);

      // Assert Undo
      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.tileWidth).toBe(16);

      // Assert Redo
      tilemapHistory.redo();
      expect(targetScene.entities[0].components.Tilemap.tileWidth).toBe(32);
    });

    it('handles nested property path changes through undo and redo', () => {
      // Arrange
      const oldMode = 'pixelated';
      const newMode = 'smooth';

      // Act
      tilemapHistory.recordTilemapPropChange(entityId, 'filterMode', oldMode, newMode);
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'filterMode', newMode);

      // Assert Undo
      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.filterMode).toBe('pixelated');

      // Assert Redo
      tilemapHistory.redo();
      expect(targetScene.entities[0].components.Tilemap.filterMode).toBe('smooth');
    });

    it('[Bad Path] rejects recording property change when old and new values are identical', () => {
      // Arrange
      const currentVal = 16;

      // Act
      tilemapHistory.recordTilemapPropChange(entityId, 'tileWidth', currentVal, currentVal);

      // Assert: Call undo shouldn't mutate store state
      const initialPropState = targetScene.entities[0].components.Tilemap.tileWidth;
      tilemapHistory.undo();
      const afterUndoState = targetScene.entities[0].components.Tilemap.tileWidth;

      expect(initialPropState).toBe(afterUndoState);
    });
  });

  describe('Direct Tilemap Data Change Recording (Move, Delete, Bucket Fill)', () => {
    it('records direct tile move change and reverts tile data on undo, then reapplies on redo', () => {
      // Arrange
      const oldData = { '2,2': 1, '3,2': 2 };
      const newData = { '5,5': 1, '6,5': 2 };

      targetScene.entities[0].components.Tilemap.data = { ...oldData };

      // Act: Record move tiles
      tilemapHistory.recordTilemapDataChange(entityId, oldData, newData, 'Move Marquee Tiles');
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', newData);

      expect(targetScene.entities[0].components.Tilemap.data).toEqual(newData);

      // Assert Undo -> restores oldData
      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(oldData);

      // Assert Redo -> reapplies newData
      tilemapHistory.redo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(newData);
    });

    it('records tile deletion and bucket fill with proper descriptions and supports undo/redo', () => {
      // Arrange
      const filledData = { '0,0': 1, '1,0': 1, '0,1': 1 };
      const deletedData = { '0,1': 1 };

      targetScene.entities[0].components.Tilemap.data = { ...filledData };

      // Act: Delete area
      tilemapHistory.recordTilemapDataChange(entityId, filledData, deletedData, 'Delete Marquee Tiles');
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', deletedData);

      // Undo deletion
      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(filledData);

      // Redo deletion
      tilemapHistory.redo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(deletedData);

      // Bucket fill
      const bucketData = { '0,1': 9, '1,1': 9 };
      tilemapHistory.recordTilemapDataChange(entityId, deletedData, bucketData, 'Bucket Fill');
      sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', bucketData);

      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(deletedData);
    });

    it('[Bad Path] ignores recordTilemapDataChange when old and new data are identical or entityId is missing', () => {
      const currentData = { '1,1': 5 };
      targetScene.entities[0].components.Tilemap.data = { ...currentData };

      tilemapHistory.recordTilemapDataChange(entityId, currentData, currentData, 'No-op Change');
      tilemapHistory.recordTilemapDataChange(null, currentData, { '1,1': 10 }, 'Missing Entity');

      tilemapHistory.undo();
      expect(targetScene.entities[0].components.Tilemap.data).toEqual(currentData);
    });
  });
});