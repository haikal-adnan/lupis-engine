import { createLayer } from '@/services/schema/schema.js'; // Import Schema

export function useLayerActions(activeScene) {
  
  const addLayer = (name) => {
    if (!activeScene.value) return;
    
    // Gunakan Schema Factory
    const newLayer = createLayer({
      name: name || "New Layer"
      // ID otomatis digenerate oleh createLayer jika kosong
    });

    activeScene.value.layers.push(newLayer);
  };
  
  // ... deleteLayer & reorderLayer tetap sama ...
  const deleteLayer = (layerId) => {
    if (!activeScene.value) return;
    if (activeScene.value.entities) {
        activeScene.value.entities = activeScene.value.entities.filter(e => e.layerId !== layerId);
    }
    activeScene.value.layers = activeScene.value.layers.filter(l => l._id !== layerId);
  };

  const reorderLayer = (draggedId, targetId, position) => {
    if (!activeScene.value) return;
    const layers = activeScene.value.layers;
    const oldIndex = layers.findIndex(l => l._id === draggedId);
    if (oldIndex === -1) return;
    const [movedLayer] = layers.splice(oldIndex, 1);
    let targetIndex = layers.findIndex(l => l._id === targetId);
    if (position === 'bottom') targetIndex += 1;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > layers.length) targetIndex = layers.length;
    layers.splice(targetIndex, 0, movedLayer);
  };

  return { addLayer, deleteLayer, reorderLayer };
}