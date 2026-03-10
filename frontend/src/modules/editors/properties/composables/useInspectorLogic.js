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

  const isEditingMasterPrefab = computed(() => editorStore.activeTab?.type === 'prefab');

  const selectedLayerId = computed(() => {
    if (isEditingMasterPrefab.value) return null;
    if (sceneStore.selectedEntityIds.length !== 1) return null;
    
    const id = sceneStore.selectedEntityIds[0];
    const isLayer = sceneStore.activeLayers?.some(l => l._id === id);
    return isLayer ? id : null;
  });

  const selectedEntity = computed(() => {
    if (isEditingMasterPrefab.value) {
      const prefabId = editorStore.activeTab.id;
      const prefab = prefabStore.getPrefabById(prefabId);
      return prefab ? prefab.data : null;
    }

    if (sceneStore.selectedEntityIds.length > 1) return null;
    
    if (selectedLayerId.value) return null; 

    const id = sceneStore.selectedEntityIds[0];
    if (!id || !sceneStore.activeScene) return null;
    return sceneStore.activeScene.entities.find(e => e._id === id);
  });

  const isMultiSelection = computed(() => !isEditingMasterPrefab.value && sceneStore.selectedEntityIds.length > 1);
  
  const hasSelection = computed(() => !!selectedEntity.value || !!selectedLayerId.value);
  
  const prefabId = computed(() => isEditingMasterPrefab.value ? null : selectedEntity.value?.prefabId);
  const isOverridden = computed(() => isEditingMasterPrefab.value ? false : (selectedEntity.value?.isOverridden || false));
  const isLocked = computed(() => selectedEntity.value?._editor?.locked || false);
  
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
        if (category === 'ui') {
          projectStore.updateUISettings({ [propName]: val });
          return;
        } 
        if (category === 'grid') {
          const grid = projectStore.project.settings.grid;
          if (propName === 'width') projectStore.setGridSize(val, grid.height);
          else if (propName === 'height') projectStore.setGridSize(grid.width, val);
          else if (propName === 'color') projectStore.setGridColor(val);
          else if (propName === 'opacity') projectStore.setGridOpacity(val);
          else if (propName === 'visible' && val !== grid.visible) projectStore.toggleGrid();
          else if (propName === 'snap' && val !== grid.snap) projectStore.toggleMagnet();
          return;
        }
        if (category === 'camera') {
          projectStore.updateCameraSettings({ [propName]: val });
          return;
        }
        if (!category && propName === 'tickRate') {
            projectStore.setTickRate(val);
            return;
        }

        if (!sceneStore.activeScene) return;

        if (category === 'worldBounds') {
          sceneStore.updateWorldBounds({ [propName]: val });
        } else if (category === 'physics') {
          sceneStore.updatePhysicsSettings({ [propName]: val });
        } else if (!category) {
          if (propName === 'backgroundColor') sceneStore.setBackgroundColor(val);
          else if (propName === 'showRulers' && val !== sceneStore.activeScene.settings.showRulers) {
            sceneStore.toggleRulers();
          }
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
          EngineBridge.updatePrefabMasterProp?.({
            prefabId: editorStore.activeTab.id,
            prop: propName,
            value: val
          });
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
        
        // Aturan khusus Scale: Paksa minimal 1 dan selalu angka bulat
        if (propName === 'scaleX' || propName === 'scaleY') {
          finalVal = Math.max(1, Math.round(val));
        } 
        else if (precision !== null && typeof val === 'number') {
          const factor = Math.pow(10, precision);
          finalVal = Math.round(val * factor) / factor;
        }

        // Fungsi internal (Helper) untuk mengeksekusi update dan mengirim ke Engine

        const applyUpdate = (pName, pValue) => {
          if (isEditingMasterPrefab.value) {
            prefabStore.updateComponentProp(editorStore.activeTab.id, compName, pName, pValue);
            EngineBridge.updatePrefabMasterComponentProp?.({
              prefabId: editorStore.activeTab.id,
              componentName: compName,
              prop: pName,
              value: pValue
            });
          } else {
            const id = selectedEntity.value._id;
            sceneStore.updateComponentProp(id, compName, pName, pValue);
            
            if (prefabId.value) {
              // Pengecualian: jangan trigger override jika yang diubah HANYA x atau y
              if (pName !== 'x' && pName !== 'y') {
                sceneStore.updateComponentProp(id, compName, 'isOverridden', true);
              }
            }
          }
        };

        // 1. Update properti utama yang sedang diubah user
        applyUpdate(propName, finalVal);

        // 2. [FITUR BARU] Jika yang diubah adalah Scale dan tombol Lock aktif,
        // otomatis copy nilai tersebut ke sumbu pasangannya (Uniform Scale).
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

  function getComponentOverrideStatus(compName) {
    return computed(() => selectedEntity.value?.components?.[compName]?.isOverridden || false);
  }

  function markAsOverridden() {
    if (selectedEntity.value && prefabId.value && !isOverridden.value && !isEditingMasterPrefab.value) {
      sceneStore.updateEntityProp(selectedEntity.value._id, 'isOverridden', true);
    }
  }

  function syncObject() {
    if (!selectedEntity.value || !prefabId.value || isEditingMasterPrefab.value) return;
    const master = getPrefabMaster();
    if (!master) return;
    const id = selectedEntity.value._id;
    const tag = master.data.tag || 'Untagged';
    const active = master.data.isActive ?? true;
    sceneStore.updateEntityProp(id, 'tag', tag);
    sceneStore.updateEntityProp(id, 'active', active);
    sceneStore.updateEntityProp(id, 'isOverridden', false);
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
        if (currentComp) {
          cleanData.x = currentComp.x;
          cleanData.y = currentComp.y;
        }
      }
      cleanData.isOverridden = false;

      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e._id === id);
        if (entity && entity.components) {
          entity.components[compName] = cleanData;
        }
      }

      EngineBridge.patchComponent({
        entityId: id,
        componentName: compName,
        updates: cleanData
      });

      showPop({ title: 'Component Synced', message: `${compName} reset (Position kept).`, type: 'success' });
    } else {
      removeComponent(compName);
    }
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
        if (instanceComps[key]) {
          cleanData.x = instanceComps[key].x;
          cleanData.y = instanceComps[key].y;
        }
      }
      cleanData.isOverridden = false;
      if (sceneStore.activeScene) {
        const entity = sceneStore.activeScene.entities.find(e => e._id === id);
        if (entity) {
          if (!entity.components) entity.components = {};
          entity.components[key] = cleanData;
        }
      }
      if (instanceComps[key]) {
        EngineBridge.patchComponent({ entityId: id, componentName: key, updates: cleanData });
      } else {
        EngineBridge.addComponent({ entityId: id, componentName: key, data: cleanData });
      }
    });

    Object.keys(instanceComps).forEach(key => {
      if (!masterComps[key]) sceneStore.removeComponent(id, key);
    });

    sceneStore.updateEntityProp(id, 'isOverridden', false);
    showPop({ title: 'All Synced', type: 'success' });
  }

  function unpackPrefab() {
    if (!selectedEntity.value || isEditingMasterPrefab.value) return;
    const id = selectedEntity.value._id;
    const comps = selectedEntity.value.components || {};
    sceneStore.updateEntityProp(id, 'prefabId', null);
    sceneStore.updateEntityProp(id, 'isOverridden', false);
    Object.keys(comps).forEach(compName => {
      sceneStore.updateComponentProp(id, compName, 'isOverridden', false);
    });
    EngineBridge.updateEntityProp({ id, prop: 'prefabId', value: null });
    showPop({ title: 'Unpacked', type: 'success' });
  }

  function addComponentToSelection(componentName) {
    if (!selectedEntity.value) return;
    if (prefabId.value && !isEditingMasterPrefab.value) {
      showPop({
        title: 'Restricted',
        message: 'Cannot add components to a Prefab instance. Unpack it first.',
        type: 'warning'
      });
      return;
    }

    if (isEditingMasterPrefab.value) {
      const hasComponent = selectedEntity.value.components && selectedEntity.value.components[componentName];
      if (hasComponent) return;
      prefabStore.addComponent(editorStore.activeTab.id, componentName);
      EngineBridge.addPrefabMasterComponent?.({
        prefabId: editorStore.activeTab.id,
        componentName: componentName
      });
    } else {
      const hasComponent = selectedEntity.value.components && selectedEntity.value.components[componentName];
      if (hasComponent) return;
      sceneStore.addComponent(selectedEntity.value._id, componentName);
    }
  }

  function removeComponent(compName) {
    if (!selectedEntity.value) return;
    if (prefabId.value && !isEditingMasterPrefab.value) {
      showPop({
        title: 'Restricted',
        message: 'Cannot remove components from a Prefab instance. Unpack it first.',
        type: 'warning'
      });
      return;
    }

    if (isEditingMasterPrefab.value) {
      prefabStore.removeComponent(editorStore.activeTab.id, compName);
      EngineBridge.removePrefabMasterComponent?.({
        prefabId: editorStore.activeTab.id,
        componentName: compName
      });
    } else {
      sceneStore.removeComponent(selectedEntity.value._id, compName);
    }
  }

  function resetTransform() {
    if (!selectedEntity.value) return;
    const updates = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false };
    Object.entries(updates).forEach(([prop, val]) => {
      if (isEditingMasterPrefab.value) {
        prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', prop, val);
      } else {
        sceneStore.updateComponentProp(selectedEntity.value._id, 'Transform', prop, val);
      }
    });
  }

  function updatePivot({ x: newPx, y: newPy }) {
    if (!selectedEntity.value) return;
    const ent = selectedEntity.value;
    const t = ent.components.Transform;
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
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'pivotX', newPx);
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'pivotY', newPy);
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'x', currentX + worldDx);
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'y', currentY + worldDy);
    } else {
      const id = ent._id;
      sceneStore.updateComponentProp(id, 'Transform', 'pivotX', newPx);
      sceneStore.updateComponentProp(id, 'Transform', 'pivotY', newPy);
      sceneStore.updateComponentProp(id, 'Transform', 'x', currentX + worldDx);
      sceneStore.updateComponentProp(id, 'Transform', 'y', currentY + worldDy);
    }
  }

  function updateScriptInstance(index, fieldPath, value) {
    if (!selectedEntity.value) return;
    const fullPath = `data.${index}.${fieldPath}`;
    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', fullPath, value);
    } else {
      sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', fullPath, value);
    }
  }

  const scriptsData = computed(() => selectedEntity.value?.components?.ScriptController?.data || []);

  function addScript(assetId) {
    if (!selectedEntity.value) return;
    const newInstance = { _id: `inst_${crypto.randomUUID().split('-')[0]}`, assetId, isActive: true, variables: {} };
    const currentList = [...scriptsData.value, newInstance];
    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
      sceneStore.updateComponentProp(selectedEntity.value._id, 'ScriptController', 'data', currentList);
      if (prefabId.value) markAsOverridden();
    }
  }

  function removeScript(index) {
    if (!selectedEntity.value) return;
    const currentList = [...scriptsData.value];
    currentList.splice(index, 1);
    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'ScriptController', 'data', currentList);
    } else {
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

  function updateUISettingsBulk(updates) {
    if (projectStore.project) projectStore.updateUISettings(updates);
  }

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

    const targetWidth = (tm.width || 0) * (tm.tileWidth || 0);
    const targetHeight = (tm.height || 0) * (tm.tileHeight || 0);

    if (isEditingMasterPrefab.value) {
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'width', targetWidth);
      prefabStore.updateComponentProp(editorStore.activeTab.id, 'Transform', 'height', targetHeight);
      
      EngineBridge.updatePrefabMasterComponentProp?.({
        prefabId: editorStore.activeTab.id,
        componentName: 'Transform',
        prop: 'width',
        value: targetWidth
      });
      EngineBridge.updatePrefabMasterComponentProp?.({
        prefabId: editorStore.activeTab.id,
        componentName: 'Transform',
        prop: 'height',
        value: targetHeight
      });
    } else {
      const id = selectedEntity.value._id;
      sceneStore.updateComponentProp(id, 'Transform', 'width', targetWidth);
      sceneStore.updateComponentProp(id, 'Transform', 'height', targetHeight);
      
      if (EngineBridge.updateComponentProp) {
        EngineBridge.updateComponentProp({ entityId: id, componentName: 'Transform', path: 'width', value: targetWidth });
        EngineBridge.updateComponentProp({ entityId: id, componentName: 'Transform', path: 'height', value: targetHeight });
      } else if (EngineBridge.patchComponent) {
        EngineBridge.patchComponent({
          entityId: id,
          componentName: 'Transform',
          updates: { width: targetWidth, height: targetHeight }
        });
      }
    }
  }
  
  return {
    selectedEntity,
    selectedLayerId,
    hasSelection,
    isLocked,
    isSizeLockedByText,
    isSizeLockedByTilemap,
    prefabId,
    isOverridden,
    currentTextureUrl,
    scriptsData,
    isEditingMasterPrefab,
    showSyncControls,
    bindSettingProp,
    bindEntityProp,
    bindComponentProp,
    getComponentOverrideStatus,
    updateScriptInstance,
    addComponentToSelection,
    removeComponent,
    resetTransform,
    updatePivot,
    addScript,
    removeScript,
    updateUISettingsBulk,
    markAsOverridden,
    syncObject,
    syncComponent,
    syncAllComponents,
    unpackPrefab,
    isMultiSelection,
    resetTextRatio,
    resetTilemapTransform
  };
}