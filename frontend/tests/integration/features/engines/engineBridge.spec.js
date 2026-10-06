import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { engineBridge } from '@engines/engines.js'; // Sesuaikan path dengan lokasi engineBridge Anda
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';

// Mock dependencies jika diperlukan
vi.mock('@scenes/scenes.js', () => ({
  useSceneStore: vi.fn(),
}));

describe('engineBridge Integration Tests', () => {
  let mockBus;
  let mockEngine;
  let mockSceneStore;
  let workspaceStore;

  beforeEach(() => {
    // 1. Inisialisasi ulang Pinia environment
    setActivePinia(createPinia());
    workspaceStore = useWorkspaceStore();

    // 2. Mock Event Bus Engine
    mockBus = {
      handlers: {},
      on: vi.fn((event, handler) => {
        mockBus.handlers[event] = handler;
      }),
      off: vi.fn((event) => {
        delete mockBus.handlers[event];
      }),
      emit: vi.fn(),
    };

    // 3. Mock Engine Instance
    mockEngine = {
      bus: mockBus,
      syncComponent: { isInternalUpdate: false },
      game: {
        camera: { x: 120, y: 350 },
      },
    };

    // 4. Mock Scene Store
    mockSceneStore = {
      syncTransformFromEngine: vi.fn(),
    };
    useSceneStore.mockReturnValue(mockSceneStore);

    // Set Engine ke WorkspaceStore
    workspaceStore.setEngine(mockEngine);
  });

  describe('Getter & Base Instance', () => {
    it('harus mengembalikan engine instance dari workspaceStore', () => {
      expect(engineBridge._instance).toBe(mockEngine);
    });

    it('harus mengembalikan kamera position jika engine & camera tersedia', () => {
      const cameraPos = engineBridge.getCameraPosition();
      expect(cameraPos).toEqual({ x: 120, y: 350 });
    });

    it('harus mengembalikan default {x:0, y:0} jika engine/camera tidak tersedia', () => {
      workspaceStore.setEngine(null);
      expect(engineBridge.getCameraPosition()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Listeners Setup & Engine Bus Callbacks', () => {
    beforeEach(() => {
      engineBridge.setupListeners();
    });

    it('harus mendaftarkan listener ke engine.bus saat setupListeners dipanggil', () => {
      expect(mockBus.on).toHaveBeenCalledWith('entity:modified', expect.any(Function));
      expect(mockBus.on).toHaveBeenCalledWith('editor:tool:pickup', expect.any(Function));
      expect(mockBus.on).toHaveBeenCalledWith('editor:tilemap:update-data', expect.any(Function));
    });

    it('harus memproses event "entity:modified" dan menyinkronkan transform ke sceneStore', () => {
      const mockEntity = {
        id: 'entity-1',
        components: {
          Transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1, width: 100, height: 100 },
        },
      };

      // Trigger callback handler langsung
      mockBus.handlers['entity:modified'](mockEntity);

      expect(mockSceneStore.syncTransformFromEngine).toHaveBeenCalledWith('entity-1', {
        x: 10,
        y: 20,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 100,
        height: 100,
      });
    });

    it('harus mengabaikan "entity:modified" jika syncComponent.isInternalUpdate bernilai true', () => {
      mockEngine.syncComponent.isInternalUpdate = true;

      mockBus.handlers['entity:modified']({ id: 'entity-1' });

      expect(mockSceneStore.syncTransformFromEngine).not.toHaveBeenCalled();
    });

    it('harus memanggil callback native yang didaftarkan lewat listener helper', () => {
      const cbEntityModified = vi.fn();
      const cbToolPickup = vi.fn();
      const cbTilemapUpdate = vi.fn();

      engineBridge.onEntityModified(cbEntityModified);
      engineBridge.onToolPickup(cbToolPickup);
      engineBridge.onTilemapDataUpdated(cbTilemapUpdate);

      mockBus.handlers['entity:modified']([{ id: 'ent-1' }]);
      mockBus.handlers['editor:tool:pickup']({ tool: 'brush' });
      mockBus.handlers['editor:tilemap:update-data']({ entityId: 'ent-1', data: [] });

      expect(cbEntityModified).toHaveBeenCalledWith([{ id: 'ent-1' }]);
      expect(cbToolPickup).toHaveBeenCalledWith({ tool: 'brush' });
      expect(cbTilemapUpdate).toHaveBeenCalledWith({ entityId: 'ent-1', data: [] });
    });
  });

  describe('Outbound Event Emits', () => {
    it('harus memancarkan event bus yang sesuai saat method bridge dipanggil', () => {
      engineBridge.createEntity({ name: 'Player' });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:create', { name: 'Player' });

      engineBridge.deleteEntity('ent-1');
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:delete', 'ent-1');

      engineBridge.updateEntityName('ent-1', 'New Player');
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:update-name', { id: 'ent-1', name: 'New Player' });

      engineBridge.updateProjectSettings({ tickRate: 60 });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:project:settings-update', { tickRate: 60 });

      engineBridge.clearSelection();
      expect(mockBus.emit).toHaveBeenCalledWith('editor:selection:clear');
    });

    it('harus menangani updateEntity baik berupa single entity maupun array', () => {
      engineBridge.updateEntity({ id: 'ent-1' });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:replace', [{ id: 'ent-1' }]);

      engineBridge.updateEntity([{ id: 'ent-1' }, { id: 'ent-2' }]);
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:replace', [{ id: 'ent-1' }, { id: 'ent-2' }]);
    });
  });

  describe('Disconnect Cleanups', () => {
    it('harus menghapus event listener dan membersihkan callback saat disconnect() dipanggil', () => {
      const cbMock = vi.fn();
      engineBridge.onEntityModified(cbMock);

      engineBridge.disconnect();

      expect(mockBus.off).toHaveBeenCalledWith('entity:modified');
      expect(mockBus.off).toHaveBeenCalledWith('editor:tilemap:update-data');
      expect(mockBus.off).toHaveBeenCalledWith('editor:tool:pickup');
    });
  });
});