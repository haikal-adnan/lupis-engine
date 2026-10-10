import { computed } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';
import { useInspectorSelection } from './useInspectorSelection.js';

export function useInspectorPrefab(selectedEntityParam, isEditingMasterPrefabParam) {
  const sceneStore = useSceneStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();

  // FALLBACK INTERNAL: Ambil selection secara otomatis jika parameter tidak dipassing
  const selection = useInspectorSelection();
  const selectedEntity = selectedEntityParam || selection.selectedEntity;
  const isEditingMasterPrefab = isEditingMasterPrefabParam !== undefined 
    ? isEditingMasterPrefabParam 
    : selection.isEditingMasterPrefab;

  const {
    recordAddComponent,
    recordRemoveComponent,
    recordPropChange,
    recordTransformChange
  } = useSceneHistory();

  const getEditingMaster = () => {
    if (typeof isEditingMasterPrefab === 'boolean') return isEditingMasterPrefab;
    return !!isEditingMasterPrefab?.value;
  };

  const getEntity = () => selectedEntity?.value || null;

  const isLockedByPrefab = computed(() => {
    const ent = getEntity();
    if (getEditingMaster() || !ent) return false;
    
    let current = ent;
    while (current) {
      if (current.prefabId) return true; 
      if (!current.parentId) break;
      current = sceneStore.activeScene?.entities.find(e => e.id === current.parentId);
    }
    return false;
  });

  const prefabId = computed(() => {
    if (getEditingMaster()) return null;
    return getEntity()?.prefabId || null;
  });

  const overridden = computed(() => getEditingMaster() ? false : (getEntity()?.overridden || false));
  const showSyncControls = computed(() => !getEditingMaster() && !!prefabId.value);

  const getPrefabMaster = () => {
    if (!prefabId.value) return null;
    return prefabStore.getPrefabById(prefabId.value);
  };

  function getComponentOverrideStatus(compName) { 
    return computed(() => getEntity()?.components?.[compName]?.overridden || false); 
  }

  function markAsOverridden(componentName) {
    const ent = getEntity();
    if (ent && prefabId.value && !getEditingMaster()) {
      sceneStore.updateEntityProp(ent.id, 'overridden', true);
      if (componentName && ent.components?.[componentName]) {
        sceneStore.updateComponentProp(ent.id, componentName, 'overridden', true);
      }
    }
  }

  function syncObject() {
    const ent = getEntity();
    if (!ent || !prefabId.value || getEditingMaster()) {
      console.warn('[syncObject] Aborted: Entity missing, not a prefab instance, or currently editing master prefab.', {
        entity: ent,
        prefabId: prefabId.value,
        isEditingMaster: getEditingMaster()
      });
      return;
    }

    const master = getPrefabMaster();
    if (!master) {
      console.error('[syncObject] Aborted: Master Prefab data not found for ID:', prefabId.value);
      return;
    }

    const id = ent.id;
    console.group(`[syncObject] Executing Sync for Entity: "${ent.name || id}" (${id})`);
    console.log('📍 Master Prefab Source:', master);
    console.log('📍 Entity Snapshot Before Sync:', JSON.parse(JSON.stringify(ent)));

    const oldSnapshot = JSON.parse(JSON.stringify(ent));

    // 1. Reset Komponen ke Master Prefab
    console.groupCollapsed('⚙️ Step 1: Syncing Components');
    const masterComps = master.data.components || {};
    const instanceComps = ent.components || {};
    const newComps = {};

    // Patch atau Tambahkan Komponen dari Master
    Object.keys(masterComps).forEach(key => {
      const cleanData = JSON.parse(JSON.stringify(masterComps[key]));

      // Proteksi Transform & UITransform agar Posisi Instance Tidak Berubah
      if (key === 'Transform' || key === 'UITransform') {
        if (instanceComps[key]) {
          cleanData.x = instanceComps[key].x;
          cleanData.y = instanceComps[key].y;
          console.log(`  └─ [${key}] Preserving instance position: (${cleanData.x}, ${cleanData.y})`);
        }
      }

      cleanData.overridden = false;
      newComps[key] = cleanData;

      if (instanceComps[key]) {
        console.log(`  ├─ Patching component [${key}]:`, cleanData);
        engineBridge.patchComponent({ entityId: id, componentName: key, updates: cleanData });
      } else {
        console.log(`  ├─ Adding missing component [${key}]:`, cleanData);
        engineBridge.addComponent({ entityId: id, componentName: key, data: cleanData });
      }
    });

    // Hapus Komponen Ekstra yang Hanya Ada di Instance
    Object.keys(instanceComps).forEach(key => {
      if (!masterComps[key]) {
        console.log(`  └─ Removing extra instance component [${key}]`);
        engineBridge.removeComponent?.({ entityId: id, componentName: key });
      }
    });

    // Update State Scene Store untuk Komponen
    if (sceneStore.activeScene) {
      const entity = sceneStore.activeScene.entities.find(e => e.id === id);
      if (entity) {
        entity.components = newComps;
        console.log('  ✔ SceneStore entity.components updated to:', newComps);
      }
    }
    console.groupEnd();

    // 2. Reset Entity Properties (tag, active, overridden)
    console.groupCollapsed('🏷️ Step 2: Syncing Entity Properties & Recording History');
    const tag = master.data.tag || 'Untagged';
    const active = master.data.active ?? true;

    const oldTag = ent.tag;
    const oldActive = ent.active;

    console.log(`  ├─ Tag: "${oldTag}" ➔ "${tag}"`);
    console.log(`  ├─ Active: ${oldActive} ➔ ${active}`);
    console.log('  └─ Overridden Flag: true ➔ false');

    sceneStore.updateEntityProp(id, 'tag', tag);
    sceneStore.updateEntityProp(id, 'active', active);
    sceneStore.updateEntityProp(id, 'overridden', false);

    engineBridge.updateEntityProp({ id, prop: 'tag', value: tag });
    engineBridge.updateEntityProp({ id, prop: 'active', value: active });

    // Record History Undo/Redo
    recordPropChange(id, 'tag', oldTag, tag);
    recordPropChange(id, 'active', oldActive, active);

    const newSnapshot = JSON.parse(JSON.stringify(getEntity()));
    recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    console.log('  ✔ Recorded history undo/redo snapshot.');
    console.groupEnd();

    showPop({ title: 'Reverted to Prefab', type: 'success' });
    console.log('✅ [syncObject] Sync Completed Successfully.');
    console.groupEnd();
  }

  async function syncComponent(compName) {
    const ent = getEntity();
    if (!ent || !prefabId.value || getEditingMaster()) return;
    const master = getPrefabMaster();
    if (!master) return;
    const masterCompData = master.data.components[compName];
    const id = ent.id;

    if (masterCompData) {
        const oldSnapshot = JSON.parse(JSON.stringify(ent));
        const cleanData = JSON.parse(JSON.stringify(masterCompData));

        if (compName === 'Transform' || compName === 'UITransform') {
            const currentEntity = sceneStore.activeScene?.entities.find(e => e.id === id);
            const currentComp = currentEntity?.components?.[compName];
            if (currentComp) { 
                cleanData.x = currentComp.x; 
                cleanData.y = currentComp.y; 
            }
        }
        
        cleanData.overridden = false;

        if (sceneStore.activeScene) {
            const entity = sceneStore.activeScene.entities.find(e => e.id === id);
            if (entity && entity.components) {
                entity.components[compName] = cleanData;
            }
        }

        // Kirim pembaruan lengkap ke engine
        engineBridge.patchComponent({ entityId: id, componentName: compName, updates: cleanData });

        const newSnapshot = JSON.parse(JSON.stringify(getEntity()));
        recordTransformChange([{ id, oldSnapshot, newSnapshot }]);

        showPop({ title: 'Component Synced', message: `${compName} reset (Position kept).`, type: 'success' });
    } else {
        await removeComponent(compName);
    }
  }

  function unpackPrefab() {
    const ent = getEntity();
    if (!ent || getEditingMaster()) return;
    const id = ent.id;
    const oldPrefabId = ent.prefabId;

    sceneStore.updateEntityProp(id, 'prefabId', null);
    sceneStore.updateEntityProp(id, 'overridden', false);
    
    const comps = ent.components || {};
    Object.keys(comps).forEach(compName => sceneStore.updateComponentProp(id, compName, 'overridden', false));
    engineBridge.updateEntityProp({ id, prop: 'prefabId', value: null });

    recordPropChange(id, 'prefabId', oldPrefabId, null);

    showPop({ title: 'Unpacked', type: 'success' });
  }

  function addComponentToSelection(componentName) {
    const ent = getEntity();
    if (!ent) return;
    
    if (isLockedByPrefab.value) {
      showPop({ title: 'Restricted', message: 'Cannot add components to a Prefab instance or its children. Unpack it first.', type: 'warning' });
      return;
    }

    if (getEditingMaster()) {
      const hasComponent = ent.components && ent.components[componentName];
      if (hasComponent) return;
      prefabStore.addComponent(workspaceStore.activeTab.id, componentName);
      engineBridge.addPrefabMasterComponent?.({ prefabId: workspaceStore.activeTab.id, componentName: componentName });
    } else {
      const hasComponent = ent.components && ent.components[componentName];
      if (hasComponent) return;
      sceneStore.addComponent(ent.id, componentName);
      recordAddComponent(ent.id, componentName);
    }
  }

  async function removeComponent(compName) {
    const ent = getEntity();
    if (!ent) return;
    
    if (isLockedByPrefab.value) {
      showPop({ title: 'Restricted', message: 'Cannot remove components from a Prefab instance or its children. Unpack it first.', type: 'warning' });
      return;
    }

    if (getEditingMaster()) {
      prefabStore.removeComponent(workspaceStore.activeTab.id, compName);
      // UBAH compName menjadi componentName agar konsisten dengan payload lainnya
      engineBridge.removePrefabMasterComponent?.({ 
        prefabId: workspaceStore.activeTab.id, 
        componentName: compName 
      });
    } else {
      const savedComponentData = ent.components?.[compName];
      await sceneStore.removeComponent(ent.id, compName);
      recordRemoveComponent(ent.id, compName, savedComponentData);
    }
  }

  return {
    isLockedByPrefab,
    prefabId,
    overridden,
    showSyncControls,
    getPrefabMaster,
    getComponentOverrideStatus,
    markAsOverridden,
    syncObject,
    syncComponent,
    unpackPrefab,
    addComponentToSelection,
    removeComponent
  };
}