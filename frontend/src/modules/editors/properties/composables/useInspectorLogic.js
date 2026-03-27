import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { useProjectStore } from '@/stores/useProjectStore.js';
import { useAssetStore } from '@/stores/useAssetStore';
import { usePrefabStore } from '@/stores/usePrefabStore.js';
import { useEditorStore } from '@/stores/useEditorStore.js';
import { usePopAlert } from '@/composables/usePopAlert';
import { EngineBridge } from '@/services/engine/EngineBridge.js';

export function useInspectorLogic() {
  const sceneStore = useSceneStore();
  const projectStore = useProjectStore();
  const assetStore = useAssetStore();
  const prefabStore = usePrefabStore();
  const editorStore = useEditorStore();
  const { showPop } = usePopAlert();

  // Helper untuk mendapatkan nama komponen transform secara dinamis
  const getTransformCompName = (entity) => {
    if (!entity) return 'Transform';
    return entity.components?.UITransform ? 'UITransform' : 'Transform';
  };

  const isEditingMasterPrefab = computed(() => editorStore.activeTab?.type === 'prefab');

  const selectedLayerId = computed(() => {
    if (isEditingMasterPrefab.value) return null;
    if (sceneStore.selectedEntityIds.length !== 1) return null;
    
    const id = sceneStore.selectedEntityIds[0];
    const isLayer = sceneStore.activeLayers?.some(l => l._id === id);
    return isLayer ? id : null;
  });

  const topLevelSelection = computed(() => {
    if (!sceneStore.activeScene || sceneStore.selectedEntityIds.length === 0) return [];
    const hasSelectedAncestor = (entityId) => {
        let current = sceneStore.activeScene.entities.find(e => e._id === entityId);
        while (current && current.parentId) {
            if (sceneStore.selectedEntityIds.includes(current.parentId)) return true;
            current = sceneStore.activeScene.entities.find(e => e._id === current.parentId);
        }
        return false;
    };
    return sceneStore.selectedEntityIds.filter(id => !hasSelectedAncestor(id));
  });

  const selectedEntity = computed(() => {
    if (isEditingMasterPrefab.value) {
      const prefabId = editorStore.activeTab.id;
      const prefab = prefabStore.getPrefabById(prefabId);
      return prefab ? prefab.data : null;
    }
    if (selectedLayerId.value) return null; 
    if (topLevelSelection.value.length === 1) {
        const id = topLevelSelection.value[0];
        return sceneStore.activeScene.entities.find(e => e._id === id);
    }
    return null;
  });

  const isLockedByPrefab = computed(() => {
    if (isEditingMasterPrefab.value || !selectedEntity.value) return false;
    
    let current = selectedEntity.value;
    while (current) {
        if (current.prefabId) return true; 
        if (!current.parentId) break;
        current = sceneStore.activeScene?.entities.find(e => e._id === current.parentId);
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
      const entity = sceneStore.activeScene?.entities.find(e => e._id === entityId);
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
      return getGlobalTransform(selectedEntity.value._id);
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
      return sceneStore.activeScene.entities.some(e => e.parentId === selectedEntity.value._id);
  });

  const fitToChildren = () => {
      if (!selectedEntity.value) return;
      const parentId = selectedEntity.value._id;
      
      const getDescendants = (pId) => {
          let arr = [];
          const children = sceneStore.activeScene.entities.filter(e => e.parentId === pId);
          for (const c of children) {
              arr.push(c);
              arr = arr.concat(getDescendants(c._id));
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
          const gT = getGlobalTransform(d._id);
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

      const newWidth = Math.max(1, Math.round(maxX - minX));
      const newHeight = Math.max(1, Math.round(maxY - minY));
      
      const newPivotX = newWidth > 0 ? -minX / newWidth : 0.5;
      const newPivotY = newHeight > 0 ? -minY / newHeight : 0.5;

      const compName = getTransformCompName(selectedEntity.value);
      
      sceneStore.updateComponentProp(parentId, compName, 'width', newWidth);
      sceneStore.updateComponentProp(parentId, compName, 'height', newHeight);
      sceneStore.updateComponentProp(parentId, compName, 'pivotX', newPivotX);
      sceneStore.updateComponentProp(parentId, compName, 'pivotY', newPivotY);

      EngineBridge.patchComponent({
          entityId: parentId,
          componentName: compName,
          updates: { width: newWidth, height: newHeight, pivotX: newPivotX, pivotY: newPivotY }
      });
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
        if (isEditingMasterPrefab.value) {
          prefabStore.updatePrefab(editorStore.activeTab.id, { [propName]: val });
          EngineBridge.updatePrefabMasterProp?.({ prefabId: editorStore.activeTab.id, prop: propName, value: val });
        } else {
          sceneStore.updateEntityProp(selectedEntity.value._id, propName, val);
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

        const applyUpdate = (pName, pValue) => {
          if (isEditingMasterPrefab.value) {
            prefabStore.updateComponentProp(editorStore.activeTab.id, compName, pName, pValue);
            EngineBridge.updatePrefabMasterComponentProp?.({ prefabId: editorStore.activeTab.id, componentName: compName, prop: pName, value: pValue });
          } else {
            const id = selectedEntity.value._id;
            sceneStore.updateComponentProp(id, compName, pName, pValue);
            if (prefabId.value) {
              if (pName !== 'x' && pName !== 'y') sceneStore.updateComponentProp(id, compName, 'overridden', true);
            }
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
  function markAsOverridden() { if (selectedEntity.value && prefabId.value && !overridden.value && !isEditingMasterPrefab.value) sceneStore.updateEntityProp(selectedEntity.value._id, 'overridden', true); }
  
  function syncObject() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value._id;
    const tag = master.data.tag || 'Untagged';
    const active = master.data.active ?? true;
    sceneStore.updateEntityProp(id, 'tag', tag);
    sceneStore.updateEntityProp(id, 'active', active);
    sceneStore.updateEntityProp(id, 'overridden', false);
    EngineBridge.updateEntityProp({ id, prop: 'tag', value: tag });
    EngineBridge.updateEntityProp({ id, prop: 'active', value: active });
    showPop({ title: 'Object Synced', type: 'success' });
  }

  function syncComponent(compName) {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const masterCompData = master.data.components[compName];
    const id = selectedEntity.value._id;

    if (masterCompData) {
      const cleanData = JSON.parse(JSON.stringify(masterCompData));
      if (compName === 'Transform' || compName === 'UITransform') {
        const currentEntity = sceneStore.activeScene.entities.find(e => e._id === id);
        const currentComp = currentEntity?.components[compName];
        if (currentComp) { cleanData.x = currentComp.x; cleanData.y = currentComp.y; }
      }
      cleanData.overridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e._id === id);
        if (entity && entity.components) entity.components[compName] = cleanData;
      }
      EngineBridge.patchComponent({ entityId: id, componentName: compName, updates: cleanData });
      showPop({ title: 'Component Synced', message: `${compName} reset (Position kept).`, type: 'success' });
    } else removeComponent(compName);
  }

  function syncAllComponents() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value._id;
    const masterComps = master.data.components || {};
    const instanceComps = selectedEntity.value.components || {};

    Object.keys(masterComps).forEach(key => {
      const cleanData = JSON.parse(JSON.stringify(masterComps[key]));
      if (key === 'Transform' || key === 'UITransform') {
        if (instanceComps[key]) { cleanData.x = instanceComps[key].x; cleanData.y = instanceComps[key].y; }
      }
      cleanData.overridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e._id === id);
        if (entity) {
          if (!entity.components) entity.components = {};
          entity.components[key] = cleanData;
        }
      }
      if (instanceComps[key]) EngineBridge.patchComponent({ entityId: id, componentName: key, updates: cleanData });
      else EngineBridge.addComponent({ entityId: id, componentName: key, data: cleanData });
    });

    Object.keys(instanceComps).forEach(key => { if (!masterComps[key]) sceneStore.removeComponent(id, key); });
    sceneStore.updateEntityProp(id, 'overridden', false);
    showPop({ title: 'All Synced', type: 'success' });
  }

  function unpackPrefab() {
    if (!selectedEntity.value || isEditingMasterPrefab.value) return;
    const id = selectedEntity.value._id;
    const comps = selectedEntity.value.components || {};
    sceneStore.updateEntityProp(id, 'prefabId', null);
    sceneStore.updateEntityProp(id, 'overridden', false);
    Object.keys(comps).forEach(compName => sceneStore.updateComponentProp(id, compName, 'overridden', false));
    EngineBridge.updateEntityProp({ id, prop: 'prefabId', value: null });
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
      prefabStore.addComponent(editorStore.activeTab.id, componentName);
      EngineBridge.addPrefabMasterComponent?.({ prefabId: editorStore.activeTab.id, componentName: componentName });
    } else {
      const hasComponent = selectedEntity.value.components && selectedEntity.value.components[componentName];
      if (hasComponent) return;
      sceneStore.addComponent(selectedEntity.value._id, componentName);
    }
  }

  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    
    if (isLockedByPrefab.value) {
      showPop({ title: 'Restricted', message: 'Cannot remove components from a Prefab instance or its children. Unpack it first.', type: 'warning' });
      return;
    }

    if (isEditingMasterPrefab.value) {
      prefabStore.removeComponent(editorStore.activeTab.id, compName);
      EngineBridge.removePrefabMasterComponent?.({ prefabId: editorStore.activeTab.id, componentName: compName });
    } else sceneStore.removeComponent(selectedEntity.value._id, compName);
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const compName = getTransformCompName(selectedEntity.value);
    const updates = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false };
    
    // Opsional: Jika di UITransform ingin me-reset anchor juga, kita bisa tambahkan
    if (compName === 'UITransform') {
      updates.anchorX = 0.5;
      updates.anchorY = 0.5;
    }

    Object.entries(updates).forEach(([prop, val]) => {
      if (isEditingMasterPrefab.value) prefabStore.updateComponentProp(editorStore.activeTab.id, compName, prop, val);
      else sceneStore.updateComponentProp(selectedEntity.value._id, compName, prop, val);
    });
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
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'pivotX', newPx);
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'pivotY', newPy);
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'x', currentX + worldDx);
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'y', currentY + worldDy);
    } else {
      const id = ent._id;
      sceneStore.updateComponentProp(id, compName, 'pivotX', newPx);
      sceneStore.updateComponentProp(id, compName, 'pivotY', newPy);
      sceneStore.updateComponentProp(id, compName, 'x', currentX + worldDx);
      sceneStore.updateComponentProp(id, compName, 'y', currentY + worldDy);
    }
  }

  function updateScriptInstance(index, fieldPath, value) {
    if (!selectedEntity.value) return;
    const fullPath = `data.${index}.${fieldPath}`;
    if (isEditingMasterPrefab.value) prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', fullPath, value);
    else sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', fullPath, value);
  }

  const scriptsData = computed(() => selectedEntity.value?.components?.ScriptController?.data || []);

  function addScript(assetId) {
    if (!selectedEntity.value) return;
    const newInstance = { _id: `inst_${crypto.randomUUID().split('-')[0]}`, assetId, active: true, variables: {} };
    const currentList = [...scriptsData.value, newInstance];
    if (isEditingMasterPrefab.value) prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', 'data', currentList);
    else {
      sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'data', currentList);
      if (prefabId.value) markAsOverridden();
    }
  }

  function removeScript(index) {
    if (!selectedEntity.value) return;
    const currentList = [...scriptsData.value];
    currentList.splice(index, 1);
    if (isEditingMasterPrefab.value) prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', 'data', currentList);
    else {
      sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'data', currentList);
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
    const tr = selectedEntity.value.components.TextRenderer;
    if (!tr) return;
    sceneStore.updateComponentProp(selectedEntity.value._id, 'TextRenderer', 'fontSize', tr.fontSize);
  }

  function resetTilemapTransform() {
    if (!selectedEntity.value) return;
    const tm = selectedEntity.value.components.Tilemap;
    if (!tm) return;
    
    const compName = getTransformCompName(selectedEntity.value);

    const targetWidth = (tm.width || 0) * (tm.tileWidth || 0);
    const targetHeight = (tm.height || 0) * (tm.tileHeight || 0);

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'width', targetWidth);
      prefabStore.updateComponentProp(editorStore.activeTab.id, compName, 'height', targetHeight);
      
      EngineBridge.updatePrefabMasterComponentProp?.({ prefabId: editorStore.activeTab.id, componentName: compName, prop: 'width', value: targetWidth });
      EngineBridge.updatePrefabMasterComponentProp?.({ prefabId: editorStore.activeTab.id, componentName: compName, prop: 'height', value: targetHeight });
    } else {
      const id = selectedEntity.value._id;
      sceneStore.updateComponentProp(id, compName, 'width', targetWidth);
      sceneStore.updateComponentProp(id, compName, 'height', targetHeight);
      
      if (EngineBridge.updateComponentProp) {
        EngineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'width', value: targetWidth });
        EngineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'height', value: targetHeight });
      } else if (EngineBridge.patchComponent) {
        EngineBridge.patchComponent({ entityId: id, componentName: compName, updates: { width: targetWidth, height: targetHeight } });
      }
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