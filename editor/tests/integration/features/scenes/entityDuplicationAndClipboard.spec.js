import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSceneStore, entitySchema, layerSchema } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useClipboard } from '@composables/composables.js';
import { engineBridge } from '@engines/engines.js';

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    getCameraPosition: vi.fn(() => ({ x: 0, y: 0 })),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    reorderLayer: vi.fn()
  }
}));

vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    usePopAlert: () => ({ showPop: vi.fn() }),
    useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
    usePrompt: () => ({ prompt: vi.fn().mockResolvedValue('Cloned Layer') })
  };
});

describe('Entity Duplication, Copy-Paste Hierarchy & Clipboard Isolation', () => {
  let sceneStore;
  let workspaceStore;
  let clipboard;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    sceneStore = useSceneStore();
    workspaceStore = useWorkspaceStore();
    clipboard = useClipboard();

    const defaultLayer = layerSchema({
      id: 'layer_world_default',
      scriptId: 'World_Layer',
      section: 'world',
      orderIndex: 0
    });

    const testScene = {
      id: 'scene_test',
      name: 'Test Scene',
      layersWorld: [defaultLayer],
      layersUI: [],
      entities: []
    };

    sceneStore.scenes = [testScene];
    sceneStore.activeSceneId = 'scene_test';
    sceneStore.selectedEntityIds = [];
  });

  describe('Multi-Entity Duplication with Parent & Child Selected', () => {
    it('creates only one clone of the child and re-parents it to the cloned parent', () => {
      // Arrange: parent entity and child entity
      const parent = entitySchema({
        id: 'ent_parent_1',
        scriptId: 'ParentEntity',
        layerId: 'layer_world_default',
        parentId: null,
        orderIndex: 0
      });
      const child = entitySchema({
        id: 'ent_child_1',
        scriptId: 'ChildEntity',
        layerId: 'layer_world_default',
        parentId: 'ent_parent_1',
        orderIndex: 1
      });

      sceneStore.activeScene.entities.push(parent, child);

      // User selects BOTH parent and child in hierarchy
      sceneStore.selectedEntityIds = ['ent_parent_1', 'ent_child_1'];

      // Act
      const clonedIds = sceneStore.duplicateEntity();

      // Assert:
      // Both new parent and its child are returned and selected
      expect(clonedIds).toHaveLength(2);
      expect(sceneStore.activeScene.entities).toHaveLength(4);

      const clonedParent = sceneStore.activeScene.entities.find(
        e => e.id !== 'ent_parent_1' && e.id !== 'ent_child_1' && e.parentId === null
      );
      const clonedChild = sceneStore.activeScene.entities.find(
        e => e.id !== 'ent_parent_1' && e.id !== 'ent_child_1' && e.parentId !== null
      );

      expect(clonedParent).toBeDefined();
      expect(clonedChild).toBeDefined();
      // Cloned child MUST point to the new cloned parent, not the old parent
      expect(clonedChild.parentId).toBe(clonedParent.id);
      expect(clonedIds).toContain(clonedParent.id);
      expect(clonedIds).toContain(clonedChild.id);

      // Selected IDs must change to the newly duplicated parent and all its children
      expect(sceneStore.selectedEntityIds).toEqual(clonedIds);
      expect(engineBridge.selectEntity).toHaveBeenCalledWith(clonedIds);
    });

    it('deleting duplicated parent cleanly deletes both parent and all cloned children from scene and engineBridge', () => {
      const parent = entitySchema({
        id: 'p_src',
        scriptId: 'ParentSrc',
        layerId: 'layer_world_default',
        parentId: null
      });
      const child = entitySchema({
        id: 'c_src',
        scriptId: 'ChildSrc',
        layerId: 'layer_world_default',
        parentId: 'p_src'
      });
      sceneStore.activeScene.entities.push(parent, child);
      sceneStore.selectedEntityIds = ['p_src', 'c_src'];

      // Act 1: Duplicate
      const clonedIds = sceneStore.duplicateEntity();
      expect(clonedIds).toHaveLength(2);
      expect(sceneStore.selectedEntityIds).toEqual(clonedIds);

      const clonedParentId = clonedIds[0];
      const clonedChildId = clonedIds[1];

      // Act 2: Delete via selected targets (just like user pressing Delete after duplicate)
      const targetsToDelete = [...sceneStore.selectedEntityIds];
      targetsToDelete.forEach(id => sceneStore.deleteEntity(id));

      // Assert
      expect(sceneStore.activeScene.entities).toHaveLength(2); // Only original p_src and c_src remain
      expect(sceneStore.activeScene.entities.some(e => e.id === clonedParentId)).toBe(false);
      expect(sceneStore.activeScene.entities.some(e => e.id === clonedChildId)).toBe(false);

      expect(engineBridge.deleteEntity).toHaveBeenCalledWith(clonedParentId);
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith(clonedChildId);
    });

    it('assigns sequential orderIndex starting after maximum orderIndex in the layer', () => {
      // Arrange
      const entA = entitySchema({
        id: 'ent_a',
        scriptId: 'EntityA',
        layerId: 'layer_world_default',
        orderIndex: 5
      });
      const entB = entitySchema({
        id: 'ent_b',
        scriptId: 'EntityB',
        layerId: 'layer_world_default',
        orderIndex: 6
      });
      sceneStore.activeScene.entities.push(entA, entB);

      sceneStore.selectedEntityIds = ['ent_a', 'ent_b'];

      // Act
      const clonedIds = sceneStore.duplicateEntity();

      // Assert
      const clones = sceneStore.activeScene.entities.filter(e => clonedIds.includes(e.id));
      expect(clones).toHaveLength(2);
      expect(clones[0].orderIndex).toBe(7);
      expect(clones[1].orderIndex).toBe(8);
    });
  });

  describe('Entity Copy-Paste and Clipboard Isolation', () => {
    it('copies selected top-level entities and sequential orderIndex on paste', () => {
      const parent = entitySchema({
        id: 'parent_src',
        scriptId: 'SrcParent',
        layerId: 'layer_world_default',
        parentId: null,
        orderIndex: 0
      });
      const child = entitySchema({
        id: 'child_src',
        scriptId: 'SrcChild',
        layerId: 'layer_world_default',
        parentId: 'parent_src',
        orderIndex: 1
      });
      sceneStore.activeScene.entities.push(parent, child);
      sceneStore.selectedEntityIds = ['parent_src', 'child_src'];

      // Act: Copy then Paste via useClipboard
      clipboard.copy();

      // Verify clipboard has top-level only (child is included in descendants)
      expect(workspaceStore.clipboard.type).toBe('entity');
      expect(workspaceStore.clipboard.data).toHaveLength(1);
      expect(workspaceStore.clipboard.data[0].root.id).toBe('parent_src');
      expect(workspaceStore.clipboard.data[0].descendants).toHaveLength(1);

      clipboard.paste();

      // Assert:
      expect(sceneStore.activeScene.entities).toHaveLength(4);

      const pastedParent = sceneStore.activeScene.entities.find(
        e => e.id !== 'parent_src' && e.id !== 'child_src' && e.parentId === null
      );
      const pastedChild = sceneStore.activeScene.entities.find(
        e => e.id !== 'parent_src' && e.id !== 'child_src' && e.parentId !== null
      );

      expect(pastedParent).toBeDefined();
      expect(pastedChild).toBeDefined();
      expect(pastedChild.parentId).toBe(pastedParent.id);
      expect(pastedParent.orderIndex).toBe(1);
      expect(pastedChild.orderIndex).toBe(1);
    });

    it('does not leak or paste asset items into scene entities', () => {
      // Arrange: entity in scene
      const ent = entitySchema({
        id: 'ent_test',
        scriptId: 'TestEnt',
        layerId: 'layer_world_default',
        orderIndex: 0
      });
      sceneStore.activeScene.entities.push(ent);

      // User selects entity and copies
      sceneStore.selectedEntityIds = ['ent_test'];
      clipboard.copy();

      const initialCount = sceneStore.activeScene.entities.length;
      clipboard.paste();

      // Pasted entities must only be valid scene entities
      expect(sceneStore.activeScene.entities.length).toBe(initialCount + 1);
      const newEntity = sceneStore.activeScene.entities[sceneStore.activeScene.entities.length - 1];
      expect(newEntity.layerId).toBe('layer_world_default');
      expect(newEntity.scriptId).toContain('TestEnt');
    });
  });

  describe('Layer Duplication Hierarchy Preservation', () => {
    it('preserves child-parent entity hierarchy within duplicated layer', () => {
      const sourceLayer = sceneStore.activeScene.layersWorld[0];
      const parent = entitySchema({
        id: 'layer_ent_parent',
        scriptId: 'LayerParent',
        layerId: sourceLayer.id,
        parentId: null,
        orderIndex: 0
      });
      const child = entitySchema({
        id: 'layer_ent_child',
        scriptId: 'LayerChild',
        layerId: sourceLayer.id,
        parentId: 'layer_ent_parent',
        orderIndex: 1
      });
      sceneStore.activeScene.entities.push(parent, child);

      // Act: Duplicate source layer
      const createdLayerIds = sceneStore.duplicateLayer(sourceLayer.id);

      // Assert
      expect(createdLayerIds).toHaveLength(1);
      const newLayerId = createdLayerIds[0];
      const entitiesInNewLayer = sceneStore.activeScene.entities.filter(e => e.layerId === newLayerId);
      expect(entitiesInNewLayer).toHaveLength(2);

      const newParent = entitiesInNewLayer.find(e => e.parentId === null);
      const newChild = entitiesInNewLayer.find(e => e.parentId !== null);

      expect(newParent).toBeDefined();
      expect(newChild).toBeDefined();
      // Crucial: The child in the new layer must NOT be flattened to null, but point to newParent.id
      expect(newChild.parentId).toBe(newParent.id);
      expect(newParent.orderIndex).toBe(0);
      expect(newChild.orderIndex).toBe(1);
    });
  });
});
