import { useHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { engineBridge } from '@engines/engines.js';
import { usePrefabStore } from '@prefabs/prefabs.js';

let activeTransaction = null;
let clearTransactionTimer = null;

if (typeof window !== 'undefined' && !window.__HISTORY_LISTENERS_SET__) {
  window.__HISTORY_LISTENERS_SET__ = true;

  const startTransaction = () => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    if (!activeTransaction) {
      activeTransaction = { isContinuous: true, initialValues: {} };
    }
  };

  const endTransactionWithDelay = (delay = 100) => {
    if (clearTransactionTimer) clearTimeout(clearTransactionTimer);
    clearTransactionTimer = setTimeout(() => { activeTransaction = null; }, delay);
  };

  window.addEventListener('mousedown', (e) => {
    const isScrub = e.target.closest('.cursor-ew-resize') || e.target.classList?.contains('cursor-ew-resize');
    const isColor = e.target.type === 'color' || e.target.closest('input[type="color"]') || e.target.closest('.relative')?.querySelector('input[type="color"]');
    if (isScrub || isColor) startTransaction();
  }, true);

  window.addEventListener('input', (e) => {
    if (e.target.type === 'color') {
      startTransaction();
      endTransactionWithDelay(300);
    }
  }, true);

  window.addEventListener('mouseup', () => {
    if (activeTransaction) endTransactionWithDelay(50);
  }, true);

  window.addEventListener('change', (e) => {
    if (e.target.type === 'color') endTransactionWithDelay(0);
  }, true);
}

export function useSceneHistory() {
  const { record, undo, redo, logHistory } = useHistory();
  const sceneStore = useSceneStore();
  const prefabStore = usePrefabStore();

  const deepClone = (data) => (data ? JSON.parse(JSON.stringify(data)) : null);

  const applySnapshot = (targetSceneId, id, snapshot) => {
    const scene = sceneStore.getSceneById(targetSceneId);
    if (!scene) return;

    const entIndex = scene.entities.findIndex((e) => String(e.id) === String(id));
    if (entIndex === -1) return;

    const currentEnt = scene.entities[entIndex];
    const updatedEntity = {
      ...currentEnt,
      visible: snapshot.visible !== undefined ? snapshot.visible : currentEnt.visible,
      active: snapshot.active !== undefined ? snapshot.active : currentEnt.active,
      components: deepClone(snapshot.components),
      _editor: deepClone(snapshot._editor || {})
    };

    scene.entities.splice(entIndex, 1, updatedEntity);

    if (sceneStore.activeSceneId === targetSceneId) {
      engineBridge.updateEntity(updatedEntity);
    }
  };

  const recordComponentChange = (entityId, componentName, propPath, oldValue, newValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    let transactionKey = null;
    let originalOldValue = oldValue;

    if (activeTransaction && activeTransaction.isContinuous) {
      transactionKey = `trans_${targetSceneId}_${entityId}_${componentName}_${propPath}`;
      if (!(transactionKey in activeTransaction.initialValues)) {
        activeTransaction.initialValues[transactionKey] = oldValue;
      }
      originalOldValue = activeTransaction.initialValues[transactionKey];
    }

    record({
      type: 'CHANGE_COMPONENT_PROP',
      transactionKey,
      description: `Change ${componentName}.${propPath} on ${entityId}`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;
        sceneStore.updateComponentProp(entityId, componentName, propPath, originalOldValue);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({ entityId, componentName, path: propPath, value: originalOldValue });
        }
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;
        sceneStore.updateComponentProp(entityId, componentName, propPath, newValue);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateComponentProp({ entityId, componentName, path: propPath, value: newValue });
        }
      }
    });
  };

  const recordAddComponent = (entityId, componentName) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    record({
      type: 'ADD_COMPONENT',
      description: `Add ${componentName} to ${entityId}`,
      undo: () => sceneStore.removeComponent(entityId, componentName, false),
      redo: () => sceneStore.addComponent(entityId, componentName, null, false)
    });
  };

  const recordRemoveComponent = (entityId, componentName, savedComponentData) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const clonedData = deepClone(savedComponentData);
    record({
      type: 'REMOVE_COMPONENT',
      description: `Remove ${componentName} from ${entityId}`,
      undo: () => sceneStore.addComponent(entityId, componentName, clonedData, false),
      redo: () => sceneStore.removeComponent(entityId, componentName, false)
    });
  };

  const recordTransformChange = (records) => {
    if (!records || records.length === 0) return;
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    record({
      type: 'TRANSFORM_ENTITY',
      description: `Transform ${records.length} entity`,
      undo: () => records.forEach(({ id, oldSnapshot }) => applySnapshot(targetSceneId, id, oldSnapshot)),
      redo: () => records.forEach(({ id, newSnapshot }) => applySnapshot(targetSceneId, id, newSnapshot))
    });
  };

  const recordEntityDelete = (deletedEntities) => {
    if (!deletedEntities || deletedEntities.length === 0) return;
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const clonedEntities = deepClone(deletedEntities);

    record({
      type: 'DELETE_ENTITY',
      description: `Delete ${clonedEntities.length} entity`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;
        clonedEntities.forEach((ent) => {
          if (sceneStore.restoreEntity) sceneStore.restoreEntity(ent);
          else scene.entities.push(ent);

          if (sceneStore.activeSceneId === targetSceneId) engineBridge.createEntity(ent);
        });
      },
      redo: () => {
        clonedEntities.forEach((ent) => {
          sceneStore.deleteEntity(ent.id, false);
          if (sceneStore.activeSceneId === targetSceneId) engineBridge.deleteEntity(ent.id);
        });
      }
    });
  };

  const recordEntityCreate = (entityData) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const cloned = deepClone(entityData);

    record({
      type: 'CREATE_ENTITY',
      description: `Create entity ${cloned.name || cloned.id}`,
      undo: () => {
        sceneStore.deleteEntity(cloned.id, false);
        if (sceneStore.activeSceneId === targetSceneId) engineBridge.deleteEntity(cloned.id);
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;
        if (sceneStore.restoreEntity) sceneStore.restoreEntity(cloned);
        else scene.entities.push(cloned);

        if (sceneStore.activeSceneId === targetSceneId) engineBridge.createEntity(cloned);
      }
    });
  };

  const recordEntityMove = (draggedId, moveDetails) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const {
      oldParentId,
      newParentId,
      oldLayerId,
      newLayerId,
      oldContext,
      newContext,
      oldSiblingOrders,
      newSiblingOrders,
      compName,
      oldTransform,
      newTransform
    } = moveDetails;

    record({
      type: 'MOVE_ENTITY',
      description: `Move entity ${draggedId}`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        sceneStore.moveEntity(draggedId, oldContext, false);

        if (oldTransform && compName) {
          const ent = scene.entities.find(e => e.id === draggedId);
          if (ent && ent.components?.[compName]) {
            ent.components[compName] = JSON.parse(JSON.stringify(oldTransform));
            if (engineBridge && engineBridge.updateComponentProp) {
              engineBridge.updateComponentProp({ entityId: draggedId, componentName: compName, path: 'x', value: oldTransform.x });
              engineBridge.updateComponentProp({ entityId: draggedId, componentName: compName, path: 'y', value: oldTransform.y });
            }
          }
        }

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.moveEntity({
            draggedId,
            newParentId: oldParentId,
            newLayerId: oldLayerId,
            insertionType: oldContext.insertionType || 'append',
            referenceId: oldContext.referenceId || null
          });

          oldSiblingOrders.forEach(({ id, orderIndex }) => {
            const ent = scene.entities.find(e => e.id === id);
            if (ent) ent.orderIndex = orderIndex;
            engineBridge.updateEntityProp({ id, prop: 'orderIndex', value: orderIndex });
          });
        }
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        sceneStore.moveEntity(draggedId, newContext, false);

        if (newTransform && compName) {
          const ent = scene.entities.find(e => e.id === draggedId);
          if (ent && ent.components?.[compName]) {
            ent.components[compName] = JSON.parse(JSON.stringify(newTransform));
            if (engineBridge && engineBridge.updateComponentProp) {
              engineBridge.updateComponentProp({ entityId: draggedId, componentName: compName, path: 'x', value: newTransform.x });
              engineBridge.updateComponentProp({ entityId: draggedId, componentName: compName, path: 'y', value: newTransform.y });
            }
          }
        }

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.moveEntity({
            draggedId,
            newParentId,
            newLayerId,
            insertionType: newContext.insertionType || 'append',
            referenceId: newContext.referenceId || null
          });

          newSiblingOrders.forEach(({ id, orderIndex }) => {
            const ent = scene.entities.find(e => e.id === id);
            if (ent) ent.orderIndex = orderIndex;
            engineBridge.updateEntityProp({ id, prop: 'orderIndex', value: orderIndex });
          });
        }
      }
    });
  };

  const recordPropChange = (id, propName, oldValue, newValue) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    record({
      type: 'CHANGE_PROP',
      description: `Change ${propName} on ${id}`,
      undo: () => {
        sceneStore.updateEntityProp(id, propName, oldValue, false);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntityProp({ id, prop: propName, value: oldValue });
        }
      },
      redo: () => {
        sceneStore.updateEntityProp(id, propName, newValue, false);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntityProp({ id, prop: propName, value: newValue });
        }
      }
    });
  };

  const recordAddLayer = (layerData, section) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const clonedLayer = deepClone(layerData);

    record({
      type: 'ADD_LAYER',
      description: `Add layer ${clonedLayer.name}`,
      undo: () => sceneStore.deleteLayer(clonedLayer.id, false),
      redo: () => sceneStore.restoreLayer(clonedLayer, section)
    });
  };

  const recordDeleteLayer = (layerData, section, entitiesData) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const clonedLayer = deepClone(layerData);
    const clonedEntities = deepClone(entitiesData || []);

    record({
      type: 'DELETE_LAYER',
      description: `Delete layer ${clonedLayer.name}`,
      undo: () => {
        sceneStore.restoreLayer(clonedLayer, section);
        const scene = sceneStore.getSceneById(targetSceneId);
        if (scene && clonedEntities.length > 0) {
          scene.entities.push(...clonedEntities);
          if (sceneStore.activeSceneId === targetSceneId) engineBridge.createEntity(clonedEntities);
        }
      },
      redo: () => sceneStore.deleteLayer(clonedLayer.id, false)
    });
  };

  const recordLayerPropChange = (layerId, propName, oldValue, newValue) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    record({
      type: 'CHANGE_LAYER_PROP',
      description: `Change layer ${propName} on ${layerId}`,
      undo: () => sceneStore.updateLayerProp(layerId, propName, oldValue, false),
      redo: () => sceneStore.updateLayerProp(layerId, propName, newValue, false)
    });
  };

  const recordReorderLayer = (draggedId, targetId, position, oldState, newState) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const oldCloned = deepClone(oldState);
    const newCloned = deepClone(newState);

    record({
      type: 'REORDER_LAYER',
      description: `Reorder layer ${draggedId}`,
      undo: () => sceneStore.applyLayerOrderState(oldCloned),
      redo: () => sceneStore.applyLayerOrderState(newCloned)
    });
  };

  const recordCreatePrefab = (prefabData) => {
    const clonedPrefab = deepClone(prefabData);
    record({
      type: 'CREATE_PREFAB',
      description: `Create prefab ${clonedPrefab.name}`,
      undo: () => prefabStore.removePrefab(clonedPrefab.id),
      redo: () => prefabStore.addPrefab(deepClone(clonedPrefab))
    });
  };

  const recordDeletePrefab = (prefabData) => {
    const clonedPrefab = deepClone(prefabData);
    record({
      type: 'DELETE_PREFAB',
      description: `Delete prefab ${clonedPrefab.name}`,
      undo: () => prefabStore.addPrefab(deepClone(clonedPrefab)),
      redo: () => prefabStore.removePrefab(clonedPrefab.id)
    });
  };

  const recordRenamePrefab = (prefabId, oldName, newName) => {
    record({
      type: 'RENAME_PREFAB',
      description: `Rename prefab to ${newName}`,
      undo: () => {
        const prefab = prefabStore.getPrefabById(prefabId);
        if (prefab) {
          const updatedData = { ...prefab.data, name: oldName };
          prefabStore.updatePrefab(prefabId, { name: oldName, data: updatedData });
        }
      },
      redo: () => {
        const prefab = prefabStore.getPrefabById(prefabId);
        if (prefab) {
          const updatedData = { ...prefab.data, name: newName };
          prefabStore.updatePrefab(prefabId, { name: newName, data: updatedData });
        }
      }
    });
  };

  const recordMovePrefabFolder = (prefabId, oldFolderId, newFolderId) => {
    record({
      type: 'MOVE_PREFAB_FOLDER',
      description: `Move prefab folder location`,
      undo: () => prefabStore.movePrefab(prefabId, oldFolderId),
      redo: () => prefabStore.movePrefab(prefabId, newFolderId)
    });
  };

  const recordInstantiatePrefab = (createdEntities) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId || !createdEntities || createdEntities.length === 0) return;

    const clonedEntities = deepClone(createdEntities);

    record({
      type: 'INSTANTIATE_PREFAB',
      description: `Instantiate prefab (${clonedEntities.length} entities)`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        const idsToDelete = clonedEntities.map(e => e.id);
        idsToDelete.forEach(id => {
          sceneStore.deleteEntity(id, false);
          if (sceneStore.activeSceneId === targetSceneId) {
            engineBridge.deleteEntity(id);
          }
        });
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        scene.entities.push(...clonedEntities);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.createEntity(clonedEntities);
        }
      }
    });
  };

  const recordLinkPrefab = (oldEntitiesState, newEntitiesState) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const oldCloned = deepClone(oldEntitiesState);
    const newCloned = deepClone(newEntitiesState);

    record({
      type: 'LINK_PREFAB',
      description: `Link ${newCloned.length} entities to prefab`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        oldCloned.forEach(oldEnt => {
          const index = scene.entities.findIndex(e => e.id === oldEnt.id);
          if (index !== -1) {
            scene.entities.splice(index, 1, deepClone(oldEnt));
          }
        });

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntity(oldCloned);
        }
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        newCloned.forEach(newEnt => {
          const index = scene.entities.findIndex(e => e.id === newEnt.id);
          if (index !== -1) {
            scene.entities.splice(index, 1, deepClone(newEnt));
          }
        });

        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntity(newCloned);
        }
      }
    });
  };

  const recordWorkspaceContextChange = (keyName, oldValue, newValue) => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    record({
      type: 'CHANGE_WORKSPACE_CONTEXT',
      description: `Change shapeContext.${keyName}`,
      undo: () => {
        const newCtx = { ...workspaceStore.shapeContext, [keyName]: oldValue };
        workspaceStore.shapeContext = newCtx;
        workspaceStore.engine?.bus?.emit("workspace:store:update", { shapeContext: newCtx });
      },
      redo: () => {
        const newCtx = { ...workspaceStore.shapeContext, [keyName]: newValue };
        workspaceStore.shapeContext = newCtx;
        workspaceStore.engine?.bus?.emit("workspace:store:update", { shapeContext: newCtx });
      }
    });
  };

  const recordApplyMasterPrefab = (oldSceneEntitiesState, newSceneEntitiesState) => {
    const targetSceneId = sceneStore.activeSceneId;
    if (!targetSceneId) return;

    const oldCloned = deepClone(oldSceneEntitiesState);
    const newCloned = deepClone(newSceneEntitiesState);

    record({
      type: 'APPLY_MASTER_PREFAB',
      description: `Apply changes to master prefab`,
      undo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        scene.entities = deepClone(oldCloned);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntity(oldCloned);
        }
      },
      redo: () => {
        const scene = sceneStore.getSceneById(targetSceneId);
        if (!scene) return;

        scene.entities = deepClone(newCloned);
        if (sceneStore.activeSceneId === targetSceneId) {
          engineBridge.updateEntity(newCloned);
        }
      }
    });
  };

  return {
    recordTransformChange,
    recordComponentChange,
    recordAddComponent,
    recordRemoveComponent,
    recordEntityDelete,
    recordEntityCreate,
    recordEntityMove,
    recordPropChange,
    recordAddLayer,
    recordDeleteLayer,
    recordLayerPropChange,
    recordReorderLayer,
    recordCreatePrefab,
    recordDeletePrefab,
    recordRenamePrefab,
    recordMovePrefabFolder,
    recordInstantiatePrefab,
    recordLinkPrefab,
    recordApplyMasterPrefab,
    recordWorkspaceContextChange,
    undo,
    redo,
    logHistory
  };
}