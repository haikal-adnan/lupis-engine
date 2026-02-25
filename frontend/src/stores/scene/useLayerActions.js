import { createLayer as createLayerSchema } from '@/services/schema/schema.js'; 
import { EngineBridge } from '@/services/engine/EngineBridge.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { usePopAlert } from '@/composables/usePopAlert';

export const layerActions = {
  addLayer(name, section = 'world') {
    const scene = this.activeScene;
    if (!scene) return null;
    
    const collection = section === 'ui' ? scene.layersUI : scene.layersWorld;

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
  },

  updateLayerName(layerId, newName) {
    const scene = this.activeScene;
    if (!scene) return;

    let layer = scene.layersWorld?.find(l => l._id === layerId) || 
                scene.layersUI?.find(l => l._id === layerId);

    if (layer) {
      layer.name = newName;
      EngineBridge.updateLayerName(layerId, newName);
    }
  },

  updateLayerZIndex(layerId, newZIndex) {
    const scene = this.activeScene;
    if (!scene) return;

    let layer = scene.layersWorld?.find(l => l._id === layerId) || 
                scene.layersUI?.find(l => l._id === layerId);

    if (layer) {
      const val = parseInt(newZIndex);
      if (!isNaN(val)) layer.zIndex = val;
    }
  },
  
  deleteLayer(layerId) {
    const scene = this.activeScene;
    if (!scene) return;
    const { showPop } = usePopAlert();

    const isWorldLayer = scene.layersWorld?.some(l => l._id === layerId);
    const isUILayer = !isWorldLayer && scene.layersUI?.some(l => l._id === layerId);

    if (isWorldLayer && scene.layersWorld.length <= 1) {
        showPop({ title: 'Action Prevented', message: 'Cannot delete the last layer in World section.', type: 'warning' });
        return; 
    }

    if (isUILayer && scene.layersUI.length <= 1) {
        showPop({ title: 'Action Prevented', message: 'Cannot delete the last layer in UI section.', type: 'warning' });
        return;
    }
    
    if (scene.entities) {
        const entitiesToDelete = scene.entities.filter(e => e.layerId === layerId);
        entitiesToDelete.forEach(e => EngineBridge.deleteEntity(e._id));
        scene.entities = scene.entities.filter(e => e.layerId !== layerId);
    }
    
    scene.layersWorld = scene.layersWorld.filter(l => l._id !== layerId);
    scene.layersUI = scene.layersUI.filter(l => l._id !== layerId);

    EngineBridge.deleteLayer(layerId);
  },

  reorderLayer(draggedId, targetId, position) {
    const scene = this.activeScene;
    if (!scene) return;
    
    let collection = null;
    let draggedLayer = scene.layersWorld?.find(l => l._id === draggedId);
    
    if (draggedLayer) {
        collection = scene.layersWorld;
    } else {
        draggedLayer = scene.layersUI?.find(l => l._id === draggedId);
        if (draggedLayer) collection = scene.layersUI;
    }

    if (!collection || !draggedLayer) return;

    const currentIndex = collection.findIndex(l => l._id === draggedId);
    if (currentIndex > -1) collection.splice(currentIndex, 1);

    let targetIndex = collection.findIndex(l => l._id === targetId);
    if (targetIndex !== -1) {
        position === 'top' ? collection.splice(targetIndex, 0, draggedLayer) : collection.splice(targetIndex + 1, 0, draggedLayer);
    } else {
        collection.push(draggedLayer);
    }

    collection.forEach((layer, index) => { layer.orderIndex = index; });
    EngineBridge.reorderLayer({ id: draggedId, targetId, position });
  },

  getLayerData(layerIds) {
    const scene = this.activeScene;
    if (!scene) return null;

    const ids = Array.isArray(layerIds) ? layerIds : [layerIds];
    const result = [];

    ids.forEach(id => {
        let layer = scene.layersWorld?.find(l => l._id === id);
        let section = 'world';
        if (!layer) {
            layer = scene.layersUI?.find(l => l._id === id);
            section = 'ui';
        }

        if (layer) {
            const entities = scene.entities?.filter(e => e.layerId === id) || [];
            result.push({ 
                layer: JSON.parse(JSON.stringify(layer)), 
                entities: JSON.parse(JSON.stringify(entities)), 
                section 
            });
        }
    });
    return result.length > 0 ? result : null;
  },

  pasteLayer(clipboardWrapper, targetSection = 'world') {
    const scene = this.activeScene;
    if (!scene || !clipboardWrapper?.data) return [];
    const { showPop } = usePopAlert();

    const dataItems = Array.isArray(clipboardWrapper.data) ? clipboardWrapper.data : [clipboardWrapper.data];
    const mode = clipboardWrapper.mode; 
    const createdLayerIds = [];

    dataItems.forEach(item => {
        const { layer: sourceLayer, entities: sourceEntities, section: sourceSection } = item;
        if (!sourceLayer) return;

        if (sourceSection !== targetSection) {
            showPop({ title: 'Paste Failed', message: `Cannot paste ${sourceSection} layer into ${targetSection} section.`, type: 'error' });
            return; 
        }

        const collection = targetSection === 'ui' ? scene.layersUI : scene.layersWorld;
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

        if (sourceEntities?.length > 0) {
            const newEntities = sourceEntities.map(entity => ({
                ...entity,
                _id: GenerateUUID(),
                scriptId: `${entity.type}_${GenerateUUID().split('-')[0]}`,
                layerId: newLayerId, 
                parentId: null 
            }));
            scene.entities.push(...newEntities);
            EngineBridge.createEntity(newEntities); 
        }
    });

    return createdLayerIds;
  },

  updateLayerProp(layerId, propName, value) {
    const scene = this.activeScene;
    if (!scene) return;
    const layer = scene.layersWorld.find(l => l._id === layerId) || scene.layersUI.find(l => l._id === layerId);
    if (layer) {
        layer[propName] = value;
        return { id: layerId, prop: propName, value };
    }
  }
};