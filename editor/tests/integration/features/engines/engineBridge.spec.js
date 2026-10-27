import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { engineBridge } from '@engines/engines.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';

// Mock dependencies if needed
vi.mock('@scenes/scenes.js', () => ({
  useSceneStore: vi.fn(),
}));

describe('Integration Test: engineBridge', () => {
  let mockBus;
  let mockEngine;
  let mockSceneStore;
  let workspaceStore;

  beforeEach(() => {
    // 1. Reinitialize Pinia environment
    setActivePinia(createPinia());
    workspaceStore = useWorkspaceStore();

    // 2. Mock Engine Event Bus
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
      updateComponentData: vi.fn(),
      activeScene: { entities: [] }
    };
    useSceneStore.mockReturnValue(mockSceneStore);

    // Set Engine to WorkspaceStore
    workspaceStore.setEngine(mockEngine);
  });

  describe('Getter & Base Instance', () => {
    it('returns engine instance from workspaceStore', () => {
      expect(engineBridge._instance).toBe(mockEngine);
    });

    it('returns camera position if engine and camera are available', () => {
      const cameraPos = engineBridge.getCameraPosition();
      expect(cameraPos).toEqual({ x: 120, y: 350 });
    });

    it('returns default {x:0, y:0} if engine/camera is not available', () => {
      workspaceStore.setEngine(null);
      expect(engineBridge.getCameraPosition()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Listeners Setup & Engine Bus Callbacks', () => {
    beforeEach(() => {
      engineBridge.setupListeners();
    });

    it('registers listeners to engine.bus when setupListeners is called', () => {
      expect(mockBus.on).toHaveBeenCalledWith('entity:modified', expect.any(Function));
      expect(mockBus.on).toHaveBeenCalledWith('editor:tool:pickup', expect.any(Function));
      expect(mockBus.on).toHaveBeenCalledWith('editor:tilemap:update-data', expect.any(Function));
    });

    it('processes "entity:modified" event and syncs transform to sceneStore', () => {
      const mockEntity = {
        id: 'entity-1',
        components: {
          Transform: { x: 10, y: 20, rotation: 0, scaleX: 1, scaleY: 1, width: 100, height: 100 },
        },
      };

      // Trigger callback handler directly
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

    it('ignores "entity:modified" if syncComponent.isInternalUpdate is true', () => {
      mockEngine.syncComponent.isInternalUpdate = true;

      mockBus.handlers['entity:modified']({ id: 'entity-1' });

      expect(mockSceneStore.syncTransformFromEngine).not.toHaveBeenCalled();
    });

    it('calls native callback registered via listener helper', () => {
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
    it('emits corresponding bus events when bridge methods are called', () => {
      engineBridge.createEntity({ name: 'Player' });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:create', { name: 'Player' });

      engineBridge.deleteEntity('ent-1');
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:delete', 'ent-1');

      engineBridge.updateEntityScriptId('ent-1', 'new_player');
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:update-script-id', { id: 'ent-1', scriptId: 'new_player' });

      engineBridge.updateLayerScriptId('layer-1', 'new_layer');
      expect(mockBus.emit).toHaveBeenCalledWith('editor:layer:update-script-id', { id: 'layer-1', scriptId: 'new_layer' });

      engineBridge.updateProjectSettings({ tickRate: 60 });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:project:settings-update', { tickRate: 60 });

      engineBridge.clearSelection();
      expect(mockBus.emit).toHaveBeenCalledWith('editor:selection:clear');
    });

    it('handles updateEntity for both single entity and array', () => {
      engineBridge.updateEntity({ id: 'ent-1' });
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:replace', [{ id: 'ent-1' }]);

      engineBridge.updateEntity([{ id: 'ent-1' }, { id: 'ent-2' }]);
      expect(mockBus.emit).toHaveBeenCalledWith('editor:entity:replace', [{ id: 'ent-1' }, { id: 'ent-2' }]);
    });
  });

  describe('Disconnect Cleanups', () => {
    it('removes event listeners and cleans up callbacks when disconnect() is called', () => {
      const cbMock = vi.fn();
      engineBridge.onEntityModified(cbMock);

      engineBridge.disconnect();

      expect(mockBus.off).toHaveBeenCalledWith('entity:modified');
      expect(mockBus.off).toHaveBeenCalledWith('editor:tilemap:update-data');
      expect(mockBus.off).toHaveBeenCalledWith('editor:tool:pickup');
    });
  });
});