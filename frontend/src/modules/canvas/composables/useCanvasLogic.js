import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { usePopAlert } from '@/composables/usePopAlert.js';
import { useClipboard } from '@/composables/useClipboard.js';
import { EngineBridge } from '@/services/engine/EngineBridge.js';
import { usePrefabActions } from '@/modules/prefab/composables/usePrefabActions.js';
import { usePrompt } from '@/composables/usePrompt.js'; // 1. Import usePrompt

export function useCanvasLogic() {
  const sceneStore = useSceneStore();
  const { showPop } = usePopAlert();
  const { paste } = useClipboard();
  const { createPrefab, linkPrefabToEntities } = usePrefabActions();
  const { prompt } = usePrompt(); // 2. Inisialisasi prompt

  const getSelectedIds = () => sceneStore.selectedEntityIds;

  const createEntityAtPosition = (type, layerId, x, y) => {
    // Parameter kedua sekarang menggunakan layerId, bukan null lagi
    sceneStore.createEntity(type, layerId, { x, y });
  };    

  const pasteAtPosition = async (targetX, targetY) => {
    const pastedIds = await paste(); 
    
    if (!pastedIds || !Array.isArray(pastedIds) || pastedIds.length === 0) return;

    const newEntities = sceneStore.activeEntities.filter(e => pastedIds.includes(e._id));
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

    newEntities.forEach(ent => {
        const compName = ent.components.UITransform ? 'UITransform' : 'Transform';
        const transform = ent.components[compName];

        if (transform) {
            const newX = Math.round(transform.x + offsetX);
            const newY = Math.round(transform.y + offsetY);

            sceneStore.updateComponentProp(ent._id, compName, 'x', newX);
            sceneStore.updateComponentProp(ent._id, compName, 'y', newY);

            EngineBridge.updateComponentProp({
                entityId: ent._id,
                componentName: compName,
                path: 'x',
                value: newX
            });
            EngineBridge.updateComponentProp({
                entityId: ent._id,
                componentName: compName,
                path: 'y',
                value: newY
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
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e._id === id);
        const newZ = (entity.zIndex || 0) + 1;
        sceneStore.updateEntityProp(id, 'zIndex', newZ);
        EngineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
    }
  };

  const sendToBack = () => {
    const id = getFirstId();
    if (id) {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e._id === id);
        const newZ = (entity.zIndex || 0) - 1;
        sceneStore.updateEntityProp(id, 'zIndex', newZ);
        EngineBridge.updateEntityProp({ id, prop: 'zIndex', value: newZ });
    }
  };

  const toggleLock = () => {
    const ids = getSelectedIds();
    ids.forEach(id => {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e._id === id);
        if(entity) {
            const currentEditor = entity._editor || {};
            const newLockState = !currentEditor.locked;
            sceneStore.updateEntityProp(id, '_editor', { ...currentEditor, locked: newLockState });
            EngineBridge.updateEntityProp({ id, prop: '_editor', value: { ...currentEditor, locked: newLockState } });
        }
    });
  };

  const toggleHidden = () => {
    const ids = getSelectedIds();
    ids.forEach(id => {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e._id === id);
        if(entity) {
            const newVisible = !entity.visible;
            sceneStore.updateEntityProp(id, 'visible', newVisible);
            EngineBridge.updateEntityProp({ id, prop: 'visible', value: newVisible });
        }
    });
  };

  const toggleInactive = () => {
    const ids = getSelectedIds();
    ids.forEach(id => {
        const entity = sceneStore.getSceneById(sceneStore.activeSceneId).entities.find(e => e._id === id);
        if(entity) {
            const newActive = !entity.active;
            sceneStore.updateEntityProp(id, 'active', newActive);
            EngineBridge.updateEntityProp({ id, prop: 'active', value: newActive });
        }
    });
  };

  const deleteEntity = () => {
      const ids = getSelectedIds();
      if(ids.length > 0) {
          [...ids].forEach(id => sceneStore.deleteEntity(id));
      }
  };

  const duplicateEntity = () => {
      const ids = getSelectedIds();
      if(ids.length > 0) sceneStore.duplicateEntity(ids);
  };

  // 3. Implementasi Use As Prefab dengan usePrompt
  const useAsPrefab = async () => {
    const id = getFirstId();
    if (!id) return;

    const entity = sceneStore.activeScene.entities.find(e => e._id === id);
    if (!entity) return;

    // Gunakan Custom Prompt
    const prefabName = await prompt({
        title: "Create Prefab",
        message: "Enter name for the new prefab:",
        defaultValue: entity.name || "New Prefab",
        confirmText: "Create",
        cancelText: "Cancel"
    });

    if (!prefabName || prefabName.trim() === "") return;

    // Buat Prefab
    const newPrefab = createPrefab(prefabName, entity);

    // Link Entity ke Prefab yang baru
    if (newPrefab) {
        await linkPrefabToEntities(newPrefab._id, [id]);
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