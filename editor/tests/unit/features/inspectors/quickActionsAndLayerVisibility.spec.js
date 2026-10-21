import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { EditorProject } from '@inspectors/inspectors.js';
import { SettingsTabPreferences } from '@settings/settings.js';
import { useProjectStore, projectSchema } from '@projects/projects.js';
import { useSceneStore, sceneSchema } from '@scenes/scenes.js';
import RenderUtils from '@core/Renderer/Scene/RenderUtils.js';
import Config from '@core/Core/Config.js';
import World from '@core/Core/World.js';

describe('Quick Actions & Layer Visibility Suite', () => {
  let projectStore;
  let sceneStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    projectStore = useProjectStore();
    sceneStore = useSceneStore();

    projectStore.project = projectSchema({ id: 'proj_test', name: 'Test' });
    const scene = sceneSchema({ id: 'scene_test', scriptId: 'Scene_1' });
    sceneStore.scenes = [scene];
    sceneStore.activeSceneId = scene.id;
  });

  describe('EditorProject Quick Actions', () => {
    it('renders exactly the 6 required quick action checkboxes and removes old grid/snap/rulers items', () => {
      const wrapper = mount(EditorProject);

      // Verify the 6 quick actions are present
      expect(wrapper.find('[data-testid="project-show-ui-bounds-toggle"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-show-world-bounds-toggle"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-show-collider-solid-toggle"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-show-collider-trigger-toggle"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-show-collider-hitbox-toggle"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-show-collider-hurtbox-toggle"]').exists()).toBe(true);

      // Verify removed items are NOT present in Quick Actions
      expect(wrapper.find('[data-testid="project-show-grid-toggle"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="project-snap-grid-toggle"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="project-show-rulers-toggle"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="project-enable-ui-toggle"]').exists()).toBe(false);

      // Verify there are exactly 6 checkboxes inside the quick actions section
      const checkboxes = wrapper.findAllComponents({ name: 'BaseCheckbox' });
      expect(checkboxes.length).toBe(6);
    });

    it('toggles collider visibility settings properly', async () => {
      const wrapper = mount(EditorProject);

      const solidToggle = wrapper.find('[data-testid="project-show-collider-solid-toggle"] input[type="checkbox"]');
      expect(solidToggle.element.checked).toBe(true);

      await solidToggle.setValue(false);
      expect(projectStore.project.settings.colliders.solid).toBe(false);

      const triggerToggle = wrapper.find('[data-testid="project-show-collider-trigger-toggle"] input[type="checkbox"]');
      await triggerToggle.setValue(false);
      expect(projectStore.project.settings.colliders.trigger).toBe(false);

      const hitboxToggle = wrapper.find('[data-testid="project-show-collider-hitbox-toggle"] input[type="checkbox"]');
      await hitboxToggle.setValue(false);
      expect(projectStore.project.settings.colliders.hitbox).toBe(false);

      const hurtboxToggle = wrapper.find('[data-testid="project-show-collider-hurtbox-toggle"] input[type="checkbox"]');
      await hurtboxToggle.setValue(false);
      expect(projectStore.project.settings.colliders.hurtbox).toBe(false);
    });

    it('toggles world bounds properly', async () => {
      const wrapper = mount(EditorProject);

      const worldBoundsToggle = wrapper.find('[data-testid="project-show-world-bounds-toggle"] input[type="checkbox"]');
      expect(worldBoundsToggle.element.checked).toBe(true);

      await worldBoundsToggle.setValue(false);
      expect(sceneStore.activeScene.settings.worldBounds.active).toBe(false);
    });
  });

  describe('SettingsTabPreferences Editor Rulers', () => {
    it('renders Show Editor Rulers toggle in preferences tab and reflects state', async () => {
      const wrapper = mount(SettingsTabPreferences, {
        props: {
          info: { id: 'preferences', label: 'Preferences', desc: 'Editor preferences' }
        }
      });

      const rulersToggle = wrapper.find('[data-testid="preferences-show-rulers-toggle"]');
      expect(rulersToggle.exists()).toBe(true);

      const checkbox = rulersToggle.find('input[type="checkbox"]');
      expect(checkbox.element.checked).toBe(true);

      await checkbox.setValue(false);
      expect(sceneStore.activeScene.settings.showRulers).toBe(false);
    });
  });

  describe('World and UI Layer Visibility Toggles', () => {
    it('toggles World layer visibility via project store action', () => {
      expect(projectStore.project.settings.world.visible).toBe(true);
      expect(projectStore.project.settings.world.active).toBe(true);

      projectStore.toggleWorldVisibility();
      expect(projectStore.project.settings.world.visible).toBe(false);
      expect(projectStore.project.settings.world.active).toBe(false);

      // Reactivate
      projectStore.toggleWorldVisibility();
      expect(projectStore.project.settings.world.visible).toBe(true);
      expect(projectStore.project.settings.world.active).toBe(true);
    });

    it('toggles UI layer visibility via project store action', () => {
      expect(projectStore.project.settings.ui.visible).toBe(true);
      expect(projectStore.project.settings.ui.active).toBe(true);

      projectStore.toggleUIVisibility();
      expect(projectStore.project.settings.ui.visible).toBe(false);
      expect(projectStore.project.settings.ui.active).toBe(false);

      // Reactivate
      projectStore.toggleUIVisibility();
      expect(projectStore.project.settings.ui.visible).toBe(true);
      expect(projectStore.project.settings.ui.active).toBe(true);
    });
  });

  describe('RenderUtils Collider Debug Filtering', () => {
    it('filters colliders based on collidersConfig flags', () => {
      Config.ENGINE_MODE = 'editor';
      const comps = {
        Collider: {
          data: [
            { id: 'c1', type: 'solid', enabled: true, width: 32, height: 32 },
            { id: 'c2', type: 'trigger', enabled: true, width: 32, height: 32 },
            { id: 'c3', type: 'hitbox', enabled: true, width: 32, height: 32 },
            { id: 'c4', type: 'hurtbox', enabled: true, width: 32, height: 32 },
          ]
        }
      };

      const globalT = { width: 32, height: 32, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 };
      const trans = { x: 0, y: 0, width: 32, height: 32, rotation: 0 };
      const renderQueue = [];

      // All enabled
      RenderUtils.processColliderDebug(comps, globalT, trans, renderQueue, [0,1,0,1], [1,1,0,1], [1,0,0,1], [0,0,1,1], {
        solid: true, trigger: true, hitbox: true, hurtbox: true
      });
      expect(renderQueue.length).toBe(4);

      // Disable solid and hitbox
      renderQueue.length = 0;
      RenderUtils.processColliderDebug(comps, globalT, trans, renderQueue, [0,1,0,1], [1,1,0,1], [1,0,0,1], [0,0,1,1], {
        solid: false, trigger: true, hitbox: false, hurtbox: true
      });
      expect(renderQueue.length).toBe(2);

      // All disabled
      renderQueue.length = 0;
      RenderUtils.processColliderDebug(comps, globalT, trans, renderQueue, [0,1,0,1], [1,1,0,1], [1,0,0,1], [0,0,1,1], {
        solid: false, trigger: false, hitbox: false, hurtbox: false
      });
      expect(renderQueue.length).toBe(0);
    });
  });
});
