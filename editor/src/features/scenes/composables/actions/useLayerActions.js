import { layerSchema } from '@scenes/scenes.js'; 
import { engineBridge } from "@engines/engines.js";
import { GenerateUUID, sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate } from '@utils/utils.js';
import { usePopAlert } from '@composables/composables.js';
import { useSceneHistory } from '@historys/historys.js';

export const useLayerActions = {
  addLayer(name, section = 'world', recordHistory = true) {
    const scene = this.activeScene;
    if (!scene) return null;
    
    const collection = section === 'ui' ? scene.layersUI : scene.layersWorld;
    const allLayers = [...(scene.layersWorld || []), ...(scene.layersUI || [])];

    const maxOrder = collection.reduce((max, layer) => 
        (layer.orderIndex > max ? layer.orderIndex : max), -1
    );
    
    const defaultSlug = section === 'ui' ? 'UI_Layer' : 'World_Layer';
    const desired = name || defaultSlug;
    const uniqueScriptId = getValidUniqueScriptId(desired, allLayers, l => l.scriptId);

    const newLayer = layerSchema({
      scriptId: uniqueScriptId,
      orderIndex: maxOrder + 1,
      zIndex: 0
    });

    newLayer.section = section;
    collection.push(newLayer);
    engineBridge.addLayer(newLayer); 

    if (recordHistory) {
      const { recordAddLayer } = useSceneHistory();
      recordAddLayer(newLayer, section);
    }

    return newLayer;
  },

  restoreLayer(layerData, section) {
    const scene = this.activeScene;
    if (!scene) return;

    const collection = section === 'ui' ? scene.layersUI : scene.layersWorld;
    collection.push(layerData);
    engineBridge.addLayer(layerData);
  },

  updateLayerScriptId(layerId, newScriptId) {
    const scene = this.activeScene;
    if (!scene || !newScriptId || !newScriptId.trim()) return false;

    let layer = scene.layersWorld?.find(l => l.id === layerId) || 
                scene.layersUI?.find(l => l.id === layerId);

    if (!layer) return false;

    const sanitized = sanitizeScriptId(newScriptId);
    if (!sanitized) return false;

    const allLayers = [...(scene.layersWorld || []), ...(scene.layersUI || [])];
    if (isScriptIdDuplicate(sanitized, allLayers, l => l.scriptId, layerId)) {
      return false;
    }

    if (layer.scriptId !== sanitized) {
      const oldScriptId = layer.scriptId;
      layer.scriptId = sanitized;
      delete layer.name;
      engineBridge.updateLayerScriptId(layerId, sanitized);

      const { recordLayerPropChange } = useSceneHistory();
      recordLayerPropChange(layerId, 'scriptId', oldScriptId, sanitized);
      return true;
    }
    return true;
  },

  updateLayerZIndex(layerId, newZIndex) {
    const scene = this.activeScene;
    if (!scene) return;

    let layer = scene.layersWorld?.find(l => l.id === layerId) || 
                scene.layersUI?.find(l => l.id === layerId);

    if (layer) {
      const val = parseInt(newZIndex);
      if (!isNaN(val) && layer.zIndex !== val) {
        const oldVal = layer.zIndex;
        layer.zIndex = val;

        const { recordLayerPropChange } = useSceneHistory();
        recordLayerPropChange(layerId, 'zIndex', oldVal, val);
      }
    }
  },
  
  deleteLayer(layerId, recordHistory = true) {
    const scene = this.activeScene;
    if (!scene) return;
    const { showPop } = usePopAlert();

    const isWorldLayer = scene.layersWorld?.some(l => l.id === layerId);
    const isUILayer = !isWorldLayer && scene.layersUI?.some(l => l.id === layerId);

    if (isWorldLayer && scene.layersWorld.length <= 1) {
      showPop({ title: 'Action Prevented', message: 'Cannot delete the last layer in World section.', type: 'warning' });
      return; 
    }

    if (isUILayer && scene.layersUI.length <= 1) {
      showPop({ title: 'Action Prevented', message: 'Cannot delete the last layer in UI section.', type: 'warning' });
      return;
    }
    
    let layerToDelete = scene.layersWorld?.find(l => l.id === layerId);
    let section = 'world';
    if (!layerToDelete) {
      layerToDelete = scene.layersUI?.find(l => l.id === layerId);
      section = 'ui';
    }

    if (!layerToDelete) return;

    const entitiesToDelete = scene.entities ? scene.entities.filter(e => e.layerId === layerId) : [];

    if (recordHistory) {
      const { recordDeleteLayer } = useSceneHistory();
      recordDeleteLayer(layerToDelete, section, entitiesToDelete);
    }

    if (entitiesToDelete.length > 0) {
      entitiesToDelete.forEach(e => engineBridge.deleteEntity(e.id));
      scene.entities = scene.entities.filter(e => e.layerId !== layerId);
    }
    
    scene.layersWorld = scene.layersWorld.filter(l => l.id !== layerId);
    scene.layersUI = scene.layersUI.filter(l => l.id !== layerId);

    engineBridge.deleteLayer(layerId);
  },

  reorderLayer(draggedId, targetId, position) {
    const scene = this.activeScene;
    if (!scene) return;
    
    let collection = null;
    let draggedLayer = scene.layersWorld?.find(l => l.id === draggedId);
    
    if (draggedLayer) {
      collection = scene.layersWorld;
    } else {
      draggedLayer = scene.layersUI?.find(l => l.id === draggedId);
      if (draggedLayer) collection = scene.layersUI;
    }

    if (!collection || !draggedLayer) return;

    const oldState = collection.map(l => ({ id: l.id, orderIndex: l.orderIndex }));

    const currentIndex = collection.findIndex(l => l.id === draggedId);
    if (currentIndex > -1) collection.splice(currentIndex, 1);

    let targetIndex = collection.findIndex(l => l.id === targetId);
    if (targetIndex !== -1) {
      position === 'top' ? collection.splice(targetIndex, 0, draggedLayer) : collection.splice(targetIndex + 1, 0, draggedLayer);
    } else {
      collection.push(draggedLayer);
    }

    collection.forEach((layer, index) => { layer.orderIndex = index; });
    engineBridge.reorderLayer({ id: draggedId, targetId, position });

    const newState = collection.map(l => ({ id: l.id, orderIndex: l.orderIndex }));

    const { recordReorderLayer } = useSceneHistory();
    recordReorderLayer(draggedId, targetId, position, oldState, newState);
  },

  applyLayerOrderState(orderState) {
    const scene = this.activeScene;
    if (!scene || !orderState) return;

    orderState.forEach(item => {
      let layer = scene.layersWorld?.find(l => l.id === item.id) || scene.layersUI?.find(l => l.id === item.id);
      if (layer) layer.orderIndex = item.orderIndex;
    });
  },

  getLayerData(layerIds) {
    const scene = this.activeScene;
    if (!scene) return null;

    const ids = Array.isArray(layerIds) ? layerIds : [layerIds];
    const result = [];

    ids.forEach(id => {
      let layer = scene.layersWorld?.find(l => l.id === id);
      let section = 'world';
      if (!layer) {
        layer = scene.layersUI?.find(l => l.id === id);
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
      const allLayers = [...(scene.layersWorld || []), ...(scene.layersUI || [])];
      const newLayerId = GenerateUUID(); 

      const baseScriptId = sourceLayer.scriptId || 'layer';
      const desiredScriptId = mode === 'copy' ? `${baseScriptId}_copy` : baseScriptId;
      const uniqueScriptId = getValidUniqueScriptId(desiredScriptId, allLayers, l => l.scriptId);

      const newLayer = layerSchema({
        ...sourceLayer,
        id: newLayerId,
        scriptId: uniqueScriptId,
        orderIndex: collection.length, 
      });

      collection.push(newLayer);
      engineBridge.addLayer(newLayer);
      createdLayerIds.push(newLayerId);

      if (sourceEntities?.length > 0) {
        const newEntities = sourceEntities.map(entity => ({
          ...entity,
          id: GenerateUUID(),
          scriptId: `${entity.type}_${GenerateUUID().split('-')[0]}`,
          layerId: newLayerId, 
          parentId: null 
        }));
        scene.entities.push(...newEntities);
        engineBridge.createEntity(newEntities); 
      }

      const { recordAddLayer } = useSceneHistory();
      recordAddLayer(newLayer, targetSection);
    });

    return createdLayerIds;
  },

  duplicateLayer(layerId) {
    const data = this.getLayerData(layerId);
    if (!data || data.length === 0) return [];

    const targetSection = data[0].section;
    const mockClipboard = { type: 'layer', data: data, mode: 'copy' };

    return this.pasteLayer(mockClipboard, targetSection);
  },

  updateLayerProp(layerId, propName, value, recordHistory = true) {
    const scene = this.activeScene;
    if (!scene) return;
    const layer = scene.layersWorld.find(l => l.id === layerId) || scene.layersUI.find(l => l.id === layerId);
    if (layer) {
      const oldValue = layer[propName];
      layer[propName] = value;

      if (recordHistory && oldValue !== value) {
        const { recordLayerPropChange } = useSceneHistory();
        recordLayerPropChange(layerId, propName, oldValue, value);
      }
      return { id: layerId, prop: propName, value };
    }
  }
};