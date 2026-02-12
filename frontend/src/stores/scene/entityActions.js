import { createEntity as createEntitySchema } from '@/services/schema/schema.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID';
import { createComponent } from '@/services/schema/sceneSchema/componentSchema.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

// Import Composables
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert'; // <--- Import Pop Alert

const round = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export function useEntityActions(activeScene, selectedEntityIds) {
  // Inisialisasi Composable
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert(); // <--- Inisialisasi

  const createEntity = (type, contextNode) => {
    if (!activeScene.value) return null;

    const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
    const rawTransform = { 
        x: Math.round(camPos.x), 
        y: Math.round(camPos.y) 
    };

    let parentId = null;
    let layerId = null;
    
    const defaultWorldLayer = activeScene.value.layersWorld?.[0]?._id;
    const defaultUILayer = activeScene.value.layersUI?.[0]?._id;

    if (contextNode) {
        if (contextNode.type === 'layer') {
          layerId = contextNode._id;
          parentId = null;
        } else {
          layerId = contextNode.layerId;
          parentId = contextNode._id;
        }
    } else {
        if (type.startsWith('ui_')) {
            layerId = defaultUILayer;
        } else {
            layerId = defaultWorldLayer;
        }
    }

    const siblings = activeScene.value.entities.filter(e => 
        e.parentId === parentId && e.layerId === layerId
    );

    const maxOrder = siblings.reduce((max, node) => 
        (node.orderIndex > max ? node.orderIndex : max), -1
    );

    const nextOrderIndex = maxOrder + 1;
    const components = {};

    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
      components.Transform = rawTransform;
    } 
    else if (type === 'shape') {
      components.ShapeRenderer = { type: 'rectangle', color: '#FF0000' };
      components.Transform = rawTransform;
    } 
    else if (type === 'text') {
      components.TextRenderer = { value: 'New Text', fontSize: 24, color: '#FFFFFF' };
      components.Transform = { ...rawTransform, width: 107, height: 23 };
    } 
    else if (type === 'tilemap') {
      const defaultW = 40; 
      const defaultH = 30;
      components.Tilemap = { 
         tileWidth: 16, tileHeight: 16, width: defaultW, height: defaultH,
         tilesetId: null, opacity: 1, isSolid: false,
         data: new Array(defaultW * defaultH).fill(0)
      };
      components.Transform = rawTransform;
    } 
    else if (type === 'ui_empty') {
      components.UITransform = { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
    } 
    else if (type === 'ui_panel') {
      components.UITransform = { width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 };
      components.ShapeRenderer = { type: 'rectangle', color: '#2d2d2d', opacity: 0.8 };
    } 
    else if (type === 'ui_button') {
      components.UITransform = { width: 140, height: 40, anchorX: 0.5, anchorY: 0.5 };
      components.ShapeRenderer = { type: 'rectangle', color: '#3498db' };
      components.TextRenderer = { value: 'Button', fontSize: 16, align: 'center', color: '#FFFFFF' };
      components.ScriptController = { data: [] }; 
    } 
    else if (type === 'ui_text') {
      components.UITransform = { width: 107, height: 23, anchorX: 0.5, anchorY: 0.5 };
      components.TextRenderer = { value: 'New Text', fontSize: 24, align: 'left', color: '#FFFFFF' };
    } 
    else if (type === 'ui_image') {
      components.UITransform = { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    }

    const existingEntities = activeScene.value.entities;
    const displayType = type.startsWith('ui_') ? type.replace('ui_', '') : type;
    const namePrefix = displayType.charAt(0).toUpperCase() + displayType.slice(1);
    const regex = new RegExp(`^${type}_(\\d+)$`);

    let maxIndex = 0;
    existingEntities.forEach(ent => {
        const match = ent.scriptId ? ent.scriptId.match(regex) : null;
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIndex) maxIndex = num;
        }
    });

    const nextIndex = maxIndex + 1;
    const scriptId = `${type}_${nextIndex}`;
    const entityType = type.startsWith('ui_') ? 'ui' : 'entity';

    const newEntity = createEntitySchema({
      _id: `${GenerateUUID()}`, 
      scriptId: scriptId, 
      name: `${namePrefix} ${nextIndex}`, 
      type: type === 'group' ? 'group' : entityType,
      layerId,
      parentId,
      zIndex: 0, 
      orderIndex: nextOrderIndex,
      components 
    });

    activeScene.value.entities.push(newEntity);
    selectedEntityIds.value = [newEntity._id];

    return newEntity; 
  };

  const updateEntityScriptId = (entityId, newScriptId) => {
    if (!activeScene.value) return;
    const sanitizedId = newScriptId.replace(/[^a-zA-Z0-9_]/g, "_");
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity) {
      entity.scriptId = sanitizedId;
      return { id: entityId, prop: 'scriptId', value: sanitizedId };
    }
  };

  const deleteEntity = (entityId) => {
    if (!activeScene.value) return;

    const getDescendants = (parentId) => {
      const children = activeScene.value.entities.filter(e => e.parentId === parentId);
      let ids = children.map(c => c._id);
      children.forEach(child => {
        ids = [...ids, ...getDescendants(child._id)];
      });
      return ids;
    };

    const idsToDelete = [entityId, ...getDescendants(entityId)];
    activeScene.value.entities = activeScene.value.entities.filter(e => 
      !idsToDelete.includes(e._id)
    );

    selectedEntityIds.value = [];
    EngineBridge.clearSelection();
    EngineBridge.deleteEntity(entityId);
  };

  const moveEntity = (draggedId, targetContext) => {
    if (!activeScene.value) return;

    const { newParentId, newLayerId, insertionType, referenceId } = targetContext;
    const entities = activeScene.value.entities;
    const entity = entities.find(e => e._id === draggedId);
    if (!entity) return;

    entity.parentId = newParentId;
    entity.layerId = newLayerId;

    let targetSiblings = entities.filter(e => 
        e.parentId === newParentId && 
        e.layerId === newLayerId && 
        e._id !== draggedId 
    );

    targetSiblings.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    if (insertionType === 'inside') {
        targetSiblings.push(entity);
    } 
    else {
        const refIndex = targetSiblings.findIndex(e => e._id === referenceId);
        if (refIndex !== -1) {
            if (insertionType === 'before') targetSiblings.splice(refIndex, 0, entity);
            else targetSiblings.splice(refIndex + 1, 0, entity);
        } else {
            targetSiblings.push(entity);
        }
    }

    targetSiblings.forEach((sibling, index) => {
        if (sibling.orderIndex !== index) {
            sibling.orderIndex = index;
            EngineBridge.updateEntityProp({ 
                id: sibling._id, 
                prop: 'orderIndex', 
                value: index 
            });
        }
    });
  };

  const updateComponentProp = (entityId, componentName, path, value) => {
    if (!activeScene.value) return;

    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (!entity || !entity.components[componentName]) return;

    const comp = entity.components[componentName];
    if ((componentName === 'Transform' || componentName === 'UITransform') && comp.isRatioLocked) {
        const numValue = Number(value);
        if (!isNaN(numValue) && comp.width > 0 && comp.height > 0) {
            const ratio = comp.width / comp.height;
            if (path === 'width') {
                const newHeight = round(numValue / ratio);
                comp.height = newHeight; 
                EngineBridge.updateComponentProp({ entityId, componentName, path: 'height', value: newHeight }); 
            } else if (path === 'height') {
                const newWidth = round(numValue * ratio);
                comp.width = newWidth; 
                EngineBridge.updateComponentProp({ entityId, componentName, path: 'width', value: newWidth }); 
            }
        }
    }

    const keys = path.split('.');
    let target = comp;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {};
      target = target[keys[i]];
    }
    target[keys[keys.length - 1]] = value;

    return { entityId, componentName, path, value };
  };

  const updateEntityProp = (entityId, propName, value) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    
    if (entity) {
      if (entity[propName] === value) return; 

      entity[propName] = value;
      return { id: entityId, prop: propName, value };
    }
  };

  const syncTilemapDataFromEngine = (entityId, newData) => {
    if (!activeScene.value) return;
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (entity?.components?.Tilemap) {
      entity.components.Tilemap.data = newData;
    }
  };

  const addComponent = (entityId, componentName) => {
    if (!activeScene.value) return;
    
    const entity = activeScene.value.entities.find(e => e._id === entityId);
    if (!entity) return;

    if (entity.components && entity.components[componentName]) return;

    const newComponentData = createComponent(componentName);
    
    if (!entity.components) entity.components = {};
    entity.components[componentName] = newComponentData;
    
    return { entityId, componentName, data: newComponentData };
  };

  // -------------------------------------------------------------------
  // FUNGSI: removeComponent (Dengan Confirm + Alert Success/Fail)
  // -------------------------------------------------------------------
  const removeComponent = async (entityId, componentName) => {
    if (!activeScene.value) return;

    const entity = activeScene.value.entities.find(e => e._id === entityId);
    
    // Guard: Pastikan komponen ada
    if (!entity || !entity.components[componentName]) {
        showPop({
            title: 'Error',
            message: 'Component not found or already removed.',
            type: 'error'
        });
        return;
    }

    // 1. Konfirmasi User
    const isConfirmed = await confirm({
      title: 'Remove Component',
      message: `Are you sure you want to remove "${componentName}" from this entity?`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!isConfirmed) return;

    // 2. Eksekusi Hapus dengan Try-Catch
    try {
        // Hapus dari state lokal
        delete entity.components[componentName];

        // Sinkronisasi ke Engine
        EngineBridge.removeComponent({ entityId, componentName });

        // Alert Sukses
        showPop({
            title: 'Success',
            message: `Component "${componentName}" removed successfully.`,
            type: 'success'
        });

        return { entityId, componentName };

    } catch (error) {
        console.error("Failed to remove component:", error);
        
        // Alert Gagal
        showPop({
            title: 'Failed',
            message: `Could not remove component "${componentName}".`,
            type: 'error'
        });
    }
  };

  return { 
    createEntity,
    updateEntityScriptId,
    deleteEntity,
    moveEntity,
    updateComponentProp,
    updateEntityProp,
    syncTilemapDataFromEngine,
    addComponent,
    removeComponent // <--- Export fungsi baru
  };
}