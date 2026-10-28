import { watch } from 'vue';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useFolderStore } from '@folders/folders.js';

let activeBeforeUnloadHandler = null;

export function useProjectWatcher() {
  const projectStore = useProjectStore();
  const workspaceStore = useWorkspaceStore();
  const sceneStore = useSceneStore();
  const scriptStore = useScriptStore();
  const assetStore = useAssetStore();
  const prefabStore = usePrefabStore();
  const folderStore = useFolderStore();

  const storesToWatch = {
    project: projectStore,
    scene: sceneStore,
    script: scriptStore,
    asset: assetStore,
    prefab: prefabStore,
    folder: folderStore
  };

  const IGNORED_KEYS = [
    'syncStatus',
    'isLoading',
    'isSaving',
    'loadingMessage',
    'error',
    'selectedNodeId',
    'selectedNodeIds',
    'selectedEdgeId',
    'activeFolderId',
    'selectedAssetId',
    'searchQuery',
    'activeScript',
    'activeSceneId',
    'selectedEntityIds',
    'isSettingsModalOpen',
    'isResizeModalOpen',
    'camera'
  ];

  let unsubscribeFunctions = [];
  let autoSaveTimer = null;
  let beforeUnloadHandler = null;

  const checkAndRunAutoSave = async () => {
    if (
      projectStore.project?.settings?.autoSave?.enabled &&
      projectStore.syncStatus === 'dirty' &&
      !workspaceStore.isLoading &&
      !workspaceStore.isSaving &&
      workspaceStore.activeProjectId
    ) {
      try {
        await projectStore.saveProjectToServer({ isAutoSave: true });
      } catch (err) {
        console.error('[AutoSave] Failed:', err);
      }
    }
  };

  const setupAutoSaveTimer = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }

    const autoSaveConfig = projectStore.project?.settings?.autoSave;
    if (autoSaveConfig?.enabled && projectStore.isProjectLoaded) {
      const minutes = Math.max(1, Number(autoSaveConfig.interval) || 10);
      const ms = minutes * 60 * 1000;
      autoSaveTimer = setInterval(checkAndRunAutoSave, ms);
      if (autoSaveTimer?.unref) autoSaveTimer.unref();
    }
  };

  const triggerDirty = (triggerSource = 'watcher') => {
    if (workspaceStore.isLoading || workspaceStore.isSaving || !projectStore.isProjectLoaded) {
      return;
    }

    if (projectStore.syncStatus !== 'dirty') {
      projectStore.markAsDirty();
    }
  };

  const initWatchers = () => {
    destroyWatchers();

    // 1. Reactive Deep Watcher on all core persisted data objects
    const stopDeepWatcher = watch(
      [
        () => projectStore.project,
        () => sceneStore.scenes,
        () => scriptStore.scripts,
        () => assetStore.assets,
        () => prefabStore.prefabs,
        () => folderStore.folders
      ],
      () => {
        setupAutoSaveTimer();
        triggerDirty('deep-watch');
      },
      { deep: true, flush: 'sync' }
    );
    unsubscribeFunctions.push(stopDeepWatcher);

    // 2. Pinia store subscription for direct actions and patch calls
    Object.entries(storesToWatch).forEach(([storeName, store]) => {
      const unsubscribe = store.$subscribe((mutation) => {
        if (workspaceStore.isLoading || workspaceStore.isSaving || !projectStore.isProjectLoaded) {
          return;
        }

        // If mutation debugger events exist, ignore if all events are in IGNORED_KEYS
        if (mutation?.events) {
          const events = Array.isArray(mutation.events) ? mutation.events : [mutation.events];
          const allIgnored = events.length > 0 && events.every(event => event && IGNORED_KEYS.includes(event.key));
          if (allIgnored) return;
        }

        if (storeName === 'project') {
          setupAutoSaveTimer();
        }

        triggerDirty(`pinia-${storeName}`);
      }, { flush: 'sync' });

      unsubscribeFunctions.push(unsubscribe);
    });

    setupAutoSaveTimer();

    // 3. Web close / reload guard (beforeunload)
    if (typeof window !== 'undefined') {
      if (activeBeforeUnloadHandler) {
        window.removeEventListener('beforeunload', activeBeforeUnloadHandler);
        activeBeforeUnloadHandler = null;
      }

      activeBeforeUnloadHandler = (e) => {
        if (projectStore.syncStatus === 'dirty') {
          if (!window.electronAPI?.isElectron) {
            e.preventDefault();
            e.returnValue = '';
            return '';
          }
        }
      };
      window.addEventListener('beforeunload', activeBeforeUnloadHandler);

      // 4. Electron background close & save handler
      if (window.electronAPI?.onRequestSaveAndClose) {
        const removeSaveListener = window.electronAPI.onRequestSaveAndClose(async () => {
          try {
            await projectStore.saveProjectToServer();
            if (window.electronAPI?.confirmClose) {
              window.electronAPI.confirmClose(true);
            }
          } catch (err) {
            console.error('[Electron] Failed to save before closing:', err);
            if (window.electronAPI?.confirmClose) {
              window.electronAPI.confirmClose(false);
            }
          }
        });

        if (typeof removeSaveListener === 'function') {
          unsubscribeFunctions.push(removeSaveListener);
        }
      }
    }
  };

  const destroyWatchers = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.setDirty) {
      window.electronAPI.setDirty(false);
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
    if (typeof window !== 'undefined' && activeBeforeUnloadHandler) {
      window.removeEventListener('beforeunload', activeBeforeUnloadHandler);
      activeBeforeUnloadHandler = null;
    }
    unsubscribeFunctions.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    unsubscribeFunctions = [];
  };

  return {
    initWatchers,
    destroyWatchers,
    checkAndRunAutoSave,
    setupAutoSaveTimer
  };
}
