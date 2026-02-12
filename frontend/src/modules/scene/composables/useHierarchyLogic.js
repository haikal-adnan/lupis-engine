import { computed } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore';
import { usePopAlert } from '@/composables/usePopAlert';

export function useHierarchyLogic() {
  const sceneStore = useSceneStore();
  const { showPop } = usePopAlert();

  const entities = computed(() => sceneStore.activeEntities || []);
  const layers = computed(() => sceneStore.activeLayers || []);

  const sortNodes = (nodes) => {
    if (!nodes || nodes.length === 0) return [];
    
    return [...nodes].sort((a, b) => {
      const zA = a.zIndex ?? 0;
      const zB = b.zIndex ?? 0;
      
      if (zA !== zB) {
        return zA - zB; 
      }

      const orderA = a.orderIndex ?? 0;
      const orderB = b.orderIndex ?? 0;
      return orderA - orderB;
    });
  };

  const treeData = computed(() => {
    const entityMap = {};
    const processedNodes = entities.value.map((e, index) => {
      const node = { 
        ...e, 
        children: [],
        type: e.type || 'entity', 
        isContainer: true, 
        zIndex: Number(e.zIndex ?? 0),
        orderIndex: e.orderIndex ?? index
      };
      
      entityMap[e._id] = node;
      return node;
    });

    processedNodes.forEach(node => {
      if (node.parentId && entityMap[node.parentId]) {
        entityMap[node.parentId].children.push(node);
      }
    });

    const recursiveSort = (nodes) => {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children = sortNodes(node.children);
                recursiveSort(node.children);
            }
        });
    };
    recursiveSort(processedNodes);

    const allLayers = layers.value.map((layer, index) => {
      const layerChildren = processedNodes.filter(n => n.layerId === layer._id && !n.parentId);
      
      return {
        _id: layer._id,
        name: layer.name,
        type: 'layer',
        scriptId: layer.scriptId,
        visible: layer.visible,
        locked: layer.locked,
        zIndex: Number(layer.zIndex ?? 0),
        orderIndex: layer.orderIndex ?? index,
        _section: layer._section,
        children: sortNodes(layerChildren), 
        isContainer: true
      };
    });

    const worldLayers = [];
    const uiLayers = [];

    allLayers.forEach(layer => {
      const isUI = layer._section === 'ui' || 
                   layer.scriptId === 'l_hud' || 
                   layer.scriptId === 'l_menu' ||
                   (layer.name && layer.name.toLowerCase().includes('ui'));
      
      if (isUI) {
        uiLayers.push(layer);
      } else {
        worldLayers.push(layer);
      }
    });

    return {
      worldTree: sortNodes(worldLayers),
      uiTree: sortNodes(uiLayers)
    };
  });

  const getLayerById = (id) => layers.value.find(l => l._id === id);
  const getEntityById = (id) => entities.value.find(e => e._id === id);

  const isAncestor = (ancestorId, potentialDescendantId) => {
    if (ancestorId === potentialDescendantId) return true;
    let current = entities.value.find(e => e._id === potentialDescendantId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = entities.value.find(e => e._id === current.parentId);
    }
    return false;
  };

  const containsType = (entityId, typeToCheck) => {
    const entity = getEntityById(entityId);
    if (!entity) return false;

    const isUIEntity = entity.type === 'ui' || (entity.components && entity.components.UITransform);
    
    if (typeToCheck === 'ui' && isUIEntity) return true;
    if (typeToCheck === 'world' && !isUIEntity && entity.type !== 'group') return true;

    const children = entities.value.filter(e => e.parentId === entityId);
    for (const child of children) {
      if (containsType(child._id, typeToCheck)) return true;
    }
    return false;
  };

  const moveEntity = (draggedId, targetNode, position) => {
    if (!draggedId) return;

    const draggedLayer = getLayerById(draggedId);
    const draggedEntity = getEntityById(draggedId);
    
    if (draggedLayer) {
        if (!targetNode || targetNode.type !== 'layer') return;
        
        const draggedIsUI = draggedLayer._section === 'ui' || (draggedLayer.name && draggedLayer.name.includes('UI'));
        const targetIsUI = targetNode._section === 'ui' || (targetNode.name && targetNode.name.includes('UI'));

        if (draggedIsUI !== targetIsUI) {
             showPop({ title: 'Invalid Move', message: 'Cannot move Layer between World and UI sections.', type: 'error' });
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
            isTargetUI = targetNode._section === 'ui' || (targetNode.name && targetNode.name.includes('UI')); 
        } else {
            targetLayerId = targetNode.layerId;
            const rootLayer = getLayerById(targetLayerId);
            isTargetUI = rootLayer ? (rootLayer._section === 'ui' || rootLayer.name.includes('UI')) : false;
        }

        const isDraggedUI = draggedEntity.type === 'ui' || (draggedEntity.components && draggedEntity.components.UITransform);
        const isGroup = draggedEntity.type === 'group';

        if (isGroup) {
            if (isTargetUI) {
                if (containsType(draggedId, 'world')) {
                     showPop({ title: 'Invalid Move', message: 'Group contains World Entities.', type: 'error' });
                     return;
                }
            } else {
                if (containsType(draggedId, 'ui')) {
                     showPop({ title: 'Invalid Move', message: 'Group contains UI Entities.', type: 'error' });
                     return;
                }
            }
        }
        else {
            if (isDraggedUI && !isTargetUI) {
                showPop({ title: 'Invalid Move', message: 'UI Entity cannot go to World Layer.', type: 'error' });
                return;
            }
            if (!isDraggedUI && isTargetUI) {
                showPop({ title: 'Invalid Move', message: 'World Entity cannot go to UI Layer.', type: 'error' });
                return;
            }
        }

        const isSameParent = (draggedEntity.parentId || null) === (targetNode.parentId || null);

        if (targetNode.type !== 'layer' && (position === 'top' || position === 'bottom') && isSameParent) {
            const targetZ = targetNode.zIndex ?? 0;
            const draggedZ = draggedEntity.zIndex ?? 0;

            if (targetZ !== draggedZ) {
                showPop({ 
                    title: 'Action Restricted', 
                    message: `Cannot reorder siblings with different Z-Index (${draggedZ} vs ${targetZ}).`, 
                    type: 'warning'
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