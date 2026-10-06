import { computed } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';

export function useInspectorPrefab(selectedEntity, isEditingMasterPrefab) {
  const sceneStore = useSceneStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();

  const {
    recordAddComponent,
    recordRemoveComponent,
    recordPropChange,
    recordTransformChange
  } = useSceneHistory();

  const isLockedByPrefab = computed(() => {
    if (isEditingMasterPrefab.value || !selectedEntity.value) return false;
    
    let current = selectedEntity.value;
    while (current) {
      if (current.prefabId) return true; 
      if (!current.parentId) break;
      current = sceneStore.activeScene?.entities.find(e => e.id === current.parentId);
    }
    return false;
  });

  const prefabId = computed(() => isEditingMasterPrefab.value ? null : selectedEntity.value?.prefabId);
  const overridden = computed(() => isEditingMasterPrefab.value ? false : (selectedEntity.value?.overridden || false));
  const showSyncControls = computed(() => !isEditingMasterPrefab.value && !!prefabId.value);

  const getPrefabMaster = () => {
    if (!prefabId.value) return null;
    return prefabStore.getPrefabById(prefabId.value);
  };

  function getComponentOverrideStatus(compName) { 
    return computed(() => selectedEntity.value?.components?.[compName]?.overridden || false); 
  }

  function markAsOverridden() { 
    if (selectedEntity.value && prefabId.value && !overridden.value && !isEditingMasterPrefab.value) {
      sceneStore.updateEntityProp(selectedEntity.value.id, 'overridden', true); 
    }
  }

  function syncObject() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value.id;
    const tag = master.data.tag || 'Untagged';
    const active = master.data.active ?? true;

    const oldTag = selectedEntity.value.tag;
    const oldActive = selectedEntity.value.active;

    sceneStore.updateEntityProp(id, 'tag', tag);
    sceneStore.updateEntityProp(id, 'active', active);
    sceneStore.updateEntityProp(id, 'overridden', false);
    engineBridge.updateEntityProp({ id, prop: 'tag', value: tag });
    engineBridge.updateEntityProp({ id, prop: 'active', value: active });

    recordPropChange(id, 'tag', oldTag, tag);
    recordPropChange(id, 'active', oldActive, active);

    showPop({ title: 'Object Synced', type: 'success' });
  }

  async function syncComponent(compName) {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const masterCompData = master.data.components[compName];
    const id = selectedEntity.value.id;

    if (masterCompData) {
      const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));

      const cleanData = JSON.parse(JSON.stringify(masterCompData));
      if (compName === 'Transform' || compName === 'UITransform') {
        const currentEntity = sceneStore.activeScene.entities.find(e => e.id === id);
        const currentComp = currentEntity?.components[compName];
        if (currentComp) { cleanData.x = currentComp.x; cleanData.y = currentComp.y; }
      }
      cleanData.overridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e.id === id);
        if (entity && entity.components) entity.components[compName] = cleanData;
      }
      engineBridge.patchComponent({ entityId: id, componentName: compName, updates: cleanData });

      const newSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);

      showPop({ title: 'Component Synced', message: `${compName} reset (Position kept).`, type: 'success' });
    } else {
      await removeComponent(compName);
    }
  }

  function syncAllComponents() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value.id;
    const masterComps = master.data.components || {};
    const instanceComps = selectedEntity.value.components || {};

    const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));

    // 1. Buat objek komponen baru murni berdasarkan master
    const newComps = {};

    Object.keys(masterComps).forEach(key => {
      const cleanData = JSON.parse(JSON.stringify(masterComps[key]));
      if (key === 'Transform' || key === 'UITransform') {
        if (instanceComps[key]) { 
          cleanData.x = instanceComps[key].x; 
          cleanData.y = instanceComps[key].y; 
        }
      }
      cleanData.overridden = false;
      newComps[key] = cleanData;

      if (instanceComps[key]) {
        engineBridge.patchComponent({ entityId: id, componentName: key, updates: cleanData });
      } else {
        engineBridge.addComponent({ entityId: id, componentName: key, data: cleanData });
      }
    });

    // 2. Beritahu engineBridge untuk komponen yang terhapus (tidak ada di master)
    Object.keys(instanceComps).forEach(key => {
      if (!masterComps[key]) {
        engineBridge.removeComponent?.({ entityId: id, componentName: key });
      }
    });

    // 3. Langsung timpa objek components pada activeScene entity
    if (sceneStore.activeScene) {
      const entity = sceneStore.activeScene.entities.find(e => e.id === id);
      if (entity) {
        entity.components = newComps;
      }
    }

    sceneStore.updateEntityProp(id, 'overridden', false);

    const newSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
    recordTransformChange([{ id, oldSnapshot, newSnapshot }]);

    showPop({ title: 'All Synced', type: 'success' });
  }

  function unpackPrefab() {
    if (!selectedEntity.value || isEditingMasterPrefab.value) return;
    const id = selectedEntity.value.id;
    const oldPrefabId = selectedEntity.value.prefabId;

    sceneStore.updateEntityProp(id, 'prefabId', null);
    sceneStore.updateEntityProp(id, 'overridden', false);
    
    const comps = selectedEntity.value.components || {};
    Object.keys(comps).forEach(compName => sceneStore.updateComponentProp(id, compName, 'overridden', false));
    engineBridge.updateEntityProp({ id, prop: 'prefabId', value: null });

    recordPropChange(id, 'prefabId', oldPrefabId, null);

    showPop({ title: 'Unpacked', type: 'success' });
  }

  function addComponentToSelection(componentName) {
    if (!selectedEntity.value) return;
    
    if (isLockedByPrefab.value) {
      showPop({ title: 'Restricted', message: 'Cannot add components to a Prefab instance or its children. Unpack it first.', type: 'warning' });
      return;
    }

    if (isEditingMasterPrefab.value) {
      const hasComponent = selectedEntity.value.components && selectedEntity.value.components[componentName];
      if (hasComponent) return;
      prefabStore.addComponent(workspaceStore.activeTab.id, componentName);
      engineBridge.addPrefabMasterComponent?.({ prefabId: workspaceStore.activeTab.id, componentName: componentName });
    } else {
      const hasComponent = selectedEntity.value.components && selectedEntity.value.components[componentName];
      if (hasComponent) return;
      sceneStore.addComponent(selectedEntity.value.id, componentName);
      recordAddComponent(selectedEntity.value.id, componentName);
    }
  }

  async function removeComponent(compName) {
    if (!selectedEntity.value) return;
    
    if (isLockedByPrefab.value) {
      showPop({ title: 'Restricted', message: 'Cannot remove components from a Prefab instance or its children. Unpack it first.', type: 'warning' });
      return;
    }

    if (isEditingMasterPrefab.value) {
      prefabStore.removeComponent(workspaceStore.activeTab.id, compName);
      engineBridge.removePrefabMasterComponent?.({ prefabId: workspaceStore.activeTab.id, componentName: compName });
    } else {
      const savedComponentData = selectedEntity.value.components?.[compName];
      await sceneStore.removeComponent(selectedEntity.value.id, compName);
      recordRemoveComponent(selectedEntity.value.id, compName, savedComponentData);
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
    syncAllComponents,
    unpackPrefab,
    addComponentToSelection,
    removeComponent
  };
}