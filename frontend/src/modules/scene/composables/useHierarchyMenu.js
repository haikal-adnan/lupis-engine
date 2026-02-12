import { ref } from 'vue';
import { 
  Plus, Trash2, Edit2, Folder, RefreshCw, 
  Cuboid, Image, Type, Square, InspectionPanel,
  MousePointerClick, Maximize
} from 'lucide-vue-next';

export function useHierarchyMenu(handlers) {
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] });

  const openMenu = (event, node, section = 'world') => {
    
    // --- 1. IDENTIFIKASI KONTEKS ---
    let isUIContext = false;

    if (node) {
        // Deteksi dari Node yang di-klik
        isUIContext = node._section === 'ui' || 
                      node.scriptId === 'ui' || 
                      node.name === 'UI' ||
                      (node.type && node.type.startsWith('ui_'));
        
        // Safety check via LayerId jika node adalah entity
        if (!isUIContext && node.layerId) {
             if (node.type === 'ui' || node.type === 'ui_entity') isUIContext = true;
        }
    } else {
        // Deteksi dari area kosong
        isUIContext = section === 'ui';
    }

    // --- 2. DEFINISI SUB-MENU CREATION ---

    const createWorldItems = [
        { label: 'Empty Entity', icon: Cuboid, action: () => handlers.createEntity('empty', node) },
        { label: 'Sprite', icon: Image, action: () => handlers.createEntity('sprite', node) },
        { label: 'Shape', icon: Square, action: () => handlers.createEntity('shape', node) },
        { label: 'Text', icon: Type, action: () => handlers.createEntity('text', node) },
        { label: 'Tilemap', icon: InspectionPanel, action: () => handlers.createEntity('tilemap', node) },
        { separator: true },
        { label: 'Group', icon: Folder, action: () => handlers.createEntity('group', node) }
    ];

    const createUiItems = [
        { label: 'Empty UI', icon: Maximize, action: () => handlers.createEntity('ui_empty', node) },
        { separator: true },
        { label: 'UI Panel', icon: Square, action: () => handlers.createEntity('ui_panel', node) },
        { label: 'UI Button', icon: MousePointerClick, action: () => handlers.createEntity('ui_button', node) },
        { label: 'UI Text', icon: Type, action: () => handlers.createEntity('ui_text', node) },
        { label: 'UI Image', icon: Image, action: () => handlers.createEntity('ui_image', node) },
        { separator: true },
        { label: 'Group', icon: Folder, action: () => handlers.createEntity('group', node) }
    ];

    // --- 3. CONSTRUCT MENU ---
    const items = [];

    if (!node) {
        // Klik Area Kosong -> Hanya Refresh (Add Layer sudah ada di Header Section)
        items.push(
            { label: 'Refresh Tree', icon: RefreshCw, action: handlers.refresh }
        );
    } 
    else {
        const isLayer = node.type === 'layer';

        // CREATE MENUS
        if (isUIContext) {
            items.push({ 
                label: isLayer ? 'Add UI Element' : 'Add Child UI', 
                icon: Plus, 
                children: createUiItems 
            });
        } 
        else {
            items.push({ 
                label: isLayer ? 'Add Entity' : 'Add Child', 
                icon: Plus, 
                children: createWorldItems 
            });
        }

        items.push({ separator: true });

        // EDIT MENUS
        if (isLayer) {
            items.push(
                { label: 'Rename Layer', icon: Edit2, shortcut: 'F2', action: () => handlers.renameLayer(node._id) },
                { separator: true },
                { label: 'Delete Layer', icon: Trash2, action: () => handlers.deleteLayer(node._id) }
            );
        } 
        else {
            items.push(
                { label: 'Rename Entity', icon: Edit2, shortcut: 'F2', action: () => handlers.renameEntity(node._id) },
                { separator: true },
                { label: 'Delete Entity', icon: Trash2, shortcut: 'Del', action: () => handlers.deleteEntity(node._id) }
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