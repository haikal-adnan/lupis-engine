import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore';
import { usePopAlert } from '@/composables/usePopAlert';

export function useHierarchyLogic() {
  const sceneStore = useSceneStore();
  const { showPop } = usePopAlert();

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

    const sortedLayers = [...layers.value].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    return sortedLayers.map(layer => {
      const layerChildren = nodes.filter(n => n.layerId === layer._id && !n.parentId);
      return {
        _id: layer._id,
        name: layer.name,
        type: 'layer',
        scriptId: layer.scriptId,
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

  const getLayerById = (id) => layers.value.find(l => l._id === id);
  const getEntityById = (id) => entities.value.find(e => e._id === id);

  const containsType = (entityId, typeToCheck) => {
    const entity = getEntityById(entityId);
    if (!entity) return false;

    const isUI = entity.type && entity.type.startsWith('ui_'); 
    
    if (typeToCheck === 'ui' && isUI) return true;
    if (typeToCheck === 'world' && !isUI && entity.type !== 'group') return true;

    const children = entities.value.filter(e => e.parentId === entityId);
    for (const child of children) {
      if (containsType(child._id, typeToCheck)) return true;
    }
    return false;
  };

  const isEmptyGroup = (entityId) => {
     const children = entities.value.filter(e => e.parentId === entityId);
     return children.length === 0;
  }

  const moveEntity = (draggedId, targetNode, position) => {
    if (!draggedId) return;

    const draggedLayer = getLayerById(draggedId);
    const draggedEntity = getEntityById(draggedId);
    
    if (draggedLayer) {
        if (!targetNode || targetNode.type !== 'layer') return;
        
        if (draggedLayer.scriptId === 'ui' || draggedLayer.name === 'UI') {
             showPop({
                title: 'Action Denied',
                message: 'UI Layer position is fixed and cannot be moved.',
                type: 'error',
                duration: 3000
             });
             return;
        }

        if (targetNode.scriptId === 'ui' || targetNode.name === 'UI') {
             showPop({
                title: 'Action Denied',
                message: 'Cannot reorder relative to UI Layer.',
                type: 'error',
                duration: 3000
             });
             return;
        }

        sceneStore.reorderLayer(draggedId, targetNode._id, position);
        return;
    }

    if (draggedEntity) {
        if (!targetNode) {
             sceneStore.moveEntity(draggedId, {
                newParentId: null, 
                newLayerId: draggedEntity.layerId, 
                insertionType: 'append' 
             });
             return;
        }

        const targetId = targetNode._id;
        if (draggedId === targetId) return;
        if (targetNode.type !== 'layer' && isAncestor(draggedId, targetId)) return;

        let targetLayerId = null;
        let isTargetUI = false;

        if (targetNode.type === 'layer') {
            targetLayerId = targetNode._id;
            isTargetUI = targetNode.scriptId === 'ui' || targetNode.name === 'UI';
        } else {
            targetLayerId = targetNode.layerId;
            const rootLayer = getLayerById(targetLayerId);
            isTargetUI = rootLayer ? (rootLayer.scriptId === 'ui' || rootLayer.name === 'UI') : false;
        }

        const isDraggedUI = draggedEntity.type && draggedEntity.type.startsWith('ui_');
        const isGroup = draggedEntity.type === 'group';

        if (isGroup) {
            if (isTargetUI) {
                if (containsType(draggedId, 'world')) {
                     showPop({
                        title: 'Invalid Move',
                        message: 'Cannot move Group containing World Entities into UI Layer.',
                        type: 'error',
                        duration: 3000
                     });
                     return;
                }
                if (!isEmptyGroup(draggedId)) {
                     showPop({
                        title: 'Invalid Move',
                        message: 'Group must be empty to move into UI Layer.',
                        type: 'error',
                        duration: 3000
                     });
                     return;
                }

            } else {
                const oldLayer = getLayerById(draggedEntity.layerId);
                const wasUI = oldLayer ? (oldLayer.scriptId === 'ui' || oldLayer.name === 'UI') : false;

                if (wasUI && !isTargetUI && !isEmptyGroup(draggedId)) {
                     showPop({
                        title: 'Invalid Move',
                        message: 'Group must be empty to move from UI to World Layer.',
                        type: 'error',
                        duration: 3000
                     });
                     return;
                }
            }
        }
        else {
            if (isDraggedUI && !isTargetUI) {
                showPop({
                    title: 'Invalid Move',
                    message: 'UI Entities cannot be placed in World Layer.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
            if (!isDraggedUI && isTargetUI) {
                showPop({
                    title: 'Invalid Move',
                    message: 'World Entities cannot be placed in UI Layer.',
                    type: 'error',
                    duration: 3000
                });
                return;
            }
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
        } else {
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
