import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsTabProject from '@settings/projects/layouts/section/SettingsTabProject.vue';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

// Mock composables
const mockConfirm = vi.fn();
const mockShowPop = vi.fn();

vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useConfirm: () => ({ confirm: mockConfirm }),
    usePopAlert: () => ({ showPop: mockShowPop })
  };
});

describe('SettingsTabProject Integration', () => {
  let projectStore;
  let workspaceStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    projectStore = useProjectStore();
    workspaceStore = useWorkspaceStore();

    projectStore.project = {
      id: 'proj_test_settings_101',
      name: 'Initial Project Name',
      description: 'Initial description',
      version: '1.0.0',
      status: 'DRAFT',
      createdAt: '2026-01-01T00:00:00.000Z',
      thumbnailUrl: null,
      snapshotUrl: 'data:image/jpeg;base64,auto_scene_snapshot_data',
      settings: {
        tickRate: 60,
        autoSave: {
          enabled: false,
          interval: 10
        }
      }
    };
    projectStore.syncStatus = 'synced';
    workspaceStore.setProjectId('proj_test_settings_101');
  });

  it('renders initial project metadata correctly in active inputs and badges', () => {
    const wrapper = mount(SettingsTabProject, {
      props: {
        info: { id: 'project', label: 'Project Info', desc: 'Metadata settings' }
      }
    });

    const nameInput = wrapper.find('[data-testid="project-name-input"] input');
    expect(nameInput.exists()).toBe(true);
    expect(nameInput.element.value).toBe('Initial Project Name');

    const descTextarea = wrapper.find('[data-testid="project-desc-input"] textarea');
    expect(descTextarea.exists()).toBe(true);
    expect(descTextarea.element.value).toBe('Initial description');

    const versionInput = wrapper.find('[data-testid="project-version-input"] input');
    expect(versionInput.exists()).toBe(true);
    expect(versionInput.element.value).toBe('1.0.0');

    const syncText = wrapper.find('[data-testid="project-sync-indicator-text"]');
    expect(syncText.text()).toBe('Synced with Storage');

    // Shows snapshot badge when no custom thumbnail
    const snapshotBadge = wrapper.find('[data-testid="thumbnail-badge-snapshot"]');
    expect(snapshotBadge.exists()).toBe(true);
  });

  it('updates project name on blur/change, marks store dirty, and updates projectStore', async () => {
    const wrapper = mount(SettingsTabProject);

    const nameInput = wrapper.find('[data-testid="project-name-input"] input');
    await nameInput.setValue('Updated RPG Adventure');
    await nameInput.trigger('blur');

    expect(projectStore.project.name).toBe('Updated RPG Adventure');
    expect(projectStore.syncStatus).toBe('dirty');

    const syncText = wrapper.find('[data-testid="project-sync-indicator-text"]');
    expect(syncText.text()).toBe('Unsaved Changes');
  });

  it('[Bad Path] shows validation error when project name is cleared and does not update to empty string', async () => {
    const wrapper = mount(SettingsTabProject);

    const nameInput = wrapper.find('[data-testid="project-name-input"] input');
    await nameInput.setValue('   ');
    await nameInput.trigger('blur');

    expect(projectStore.project.name).toBe('Initial Project Name');
    expect(wrapper.text()).toContain('Project name cannot be empty');
  });

  it('updates project description and version reactively', async () => {
    const wrapper = mount(SettingsTabProject);

    const descTextarea = wrapper.find('[data-testid="project-desc-input"] textarea');
    await descTextarea.setValue('New game concept description');
    expect(projectStore.project.description).toBe('New game concept description');
    expect(projectStore.syncStatus).toBe('dirty');

    const versionInput = wrapper.find('[data-testid="project-version-input"] input');
    await versionInput.setValue('2.0.0');
    await versionInput.trigger('blur');
    expect(projectStore.project.version).toBe('2.0.0');
  });

  it('manages custom thumbnail and falls back to scene snapshot when removed', async () => {
    projectStore.project.thumbnailUrl = 'data:image/jpeg;base64,custom_cover';
    const wrapper = mount(SettingsTabProject);

    // Displays custom thumbnail badge
    expect(wrapper.find('[data-testid="thumbnail-badge-custom"]').exists()).toBe(true);

    const deleteBtn = wrapper.find('[data-testid="delete-thumbnail-btn"]');
    expect(deleteBtn.exists()).toBe(true);

    // Delete custom thumbnail
    await deleteBtn.trigger('click');
    expect(projectStore.project.thumbnailUrl).toBeNull();
    expect(projectStore.syncStatus).toBe('dirty');

    // Falls back to snapshot badge
    expect(wrapper.find('[data-testid="thumbnail-badge-snapshot"]').exists()).toBe(true);
  });

  it('toggles Auto-Save enabled state and modifies store settings', async () => {
    const wrapper = mount(SettingsTabProject);

    const checkbox = wrapper.find('[data-testid="project-autosave-checkbox"] input[type="checkbox"]');
    expect(checkbox.element.checked).toBe(false);

    await checkbox.setValue(true);
    expect(projectStore.project.settings.autoSave.enabled).toBe(true);
    expect(projectStore.syncStatus).toBe('dirty');
  });

  it('triggers manual saveProjectToServer when Save Project button is clicked', async () => {
    projectStore.syncStatus = 'dirty';
    const saveSpy = vi.spyOn(projectStore, 'saveProjectToServer').mockResolvedValue();

    const wrapper = mount(SettingsTabProject);
    const saveBtn = wrapper.find('[data-testid="project-save-now-button"]');

    expect(saveBtn.attributes('disabled')).toBeUndefined();
    await saveBtn.trigger('click');

    expect(saveSpy).toHaveBeenCalledOnce();
  });

  it('prompts confirmation and reloads state when Revert Changes is triggered', async () => {
    projectStore.syncStatus = 'dirty';
    mockConfirm.mockResolvedValue(true);
    const syncSpy = vi.spyOn(projectStore, 'syncFromServer').mockResolvedValue();

    const wrapper = mount(SettingsTabProject);
    const revertBtn = wrapper.find('[data-testid="project-revert-button"]');

    await revertBtn.trigger('click');

    expect(mockConfirm).toHaveBeenCalledOnce();
    expect(syncSpy).toHaveBeenCalledOnce();
  });

  it('renders About Lupis Engine section with engine version, github, and discord links', () => {
    const wrapper = mount(SettingsTabProject);

    const versionBadge = wrapper.find('[data-testid="project-engine-version"]');
    expect(versionBadge.exists()).toBe(true);
    expect(versionBadge.text()).toBe('v0.1.0');

    const githubLink = wrapper.find('[data-testid="project-github-link"]');
    expect(githubLink.exists()).toBe(true);
    expect(githubLink.attributes('href')).toBe('https://github.com/haikal-adnan/lupis-engine');
    expect(githubLink.find('svg').exists()).toBe(true);

    const discordLink = wrapper.find('[data-testid="project-discord-link"]');
    expect(discordLink.exists()).toBe(true);
    expect(discordLink.attributes('href')).toBe('https://haikal-adnan.github.io/lupis-engine-link?go=discord');
    expect(discordLink.find('svg').exists()).toBe(true);
  });
});
