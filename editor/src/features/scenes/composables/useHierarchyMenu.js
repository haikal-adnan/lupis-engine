import { ref } from 'vue'; 
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useClipboard } from '@composables/composables.js';
import { useSceneStore } from '@scenes/scenes.js';

import { 
  Plus, Trash2, Edit2, RefreshCw, 
  Cuboid, Image, Type, Square, InspectionPanel,
  Maximize, Copy, Scissors, Clipboard, Files, Layers,
  Box 
} from 'lucide-vue-next';

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
  const workspaceStore = useWorkspaceStore();
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

    let current = entities.find(e => e.id === entityId);
    while (current && current.parentId) {
      current = entities.find(e => e.id === current.parentId);
      if (current && current.prefabId) return true;
    }
    return false;
  };

  const openMenu = (event, node, section = 'world') => {
    let isUIContext = false;

    if (node) {
      isUIContext = node._section === 'ui' || 
                    node.scriptId === 'ui' || 
                    (node.scriptId && node.scriptId.toLowerCase().includes('ui')) ||
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
    const hasClipboard = workspaceStore.hasClipboardData;

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
          { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: () => runAction(() => duplicate(node.id)) },
          { label: 'Copy Layer', icon: Copy, action: () => runAction(() => copy(node.id)) },
          { label: 'Cut Layer', icon: Scissors, action: () => runAction(() => cut(node.id)) }
        );

        items.push({ 
          label: 'Paste', 
          icon: Clipboard, 
          disabled: !hasClipboard,
          action: () => runAction(paste) 
        });

        items.push({ separator: true });
        items.push(
          { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => runAction(() => handlers.renameLayer(node.id)) },
          { label: 'Change Z-Index', icon: Layers, action: () => runAction(() => handlers.changeZIndex(node.id)) },
          { separator: true },
          { label: 'Delete Layer', icon: Trash2, action: () => runAction(() => remove(node.id)) }
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
        
        const isAlreadyPrefab = !!node.prefabId;
        const isChildOfPrefab = isDescendantOfPrefab(node.id);
        
        const disablePrefabAction = isAlreadyPrefab || isChildOfPrefab;

        items.push({ 
          label: 'Use as Prefab', 
          icon: Box, 
          disabled: disablePrefabAction,
          action: () => runAction(() => handlers.useAsPrefab(node.id)) 
        });
        
        items.push({ separator: true });
        
        items.push(
          { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => runAction(() => handlers.renameEntity(node.id)) },
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