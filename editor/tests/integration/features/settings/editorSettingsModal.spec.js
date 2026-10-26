import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import EditorSettingsModal from '@settings/projects/layouts/EditorSettingsModal.vue';
import { useProjectStore } from '@projects/projects.js';

describe('EditorSettingsModal Integration', () => {
  it('renders settings sidebar with About tab and displays SettingsTabAbout when clicked', async () => {
    setActivePinia(createPinia());
    const projectStore = useProjectStore();
    projectStore.project = {
      id: 'test_proj_modal',
      name: 'Modal Test Project',
      version: '1.0.0',
      settings: { autoSave: { enabled: false, interval: 10 } }
    };

    const wrapper = mount(EditorSettingsModal, {
      props: {
        isOpen: true
      },
      global: {
        stubs: {
          teleport: true
        }
      }
    });

    // Check about tab button exists in sidebar
    const aboutTabBtn = wrapper.find('[data-testid="settings-tab-about"]');
    expect(aboutTabBtn.exists()).toBe(true);
    expect(aboutTabBtn.text()).toContain('About');

    // Click About tab
    await aboutTabBtn.trigger('click');

    // SettingsTabAbout content should now be rendered
    const aboutContent = wrapper.find('[data-testid="settings-tab-about-content"]');
    expect(aboutContent.exists()).toBe(true);
    expect(aboutContent.text()).toContain('Lupis Engine');
    expect(aboutContent.text()).toContain('0.1.0');
  });
});
