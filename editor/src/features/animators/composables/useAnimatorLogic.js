import { ref, computed, watch, onUnmounted } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useAssetStore } from '@assets/assets.js';
import { usePopAlert, usePrompt, useConfirm } from '@composables/composables.js';
import { useAnimatorHistory } from '@historys/historys.js';

// Session local state (not persisted to Pinia/OPFS)
const activeClipByEntity = ref({});
const showShadow = ref(false);
const shadowFrameCount = ref(3);
const shadowOpacity = ref(80);
const showGrid = ref(true);
const gridSize = ref(32);

export function useAnimatorLogic() {
  const sceneStore = useSceneStore();
  const workspaceStore = useWorkspaceStore();
  const assetStore = useAssetStore();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();
  const { confirm } = useConfirm();
  
  const animatorHistory = useAnimatorHistory();

  const selectedEntity = computed(() => {
    const tabId = workspaceStore.activeTab?.id;
    if (!tabId || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e.id === tabId) || null;
  });

  const selectedEntityForOpenTab = computed(() => {
    if (!sceneStore.activeScene) return null;
    const id = sceneStore.selectedEntityIds[0];
    if (!id) return null;
    return sceneStore.activeScene.entities.find(e => e.id === id) || null;
  });

  const activeEntityId = computed(() => selectedEntity.value?.id);
  const hasAnimator = computed(() => !!selectedEntity.value?.components?.SpriteAnimator);

  const activeClipId = computed({
    get: () => {
      if (!activeEntityId.value) return null;
      const stored = activeClipByEntity.value[activeEntityId.value];
      const compClip = selectedEntity.value?.components?.SpriteAnimator?.currentClip;
      const clips = realClipsData.value;
      if (stored !== undefined) {
        if (stored === null) return null;
        if (clips.some(c => c.id === stored)) return stored;
        return null;
      }
      if (compClip && clips.some(c => c.id === compClip)) {
        return compClip;
      }
      const firstClip = clips.find(c => c.type === 'clip');
      return firstClip ? firstClip.id : null;
    },
    set: (val) => {
      if (activeEntityId.value) {
        activeClipByEntity.value[activeEntityId.value] = val;
        if (selectedEntity.value?.components?.SpriteAnimator) {
          selectedEntity.value.components.SpriteAnimator.currentClip = val;
        }
      }
    }
  });

  // AUTO-CLOSE if current entity becomes PREFAB, missing, or lacks SpriteAnimator
  watch(
    [() => workspaceStore.activeTab, selectedEntity],
    ([activeTab, entity]) => {
      if (activeTab?.type !== 'animator') return;
      if (!entity || entity.prefabId || !entity.components?.SpriteAnimator) {
        workspaceStore.closeTab(activeTab.id);
      }
    },
    { immediate: true, deep: true }
  );

  const realClipsData = computed(() => {
    const raw = selectedEntity.value?.components?.SpriteAnimator?.clips;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return Object.values(raw);
    return [];
  });

  const activeClipData = computed(() => {
    if (!activeClipId.value) return null;
    return realClipsData.value.find(n => n.id === activeClipId.value) || null;
  });

  const resolvedAssetUrl = ref('');
  watch(
    () => activeClipData.value?.assetId,
    async (newAssetId) => {
      if (!newAssetId) {
        resolvedAssetUrl.value = '';
        return;
      }
      try {
        resolvedAssetUrl.value = (await assetStore.getAssetUrlById(newAssetId)) || '';

        // Automatically create first frame if clip has no frames yet
        if (
          activeClipData.value && 
          (!activeClipData.value.frames || activeClipData.value.frames.length === 0)
        ) {
          addFrame();
        }
      } catch (err) {
        console.error('Failed to load animator texture:', err);
        resolvedAssetUrl.value = '';
      }
    },
    { immediate: true }
  );

  const syncAnimatorData = () => {
    if (activeEntityId.value) {
      sceneStore._saveAnimatorClips(activeEntityId.value, realClipsData.value);
    }
  };

  function bindClipProp(propPath, defaultValue = null) {
    return computed({
      get: () => {
        if (!activeClipData.value) return defaultValue;
        const keys = propPath.split('.');
        let current = activeClipData.value;
        for (const key of keys) {
          if (current === undefined || current === null) return defaultValue;
          current = current[key];
        }
        return current ?? defaultValue;
      },
      set: (val) => {
        if (!activeClipData.value || !activeEntityId.value) return;

        const keys = propPath.split('.');
        let current = activeClipData.value;

        let oldVal = activeClipData.value;
        for (const key of keys) {
          if (oldVal !== undefined && oldVal !== null) {
            oldVal = oldVal[key];
          }
        }
        if (oldVal === undefined) oldVal = defaultValue;

        if (JSON.stringify(oldVal) === JSON.stringify(val)) return;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = val;

        syncAnimatorData();

        animatorHistory.recordClipPropChange(
          activeEntityId.value,
          activeClipData.value.id,
          propPath,
          oldVal,
          val
        );
      }
    });
  }

  const treeVisualData = computed(() => {
    let data = realClipsData.value;
    if (!Array.isArray(data)) {
      data = (data !== null && typeof data === 'object') ? Object.values(data) : [];
    }
    const categories = data.filter(n => n.type === 'category');
    const unparentedClips = data.filter(n => n.type === 'clip' && !n.parentId);
    let result = [];

    categories.forEach(cat => {
      const children = data.filter(n => n.type === 'clip' && n.parentId === cat.id);
      result.push({ ...cat, _uiChildren: children });
    });

    unparentedClips.forEach(clip => result.push(clip));
    return result;
  });

  const toggleCategory = (categoryId) => {
    if (!activeEntityId.value) return;
    const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
    const clips = [...realClipsData.value];
    const catIndex = clips.findIndex(c => c.id === categoryId);
    if (catIndex !== -1) {
      clips[catIndex] = { ...clips[catIndex], isOpen: !clips[catIndex].isOpen };
      sceneStore._saveAnimatorClips(activeEntityId.value, clips);
      animatorHistory.recordClipsTreeChange(activeEntityId.value, `Toggle category ${categoryId}`, oldClips, clips);
    }
  };

  const createCategory = (targetId) => { 
    if (activeEntityId.value) {
      const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
      sceneStore.animatorCreateCategory(activeEntityId.value, targetId);
      animatorHistory.recordClipsTreeChange(activeEntityId.value, 'Create Animator Category', oldClips, realClipsData.value);
    } 
  };

  const createClip = (targetId) => { 
    if (activeEntityId.value) {
      const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
      sceneStore.animatorCreateClip(activeEntityId.value, targetId);
      animatorHistory.recordClipsTreeChange(activeEntityId.value, 'Create Animator Clip', oldClips, realClipsData.value);
    } 
  };

  const deleteNode = (id) => {
    if (activeEntityId.value) {
      const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
      sceneStore.animatorDeleteNode(activeEntityId.value, id);
      if (activeClipId.value === id) activeClipId.value = null;
      animatorHistory.recordClipsTreeChange(activeEntityId.value, `Delete Animator Node ${id}`, oldClips, realClipsData.value);
    }
  };

  const duplicateNode = (id) => {
    if (activeEntityId.value) {
      const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
      const nodeData = sceneStore.animatorGetNodeClone(activeEntityId.value, id);
      if (nodeData) {
        sceneStore.animatorPasteNode(activeEntityId.value, id, nodeData);
        animatorHistory.recordClipsTreeChange(activeEntityId.value, `Duplicate Animator Node ${id}`, oldClips, realClipsData.value);
      }
    }
  };

  const copyNode = (id) => {
    if (!activeEntityId.value) return;
    const nodeData = sceneStore.animatorGetNodeClone(activeEntityId.value, id);
    if (nodeData) {
      workspaceStore.setClipboard('animator_node', nodeData, 'copy');
      showPop({ title: 'Copied', message: 'Node copied to clipboard.', type: 'info' });
    }
  };

  const cutNode = (id) => {
    if (!activeEntityId.value) return;
    const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
    const deletedNode = sceneStore.animatorDeleteNode(activeEntityId.value, id);
    if (deletedNode) {
      workspaceStore.setClipboard('animator_node', { node: deletedNode, children: [] }, 'cut');
      if (activeClipId.value === id) activeClipId.value = null;
      showPop({ title: 'Cut', message: 'Node cut to clipboard.', type: 'info' });
      animatorHistory.recordClipsTreeChange(activeEntityId.value, `Cut Animator Node ${id}`, oldClips, realClipsData.value);
    }
  };

  const pasteNode = (targetId) => {
    if (!activeEntityId.value) return;
    const { type, data, mode } = workspaceStore.clipboard;
    if (type !== 'animator_node' || !data) return;

    const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
    sceneStore.animatorPasteNode(activeEntityId.value, targetId, data);
    if (mode === 'cut') workspaceStore.clearClipboard();
    animatorHistory.recordClipsTreeChange(activeEntityId.value, 'Paste Animator Node', oldClips, realClipsData.value);
  };

  const renameNode = async (id) => {
    if (!activeEntityId.value) return;
    const nodeToRename = realClipsData.value.find(c => c.id === id);
    if (!nodeToRename) return;

    const isCategory = nodeToRename.type === 'category';
    const labelType = isCategory ? 'Category' : 'Clip';

    const newName = await prompt({
      title: `Rename ${labelType}`,
      message: `Enter a new name for this ${labelType.toLowerCase()}:`,
      defaultValue: nodeToRename.name,
      confirmText: 'Save'
    });

    if (newName !== null && newName.trim() !== '' && newName !== nodeToRename.name) {
      const oldName = nodeToRename.name;
      sceneStore.animatorRenameNode(activeEntityId.value, id, newName.trim());
      showPop({ title: 'Success!', message: `${labelType} name has been updated.`, type: 'success' });
      animatorHistory.recordClipPropChange(activeEntityId.value, id, 'name', oldName, newName.trim());
    }
  };

  const moveNode = (draggedId, targetId, position) => {
    if (!activeEntityId.value || draggedId === targetId) return;

    const oldClips = JSON.parse(JSON.stringify(realClipsData.value));
    const clips = [...realClipsData.value];
    const dragIdx = clips.findIndex(c => c.id === draggedId);
    if (dragIdx === -1) return;

    const draggedNode = { ...clips[dragIdx] };

    if (position === 'root' || !targetId) {
      draggedNode.parentId = null;
      clips.splice(dragIdx, 1);
      clips.push(draggedNode);
      sceneStore._saveAnimatorClips(activeEntityId.value, clips);
      animatorHistory.recordClipsTreeChange(activeEntityId.value, `Move Node ${draggedId} to root`, oldClips, clips);
      return;
    }

    const targetIdx = clips.findIndex(c => c.id === targetId);
    if (targetIdx === -1) return;

    const targetNode = clips[targetIdx];
    if (draggedNode.type === 'category' && position === 'inside') position = 'bottom';

    if (position === 'inside' && targetNode.type === 'category') {
      draggedNode.parentId = targetNode.id;
      clips[targetIdx] = { ...targetNode, isOpen: true };
    } else if (position === 'top' || position === 'bottom') {
      draggedNode.parentId = targetNode.parentId;
    }

    clips.splice(dragIdx, 1);
    const newTargetIdx = clips.findIndex(c => c.id === targetId);
    let insertIdx = newTargetIdx;
    if (position === 'bottom' || position === 'inside') insertIdx += 1;

    clips.splice(insertIdx, 0, draggedNode);
    sceneStore._saveAnimatorClips(activeEntityId.value, clips);
    animatorHistory.recordClipsTreeChange(activeEntityId.value, `Move Node ${draggedId}`, oldClips, clips);
  };

  const currentFrameIndex = computed({
    get: () => activeClipData.value?.frameIndex || 0,
    set: (val) => {
      if (activeClipData.value) {
        activeClipData.value.frameIndex = val;
        syncAnimatorData();
      }
    }
  });

  const frames = computed(() => activeClipData.value?.frames || []);
  const sources = computed(() => activeClipData.value?.sources || {});
  const fps = computed(() => activeClipData.value?.fps || 12);

  watch(frames, (newFrames) => {
    if (currentFrameIndex.value >= newFrames.length && newFrames.length > 0) {
      currentFrameIndex.value = Math.max(0, newFrames.length - 1);
    } else if (newFrames.length === 0) {
      currentFrameIndex.value = 0;
    }
  });

  const isPlaying = ref(false);
  let playbackTimer = null;

  const stepForward = () => {
    if (frames.value.length === 0) return;
    currentFrameIndex.value = (currentFrameIndex.value + 1) % frames.value.length;
  };

  const stepBackward = () => {
    if (frames.value.length === 0) return;
    currentFrameIndex.value = (currentFrameIndex.value - 1 + frames.value.length) % frames.value.length;
  };

  const startPlayback = () => {
    if (frames.value.length <= 1) return;
    isPlaying.value = true;
    playbackTimer = setInterval(stepForward, 1000 / fps.value);
  };

  const stopPlayback = () => {
    isPlaying.value = false;
    if (playbackTimer) { clearInterval(playbackTimer); playbackTimer = null; }
  };

  const togglePlay = () => { isPlaying.value ? stopPlayback() : startPlayback(); };
  onUnmounted(stopPlayback);

  const addFrame = () => {
    if (!activeClipData.value || !activeEntityId.value) return;
    const clip = activeClipData.value;
    const oldFrames = JSON.parse(JSON.stringify(clip.frames || []));
    const oldSources = JSON.parse(JSON.stringify(clip.sources || {}));

    const lastSourceId = frames.value[frames.value.length - 1];
    const lastRect = sources.value[lastSourceId];

    const newIndex = Object.keys(clip.sources || {}).length;
    const newSourceId = `s_${newIndex}`;

    if (!clip.sources) clip.sources = {};
    clip.sources[newSourceId] = {
      x: lastRect ? lastRect.x + lastRect.w : 0,
      y: lastRect ? lastRect.y : 0,
      w: clip.baseSize?.w || 32,
      h: clip.baseSize?.h || 32
    };

    clip.frames.push(newSourceId);
    currentFrameIndex.value = clip.frames.length - 1;
    syncAnimatorData();

    animatorHistory.recordFramesChange(activeEntityId.value, clip.id, 'Add Frame', oldFrames, clip.frames);
    animatorHistory.recordSourcesChange(activeEntityId.value, clip.id, 'Add Source Frame', oldSources, clip.sources);
  };

  const removeFrame = (index) => {
    if (frames.value.length <= 1 || !activeClipData.value || !activeEntityId.value) return;
    const clip = activeClipData.value;
    const oldFrames = JSON.parse(JSON.stringify(clip.frames || []));

    clip.frames.splice(index, 1);
    if (currentFrameIndex.value >= clip.frames.length) currentFrameIndex.value = clip.frames.length - 1;
    syncAnimatorData();

    animatorHistory.recordFramesChange(activeEntityId.value, clip.id, `Remove Frame #${index}`, oldFrames, clip.frames);
  };

  const clearTimeline = async () => {
    if (!activeClipData.value || frames.value.length === 0 || !activeEntityId.value) return;
    const clip = activeClipData.value;
    const isConfirmed = await confirm({
      title: 'Clear Timeline',
      message: 'Are you sure you want to delete all frames from this timeline?',
      type: 'danger',
      confirmText: 'Clear'
    });
    if (isConfirmed) {
      const oldFrames = JSON.parse(JSON.stringify(clip.frames || []));
      clip.frames = [];
      currentFrameIndex.value = 0;
      syncAnimatorData();

      animatorHistory.recordFramesChange(activeEntityId.value, clip.id, 'Clear Timeline', oldFrames, clip.frames);
    }
  };

  const autoFill = async () => {
    if (!activeClipData.value || !activeEntityId.value) return;
    const clip = activeClipData.value;
    let maxWidth = 0;

    if (clip.assetId) {
      const assetInfo = assetStore.getAssetById(clip.assetId);
      if (assetInfo?.meta?.dimensions?.w) maxWidth = assetInfo.meta.dimensions.w;
    }

    if (!maxWidth || maxWidth <= 0) {
      const maxWidthStr = await prompt({
        title: 'Auto Fill Frames',
        message: 'Asset not selected or width unreadable. Enter total width manually:',
        placeholder: 'e.g. 160',
        confirmText: 'Auto Fill'
      });
      if (!maxWidthStr) return;
      maxWidth = parseInt(maxWidthStr, 10);
      if (isNaN(maxWidth) || maxWidth <= 0) return;
    }

    const oldFrames = JSON.parse(JSON.stringify(clip.frames || []));
    const oldSources = JSON.parse(JSON.stringify(clip.sources || {}));

    const baseW = clip.baseSize?.w || 32;
    const baseH = clip.baseSize?.h || 32;

    if (!clip.sources) clip.sources = {};
    if (!clip.frames) clip.frames = [];

    let currentX = 0;
    let currentY = 0;

    if (clip.frames.length > 0) {
      const lastSourceId = clip.frames[clip.frames.length - 1];
      const lastRect = clip.sources[lastSourceId];
      if (lastRect) {
        currentX = lastRect.x + lastRect.w;
        currentY = lastRect.y;
      }
    }

    let addedCount = 0;
    let sourceIndex = Object.keys(clip.sources).length;
    const uniqueSuffix = Date.now().toString().slice(-4);

    while (currentX + baseW <= maxWidth) {
      const newSourceId = `s_auto_${uniqueSuffix}_${sourceIndex}`;
      clip.sources[newSourceId] = { x: currentX, y: currentY, w: baseW, h: baseH };
      clip.frames.push(newSourceId);
      currentX += baseW;
      sourceIndex++;
      addedCount++;
    }

    if (addedCount > 0) {
      currentFrameIndex.value = clip.frames.length - 1;
      syncAnimatorData();

      animatorHistory.recordFramesChange(activeEntityId.value, clip.id, 'Auto Fill Frames', oldFrames, clip.frames);
      animatorHistory.recordSourcesChange(activeEntityId.value, clip.id, 'Auto Fill Sources', oldSources, clip.sources);
    }
  };

  const handleCreateSource = async () => {
    if (!activeClipData.value || !activeEntityId.value) return;
    const clip = activeClipData.value;
    const newSourceName = await prompt({ title: 'New Source', message: 'Name:', placeholder: 'e.g. run_01', confirmText: 'Create' });
    if (!newSourceName) return;

    const cleanName = newSourceName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanName || sources.value[cleanName]) return;

    const oldSources = JSON.parse(JSON.stringify(clip.sources || {}));
    const oldFrames = JSON.parse(JSON.stringify(clip.frames || []));

    if (!clip.sources) clip.sources = {};
    clip.sources[cleanName] = {
      x: 0, y: 0,
      w: clip.baseSize?.w || 32,
      h: clip.baseSize?.h || 32
    };
    clip.frames[currentFrameIndex.value] = cleanName;
    syncAnimatorData();

    animatorHistory.recordSourcesChange(activeEntityId.value, clip.id, `Create Source ${cleanName}`, oldSources, clip.sources);
    animatorHistory.recordFramesChange(activeEntityId.value, clip.id, 'Update Frame Source ID', oldFrames, clip.frames);
  };

  const handleDeleteSource = (sourceToDelete) => {
    if (activeClipData.value && activeClipData.value.sources[sourceToDelete] && activeEntityId.value) {
      const clip = activeClipData.value;
      const oldSources = JSON.parse(JSON.stringify(clip.sources || {}));

      delete clip.sources[sourceToDelete];
      syncAnimatorData();

      animatorHistory.recordSourcesChange(activeEntityId.value, clip.id, `Delete Source ${sourceToDelete}`, oldSources, clip.sources);
    }
  };

  const deleteAllSources = async () => {
    if (!activeClipData.value || !activeEntityId.value) return;
    const clip = activeClipData.value;
    const isConfirmed = await confirm({
      title: 'Delete All Sources?',
      message: 'Are you sure you want to delete all sources from this clip?',
      type: 'danger',
      confirmText: 'Delete All'
    });
    if (isConfirmed) {
      const oldSources = JSON.parse(JSON.stringify(clip.sources || {}));
      clip.sources = {};
      syncAnimatorData();

      animatorHistory.recordSourcesChange(activeEntityId.value, clip.id, 'Delete All Sources', oldSources, clip.sources);
    }
  };

  function openAnimatorEditor() {
    const entity = selectedEntityForOpenTab.value;
    if (!entity || entity.prefabId || !entity.components?.SpriteAnimator) return;
    workspaceStore.openTab({
      id: entity.id,
      name: entity.name || 'Animator',
      type: 'animator',
      fixed: false
    });
  }

  return {
    hasAnimator,
    activeClipId,
    activeClipData,
    selectedEntity,
    activeEntityId,
    currentFrameIndex,
    realClipsData,
    treeVisualData,
    resolvedAssetUrl,
    frames,
    sources,
    fps,
    isPlaying,
    
    showShadow,
    shadowFrameCount,
    shadowOpacity,
    showGrid,
    gridSize,

    hasClipboard: computed(() => workspaceStore.hasClipboardData && workspaceStore.clipboard.type === 'animator_node'),
    
    bindClipProp,

    undo: animatorHistory.undo,
    redo: animatorHistory.redo,

    selectClip: (id) => {
      activeClipId.value = id;
    },

    openAnimatorEditor,
    syncAnimatorData,
    toggleCategory,
    moveNode,
    renameNode,
    createCategory,
    createClip,
    deleteNode,
    duplicateNode,
    copyNode,
    cutNode,
    pasteNode,
    stepForward,
    stepBackward,
    togglePlay,
    stopPlayback,
    addFrame,
    removeFrame,
    clearTimeline,
    autoFill,
    handleCreateSource,
    handleDeleteSource,
    deleteAllSources
  };
}