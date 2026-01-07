import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore';

export function useHierarchyLogic() {
  const sceneStore = useSceneStore();

  const entities = computed(() => sceneStore.activeEntities);
  const layers = computed(() => sceneStore.activeLayers);

  // --- TREE BUILDER (Sama seperti sebelumnya) ---
  const treeData = computed(() => {
    if (!entities.value || !layers.value) return [];
    
    const entityMap = {};
    const nodes = entities.value.map(e => {
      const node = { ...e, children: [] };
      entityMap[e._id] = node;
      return node;
    });

    nodes.forEach(node => {
      if (node.parentId && entityMap[node.parentId]) {
        entityMap[node.parentId].children.push(node);
      }
    });

    return layers.value.map(layer => {
      const layerChildren = nodes.filter(n => n.layerId === layer._id && !n.parentId);
      return {
        _id: layer._id,
        name: layer.name,
        type: 'layer',
        visible: layer.visible,
        locked: layer.locked,
        children: layerChildren
      };
    });
  });

  const isAncestor = (ancestorId, potentialDescendantId) => {
    if (ancestorId === potentialDescendantId) return true;
    let current = entities.value.find(e => e._id === potentialDescendantId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = entities.value.find(e => e._id === current.parentId);
    }
    return false;
  };

  // --- MAIN DRAG DROP LOGIC ---
  const moveNode = (draggedId, targetNode, position) => {
    if (!draggedId || !targetNode) return;
    const targetId = targetNode._id;
    if (draggedId === targetId) return;

    // 1. CEK APAKAH YANG DI DRAG ADALAH LAYER
    const isLayer = layers.value.some(l => l._id === draggedId);

    if (isLayer) {
        // --- LOGIC MOVE LAYER ---
        // Layer hanya boleh didrop ke Layer lain (untuk reorder)
        if (targetNode.type !== 'layer') return; 

        // Panggil Store Action khusus Layer
        sceneStore.reorderLayer(draggedId, targetId, position);
    } 
    else {
        // --- LOGIC MOVE ENTITY ---
        
        // Validasi: Jangan masukkan parent ke anak sendiri
        if (targetNode.type !== 'layer' && isAncestor(draggedId, targetId)) {
            console.warn("🚫 Blocked: Cannot move parent into child.");
            return; 
        }

        const context = {
            newParentId: null,
            newLayerId: null,
            insertionType: 'append',
            referenceId: null 
        };

        if (targetNode.type === 'layer') {
            context.newLayerId = targetNode._id;
            context.newParentId = null;
            context.insertionType = 'append';
        } 
        else {
            if (position === 'inside') {
                context.newParentId = targetNode._id;
                context.newLayerId = targetNode.layerId;
                context.insertionType = 'append';
            } else {
                context.newParentId = targetNode.parentId || null;
                context.newLayerId = targetNode.layerId;
                context.referenceId = targetNode._id;
                context.insertionType = position === 'top' ? 'before' : 'after';
            }
        }

        // Panggil Store Action khusus Entity
        sceneStore.moveEntity(draggedId, context);
    }
  };

  return {
    treeData,
    moveEntity: moveNode // Ekspor dengan nama moveEntity agar kompatibel dengan kode UI kamu
  };
}