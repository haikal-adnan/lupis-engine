import { computed } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';

export function useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden) {
  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();
  const assetStore = useAssetStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();

  const { recordComponentChange, recordPropChange } = useSceneHistory();

  function bindSettingProp(category, propName) {
    return computed({
      get: () => {
        if (category === 'ui' || category === 'grid' || category === 'camera') {
          return projectStore.project?.settings?.[category]?.[propName];
        }
        if (!category && propName === 'tickRate') {
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
      get: () => selectedEntity.value ? selectedEntity.value[propName] : '',
      set: (val) => {
        if (!selectedEntity.value) return;
        const oldVal = selectedEntity.value[propName];
        if (oldVal === val) return;

        if (isEditingMasterPrefab.value) {
          prefabStore.updatePrefab(workspaceStore.activeTab.id, { [propName]: val });
          engineBridge.updatePrefabMasterProp?.({ prefabId: workspaceStore.activeTab.id, prop: propName, value: val });
        } else {
          sceneStore.updateEntityProp(selectedEntity.value.id, propName, val);
          recordPropChange(selectedEntity.value.id, propName, oldVal, val);
        }
      }
    });
  }

  function bindComponentProp(compName, propName, precision = null) {
    return computed({
      get: () => selectedEntity.value?.components?.[compName]?.[propName],
      set: (val) => {
        if (!selectedEntity.value) return;

        let finalVal = val;
        if (propName === 'scaleX' || propName === 'scaleY') finalVal = Math.max(1, Math.round(val));
        else if (precision !== null && typeof val === 'number') {
          const factor = Math.pow(10, precision);
          finalVal = Math.round(val * factor) / factor;
        }

        const oldVal = selectedEntity.value?.components?.[compName]?.[propName];
        if (oldVal === finalVal) return;

        const applyUpdate = (pName, pValue) => {
          if (isEditingMasterPrefab.value) {
            prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, pName, pValue);
            engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: pName, value: pValue });
          } else {
            const id = selectedEntity.value.id;
            sceneStore.updateComponentProp(id, compName, pName, pValue);
            if (prefabId.value) {
              if (pName !== 'x' && pName !== 'y') sceneStore.updateComponentProp(id, compName, 'overridden', true);
            }

            engineBridge.updateComponentProp({
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
          const comp = selectedEntity.value.components[compName];
          if (comp && comp.isScaleLocked) {
            const linkedProp = propName === 'scaleX' ? 'scaleY' : 'scaleX';
            applyUpdate(linkedProp, finalVal);
          }
        }
      }
    });
  }

  function updateScriptInstance(index, fieldPath, value) {
    if (!selectedEntity.value) return;
    const fullPath = `data.${index}.${fieldPath}`;

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', fullPath, value);
    } else {
      const id = selectedEntity.value.id;
      const oldVal = selectedEntity.value.components?.ScriptController?.data?.[index]?.[fieldPath];

      sceneStore.updateComponentProp(id, 'ScriptController', fullPath, value);
      recordComponentChange(id, 'ScriptController', fullPath, oldVal, value);
    }
  }

  const scriptsData = computed(() => selectedEntity.value?.components?.ScriptController?.data || []);

  function addScript(assetId) {
    if (!selectedEntity.value) return;
    const newInstance = { id: `inst_${crypto.randomUUID().split('-')[0]}`, assetId, active: true, variables: {} };
    const currentList = [...scriptsData.value, newInstance];

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
      const id = selectedEntity.value.id;
      const oldList = JSON.parse(JSON.stringify(scriptsData.value));

      sceneStore.updateComponentProp(id, 'ScriptController', 'data', currentList);
      recordComponentChange(id, 'ScriptController', 'data', oldList, currentList);

      if (prefabId.value) markAsOverridden();
    }
  }

  function removeScript(index) {
    if (!selectedEntity.value) return;
    const currentList = [...scriptsData.value];
    currentList.splice(index, 1);

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
      const id = selectedEntity.value.id;
      const oldList = JSON.parse(JSON.stringify(scriptsData.value));

      sceneStore.updateComponentProp(id, 'ScriptController', 'data', currentList);
      recordComponentChange(id, 'ScriptController', 'data', oldList, currentList);

      if (prefabId.value) markAsOverridden();
    }
  }

  const currentTextureUrl = computed(() => {
    if (!selectedEntity.value) return null;
    const comp = selectedEntity.value.components?.SpriteRenderer || selectedEntity.value.components?.Tilemap;
    if (!comp?.assetId) return null;
    return assetStore.getAssetUrlById(comp.assetId);
  });

  function updateUISettingsBulk(updates) { 
    if (projectStore.project) projectStore.updateUISettings(updates); 
  }

  function resetTextRatio() {
    if (!selectedEntity.value) return;
    const tr = selectedEntity.value.components?.TextRenderer;
    if (!tr) return;

    const id = selectedEntity.value.id;
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