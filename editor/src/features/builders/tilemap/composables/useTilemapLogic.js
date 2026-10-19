import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSceneStore } from '@scenes/scenes.js';
import { useAssetStore } from '@assets/assets.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { engineBridge } from '@engines/engines.js';
import { useTilemapNavigation } from '@builders/builders.js';
import { useTilemapHistory } from '@historys/historys.js';

export function useTilemapLogic() {
  const sceneStore = useSceneStore();
  const assetStore = useAssetStore();
  const workspaceStore = useWorkspaceStore();
  const tilemapHistory = useTilemapHistory();

  const { activeTool, tilemapContext: context } = storeToRefs(workspaceStore);

  const selectedEntity = computed(() => {
    if (!sceneStore.activeScene) return null;

    const activeTab = workspaceStore.activeTab;
    if (activeTab && activeTab.type === 'tilemap' && activeTab.id) {
      const entByTab = sceneStore.activeScene.entities.find(e => String(e.id) === String(activeTab.id));
      if (entByTab) return entByTab;
    }

    const id = sceneStore.selectedEntityIds[0];
    if (!id) return null;
    return sceneStore.activeScene.entities.find(e => String(e.id) === String(id)) || null;
  });

  // Auto-close tab if entity becomes a prefab
  watch(
    [() => workspaceStore.activeTab, selectedEntity],
    ([activeTab, entity]) => {
      if (activeTab?.type !== 'tilemap') return;
      if (!entity || entity.prefabId) {
        workspaceStore.closeTab(activeTab.id);
      }
    },
    { immediate: true, deep: true }
  );

  const hasTilemap = computed(() => !!selectedEntity.value?.components?.Tilemap);

  function bindComponentProp(compName, propName) {
    return computed({
      get: () => selectedEntity.value?.components?.[compName]?.[propName],
      set: (val) => {
        if (!selectedEntity.value) return;
        const entityId = selectedEntity.value.id;
        const oldVal = selectedEntity.value.components?.[compName]?.[propName];

        if (JSON.stringify(oldVal) === JSON.stringify(val)) return;

        tilemapHistory.recordTilemapPropChange(entityId, propName, oldVal, val);

        sceneStore.updateComponentProp(entityId, compName, propName, val);
        engineBridge.updateComponentProp({
          entityId,
          componentName: compName,
          path: propName,
          value: val
        });
      }
    });
  }

  const currentTextureUrl = ref(null);
  const assetId = bindComponentProp('Tilemap', 'assetId');
  const assetScriptId = computed(() => {
    if (!assetId.value) return null;
    const asset = assetStore.getAssetById(assetId.value);
    return asset ? (asset.scriptId || asset.id) : assetId.value;
  });
  const width = bindComponentProp('Tilemap', 'width');   // 1 Tile Width (px)
  const height = bindComponentProp('Tilemap', 'height'); // 1 Tile Height (px)

  watch(
    () => assetId.value,
    async (newAssetId) => {
      if (!newAssetId) {
        currentTextureUrl.value = null;
        return;
      }
      try {
        const url = await assetStore.getAssetUrlById(newAssetId);
        currentTextureUrl.value = url;
      } catch (err) {
        console.error('Failed to load tilemap texture URL:', err);
        currentTextureUrl.value = null;
      }
    },
    { immediate: true }
  );

  function openTilemapEditor() {
    const entity = selectedEntity.value;
    if (!entity || entity.prefabId) return;

    workspaceStore.openTab({
      id: entity.id,
      name: entity.scriptId || 'Tilemap',
      type: 'tilemap',
      fixed: false
    });
  }

  function openAssetSelector() {
    console.log("Open Asset Selector Triggered for Tilemap. Current Asset:", assetId.value);
  }

  const navigation = useTilemapNavigation();

  const activePaletteMode = ref('select');
  const showPaletteGrid = ref(true);
  const isSpacePressed = ref(false);
  const isHovering = ref(false);
  const isSelecting = ref(false);
  const selectionStart = ref({ x: 0, y: 0 });
  const selectionEnd = ref({ x: 0, y: 0 });
  const hasSelection = ref(false);

  function togglePaletteGrid() {
    showPaletteGrid.value = !showPaletteGrid.value;
  }

  let resizeObserver = null;
  const lastSize = { w: 0, h: 0 };

  const effectiveMode = computed(() => isSpacePressed.value ? 'pan' : activePaletteMode.value);

  const cursorClass = computed(() => {
    if (navigation.isPanning.value) return 'cursor-grabbing';
    if (effectiveMode.value === 'pan') return 'cursor-grab';
    return 'default';
  });

  const selectionRect = computed(() => {
    const x1 = Math.min(selectionStart.value.x, selectionEnd.value.x);
    const y1 = Math.min(selectionStart.value.y, selectionEnd.value.y);
    const x2 = Math.max(selectionStart.value.x, selectionEnd.value.x);
    const y2 = Math.max(selectionStart.value.y, selectionEnd.value.y);
    return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
  });

  const selectionStyle = computed(() => {
    if (!hasSelection.value) return {};
    const tw = width.value || 32;
    const th = height.value || 32;
    const rect = selectionRect.value;
    return {
      left: `${rect.x * tw}px`,
      top: `${rect.y * th}px`,
      width: `${rect.w * tw}px`,
      height: `${rect.h * th}px`
    };
  });

  const gridOverlayStyle = computed(() => {
    const w = width.value || 32;
    const h = height.value || 32;
    return {
      backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 1px, transparent 1px)`,
      backgroundSize: `${w}px ${h}px`
    };
  });

  function handleToolPickupFromEngine(data) {
    if (!data) return;
    const { x, y, w, h } = data;
    selectionStart.value = { x, y };
    selectionEnd.value = { x: x + w - 1, y: y + h - 1 };
    hasSelection.value = true;

    workspaceStore.setTileSelection(selectionRect.value);
    workspaceStore.setTool('brush');
  }

  function handleResize(entries) {
    for (let entry of entries) {
      const { width: w, height: h } = entry.contentRect;
      if (lastSize.w !== 0 && (lastSize.w !== w || lastSize.h !== h)) {
        const dx = (w - lastSize.w) / 2;
        const dy = (h - lastSize.h) / 2;
        if (navigation.panOffset?.value) {
          navigation.panOffset.value.x += dx;
          navigation.panOffset.value.y += dy;
        }
      }
      lastSize.w = w;
      lastSize.h = h;
    }
  }

  function applyTileDataMutation(newTileData) {
    if (!selectedEntity.value) return;
    const entityId = selectedEntity.value.id;

    sceneStore.updateComponentProp(entityId, 'Tilemap', 'data', newTileData);
    engineBridge.updateComponentProp({
      entityId,
      componentName: 'Tilemap',
      path: 'data',
      value: newTileData
    });
  }

  function onPointerDown(e) {
    navigation.viewportRef.value?.setPointerCapture?.(e.pointerId);
    const isMiddleClick = e.button === 1;
    const isLeftClick = e.button === 0;

    if (isMiddleClick || (isLeftClick && effectiveMode.value === 'pan')) {
      navigation.startPan(e.clientX, e.clientY);
      return;
    }

    if (isLeftClick && effectiveMode.value === 'select') {
      isSelecting.value = true;
      hasSelection.value = true;
      const gridPos = navigation.getGridPos(e.clientX, e.clientY, width.value, height.value);

      if (gridPos.x < 0 || gridPos.y < 0) {
        hasSelection.value = false;
        isSelecting.value = false;
        return;
      }
      selectionStart.value = { ...gridPos };
      selectionEnd.value = { ...gridPos };
    }
  }

  function onPointerMove(e) {
    if (navigation.isPanning.value) {
      navigation.updatePan(e.clientX, e.clientY);
      return;
    }
    if (isSelecting.value) {
      const gridPos = navigation.getGridPos(e.clientX, e.clientY, width.value, height.value);
      if (gridPos.x >= 0 && gridPos.y >= 0) {
        selectionEnd.value = { ...gridPos };
      }
    }
  }

  function onPointerUp(e) {
    navigation.viewportRef.value?.releasePointerCapture?.(e.pointerId);
    navigation.endPan();

    if (isSelecting.value) {
      isSelecting.value = false;
      const rect = selectionRect.value;
      if (rect.w > 0 && rect.h > 0) {
        workspaceStore.setTileSelection(rect);
        workspaceStore.setTool('brush');
      }
    }
  }

  function onPointerLeave() {
    navigation.endPan();
    isSelecting.value = false;
  }

  function setPaletteMode(mode) {
    activePaletteMode.value = mode;
  }

  const shortcutMap = {
    ' ': 'hand',
    'v': 'select',
    'b': 'brush',
    'e': 'eraser',
    'g': 'bucket',
    'i': 'eyedropper'
  };

  function handleKeydown(event) {
    const tagName = event.target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.isContentEditable) return;

    if (isHovering.value && event.code === 'Space') {
      event.preventDefault();
      isSpacePressed.value = true;
    }

    if (workspaceStore.activeTab?.type !== 'tilemap') return;

    const key = event.key.toLowerCase();
    if (shortcutMap[key]) {
      if (key === ' ') event.preventDefault();
      workspaceStore.setTool(shortcutMap[key]);
    }
  }

  function handleKeyup(event) {
    if (event.code === 'Space') isSpacePressed.value = false;
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown, { passive: false });
    window.addEventListener('keyup', handleKeyup);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      if (navigation.viewportRef.value) resizeObserver.observe(navigation.viewportRef.value);
    }

    engineBridge.onToolPickup(handleToolPickupFromEngine);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    resizeObserver?.disconnect();
    engineBridge.onToolPickup(null);
  });

  return {
    selectedEntity,
    hasTilemap,
    currentTextureUrl,
    assetId,
    assetScriptId,
    width,
    height,
    bindComponentProp,
    openTilemapEditor,
    openAssetSelector,
    undo: tilemapHistory.undo,
    redo: tilemapHistory.redo,
    logHistory: tilemapHistory.logHistory,
    applyTileDataMutation,
    activeTool,
    context,
    setTool: workspaceStore.setTool,
    setContextOpacity: workspaceStore.setContextOpacity,
    toggleContextVisibility: workspaceStore.toggleContextVisibility,
    toggleGridVisibility: workspaceStore.toggleGridVisibility,
    setGridVisibility: workspaceStore.setGridVisibility,
    ...navigation,
    activePaletteMode,
    effectiveMode,
    cursorClass,
    hasSelection,
    isSelecting,
    selectionRect,
    selectionStyle,
    gridOverlayStyle,
    showPaletteGrid,
    togglePaletteGrid,
    isHovering,
    setPaletteMode,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave
  };
}