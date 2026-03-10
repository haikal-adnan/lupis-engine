import { usePrefabStore } from '@/stores/usePrefabStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { createPrefab as createPrefabSchema } from '@/services/schema/prefabSchema.js';
import { GenerateUUID } from '@/commons/utils/generateUUID';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert';
import { usePrompt } from '@/composables/usePrompt';
import { useProjectStore } from '@/stores/useProjectStore.js';

export function usePrefabActions() {
  const store = usePrefabStore();
  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();

  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();

  const createPrefab = (name = "New Prefab", sourceEntityData = null) => {
    try {
        let dataPayload = {};
        let type = 'world'; // Default type

        if (sourceEntityData) {
          const cleanData = JSON.parse(JSON.stringify(sourceEntityData));
          ['_id', 'parentId', 'layerId', 'orderIndex', 'prefabId'].forEach(k => delete cleanData[k]);
          
          // Ambil tipe dari entity yang dipilih (saat "Use as Prefab" diklik)
          if (cleanData.type) type = cleanData.type; 
          
          dataPayload = { data: cleanData };
        }

        // PANGGIL SCHEMA DI SINI
        const newPrefab = createPrefabSchema({
          _id: GenerateUUID(),
          projectId: projectStore.project?._id || null,
          name: name, // Parameter nama diteruskan ke Root
          type: type, // Parameter tipe diteruskan ke Root
          ...dataPayload
        });

        store.addPrefab(newPrefab);
        projectStore.markAsDirty(); // JANGAN LUPA INI!

        showPop({ title: 'Success', message: `Prefab "${name}" created.`, type: 'success' });
        return newPrefab;

      } catch (error) {
          console.error(error);
          showPop({ title: 'Error', message: 'Failed to create prefab.', type: 'error' });
          return null;
      }
  };
  
  const deletePrefab = async (prefabId) => {
    const prefab = store.getPrefabById(prefabId);
    if (!prefab) return;

    const isConfirmed = await confirm({
      title: 'Delete Prefab',
      message: `Are you sure you want to delete "${prefab.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (isConfirmed) {
      store.removePrefab(prefabId);
      showPop({ title: 'Deleted', message: `Prefab "${prefab.name}" removed.`, type: 'success' });
    }
  };

  const renamePrefab = async (prefabId) => {
    const prefab = store.getPrefabById(prefabId);
    if (!prefab) return;

    const newName = await prompt({
      title: 'Rename Prefab',
      message: 'Enter new name for the prefab:',
      defaultValue: prefab.name,
      confirmText: 'Rename',
      cancelText: 'Cancel'
    });

    if (newName && newName.trim() !== "" && newName !== prefab.name) {
      // 3. Update nama luar (prefab) DAN nama dalam (root entity data) agar sinkron
      const updatedEntityData = { ...prefab.data, name: newName };
      
      store.updatePrefab(prefabId, { 
        name: newName, 
        data: updatedEntityData 
      });

      // 4. FLAG PROJECT SEBAGAI DIRTY! Ini krusial agar backend tahu data harus disave.
      projectStore.markAsDirty();

      showPop({ title: 'Renamed', message: `Prefab renamed to "${newName}".`, type: 'success' });
    }
  };
  const duplicatePrefab = (prefabId) => {
    const original = store.getPrefabById(prefabId);
    if (!original) return;

    const clone = JSON.parse(JSON.stringify(original));
    clone._id = GenerateUUID();
    clone.name = `${original.name} (Copy)`;

    store.addPrefab(clone);
    showPop({ title: 'Duplicated', message: `Prefab duplicated as "${clone.name}".`, type: 'success' });
    
    return clone;
  };

  const updatePrefab = (prefabId, newData) => {
    const prefab = store.getPrefabById(prefabId);
    if (prefab) {
      store.updatePrefab(prefabId, { data: newData });
      showPop({ title: 'Saved', message: `Prefab data updated.`, type: 'success' });
    }
  };

  const linkPrefabToEntities = async (prefabId, entityIds) => {
    const prefab = store.getPrefabById(prefabId);
    if (!prefab || !entityIds || entityIds.length === 0) return;

    if (entityIds.length > 1) {
        const isConfirmed = await confirm({
          title: 'Link Entities',
          message: `Link ${entityIds.length} entities to "${prefab.name}"?`,
          confirmText: 'Link',
          cancelText: 'Cancel',
          type: 'warning'
        });
        if (!isConfirmed) return;
    }

    const entitiesToUpdate = [];

    entityIds.forEach(id => {
      const entity = sceneStore.activeScene.entities.find(e => e._id === id);
      if (!entity) return;

      let currentX = 0, currentY = 0;
      const transformComp = entity.components?.Transform || entity.components?.UITransform;
      
      if (transformComp) {
          currentX = transformComp.x;
          currentY = transformComp.y;
      } else {
          currentX = entity.x || 0;
          currentY = entity.y || 0;
      }

      const newComponents = JSON.parse(JSON.stringify(prefab.data.components));

      if (newComponents.Transform) {
        newComponents.Transform.x = currentX;
        newComponents.Transform.y = currentY;
      } else if (newComponents.UITransform) {
        newComponents.UITransform.x = currentX;
        newComponents.UITransform.y = currentY;
      }

      entity.prefabId = prefab._id;
      entity.components = newComponents;
      entity.isOverridden = false;

      entitiesToUpdate.push(JSON.parse(JSON.stringify(entity))); 
    });

    if (entitiesToUpdate.length > 0) {
      EngineBridge.linkEntitiesToPrefab(entitiesToUpdate);
      showPop({ 
        title: 'Linked', 
        message: `${entitiesToUpdate.length} entities linked to "${prefab.name}".`, 
        type: 'success' 
      });
    }
  };

  const instantiatePrefab = (prefabId, options = {}) => {
    const prefab = store.getPrefabById(prefabId);
    if (!prefab || !sceneStore.activeScene) return null;

    let posX = 0;
    let posY = 0;

    if (options.x !== undefined && options.y !== undefined) {
      posX = Number(options.x);
      posY = Number(options.y);
    } else {
      const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
      posX = Math.round(camPos.x);
      posY = Math.round(camPos.y);
    }

    let parentId = null;
    let layerId = null;

    if (options.parentId) {
      const isLayer = sceneStore.activeLayers.some(l => l._id === options.parentId);
      if (isLayer) {
        layerId = options.parentId;
        parentId = null;
      } else {
        const parentEntity = sceneStore.activeScene.entities.find(e => e._id === options.parentId);
        if (parentEntity) {
          layerId = parentEntity.layerId;
          parentId = options.parentId;
        } else {
          layerId = options.parentId;
        }
      }
    } else {
      const defaultWorldLayer = sceneStore.activeScene.layersWorld?.[0]?._id;
      const defaultUILayer = sceneStore.activeScene.layersUI?.[0]?._id;
      layerId = prefab.type === 'ui' ? defaultUILayer : defaultWorldLayer;
    }

    const siblings = sceneStore.activeScene.entities.filter(e => 
      e.parentId === parentId && e.layerId === layerId
    );
    const maxOrder = siblings.reduce((max, node) => 
      (node.orderIndex > max ? node.orderIndex : max), -1
    );
    const nextOrderIndex = maxOrder + 1;

    const existingEntities = sceneStore.activeScene.entities;
    const baseName = prefab.name.replace(/[^a-zA-Z0-9_]/g, ''); 
    const regex = new RegExp(`^${baseName}_(\\d+)$`);

    let maxIndex = 0;
    existingEntities.forEach(ent => {
      const match = ent.scriptId ? ent.scriptId.match(regex) : null;
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }
    });

    const nextIndex = maxIndex + 1;
    const scriptId = `${baseName}_${nextIndex}`;

    const newEntity = JSON.parse(JSON.stringify(prefab.data));
    
    newEntity._id = GenerateUUID();
    newEntity.prefabId = prefabId; 
    newEntity.name = `${prefab.name} ${nextIndex}`;
    newEntity.scriptId = scriptId;
    newEntity.layerId = layerId;
    newEntity.parentId = parentId;
    newEntity.orderIndex = nextOrderIndex;

    if (newEntity.components?.Transform) {
      newEntity.components.Transform.x = posX;
      newEntity.components.Transform.y = posY;
    } else if (newEntity.components?.UITransform) {
      newEntity.components.UITransform.x = posX;
      newEntity.components.UITransform.y = posY;
    }

    sceneStore.activeScene.entities.push(newEntity);
    sceneStore.selectedEntityIds = [newEntity._id];

    if (EngineBridge.createEntity) {
      EngineBridge.createEntity(newEntity);
    }
    if (EngineBridge.selectEntity) {
      EngineBridge.selectEntity([newEntity._id]);
    }

    showPop({ 
      title: 'Instantiated', 
      message: `${newEntity.name} added to scene.`, 
      type: 'success' 
    });

    return newEntity;
  };

  const applyToMasterPrefab = async (entityId) => {
    const entity = sceneStore.activeScene.entities.find(e => e._id === entityId);
    if (!entity || !entity.prefabId) return;

    const prefab = store.getPrefabById(entity.prefabId);
    if (!prefab) return;

    const isConfirmed = await confirm({
      title: 'Apply to Master',
      message: `Terapkan perubahan komponen ke Master Prefab "${prefab.name}"? Instance lain hanya akan menerima update pada komponen yang tidak di-override.`,
      confirmText: 'Apply to Master',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!isConfirmed) return;

    const newMasterComponents = JSON.parse(JSON.stringify(entity.components));
    
    Object.values(newMasterComponents).forEach(comp => {
      delete comp.isOverridden;
    });

    const masterDataToSave = JSON.parse(JSON.stringify(entity));
    ['_id', 'parentId', 'layerId', 'orderIndex', 'prefabId', 'scriptId', 'name'].forEach(k => delete masterDataToSave[k]);
    masterDataToSave.components = newMasterComponents;
    
    store.updatePrefab(prefab._id, { data: masterDataToSave });

    const instancesToUpdate = [];
    const allInstances = sceneStore.activeScene.entities.filter(e => e.prefabId === prefab._id);

    allInstances.forEach(inst => {
      if (inst._id === entityId) {
        Object.values(inst.components).forEach(comp => {
          comp.isOverridden = false;
        });
        instancesToUpdate.push(JSON.parse(JSON.stringify(inst)));
      } else {
        let hasChanges = false;

        Object.keys(newMasterComponents).forEach(compName => {
          const masterComp = newMasterComponents[compName];
          const instComp = inst.components[compName];

          if (!instComp || instComp.isOverridden === false) {
            let protectedX = 0, protectedY = 0;
            if (compName === 'Transform' || compName === 'UITransform') {
              protectedX = instComp ? instComp.x : (inst.x || 0);
              protectedY = instComp ? instComp.y : (inst.y || 0);
            }

            inst.components[compName] = JSON.parse(JSON.stringify(masterComp));
            inst.components[compName].isOverridden = false;

            if (compName === 'Transform' || compName === 'UITransform') {
              inst.components[compName].x = protectedX;
              inst.components[compName].y = protectedY;
            }

            hasChanges = true;
          }
        });

        if (hasChanges) {
          instancesToUpdate.push(JSON.parse(JSON.stringify(inst)));
        }
      }
    });

    if (instancesToUpdate.length > 0) {
      EngineBridge.updateEntity(instancesToUpdate);
    }

    showPop({ 
      title: 'Master Updated', 
      message: `Master prefab dan ${instancesToUpdate.length - 1} instance tersinkronisasi.`, 
      type: 'success' 
    });
  };

  return {
    createPrefab,
    deletePrefab,
    renamePrefab,
    duplicatePrefab,
    updatePrefab,
    linkPrefabToEntities,
    instantiatePrefab,
    applyToMasterPrefab
  };
}
