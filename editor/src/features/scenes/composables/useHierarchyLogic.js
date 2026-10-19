import { computed } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';

export function useHierarchyLogic() {
  const sceneStore = useSceneStore();
  const workspaceStore = useWorkspaceStore();
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
      
      entityMap[e.id] = node;
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
      const layerChildren = processedNodes.filter(n => n.layerId === layer.id && !n.parentId);
      
      return {
        id: layer.id,
        type: 'layer',
        scriptId: layer.scriptId,
        visible: layer.visible,
        locked: layer.locked,
        zIndex: Number(layer.zIndex ?? 0),
        orderIndex: layer.orderIndex ?? index,
        _section: layer._section || layer.section || 'world',
        children: sortNodes(layerChildren), 
        isContainer: true
      };
    });

    const propagateState = (node, parentLocked, parentHidden, parentInactive) => {
      const ownLocked = Boolean(node.locked || node._editor?.locked);
      const ownVisible = node.visible !== false;
      const ownActive = node.active !== false;

      node.ownLocked = ownLocked;
      node.ownVisible = ownVisible;
      node.ownActive = ownActive;

      node.inheritedLocked = parentLocked;
      node.inheritedHidden = parentHidden;
      node.inheritedInactive = parentInactive;

      node.effectiveLocked = ownLocked || parentLocked;
      node.effectiveVisible = ownVisible && !parentHidden;
      node.effectiveActive = ownActive && !parentInactive;

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => {
          propagateState(child, node.effectiveLocked, !node.effectiveVisible, !node.effectiveActive);
        });
      }
    };

    allLayers.forEach(layer => {
      const layerLocked = Boolean(layer.locked);
      const layerHidden = layer.visible === false;
      const layerInactive = layer.active === false;

      layer.effectiveLocked = layerLocked;
      layer.effectiveVisible = !layerHidden;
      layer.effectiveActive = !layerInactive;

      if (layer.children && layer.children.length > 0) {
        layer.children.forEach(child => {
          propagateState(child, layerLocked, layerHidden, layerInactive);
        });
      }
    });

    const worldLayers = [];
    const uiLayers = [];

    allLayers.forEach(layer => {
      const isUI = layer._section === 'ui' || 
                   layer.scriptId === 'l_hud' || 
                   layer.scriptId === 'l_menu' ||
                   (layer.scriptId && layer.scriptId.toLowerCase().includes('ui'));
      
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

  const getLayerById = (id) => layers.value.find(l => l.id === id);
  const getEntityById = (id) => entities.value.find(e => e.id === id);

  const isLayerUI = (layer) => {
    if (!layer) return false;
    const section = layer._section || layer.section;
    if (section === 'ui') return true;
    if (layer.scriptId === 'l_hud' || layer.scriptId === 'l_menu') return true;
    return Boolean(layer.scriptId && layer.scriptId.toLowerCase().includes('ui'));
  };

  const isAncestor = (ancestorId, potentialDescendantId) => {
    if (ancestorId === potentialDescendantId) return true;
    let current = entities.value.find(e => e.id === potentialDescendantId);
    while (current && current.parentId) {
      if (current.parentId === ancestorId) return true;
      current = entities.value.find(e => e.id === current.parentId);
    }
    return false;
  };

  const moveEntity = (draggedId, targetNode, position) => {
    if (!draggedId) return;

    const draggedLayer = getLayerById(draggedId);
    const draggedEntity = getEntityById(draggedId);
    
    // 1. Reorder Layer
    if (draggedLayer) {
      if (!targetNode || targetNode.type !== 'layer') return;
      const draggedIsUI = isLayerUI(draggedLayer);
      const targetIsUI = isLayerUI(targetNode);

      if (draggedIsUI !== targetIsUI) {
        showPop({ title: 'Invalid Move', message: 'Cannot move Layer between World and UI sections.', type: 'error' });
        return;
      }
      sceneStore.reorderLayer(draggedId, targetNode.id, position);
      return;
    }

    // 2. Move Entity
    if (draggedEntity) {
      // Case without targetNode: move to root
      if (!targetNode) {
        sceneStore.moveEntity(draggedId, {
          newParentId: null, 
          newLayerId: draggedEntity.layerId, 
          insertionType: 'append',
          referenceId: null
        });
        return; 
      }

      const targetId = targetNode.id;
      if (draggedId === targetId) return;

      if (targetNode.type !== 'layer' && isAncestor(draggedId, targetId)) {
        showPop({ title: 'Invalid Move', message: 'Cannot move an entity inside its own child.', type: 'error' });
        return;
      }

      let targetLayerId = null;
      let isTargetUI = false;

      if (targetNode.type === 'layer') {
        targetLayerId = targetNode.id;
        isTargetUI = isLayerUI(targetNode); 
      } else {
        targetLayerId = targetNode.layerId || draggedEntity.layerId;
        const rootLayer = getLayerById(targetLayerId);
        isTargetUI = isLayerUI(rootLayer);
      }

      const isDraggedUI = draggedEntity.type === 'ui' || Boolean(draggedEntity.components && draggedEntity.components.UITransform);

      if (isDraggedUI && !isTargetUI) {
        showPop({ title: 'Invalid Move', message: 'UI Entity cannot go to World Layer.', type: 'error' });
        return;
      }
      if (!isDraggedUI && isTargetUI) {
        showPop({ title: 'Invalid Move', message: 'World Entity cannot go to UI Layer.', type: 'error' });
        return;
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
        newLayerId: targetLayerId,
        insertionType: 'append',
        referenceId: null 
      };

      if (targetNode.type === 'layer') {
        context.newLayerId = targetNode.id;
        context.newParentId = null; 
        context.insertionType = 'append';
      } else if (position === 'inside') {
        context.newParentId = targetNode.id;
        context.newLayerId = targetLayerId;
        context.insertionType = 'inside';
      } else {
        context.newParentId = targetNode.parentId || null;
        context.newLayerId = targetLayerId;
        context.referenceId = targetNode.id;
        context.insertionType = position === 'top' ? 'before' : 'after';
      }

      sceneStore.moveEntity(draggedId, context);
    }
  };

  return {
    treeData,
    moveEntity
  };
}