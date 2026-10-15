import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProjectStore } from '@projects/useProjectStore.js';
import { useWorkspaceStore } from '@workspaces/useWorkspaceStore.js';
import { useProjectWatcher } from '@projects/useProjectWatcher.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';
import { useScriptStore } from '@scripts/scripts.js';

// Mocks
const mockSyncProject = vi.fn();
const mockGetProjectById = vi.fn();
const mockShowPop = vi.fn();

vi.mock('@projects/useProjectActions.js', () => ({
  useProjectActions: () => ({
    getProjectById: mockGetProjectById,
    syncProject: mockSyncProject
  })
}));

vi.mock('@projects/projects.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useProjectActions: () => ({
      getProjectById: mockGetProjectById,
      syncProject: mockSyncProject
    })
  };
});

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  useConfirm: () => ({ confirm: vi.fn() })
}));

vi.mock('@engines/engines.js', () => ({
  engineBridge: { reloadScene: vi.fn() }
}));

vi.mock('@utils/utils.js', () => ({
  normalizer: (p, s, a, pr, f, sc) => ({
    project: p,
    scenes: s || [],
    assets: a || [],
    prefabs: pr || [],
    folders: f || [],
    scripts: sc || []
  })
}));

describe('CONTRACT: Project Dirty & Synced State Machine', () => {
  let projectStore;
  let workspaceStore;
  let sceneStore;
  let assetStore;
  let prefabStore;
  let folderStore;
  let scriptStore;
  let watcher;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    projectStore = useProjectStore();
    workspaceStore = useWorkspaceStore();
    sceneStore = useSceneStore();
    assetStore = useAssetStore();
    prefabStore = usePrefabStore();
    folderStore = useFolderStore();
    scriptStore = useScriptStore();

    folderStore.syncFoldersToOPFS = vi.fn().mockResolvedValue();
    assetStore.syncAssetsToOPFS = vi.fn().mockResolvedValue();

    projectStore.project = {
      id: 'proj_contract_123',
      name: 'Contract Initial Name',
      description: 'Contract Description',
      version: '1.0.0',
      tags: ['Untagged'],
      scenes: ['scene_1'],
      settings: {
        tickRate: 60,
        autoSave: {
          enabled: false,
          interval: 10
        },
        grid: { visible: true, snap: true, width: 32, height: 32, color: '#ffffff', opacity: 0.1 }
      }
    };
    projectStore.syncStatus = 'synced';
    workspaceStore.setProjectId('proj_contract_123');

    watcher = useProjectWatcher();
    watcher.initWatchers();
  });

  describe('Contract Rule 1: Initial State Invariant', () => {
    it('initializes in synced state with correct boolean getters', () => {
      expect(projectStore.syncStatus).toBe('synced');
      expect(projectStore.isSynced).toBe(true);
      expect(projectStore.isDirty).toBe(false);
    });
  });

  describe('Contract Rule 2: State Transition to Dirty on Modifications', () => {
    it('transitions to dirty when updateProjectName is invoked', () => {
      projectStore.updateProjectName('Contract New Name');

      expect(projectStore.project.name).toBe('Contract New Name');
      expect(projectStore.syncStatus).toBe('dirty');
      expect(projectStore.isDirty).toBe(true);
      expect(projectStore.isSynced).toBe(false);
    });

    it('transitions to dirty when updateProjectDescription is invoked', () => {
      projectStore.updateProjectDescription('Updated via contract test');

      expect(projectStore.project.description).toBe('Updated via contract test');
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('transitions to dirty when updateProjectVersion is invoked', () => {
      projectStore.updateProjectVersion('1.2.0');

      expect(projectStore.project.version).toBe('1.2.0');
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('transitions to dirty when AutoSave settings are toggled or interval adjusted', () => {
      projectStore.updateAutoSaveSettings({ enabled: true, interval: 5 });

      expect(projectStore.project.settings.autoSave.enabled).toBe(true);
      expect(projectStore.project.settings.autoSave.interval).toBe(5);
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('transitions to dirty when tags are added or removed', () => {
      projectStore.addTag('ContractTag');
      expect(projectStore.syncStatus).toBe('dirty');

      projectStore.markAsSynced();
      expect(projectStore.isSynced).toBe(true);

      projectStore.removeTag('ContractTag');
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('transitions to dirty when grid/camera settings are updated', () => {
      projectStore.toggleGrid();
      expect(projectStore.syncStatus).toBe('dirty');
    });
  });

  describe('Contract Rule 3: State Transition from Dirty to Synced on Persistence', () => {
    it('transitions from dirty to synced on successful saveProjectToServer', async () => {
      projectStore.markAsDirty();
      expect(projectStore.isDirty).toBe(true);

      mockSyncProject.mockResolvedValueOnce({ success: true });

      await projectStore.saveProjectToServer();

      expect(projectStore.syncStatus).toBe('synced');
      expect(projectStore.isSynced).toBe(true);
      expect(projectStore.isDirty).toBe(false);
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Save Successful'
      }));
    });

    it('transitions from dirty to synced on successful syncFromServer (revert to storage)', async () => {
      projectStore.markAsDirty();

      mockGetProjectById.mockResolvedValueOnce({
        project: { ...projectStore.project, name: 'Storage Saved Name' },
        scenes: [],
        assets: [],
        prefabs: [],
        folders: [],
        scripts: []
      });

      await projectStore.syncFromServer();

      expect(projectStore.syncStatus).toBe('synced');
      expect(projectStore.isSynced).toBe(true);
      expect(projectStore.isDirty).toBe(false);
    });
  });

  describe('Contract Rule 4: Auto-Save Trigger and Execution Behavior', () => {
    it('executes triggerAutoSave when status is dirty and autoSave is enabled', async () => {
      projectStore.project.settings.autoSave.enabled = true;
      projectStore.markAsDirty();

      mockSyncProject.mockResolvedValueOnce({ success: true });

      const executed = await projectStore.triggerAutoSave();

      expect(executed).toBe(true);
      expect(projectStore.syncStatus).toBe('synced');
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Auto-Save Successful'
      }));
    });

    it('does NOT execute triggerAutoSave when status is already synced (no-op)', async () => {
      projectStore.project.settings.autoSave.enabled = true;
      projectStore.markAsSynced();

      const executed = await projectStore.triggerAutoSave();

      expect(executed).toBe(false);
      expect(mockSyncProject).not.toHaveBeenCalled();
    });

    it('does NOT execute triggerAutoSave when autoSave is disabled even if dirty', async () => {
      projectStore.project.settings.autoSave.enabled = false;
      projectStore.markAsDirty();

      const executed = await projectStore.triggerAutoSave();

      expect(executed).toBe(false);
      expect(mockSyncProject).not.toHaveBeenCalled();
    });
  });

  describe('Contract Rule 5: State Isolation and Teardown Guard', () => {
    it('resets syncStatus to synced on clearProjectData', () => {
      projectStore.markAsDirty();
      projectStore.clearProjectData();

      expect(projectStore.syncStatus).toBe('synced');
      expect(projectStore.project).toBeNull();
    });

    it('cleans up watchers without memory leak or timer pollution', () => {
      expect(() => watcher.destroyWatchers()).not.toThrow();
    });
  });
});
