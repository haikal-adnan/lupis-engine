import { ref } from 'vue';
import { useEditorStore } from '@/stores/useEditorStore';
import { 
  Plus, Trash2, Edit2, Copy, FolderPlus, 
  Cuboid, Image, Type, Scissors, Clipboard, 
  Folder, RefreshCw, Square, InspectionPanel,
  LayoutTemplate, MousePointerClick, AppWindow,
  Maximize // [FIX] Tambahkan import ini
} from 'lucide-vue-next';

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });
  const editorStore = useEditorStore();

  const openMenu = (event, node) => {
    // 1. Cek apakah ini Layer UI
    const isUiLayer = node && node.type === 'layer' && (node.scriptId === 'ui' || node.name === 'UI');
    const isCurrentTabUi = editorStore.activeTab?.type === 'ui';

    // Sub-menu standar untuk Layer Biasa
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

    // Sub-menu khusus Layer UI
    const createUiSubMenu = [
        { label: 'Empty UI', icon: Maximize, action: () => handlers.createEntity('ui_empty', node) },
        { separator: true },
        { label: 'UI Button', icon: MousePointerClick, action: () => handlers.createEntity('ui_button', node) },
        { label: 'UI Text', icon: Type, action: () => handlers.createEntity('ui_text', node) },
        { label: 'UI Panel', icon: Square, action: () => handlers.createEntity('ui_panel', node) },
        // [FIX] Ganti ImageIcon menjadi Image
        { label: 'UI Image', icon: Image, action: () => handlers.createEntity('ui_image', node) },
    ];

    const handleOpenUIEditor = () => {
        editorStore.openTab({
            id: `tab_ui_${node._id}`, 
            name: `UI Editor`,
            type: 'ui',              
            entityId: node._id        
        });
    };

    const items = [];

    // --- LOGIKA MENU ---

    if (!node) {
      // Klik di area kosong (Root)
      items.push(
        { label: 'New Layer', icon: Plus, action: handlers.addLayer },
        { separator: true },
        { label: 'Refresh Tree', icon: RefreshCw, action: handlers.refresh }
      );
    } 
    else if (node.type === 'layer') {
      
      if (isUiLayer) {
        // >>> MENU KHUSUS UI LAYER <<<
        items.push(
            { 
                label: 'Open UI Editor', 
                icon: LayoutTemplate, 
                disabled: isCurrentTabUi, 
                action: handleOpenUIEditor 
            },
            { 
                label: editorStore.showUIBorder ? 'Hide UI Border' : 'Show UI Border', 
                icon: AppWindow, 
                action: editorStore.toggleUIBorder 
            },
            { separator: true },
            { 
                label: 'Create Inside UI', 
                icon: Plus, 
                children: createUiSubMenu 
            }
            // Rename dan Delete TIDAK dimasukkan di sini
        );
      } else {
        // >>> MENU LAYER BIASA <<<
        items.push(
            { label: 'Create Inside Layer', icon: Plus, children: createEntitySubMenu },
            { separator: true },
            // Rename dan Delete HANYA ada di layer biasa
            { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => handlers.renameLayer(node._id) },
            { separator: true },
            { label: 'Delete Layer', icon: Trash2, action: () => handlers.deleteLayer(node._id) }
        );
      }
    } 
    else {
      // Logic untuk Entity / Group
      items.push(
        { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => handlers.renameEntity(node._id) },
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