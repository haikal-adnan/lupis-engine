import { ref } from 'vue';
import { 
  Plus, Trash2, Edit2, Copy, FolderPlus, 
  Cuboid, Image, Type, Scissors, Clipboard, 
  Folder, RefreshCw, Square, InspectionPanel
} from 'lucide-vue-next';

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });

  const openMenu = (event, node) => {
    const createEntitySubMenu = [
        { label: 'Empty Entity', icon: Cuboid, action: () => handlers.createEntity('empty', node) },
        { label: 'Sprite', icon: Image, action: () => handlers.createEntity('sprite', node) },
        { label: 'Shape', icon: Square, action: () => handlers.createEntity('shape', node) },
        { label: 'Text', icon: Type, action: () => handlers.createEntity('text', node) },
        { separator: true },
        { label: 'Tilemap', icon: InspectionPanel, action: () => handlers.createEntity('tilemap', node) },
        { separator: true },
        { label: 'Group', icon: Folder, action: () => handlers.createEntity('group', node) }
    ];

    const items = [];

    if (!node) {
      items.push(
        { label: 'New Layer', icon: Plus, action: handlers.addLayer },
        { separator: true },
        { label: 'Refresh Tree', icon: RefreshCw, action: handlers.refresh }
      );
    } 
    else if (node.type === 'layer') {
      items.push(
        { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => handlers.renameLayer(node._id) },
        { separator: true },
        { label: 'Create Inside Layer', icon: Plus, children: createEntitySubMenu },
        { separator: true },
        { label: 'Delete Layer', icon: Trash2, action: () => handlers.deleteLayer(node._id) }
      );
    } 
    else if (node.type === 'group') {
      items.push(
        { label: 'Rename Group', icon: Edit2, shortcut: 'F2', action: () => handlers.renameEntity(node._id) },
        { separator: true },
        { label: 'Add Child to Group', icon: FolderPlus, children: createEntitySubMenu },
        { separator: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V' },
        { label: 'Duplicate', icon: Copy, shortcut: 'Ctrl+D', action: () => handlers.duplicateEntity(node._id) },
        { separator: true },
        { label: 'Delete Group', icon: Trash2, shortcut: 'Del', action: () => handlers.deleteEntity(node._id) }
      );
    }
    else {
      items.push(
        { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => handlers.renameEntity(node._id) },
        { separator: true },
        { label: 'Add Child', icon: Plus, children: createEntitySubMenu }, 
        { separator: true },
        { label: 'Cut', icon: Scissors, shortcut: 'Ctrl+X' },
        { label: 'Copy', icon: Copy, shortcut: 'Ctrl+C' },
        { label: 'Paste', icon: Clipboard, shortcut: 'Ctrl+V' },
        { label: 'Duplicate', icon: Copy, shortcut: 'Ctrl+D', action: () => handlers.duplicateEntity(node._id) },
        { separator: true },
        { label: 'Delete Entity', icon: Trash2, shortcut: 'Del', action: () => handlers.deleteEntity(node._id) }
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