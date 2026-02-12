import { createLayer } from '@/services/schema/schema.js'; 
import { EngineBridge } from '@/services/engine/EngineBridge.js'; // <--- JANGAN LUPA IMPORT INI

export function useLayerActions(activeScene) {
  
  const addLayer = (name, section = 'world') => {
    if (!activeScene.value) return null;
    
    const collection = section === 'ui' 
        ? activeScene.value.layersUI 
        : activeScene.value.layersWorld;

    const maxOrder = collection.reduce((max, layer) => 
        (layer.orderIndex > max ? layer.orderIndex : max), -1
    );
    
    const newLayer = createLayer({
      name: name || "New Layer",
      orderIndex: maxOrder + 1,
      zIndex: section === 'ui' ? 100 : 0
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
  
  const deleteLayer = (layerId) => {
    if (!activeScene.value) return;
    
    if (activeScene.value.entities) {
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

    const sortedList = collection
        .filter(l => l._id !== draggedId)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const targetIndex = sortedList.findIndex(l => l._id === targetId);
    
    if (targetIndex !== -1) {
        if (position === 'top') {
            sortedList.splice(targetIndex, 0, draggedLayer);
        } else { 
            sortedList.splice(targetIndex + 1, 0, draggedLayer);
        }
    } else {
        sortedList.push(draggedLayer);
    }

    sortedList.forEach((layer, index) => {
        layer.orderIndex = index;
    });

    EngineBridge.reorderLayer({ id: draggedId, targetId, position });
  };

  return { 
    addLayer, 
    updateLayerName,
    deleteLayer, 
    reorderLayer 
  };
}