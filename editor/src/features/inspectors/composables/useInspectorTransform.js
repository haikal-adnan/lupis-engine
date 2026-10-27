import { computed } from 'vue';
import { useSceneStore, useEntityActions } from '@scenes/scenes.js';
import { usePrefabStore } from '@prefabs/prefabs.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { usePopAlert } from '@composables/composables.js';
import { engineBridge } from "@engines/engines.js";
import { useSceneHistory } from '@historys/historys.js';
import { computeGlobalTransform } from '@utils/utils.js';

export function useInspectorTransform(selectedEntity, isEditingMasterPrefab) {
  const sceneStore = useSceneStore();
  const entityActions = useEntityActions();
  const prefabStore = usePrefabStore();
  const workspaceStore = useWorkspaceStore();
  const { showPop } = usePopAlert();
  const { recordTransformChange } = useSceneHistory();

  const getEntity = () => selectedEntity?.value || selectedEntity || null;
  const getEditingMaster = () => {
    if (typeof isEditingMasterPrefab === 'boolean') return isEditingMasterPrefab;
    return !!isEditingMasterPrefab?.value;
  };

  const getTransformCompName = (entity) => {
    if (!entity) return 'Transform';
    return entity.components?.UITransform ? 'UITransform' : 'Transform';
  };

  const isSizeLockedByText = computed(() => {
    const ent = getEntity();
    if (!ent) return false;
    return !!ent.components?.TextRenderer;
  });

  const isSizeLockedByTilemap = computed(() => {
    const ent = getEntity();
    if (!ent) return false;
    return !!ent.components?.Tilemap;
  });

  const getGlobalTransform = (entityId) => {
    // FIX: Gunakan optional chaining pada activeScene?.entities
    const entities = sceneStore.activeScene?.entities || [];
    const entity = entities.find(e => e.id === entityId);
    return computeGlobalTransform(entity, (id) => entities.find(e => e.id === id));
  };

  const globalTransformData = computed(() => {
    const ent = getEntity();
    if (!ent || !ent.parentId) return null; 
    return getGlobalTransform(ent.id);
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
    const ent = getEntity();
    const entities = sceneStore.activeScene?.entities;
    if (!ent || !entities) return false;
    return entities.some(e => e.parentId === ent.id);
  });

  const fitToChildren = () => {
    const ent = getEntity();
    const entities = sceneStore.activeScene?.entities;
    if (!ent || !entities) return; // Early return if entity or activeScene.entities is null
    
    const parentId = ent.id;
    
    const getDescendants = (pId) => {
      let arr = [];
      const children = entities.filter(e => e.parentId === pId);
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

    const oldSnapshot = JSON.parse(JSON.stringify(ent));

    const newWidth = Math.max(1, Math.round(maxX - minX));
    const newHeight = Math.max(1, Math.round(maxY - minY));
    
    const newPivotX = newWidth > 0 ? -minX / newWidth : 0.5;
    const newPivotY = newHeight > 0 ? -minY / newHeight : 0.5;

    const compName = getTransformCompName(ent);
    
    entityActions.updateComponentProp(parentId, compName, 'width', newWidth);
    entityActions.updateComponentProp(parentId, compName, 'height', newHeight);
    entityActions.updateComponentProp(parentId, compName, 'pivotX', newPivotX);
    entityActions.updateComponentProp(parentId, compName, 'pivotY', newPivotY);

    engineBridge.patchComponent({
      entityId: parentId,
      componentName: compName,
      updates: { width: newWidth, height: newHeight, pivotX: newPivotX, pivotY: newPivotY }
    });

    const newSnapshot = JSON.parse(JSON.stringify(getEntity()));
    recordTransformChange([{ id: parentId, oldSnapshot, newSnapshot }]);

    showPop({ title: 'Fit to Children', message: 'Parent size successfully adjusted.', type: 'success' });
  };

  function resetTransform() {
    const ent = getEntity();
    if (!ent) return;
    const compName = getTransformCompName(ent);
    const updates = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, flipX: false, flipY: false };
    
    if (compName === 'UITransform') {
      updates.anchorX = 0.5;
      updates.anchorY = 0.5;
    }

    if (getEditingMaster()) {
      Object.entries(updates).forEach(([prop, val]) => {
        prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, prop, val);
      });
    } else {
      const oldSnapshot = JSON.parse(JSON.stringify(ent));
      const id = ent.id;

      Object.entries(updates).forEach(([prop, val]) => {
        entityActions.updateComponentProp(id, compName, prop, val);
      });

      const newSnapshot = JSON.parse(JSON.stringify(ent));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
  }

  function updatePivot({ x: newPx, y: newPy }) {
    const ent = getEntity();
    if (!ent) return;
    const compName = getTransformCompName(ent);
    const t = ent.components?.[compName];
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

    if (getEditingMaster()) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'pivotX', newPx);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'pivotY', newPy);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'x', currentX + worldDx);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'y', currentY + worldDy);
    } else {
      const id = ent.id;
      const oldSnapshot = JSON.parse(JSON.stringify(ent));

      entityActions.updateComponentProp(id, compName, 'pivotX', newPx);
      entityActions.updateComponentProp(id, compName, 'pivotY', newPy);
      entityActions.updateComponentProp(id, compName, 'x', currentX + worldDx);
      entityActions.updateComponentProp(id, compName, 'y', currentY + worldDy);

      const newSnapshot = JSON.parse(JSON.stringify(ent));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
  }

  function resetTilemapTransform() {
    const ent = getEntity();
    if (!ent) return;
    const tm = ent.components?.Tilemap;
    if (!tm) return;
    
    const compName = getTransformCompName(ent);

    const targetWidth = (tm.width || 0) * (tm.tileWidth || 0);
    const targetHeight = (tm.height || 0) * (tm.tileHeight || 0);

    if (getEditingMaster()) {
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'width', targetWidth);
      prefabStore.updateComponentProp(workspaceStore.activeTab.id, compName, 'height', targetHeight);
      
      engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: 'width', value: targetWidth });
      engineBridge.updatePrefabMasterComponentProp?.({ prefabId: workspaceStore.activeTab.id, componentName: compName, prop: 'height', value: targetHeight });
    } else {
      const id = ent.id;
      const oldSnapshot = JSON.parse(JSON.stringify(ent));

      entityActions.updateComponentProp(id, compName, 'width', targetWidth);
      entityActions.updateComponentProp(id, compName, 'height', targetHeight);
      
      if (engineBridge.updateComponentProp) {
        engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'width', value: targetWidth });
        engineBridge.updateComponentProp({ entityId: id, componentName: compName, path: 'height', value: targetHeight });
      } else if (engineBridge.patchComponent) {
        engineBridge.patchComponent({ entityId: id, componentName: compName, updates: { width: targetWidth, height: targetHeight } });
      }

      const newSnapshot = JSON.parse(JSON.stringify(ent));
      recordTransformChange([{ id, oldSnapshot, newSnapshot }]);
    }
  }

  return {
    isSizeLockedByText,
    isSizeLockedByTilemap,
    globalScaleX,
    globalScaleY,
    globalRotation,
    hasChildren,
    getTransformCompName,
    getGlobalTransform,
    fitToChildren,
    resetTransform,
    updatePivot,
    resetTilemapTransform
  };
}