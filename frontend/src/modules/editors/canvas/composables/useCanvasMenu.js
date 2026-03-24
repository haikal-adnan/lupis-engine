import { ref, watch, onUnmounted } from 'vue';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useClipboard } from '@/composables/useClipboard.js';
import { 
  Copy, Scissors, Clipboard, Files, 
  ArrowUpToLine, ArrowDownToLine, 
  Box, Lock, EyeOff, Power, Trash2,
  Plus, Cuboid, Image, Square, Type, InspectionPanel, Layers,
  Layout, Pointer
} from 'lucide-vue-next';

export function useCanvasMenu(canvasHandlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
  const editorStore = useEditorStore();
  const sceneStore = useSceneStore(); 
  
  const { copy, cut, duplicate, remove } = useClipboard();

  const blockKeyInput = (e) => {
    const blockedKeys = ['Control', 'Shift', 'Alt', 'Meta'];
    if (blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  const blockScrollInput = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const toggleInputBlockers = (active) => {
    if (active) {
      window.addEventListener('keydown', blockKeyInput, { capture: true });
      window.addEventListener('keyup', blockKeyInput, { capture: true });
      window.addEventListener('wheel', blockScrollInput, { capture: true, passive: false });
    } else {
      window.removeEventListener('keydown', blockKeyInput, { capture: true });
      window.removeEventListener('keyup', blockKeyInput, { capture: true });
      window.removeEventListener('wheel', blockScrollInput, { capture: true });
    }
  };

  watch(() => contextMenu.value.visible, (visible) => {
    toggleInputBlockers(visible);
  });

  onUnmounted(() => {
    toggleInputBlockers(false);
  });
  
  // Helper internal untuk mengecek apakah entitas adalah descendant dari prefab
  const isDescendantOfPrefab = (entityId) => {
    const entities = sceneStore.activeScene?.entities;
    if (!entities) return false;

    let current = entities.find(e => e._id === entityId);
    while (current && current.parentId) {
      current = entities.find(e => e._id === current.parentId);
      if (current && current.prefabId) return true;
    }
    return false;
  };

  const openMenu = (screenX, screenY, worldX, worldY, isEntitySelected) => {
    const hasClipboard = editorStore.hasClipboardData;
    
    const activeTabType = editorStore.activeTab?.type || 'scene';
    const targetLayerSection = activeTabType === 'scene' ? 'world' : 'ui';

    const items = [];

    if (isEntitySelected) {
      
      // --- LOGIKA VALIDASI "USE AS PREFAB" ---
      let disablePrefabAction = false;
      const selectedIds = sceneStore.selectedEntityIds;

      if (selectedIds.length !== 1) {
        // Disable jika multi-select atau tidak ada seleksi
        disablePrefabAction = true;
      } else {
        const entityId = selectedIds[0];
        const entity = sceneStore.activeScene?.entities.find(e => e._id === entityId);
        
        if (entity) {
          const isAlreadyPrefab = !!entity.prefabId;
          const isChildOfPrefab = isDescendantOfPrefab(entityId);
          disablePrefabAction = isAlreadyPrefab || isChildOfPrefab;
        } else {
          disablePrefabAction = true;
        }
      }
      // ---------------------------------------

      items.push(
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: copy },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: cut },
        { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: duplicate },
        
        { separator: true },
        
        { label: 'Bring to Front', icon: ArrowUpToLine, action: canvasHandlers.bringToFront },
        { label: 'Send to Back', icon: ArrowDownToLine, action: canvasHandlers.sendToBack },
        
        { separator: true },
        
        // Terapkan state disabled ke tombol Use as Prefab
        { label: 'Use as Prefab', icon: Box, disabled: disablePrefabAction, action: canvasHandlers.useAsPrefab },
        
        { separator: true },
        
        { label: 'Lock', icon: Lock, action: canvasHandlers.toggleLock },
        { label: 'Hidden Entity', icon: EyeOff, action: canvasHandlers.toggleHidden },
        { label: 'Inactive Entity', icon: Power, action: canvasHandlers.toggleInactive },
        
        { separator: true },
        
        { label: 'Delete', icon: Trash2, shortcut: 'Del', action: remove, variant: 'danger' }
      );

    } else {
      const getEntityTypesForLayer = (layerId) => {
        if (targetLayerSection === 'ui') {
          return [
            { label: 'UI Shape', icon: Layout, action: () => canvasHandlers.createEntityAtPosition('ui_shape', layerId, worldX, worldY) },
            { label: 'UI Text', icon: Type, action: () => canvasHandlers.createEntityAtPosition('ui_text', layerId, worldX, worldY) },
            { label: 'UI Image', icon: Image, action: () => canvasHandlers.createEntityAtPosition('ui_image', layerId, worldX, worldY) },
          ];
        }

        return [
          { label: 'Empty Entity', icon: Cuboid, action: () => canvasHandlers.createEntityAtPosition('empty', layerId, worldX, worldY) },
          { label: 'Sprite', icon: Image, action: () => canvasHandlers.createEntityAtPosition('sprite', layerId, worldX, worldY) },
          { label: 'Shape', icon: Square, action: () => canvasHandlers.createEntityAtPosition('shape', layerId, worldX, worldY) },
          { label: 'Text', icon: Type, action: () => canvasHandlers.createEntityAtPosition('text', layerId, worldX, worldY) },
          { label: 'Tilemap', icon: InspectionPanel, action: () => canvasHandlers.createEntityAtPosition('tilemap', layerId, worldX, worldY) },
        ];
      };

      const activeLayers = sceneStore.activeLayers || [];
      const filteredLayers = activeLayers.filter(layer => layer._section === targetLayerSection);

      let createItems = [];

      if (filteredLayers.length > 0) {
        createItems = filteredLayers.map(layer => ({
          label: layer.name,
          icon: Layers,
          children: getEntityTypesForLayer(layer._id)
        }));
      } else {
        createItems = getEntityTypesForLayer(null);
      }

      items.push({ 
        label: 'Create Entity', 
        icon: Plus, 
        children: createItems 
      });

      items.push({ 
          label: 'Paste Here', 
          icon: Clipboard, 
          disabled: !hasClipboard,
          action: () => canvasHandlers.pasteAtPosition(worldX, worldY) 
      });
    }

    contextMenu.value = {
      visible: true,
      x: screenX,
      y: screenY,
      items
    };
  };

  const closeMenu = () => {
    contextMenu.value.visible = false;
  };

  return {
    contextMenu,
    openMenu,
    closeMenu
  };
}