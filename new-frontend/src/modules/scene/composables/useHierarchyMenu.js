import { ref } from 'vue';
import { 
  Layers, RefreshCw, Plus, Trash2, Edit2, 
  Copy, FolderPlus, Cuboid, Image, Type, Scissors, Clipboard 
} from 'lucide-vue-next';

export function useHierarchyMenu(actions) {
  // actions: object berisi fungsi { addLayer, refresh, deleteEntity, dll }
  
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });

  const openMenu = (event, node, isSelected) => {
    // Helper untuk submenu
    const createSubMenu = [
        { label: 'Empty Entity', icon: Cuboid, action: () => actions.createEntity('empty', node) },
        { label: 'Sprite', icon: Image, action: () => actions.createEntity('sprite', node) },
        { label: 'Text', icon: Type, action: () => actions.createEntity('text', node) },
    ];

    const items = [];

    if (!node) {
      // --- MENU: CANVAS KOSONG ---
      items.push(
        { label: 'New Layer', icon: Layers, action: actions.addLayer },
        { separator: true },
        { label: 'Refresh', icon: RefreshCw, action: actions.refresh }
      );
    } 
    else if (node.type === 'layer') {
      // --- MENU: LAYER ---
      items.push(
        { label: 'Rename Layer', icon: Edit2, shortcut: 'F2' },
        { separator: true },
        { label: 'Create Group', icon: FolderPlus },
        { label: 'Create Entity', icon: Plus, children: createSubMenu },
        { separator: true },
        { label: 'Delete Layer', icon: Trash2, disabled: true }
      );
    } 
    else {
      // --- MENU: ENTITY/GROUP ---
      items.push(
        { label: 'Rename', icon: Edit2, shortcut: 'F2' },
        { separator: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V' },
        { separator: true },
        { label: 'Add Child', icon: Plus, children: createSubMenu },
        { separator: true },
        { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => actions.deleteEntity(node._id) }
      );
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