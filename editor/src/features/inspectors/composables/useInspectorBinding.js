import { computed } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';

// Import internal composables as fallback if parameters are not explicitly passed
import { useInspectorSelection } from './useInspectorSelection.js';
import { useInspectorPrefab } from './useInspectorPrefab.js';

export function useInspectorBinding(
  selectedEntityParam, 
  isEditingMasterPrefabParam, 
  prefabIdParam, 
  markAsOverriddenParam
) {
  // Internal fallback if not passed from Vue component
  const selection = useInspectorSelection();
  const prefab = useInspectorPrefab();

  const selectedEntity = selectedEntityParam || selection.selectedEntity;
  const isEditingMasterPrefab = isEditingMasterPrefabParam !== undefined 
    ? isEditingMasterPrefabParam 
    : selection.isEditingMasterPrefab;
  
  const prefabId = prefabIdParam || prefab.prefabId;
  const markAsOverridden = markAsOverriddenParam || prefab.markAsOverridden;

  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();
  const assetStore = useAssetStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();

  const { recordComponentChange } = useSceneHistory();

  const getEditingMaster = () => {
    if (typeof isEditingMasterPrefab === 'boolean') return isEditingMasterPrefab;
    return !!isEditingMasterPrefab?.value;
  };

  const getEntity = () => selectedEntity?.value || null;
  const getPrefabIdVal = () => {
    const idVal = typeof prefabId === 'string' ? prefabId : prefabId?.value;
    if (idVal) return idVal;
    // Fallback directly to selected entity
    return getEntity()?.prefabId || null;
  };

  function bindSettingProp(category, propName) {
    return computed({
      get: () => {
        if (category === 'ui' || category === 'grid' || category === 'camera') {
          return projectStore.project?.settings?.[category]?.[propName];
        }
        // Include initialSceneId as project settings property
        if (!category && (propName === 'tickRate' || propName === 'initialSceneId')) {
          return projectStore.project?.settings?.[propName];
        }
        const s = sceneStore.activeScene?.settings;
        if (!s) return undefined;
        return category ? s[category]?.[propName] : s[propName];
      },
      set: (val) => {
        if (category === 'ui') projectStore.updateUISettings({ [propName]: val });
        else if (category === 'grid') {
          const grid = projectStore.project.settings.grid;
          if (propName === 'width') projectStore.setGridSize(val, grid.height);
          else if (propName === 'height') projectStore.setGridSize(grid.width, val);
          else if (propName === 'color') projectStore.setGridColor(val);
          else if (propName === 'opacity') projectStore.setGridOpacity(val);
          else if (propName === 'visible' && val !== grid.visible) projectStore.toggleGrid();
          else if (propName === 'snap' && val !== grid.snap) projectStore.toggleMagnet();
        }
        else if (category === 'camera') projectStore.updateCameraSettings({ [propName]: val });
        else if (!category && propName === 'tickRate') projectStore.setTickRate(val);
        // Handle saving initialSceneId to projectStore
        else if (!category && propName === 'initialSceneId') {
          if (typeof projectStore.setInitialSceneId === 'function') {
            projectStore.setInitialSceneId(val);
          } else {
            projectStore.project.settings.initialSceneId = val;
            projectStore.markAsDirty();
          }
        }
        else if (!sceneStore.activeScene) return;
        else if (category === 'worldBounds') sceneStore.updateWorldBounds({ [propName]: val });
        else if (category === 'physics') sceneStore.updatePhysicsSettings({ [propName]: val });
        else if (!category) {
          if (propName === 'backgroundColor') sceneStore.setBackgroundColor(val);
          else if (propName === 'showRulers' && val !== sceneStore.activeScene.settings.showRulers) sceneStore.toggleRulers();
        }
      }
    });
  }

  function bindEntityProp(propName) {
    return computed({
      get: () => getEntity() ? getEntity()[propName] : '',
      set: (val) => {
        const ent = getEntity();
        if (!ent) return;
        const oldVal = ent[propName];
        if (oldVal === val) return;

        if (getEditingMaster()) {
          prefabStore.updatePrefab(workspaceStore.activeTab.id, { [propName]: val });
          engineBridge.updatePrefabMasterProp?.({ prefabId: workspaceStore.activeTab.id, prop: propName, value: val });
        } else {
          sceneStore.updateEntityProp(ent.id, propName, val);
        }
      }
    });
  }

  function bindComponentProp(compName, propName, precision = null) {
    return computed({
      get: () => {
        const comp = getEntity()?.components?.[compName];
        if (!comp || !propName) return undefined;
        const keys = String(propName).split('.');
        let current = comp;
        for (const key of keys) {
          if (current === null || current === undefined) return undefined;
          current = current[key];
        }
        return current;
      },
      set: (val) => {
        const ent = getEntity();
        if (!ent) return;

        let finalVal = val;
        if (propName === 'scaleX' || propName === 'scaleY') finalVal = Math.max(1, Math.round(val));
        else if (precision !== null && typeof val === 'number') {
          const factor = Math.pow(10, precision);
          finalVal = Math.round(val * factor) / factor;
        }

        const comp = ent.components?.[compName];
        let oldVal = comp;
        if (comp && propName) {
          const keys = String(propName).split('.');
          for (const key of keys) {
            if (oldVal === null || oldVal === undefined) { oldVal = undefined; break; }
            oldVal = oldVal[key];
          }
        } else {
          oldVal = undefined;
        }

        if (oldVal === finalVal) return;

        const applyUpdate = (pName, pValue) => {
          if (getEditingMaster()) {
            prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, pName, pValue);
            engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: pName, value: pValue });
          } else {
            const id = ent.id;
            sceneStore.updateComponentProp(id, compName, pName, pValue);
            if (getPrefabIdVal()) {
              if (pName !== 'x' && pName !== 'y') sceneStore.updateComponentProp(id, compName, 'overridden', true);
            }

            engineBridge.updateComponentProp?.({
              entityId: id,
              componentName: compName,
              path: pName,
              value: pValue
            });

            recordComponentChange(id, compName, pName, oldVal, pValue);
          }
        };

        applyUpdate(propName, finalVal);

        if (propName === 'scaleX' || propName === 'scaleY') {
          if (comp && comp.isScaleLocked) {
            const linkedProp = propName === 'scaleX' ? 'scaleY' : 'scaleX';
            applyUpdate(linkedProp, finalVal);
          }
        }
      }
    });
  }

  function updateScriptInstance(index, fieldPath, value) {
    const ent = getEntity();
    if (!ent) return;
    const fullPath = `data.${index}.${fieldPath}`;

    if (getEditingMaster()) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', fullPath, value);
    } else {
      const id = ent.id;
      const oldVal = ent.components?.ScriptController?.data?.[index]?.[fieldPath];

      sceneStore.updateComponentProp(id, 'ScriptController', fullPath, value);
      recordComponentChange(id, 'ScriptController', fullPath, oldVal, value);
    }
  }

  const scriptsData = computed(() => getEntity()?.components?.ScriptController?.data || []);

  function addScript(assetId) {
    const ent = getEntity();
    if (!ent) return;
    const newInstance = { id: `inst_${Date.now()}_${crypto.randomUUID().split('-')[0]}`, assetId, active: true, variables: {} };
    
    const currentList = scriptsData.value ? JSON.parse(JSON.stringify(scriptsData.value)) : [];
    currentList.push(newInstance);

    if (getEditingMaster()) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
      const id = ent.id;
      const oldList = JSON.parse(JSON.stringify(scriptsData.value));

      sceneStore.updateComponentProp(id, 'ScriptController', 'data', currentList);
      recordComponentChange(id, 'ScriptController', 'data', oldList, currentList);

      if (getPrefabIdVal()) {
        sceneStore.updateComponentProp(id, 'ScriptController', 'overridden', true);
        if (typeof markAsOverridden === 'function') markAsOverridden();
      }
    }
  }

  function removeScript(index) {
    const ent = getEntity();
    if (!ent) return;
    
    const currentList = JSON.parse(JSON.stringify(scriptsData.value));
    currentList.splice(index, 1);

    if (getEditingMaster()) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
      const id = ent.id;
      const oldList = JSON.parse(JSON.stringify(scriptsData.value));

      sceneStore.updateComponentProp(id, 'ScriptController', 'data', currentList);
      recordComponentChange(id, 'ScriptController', 'data', oldList, currentList);

      if (getPrefabIdVal()) {
        sceneStore.updateComponentProp(id, 'ScriptController', 'overridden', true);
        if (typeof markAsOverridden === 'function') markAsOverridden();
      }
    }
  }

  const currentTextureUrl = computed(() => {
    const ent = getEntity();
    if (!ent) return null;
    const comp = ent.components?.SpriteRenderer || ent.components?.Tilemap;
    if (!comp?.assetId) return null;
    return assetStore.getAssetUrlById(comp.assetId);
  });

  function updateUISettingsBulk(updates) { 
    if (projectStore.project) projectStore.updateUISettings(updates); 
  }

  function resetTextRatio() {
    const ent = getEntity();
    if (!ent) return;
    const tr = ent.components?.TextRenderer;
    if (!tr) return;

    const id = ent.id;
    const oldVal = tr.fontSize;

    sceneStore.updateComponentProp(id, 'TextRenderer', 'fontSize', tr.fontSize);
    recordComponentChange(id, 'TextRenderer', 'fontSize', oldVal, tr.fontSize);
  }

  return {
    scriptsData,
    currentTextureUrl,
    bindSettingProp,
    bindEntityProp,
    bindComponentProp,
    updateScriptInstance,
    addScript,
    removeScript,
    updateUISettingsBulk,
    resetTextRatio
  };
}