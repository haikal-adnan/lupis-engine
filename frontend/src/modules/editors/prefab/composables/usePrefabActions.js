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

  const getValidUniqueName = (desiredName, excludeId = null) => {
    let cleanName = desiredName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
    
    if (!cleanName) cleanName = 'New_Prefab';

    let finalName = cleanName;
    let counter = 1;

    const isNameTaken = (nameToCheck) => {
      return store.prefabs.some(p => 
        p._id !== excludeId && 
        p.name.toLowerCase() === nameToCheck.toLowerCase()
      );
    };

    while (isNameTaken(finalName)) {
      finalName = `${cleanName}_${counter}`;
      counter++;
    }

    return finalName;
  };

  const createPrefab = (name = "New Prefab", sourceEntityData = null) => {
    try {
        let dataPayload = {};
        let type = 'world'; 

        if (sourceEntityData) {
          const cleanData = JSON.parse(JSON.stringify(sourceEntityData));
          const sourceId = cleanData._id; 

          const getDescendants = (pId) => {
            let arr = [];
            const children = sceneStore.activeScene.entities.filter(e => e.parentId === pId);
            for (const c of children) {
                arr.push(c);
                arr = arr.concat(getDescendants(c._id));
            }
            return arr;
          };

          const descendants = sourceId ? getDescendants(sourceId) : [];
          const cleanChildren = JSON.parse(JSON.stringify(descendants));

          ['layerId', 'orderIndex', 'prefabId'].forEach(k => delete cleanData[k]);
          
          cleanData.parentId = null;
          
          if (cleanData.type) type = cleanData.type; 
          
          dataPayload = { data: cleanData, children: cleanChildren };
        }

        const validName = getValidUniqueName(name);

        const newPrefab = createPrefabSchema({
          _id: GenerateUUID(), 
          projectId: projectStore.project?._id || null,
          name: validName, 
          type: type, 
          ...dataPayload
        });

        store.addPrefab(newPrefab);
        projectStore.markAsDirty(); 

        showPop({ title: 'Success', message: `Prefab "${validName}" created.`, type: 'success' });
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

    const rawNewName = await prompt({
      title: 'Rename Prefab',
      message: 'Enter new name for the prefab (Alphanumeric and underscores only):',
      defaultValue: prefab.name,
      confirmText: 'Rename',
      cancelText: 'Cancel'
    });

    if (rawNewName && rawNewName.trim() !== "") {
      const validName = getValidUniqueName(rawNewName, prefabId);

      if (validName !== prefab.name) {
        const updatedEntityData = { ...prefab.data, name: validName };
        
        store.updatePrefab(prefabId, { 
          name: validName, 
          data: updatedEntityData 
        });

        projectStore.markAsDirty();

        showPop({ title: 'Renamed', message: `Prefab renamed to "${validName}".`, type: 'success' });
      }
    }
  };

  const duplicatePrefab = (prefabId) => {
    const original = store.getPrefabById(prefabId);
    if (!original) return;

    const clone = JSON.parse(JSON.stringify(original));
    clone._id = GenerateUUID();
    clone.name = getValidUniqueName(`${original.name}_copy`);

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
      entity.overridden = false;

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
    const baseName = prefab.name; 
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
    const baseScriptId = `${baseName}_${nextIndex}`;

    const newRootEntity = JSON.parse(JSON.stringify(prefab.data));
    const newRootId = GenerateUUID();
    
    const idMap = { [newRootEntity._id]: newRootId };

    newRootEntity._id = newRootId;
    newRootEntity.prefabId = prefabId; 
    newRootEntity.name = `${prefab.name}_${nextIndex}`; 
    newRootEntity.scriptId = baseScriptId;
    newRootEntity.layerId = layerId;
    newRootEntity.parentId = parentId;
    newRootEntity.orderIndex = nextOrderIndex;

    if (newRootEntity.components?.Transform) {
      newRootEntity.components.Transform.x = posX;
      newRootEntity.components.Transform.y = posY;
    } else if (newRootEntity.components?.UITransform) {
      newRootEntity.components.UITransform.x = posX;
      newRootEntity.components.UITransform.y = posY;
    }

    const allNewEntities = [newRootEntity];

    if (prefab.children && prefab.children.length > 0) {
      const clonedChildren = prefab.children.map(child => {
        const clonedChild = JSON.parse(JSON.stringify(child));
        const newChildId = GenerateUUID();
        
        idMap[clonedChild._id] = newChildId; 
        clonedChild._id = newChildId;
        
        const shortHash = GenerateUUID().split('-')[0];
        clonedChild.scriptId = `${clonedChild.scriptId}_${shortHash}`;
        clonedChild.layerId = layerId; 

        return clonedChild;
      });

      clonedChildren.forEach(child => {
        if (idMap[child.parentId]) {
          child.parentId = idMap[child.parentId];
        } else {
          child.parentId = newRootId;
        }
      });

      allNewEntities.push(...clonedChildren);
    }

    sceneStore.activeScene.entities.push(...allNewEntities);
    sceneStore.selectedEntityIds = [newRootEntity._id];

    if (EngineBridge.createEntity) {
      EngineBridge.createEntity(allNewEntities);
    }
    if (EngineBridge.selectEntity) {
      EngineBridge.selectEntity([newRootEntity._id]);
    }

    showPop({ 
      title: 'Instantiated', 
      message: `${newRootEntity.name} added to scene.`, 
      type: 'success' 
    });

    return newRootEntity;
  };

  const applyToMasterPrefab = async (entityId) => {
    const entities = sceneStore.activeScene.entities;
    const entity = entities.find(e => e._id === entityId);
    if (!entity || !entity.prefabId) return;

    const prefab = store.getPrefabById(entity.prefabId);
    if (!prefab) return;

    let rootInstance = entity;
    while (rootInstance.parentId) {
        const parent = entities.find(e => e._id === rootInstance.parentId);
        if (parent && parent.prefabId === prefab._id) {
            rootInstance = parent;
        } else {
            break;
        }
    }

    const isConfirmed = await confirm({
      title: 'Apply to Master',
      message: `Terapkan hierarki saat ini ke Master Prefab "${prefab.name}"? Perubahan struktural (tambah/hapus child) pada instance lain di scene mungkin perlu disesuaikan manual.`,
      confirmText: 'Apply',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!isConfirmed) return;

    const getDescendants = (pId) => {
        let arr = [];
        const children = entities.filter(e => e.parentId === pId);
        for (const c of children) {
            arr.push(c);
            arr = arr.concat(getDescendants(c._id));
        }
        return arr;
    };

    const descendants = getDescendants(rootInstance._id);

    const newMasterComponents = JSON.parse(JSON.stringify(rootInstance.components));
    Object.values(newMasterComponents).forEach(comp => { delete comp.overridden; });
    
    const masterDataToSave = JSON.parse(JSON.stringify(rootInstance));
    ['layerId', 'orderIndex', 'prefabId', 'scriptId'].forEach(k => delete masterDataToSave[k]);
    masterDataToSave.components = newMasterComponents;

    const masterChildrenToSave = JSON.parse(JSON.stringify(descendants)).map(child => {
        ['layerId', 'orderIndex', 'prefabId', 'scriptId'].forEach(k => delete child[k]);
        if (child.components) {
            Object.values(child.components).forEach(comp => { delete comp.overridden; });
        }
        return child;
    });

    store.updatePrefab(prefab._id, { 
        data: masterDataToSave,
        children: masterChildrenToSave
    });

    const instancesToUpdate = [];
    
    const otherRoots = entities.filter(e => 
        e.prefabId === prefab._id && 
        e._id !== rootInstance._id &&
        (!e.parentId || entities.find(p => p._id === e.parentId)?.prefabId !== prefab._id)
    );

    otherRoots.forEach(inst => {
        let hasChanges = false;
        Object.keys(newMasterComponents).forEach(compName => {
            const masterComp = newMasterComponents[compName];
            const instComp = inst.components[compName];

            if (!instComp || instComp.overridden === false) {
                let protectedX = 0, protectedY = 0;
                if (compName === 'Transform' || compName === 'UITransform') {
                    protectedX = instComp ? instComp.x : (inst.x || 0);
                    protectedY = instComp ? instComp.y : (inst.y || 0);
                }

                inst.components[compName] = JSON.parse(JSON.stringify(masterComp));
                inst.components[compName].overridden = false;

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
    });

    Object.values(rootInstance.components).forEach(comp => { comp.overridden = false; });
    instancesToUpdate.push(JSON.parse(JSON.stringify(rootInstance)));
    
    descendants.forEach(desc => {
        if(desc.components) {
            Object.values(desc.components).forEach(c => c.overridden = false);
            instancesToUpdate.push(JSON.parse(JSON.stringify(desc)));
        }
    });

    if (instancesToUpdate.length > 0) {
        EngineBridge.updateEntity(instancesToUpdate);
    }

    showPop({ 
      title: 'Master Updated', 
      message: `Master prefab disimpan. ${otherRoots.length} instance lain disinkronisasi (Root only).`, 
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