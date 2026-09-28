import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useSceneStore } from '@scenes/scenes.js';
import { useProjectStore } from '@projects/projects.js';
import { useAssetStore } from '@assets/assets.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();
  const assetStore = useAssetStore();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();

  const {
    recordComponentChange,
    recordPropChange,
    recordAddComponent,
    recordRemoveComponent,
    recordTransformChange
  } = useSceneHistory();

  const getTransformCompName = (entity) => {
    if (!entity) return 'Transform';
    return entity.components?.UITransform ? 'UITransform' : 'Transform';
  };

  const isEditingMasterPrefab = computed(() => workspaceStore.activeTab?.type === 'prefab');

  const selectedLayerId = computed(() => {
    if (isEditingMasterPrefab.value) return null;
    if (sceneStore.selectedEntityIds.length !== 1) return null;
    
    const id = sceneStore.selectedEntityIds[0];
    const isLayer = sceneStore.activeLayers?.some(l => l.id === id);
    return isLayer ? id : null;
  });

  const topLevelSelection = computed(() => {
    if (!sceneStore.activeScene || sceneStore.selectedEntityIds.length === 0) return [];
    const hasSelectedAncestor = (entityId) => {
      let current = sceneStore.activeScene.entities.find(e => e.id === entityId);
      while (current && current.parentId) {
        if (sceneStore.selectedEntityIds.includes(current.parentId)) return true;
        current = sceneStore.activeScene.entities.find(e => e.id === current.parentId);
      }
      return false;
    };
    return sceneStore.selectedEntityIds.filter(id => !hasSelectedAncestor(id));
  });

  const selectedEntity = computed(() => {
    if (isEditingMasterPrefab.value) {
      const prefabId = workspaceStore.activeTab.id;
      const prefab = prefabStore.getPrefabById(prefabId);
      return prefab ? prefab.data : null;
    }
    if (selectedLayerId.value) return null; 
    if (topLevelSelection.value.length === 1) {
      const id = topLevelSelection.value[0];
      return sceneStore.activeScene.entities.find(e => e.id === id);
    }
    return null;
  });

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

  const isMultiSelection = computed(() => !isEditingMasterPrefab.value && topLevelSelection.value.length > 1);
  const hasSelection = computed(() => !!selectedEntity.value || !!selectedLayerId.value);
  const prefabId = computed(() => isEditingMasterPrefab.value ? null : selectedEntity.value?.prefabId);
  const overridden = computed(() => isEditingMasterPrefab.value ? false : (selectedEntity.value?.overridden || false));
  const locked = computed(() => selectedEntity.value?._editor?.locked || false);
  
  const isSizeLockedByText = computed(() => {
    if (!selectedEntity.value) return false;
    const textComp = selectedEntity.value.components?.TextRenderer;
    return !!(textComp && textComp.autoFit);
  });

  const isSizeLockedByTilemap = computed(() => {
    if (!selectedEntity.value) return false;
    const tilemapComp = selectedEntity.value.components?.Tilemap;
    return !!(tilemapComp && tilemapComp.autoFit);
  });

  const showSyncControls = computed(() => !isEditingMasterPrefab.value && !!prefabId.value);

  const getPrefabMaster = () => {
    if (!prefabId.value) return null;
    return prefabStore.getPrefabById(prefabId.value);
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape" && hasSelection.value && !isEditingMasterPrefab.value) {
      sceneStore.clearSelection();
    }
  };

  onMounted(() => window.addEventListener("keydown", handleKeydown));
  onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));

  const getGlobalTransform = (entityId) => {
    const entity = sceneStore.activeScene?.entities.find(e => e.id === entityId);
    if (!entity) return null;
    const t = entity.components?.Transform || entity.components?.UITransform;
    if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

    if (!entity.parentId) return { ...t, width: t.width, height: t.height };

    const parentGlobal = getGlobalTransform(entity.parentId);
    if (!parentGlobal) return { ...t, width: t.width, height: t.height };

    const rad = parentGlobal.rotation * (Math.PI / 180);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const sX = t.x * parentGlobal.scaleX;
    const sY = t.y * parentGlobal.scaleY;

    const rX = sX * cos - sY * sin;
    const rY = sX * sin + sY * cos;

    return {
      x: parentGlobal.x + rX,
      y: parentGlobal.y + rY,
      rotation: parentGlobal.rotation + (t.rotation || 0),
      scaleX: parentGlobal.scaleX * (t.scaleX ?? 1),
      scaleY: parentGlobal.scaleY * (t.scaleY ?? 1),
      pivotX: t.pivotX ?? 0.5,
      pivotY: t.pivotY ?? 0.5,
      width: t.width,
      height: t.height
    };
  };

  const globalTransformData = computed(() => {
    if (!selectedEntity.value || !selectedEntity.value.parentId) return null; 
    return getGlobalTransform(selectedEntity.value.id);
  });

  const globalScaleX = computed(() => globalTransformData.value ? Number(globalTransformData.value.scaleX).toFixed(2) : null);
  const globalScaleY = computed(() => globalTransformData.value ? Number(globalTransformData.value.scaleY).toFixed(2) : null);
  
  const globalRotation = computed(() => {
    if (!globalTransformData.value) return null;
    let rot = globalTransformData.value.rotation % 360;
    if (rot < 0) rot += 360;
    return rot.toFixed(2);
  });

  const hasChildren = computed(() => {
    if (!selectedEntity.value || !sceneStore.activeScene) return false;
    return sceneStore.activeScene.entities.some(e => e.parentId === selectedEntity.value.id);
  });

  const fitToChildren = () => {
    if (!selectedEntity.value) return;
    const parentId = selectedEntity.value.id;
    
    const getDescendants = (pId) => {
      let arr = [];
      const children = sceneStore.activeScene.entities.filter(e => e.parentId === pId);
      for (const c of children) {
        arr.push(c);
        arr = arr.concat(getDescendants(c.id));
      }
      return arr;
    };

    const descendants = getDescendants(parentId);
    if (descendants.length === 0) return;

    const parentGlobal = getGlobalTransform(parentId);
    if (!parentGlobal) return;

    const invRad = -parentGlobal.rotation * (Math.PI / 180);
    const cos = Math.cos(invRad);
    const sin = Math.sin(invRad);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    descendants.forEach(d => {
      const gT = getGlobalTransform(d.id);
      if (!gT) return;

      const w = gT.width;
      const h = gT.height;
      const px = gT.pivotX;
      const py = gT.pivotY;
      const sx = gT.scaleX;
      const sy = gT.scaleY;
      
      const rad = gT.rotation * (Math.PI / 180);
      const cRot = Math.cos(rad);
      const sRot = Math.sin(rad);

      const corners = [
        { x: -px * w * sx, y: -py * h * sy },
        { x: (1 - px) * w * sx, y: -py * h * sy },
        { x: -px * w * sx, y: (1 - py) * h * sy },
        { x: (1 - px) * w * sx, y: (1 - py) * h * sy }
      ];

      corners.forEach(pt => {
        const wx = gT.x + pt.x * cRot - pt.y * sRot;
        const wy = gT.y + pt.x * sRot + pt.y * cRot;

        const dx = wx - parentGlobal.x;
        const dy = wy - parentGlobal.y;

        const lx = (dx * cos - dy * sin) / parentGlobal.scaleX;
        const ly = (dx * sin + dy * cos) / parentGlobal.scaleY;

        minX = Math.min(minX, lx);
        maxX = Math.max(maxX, lx);
        minY = Math.min(minY, ly);
        maxY = Math.max(maxY, ly);
      });
    });

    if (minX === Infinity) return;

    const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));

    const newWidth = Math.max(1, Math.round(maxX - minX));
    const newHeight = Math.max(1, Math.round(maxY - minY));
    
    const newPivotX = newWidth > 0 ? -minX / newWidth : 0.5;
    const newPivotY = newHeight > 0 ? -minY / newHeight : 0.5;

    const compName = getTransformCompName(selectedEntity.value);
    
    sceneStore.updateComponentProp(parentId, compName, 'width', newWidth);
    sceneStore.updateComponentProp(parentId, compName, 'height', newHeight);
    sceneStore.updateComponentProp(parentId, compName, 'pivotX', newPivotX);
    sceneStore.updateComponentProp(parentId, compName, 'pivotY', newPivotY);

    engineBridge.patchComponent({
      entityId: parentId,
      componentName: compName,
      updates: { width: newWidth, height: newHeight, pivotX: newPivotX, pivotY: newPivotY }
    });

    const newSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
    recordTransformChange([{ id: parentId, oldSnapshot, newSnapshot }]);

    showPop({ title: 'Fit to Children', message: 'Parent size successfully adjusted.', type: 'success' });
  };

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

  function getComponentOverrideStatus(compName) { return computed(() => selectedEntity.value?.components?.[compName]?.overridden || false); }
  function markAsOverridden() { if (selectedEntity.value && prefabId.value && !overridden.value && !isEditingMasterPrefab.value) sceneStore.updateEntityProp(selectedEntity.value.id, 'overridden', true); }
  
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

  function syncComponent(compName) {
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
    } else removeComponent(compName);
  }

  function syncAllComponents() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value.id;
    const masterComps = master.data.components || {};
    const instanceComps = selectedEntity.value.components || {};

    const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));

    Object.keys(masterComps).forEach(key => {
      const cleanData = JSON.parse(JSON.stringify(masterComps[key]));
      if (key === 'Transform' || key === 'UITransform') {
        if (instanceComps[key]) { cleanData.x = instanceComps[key].x; cleanData.y = instanceComps[key].y; }
      }
      cleanData.overridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e.id === id);
        if (entity) {
          if (!entity.components) entity.components = {};
          entity.components[key] = cleanData;
        }
      }
      if (instanceComps[key]) engineBridge.patchComponent({ entityId: id, componentName: key, updates: cleanData });
      else engineBridge.addComponent({ entityId: id, componentName: key, data: cleanData });
    });

    Object.keys(instanceComps).forEach(key => { if (!masterComps[key]) sceneStore.removeComponent(id, key); });
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

  function removeComponent(compName) {
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
      sceneStore.removeComponent(selectedEntity.value.id, compName);
      recordRemoveComponent(selectedEntity.value.id, compName, savedComponentData);
    }
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const compName = getTransformCompName(selectedEntity.value);
    const updates = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false };
    
    if (compName === 'UITransform') {
      updates.anchorX = 0.5;
      updates.anchorY = 0.5;
    }

    if (isEditingMasterPrefab.value) {
      Object.entries(updates).forEach(([prop, val]) => {
        prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, prop, val);
      });
    } else {
      const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
      const id = selectedEntity.value.id;

      Object.entries(updates).forEach(([prop, val]) => {
        sceneStore.updateComponentProp(id, compName, prop, val);
      });

      const newSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
  }

  function updatePivot({ x: newPx, y: newPy }) {
    if (!selectedEntity.value) return;
    const ent = selectedEntity.value;
    const compName = getTransformCompName(ent);
    const t = ent.components[compName];
    if (!t) return;

    const oldPx = t.pivotX ?? 0.5;
    const oldPy = t.pivotY ?? 0.5;
    const currentX = t.x || 0;
    const currentY = t.y || 0;
    const w = t.width || 0;
    const h = t.height || 0;
    const sx = t.scaleX ?? 1;
    const sy = t.scaleY ?? 1;
    const rotation = (t.rotation || 0) * (Math.PI / 180);
    const dPx = newPx - oldPx;
    const dPy = newPy - oldPy;
    const localDx = dPx * w * sx;
    const localDy = dPy * h * sy;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const worldDx = localDx * cos - localDy * sin;
    const worldDy = localDx * sin + localDy * cos;

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'pivotX', newPx);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'pivotY', newPy);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'x', currentX + worldDx);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'y', currentY + worldDy);
    } else {
      const id = ent.id;
      const oldSnapshot = JSON.parse(JSON.stringify(ent));

      sceneStore.updateComponentProp(id, compName, 'pivotX', newPx);
      sceneStore.updateComponentProp(id, compName, 'pivotY', newPy);
      sceneStore.updateComponentProp(id, compName, 'x', currentX + worldDx);
      sceneStore.updateComponentProp(id, compName, 'y', currentY + worldDy);

      const newSnapshot = JSON.parse(JSON.stringify(ent));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
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

  function updateUISettingsBulk(updates) { if (projectStore.project) projectStore.updateUISettings(updates); }

  function resetTextRatio() {
    if (!selectedEntity.value) return;
    const tr = selectedEntity.value.components?.TextRenderer;
    if (!tr) return;

    const id = selectedEntity.value.id;
    const oldVal = tr.fontSize;

    sceneStore.updateComponentProp(id, 'TextRenderer', 'fontSize', tr.fontSize);
    recordComponentChange(id, 'TextRenderer', 'fontSize', oldVal, tr.fontSize);
  }

  function resetTilemapTransform() {
    if (!selectedEntity.value) return;
    const tm = selectedEntity.value.components?.Tilemap;
    if (!tm) return;
    
    const compName = getTransformCompName(selectedEntity.value);

    const targetWidth = (tm.width || 0) * (tm.tileWidth || 0);
    const targetHeight = (tm.height || 0) * (tm.tileHeight || 0);

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'width', targetWidth);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'height', targetHeight);
      
      engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: 'width', value: targetWidth });
      engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: 'height', value: targetHeight });
    } else {
      const id = selectedEntity.value.id;
      const oldSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));

      sceneStore.updateComponentProp(id, compName, 'width', targetWidth);
      sceneStore.updateComponentProp(id, compName, 'height', targetHeight);
      
      if (engineBridge.updateComponentProp) {
        engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'width', value: targetWidth });
        engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'height', value: targetHeight });
      } else if (engineBridge.patchComponent) {
        engineBridge.patchComponent({ entityId: id, componentName: compName, updates: { width: targetWidth, height: targetHeight } });
      }

      const newSnapshot = JSON.parse(JSON.stringify(selectedEntity.value));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
  }
  
  return {
    selectedEntity, selectedLayerId, hasSelection, locked, isSizeLockedByText, isSizeLockedByTilemap,
    prefabId, overridden, currentTextureUrl, scriptsData, isEditingMasterPrefab, showSyncControls,
    bindSettingProp, bindEntityProp, bindComponentProp, getComponentOverrideStatus, updateScriptInstance,
    addComponentToSelection, removeComponent, resetTransform, updatePivot, addScript, removeScript,
    updateUISettingsBulk, markAsOverridden, syncObject, syncComponent, syncAllComponents, unpackPrefab,
    isMultiSelection, resetTextRatio, resetTilemapTransform,
    globalScaleX, globalScaleY, globalRotation, hasChildren, fitToChildren
  };
}