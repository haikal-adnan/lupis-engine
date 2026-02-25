import { ref } from 'vue';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { useClipboard } from '@/composables/useClipboard.js';
import { 
  Plus, Trash2, Edit2, Folder, RefreshCw, 
  Cuboid, Image, Type, Square, InspectionPanel,
  MousePointerClick, Maximize, Copy, Scissors, Clipboard, Files, Layers
} from 'lucide-vue-next';

const showPlaceholderAlert = () => {
   alert("Group creation is temporarily disabled (Placeholder).");
};

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
  const editorStore = useEditorStore();
  const { copy, cut, paste, duplicate, remove } = useClipboard();

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
      { label: 'Empty Entity', icon: Cuboid, action: () => handlers.createEntity('empty', node) },
      { label: 'Sprite', icon: Image, action: () => handlers.createEntity('sprite', node) },
      { label: 'Shape', icon: Square, action: () => handlers.createEntity('shape', node) },
      { label: 'Text', icon: Type, action: () => handlers.createEntity('text', node) },
      { label: 'Tilemap', icon: InspectionPanel, action: () => handlers.createEntity('tilemap', node) },
      { separator: true },
      { label: 'Group (Disabled)', icon: Folder, action: () => showPlaceholderAlert() } 
    ];

    const createUiItems = [
      { label: 'Empty UI', icon: Maximize, action: () => handlers.createEntity('ui_empty', node) },
      { separator: true },
      { label: 'UI Panel', icon: Square, action: () => handlers.createEntity('ui_panel', node) },
      { label: 'UI Button', icon: MousePointerClick, action: () => handlers.createEntity('ui_button', node) },
      { label: 'UI Text', icon: Type, action: () => handlers.createEntity('ui_text', node) },
      { label: 'UI Image', icon: Image, action: () => handlers.createEntity('ui_image', node) },
      { separator: true },
      { label: 'Group (Disabled)', icon: Folder, action: () => showPlaceholderAlert() }
    ];

    const items = [];
    const hasClipboard = editorStore.hasClipboardData;

    if (!node) {
      items.push({ label: 'Refresh Tree', icon: RefreshCw, action: handlers.refresh });
      
      items.push({ separator: true });
      items.push({ 
        label: 'Paste', 
        icon: Clipboard, 
        disabled: !hasClipboard,
        action: paste 
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
          { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: () => duplicate(node._id) },
          { label: 'Copy Layer', icon: Copy, action: () => copy(node._id) },
          { label: 'Cut Layer', icon: Scissors, action: () => cut(node._id) }
        );

        items.push({ 
            label: 'Paste', 
            icon: Clipboard, 
            disabled: !hasClipboard,
            action: paste 
        });

        items.push({ separator: true });
        items.push(
          { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => handlers.renameLayer(node._id) },
          { label: 'Change Z-Index', icon: Layers, action: () => handlers.changeZIndex(node._id) },
          { separator: true },
          { label: 'Delete Layer', icon: Trash2, action: () => remove(node._id) }
        );
      } else {
        items.push(
            { label: 'Duplicate', icon: Files, shortcut: 'Ctrl+D', action: duplicate },
            { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C', action: copy },
            { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X', action: cut }
        );

        items.push({ 
            label: 'Paste', 
            icon: Clipboard, 
            disabled: !hasClipboard,
            action: paste 
        });

        items.push({ separator: true });
        items.push(
          { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => handlers.renameEntity(node._id) },
          { separator: true },
          { label: 'Delete Entity', icon: Trash2, shortcut: 'Del', action: remove }
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

  const closeMenu = () => {
    contextMenu.value.visible = false;
  };

  return {
    contextMenu,
    openMenu,
    closeMenu
  };
}