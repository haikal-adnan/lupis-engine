import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import RenderUtils from '@core/Renderer/Scene/RenderUtils.js';
import { useSceneStore, useHierarchyLogic, entitySchema, layerSchema } from '@scenes/scenes.js';

describe('Hierarchy Figma-like Lock, Active, and Visible Inheritance', () => {
  let sceneStore;
  let mockWorld;

  beforeEach(() => {
    setActivePinia(createPinia());
    sceneStore = useSceneStore();

    const layer = layerSchema({
      id: 'layer_world_main',
      scriptId: 'MainLayer',
      section: 'world'
    });

    sceneStore.scenes = [{
      id: 'scene_figma_test',
      name: 'Figma Test Scene',
      layersWorld: [layer],
      layersUI: [],
      entities: []
    }];
    sceneStore.activeSceneId = 'scene_figma_test';
  });

  describe('RenderUtils Effective State Helpers', () => {
    it('propagates parent locked state down hierarchy without mutating child local property', () => {
      const parent = { id: 'p1', parentId: null, locked: false, active: true, visible: true };
      const child = { id: 'c1', parentId: 'p1', locked: false, active: true, visible: true };
      const grandchild = { id: 'g1', parentId: 'c1', locked: true, active: true, visible: true };

      mockWorld = { entities: [parent, child, grandchild] };

      // Initial state: parent unlocked, child unlocked, grandchild locked
      expect(RenderUtils.isEntityEffectivelyLocked(parent, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyLocked(child, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyLocked(grandchild, mockWorld)).toBe(true);

      // Parent becomes locked
      parent.locked = true;
      expect(RenderUtils.isEntityEffectivelyLocked(parent, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyLocked(child, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyLocked(grandchild, mockWorld)).toBe(true);

      // Verify child's own property was NOT mutated
      expect(child.locked).toBe(false);
      expect(grandchild.locked).toBe(true);

      // Parent is unlocked again -> child reverts to unlocked, but grandchild remains locked
      parent.locked = false;
      expect(RenderUtils.isEntityEffectivelyLocked(parent, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyLocked(child, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyLocked(grandchild, mockWorld)).toBe(true);
    });

    it('propagates parent visibility state down hierarchy without mutating child local property', () => {
      const parent = { id: 'p1', parentId: null, visible: true, active: true, locked: false };
      const child = { id: 'c1', parentId: 'p1', visible: false, active: true, locked: false };
      const grandchild = { id: 'g1', parentId: 'c1', visible: true, active: true, locked: false };

      mockWorld = { entities: [parent, child, grandchild] };

      // Initial: child is individually hidden
      expect(RenderUtils.isEntityEffectivelyVisible(parent, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyVisible(child, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyVisible(grandchild, mockWorld)).toBe(false);

      // Parent is hidden
      parent.visible = false;
      expect(RenderUtils.isEntityEffectivelyVisible(parent, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyVisible(child, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyVisible(grandchild, mockWorld)).toBe(false);

      // Parent is shown again -> child with own visible: false remains hidden
      parent.visible = true;
      expect(RenderUtils.isEntityEffectivelyVisible(parent, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyVisible(child, mockWorld)).toBe(false);
      expect(child.visible).toBe(false);
      expect(grandchild.visible).toBe(true);
    });

    it('propagates parent active state down hierarchy without mutating child local property', () => {
      const parent = { id: 'p1', parentId: null, active: true, visible: true, locked: false };
      const child = { id: 'c1', parentId: 'p1', active: true, visible: true, locked: false };
      const grandchild = { id: 'g1', parentId: 'c1', active: false, visible: true, locked: false };

      mockWorld = { entities: [parent, child, grandchild] };

      expect(RenderUtils.isEntityEffectivelyActive(parent, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyActive(child, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyActive(grandchild, mockWorld)).toBe(false);

      // Parent deactivated
      parent.active = false;
      expect(RenderUtils.isEntityEffectivelyActive(parent, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyActive(child, mockWorld)).toBe(false);
      expect(RenderUtils.isEntityEffectivelyActive(grandchild, mockWorld)).toBe(false);

      // Parent reactivated
      parent.active = true;
      expect(RenderUtils.isEntityEffectivelyActive(parent, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyActive(child, mockWorld)).toBe(true);
      expect(RenderUtils.isEntityEffectivelyActive(grandchild, mockWorld)).toBe(false);
    });
  });

  describe('useHierarchyLogic treeData State Propagation', () => {
    it('computes effective and inherited flags for hierarchy nodes without altering entities array', () => {
      const parent = entitySchema({
        id: 'ent_p',
        scriptId: 'ParentNode',
        layerId: 'layer_world_main',
        parentId: null,
        locked: true,
        visible: true,
        active: true
      });
      const child = entitySchema({
        id: 'ent_c',
        scriptId: 'ChildNode',
        layerId: 'layer_world_main',
        parentId: 'ent_p',
        locked: false,
        visible: false,
        active: true
      });

      sceneStore.activeScene.entities.push(parent, child);
      const { treeData } = useHierarchyLogic();

      const worldRoot = treeData.value.worldTree[0];
      const parentNode = worldRoot.children.find(n => n.id === 'ent_p');
      const childNode = parentNode.children.find(n => n.id === 'ent_c');

      // Parent node flags
      expect(parentNode.effectiveLocked).toBe(true);
      expect(parentNode.effectiveVisible).toBe(true);
      expect(parentNode.inheritedLocked).toBe(false);

      // Child node flags: inherits locked from parent, but retains own visible: false
      expect(childNode.effectiveLocked).toBe(true);
      expect(childNode.inheritedLocked).toBe(true);
      expect(childNode.ownLocked).toBe(false);

      expect(childNode.effectiveVisible).toBe(false);
      expect(childNode.ownVisible).toBe(false);

      // Entity in store must not be mutated
      const storeChild = sceneStore.activeScene.entities.find(e => e.id === 'ent_c');
      expect(storeChild.locked).toBe(false);
      expect(storeChild.visible).toBe(false);
    });
  });
});
