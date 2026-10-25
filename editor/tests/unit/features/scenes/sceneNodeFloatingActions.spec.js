import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SceneNode from '@scenes/layouts/SceneNode.vue';
import SceneTree from '@scenes/layouts/SceneTree.vue';
import { useSceneStore, useEntityActions, useLayerActions, sceneSchema, entitySchema, layerSchema } from '@scenes/scenes.js';
import * as scenesModule from '@scenes/scenes.js';
import { useProjectStore, projectSchema } from '@projects/projects.js';

describe('SceneNode Floating Figma-Style Actions and Context Menu', () => {
  let sceneStore;
  let projectStore;
  let entityActions;
  let layerActions;

  beforeEach(() => {
    setActivePinia(createPinia());
    sceneStore = useSceneStore();
    projectStore = useProjectStore();

    projectStore.project = projectSchema({ id: 'proj_test', name: 'Test' });
    const scene = sceneSchema({ id: 'scene_test', scriptId: 'Scene_1' });
    sceneStore.scenes = [scene];
    sceneStore.activeSceneId = scene.id;
    entityActions = scenesModule.useEntityActions();
    layerActions = scenesModule.useLayerActions();
    vi.spyOn(scenesModule, 'useEntityActions').mockReturnValue(entityActions);
    vi.spyOn(scenesModule, 'useLayerActions').mockReturnValue(layerActions);
  });

  describe('Layout & Structure', () => {
    it('renders root and row with full width and floating sticky button container without blur or animation', () => {
      const node = {
        id: 'ent_1',
        scriptId: 'MyLongScriptIdEntity1234567890',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const root = wrapper.find('[data-testid="hierarchy-node-root"]');
      expect(root.classes()).toContain('min-w-full');
      expect(root.classes()).toContain('w-full');

      const row = wrapper.find('[data-testid="hierarchy-node"]');
      expect(row.classes()).toContain('w-full');
      expect(row.classes()).toContain('min-w-full');

      const actionButtons = row.find('.sticky.right-1');
      expect(actionButtons.exists()).toBe(true);
      expect(actionButtons.classes()).toContain('ml-auto');
      expect(actionButtons.classes()).toContain('shrink-0');

      // Zero blur, zero animation/transition classes
      expect(actionButtons.classes()).not.toContain('backdrop-blur-sm');
      expect(actionButtons.classes()).not.toContain('transition-all');
      expect(actionButtons.classes()).not.toContain('duration-150');
    });

    it('renders lock and visibility buttons, but does NOT render context menu button', () => {
      const node = {
        id: 'ent_1',
        scriptId: 'Entity_1',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      expect(wrapper.find('[data-testid="hierarchy-node-lock-button"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="hierarchy-node-visibility-button"]').exists()).toBe(true);
      // Context menu is not a button
      expect(wrapper.find('[data-testid="hierarchy-node-menu-button"]').exists()).toBe(false);
    });
  });

  describe('Figma-Style Hover & Active Visibility States', () => {
    it('hides inactive buttons by default and reveals them instantly on row hover without width animation', () => {
      const node = {
        id: 'ent_1',
        scriptId: 'Entity_1',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const actionContainer = wrapper.find('.sticky.right-1');
      // Inactive: opacity-0 group-hover/node:opacity-100
      expect(actionContainer.classes()).toContain('opacity-0');
      expect(actionContainer.classes()).toContain('group-hover/node:opacity-100');

      const lockBtn = wrapper.find('[data-testid="hierarchy-node-lock-button"]');
      expect(lockBtn.classes()).toContain('w-5');
      expect(lockBtn.classes()).toContain('opacity-0');
      expect(lockBtn.classes()).toContain('group-hover/node:opacity-100');
      expect(lockBtn.classes()).not.toContain('w-0');
      expect(lockBtn.classes()).not.toContain('transition-all');

      const visBtn = wrapper.find('[data-testid="hierarchy-node-visibility-button"]');
      expect(visBtn.classes()).toContain('w-5');
      expect(visBtn.classes()).toContain('opacity-0');
      expect(visBtn.classes()).toContain('group-hover/node:opacity-100');
      expect(visBtn.classes()).not.toContain('w-0');
      expect(visBtn.classes()).not.toContain('transition-all');
    });

    it('keeps lock button visible without hover when locked', () => {
      const node = {
        id: 'ent_locked',
        scriptId: 'LockedEntity',
        type: 'entity',
        locked: true,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const actionContainer = wrapper.find('.sticky.right-1');
      expect(actionContainer.classes()).toContain('opacity-100');

      const lockBtn = wrapper.find('[data-testid="hierarchy-node-lock-button"]');
      expect(lockBtn.classes()).toContain('w-5');
      expect(lockBtn.classes()).toContain('opacity-100');

      const visBtn = wrapper.find('[data-testid="hierarchy-node-visibility-button"]');
      expect(visBtn.classes()).toContain('opacity-0');
      expect(visBtn.classes()).toContain('group-hover/node:opacity-100');
    });

    it('keeps visibility button visible without hover when hidden', () => {
      const node = {
        id: 'ent_hidden',
        scriptId: 'HiddenEntity',
        type: 'entity',
        locked: false,
        visible: false,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const actionContainer = wrapper.find('.sticky.right-1');
      expect(actionContainer.classes()).toContain('opacity-100');

      const visBtn = wrapper.find('[data-testid="hierarchy-node-visibility-button"]');
      expect(visBtn.classes()).toContain('w-5');
      expect(visBtn.classes()).toContain('opacity-100');

      const lockBtn = wrapper.find('[data-testid="hierarchy-node-lock-button"]');
      expect(lockBtn.classes()).toContain('opacity-0');
      expect(lockBtn.classes()).toContain('group-hover/node:opacity-100');
    });

    it('keeps both lock and visibility buttons visible when both are active', () => {
      const node = {
        id: 'ent_both',
        scriptId: 'LockedAndHiddenEntity',
        type: 'entity',
        locked: true,
        visible: false,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const actionContainer = wrapper.find('.sticky.right-1');
      expect(actionContainer.classes()).toContain('opacity-100');

      const lockBtn = wrapper.find('[data-testid="hierarchy-node-lock-button"]');
      expect(lockBtn.classes()).toContain('w-5');
      expect(lockBtn.classes()).toContain('opacity-100');

      const visBtn = wrapper.find('[data-testid="hierarchy-node-visibility-button"]');
      expect(visBtn.classes()).toContain('w-5');
      expect(visBtn.classes()).toContain('opacity-100');
    });
  });

  describe('User Actions & Events', () => {
    it('triggers sceneStore.updateEntityProp when lock button is clicked', async () => {
      const updateEntityPropSpy = vi.spyOn(entityActions, 'updateEntityProp').mockImplementation(() => {});

      const node = {
        id: 'ent_1',
        scriptId: 'Entity_1',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const lockBtn = wrapper.find('[data-testid="hierarchy-node-lock-button"]');
      await lockBtn.trigger('click');

      expect(updateEntityPropSpy).toHaveBeenCalledWith('ent_1', 'locked', true);
    });

    it('triggers sceneStore.updateEntityProp when visibility button is clicked', async () => {
      const updateEntityPropSpy = vi.spyOn(entityActions, 'updateEntityProp').mockImplementation(() => {});

      const node = {
        id: 'ent_1',
        scriptId: 'Entity_1',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const visBtn = wrapper.find('[data-testid="hierarchy-node-visibility-button"]');
      await visBtn.trigger('click');

      expect(updateEntityPropSpy).toHaveBeenCalledWith('ent_1', 'visible', false);
    });

    it('triggers sceneStore.updateLayerProp for layer nodes', async () => {
      const updateLayerPropSpy = vi.spyOn(layerActions, 'updateLayerProp').mockImplementation(() => {});

      const node = {
        id: 'layer_1',
        scriptId: 'Layer_1',
        type: 'layer',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      await wrapper.find('[data-testid="hierarchy-node-lock-button"]').trigger('click');
      expect(updateLayerPropSpy).toHaveBeenCalledWith('layer_1', 'locked', true);

      await wrapper.find('[data-testid="hierarchy-node-visibility-button"]').trigger('click');
      expect(updateLayerPropSpy).toHaveBeenCalledWith('layer_1', 'visible', false);
    });

    it('emits contextmenu when right-clicking on the node row', async () => {
      const node = {
        id: 'ent_1',
        scriptId: 'Entity_1',
        type: 'entity',
        locked: false,
        visible: true,
        children: []
      };

      const wrapper = mount(SceneNode, {
        props: { node }
      });

      const row = wrapper.find('[data-testid="hierarchy-node"]');
      await row.trigger('contextmenu');

      expect(wrapper.emitted('contextmenu')).toBeTruthy();
      expect(wrapper.emitted('contextmenu')[0][0].node).toEqual(node);
    });
  });

  describe('SceneTree Layer Visibility Controls', () => {
    it('shows and toggles World and UI layer visibility indicators in headers', async () => {
      const dummyData = {
        worldTree: [],
        uiTree: []
      };

      const wrapper = mount(SceneTree, {
        props: {
          data: dummyData,
          selectedIds: []
        }
      });

      // Initially both visible, indicators not present
      expect(wrapper.find('[data-testid="hierarchy-world-visibility-indicator"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="hierarchy-ui-visibility-indicator"]').exists()).toBe(false);

      // Hide World layer
      projectStore.toggleWorldVisibility();
      await wrapper.vm.$nextTick();

      const worldIndicator = wrapper.find('[data-testid="hierarchy-world-visibility-indicator"]');
      expect(worldIndicator.exists()).toBe(true);

      // Clicking indicator restores World visibility
      await worldIndicator.trigger('click');
      expect(projectStore.project.settings.world.visible).toBe(true);

      // Hide UI layer
      projectStore.toggleUIVisibility();
      await wrapper.vm.$nextTick();

      const uiIndicator = wrapper.find('[data-testid="hierarchy-ui-visibility-indicator"]');
      expect(uiIndicator.exists()).toBe(true);

      // Clicking indicator restores UI visibility
      await uiIndicator.trigger('click');
      expect(projectStore.project.settings.ui.visible).toBe(true);
    });
  });
});
