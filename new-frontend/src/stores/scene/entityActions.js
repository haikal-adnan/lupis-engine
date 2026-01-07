import { createEntity as createEntitySchema } from '@/services/schema/schema.js'; // Import Schema

export function useEntityActions(activeScene, selectedEntityIds) {

  const createEntity = (type, contextNode) => {
    if (!activeScene.value) return;

    // Logic penentuan Parent & Layer tetap di sini
    let parentId = null;
    let layerId = null;

    if (contextNode.type === 'layer') {
      layerId = contextNode._id;
      parentId = null;
    } else {
      layerId = contextNode.layerId;
      parentId = contextNode._id;
    }

    // Persiapan Data Komponen Spesifik
    const components = {};
    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    } else if (type === 'text') {
      components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' };
    }

    // GUNAKAN SCHEMA FACTORY
    const newEntity = createEntitySchema({
      // ID bisa digenerate di sini atau di schema, 
      // tapi lebih aman generate di sini untuk memastikan unique client-side timestamp
      _id: `ent_${Date.now()}`, 
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type: type === 'group' ? 'group' : 'entity',
      layerId,
      parentId,
      components
    });

    activeScene.value.entities.push(newEntity);
    selectedEntityIds.value = [newEntity._id];
  };

  // ... deleteEntity & moveEntity tetap sama ...
  const deleteEntity = (entityId) => {
    if (!activeScene.value) return;
    const getDescendants = (parentId) => {
      const children = activeScene.value.entities.filter(e => e.parentId === parentId);
      let ids = children.map(c => c._id);
      children.forEach(child => {
        ids = [...ids, ...getDescendants(child._id)];
      });
      return ids;
    };
    const idsToDelete = [entityId, ...getDescendants(entityId)];
    activeScene.value.entities = activeScene.value.entities.filter(e => !idsToDelete.includes(e._id));
    selectedEntityIds.value = [];
  };

  const moveEntity = (draggedId, targetContext) => {
    if (!activeScene.value) return;
    const entities = activeScene.value.entities;
    const draggedIndex = entities.findIndex(e => e._id === draggedId);
    if (draggedIndex === -1) return;
    const [draggedItem] = entities.splice(draggedIndex, 1);
    draggedItem.parentId = targetContext.newParentId;
    draggedItem.layerId = targetContext.newLayerId;
    if (targetContext.insertionType === 'append') {
      entities.push(draggedItem);
    } else {
      const siblingIndex = entities.findIndex(e => e._id === targetContext.referenceId);
      if (siblingIndex !== -1) {
        const insertIndex = targetContext.insertionType === 'after' ? siblingIndex + 1 : siblingIndex;
        entities.splice(insertIndex, 0, draggedItem);
      } else {
        entities.push(draggedItem);
      }
    }
  };

  return { createEntity, deleteEntity, moveEntity };
}