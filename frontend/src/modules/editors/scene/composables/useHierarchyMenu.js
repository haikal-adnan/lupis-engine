import { ref, computed } from 'vue'; 
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useProjectStore } from '@/stores/useProjectStore.js';
import { useClipboard } from '@/composables/useClipboard.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js'; 

import { 
  Plus, Trash2, Edit2, RefreshCw, 
  Cuboid, Image, Type, Square, InspectionPanel,
  Maximize, Copy, Scissors, Clipboard, Files, Layers,
  Box 
} from 'lucide-vue-next';

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
  const editorStore = useEditorStore();
  const sceneStore = useSceneStore();
  const { copy, cut, paste, duplicate, remove } = useClipboard();

  const closeMenu = () => {
    contextMenu.value.visible = false;
  };

  const runAction = (action) => {
    closeMenu();
    if (action) action();
  };

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

  const openMenu = (event, node, section = 'world') => {
    let isUIContext = false;

    if (node) {
      isUIContext = node._section === 'ui' || 
                    node.scriptId === 'ui' || 
                    node.name === 'UI' ||
                    (node.type && node.type.startsWith('ui_'));
      
      if (!isUIContext && node.layerId) {
        if (node.type === 'ui' || node.type === 'ui_entity') isUIContext = true;
      }
    } else {
      isUIContext = section === 'ui';
    }

    const createWorldItems = [
      { label: 'Empty Entity', icon: Cuboid, action: () => runAction(() => handlers.createEntity('empty', node)) },
      { label: 'Sprite', icon: Image, action: () => runAction(() => handlers.createEntity('sprite', node)) },
      { label: 'Shape', icon: Square, action: () => runAction(() => handlers.createEntity('shape', node)) },
      { label: 'Text', icon: Type, action: () => runAction(() => handlers.createEntity('text', node)) },
      { label: 'Tilemap', icon: InspectionPanel, action: () => runAction(() => handlers.createEntity('tilemap', node)) },
    ];

    const worldX = 0;
    const worldY = 0;

    const createUiItems = [
      { label: 'Empty UI', icon: Maximize, action: () => runAction(() => handlers.createEntity('ui_empty', node, { x: worldX, y: worldY })) },
      { separator: true },
      { label: 'UI Shape', icon: Square, action: () => runAction(() => handlers.createEntity('ui_shape', node, { x: worldX, y: worldY })) },
      { label: 'UI Text', icon: Type, action: () => runAction(() => handlers.createEntity('ui_text', node, { x: worldX, y: worldY })) },
      { label: 'UI Image', icon: Image, action: () => runAction(() => handlers.createEntity('ui_image', node, { x: worldX, y: worldY })) },
    ];

    const items = [];
    const hasClipboard = editorStore.hasClipboardData;

    if (!node) {
      items.push({ label: 'Refresh Tree', icon: RefreshCw, action: () => runAction(handlers.refresh) });
      
      items.push({ separator: true });
      items.push({ 
        label: 'Paste', 
        icon: Clipboard, 
        disabled: !hasClipboard,
        action: () => runAction(paste) 
      });

    } else {
      const isLayer = node.type === 'layer';

      if (isUIContext) {
        items.push({ 
          label: isLayer ? 'Add UI Element' : 'Add Child UI', 
          icon: Plus, 
          children: createUiItems 
        });
      } else {
        items.push({ 
          label: isLayer ? 'Add Entity' : 'Add Child', 
          icon: Plus, 
          children: createWorldItems 
        });
      }

      items.push({ separator: true });

      if (isLayer) {
        items.push(
          { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: () => runAction(() => duplicate(node._id)) },
          { label: 'Copy Layer', icon: Copy, action: () => runAction(() => copy(node._id)) },
          { label: 'Cut Layer', icon: Scissors, action: () => runAction(() => cut(node._id)) }
        );

        items.push({ 
            label: 'Paste', 
            icon: Clipboard, 
            disabled: !hasClipboard,
            action: () => runAction(paste) 
        });

        items.push({ separator: true });
        items.push(
          { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => runAction(() => handlers.renameLayer(node._id)) },
          { label: 'Change Z-Index', icon: Layers, action: () => runAction(() => handlers.changeZIndex(node._id)) },
          { separator: true },
          { label: 'Delete Layer', icon: Trash2, action: () => runAction(() => remove(node._id)) }
        );
      } else {
        items.push(
            { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: () => runAction(duplicate) },
            { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: () => runAction(copy) },
            { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: () => runAction(cut) }
        );

        items.push({ 
            label: 'Paste', 
            icon: Clipboard, 
            disabled: !hasClipboard,
            action: () => runAction(paste) 
        });

        items.push({ separator: true });
        
        const selectedIds = sceneStore.selectedEntityIds || [];
        const isMultiSelect = selectedIds.length > 1;
        const isAlreadyPrefab = !!node.prefabId;
        const isChildOfPrefab = isDescendantOfPrefab(node._id);
        
        let disablePrefabAction = isAlreadyPrefab || isChildOfPrefab;

        if (isMultiSelect) {
          const primaryId = selectedIds[0];
          const entities = sceneStore.activeScene?.entities || [];
          
          const hasChild = entities.some(e => e.parentId === primaryId);
          
          if (!hasChild) {
            disablePrefabAction = true;
          }
          
          if (node._id !== primaryId) {
            disablePrefabAction = true;
          }
        }

        items.push({ 
            label: 'Use as Prefab', 
            icon: Box, 
            disabled: disablePrefabAction,
            action: () => runAction(() => handlers.useAsPrefab(node._id)) 
        });
        
        items.push({ separator: true });
        
        items.push(
          { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => runAction(() => handlers.renameEntity(node._id)) },
          { separator: true },
          { label: 'Delete Entity', icon: Trash2, shortcut: 'Del', action: () => runAction(remove) }
        );
      }
    }

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      items
    };
  };

  return {
    contextMenu,
    openMenu,
    closeMenu
  };
}