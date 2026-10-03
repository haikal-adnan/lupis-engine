import { usePrefabStore } from '@prefabs/prefabs.js';
import { useSceneStore } from '@scenes/scenes.js';
import { prefabSchema } from '@prefabs/prefabs.js';
import { GenerateUUID } from '@utils/utils.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from "@historys/historys.js";

import { 
  useConfirm,
  usePopAlert,
  usePrompt
} from '@composables/composables.js';

import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { useFolderStore } from '@folders/folders.js';

export function usePrefabActions() {
  const store = usePrefabStore();
  const sceneStore = useSceneStore();
  const workspaceStore = useWorkspaceStore();
  const projectStore = useProjectStore();
  const folderStore = useFolderStore();

  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();

  const getValidUniqueName = (desiredName, excludeId = null) => {
    let cleanName = desiredName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    let finalName = cleanName;
    let counter = 1;

    const isNameTaken = (nameToCheck) => {
      return store.prefabs.some(p => 
        p.id !== excludeId && 
        p.name.toLowerCase() === nameToCheck.toLowerCase()
      );
    };

    while (isNameTaken(finalName)) {
      finalName = `${cleanName}_${counter}`;
      counter++;
    }

    return finalName;
  };

  const _savePrefabToOPFS = async (prefab) => {
    const projectId = workspaceStore.activeProjectId;
    const root = await navigator.storage.getDirectory();
    const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
    const projectsDir = await appDir.getDirectoryHandle('projects', { create: true });
    const projectDir = await projectsDir.getDirectoryHandle(String(projectId), { create: true });

    const prefabsDir = await projectDir.getDirectoryHandle('prefabs', { create: true });
    const workspacesDir = await projectDir.getDirectoryHandle('workspaces', { create: true });

    const cleanPrefab = JSON.parse(JSON.stringify(prefab));
    delete cleanPrefab.projectId;
    delete cleanPrefab.folderId;

    const fileHandle = await prefabsDir.getFileHandle(`${prefab.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(cleanPrefab, null, 2));
    await writable.close();

    const prefabMetas = store.prefabs.map(p => ({
      id: p.id,
      projectId: projectId,
      folderId: p.folderId,
      name: p.name,
      type: p.type
    }));

    const metaHandle = await workspacesDir.getFileHandle('prefabs.json', { create: true });
    const metaWritable = await metaHandle.createWritable();
    await metaWritable.write(JSON.stringify(prefabMetas, null, 2));
    await metaWritable.close();
  };

  const createPrefab = async (
    name = "New Prefab", 
    folderId = null, 
    defaultType = 'world',
    sourceEntityData = null
  ) => {
    let dataPayload = {};
    let type = defaultType; 

    const targetFolderId = folderId !== null ? folderId : folderStore.activeFolderId;

    if (sourceEntityData) {
      const cleanData = JSON.parse(JSON.stringify(sourceEntityData));
      const sourceId = cleanData.id; 

      const getDescendants = (pId) => {
        let arr = [];
        const children = sceneStore.activeScene.entities.filter(e => e.parentId === pId);
        for (const c of children) {
          arr.push(c);
          arr = arr.concat(getDescendants(c.id));
        }
        return arr;
      };

      const descendants = getDescendants(sourceId);
      const cleanChildren = JSON.parse(JSON.stringify(descendants));

      delete cleanData.layerId;
      delete cleanData.orderIndex;
      delete cleanData.prefabId;
      
      cleanChildren.forEach(child => {
        delete child.layerId;
        delete child.orderIndex;
        delete child.prefabId;
      });

      cleanData.parentId = null;
      type = cleanData.type; 
      
      dataPayload = { data: cleanData, children: cleanChildren };
    }

    const validName = getValidUniqueName(name);

    const newPrefab = prefabSchema({
      id: GenerateUUID(), 
      projectId: workspaceStore.activeProjectId,
      folderId: targetFolderId,
      name: validName, 
      type: type, 
      ...dataPayload
    });

    store.addPrefab(newPrefab);
    
    await _savePrefabToOPFS(newPrefab);
    projectStore.markAsDirty(); 

    const { recordCreatePrefab } = useSceneHistory();
    recordCreatePrefab(newPrefab);

    showPop({ title: 'Success', message: `Prefab "${validName}" created.`, type: 'success' });
    return newPrefab;
  };

  const deletePrefab = async (prefabId) => {
    const prefab = store.getPrefabById(prefabId);
    const clonedPrefab = JSON.parse(JSON.stringify(prefab));

    store.removePrefab(prefabId);
    projectStore.markAsDirty();

    const { recordDeletePrefab } = useSceneHistory();
    recordDeletePrefab(clonedPrefab);

    showPop({ 
      title: 'Deleted', 
      message: `Prefab "${prefab.name}" removed. (Ctrl+Z to Undo)`, 
      type: 'success' 
    });

    return true;
  };

  const renamePrefab = async (prefabId) => {
    const prefab = store.getPrefabById(prefabId);

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
        const oldName = prefab.name;
        const updatedEntityData = { ...prefab.data, name: validName };
        
        store.updatePrefab(prefabId, { 
          name: validName, 
          data: updatedEntityData 
        });

        const updatedPrefab = store.getPrefabById(prefabId);
        await _savePrefabToOPFS(updatedPrefab);

        projectStore.markAsDirty();

        const { recordRenamePrefab } = useSceneHistory();
        recordRenamePrefab(prefabId, oldName, validName);

        showPop({ title: 'Renamed', message: `Prefab renamed to "${validName}".`, type: 'success' });
      }
    }
  };

  const duplicatePrefab = async (prefabId) => {
    const original = store.getPrefabById(prefabId);

    const clone = JSON.parse(JSON.stringify(original));
    clone.id = GenerateUUID();
    clone.name = getValidUniqueName(`${original.name}_copy`);
    clone.folderId = folderStore.activeFolderId;

    store.addPrefab(clone);
    await _savePrefabToOPFS(clone);

    projectStore.markAsDirty();

    const { recordCreatePrefab } = useSceneHistory();
    recordCreatePrefab(clone);

    showPop({ title: 'Duplicated', message: `Prefab duplicated as "${clone.name}".`, type: 'success' });
    
    return clone;
  };

  const updatePrefab = async (prefabId, patchData) => {
    const cleanPatch = JSON.parse(JSON.stringify(patchData));
    
    store.updatePrefab(prefabId, cleanPatch);
    
    const updatedPrefab = store.getPrefabById(prefabId);
    await _savePrefabToOPFS(updatedPrefab);

    projectStore.markAsDirty();
    showPop({ title: 'Saved', message: `Prefab data updated.`, type: 'success' });
  };

  const linkPrefabToEntities = async (prefabId, entityIds) => {
    const prefab = store.getPrefabById(prefabId);

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

    const oldEntitiesSnapshot = sceneStore.activeScene.entities
      .filter(e => entityIds.includes(e.id))
      .map(e => JSON.parse(JSON.stringify(e)));

    const entitiesToUpdate = [];

    entityIds.forEach(id => {
      const entity = sceneStore.activeScene.entities.find(e => e.id === id);

      const transformComp = entity.components.Transform || entity.components.UITransform;
      const currentX = transformComp.x;
      const currentY = transformComp.y;

      const newComponents = JSON.parse(JSON.stringify(prefab.data.components));

      if (newComponents.Transform) {
        newComponents.Transform.x = currentX;
        newComponents.Transform.y = currentY;
      } else if (newComponents.UITransform) {
        newComponents.UITransform.x = currentX;
        newComponents.UITransform.y = currentY;
      }

      entity.prefabId = prefab.id;
      entity.components = newComponents;
      entity.overridden = false;

      entitiesToUpdate.push(JSON.parse(JSON.stringify(entity))); 
    });

    engineBridge.linkEntitiesToPrefab(entitiesToUpdate);

    const { recordLinkPrefab } = useSceneHistory();
    recordLinkPrefab(oldEntitiesSnapshot, entitiesToUpdate);

    showPop({ 
      title: 'Linked', 
      message: `${entitiesToUpdate.length} entities linked to "${prefab.name}".`, 
      type: 'success' 
    });
  };

  const instantiatePrefab = (prefabId, options = {}) => {
    const prefab = store.getPrefabById(prefabId);

    let posX = 0;
    let posY = 0;

    if (options.x !== undefined && options.y !== undefined) {
      posX = Number(options.x);
      posY = Number(options.y);
    } else {
      const camPos = engineBridge.getCameraPosition();
      posX = Math.round(camPos.x);
      posY = Math.round(camPos.y);
    }

    let parentId = null;
    let targetLayerId = null;

    if (options.parentId) {
      const isLayer = sceneStore.activeLayers.some(l => l.id === options.parentId);
      if (isLayer) {
        targetLayerId = options.parentId;
        parentId = null;
      } else {
        const parentEntity = sceneStore.activeScene.entities.find(e => e.id === options.parentId);
        targetLayerId = parentEntity.layerId;
        parentId = options.parentId;
      }
    } else {
      const defaultWorldLayer = sceneStore.activeScene.layersWorld[0].id;
      const defaultUILayer = sceneStore.activeScene.layersUI[0].id;
      targetLayerId = prefab.type === 'ui' ? defaultUILayer : defaultWorldLayer;
    }

    const siblings = sceneStore.activeScene.entities.filter(e => 
      e.parentId === parentId && e.layerId === targetLayerId
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
      const match = ent.scriptId.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }
    });

    const nextIndex = maxIndex + 1;
    const baseScriptId = `${baseName}_${nextIndex}`;

    const newRootEntity = JSON.parse(JSON.stringify(prefab.data));
    const newRootId = GenerateUUID();
    
    const idMap = { [newRootEntity.id]: newRootId };

    newRootEntity.id = newRootId;
    newRootEntity.prefabId = prefabId; 
    newRootEntity.name = `${prefab.name}_${nextIndex}`; 
    newRootEntity.scriptId = baseScriptId;
    
    newRootEntity.layerId = targetLayerId;
    newRootEntity.parentId = parentId;
    newRootEntity.orderIndex = nextOrderIndex;

    if (newRootEntity.components.Transform) {
      newRootEntity.components.Transform.x = posX;
      newRootEntity.components.Transform.y = posY;
    } else if (newRootEntity.components.UITransform) {
      newRootEntity.components.UITransform.x = posX;
      newRootEntity.components.UITransform.y = posY;
    }

    const allNewEntities = [newRootEntity];

    if (prefab.children.length > 0) {
      const clonedChildren = prefab.children.map(child => {
        const clonedChild = JSON.parse(JSON.stringify(child));
        const newChildId = GenerateUUID();
        
        idMap[clonedChild.id] = newChildId; 
        clonedChild.id = newChildId;
        
        const shortHash = GenerateUUID().split('-')[0];
        clonedChild.scriptId = `${clonedChild.scriptId}_${shortHash}`;
        clonedChild.layerId = targetLayerId; 

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
    sceneStore.selectedEntityIds = [newRootEntity.id];

    engineBridge.createEntity(allNewEntities);
    engineBridge.selectEntity([newRootEntity.id]);

    const { recordInstantiatePrefab } = useSceneHistory();
    recordInstantiatePrefab(allNewEntities);

    showPop({ 
      title: 'Instantiated', 
      message: `${newRootEntity.name} added to scene.`, 
      type: 'success' 
    });

    return newRootEntity;
  };

  const applyToMasterPrefab = async (entityId) => {
    const entities = sceneStore.activeScene.entities;
    const entity = entities.find(e => e.id === entityId);
    const prefab = store.getPrefabById(entity.prefabId);

    let rootInstance = entity;
    while (rootInstance.parentId) {
      const parent = entities.find(e => e.id === rootInstance.parentId);
      if (parent.prefabId === prefab.id) {
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

    const oldSceneEntitiesSnapshot = JSON.parse(JSON.stringify(entities));

    const getDescendants = (pId) => {
      let arr = [];
      const children = entities.filter(e => e.parentId === pId);
      for (const c of children) {
        arr.push(c);
        arr = arr.concat(getDescendants(c.id));
      }
      return arr;
    };

    const descendants = getDescendants(rootInstance.id);

    const newMasterComponents = JSON.parse(JSON.stringify(rootInstance.components));
    Object.values(newMasterComponents).forEach(comp => { delete comp.overridden; });
    
    const masterDataToSave = JSON.parse(JSON.stringify(rootInstance));
    
    delete masterDataToSave.layerId;
    delete masterDataToSave.orderIndex;
    delete masterDataToSave.prefabId;
    delete masterDataToSave.scriptId;
    masterDataToSave.components = newMasterComponents;

    const masterChildrenToSave = JSON.parse(JSON.stringify(descendants)).map(child => {
      delete child.layerId;
      delete child.orderIndex;
      delete child.prefabId;
      delete child.scriptId;

      Object.values(child.components).forEach(comp => { delete comp.overridden; });
      return child;
    });

    await updatePrefab(prefab.id, { 
      data: masterDataToSave,
      children: masterChildrenToSave
    });

    projectStore.markAsDirty();

    const instancesToUpdate = [];
    
    const otherRoots = entities.filter(e => 
      e.prefabId === prefab.id && 
      e.id !== rootInstance.id &&
      (!e.parentId || entities.find(p => p.id === e.parentId).prefabId !== prefab.id)
    );

    otherRoots.forEach(inst => {
      let hasChanges = false;
      Object.keys(newMasterComponents).forEach(compName => {
        const masterComp = newMasterComponents[compName];
        const instComp = inst.components[compName];

        if (instComp.overridden === false) {
          const protectedX = instComp.x;
          const protectedY = instComp.y;

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
      Object.values(desc.components).forEach(c => c.overridden = false);
      instancesToUpdate.push(JSON.parse(JSON.stringify(desc)));
    });

    engineBridge.updateEntity(instancesToUpdate);

    const newSceneEntitiesSnapshot = JSON.parse(JSON.stringify(sceneStore.activeScene.entities));
    const { recordApplyMasterPrefab } = useSceneHistory();
    recordApplyMasterPrefab(oldSceneEntitiesSnapshot, newSceneEntitiesSnapshot);

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