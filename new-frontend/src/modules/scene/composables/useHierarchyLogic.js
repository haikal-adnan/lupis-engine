import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore';

export function useHierarchyLogic() {
  const sceneStore = useSceneStore();

  const entities = computed(() => sceneStore.activeEntities);
  const layers = computed(() => sceneStore.activeLayers);

  const treeData = computed(() => {
    if (!entities.value || !layers.value) return [];
    
    const entityMap = {};
    
    const nodes = entities.value.map(e => {
      const type = e.type || 'entity'; 
      
      const node = { 
        ...e, 
        children: [],
        type: type, 
        isContainer: true 
      };
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
        children: layerChildren,
        isContainer: true
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

  const moveEntity = (draggedId, targetNode, position) => {
    if (!draggedId) return;

    if (!targetNode && position === 'root') {
      const draggedEntity = entities.value.find(e => e._id === draggedId);
      if (!draggedEntity) return;

      sceneStore.moveEntity(draggedId, {
        newParentId: null, 
        newLayerId: draggedEntity.layerId, 
        insertionType: 'append' 
      });
      return;
    }

    if (!targetNode) return;
    const targetId = targetNode._id;
    if (draggedId === targetId) return;

    const isLayer = layers.value.some(l => l._id === draggedId);

    if (isLayer) {
        if (targetNode.type !== 'layer') return; 
        sceneStore.reorderLayer(draggedId, targetId, position);
    } 
    else {
        if (targetNode.type !== 'layer' && isAncestor(draggedId, targetId)) {
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

        sceneStore.moveEntity(draggedId, context);
    }
  };

  return {
    treeData,
    moveEntity
  };
}