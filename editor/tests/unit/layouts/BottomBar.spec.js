import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import BottomBar from '@/layouts/parts/BottomBar.vue';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useFolderStore } from '@folders/folders.js';

describe('BottomBar Layout Component', () => {
  let workspaceStore;
  let folderStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    workspaceStore = useWorkspaceStore();
    folderStore = useFolderStore();
  });

  it('renders visible tabs correctly and switches section on click', async () => {
    folderStore.switchSection = vi.fn();

    const wrapper = mount(BottomBar);

    // Initial tab is assets
    expect(wrapper.find('[data-testid="bottom-tab-assets"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="bottom-tab-scripts"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="bottom-tab-prefabs"]').exists()).toBe(true);

    // Click Scripts tab
    await wrapper.find('[data-testid="bottom-tab-scripts"]').trigger('click');

    expect(workspaceStore.activeBottomTabId).toBe('scripts');
    expect(folderStore.switchSection).toHaveBeenCalledWith('scripts', 'assets');

    // Click Prefabs tab
    await wrapper.find('[data-testid="bottom-tab-prefabs"]').trigger('click');

    expect(workspaceStore.activeBottomTabId).toBe('prefabs');
    expect(folderStore.switchSection).toHaveBeenCalledWith('prefabs', 'scripts');
  });

  it('toggles bottom bar when clicking currently active tab while open', async () => {
    workspaceStore.activeBottomTabId = 'assets';
    workspaceStore.isBottomBarOpen = true;

    const wrapper = mount(BottomBar);

    await wrapper.find('[data-testid="bottom-tab-assets"]').trigger('click');

    expect(workspaceStore.isBottomBarOpen).toBe(false);
  });
});
