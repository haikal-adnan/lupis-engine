import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabPreferences from '@settings/projects/layouts/section/SettingsTabPreferences.vue';

import { useTheme } from '@composables/composables.js';
import { useProjectStore } from '@projects/projects.js';

describe('SettingsTabPreferences Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const { isDark } = useTheme();
    isDark.value = false;
    document.documentElement.classList.remove('dark');
    localStorage.clear();

    const projectStore = useProjectStore();
    projectStore.project = {
      name: 'Test Project',
      settings: {
        codeEditor: { zoom: 100 },
        showRulers: true
      }
    };
  });

  it('renders theme mode options and quick toggle', () => {
    const wrapper = mount(SettingsTabPreferences, {
      props: {
        info: { id: 'preferences', label: 'Preferences', desc: 'Editor preferences' }
      }
    });

    expect(wrapper.find('[data-testid="theme-option-dark"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="theme-option-light"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="theme-toggle-btn"]').exists()).toBe(true);
  });

  it('does not render performance and motion toggle', () => {
    const wrapper = mount(SettingsTabPreferences);
    expect(wrapper.find('[data-testid="preferences-reduce-motion-toggle"]').exists()).toBe(false);
  });

  it('renders code zoom level percentage with current project value and updates it', async () => {
    const projectStore = useProjectStore();
    const wrapper = mount(SettingsTabPreferences);

    const zoomInput = wrapper.find('[data-testid="preferences-code-zoom-input"] input');
    expect(zoomInput.exists()).toBe(true);
    expect(zoomInput.element.value).toBe('100');

    await zoomInput.setValue('120');
    await zoomInput.trigger('change');

    expect(projectStore.project.settings.codeEditor.zoom).toBe(120);
  });

  it('switches to dark theme when dark option is selected', async () => {
    const wrapper = mount(SettingsTabPreferences);

    const darkOption = wrapper.find('[data-testid="theme-option-dark"]');
    await darkOption.trigger('click');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(wrapper.find('[data-testid="theme-toggle-btn"]').attributes('data-theme')).toBe('dark');
  });

  it('toggles theme between dark and light via quick toggle button', async () => {
    const wrapper = mount(SettingsTabPreferences);

    const toggleBtn = wrapper.find('[data-testid="theme-toggle-btn"]');
    await toggleBtn.trigger('click');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await toggleBtn.trigger('click');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
