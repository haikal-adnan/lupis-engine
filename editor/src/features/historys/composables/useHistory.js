import { reactive, watch } from 'vue';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';

const ENABLE_LOGS = true; 

// Undo/redo stacks keyed by active scene or tab ID
export const historyStore = reactive({});

// Provides undo/redo command execution, transaction management, and keyboard shortcut listeners
export function useHistory(options = {}) {
  const workspaceStore = useWorkspaceStore();
  const sceneStore = useSceneStore();
  const maxHistory = options.maxHistory || 50;

  const getHistoryKey = () => {
    const tab = workspaceStore.activeTab;
    if (!tab) return null;

    if (tab.type === 'scene' && sceneStore.activeSceneId) {
      return `scene_${sceneStore.activeSceneId}`;
    }
    return `tab_${tab.id}`;
  };

  const getActiveHistory = () => {
    const key = getHistoryKey();
    if (!key) return null;

    if (!historyStore[key]) {
      historyStore[key] = {
        undoStack: [],
        redoStack: []
      };
    }
    return historyStore[key];
  };

  const logHistory = (actionType = '') => {
    if (!ENABLE_LOGS) return;

    const key = getHistoryKey();
    console.group(`[useHistory] ${actionType} | Key: "${key}"`);
    console.log('Active History Stack:', JSON.parse(JSON.stringify(historyStore[key] || {})));
    console.log('Full History Store:', JSON.parse(JSON.stringify(historyStore)));
    console.groupEnd();
  };

  if (typeof window !== 'undefined') {
    window.__HISTORY_STORE__ = historyStore;
    window.logHistory = logHistory;
  }

  // Merges actions sharing a transactionKey, or appends a new action
  const record = (action) => {
    const history = getActiveHistory();
    if (!history) return;

    const lastAction = history.undoStack[history.undoStack.length - 1];

    if (
      lastAction &&
      lastAction.transactionKey &&
      action.transactionKey &&
      lastAction.transactionKey === action.transactionKey
    ) {
      lastAction.redo = action.redo;
      return;
    }

    history.undoStack.push(action);
    if (history.undoStack.length > maxHistory) {
      history.undoStack.shift();
    }
    history.redoStack = [];

    logHistory('RECORD ACTION');
  };

  const undo = () => {
    const history = getActiveHistory();
    const key = getHistoryKey();

    if (!history || history.undoStack.length === 0) {
      if (ENABLE_LOGS) console.log('[useHistory] Undo stack empty for key:', key);
      return;
    }

    const action = history.undoStack.pop();
    if (action && typeof action.undo === 'function') {
      action.undo();
      history.redoStack.push(action);
      logHistory('UNDO PERFORMED');
      const projectStore = useProjectStore();
      if (!workspaceStore.isLoading && !workspaceStore.isSaving && projectStore.isProjectLoaded) {
        projectStore.markAsDirty();
      }
    }
  };

  const redo = () => {
    const history = getActiveHistory();
    const key = getHistoryKey();

    if (!history || history.redoStack.length === 0) {
      if (ENABLE_LOGS) console.log('[useHistory] Redo stack empty for key:', key);
      return;
    }

    const action = history.redoStack.pop();
    if (action && typeof action.redo === 'function') {
      action.redo();
      history.undoStack.push(action);
      logHistory('REDO PERFORMED');
      const projectStore = useProjectStore();
      if (!workspaceStore.isLoading && !workspaceStore.isSaving && projectStore.isProjectLoaded) {
        projectStore.markAsDirty();
      }
    }
  };

  watch(
    [
      () => workspaceStore.tabs.map((t) => t.id),
      () => sceneStore.scenes.map((s) => s.id)
    ],
    ([currentTabIds, currentSceneIds]) => {
      Object.keys(historyStore).forEach((key) => {
        if (key.startsWith('scene_')) {
          const sceneId = key.replace('scene_', '');
          if (!currentSceneIds.includes(sceneId)) {
            delete historyStore[key];
            if (ENABLE_LOGS) console.log(`[useHistory] Cleaned up history for deleted scene: "${sceneId}"`);
          }
        } else if (key.startsWith('tab_')) {
          const tabId = key.replace('tab_', '');
          if (!currentTabIds.includes(tabId)) {
            delete historyStore[key];
            if (ENABLE_LOGS) console.log(`[useHistory] Cleaned up history for closed tab: "${tabId}"`);
          }
        }
      });
    },
    { deep: true }
  );

  const handleKeyDown = (e) => {
    const target = e.target;
    if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
      return;
    }

    const isCtrl = e.ctrlKey || e.metaKey;
    if (!isCtrl) return;

    if (e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        redo();
      } else {
        e.preventDefault();
        undo();
      }
    } else if (e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redo();
    }
  };

  const setupListeners = () => {
    window.addEventListener('keydown', handleKeyDown);
  };

  const cleanupListeners = () => {
    window.removeEventListener('keydown', handleKeyDown);
  };

  return {
    record,
    undo,
    redo,
    logHistory,
    setupListeners,
    cleanupListeners
  };
}
