import { useSceneStore, useEntityActions } from '@scenes/scenes.js';
import { useHistory } from '@historys/historys.js'; 
import { engineBridge } from "@engines/engines.js";
import { usePrefabActions } from '@prefabs/prefabs.js';

import { 
  usePopAlert,
  usePrompt,
  useClipboard
} from '@composables/composables.js';

export function useCanvasLogic() {
  const sceneStore = useSceneStore();
  const entityActions = useEntityActions();
  const { showPop } = usePopAlert();
  const { createPrefab, linkPrefabToEntities } = usePrefabActions();
  const { prompt } = usePrompt(); 
  const { record } = useHistory();

  const getSelectedIds = () => sceneStore.selectedEntityIds || [];

  const createEntityAtPosition = (type, layerId, x, y) => {
    const newEntity = entityActions.createEntity(type, layerId, { x, y });
    const newEntityId = typeof newEntity === 'object' ? newEntity?.id : newEntity;
    
    if (newEntityId) {
      record({
        undo: () => {
          entityActions.deleteEntity(newEntityId);
        },
        redo: () => {
          entityActions.createEntity(type, layerId, { x, y });
        }
      });
    }
  };    

  const pasteAtPosition = async (targetX, targetY) => {
    const clipboard = useClipboard();
    const pastedIds = await clipboard.paste(); 
    
    if (!pastedIds || !Array.isArray(pastedIds) || pastedIds.length === 0) return;

    const activeEnts = sceneStore.activeEntities || [];
    const newEntities = activeEnts.filter(e => pastedIds.includes(e.id));
    if (newEntities.length === 0) return;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    let hasTransform = false;

    newEntities.forEach(ent => {
        const transform = ent.components?.Transform || ent.components?.UITransform;
        if (transform) {
            hasTransform = true;
            if (transform.x < minX) minX = transform.x;
            if (transform.y < minY) minY = transform.y;
            if (transform.x > maxX) maxX = transform.x;
            if (transform.y > maxY) maxY = transform.y;
        }
    });

    if (!hasTransform) return;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = targetX - centerX;
    const offsetY = targetY - centerY;

    const previousPositions = [];

    newEntities.forEach(ent => {
        const compName = ent.components.UITransform ? 'UITransform' : 'Transform';
        const transform = ent.components[compName];

        if (transform) {
            const oldX = Number(transform.x ?? 0);
            const oldY = Number(transform.y ?? 0);
            const newX = Math.round(oldX + offsetX);
            const newY = Math.round(oldY + offsetY);

            previousPositions.push({ id: ent.id, compName, oldX, oldY, newX, newY });

            entityActions.updateComponentProp(ent.id, compName, 'x', newX);
            entityActions.updateComponentProp(ent.id, compName, 'y', newY);

            engineBridge.updateComponentProp({
                entityId: ent.id,
                componentName: compName,
                path: 'x',
                value: newX
            });
            engineBridge.updateComponentProp({
                entityId: ent.id,
                componentName: compName,
                path: 'y',
                value: newY
            });
        }
    });

    record({
      undo: () => {
        previousPositions.forEach(({ id, compName, oldX, oldY }) => {
          entityActions.updateComponentProp(id, compName, 'x', oldX);
          entityActions.updateComponentProp(id, compName, 'y', oldY);
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'x', value: oldX });
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'y', value: oldY });
        });
      },
      redo: () => {
        previousPositions.forEach(({ id, compName, newX, newY }) => {
          entityActions.updateComponentProp(id, compName, 'x', newX);
          entityActions.updateComponentProp(id, compName, 'y', newY);
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'x', value: newX });
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'y', value: newY });
        });
      }
    });
  };

  const getFirstId = () => {
      const ids = getSelectedIds();
      return ids.length > 0 ? ids[0] : null;
  };

  const bringToFront = () => {
    const id = getFirstId();
    if (id) {
        const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
        const entity = activeScene?.entities?.find(e => e.id === id);
        if (!entity) return;

        const oldZ = entity.zIndex || 0;
        const newZ = oldZ + 1;

        entityActions.updateEntityProp(id, 'zIndex', newZ);
        engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });

        record({
          undo: () => {
            entityActions.updateEntityProp(id, 'zIndex', oldZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: oldZ });
          },
          redo: () => {
            entityActions.updateEntityProp(id, 'zIndex', newZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
          }
        });
    }
  };

  const sendToBack = () => {
    const id = getFirstId();
    if (id) {
        const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
        const entity = activeScene?.entities?.find(e => e.id === id);
        if (!entity) return;

        const oldZ = entity.zIndex || 0;
        const newZ = oldZ - 1;

        entityActions.updateEntityProp(id, 'zIndex', newZ);
        engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });

        record({
          undo: () => {
            entityActions.updateEntityProp(id, 'zIndex', oldZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: oldZ });
          },
          redo: () => {
            entityActions.updateEntityProp(id, 'zIndex', newZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
          }
        });
    }
  };

  const toggleLock = () => {
    const ids = getSelectedIds();
    const changes = [];

    ids.forEach(id => {
        const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
        const entity = activeScene?.entities?.find(e => e.id === id);
        if (entity) {
            const currentEditor = JSON.parse(JSON.stringify(entity._editor || {}));
            const oldLockState = !!currentEditor.locked;
            const newLockState = !oldLockState;

            const updatedEditor = { ...currentEditor, locked: newLockState };
            changes.push({ id, oldEditor: currentEditor, newEditor: updatedEditor });

            entityActions.updateEntityProp(id, '_editor', updatedEditor);
            engineBridge.updateEntityProp({ id, prop: '_editor', value: updatedEditor });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, oldEditor }) => {
            entityActions.updateEntityProp(id, '_editor', oldEditor);
            engineBridge.updateEntityProp({ id, prop: '_editor', value: oldEditor });
          });
        },
        redo: () => {
          changes.forEach(({ id, newEditor }) => {
            entityActions.updateEntityProp(id, '_editor', newEditor);
            engineBridge.updateEntityProp({ id, prop: '_editor', value: newEditor });
          });
        }
      });
    }
  };

  const toggleHidden = () => {
    const ids = getSelectedIds();
    const changes = [];

    ids.forEach(id => {
        const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
        const entity = activeScene?.entities?.find(e => e.id === id);
        if (entity) {
            const oldVisible = entity.visible;
            const newVisible = !oldVisible;

            changes.push({ id, oldVisible, newVisible });

            entityActions.updateEntityProp(id, 'visible', newVisible);
            engineBridge.updateEntityProp({ id, prop: 'visible', value: newVisible });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, oldVisible }) => {
            entityActions.updateEntityProp(id, 'visible', oldVisible);
            engineBridge.updateEntityProp({ id, prop: 'visible', value: oldVisible });
          });
        },
        redo: () => {
          changes.forEach(({ id, newVisible }) => {
            entityActions.updateEntityProp(id, 'visible', newVisible);
            engineBridge.updateEntityProp({ id, prop: 'visible', value: newVisible });
          });
        }
      });
    }
  };

  const toggleInactive = () => {
    const ids = getSelectedIds();
    const changes = [];

    ids.forEach(id => {
        const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
        const entity = activeScene?.entities?.find(e => e.id === id);
        if (entity) {
            const oldActive = entity.active;
            const newActive = !oldActive;

            changes.push({ id, oldActive, newActive });

            entityActions.updateEntityProp(id, 'active', newActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: newActive });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, oldActive }) => {
            entityActions.updateEntityProp(id, 'active', oldActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: oldActive });
          });
        },
        redo: () => {
          changes.forEach(({ id, newActive }) => {
            entityActions.updateEntityProp(id, 'active', newActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: newActive });
          });
        }
      });
    }
  };

  const deleteEntity = () => {
      const ids = getSelectedIds();
      if (ids.length > 0) {
          const activeScene = sceneStore.getSceneById(sceneStore.activeSceneId);
          const deletedEntities = ids.map(id => {
            const entity = activeScene?.entities?.find(e => e.id === id);
            return entity ? JSON.parse(JSON.stringify(entity)) : null;
          }).filter(Boolean);

          [...ids].forEach(id => entityActions.deleteEntity(id));

          record({
            undo: () => {
              deletedEntities.forEach(ent => {
                if (entityActions.restoreEntity) entityActions.restoreEntity(ent);
                else sceneStore.activeScene?.entities?.push(ent);
              });
            },
            redo: () => {
              deletedEntities.forEach(ent => entityActions.deleteEntity(ent.id));
            }
          });
      }
  };

  const duplicateEntity = () => {
      const ids = getSelectedIds();
      if (ids.length > 0) {
        const duplicatedIds = entityActions.duplicateEntity(ids);

        record({
          undo: () => {
            if (Array.isArray(duplicatedIds)) {
              duplicatedIds.forEach(id => entityActions.deleteEntity(id));
            }
          },
          redo: () => {
            entityActions.duplicateEntity(ids);
          }
        });
      }
  };

  const useAsPrefab = async () => {
    const id = getFirstId();
    if (!id) return;

    const entity = sceneStore.activeScene?.entities?.find(e => e.id === id);
    if (!entity) return;

    const baseName = entity.scriptId || "New_Prefab";
    const suggestedName = baseName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    const response = await prompt({
        title: "Create Prefab",
        message: "Enter name for the new prefab (Alphanumeric and underscores only):",
        defaultValue: suggestedName || "New_Prefab",
        confirmText: "Create",
        cancelText: "Cancel"
    });

    const prefabName = typeof response === 'string' ? response : response?.value;

    if (!prefabName || typeof prefabName !== 'string' || prefabName.trim() === "") return;

    const newPrefab = await createPrefab(
      prefabName.trim(), 
      null, 
      entity.type || 'entity', 
      entity
    );

    if (newPrefab) {
        await linkPrefabToEntities(newPrefab.id, [id]);
    }
  };

  return {
    createEntityAtPosition,
    pasteAtPosition,
    bringToFront,
    sendToBack,
    toggleLock,
    toggleHidden,
    toggleInactive,
    deleteEntity,
    duplicateEntity,
    useAsPrefab 
  };
}