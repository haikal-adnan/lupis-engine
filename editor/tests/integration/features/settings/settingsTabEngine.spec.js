import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabEngine from '@settings/projects/layouts/section/SettingsTabEngine.vue';
import { useProjectStore } from '@projects/projects.js';
import { useSceneStore } from '@scenes/scenes.js';

describe('SettingsTabEngine Integration - Engine & Canvas Settings', () => {
  let projectStore;
  let sceneStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    projectStore = useProjectStore();
    sceneStore = useSceneStore();

    projectStore.project = {
      id: 'proj_engine_test',
      name: 'Engine Settings Test',
      settings: {
        tickRate: 60,
        ui: {
          width: 1920,
          height: 1080,
          showUIBorder: true,
          active: true,
          smartGuides: true
        }
      }
    };
  });

  it('renders the Smart Guides checkbox in Viewport & Resolution section', () => {
    const wrapper = mount(SettingsTabEngine, {
      props: {
        info: { id: 'engine', label: 'Engine & Canvas', desc: 'Core game loop and canvas settings.' }
      }
    });

    const smartGuidesCheckbox = wrapper.find('[data-testid="settings-smart-guides-checkbox"]');
    expect(smartGuidesCheckbox.exists()).toBe(true);
    expect(smartGuidesCheckbox.text()).toContain('Enable Smart Guides (UI)');
  });

  it('toggles smartGuides setting in projectStore when checkbox is clicked', async () => {
    const wrapper = mount(SettingsTabEngine, {
      props: {
        info: { id: 'engine', label: 'Engine & Canvas', desc: 'Core game loop and canvas settings.' }
      }
    });

    expect(projectStore.project.settings.ui.smartGuides).toBe(true);

    const smartGuidesCheckbox = wrapper.find('[data-testid="settings-smart-guides-checkbox"] input[type="checkbox"]');
    await smartGuidesCheckbox.setValue(false);

    expect(projectStore.project.settings.ui.smartGuides).toBe(false);

    await smartGuidesCheckbox.setValue(true);
    expect(projectStore.project.settings.ui.smartGuides).toBe(true);
  });

  it('disables smartGuides checkbox when UI layer is inactive', () => {
    projectStore.project.settings.ui.active = false;

    const wrapper = mount(SettingsTabEngine, {
      props: {
        info: { id: 'engine', label: 'Engine & Canvas', desc: 'Core game loop and canvas settings.' }
      }
    });

    const smartGuidesInput = wrapper.find('[data-testid="settings-smart-guides-checkbox"] input[type="checkbox"]');
    expect(smartGuidesInput.attributes('disabled')).toBeDefined();
  });
});
