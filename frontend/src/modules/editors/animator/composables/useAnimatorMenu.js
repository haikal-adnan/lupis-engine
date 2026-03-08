import { ref } from 'vue';
import { 
  Plus, Trash2, Edit2, FolderPlus, Film, 
  Copy, Scissors, Clipboard, Files 
} from 'lucide-vue-next';

export function useAnimatorMenu(handlers = {}) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });

  const closeMenu = () => {
    contextMenu.value.visible = false;
  };

  const runAction = (action) => {
    closeMenu();
    if (action) action();
  };

  const openMenu = (event, node = null) => {
    const items = [];
    const hasClipboard = !!handlers.hasClipboardData?.value;

    if (!node) {
      items.push(
        { label: 'New Category', icon: FolderPlus, action: () => runAction(() => handlers.createCategory(null)) },
        { label: 'New Clip', icon: Film, action: () => runAction(() => handlers.createClip(null)) },
        { separator: true },
        { label: 'Paste', icon: Clipboard, disabled: !hasClipboard, action: () => runAction(() => handlers.pasteNode(null)) }
      );
    } 
    else if (node.type === 'category') {
      items.push(
        { label: 'New Category', icon: FolderPlus, action: () => runAction(() => handlers.createCategory(node.id)) },
        { label: 'Add Clip', icon: Plus, action: () => runAction(() => handlers.createClip(node.id)) },
        { separator: true },
        { label: 'Rename', icon: Edit2, action: () => runAction(() => handlers.renameNode(node.id)) },
        { label: 'Duplicate', icon: Files, action: () => runAction(() => handlers.duplicateNode(node.id)) },
        { label: 'Paste Inside', icon: Clipboard, disabled: !hasClipboard, action: () => runAction(() => handlers.pasteNode(node.id)) },
        { separator: true },
        { label: 'Delete', icon: Trash2, action: () => runAction(() => handlers.deleteNode(node.id)) }
      );
    } 
    else if (node.type === 'clip') {
      items.push(
        { label: 'New Clip', icon: Plus, action: () => runAction(() => handlers.createClip(node.id)) },
        { separator: true },
        { label: 'Rename', icon: Edit2, action: () => runAction(() => handlers.renameNode(node.id)) },
        { label: 'Duplicate', icon: Files, action: () => runAction(() => handlers.duplicateNode(node.id)) },
        { label: 'Copy', icon: Copy, action: () => runAction(() => handlers.copyNode(node.id)) },
        { label: 'Cut', icon: Scissors, action: () => runAction(() => handlers.cutNode(node.id)) },
        { label: 'Paste Below', icon: Clipboard, disabled: !hasClipboard, action: () => runAction(() => handlers.pasteNode(node.id)) },
        { separator: true },
        { label: 'Delete Clip', icon: Trash2, action: () => runAction(() => handlers.deleteNode(node.id)) }
      );
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