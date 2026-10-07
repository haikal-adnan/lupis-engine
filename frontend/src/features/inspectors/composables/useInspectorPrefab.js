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

  function markAsOverridden() { 
    const ent = getEntity();
    if (ent && prefabId.value && !overridden.value && !getEditingMaster()) {
      sceneStore.updateEntityProp(ent.id, 'overridden', true); 
    }
  }

  function syncObject() {
    const ent = getEntity();
    if (!ent || !prefabId.value || getEditingMaster()) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = ent.id;
    const tag = master.data.tag || 'Untagged';
    const active = master.data.active ?? true;

    const oldTag = ent.tag;
    const oldActive = ent.active;

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
        if (currentComp) { cleanData.x = currentComp.x; cleanData.y = currentComp.y; }
      }
      cleanData.overridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e.id === id);
        if (entity && entity.components) entity.components[compName] = cleanData;
      }
      engineBridge.patchComponent({ entityId: id, componentName: compName, updates: cleanData });

      const newSnapshot = JSON.parse(JSON.stringify(getEntity()));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);

      showPop({ title: 'Component Synced', message: `${compName} reset (Position kept).`, type: 'success' });
    } else {
      await removeComponent(compName);
    }
  }

  function syncAllComponents() {
    const ent = getEntity();
    if (!ent || !prefabId.value || getEditingMaster()) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = ent.id;
    const masterComps = master.data.components || {};
    const instanceComps = ent.components || {};

    const oldSnapshot = JSON.parse(JSON.stringify(ent));

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

    Object.keys(instanceComps).forEach(key => {
      if (!masterComps[key]) {
        engineBridge.removeComponent?.({ entityId: id, componentName: key });
      }
    });

    if (sceneStore.activeScene) {
      const entity = sceneStore.activeScene.entities.find(e => e.id === id);
      if (entity) {
        entity.components = newComps;
      }
    }

    sceneStore.updateEntityProp(id, 'overridden', false);

    const newSnapshot = JSON.parse(JSON.stringify(getEntity()));
    recordTransformChange([{ id, oldSnapshot, newSnapshot }]);

    showPop({ title: 'All Synced', type: 'success' });
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
      engineBridge.removePrefabMasterComponent?.({ prefabId: workspaceStore.activeTab.id, componentName: compName });
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
    syncAllComponents,
    unpackPrefab,
    addComponentToSelection,
    removeComponent
  };
}