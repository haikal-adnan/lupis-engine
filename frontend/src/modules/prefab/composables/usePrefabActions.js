import { usePrefabStore } from '@/stores/usePrefabStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { createPrefab as createPrefabSchema } from '@/services/schema/prefabSchema.js';
import { GenerateUUID } from '@/commons/utils/generateUUID';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

// Composables
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert';
import { usePrompt } from '@/composables/usePrompt';

export function usePrefabActions() {
  const store = usePrefabStore();
  const sceneStore = useSceneStore();
  
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();
  const { prompt } = usePrompt();

  // --- CREATE ---
  const createPrefab = (name = "New Prefab", sourceEntityData = null) => {
    try {
      let dataPayload = {};
      let type = 'world';

      if (sourceEntityData) {
        const cleanData = JSON.parse(JSON.stringify(sourceEntityData));
        ['_id', 'parentId', 'layerId', 'orderIndex', 'prefabId'].forEach(k => delete cleanData[k]);
        
        if (cleanData.type) type = cleanData.type;
        dataPayload = { data: cleanData };
      }

      const newPrefab = createPrefabSchema({
        _id: GenerateUUID(),
        name: name,
        type: type,
        ...dataPayload
      });

      store.addPrefab(newPrefab);
      
      showPop({ title: 'Success', message: `Prefab "${name}" created.`, type: 'success' });
      return newPrefab;

    } catch (error) {
      console.error(error);
      showPop({ title: 'Error', message: 'Failed to create prefab.', type: 'error' });
      return null;
    }
  };
  
  // --- DELETE ---
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

  // --- RENAME ---
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
      store.updatePrefab(prefabId, { name: newName });
      showPop({ title: 'Renamed', message: `Prefab renamed to "${newName}".`, type: 'success' });
    }
  };

  // --- DUPLICATE ---
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

  // --- UPDATE DATA ---
  const updatePrefab = (prefabId, newData) => {
    const prefab = store.getPrefabById(prefabId);
    if (prefab) {
      store.updatePrefab(prefabId, { data: newData });
      showPop({ title: 'Saved', message: `Prefab data updated.`, type: 'success' });
    }
  };

  // --- LINK TO ENTITIES ---
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

  // --- INSTANTIATE PREFAB (NEW) ---
  const instantiatePrefab = (prefabId, options = {}) => {
    const prefab = store.getPrefabById(prefabId);
    if (!prefab || !sceneStore.activeScene) return null;

    // 1. Tentukan Posisi (Mouse drop vs Camera Center)
    let posX = 0;
    let posY = 0;

    if (options.x !== undefined && options.y !== undefined) {
      posX = Number(options.x);
      posY = Number(options.y);
    } else {
      // Sama persis seperti createEntity, ambil dari Camera
      const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
      posX = Math.round(camPos.x);
      posY = Math.round(camPos.y);
    }

    // 2. Tentukan Parent & Layer
    let parentId = null;
    let layerId = null;

    if (options.parentId) {
      // Cek apakah options.parentId itu Layer atau Entity?
      const isLayer = sceneStore.activeLayers.some(l => l._id === options.parentId);
      if (isLayer) {
        layerId = options.parentId;
        parentId = null;
      } else {
        // Jika drop ke dalam entitas/grup lain
        const parentEntity = sceneStore.activeScene.entities.find(e => e._id === options.parentId);
        if (parentEntity) {
          layerId = parentEntity.layerId;
          parentId = options.parentId;
        } else {
          layerId = options.parentId; // Fallback darurat
        }
      }
    } else {
      // Fallback ke default layer sesuai tipe prefab
      const defaultWorldLayer = sceneStore.activeScene.layersWorld?.[0]?._id;
      const defaultUILayer = sceneStore.activeScene.layersUI?.[0]?._id;
      layerId = prefab.type === 'ui' ? defaultUILayer : defaultWorldLayer;
    }

    // 3. Hitung Order Index tertinggi di parent/layer tersebut
    const siblings = sceneStore.activeScene.entities.filter(e => 
      e.parentId === parentId && e.layerId === layerId
    );
    const maxOrder = siblings.reduce((max, node) => 
      (node.orderIndex > max ? node.orderIndex : max), -1
    );
    const nextOrderIndex = maxOrder + 1;

    // 4. Auto-Increment Naming & ScriptID
    const existingEntities = sceneStore.activeScene.entities;
    // Hapus spasi dari nama prefab untuk base ScriptID
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

    // 5. Clone dan Susun Data Entity Baru
    const newEntity = JSON.parse(JSON.stringify(prefab.data));
    
    newEntity._id = GenerateUUID();
    newEntity.prefabId = prefabId; 
    newEntity.name = `${prefab.name} ${nextIndex}`; // cth: "Orc Enemy 1"
    newEntity.scriptId = scriptId;                  // cth: "OrcEnemy_1"
    newEntity.layerId = layerId;
    newEntity.parentId = parentId;
    newEntity.orderIndex = nextOrderIndex;

    // Set Posisi Transform
    if (newEntity.components?.Transform) {
      newEntity.components.Transform.x = posX;
      newEntity.components.Transform.y = posY;
    } else if (newEntity.components?.UITransform) {
      newEntity.components.UITransform.x = posX;
      newEntity.components.UITransform.y = posY;
    }

    // 6. Terapkan ke Vue Store & Engine
    sceneStore.activeScene.entities.push(newEntity);
    
    // Auto Select Entity yang baru dibuat
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

// --- APPLY TO MASTER PREFAB (COMPONENT-LEVEL) ---
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

    // 1. Ambil data komponen terbaru dari entitas sumber
    const newMasterComponents = JSON.parse(JSON.stringify(entity.components));
    
    // Bersihkan isOverridden dari master (master tidak butuh flag ini)
    Object.values(newMasterComponents).forEach(comp => {
      delete comp.isOverridden;
    });

    // 2. Update Master di Prefab Store
    const masterDataToSave = JSON.parse(JSON.stringify(entity));
    ['_id', 'parentId', 'layerId', 'orderIndex', 'prefabId', 'scriptId', 'name'].forEach(k => delete masterDataToSave[k]);
    masterDataToSave.components = newMasterComponents;
    
    store.updatePrefab(prefab._id, { data: masterDataToSave });

    // 3. Sinkronisasi semua instance di scene
    const instancesToUpdate = [];
    const allInstances = sceneStore.activeScene.entities.filter(e => e.prefabId === prefab._id);

    allInstances.forEach(inst => {
      if (inst._id === entityId) {
        // ENTITAS SUMBER: Karena ini sekarang adalah versi master, reset semua override komponennya jadi false
        Object.values(inst.components).forEach(comp => {
          comp.isOverridden = false;
        });
        instancesToUpdate.push(JSON.parse(JSON.stringify(inst)));
      } else {
        // ENTITAS LAIN: Cek per komponen
        let hasChanges = false;

        Object.keys(newMasterComponents).forEach(compName => {
          const masterComp = newMasterComponents[compName];
          const instComp = inst.components[compName];

          // Hanya update jika komponen di instance TIDAK di-override (atau belum ada)
          if (!instComp || instComp.isOverridden === false) {
            
            // Pertahankan posisi koordinat (Transform) agar objek tidak saling menumpuk
            let protectedX = 0, protectedY = 0;
            if (compName === 'Transform' || compName === 'UITransform') {
              protectedX = instComp ? instComp.x : (inst.x || 0);
              protectedY = instComp ? instComp.y : (inst.y || 0);
            }

            // Copy data dari master ke instance
            inst.components[compName] = JSON.parse(JSON.stringify(masterComp));
            inst.components[compName].isOverridden = false;

            // Kembalikan posisi koordinat
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

    // 4. Kirim data pembaruan ke Engine
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