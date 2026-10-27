import { useHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useAnimatorActions } from '@animators/animators.js';

let activeTransaction = null;
let clearTransactionTimer = null;

if (typeof window !== 'undefined' && !window.__ANIMATOR_HISTORY_LISTENERS_SET__) {
  window.__ANIMATOR_HISTORY_LISTENERS_SET__ = true;

  const startTransaction = () => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    if (!activeTransaction) {
      activeTransaction = { isContinuous: true, initialValues: {} };
    }
  };

  const endTransactionWithDelay = (delay = 100) => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    clearTransactionTimer = setTimeout(() => { activeTransaction = null; }, delay);
  };

  window.addEventListener('mousedown', (e) => {
    const isScrub = e.target.closest('.cursor-ew-resize') || e.target.classList?.contains('cursor-ew-resize');
    const isColor = e.target.type === 'color' || e.target.closest('input[type="color"]');
    if (isScrub || isColor) startTransaction();
  }, true);

  window.addEventListener('input', (e) => {
    if (e.target.type === 'color') {
      startTransaction();
      endTransactionWithDelay(300);
    }
  }, true);

  window.addEventListener('mouseup', () => {
    if (activeTransaction) endTransactionWithDelay(50);
  }, true);

  window.addEventListener('change', (e) => {
    if (e.target.type === 'color') endTransactionWithDelay(0);
  }, true);
}

export function useAnimatorHistory() {
  const { record, undo, redo, logHistory } = useHistory();
  const sceneStore = useSceneStore();

  const deepClone = (data) => (data ? JSON.parse(JSON.stringify(data)) : null);

  const commitClipsState = (entityId, clipsData) => {
    if (!entityId || !clipsData) return;
    const { _saveAnimatorClips } = useAnimatorActions();
    _saveAnimatorClips(entityId, deepClone(clipsData));
  };

  const setPropByPath = (clips, targetId, path, val) => {
    const clonedClips = deepClone(clips);
    const clip = clonedClips.find(c => c.id === targetId);
    if (!clip) return clonedClips;

    const keys = path.split('.');
    let current = clip;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = deepClone(val);
    return clonedClips;
  };

  const recordClipPropChange = (entityId, clipId, propPath, oldValue, newValue) => {
    if (!entityId || !clipId) return;
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    let transactionKey = null;
    let originalOldValue = oldValue;

    if (activeTransaction && activeTransaction.isContinuous) {
      transactionKey = `trans_animator_${entityId}_${clipId}_${propPath}`;
      if (!(transactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[transactionKey] = oldValue;
      }
      originalOldValue = activeTransaction.initialValues[transactionKey];
    }

    record({
      type: 'ANIMATOR_PROP_CHANGE',
      transactionKey, 
      description: `Change ${propPath} on clip ${clipId}`,
      undo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const currentClips = ent?.components?.SpriteAnimator?.clips || [];
        const updatedClips = setPropByPath(currentClips, clipId, propPath, originalOldValue);
        commitClipsState(entityId, updatedClips);
      },
      redo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const currentClips = ent?.components?.SpriteAnimator?.clips || [];
        const updatedClips = setPropByPath(currentClips, clipId, propPath, newValue);
        commitClipsState(entityId, updatedClips);
      }
    });
  };

  const recordSourcesChange = (entityId, clipId, description, oldSources, newSources) => {
    if (!entityId || !clipId) return;

    const clonedOld = deepClone(oldSources || {});
    const clonedNew = deepClone(newSources || {});

    if (JSON.stringify(clonedOld) === JSON.stringify(clonedNew)) return;

    let transactionKey = null;
    let originalOldSources = clonedOld;

    if (activeTransaction && activeTransaction.isContinuous) {
      transactionKey = `trans_animator_sources_${entityId}_${clipId}`;
      if (!(transactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[transactionKey] = clonedOld;
      }
      originalOldSources = activeTransaction.initialValues[transactionKey];
    }

    record({
      type: 'ANIMATOR_SOURCES_CHANGE',
      transactionKey,
      description: description || `Change sources on clip ${clipId}`,
      undo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const clips = deepClone(ent?.components?.SpriteAnimator?.clips || []);
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          clip.sources = originalOldSources;
          commitClipsState(entityId, clips);
        }
      },
      redo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const clips = deepClone(ent?.components?.SpriteAnimator?.clips || []);
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          clip.sources = clonedNew;
          commitClipsState(entityId, clips);
        }
      }
    });
  };

  const recordClipsTreeChange = (entityId, description, oldClips, newClips) => {
    if (!entityId) return;

    const clonedOld = deepClone(oldClips || []);
    const clonedNew = deepClone(newClips || []);

    if (JSON.stringify(clonedOld) === JSON.stringify(clonedNew)) return;

    record({
      type: 'ANIMATOR_TREE_CHANGE',
      description: description || `Modify Animator Clips Tree on ${entityId}`,
      undo: () => commitClipsState(entityId, clonedOld),
      redo: () => commitClipsState(entityId, clonedNew)
    });
  };

  const recordFramesChange = (entityId, clipId, description, oldFrames, newFrames) => {
    if (!entityId || !clipId) return;

    const clonedOld = deepClone(oldFrames || []);
    const clonedNew = deepClone(newFrames || []);

    if (JSON.stringify(clonedOld) === JSON.stringify(clonedNew)) return;

    record({
      type: 'ANIMATOR_FRAMES_CHANGE',
      description: description || `Change frames on clip ${clipId}`,
      undo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const clips = deepClone(ent?.components?.SpriteAnimator?.clips || []);
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          clip.frames = clonedOld;
          commitClipsState(entityId, clips);
        }
      },
      redo: () => {
        const scene = sceneStore.activeScene;
        if (!scene) return;
        const ent = scene.entities.find(e => e.id === entityId);
        const clips = deepClone(ent?.components?.SpriteAnimator?.clips || []);
        const clip = clips.find(c => c.id === clipId);
        if (clip) {
          clip.frames = clonedNew;
          commitClipsState(entityId, clips);
        }
      }
    });
  };

  return {
    recordClipsTreeChange,
    recordClipPropChange,
    recordFramesChange,
    recordSourcesChange,
    undo,
    redo,
    logHistory
  };
}