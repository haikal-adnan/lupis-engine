// Entity lifecycle, hierarchies, reparenting, and component management.

import { useSceneStore } from '@scenes/useSceneStore.js';
import { componentSchema } from '@scenes/schemas/componentSchema.js';
import { entitySchema } from '@scenes/schemas/entitySchema.js';
import { GenerateUUID, sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate, computeGlobalTransform, worldToLocalTransform } from '@utils/utils.js';
import { engineBridge } from "@engines/engines.js";
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { useSceneHistory } from '@historys/historys.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

const round = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

// Validates whether an entity or parent is restricted by a locked prefab instance
const checkPrefabRestriction = (entities, entityId, targetParentId = null) => {
    if (!entities) return null;

    const isDescendantOfPrefab = (id) => {
        let current = entities.find(e => e.id === id);
        while (current && current.parentId) {
            current = entities.find(e => e.id === current.parentId);
            if (current && current.prefabId) return true;
        }
        return false;
    };

    if (entityId && isDescendantOfPrefab(entityId)) {
        return 'Cannot modify, move, or delete entities inside a Prefab instance. Please unpack first.';
    }

    if (targetParentId) {
        const targetParent = entities.find(e => e.id === targetParentId);
        if ((targetParent && targetParent.prefabId) || isDescendantOfPrefab(targetParentId)) {
            return 'Cannot add new entities into a Prefab instance hierarchy. Please unpack first.';
        }
    }

    return null; 
};

export function useEntityActions() {
  const store = useSceneStore();

  // Filters entity IDs to exclude descendants of selected ancestors
  const filterTopLevelEntityIds = (entityIds) => {
    if (!Array.isArray(entityIds) || entityIds.length === 0) return [];
    const entities = store.activeScene?.entities || [];
    const idSet = new Set(entityIds);
    const entityMap = new Map(entities.map(e => [e.id, e]));

    return entityIds.filter(id => {
      let current = entityMap.get(id);
      if (!current) return true;
      while (current.parentId) {
        if (idSet.has(current.parentId)) {
          return false;
        }
        current = entityMap.get(current.parentId);
        if (!current) break;
      }
      return true;
    });
  };

  // Collects root entity and all its recursive descendants
  const getHierarchyData = (entityId) => {
    const entities = store.activeScene?.entities;
    if (!entities) return null;

    const root = entities.find(e => e.id === entityId);
    if (!root) return null;

    const descendants = [];
    const loopChildren = (parentId) => {
      const children = entities.filter(e => e.parentId === parentId);
      children.forEach(child => {
        descendants.push(child);
        loopChildren(child.id);
      });
    };

    loopChildren(root.id);
    return {
      root: JSON.parse(JSON.stringify(root)),
      descendants: JSON.parse(JSON.stringify(descendants))
    };
  };

  // Clones an entity hierarchy with new IDs and remapped parent references
  const createClones = (root, descendants, targetLayerId, targetParentId, nextOrderIndex) => {
     const idMap = {};
     const clonedRoot = JSON.parse(JSON.stringify(root));
     const newRootId = GenerateUUID();
     idMap[clonedRoot.id] = newRootId;

     clonedRoot.id = newRootId;
     clonedRoot.layerId = targetLayerId;
     clonedRoot.parentId = targetParentId;
     clonedRoot.orderIndex = nextOrderIndex;

     const baseScriptId = clonedRoot.scriptId || 'entity';
     const siblings = (store.activeScene?.entities || []).filter(e => 
         e.parentId === targetParentId && e.layerId === targetLayerId
     );
     clonedRoot.scriptId = getValidUniqueScriptId(`${baseScriptId}_copy`, siblings, e => e.scriptId);
     delete clonedRoot.name;

     const clonedDescendants = descendants.map(child => {
        const clonedChild = JSON.parse(JSON.stringify(child));
        const newChildId = GenerateUUID();
        idMap[clonedChild.id] = newChildId;

        clonedChild.id = newChildId;
        clonedChild.layerId = targetLayerId;
        
        const childBase = clonedChild.scriptId || 'child';
        clonedChild.scriptId = `${childBase}_${GenerateUUID().slice(0, 4)}`;
        delete clonedChild.name;

        return clonedChild;
     });

     clonedDescendants.forEach(child => {
        if (idMap[child.parentId]) {
            child.parentId = idMap[child.parentId];
        }
     });

     return [clonedRoot, ...clonedDescendants];
  };

  // Instantiates a new entity with default components and positions it in the scene
  const createEntity = (type, contextNodeOrLayerId, overrides = {}) => {
    const scene = store.activeScene;
    if (!scene) return false;

    const { showPop } = usePopAlert();

    let posX = 0;
    let posY = 0;

    if (overrides && overrides.x !== undefined && overrides.y !== undefined) {
        posX = Number(overrides.x);
        posY = Number(overrides.y);
    } else {
        const camPos = engineBridge.getCameraPosition ? engineBridge.getCameraPosition() : { x: 0, y: 0 };
        posX = Math.round(camPos.x);
        posY = Math.round(camPos.y);
    }
    const rawTransform = { x: posX, y: posY };

    let parentId = null;
    let layerId = null;
    
    const defaultWorldLayer = scene.layersWorld?.[0]?.id;
    const defaultUILayer = scene.layersUI?.[0]?.id;

    if (contextNodeOrLayerId) {
        if (typeof contextNodeOrLayerId === 'string') {
            layerId = contextNodeOrLayerId;
            parentId = null;
        } else if (contextNodeOrLayerId.type === 'layer') {
            layerId = contextNodeOrLayerId.id;
            parentId = null;
        } else {
            layerId = contextNodeOrLayerId.layerId;
            parentId = contextNodeOrLayerId.id;
        }
    } else {
        if (type.startsWith('ui_')) {
            layerId = defaultUILayer;
        } else {
            layerId = defaultWorldLayer;
        }
    }

    if (parentId) {
        const restrictionMsg = checkPrefabRestriction(scene.entities, null, parentId);
        if (restrictionMsg) {
            showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
            return false;
        }
    }

    const siblings = scene.entities.filter(e => 
        e.parentId === parentId && e.layerId === layerId
    );

    const maxOrder = siblings.reduce((max, node) => 
        (node.orderIndex > max ? node.orderIndex : max), -1
    );

    const nextOrderIndex = maxOrder + 1;
    const components = {};

    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
      components.Transform = { ...rawTransform };
    } 
    else if (type === 'shape') {
      components.ShapeRenderer = componentSchema.create('ShapeRenderer');
      components.Transform = { ...rawTransform };
    } 
    else if (type === 'text') {
      components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' };
      components.Transform = { ...rawTransform, width: 107, height: 23 };
    } 
    else if (type === 'tilemap') {
      components.Tilemap = componentSchema.create('Tilemap');
      components.Transform = { ...rawTransform };
    }
    else if (type === 'audio') {
      components.Transform = { ...rawTransform, width: 50, height: 50 };
      components.Audio = { currentClip: null, clips: [] };
    }
    else if (type === 'empty') {
      components.Transform = { ...rawTransform, width: 0, height: 0 };
    }
    else if (type === 'ui_empty') {
      components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
    } 
    else if (type === 'ui_shape') {
      components.UITransform = { ...rawTransform, width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 };
      components.ShapeRenderer = componentSchema.create('ShapeRenderer');
    } 
    else if (type === 'ui_text') {
      components.UITransform = { ...rawTransform, width: 107, height: 23, anchorX: 0.5, anchorY: 0.5 };
      components.TextRenderer = { value: 'New Text', fontSize: 24, align: 'left', color: '#FFFFFF' };
    } 
    else if (type === 'ui_image') {
      components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    }

    const existingEntities = scene.entities;
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

    const newEntity = entitySchema({
      id: `${GenerateUUID()}`, 
      scriptId: scriptId, 
      name: `${namePrefix} ${nextIndex}`, 
      type: entityType, 
      layerId,
      parentId,
      zIndex: 0, 
      orderIndex: nextOrderIndex,
      components,
      x: posX,
      y: posY
    });

    scene.entities.push(newEntity);
    store.selectedEntityIds = [newEntity.id];

    if (engineBridge.createEntity) {
        engineBridge.createEntity(newEntity);
    }
    engineBridge.selectEntity([newEntity.id]);

    const { recordEntityCreate } = useSceneHistory();
    recordEntityCreate(newEntity);

    return newEntity; 
  };

  const restoreEntity = (entityData) => {
    if (!store.activeScene) return;
    store.activeScene.entities.push(entityData);
  };

  // Clones entities and subtrees, updating selections and engine state
  const duplicateEntity = (entityIds) => {
    if (!store.activeScene) return false;
    const { showPop } = usePopAlert();

    const targetIds = entityIds !== undefined ? entityIds : store.selectedEntityIds;
    const rawIds = Array.isArray(targetIds) ? targetIds : (targetIds ? [targetIds] : []);
    if (rawIds.length === 0) return false;

    for (const id of rawIds) {
        const restrictionMsg = checkPrefabRestriction(store.activeScene.entities, id);
        if (restrictionMsg) {
            showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
            return false;
        }
    }

    const idsToDuplicate = filterTopLevelEntityIds(rawIds);

    const allNewEntities = [];
    const newRootIds = [];

    idsToDuplicate.forEach(id => {
        const data = getHierarchyData(id);
        if (!data) return;

        const targetParentId = data.root.parentId;
        const targetLayerId = data.root.layerId;

        const existingSiblings = store.activeScene.entities.filter(e =>
            e.parentId === targetParentId && e.layerId === targetLayerId
        );
        const batchSiblings = allNewEntities.filter(e =>
            e.parentId === targetParentId && e.layerId === targetLayerId
        );
        const maxOrder = [...existingSiblings, ...batchSiblings].reduce((max, node) =>
            (node.orderIndex > max ? node.orderIndex : max), -1
        );
        const nextOrderIndex = maxOrder + 1;

        const clones = createClones(data.root, data.descendants, targetLayerId, targetParentId, nextOrderIndex);
        allNewEntities.push(...clones);
        if (clones.length > 0) newRootIds.push(clones[0].id);
    });

    store.activeScene.entities.push(...allNewEntities);
    engineBridge.createEntity(allNewEntities); 

    const allNewIds = allNewEntities.map(e => e.id);
    store.selectedEntityIds = allNewIds;
    engineBridge.selectEntity(allNewIds);

    const { recordEntityCreate } = useSceneHistory();
    allNewEntities.forEach(ent => recordEntityCreate(ent));

    return allNewIds;
  };

  // Packages selected entities and hierarchies for clipboard copy
  const getEntityDataForClipboard = (entityIds) => {
      const rawIds = Array.isArray(entityIds) ? entityIds : [entityIds];
      const ids = filterTopLevelEntityIds(rawIds);
      return ids.map(id => getHierarchyData(id)).filter(item => item !== null);
  };

  // Clones and inserts clipboard entity hierarchies into target layer or parent
  const pasteEntity = (clipboardDataArray, targetContext = {}) => {
      if (!store.activeScene || !clipboardDataArray) return false;
      const { showPop } = usePopAlert();

      if (targetContext.parentId !== undefined) {
          const restrictionMsg = checkPrefabRestriction(store.activeScene.entities, null, targetContext.parentId);
          if (restrictionMsg) {
              showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
              return false;
          }
      }

      const dataItems = Array.isArray(clipboardDataArray) ? clipboardDataArray : [clipboardDataArray];
      const allNewClones = [];
      const newRootIds = [];

      dataItems.forEach(item => {
          const { root, descendants } = item;
          let targetLayerId = root.layerId;
          let targetParentId = root.parentId;

          if (targetContext.parentId !== undefined) targetParentId = targetContext.parentId;
          if (targetContext.layerId !== undefined) targetLayerId = targetContext.layerId;

          const existingSiblings = store.activeScene.entities.filter(e =>
              e.parentId === targetParentId && e.layerId === targetLayerId
          );
          const batchSiblings = allNewClones.filter(e =>
              e.parentId === targetParentId && e.layerId === targetLayerId
          );
          const maxOrder = [...existingSiblings, ...batchSiblings].reduce((max, node) =>
              (node.orderIndex > max ? node.orderIndex : max), -1
          );
          const nextOrderIndex = maxOrder + 1;

          const clones = createClones(root, descendants, targetLayerId, targetParentId, nextOrderIndex);
          allNewClones.push(...clones);
          if (clones.length > 0) newRootIds.push(clones[0].id);
      });
      
      store.activeScene.entities.push(...allNewClones);
      engineBridge.createEntity(allNewClones);

      const allNewIds = allNewClones.map(e => e.id);
      store.selectedEntityIds = allNewIds;
      engineBridge.selectEntity(allNewIds);

      const { recordEntityCreate } = useSceneHistory();
      allNewClones.forEach(ent => recordEntityCreate(ent));

      return allNewIds;
  };

  const updateEntityScriptId = (entityId, newScriptId) => {
    if (!store.activeScene || !newScriptId || !newScriptId.trim()) return false;

    const sanitizedId = sanitizeScriptId(newScriptId);
    if (!sanitizedId) return false;

    const isDuplicate = isScriptIdDuplicate(sanitizedId, store.activeScene.entities, e => e.scriptId, entityId);
    if (isDuplicate) return false;

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (entity) {
      const oldVal = entity.scriptId;
      entity.scriptId = sanitizedId;
      delete entity.name;

      const { recordPropChange } = useSceneHistory();
      recordPropChange(entityId, 'scriptId', oldVal, sanitizedId);

      if (engineBridge.updateEntityScriptId) {
        engineBridge.updateEntityScriptId(entityId, sanitizedId);
      }
      if (engineBridge.updateEntityProp) {
        engineBridge.updateEntityProp({ id: entityId, prop: 'scriptId', value: sanitizedId });
      }

      return { id: entityId, prop: 'scriptId', value: sanitizedId };
    }
    return false;
  };

  // Deletes an entity and cascades deletion to all descendants
  const deleteEntity = (entityId, recordHistory = true) => {
    if (!store.activeScene) return false;
    const targetEntity = store.activeScene.entities.find(e => e.id === entityId);
    if (!targetEntity) return false;

    const { showPop } = usePopAlert();

    const restrictionMsg = checkPrefabRestriction(store.activeScene.entities, entityId);
    if (restrictionMsg) {
        showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
        return false;
    }

    const getDescendants = (parentId) => {
      const children = store.activeScene.entities.filter(e => e.parentId === parentId);
      let ids = children.map(c => c.id);
      children.forEach(child => {
        ids = [...ids, ...getDescendants(child.id)];
      });
      return ids;
    };

    const idsToDelete = [entityId, ...getDescendants(entityId)];
    const deletedEntities = store.activeScene.entities.filter(e => idsToDelete.includes(e.id));
    
    if (recordHistory && deletedEntities.length > 0) {
      const { recordEntityDelete } = useSceneHistory();
      recordEntityDelete(deletedEntities);
    }

    store.activeScene.entities = store.activeScene.entities.filter(e => !idsToDelete.includes(e.id));
    store.selectedEntityIds = store.selectedEntityIds.filter(id => !idsToDelete.includes(id));
    
    if (store.selectedEntityIds.length === 0) {
      engineBridge.clearSelection();
    } else {
      engineBridge.selectEntity(store.selectedEntityIds);
    }

    idsToDelete.forEach(id => engineBridge.deleteEntity(id));

    return true;
  };

  const applyEntityOrderState = (orderStates) => {
    if (!store.activeScene || !Array.isArray(orderStates)) return;

    orderStates.forEach(({ id, orderIndex }) => {
      const entity = store.activeScene.entities.find(e => e.id === id);
      if (entity) {
        entity.orderIndex = orderIndex;
      }
    });
  };

  // Moves or reparents an entity, recalculating local transform to preserve world placement
  const moveEntity = (draggedId, targetContext, recordHistory = true) => {
    if (!store.activeScene) return false;

    const { newParentId, newLayerId, insertionType, referenceId } = targetContext;

    const restrictionMsg = checkPrefabRestriction(store.activeScene.entities, draggedId, newParentId);
    if (restrictionMsg) {
      const { showPop } = usePopAlert();
      showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
      return false;
    }

    const entities = store.activeScene.entities;
    const entity = entities.find(e => String(e.id) === String(draggedId));
    if (!entity) return false;

    const oldParentId = entity.parentId || null;
    const oldLayerId = entity.layerId;
    const oldContext = {
      newParentId: oldParentId,
      newLayerId: oldLayerId,
      insertionType: 'append',
      referenceId: null
    };

    const affectedEntitiesBefore = entities.filter(e => 
      ((e.parentId || null) === oldParentId && e.layerId === oldLayerId) ||
      ((e.parentId || null) === (newParentId || null) && e.layerId === newLayerId)
    );
    const oldSiblingOrders = affectedEntitiesBefore.map(e => ({ id: e.id, orderIndex: e.orderIndex ?? 0 }));

    const resolvedParentId = (newParentId !== undefined && newParentId !== null) ? newParentId : null;

    const compName = entity.components?.Transform ? 'Transform' : (entity.components?.UITransform ? 'UITransform' : null);
    const oldTransform = (compName && entity.components[compName])
      ? JSON.parse(JSON.stringify(entity.components[compName]))
      : null;
    let newTransform = null;

    if (oldParentId !== resolvedParentId && compName && entity.components[compName]) {
      const uiSettings = store.activeScene?.settings?.ui || { width: 1920, height: 1080 };
      const getEntityById = (id) => entities.find(e => String(e.id) === String(id));
      const currentGlobal = computeGlobalTransform(entity, getEntityById, uiSettings);
      if (currentGlobal) {
        let newParentGlobal = null;
        if (resolvedParentId) {
          const newParent = getEntityById(resolvedParentId);
          if (newParent) {
            newParentGlobal = computeGlobalTransform(newParent, getEntityById, uiSettings);
          }
        }

        const newLocal = worldToLocalTransform(currentGlobal, newParentGlobal, entity, uiSettings);
        const comp = entity.components[compName];
        comp.x = round(newLocal.x);
        comp.y = round(newLocal.y);

        if (comp.rotation !== undefined && newLocal.rotation !== undefined) {
          comp.rotation = round(newLocal.rotation);
        }
        if (comp.scaleX !== undefined && newLocal.scaleX !== undefined) {
          comp.scaleX = round(newLocal.scaleX);
        }
        if (comp.scaleY !== undefined && newLocal.scaleY !== undefined) {
          comp.scaleY = round(newLocal.scaleY);
        }

        entity.components[compName] = JSON.parse(JSON.stringify(comp));
        entity.components = { ...entity.components };
        newTransform = JSON.parse(JSON.stringify(comp));

        if (engineBridge && engineBridge.updateComponentProp) {
          engineBridge.updateComponentProp({ entityId: entity.id, componentName: compName, path: 'x', value: comp.x });
          engineBridge.updateComponentProp({ entityId: entity.id, componentName: compName, path: 'y', value: comp.y });
          if (comp.rotation !== undefined) {
            engineBridge.updateComponentProp({ entityId: entity.id, componentName: compName, path: 'rotation', value: comp.rotation });
          }
        }
      }
    }

    entity.parentId = resolvedParentId;
    if (newLayerId) {
      entity.layerId = newLayerId;
    }

    let targetSiblings = entities.filter(e => 
      (e.parentId || null) === resolvedParentId && 
      e.layerId === entity.layerId && 
      String(e.id) !== String(draggedId)
    );

    targetSiblings.sort((a, b) => {
      const zA = a.zIndex ?? 0;
      const zB = b.zIndex ?? 0;
      if (zA !== zB) return zA - zB;
      const oA = a.orderIndex ?? 0;
      const oB = b.orderIndex ?? 0;
      if (oA !== oB) return oA - oB;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    if (insertionType === 'inside' || insertionType === 'append' || !referenceId) {
      targetSiblings.push(entity);
    } else {
      const refIndex = targetSiblings.findIndex(e => String(e.id) === String(referenceId));
      if (refIndex !== -1) {
        if (insertionType === 'before') {
          targetSiblings.splice(refIndex, 0, entity);
        } else {
          targetSiblings.splice(refIndex + 1, 0, entity);
        }
      } else {
        targetSiblings.push(entity);
      }
    }

    targetSiblings.forEach((sibling, index) => {
      sibling.orderIndex = index;
      if (engineBridge && engineBridge.updateEntityProp) {
        engineBridge.updateEntityProp({ id: sibling.id, prop: 'orderIndex', value: index });
      }
    });

    if (oldParentId !== resolvedParentId || oldLayerId !== entity.layerId) {
      const oldSiblings = entities.filter(e => 
        (e.parentId || null) === oldParentId && 
        e.layerId === oldLayerId && 
        String(e.id) !== String(draggedId)
      );
      oldSiblings.sort((a, b) => {
        const zA = a.zIndex ?? 0;
        const zB = b.zIndex ?? 0;
        if (zA !== zB) return zA - zB;
        const oA = a.orderIndex ?? 0;
        const oB = b.orderIndex ?? 0;
        if (oA !== oB) return oA - oB;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
      oldSiblings.forEach((sibling, index) => {
        sibling.orderIndex = index;
        if (engineBridge && engineBridge.updateEntityProp) {
          engineBridge.updateEntityProp({ id: sibling.id, prop: 'orderIndex', value: index });
        }
      });
    }

    if (engineBridge && engineBridge.moveEntity) {
      engineBridge.moveEntity({
        draggedId,
        newParentId: resolvedParentId,
        newLayerId: entity.layerId,
        insertionType,
        referenceId
      });
    }

    const affectedEntitiesAfter = entities.filter(e => 
      ((e.parentId || null) === oldParentId && e.layerId === oldLayerId) ||
      ((e.parentId || null) === resolvedParentId && e.layerId === entity.layerId)
    );
    const newSiblingOrders = affectedEntitiesAfter.map(e => ({ id: e.id, orderIndex: e.orderIndex ?? 0 }));

    if (recordHistory) {
      try {
        const { recordEntityMove } = useSceneHistory();
        if (recordEntityMove) {
          recordEntityMove(draggedId, {
            oldParentId,
            newParentId: resolvedParentId,
            oldLayerId,
            newLayerId: entity.layerId,
            oldContext,
            newContext: targetContext,
            oldSiblingOrders,
            newSiblingOrders,
            compName,
            oldTransform,
            newTransform
          });
        }
      } catch (err) {
        // Ignore if history module is uninitialized in test
      }
    }

    return true;
  };

  // Updates component property, maintaining aspect ratio if locked
  const updateComponentProp = (entityId, componentName, path, value) => {
    if (!store.activeScene) return false;

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (!entity || !entity.components || !entity.components[componentName]) return false;
    
    const comp = entity.components[componentName];
    
    if ((componentName === 'Transform' || componentName === 'UITransform') && comp.isRatioLocked) {
        const numValue = Number(value);
        if (!isNaN(numValue) && comp.width > 0 && comp.height > 0) {
            const ratio = comp.width / comp.height;
            if (path === 'width') {
                const newHeight = round(numValue / ratio);
                comp.height = newHeight; 
                engineBridge.updateComponentProp?.({ entityId, componentName, path: 'height', value: newHeight }); 
            } else if (path === 'height') {
                const newWidth = round(numValue * ratio);
                comp.width = newWidth; 
                engineBridge.updateComponentProp?.({ entityId, componentName, path: 'width', value: newWidth }); 
            }
        }
    }
    
    const keys = path.split('.');
    let target = comp;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;

    // Trigger Vue/Pinia reactivity via reference replacement
    entity.components[componentName] = JSON.parse(JSON.stringify(comp));
    entity.components = { ...entity.components };

    return { entityId, componentName, path, value };
  };

  const updateEntityProp = (entityId, propName, value, recordHistory = true) => {
    if (!store.activeScene) return false;

    if (propName === 'scriptId' || propName === 'name') {
      return updateEntityScriptId(entityId, value);
    }

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (entity) {
      if (entity[propName] === value) return false; 
      const oldValue = entity[propName];
      entity[propName] = value;

      if (propName === 'tags') {
        entity.tag = (Array.isArray(value) && value.length > 0) ? value[0] : 'untagged';
      } else if (propName === 'tag') {
        if (!Array.isArray(entity.tags)) entity.tags = [];
        if (value && String(value).toLowerCase() !== 'untagged') {
          if (!entity.tags.some(t => t.toLowerCase() === String(value).toLowerCase())) {
            entity.tags = [value];
          }
        } else {
          entity.tags = [];
        }
      }

      if (recordHistory) {
        const { recordPropChange } = useSceneHistory();
        recordPropChange(entityId, propName, oldValue, value);
      }

      return { id: entityId, prop: propName, value };
    }
    return false;
  };

  const syncTilemapDataFromEngine = (entityId, newData) => {
    if (!store.activeScene) return false;

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (entity?.components?.Tilemap) {
      entity.components.Tilemap.data = newData;
      return true;
    }
    return false;
  };

  // Attaches a component to an entity and records history
  const addComponent = (entityId, componentName, initialData = null, recordHistory = true) => {
    if (!store.activeScene) return false;
    const { showPop } = usePopAlert();

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (!entity) return false;
    
    if (entity.prefabId) {
        showPop({
            title: 'Prefab Restriction',
            message: 'Cannot add components to a Prefab instance. Please Unpack Prefab first.',
            type: 'warning'
        });
        return false;
    }
    
    if (entity.components && entity.components[componentName]) return false;
    
    let newComponentData = initialData || componentSchema.create(componentName);

    if (componentName === 'SpriteAnimator' && !initialData) {
      const sprite = entity.components?.SpriteRenderer;
      if (sprite && sprite.assetId) {
        const clipId = GenerateUUID();
        const sourceId = 's_0';
        const sourceRect = {
          x: Number(sprite.sourceX ?? 0),
          y: Number(sprite.sourceY ?? 0),
          w: Number(sprite.sourceWidth ?? 100),
          h: Number(sprite.sourceHeight ?? 100)
        };
        const initialClip = {
          id: clipId,
          name: 'New Clip',
          type: 'clip',
          scriptId: `clip_${GenerateUUID().slice(0, 8)}`,
          assetId: sprite.assetId,
          parentId: null,
          fps: 12,
          isLooping: true,
          frames: [sourceId],
          sources: {
            [sourceId]: { ...sourceRect }
          },
          baseSize: { w: sourceRect.w, h: sourceRect.h },
          pivot: { x: 0.5, y: 1 },
          frameIndex: 0,
          filterMode: sprite.filterMode || 'pixelated',
          useSDF: Boolean(sprite.useSDF ?? false)
        };
        newComponentData = {
          ...newComponentData,
          currentClip: clipId,
          clips: [initialClip]
        };
      }
    }

    if (!entity.components) entity.components = {};
    
    entity.components[componentName] = newComponentData;
    entity.components = { ...entity.components };

    if (recordHistory) {
      const { recordAddComponent } = useSceneHistory();
      recordAddComponent(entityId, componentName);
    }

    return { entityId, componentName, data: newComponentData };
  };

  // Detaches a component, checking dependencies and syncing engine bridge
  const removeComponent = async (entityId, componentName, recordHistory = true) => {
    if (!store.activeScene) return false;
    
    const { showPop } = usePopAlert();
    const { confirm } = useConfirm();

    const entity = store.activeScene.entities.find(e => e.id === entityId);
    if (!entity || !entity.components[componentName]) {
        showPop({ title: 'Error', message: 'Component not found.', type: 'error' });
        return false;
    }
    
    if (entity.prefabId) {
        showPop({
            title: 'Prefab Restriction',
            message: 'Cannot remove components from a Prefab instance. Please Unpack Prefab first.',
            type: 'warning'
        });
        return false;
    }

    if (componentName === 'SpriteRenderer' && (entity.components?.SpriteAnimator || entity.components?.Animator)) {
        showPop({
            title: 'Restricted',
            message: 'Image Renderer cannot be removed while Animator component is present.',
            type: 'warning'
        });
        return false;
    }
    
    if (recordHistory) {
      const isConfirmed = await confirm({
        title: 'Remove Component',
        message: `Are you sure you want to remove "${componentName}"?`,
        confirmText: 'Yes, Remove',
        cancelText: 'Cancel',
        type: 'warning'
      });
      if (!isConfirmed) return false;
    }
    
    try {
        const savedData = JSON.parse(JSON.stringify(entity.components[componentName]));
        delete entity.components[componentName];
        entity.components = { ...entity.components };

        if (componentName === 'SpriteAnimator') {
          const workspaceStore = useWorkspaceStore();
          const openAnimTab = workspaceStore.tabs?.find(t => t.type === 'animator' && t.id === entityId);
          if (openAnimTab) {
            workspaceStore.closeTab(openAnimTab.id);
          }
        }

        engineBridge.removeComponent?.({ entityId, componentName });

        if (recordHistory) {
          const { recordRemoveComponent } = useSceneHistory();
          recordRemoveComponent(entityId, componentName, savedData);
          showPop({ title: 'Success', message: `Component removed.`, type: 'success' });
        }

        return { entityId, componentName };
    } catch (error) {
        showPop({ title: 'Failed', message: 'Could not remove component.', type: 'error' });
        return false;
    }
  };

  return {
    filterTopLevelEntityIds,
    getHierarchyData,
    createClones,
    createEntity,
    restoreEntity,
    duplicateEntity,
    getEntityDataForClipboard,
    pasteEntity,
    updateEntityScriptId,
    deleteEntity,
    applyEntityOrderState,
    moveEntity,
    updateComponentProp,
    updateEntityProp,
    syncTilemapDataFromEngine,
    addComponent,
    removeComponent
  };
}
