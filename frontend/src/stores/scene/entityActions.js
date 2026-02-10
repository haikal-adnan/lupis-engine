// src/modules/editor/composables/useEntityActions.js

import { createEntity as createEntitySchema } from '@/services/schema/schema.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID';
import { createComponent } from '@/services/schema/sceneSchema/componentSchema.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

const round = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export function useEntityActions(activeScene, selectedEntityIds) {

  const createEntity = (type, contextNode) => {
    if (!activeScene.value) return null;

    // 1. Ambil posisi kamera
    const camPos = EngineBridge.getCameraPosition();
    const rawTransform = { 
        x: Math.round(camPos.x), 
        y: Math.round(camPos.y) 
    };

    // 2. Tentukan Parent & Layer
    let parentId = null;
    let layerId = null;

    if (contextNode) {
        if (contextNode.type === 'layer') {
          layerId = contextNode._id;
          parentId = null;
        } else {
          layerId = contextNode.layerId;
          parentId = contextNode._id;
        }
    } else {
        layerId = activeScene.value.layers[0]?._id;
    }

    // 3. Siapkan DATA MENTAH (Plain Object)
    // Jangan panggil createComponent/createTransform disini. 
    // Biarkan schema.js yang melakukan validasi dan pemberian nilai default.
    const components = {};

    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
      components.Transform = rawTransform;
    } 
    else if (type === 'shape') {
      components.ShapeRenderer = { type: 'rectangle', color: '#FF0000' };
      components.Transform = rawTransform;
    } 
    else if (type === 'text') {
      components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' };
      components.Transform = { ...rawTransform, width: 107, height: 23 };
    } 
    else if (type === 'tilemap') {
      const defaultW = 40; 
      const defaultH = 30;
      components.Tilemap = { 
         tileWidth: 16, tileHeight: 16, width: defaultW, height: defaultH,
         tilesetId: null, opacity: 1, isSolid: false,
         data: new Array(defaultW * defaultH).fill(0)
      };
      components.Transform = rawTransform;
    } 
    // --- UI TYPES ---
    else if (type === 'ui_empty') {
      components.UITransform = { 
          width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 
      };
    } 
    else if (type === 'ui_panel') {
      components.UITransform = { 
          width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 
      };
      components.ShapeRenderer = { type: 'rectangle', color: '#2d2d2d', opacity: 0.8 };
    } 
    else if (type === 'ui_button') {
      components.UITransform = { 
          width: 140, height: 40, anchorX: 0.5, anchorY: 0.5 
      };
      components.ShapeRenderer = { type: 'rectangle', color: '#3498db' };
      components.TextRenderer = { value: 'Button', fontSize: 16, align: 'center', color: '#FFFFFF' };
      components.ScriptController = { data: [] }; 
    } 
    else if (type === 'ui_text') {
      components.UITransform = { 
          width: 107, height: 23, anchorX: 0.5, anchorY: 0.5 
      };
      components.TextRenderer = { value: 'New Text', fontSize: 24, align: 'left', color: '#FFFFFF' };
    } 
    else if (type === 'ui_image') {
      components.UITransform = { 
          width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 
      };
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    }

    // 4. Penamaan Otomatis
    const existingEntities = activeScene.value.entities;
    const displayType = type.startsWith('ui_') ? type.replace('ui_', '') : type;
    const namePrefix = displayType.charAt(0).toUpperCase() + displayType.slice(1);
    const regex = new RegExp(`^${type}_(\\d+)$`);

    let maxIndex = 0;
    existingEntities.forEach(ent => {
        const match = ent.scriptId ? ent.scriptId.match(regex) : null;
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIndex) maxIndex = num;
        }
    });

    const nextIndex = maxIndex + 1;
    const scriptId = `${type}_${nextIndex}`;
    const entityType = type.startsWith('ui_') ? 'ui' : 'entity';

    // 5. Buat Entity via Schema (Disinilah komponen dibuat dengan benar)
    const newEntity = createEntitySchema({
      _id: `${GenerateUUID()}`, 
      scriptId: scriptId, 
      name: `${namePrefix} ${nextIndex}`, 
      type: type === 'group' ? 'group' : entityType,
      layerId,
      parentId,
      components // Kirim raw object, schema akan mengubahnya jadi valid component
    });

    // 6. Push ke State
    activeScene.value.entities.push(newEntity);
    selectedEntityIds.value = [newEntity._id];

    // 7. Kirim ke Engine
    EngineBridge.createEntity(newEntity);

    return newEntity; 
  };

  // ... (fungsi lain tetap sama: updateEntityName, dll) ...
  const updateEntityName = (entityId, newName) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) entity.name = newName;
    EngineBridge.updateEntityName(entityId, newName);
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
    EngineBridge.deleteEntity(entityId);
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
    EngineBridge.moveEntity({ id: draggedId, parentId: targetContext.newParentId, layerId: targetContext.newLayerId });
  };

  const updateComponentProp = (entityId, componentName, path, value) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (!entity || !entity.components[componentName]) return;
    const comp = entity.components[componentName];
    
    if ((componentName === 'Transform' || componentName === 'UITransform') && comp.isRatioLocked) {
        const numValue = Number(value);
        if (!isNaN(numValue) && comp.width > 0 && comp.height > 0) {
            const ratio = comp.width / comp.height;
            if (path === 'width') {
                const newHeight = round(numValue / ratio);
                comp.height = newHeight; 
                EngineBridge.updateComponentProp({ entityId, componentName, path: 'height', value: newHeight }); 
            } else if (path === 'height') {
                const newWidth = round(numValue * ratio);
                comp.width = newWidth; 
                EngineBridge.updateComponentProp({ entityId, componentName, path: 'width', value: newWidth }); 
            }
        }
    }

    const keys = path.split('.');
    let target = comp;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;
    EngineBridge.updateComponentProp({ entityId, componentName, path, value });
    return { entityId, componentName, path, value };
  };

  const updateEntityProp = (entityId, propName, value) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) {
      entity[propName] = value;
      EngineBridge.updateEntityProp({ id: entityId, prop: propName, value });
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

  const addComponent = (entityId, componentName) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (!entity) return;

    if (entity.components && entity.components[componentName]) return;

    const newComponentData = createComponent(componentName);
    if (!entity.components) entity.components = {};
    entity.components[componentName] = newComponentData;
    
    EngineBridge.addComponent({ entityId, componentName, data: newComponentData });
    return { entityId, componentName, data: newComponentData };
  };

  return { 
    createEntity, updateEntityName, updateEntityScriptId, deleteEntity, moveEntity,
    updateComponentProp, updateEntityProp, syncTilemapDataFromEngine, addComponent
  };
}