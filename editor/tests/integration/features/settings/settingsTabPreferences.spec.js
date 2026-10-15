import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabPreferences from '@settings/projects/layouts/section/SettingsTabPreferences.vue';

import { useTheme } from '@composables/composables.js';

describe('SettingsTabPreferences Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const { isDark } = useTheme();
    isDark.value = false;
    document.documentElement.classList.remove('dark');
    localStorage.clear();
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
