import { createLayer as createLayerSchema } from '@/services/schema/schema.js'; 
import { EngineBridge } from '@/services/engine/EngineBridge.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { usePopAlert } from '@/composables/usePopAlert';

export function useLayerActions(activeScene) {
  const { showPop } = usePopAlert();

  const addLayer = (name, section = 'world') => {
    if (!activeScene.value) return null;
    
    const collection = section === 'ui' 
        ? activeScene.value.layersUI 
        : activeScene.value.layersWorld;

    const maxOrder = collection.reduce((max, layer) => 
        (layer.orderIndex > max ? layer.orderIndex : max), -1
    );
    
    const newLayer = createLayerSchema({
      name: name || "New Layer",
      orderIndex: maxOrder + 1,
      zIndex: 0
    });

    collection.push(newLayer);
    EngineBridge.addLayer(newLayer); 

    return newLayer;
  };

  const updateLayerName = (layerId, newName) => {
    if (!activeScene.value) return;

    let layer = activeScene.value.layersWorld?.find(l => l._id === layerId);
    if (!layer) {
        layer = activeScene.value.layersUI?.find(l => l._id === layerId);
    }

    if (layer) {
      layer.name = newName;
      EngineBridge.updateLayerName(layerId, newName);
    }
  };

  const updateLayerZIndex = (layerId, newZIndex) => {
    if (!activeScene.value) return;

    let layer = activeScene.value.layersWorld?.find(l => l._id === layerId);
    if (!layer) {
        layer = activeScene.value.layersUI?.find(l => l._id === layerId);
    }

    if (layer) {
      const val = parseInt(newZIndex);
      if (!isNaN(val)) {
        layer.zIndex = val;
      }
    }
  };
  
  const deleteLayer = (layerId) => {
    if (!activeScene.value) return;

    let isWorldLayer = activeScene.value.layersWorld?.some(l => l._id === layerId);
    let isUILayer = false;

    if (!isWorldLayer) {
        isUILayer = activeScene.value.layersUI?.some(l => l._id === layerId);
    }

    if (isWorldLayer && activeScene.value.layersWorld.length <= 1) {
        showPop({ 
            title: 'Action Prevented', 
            message: 'Cannot delete the last layer in World section.', 
            type: 'warning' 
        });
        return; 
    }

    if (isUILayer && activeScene.value.layersUI.length <= 1) {
        showPop({ 
            title: 'Action Prevented', 
            message: 'Cannot delete the last layer in UI section.', 
            type: 'warning' 
        });
        return;
    }
    
    if (activeScene.value.entities) {
        const entitiesToDelete = activeScene.value.entities.filter(e => e.layerId === layerId);
        entitiesToDelete.forEach(e => EngineBridge.deleteEntity(e._id));
        activeScene.value.entities = activeScene.value.entities.filter(e => e.layerId !== layerId);
    }
    
    if (activeScene.value.layersWorld) {
        activeScene.value.layersWorld = activeScene.value.layersWorld.filter(l => l._id !== layerId);
    }
    if (activeScene.value.layersUI) {
        activeScene.value.layersUI = activeScene.value.layersUI.filter(l => l._id !== layerId);
    }

    EngineBridge.deleteLayer(layerId);
  };

  const reorderLayer = (draggedId, targetId, position) => {
    if (!activeScene.value) return;
    
    let collection = null;
    let draggedLayer = activeScene.value.layersWorld?.find(l => l._id === draggedId);
    
    if (draggedLayer) {
        collection = activeScene.value.layersWorld;
    } else {
        draggedLayer = activeScene.value.layersUI?.find(l => l._id === draggedId);
        if (draggedLayer) {
            collection = activeScene.value.layersUI;
        }
    }

    if (!collection || !draggedLayer) return;

    const currentIndex = collection.findIndex(l => l._id === draggedId);
    if (currentIndex > -1) collection.splice(currentIndex, 1);

    let targetIndex = collection.findIndex(l => l._id === targetId);
    
    if (targetIndex !== -1) {
        if (position === 'top') {
            collection.splice(targetIndex, 0, draggedLayer);
        } else { 
            collection.splice(targetIndex + 1, 0, draggedLayer);
        }
    } else {
        collection.push(draggedLayer);
    }

    collection.forEach((layer, index) => {
        layer.orderIndex = index;
    });

    EngineBridge.reorderLayer({ id: draggedId, targetId, position });
  };

  const getLayerData = (layerIds) => {
    if (!activeScene.value) return null;

    const ids = Array.isArray(layerIds) ? layerIds : [layerIds];
    const result = [];

    ids.forEach(id => {
        let layer = activeScene.value.layersWorld?.find(l => l._id === id);
        let section = 'world';
        
        if (!layer) {
            layer = activeScene.value.layersUI?.find(l => l._id === id);
            section = 'ui';
        }

        if (layer) {
            const entities = activeScene.value.entities?.filter(e => e.layerId === id) || [];
            result.push({ 
                layer: JSON.parse(JSON.stringify(layer)), 
                entities: JSON.parse(JSON.stringify(entities)), 
                section 
            });
        }
    });

    return result.length > 0 ? result : null;
  };

  const pasteLayer = (clipboardWrapper, targetSection = 'world') => {
    if (!activeScene.value || !clipboardWrapper || !clipboardWrapper.data) return [];

    const dataItems = Array.isArray(clipboardWrapper.data) ? clipboardWrapper.data : [clipboardWrapper.data];
    const mode = clipboardWrapper.mode; 
    const createdLayerIds = [];

    let hasSectionMismatch = false;
    let mismatchedDetails = { source: '', target: '' };

    dataItems.forEach(item => {
        const { layer: sourceLayer, entities: sourceEntities, section: sourceSection } = item;
        
        if (!sourceLayer) return;

        if (sourceSection !== targetSection) {
            hasSectionMismatch = true;
            mismatchedDetails = { source: sourceSection, target: targetSection };
            return; 
        }

        const collection = targetSection === 'ui' 
            ? activeScene.value.layersUI 
            : activeScene.value.layersWorld;

        const newLayerId = GenerateUUID(); 

        const newLayer = {
            ...sourceLayer,
            _id: newLayerId,
            scriptId: `layer_${GenerateUUID().split('-')[0]}`,
            name: mode === 'copy' ? `${sourceLayer.name} (Copy)` : sourceLayer.name,
            orderIndex: collection.length, 
        };

        collection.push(newLayer);
        EngineBridge.addLayer(newLayer);
        createdLayerIds.push(newLayerId);

        if (sourceEntities && sourceEntities.length > 0) {
            const newEntities = sourceEntities.map(entity => {
                const newEntityId = GenerateUUID();
                return {
                    ...entity,
                    _id: newEntityId,
                    scriptId: `${entity.type}_${GenerateUUID().split('-')[0]}`,
                    layerId: newLayerId, 
                    parentId: null 
                };
            });

            activeScene.value.entities.push(...newEntities);
            EngineBridge.createEntity(newEntities); 
        }
    });

    if (hasSectionMismatch) {
        showPop({ 
            title: 'Paste Failed', 
            message: `Cannot paste ${mismatchedDetails.source} layer into ${mismatchedDetails.target} section.`, 
            type: 'error' 
        });
    }

    return createdLayerIds;
  };

  const duplicateLayer = (layerIds) => {
    if (!activeScene.value) return;

    const ids = Array.isArray(layerIds) ? layerIds : [layerIds];
    const createdLayerIds = [];

    ids.forEach(layerId => {
        let originalLayer = activeScene.value.layersWorld?.find(l => l._id === layerId);
        let section = 'world';
        
        if (!originalLayer) {
            originalLayer = activeScene.value.layersUI?.find(l => l._id === layerId);
            section = 'ui';
        }

        if (!originalLayer) return;

        const collection = section === 'ui' 
            ? activeScene.value.layersUI 
            : activeScene.value.layersWorld;

        const newLayerId = GenerateUUID();
        const newLayer = {
            ...JSON.parse(JSON.stringify(originalLayer)), 
            _id: newLayerId,
            scriptId: `layer_${GenerateUUID().split('-')[0]}`,
            name: `${originalLayer.name} (Copy)`,
            orderIndex: originalLayer.orderIndex + 1 
        };

        collection.forEach(l => {
            if (l.orderIndex >= newLayer.orderIndex) {
                l.orderIndex += 1;
            }
        });

        collection.push(newLayer);
        collection.sort((a, b) => a.orderIndex - b.orderIndex);

        EngineBridge.addLayer(newLayer);
        createdLayerIds.push(newLayerId);

        const originalEntities = activeScene.value.entities?.filter(e => e.layerId === layerId) || [];
        
        if (originalEntities.length > 0) {
            const idMap = {};
            const newEntities = originalEntities.map(entity => {
                const newId = GenerateUUID();
                idMap[entity._id] = newId;
                return {
                    ...JSON.parse(JSON.stringify(entity)),
                    _id: newId,
                    scriptId: `${entity.type}_${GenerateUUID().split('-')[0]}`,
                    layerId: newLayerId, 
                };
            });

            newEntities.forEach(ent => {
                if (ent.parentId && idMap[ent.parentId]) {
                    ent.parentId = idMap[ent.parentId];
                } else {
                    ent.parentId = null; 
                }
            });

            activeScene.value.entities.push(...newEntities);
            EngineBridge.createEntity(newEntities);
        }
    });

    return createdLayerIds;
  };

  const updateLayerProp = (layerId, propName, value) => {
    if (!activeScene.value) return;
    
    const layer = activeScene.value.layersWorld.find(l => l._id === layerId) || 
                  activeScene.value.layersUI.find(l => l._id === layerId);
                  
    if (layer) {
        layer[propName] = value;
        return { id: layerId, prop: propName, value };
    }
};

  return { 
    addLayer,
    updateLayerZIndex, 
    updateLayerName,
    deleteLayer, 
    reorderLayer,
    getLayerData,
    pasteLayer,
    duplicateLayer,
    updateLayerProp
  };
}