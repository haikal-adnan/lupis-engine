import { createEntity as createEntitySchema } from '@/services/schema/schema.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { createComponent } from '@/services/schema/sceneSchema/componentSchema.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";
import { useConfirm } from '@/composables/useConfirm';
import { usePopAlert } from '@/composables/usePopAlert';

const round = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

const checkPrefabRestriction = (entities, entityId, targetParentId = null) => {
    if (!entities) return null;

    const isDescendantOfPrefab = (id) => {
        let current = entities.find(e => e._id === id);
        while (current && current.parentId) {
            current = entities.find(e => e._id === current.parentId);
            if (current && current.prefabId) return true;
        }
        return false;
    };

    if (entityId && isDescendantOfPrefab(entityId)) {
        return 'Tidak dapat memodifikasi, memindahkan, atau menghapus entitas di dalam instansi Prefab. Silakan Unpack terlebih dahulu.';
    }

    if (targetParentId) {
        const targetParent = entities.find(e => e._id === targetParentId);
        if ((targetParent && targetParent.prefabId) || isDescendantOfPrefab(targetParentId)) {
            return 'Tidak dapat menambahkan entitas baru ke dalam hierarki instansi Prefab. Silakan Unpack terlebih dahulu.';
        }
    }

    return null; 
};

export const entityActions = {
  getHierarchyData(entityId) {
    const entities = this.activeScene?.entities;
    if (!entities) return null;
    
    const root = entities.find(e => e._id === entityId);
    if (!root) return null;

    const descendants = [];
    const loopChildren = (parentId) => {
        const children = entities.filter(e => e.parentId === parentId);
        children.forEach(child => {
            descendants.push(child);
            loopChildren(child._id);
        });
    };
    loopChildren(entityId);
    
    return { root, descendants };
  },

  createClones(root, descendants, targetLayerId, targetParentId) {
     const idMap = {};
     const newRootId = GenerateUUID();
     idMap[root._id] = newRootId;

     const clonedRoot = {
        ...JSON.parse(JSON.stringify(root)),
        _id: newRootId,
        scriptId: `${root.scriptId}_${GenerateUUID().split('-')[0]}`,
        name: `${root.name}`,
        layerId: targetLayerId || root.layerId,
        parentId: targetParentId !== undefined ? targetParentId : root.parentId,
        orderIndex: (root.orderIndex || 0) + 1
     };

     const clonedDescendants = descendants.map(child => {
        const newId = GenerateUUID();
        idMap[child._id] = newId;
        return {
            ...JSON.parse(JSON.stringify(child)),
            _id: newId,
            scriptId: `${child.scriptId}_${GenerateUUID().split('-')[0]}`,
            layerId: targetLayerId || root.layerId,
        };
     });

     clonedDescendants.forEach(child => {
        if (idMap[child.parentId]) {
            child.parentId = idMap[child.parentId];
        }
     });

     return [clonedRoot, ...clonedDescendants];
  },

  createEntity(type, contextNodeOrLayerId, overrides = {}) {
    const scene = this.activeScene;
    if (!scene) return false;

    const { showPop } = usePopAlert();

    let posX = 0;
    let posY = 0;

    if (overrides && overrides.x !== undefined && overrides.y !== undefined) {
        posX = Number(overrides.x);
        posY = Number(overrides.y);
    } else {
        const camPos = EngineBridge.getCameraPosition ? EngineBridge.getCameraPosition() : { x: 0, y: 0 };
        posX = Math.round(camPos.x);
        posY = Math.round(camPos.y);
    }
    const rawTransform = { x: posX, y: posY };

    let parentId = null;
    let layerId = null;
    
    const defaultWorldLayer = scene.layersWorld?.[0]?._id;
    const defaultUILayer = scene.layersUI?.[0]?._id;

    if (contextNodeOrLayerId) {
        if (typeof contextNodeOrLayerId === 'string') {
            layerId = contextNodeOrLayerId;
            parentId = null;
        } else if (contextNodeOrLayerId.type === 'layer') {
            layerId = contextNodeOrLayerId._id;
            parentId = null;
        } else {
            layerId = contextNodeOrLayerId.layerId;
            parentId = contextNodeOrLayerId._id;
        }
    } else {
        if (type.startsWith('ui_')) {
            layerId = defaultUILayer;
        } else {
            layerId = defaultWorldLayer;
        }
    }

    if (parentId) {
        const restrictionMsg = checkPrefabRestriction(scene.entities, null, parentId);
        if (restrictionMsg) {
            showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
            return false;
        }
    }

    const siblings = scene.entities.filter(e => 
        e.parentId === parentId && e.layerId === layerId
    );

    const maxOrder = siblings.reduce((max, node) => 
        (node.orderIndex > max ? node.orderIndex : max), -1
    );

    const nextOrderIndex = maxOrder + 1;
    const components = {};

    if (type === 'sprite') {
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
      components.Transform = { ...rawTransform };
    } 
    else if (type === 'shape') {
      components.ShapeRenderer = { type: 'rectangle', color: '#FF0000' };
      components.Transform = { ...rawTransform };
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
         autoFit: true,
         data: new Array(defaultW * defaultH).fill(0)
      };
      
      components.Transform = { ...rawTransform, width: 640, height: 480 };
    }
    else if (type === 'audio') {
      components.Transform = { ...rawTransform, width: 50, height: 50 };
      components.Audio = { 
        currentClip: null,
        clips: [] 
      };
    }
    else if (type === 'ui_empty') {
      components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
    } 
    else if (type === 'ui_shape') {
      components.UITransform = { ...rawTransform, width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 };
      components.ShapeRenderer = { type: 'rectangle', color: '#2d2d2d', opacity: 0.8 };
    } 
    else if (type === 'ui_text') {
      components.UITransform = { ...rawTransform, width: 107, height: 23, anchorX: 0.5, anchorY: 0.5 };
      components.TextRenderer = { value: 'New Text', fontSize: 24, align: 'left', color: '#FFFFFF' };
    } 
    else if (type === 'ui_image') {
      components.UITransform = { ...rawTransform, width: 100, height: 100, anchorX: 0.5, anchorY: 0.5 };
      components.SpriteRenderer = { assetId: null, color: '#FFFFFF' };
    }

    const existingEntities = scene.entities;
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
      type: entityType, 
      layerId,
      parentId,
      zIndex: 0, 
      orderIndex: nextOrderIndex,
      components,
      x: posX,
      y: posY
    });

    scene.entities.push(newEntity);
    this.selectedEntityIds = [newEntity._id];

    if (EngineBridge.createEntity) {
        EngineBridge.createEntity(newEntity);
    }

    EngineBridge.selectEntity([newEntity._id]);

    return newEntity; 
  },

  duplicateEntity(entityIds) {
    if (!this.activeScene) return false;
    const { showPop } = usePopAlert();

    const idsToDuplicate = Array.isArray(entityIds) ? entityIds : [entityIds];
    if (idsToDuplicate.length === 0) return false;

    for (const id of idsToDuplicate) {
        const restrictionMsg = checkPrefabRestriction(this.activeScene.entities, id);
        if (restrictionMsg) {
            showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
            return false;
        }
    }

    const allNewEntities = [];
    const newRootIds = [];

    idsToDuplicate.forEach(id => {
        const data = this.getHierarchyData(id);
        if (!data) return;
        const clones = this.createClones(data.root, data.descendants);
        allNewEntities.push(...clones);
        if (clones.length > 0) newRootIds.push(clones[0]._id);
    });

    this.activeScene.entities.push(...allNewEntities);
    
    EngineBridge.createEntity(allNewEntities); 
    EngineBridge.selectEntity(newRootIds);

    return newRootIds;
  },

  getEntityDataForClipboard(entityIds) {
      const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
      return ids.map(id => this.getHierarchyData(id)).filter(item => item !== null);
  },

  pasteEntity(clipboardDataArray, targetContext = {}) {
      if (!this.activeScene || !clipboardDataArray) return false;
      const { showPop } = usePopAlert();

      if (targetContext.parentId !== undefined) {
          const restrictionMsg = checkPrefabRestriction(this.activeScene.entities, null, targetContext.parentId);
          if (restrictionMsg) {
              showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
              return false;
          }
      }

      const dataItems = Array.isArray(clipboardDataArray) ? clipboardDataArray : [clipboardDataArray];
      const allNewClones = [];
      const newRootIds = [];

      dataItems.forEach(item => {
          const { root, descendants } = item;
          let targetLayerId = root.layerId;
          let targetParentId = root.parentId;

          if (targetContext.parentId !== undefined) targetParentId = targetContext.parentId;
          if (targetContext.layerId !== undefined) targetLayerId = targetContext.layerId;

          const clones = this.createClones(root, descendants, targetLayerId, targetParentId);
          allNewClones.push(...clones);
          if (clones.length > 0) newRootIds.push(clones[0]._id);
      });
      
      this.activeScene.entities.push(...allNewClones);

      EngineBridge.createEntity(allNewClones);
      EngineBridge.selectEntity(newRootIds);

      return newRootIds;
  },

  updateEntityScriptId(entityId, newScriptId) {
    if (!this.activeScene) return false;

    const sanitizedId = newScriptId.replace(/[^a-zA-Z0-9_]/g, "_");
    const entity = this.activeScene.entities.find(e => e._id === entityId);
    
    if (entity) {
      entity.scriptId = sanitizedId;
      return { id: entityId, prop: 'scriptId', value: sanitizedId };
    }
    return false;
  },

  deleteEntity(entityId) {
    if (!this.activeScene) return false;
    const { showPop } = usePopAlert();

    const restrictionMsg = checkPrefabRestriction(this.activeScene.entities, entityId);
    if (restrictionMsg) {
        showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
        return false;
    }

    const getDescendants = (parentId) => {
      const children = this.activeScene.entities.filter(e => e.parentId === parentId);
      let ids = children.map(c => c._id);
      children.forEach(child => {
        ids = [...ids, ...getDescendants(child._id)];
      });
      return ids;
    };

    const idsToDelete = [entityId, ...getDescendants(entityId)];
    
    this.activeScene.entities = this.activeScene.entities.filter(e => 
      !idsToDelete.includes(e._id)
    );
    
    this.selectedEntityIds = [];
    
    EngineBridge.clearSelection();
    EngineBridge.deleteEntity(entityId);

    return true;
  },

  moveEntity(draggedId, targetContext) {
    if (!this.activeScene) return false;
    const { showPop } = usePopAlert();

    const { newParentId, newLayerId, insertionType, referenceId } = targetContext;

    const restrictionMsg = checkPrefabRestriction(this.activeScene.entities, draggedId, newParentId);
    if (restrictionMsg) {
        showPop({ title: 'Prefab Restriction', message: restrictionMsg, type: 'warning' });
        return false;
    }

    const entities = this.activeScene.entities;
    const entity = entities.find(e => e._id === draggedId);
    
    if (!entity) return false;

    const getGlobalTransform = (entId) => {
        const ent = entities.find(e => e._id === entId);
        if (!ent) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
        
        const t = ent.components?.Transform || ent.components?.UITransform;
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };

        if (!ent.parentId) return { x: t.x, y: t.y, rotation: t.rotation || 0, scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1 };

        const parentGlobal = getGlobalTransform(ent.parentId);
        const rad = parentGlobal.rotation * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const sX = t.x * parentGlobal.scaleX;
        const sY = t.y * parentGlobal.scaleY;

        return {
            x: parentGlobal.x + (sX * cos - sY * sin),
            y: parentGlobal.y + (sX * sin + sY * cos),
            rotation: parentGlobal.rotation + (t.rotation || 0),
            scaleX: parentGlobal.scaleX * (t.scaleX ?? 1),
            scaleY: parentGlobal.scaleY * (t.scaleY ?? 1)
        };
    };

    const oldGlobal = getGlobalTransform(draggedId);

    entity.parentId = newParentId;
    entity.layerId = newLayerId;

    const t = entity.components?.Transform || entity.components?.UITransform;
    if (t) {
        if (!newParentId) {
            t.x = oldGlobal.x;
            t.y = oldGlobal.y;
            t.rotation = oldGlobal.rotation;
            t.scaleX = oldGlobal.scaleX;
            t.scaleY = oldGlobal.scaleY;
        } else {
            const newParentGlobal = getGlobalTransform(newParentId);
            
            const dx = oldGlobal.x - newParentGlobal.x;
            const dy = oldGlobal.y - newParentGlobal.y;

            const invRad = -newParentGlobal.rotation * (Math.PI / 180);
            const cos = Math.cos(invRad);
            const sin = Math.sin(invRad);

            const invRotX = (dx * cos) - (dy * sin);
            const invRotY = (dx * sin) + (dy * cos);

            t.x = round(invRotX / newParentGlobal.scaleX);
            t.y = round(invRotY / newParentGlobal.scaleY);
            t.rotation = round(oldGlobal.rotation - newParentGlobal.rotation);
            t.scaleX = oldGlobal.scaleX / newParentGlobal.scaleX;
            t.scaleY = oldGlobal.scaleY / newParentGlobal.scaleY;
        }
        
        t.overridden = true;
        EngineBridge.patchComponent({
            entityId: entity._id,
            componentName: entity.components?.UITransform ? 'UITransform' : 'Transform',
            updates: t
        });
    }

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

    return true;
  },

  updateComponentProp(entityId, componentName, path, value) {
    if (!this.activeScene) return false;

    const entity = this.activeScene.entities.find(e => e._id === entityId);
    if (!entity || !entity.components[componentName]) return false;
    
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
  },

  updateEntityProp(entityId, propName, value) {
    if (!this.activeScene) return false;

    const entity = this.activeScene.entities.find(e => e._id === entityId);
    if (entity) {
      if (entity[propName] === value) return false; 
      entity[propName] = value;
      return { id: entityId, prop: propName, value };
    }
    return false;
  },

  syncTilemapDataFromEngine(entityId, newData) {
    if (!this.activeScene) return false;

    const entity = this.activeScene.entities.find(e => e._id === entityId);
    if (entity?.components?.Tilemap) {
      entity.components.Tilemap.data = newData;
      return true;
    }
    return false;
  },

  addComponent(entityId, componentName) {
    if (!this.activeScene) return false;
    const { showPop } = usePopAlert();

    const entity = this.activeScene.entities.find(e => e._id === entityId);
    if (!entity) return false;
    
    if (entity.prefabId) {
        showPop({
            title: 'Prefab Restriction',
            message: 'Cannot add components to a Prefab instance. Please Unpack Prefab first.',
            type: 'warning'
        });
        return false;
    }
    
    if (entity.components && entity.components[componentName]) return false;
    
    const newComponentData = createComponent(componentName);
    if (!entity.components) entity.components = {};
    
    entity.components[componentName] = newComponentData;
    return { entityId, componentName, data: newComponentData };
  },

  async removeComponent(entityId, componentName) {
    if (!this.activeScene) return false;
    
    const { showPop } = usePopAlert();
    const { confirm } = useConfirm();

    const entity = this.activeScene.entities.find(e => e._id === entityId);
    if (!entity || !entity.components[componentName]) {
        showPop({ title: 'Error', message: 'Component not found.', type: 'error' });
        return false;
    }
    
    if (entity.prefabId) {
        showPop({
            title: 'Prefab Restriction',
            message: 'Cannot remove components from a Prefab instance. Please Unpack Prefab first.',
            type: 'warning'
        });
        return false;
    }
    
    const isConfirmed = await confirm({
      title: 'Remove Component',
      message: `Are you sure you want to remove "${componentName}"?`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!isConfirmed) return false;
    
    try {
        delete entity.components[componentName];
        EngineBridge.removeComponent({ entityId, componentName });
        showPop({ title: 'Success', message: `Component removed.`, type: 'success' });
        return { entityId, componentName };
    } catch (error) {
        showPop({ title: 'Failed', message: 'Could not remove component.', type: 'error' });
        return false;
    }
  }
};