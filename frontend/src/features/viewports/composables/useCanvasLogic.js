import { useSceneStore } from '@scenes/scenes.js';
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
  const { showPop } = usePopAlert();
  const { paste } = useClipboard();
  const { createPrefab, linkPrefabToEntities } = usePrefabActions();
  const { prompt } = usePrompt(); 
  const { record } = useHistory();

  const getSelectedIds = () => sceneStore.selectedEntityIds;

  const createEntityAtPosition = (type, layerId, x, y) => {
    const newEntityId = sceneStore.createEntity(type, layerId, { x, y });
    
    if (newEntityId) {
      record({
        undo: () => {
          sceneStore.deleteEntity(newEntityId);
        },
        redo: () => {
          sceneStore.createEntity(type, layerId, { x, y });
        }
      });
    }
  };    

  const pasteAtPosition = async (targetX, targetY) => {
    const pastedIds = await paste(); 
    
    if (!pastedIds || !Array.isArray(pastedIds) || pastedIds.length === 0) return;

    const newEntities = sceneStore.activeEntities.filter(e => pastedIds.includes(e.id));
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
            const oldX = transform.x;
            const oldY = transform.y;
            const newX = Math.round(transform.x + offsetX);
            const newY = Math.round(transform.y + offsetY);

            previousPositions.push({ id: ent.id, compName, oldX, oldY, newX, newY });

            sceneStore.updateComponentProp(ent.id, compName, 'x', newX);
            sceneStore.updateComponentProp(ent.id, compName, 'y', newX);

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
          sceneStore.updateComponentProp(id, compName, 'x', oldX);
          sceneStore.updateComponentProp(id, compName, 'y', oldY);
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'x', value: oldX });
          engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'y', value: oldY });
        });
      },
      redo: () => {
        previousPositions.forEach(({ id, compName, newX, newY }) => {
          sceneStore.updateComponentProp(id, compName, 'x', newX);
          sceneStore.updateComponentProp(id, compName, 'y', newY);
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
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
        const oldZ = entity.zIndex || 0;
        const newZ = oldZ + 1;

        sceneStore.updateEntityProp(id, 'zIndex', newZ);
        engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });

        record({
          undo: () => {
            sceneStore.updateEntityProp(id, 'zIndex', oldZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: oldZ });
          },
          redo: () => {
            sceneStore.updateEntityProp(id, 'zIndex', newZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
          }
        });
    }
  };

  const sendToBack = () => {
    const id = getFirstId();
    if (id) {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
        const oldZ = entity.zIndex || 0;
        const newZ = oldZ - 1;

        sceneStore.updateEntityProp(id, 'zIndex', newZ);
        engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });

        record({
          undo: () => {
            sceneStore.updateEntityProp(id, 'zIndex', oldZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: oldZ });
          },
          redo: () => {
            sceneStore.updateEntityProp(id, 'zIndex', newZ);
            engineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
          }
        });
    }
  };

  const toggleLock = () => {
    const ids = getSelectedIds();
    const changes = [];

    ids.forEach(id => {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
        if(entity) {
            const currentEditor = entity._editor || {};
            const oldLockState = !!currentEditor.locked;
            const newLockState = !oldLockState;

            changes.push({ id, currentEditor, oldLockState, newLockState });

            sceneStore.updateEntityProp(id, '_editor', { ...currentEditor, locked: newLockState });
            engineBridge.updateEntityProp({ id, prop: '_editor', value: { ...currentEditor, locked: newLockState } });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, currentEditor, oldLockState }) => {
            sceneStore.updateEntityProp(id, '_editor', { ...currentEditor, locked: oldLockState });
            engineBridge.updateEntityProp({ id, prop: '_editor', value: { ...currentEditor, locked: oldLockState } });
          });
        },
        redo: () => {
          changes.forEach(({ id, currentEditor, newLockState }) => {
            sceneStore.updateEntityProp(id, '_editor', { ...currentEditor, locked: newLockState });
            engineBridge.updateEntityProp({ id, prop: '_editor', value: { ...currentEditor, locked: newLockState } });
          });
        }
      });
    }
  };

  const toggleHidden = () => {
    const ids = getSelectedIds();
    const changes = [];

    ids.forEach(id => {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
        if(entity) {
            const oldVisible = entity.visible;
            const newVisible = !oldVisible;

            changes.push({ id, oldVisible, newVisible });

            sceneStore.updateEntityProp(id, 'visible', newVisible);
            engineBridge.updateEntityProp({ id, prop: 'visible', value: newVisible });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, oldVisible }) => {
            sceneStore.updateEntityProp(id, 'visible', oldVisible);
            engineBridge.updateEntityProp({ id, prop: 'visible', value: oldVisible });
          });
        },
        redo: () => {
          changes.forEach(({ id, newVisible }) => {
            sceneStore.updateEntityProp(id, 'visible', newVisible);
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
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
        if(entity) {
            const oldActive = entity.active;
            const newActive = !oldActive;

            changes.push({ id, oldActive, newActive });

            sceneStore.updateEntityProp(id, 'active', newActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: newActive });
        }
    });

    if (changes.length > 0) {
      record({
        undo: () => {
          changes.forEach(({ id, oldActive }) => {
            sceneStore.updateEntityProp(id, 'active', oldActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: oldActive });
          });
        },
        redo: () => {
          changes.forEach(({ id, newActive }) => {
            sceneStore.updateEntityProp(id, 'active', newActive);
            engineBridge.updateEntityProp({ id, prop: 'active', value: newActive });
          });
        }
      });
    }
  };

  const deleteEntity = () => {
      const ids = getSelectedIds();
      if(ids.length > 0) {
          const deletedEntities = ids.map(id => {
            const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e.id === id);
            return JSON.parse(JSON.stringify(entity));
          }).filter(Boolean);

          [...ids].forEach(id => sceneStore.deleteEntity(id));

          record({
            undo: () => {
              deletedEntities.forEach(ent => {
                sceneStore.restoreEntity ? sceneStore.restoreEntity(ent) : sceneStore.activeScene.entities.push(ent);
              });
            },
            redo: () => {
              deletedEntities.forEach(ent => sceneStore.deleteEntity(ent.id));
            }
          });
      }
  };

  const duplicateEntity = () => {
      const ids = getSelectedIds();
      if(ids.length > 0) {
        const duplicatedIds = sceneStore.duplicateEntity(ids);

        record({
          undo: () => {
            if (Array.isArray(duplicatedIds)) {
              duplicatedIds.forEach(id => sceneStore.deleteEntity(id));
            }
          },
          redo: () => {
            sceneStore.duplicateEntity(ids);
          }
        });
      }
  };

  const useAsPrefab = async () => {
    const id = getFirstId();
    if (!id) return;

    const entity = sceneStore.activeScene.entities.find(e => e.id === id);
    if (!entity) return;

    const baseName = entity.name || "New Prefab";
    const suggestedName = baseName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    const prefabName = await prompt({
        title: "Create Prefab",
        message: "Enter name for the new prefab (Alphanumeric and underscores only):",
        defaultValue: suggestedName || "New_Prefab",
        confirmText: "Create",
        cancelText: "Cancel"
    });

    if (!prefabName || prefabName.trim() === "") return;

    const newPrefab = await createPrefab(
      prefabName, 
      null, 
      entity.type || 'world', 
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