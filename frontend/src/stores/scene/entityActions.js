import { createEntity as createEntitySchema } from '@/services/schema/schema.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID';

export function useEntityActions(activeScene, selectedEntityIds) {

  const createEntity = (type, contextNode) => {
    if (!activeScene.value) return null;

    let parentId = null;
    let layerId = null;

    if (contextNode.type === 'layer') {
      layerId = contextNode._id;
      parentId = null;
    } else {
      layerId = contextNode.layerId;
      parentId = contextNode._id;
    }

    const components = {};
    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    } else if (type === 'shape') {
      components.ShapeRenderer = { type: 'rectangle', color: '#FF0000' };
    } else if (type === 'text') {
      components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' };
    } else if (type === 'tilemap') {
      const defaultW = 40; 
      const defaultH = 30;
      components.Tilemap = {  
         tileWidth: 16,
         tileHeight: 16,
         width: defaultW,
         height: defaultH,
         tilesetId: null,
         opacity: 1,
         isSolid: false,
         data: new Array(defaultW * defaultH).fill(0)
      };
    }

    
    const existingEntities = activeScene.value.entities;

    const regex = new RegExp(`^${type}_(\\d+)$`);

    let maxIndex = 0;

    existingEntities.forEach(ent => {
        const match = ent.scriptId ? ent.scriptId.match(regex) : null;
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIndex) {
                maxIndex = num;
            }
        }
    });

    const nextIndex = maxIndex + 1;
    const scriptId = `${type}_${nextIndex}`;
    
    const newEntity = createEntitySchema({
      _id: `${GenerateUUID()}`, 
      scriptId: scriptId, // Gunakan ID yang sudah di-increment
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextIndex}`, // Opsional: Nama juga mengikuti (misal "Sprite 1")
      type: type === 'group' ? 'group' : 'entity',
      layerId,
      parentId,
      components
    });

    activeScene.value.entities.push(newEntity);
    selectedEntityIds.value = [newEntity._id];

    return newEntity; 
  };

  const updateEntityName = (entityId, newName) => {
    if (!activeScene.value) return;
    
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) {
      entity.name = newName;
    }
  };

  const updateEntityScriptId = (entityId, newScriptId) => {
    if (!activeScene.value) return;

    const sanitizedId = newScriptId.replace(/[^a-zA-Z0-9_]/g, "_");

    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) {
      entity.scriptId = sanitizedId;
      return { entityId, scriptId: sanitizedId };
    }
  };

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

  const updateComponentProp = (entityId, componentName, path, value) => {
    if (!activeScene.value) return;

    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (!entity || !entity.components[componentName]) return;

    const keys = path.split('.');
    let target = entity.components[componentName];
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
    
    return { entityId, componentName, path, value };
  };

  const updateEntityProp = (entityId, propName, value) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) {
      entity[propName] = value;
      return { entityId, propName, value };
    }
  };

  const syncTilemapDataFromEngine = (entityId, newData) => {
    if (!activeScene.value) return;
    
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    
    if (entity && entity.components && entity.components.Tilemap) {
      entity.components.Tilemap.data = newData;
    }
  };

  return { 
    createEntity, 
    updateEntityName, 
    updateEntityScriptId,
    deleteEntity, 
    moveEntity,
    updateComponentProp,
    updateEntityProp,
    syncTilemapDataFromEngine
  };
}