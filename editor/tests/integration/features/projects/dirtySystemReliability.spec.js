import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useProjectStore } from '@projects/useProjectStore.js';
import { useWorkspaceStore } from '@workspaces/useWorkspaceStore.js';
import { useProjectWatcher } from '@projects/useProjectWatcher.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useEntityActions } from '@scenes/composables/actions/useEntityActions.js';
import { useLayerActions } from '@scenes/composables/actions/useLayerActions.js';
import { useSettingActions } from '@scenes/composables/actions/useSettingActions.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';
import { useScriptStore } from '@scripts/scripts.js';
import router from '@/app/router.js';

// Mocks
const mockSyncProject = vi.fn().mockResolvedValue({ success: true });
const mockGetProjectById = vi.fn();
const mockShowPop = vi.fn();
const mockConfirm = vi.fn();

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

vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    usePopAlert: () => ({ showPop: mockShowPop }),
    useConfirm: () => ({ confirm: mockConfirm })
  };
});

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    reloadScene: vi.fn(),
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    updateEntityProp: vi.fn(),
    updateComponentProp: vi.fn(),
    updateSceneSettings: vi.fn(),
    reorderLayer: vi.fn(),
    linkEntitiesToPrefab: vi.fn()
  }
}));

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    writeFileToHandle: vi.fn().mockResolvedValue(),
    removeFileFromHandle: vi.fn().mockResolvedValue()
  })
}));

describe('Dirty System Reliability & Invariant Consistency', () => {
  let projectStore;
  let workspaceStore;
  let sceneStore;
  let assetStore;
  let prefabStore;
  let folderStore;
  let scriptStore;
  let watcher;
  let electronApiMock;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    electronApiMock = {
      isElectron: false,
      setDirty: vi.fn(),
      onRequestSaveAndClose: vi.fn(),
      confirmClose: vi.fn()
    };
    window.electronAPI = electronApiMock;

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
      id: 'proj_dirty_test',
      name: 'Dirty System Test Project',
      scenes: ['scene_1'],
      settings: {
        autoSave: { enabled: false, interval: 10 },
        grid: { visible: true, snap: true, width: 32, height: 32 }
      }
    };

    sceneStore.scenes = [
      {
        id: 'scene_1',
        scriptId: 'Scene_Main',
        entities: [
          {
            id: 'ent_1',
            scriptId: 'Player',
            layerId: 'layer_world_1',
            parentId: null,
            orderIndex: 0,
            components: {
              Transform: { x: 100, y: 100, width: 64, height: 64, rotation: 0, scaleX: 1, scaleY: 1 }
            }
          }
        ],
        layersWorld: [{ id: 'layer_world_1', scriptId: 'World_Layer', orderIndex: 0, zIndex: 0 }],
        layersUI: [{ id: 'layer_ui_1', scriptId: 'UI_Layer', orderIndex: 0, zIndex: 0 }],
        settings: { backgroundColor: '#1a1a1a', physics: { gravity: 1200 } }
      }
    ];
    sceneStore.activeSceneId = 'scene_1';

    projectStore.syncStatus = 'synced';
    workspaceStore.setProjectId('proj_dirty_test');

    watcher = useProjectWatcher();
    watcher.initWatchers();
  });

  afterEach(() => {
    if (watcher) {
      watcher.destroyWatchers();
    }
  });

  describe('Canvas & Engine Bridge Transformations', () => {
    it('marks project as dirty when gizmo drag updates transform via syncTransformFromEngine', () => {
      expect(projectStore.isDirty).toBe(false);

      sceneStore.syncTransformFromEngine('ent_1', { x: 250, y: 400 });

      expect(projectStore.isDirty).toBe(true);
      expect(projectStore.syncStatus).toBe('dirty');
      expect(electronApiMock.setDirty).toHaveBeenCalledWith(true);
    });

    it('marks project as dirty when shape or text elements are patched via patchComponent', () => {
      expect(projectStore.isDirty).toBe(false);

      sceneStore.patchComponent('ent_1', 'Transform', { width: 128 });

      expect(projectStore.isDirty).toBe(true);
      expect(projectStore.syncStatus).toBe('dirty');
    });
  });

  describe('Hierarchy Operations', () => {
    it('marks project dirty when a new layer is added or reordered', () => {
      const { addLayer, reorderLayer } = useLayerActions();

      const bgLayer = addLayer('Background_Layer', 'world', false);
      expect(projectStore.isDirty).toBe(true);

      projectStore.markAsSynced();
      expect(projectStore.isDirty).toBe(false);

      reorderLayer(bgLayer.id, 'layer_world_1', 'top');
      expect(projectStore.isDirty).toBe(true);
    });

    it('marks project dirty when entity is moved in hierarchy', () => {
      const { moveEntity } = useEntityActions();

      moveEntity('ent_1', {
        newParentId: null,
        newLayerId: 'layer_ui_1',
        insertionType: 'append',
        referenceId: null
      }, false);

      expect(projectStore.isDirty).toBe(true);
    });
  });

  describe('Inspector Property Modifications', () => {
    it('marks project dirty when entity prop (e.g., active, locked, tags) is changed', () => {
      const { updateEntityProp } = useEntityActions();

      updateEntityProp('ent_1', 'locked', true, false);
      expect(projectStore.isDirty).toBe(true);
    });

    it('marks project dirty when component prop is edited in Inspector', () => {
      const { updateComponentProp } = useEntityActions();

      updateComponentProp('ent_1', 'Transform', 'rotation', 45);
      expect(projectStore.isDirty).toBe(true);
    });

    it('marks project dirty when scene settings (backgroundColor, physics) are modified', () => {
      const { setBackgroundColor, updatePhysicsSettings } = useSettingActions();

      setBackgroundColor('#2b2b2b');
      expect(projectStore.isDirty).toBe(true);

      projectStore.markAsSynced();

      updatePhysicsSettings({ gravity: 980 });
      expect(projectStore.isDirty).toBe(true);
    });
  });

  describe('Selection State Invariance (Must NOT trigger Dirty)', () => {
    it('does NOT mark project dirty when selecting entities in hierarchy or canvas', () => {
      expect(projectStore.isDirty).toBe(false);

      sceneStore.selectedEntityIds = ['ent_1'];
      expect(projectStore.isDirty).toBe(false);

      sceneStore.clearSelection();
      expect(projectStore.isDirty).toBe(false);
    });

    it('does NOT mark project dirty when active scene changes', () => {
      expect(projectStore.isDirty).toBe(false);

      sceneStore.activeSceneId = 'scene_non_existent';
      expect(projectStore.isDirty).toBe(false);
    });
  });

  describe('Web Browser beforeunload Safety Guard', () => {
    it('prevents default and sets returnValue when project is dirty on Web', () => {
      projectStore.markAsDirty();

      const event = new Event('beforeunload', { cancelable: true });
      event.returnValue = undefined;

      window.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      expect(event.returnValue).toBe('');
    });

    it('does NOT prevent default on beforeunload when project is synced', () => {
      projectStore.markAsSynced();

      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('Electron Integration & IPC Synchronization', () => {
    it('notifies Electron whenever dirty state toggles', () => {
      projectStore.markAsDirty();
      expect(electronApiMock.setDirty).toHaveBeenCalledWith(true);

      projectStore.markAsSynced();
      expect(electronApiMock.setDirty).toHaveBeenCalledWith(false);
    });

    it('handles onRequestSaveAndClose by saving and confirming close to Electron', async () => {
      let registeredCloseHandler = null;
      electronApiMock.onRequestSaveAndClose.mockImplementation((cb) => {
        registeredCloseHandler = cb;
        return () => {};
      });

      watcher.destroyWatchers();
      watcher.initWatchers();

      expect(typeof registeredCloseHandler).toBe('function');

      projectStore.markAsDirty();
      await registeredCloseHandler();

      expect(projectStore.isSynced).toBe(true);
      expect(electronApiMock.confirmClose).toHaveBeenCalledWith(true);
    });
  });

  describe('Vue Router Navigation Guard (Leaving Editor to Dashboard)', () => {
    it('blocks navigation to dashboard and shows confirmation modal when dirty and user cancels', async () => {
      await router.push('/editor/proj_dirty_test');
      expect(router.currentRoute.value.path).toBe('/editor/proj_dirty_test');

      projectStore.markAsDirty();
      mockConfirm.mockResolvedValueOnce(false);

      await router.push('/dashboard');
      // Navigation is aborted because confirm returned false
      expect(router.currentRoute.value.path).toBe('/editor/proj_dirty_test');
      expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Unsaved Changes'
      }));
    });

    it('permits navigation to dashboard and clears project data when dirty and user confirms', async () => {
      await router.push('/editor/proj_dirty_test');
      projectStore.markAsDirty();
      mockConfirm.mockResolvedValueOnce(true); // User confirms leaving without saving

      await router.push('/dashboard');

      expect(router.currentRoute.value.path).toBe('/dashboard');
      expect(projectStore.project).toBeNull();
      expect(projectStore.isDirty).toBe(false);
    });

    it('permits navigation to dashboard immediately without modal when project is synced', async () => {
      await router.push('/editor/proj_dirty_test');
      projectStore.markAsSynced();

      await router.push('/dashboard');

      expect(router.currentRoute.value.path).toBe('/dashboard');
      expect(mockConfirm).not.toHaveBeenCalled();
    });
  });
});
