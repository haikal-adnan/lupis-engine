import RenderUtils from "../Renderer/Scene/RenderUtils.js";

export default class PointerRaycast {
    static _isEntityAndParentsActive(entity, world) {
        if (!entity || entity.active === false || entity.visible === false) return false;
        if (!world) return true;
        let current = entity;
        while (current && current.parentId) {
            const parentId = current.parentId;
            current = world.entities ? world.entities.find(e => e.id === parentId || (e.scriptId && e.scriptId === parentId)) : null;
            if (!current) break;
            if (current.active === false || current.visible === false) return false;
        }
        return true;
    }

    static _isEntityInUILayer(world, entity) {
        if (!world || !entity) return false;
        const uiLayers = world.layersUI || [];
        for (const layer of uiLayers) {
            if (!layer) continue;
            if (entity.layerId && (layer.id === entity.layerId || layer.scriptId === entity.layerId)) {
                return true;
            }
            if (layer.entities && layer.entities.some(e => e === entity || (e && entity && (e.id === entity.id || (e.scriptId && e.scriptId === entity.scriptId))))) {
                return true;
            }
        }
        if (entity.layerId && String(entity.layerId).toLowerCase().includes('ui')) {
            return true;
        }
        return false;
    }

    static _findEntityLayer(world, entity) {
        if (!world || !entity) return null;
        const allLayers = [...(world.layersUI || []), ...(world.layersWorld || [])];
        if (entity.layerId) {
            const found = allLayers.find(l => l.id === entity.layerId || l.scriptId === entity.layerId);
            if (found) return found;
        }
        return allLayers.find(l => l.entities && l.entities.some(e => e === entity || (e && entity && (e.id === entity.id || (e.scriptId && e.scriptId === entity.scriptId))))) || null;
    }

    static _getEntityChildren(world, entity) {
        if (!world || !entity) return [];
        const allEntities = world.entities || [];
        const children = [];
        const targetId = entity.id;
        const targetScriptId = entity.scriptId;
        for (const e of allEntities) {
            if (!e || e === entity) continue;
            if ((targetId && e.parentId === targetId) || (targetScriptId && e.parentId === targetScriptId)) {
                children.push(e);
            }
        }
        if (Array.isArray(entity.children)) {
            for (const child of entity.children) {
                if (child && !children.includes(child)) {
                    children.push(child);
                }
            }
        }
        return children;
    }

    static _checkEntityHit(game, ent, uiPointer, worldPointer) {
        if (!ent || ent.active === false || ent.visible === false) return false;
        const comps = ent.components;
        if (!comps || (!comps.UITransform && !comps.Transform)) return false;
        const isEntityUI = Boolean(comps.UITransform) || this._isEntityInUILayer(game.world, ent);
        const targetPointer = isEntityUI ? uiPointer : worldPointer;
        const absT = this._getGlobalTransform(ent, game.world);
        return this._checkIntersection(ent, absT, absT.x, absT.y, targetPointer.x, targetPointer.y);
    }

    static _checkEntityAndDescendantsHit(game, entity, uiPointer, worldPointer) {
        if (this._checkEntityHit(game, entity, uiPointer, worldPointer)) {
            return true;
        }
        const children = this._getEntityChildren(game.world, entity);
        for (const child of children) {
            if (child.active === false || child.visible === false) continue;
            if (this._checkEntityAndDescendantsHit(game, child, uiPointer, worldPointer)) {
                return true;
            }
        }
        return false;
    }

    static getTopEntityUnderPointer(game) {
        const world = game.world;
        if (!world) return null;
        const camera = game.camera || { x: 0, y: 0, scale: 1 };
        const pointer = game.input?.getPointer ? game.input.getPointer() : null;
        if (!pointer) return null;

        const canvas = game.renderer?.canvas || game.renderer?.gl?.canvas || game.input?.mouse?.canvas || { width: 1920, height: 1080 };
        const canvasW = canvas.width || 1920;
        const canvasH = canvas.height || 1080;

        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiPointer = {
            x: (pointer.x / canvasW) * (uiSettings.width || 1920),
            y: (pointer.y / canvasH) * (uiSettings.height || 1080)
        };

        const halfW = canvasW / 2;
        const halfH = canvasH / 2;
        const worldPointer = {
            x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
            y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
        };

        const sortLayersDescending = (a, b) => {
            const zA = Number(a.zIndex ?? 0);
            const zB = Number(b.zIndex ?? 0);
            if (zA !== zB) return zB - zA;
            
            const oA = Number(a.orderIndex ?? 0);
            const oB = Number(b.orderIndex ?? 0);
            return oB - oA;
        };

        const sortedUILayers = [...(world.layersUI || [])].sort(sortLayersDescending);
        const sortedWorldLayers = [...(world.layersWorld || [])].sort(sortLayersDescending);

        const allLayers = [...sortedUILayers, ...sortedWorldLayers];

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || !layer.entities) continue;
            if (game.layerSystem ? game.layerSystem.isInputFrozen(layer.id, 'pointer') : (layer.freezeInput && (layer.freezeInputType === 'all' || layer.freezeInputType === 'pointer'))) continue;
            
            const isUILayer = (world.layersUI && world.layersUI.includes(layer)) || layer.scriptId === 'ui' || layer.scriptId?.toLowerCase().includes('ui') || layer.id?.toLowerCase().includes('ui');

            const sortedEntities = RenderUtils.getHierarchicalOrder(layer.entities).reverse();

            for (const entity of sortedEntities) {
                if (!this._isEntityAndParentsActive(entity, world)) continue;

                const comps = entity.components;
                if (!comps) continue;

                const hasUITransform = !!comps.UITransform;
                const hasTransform = !!comps.Transform;
                
                if (!hasUITransform && !hasTransform) continue;

                const isEntityUI = isUILayer || hasUITransform;
                const targetPointer = isEntityUI ? uiPointer : worldPointer;

                const absT = RenderUtils.calculateAbsoluteTransform(entity, world);
                const drawX = absT.x;
                const drawY = absT.y;

                const isHit = this._checkIntersection(entity, absT, drawX, drawY, targetPointer.x, targetPointer.y);
                
                if (isHit) {
                    return entity; 
                }
            }
        }

        return null;
    }

    static isPointerOver(game, entity, useRaycast = true) {
        if (!game || !entity) return false;
        if (!this._isEntityAndParentsActive(entity, game.world)) return false;
        if (game.layerSystem?.isEntityInputFrozen(entity, 'pointer')) return false;

        const entityLayer = this._findEntityLayer(game.world, entity);
        if (entityLayer) {
            if (entityLayer.active === false || entityLayer.visible === false) return false;
            if (game.layerSystem ? game.layerSystem.isInputFrozen(entityLayer.id, 'pointer') : (entityLayer.freezeInput && (entityLayer.freezeInputType === 'all' || entityLayer.freezeInputType === 'pointer'))) return false;
        }

        const shouldRaycast = useRaycast === undefined ? true : (typeof useRaycast === 'string' ? (useRaycast.toLowerCase() === 'true' || useRaycast === '1') : Boolean(useRaycast));

        if (shouldRaycast) {
            if (!game.world || typeof this.getTopEntityUnderPointer !== 'function') return false;
            const topEntity = this.getTopEntityUnderPointer(game);
            if (!topEntity) return false;
            if (!this._isEntityAndParentsActive(topEntity, game.world)) return false;

            const matchesEntity = (cand) => {
                if (!cand) return false;
                if (cand.active === false || cand.visible === false) return false;
                if (cand === entity) return true;
                if (entity.id && cand.id === entity.id) return true;
                if (entity.scriptId && cand.scriptId === entity.scriptId) return true;
                return false;
            };

            if (matchesEntity(topEntity)) return true;
            let currentParentId = topEntity.parentId;
            while (currentParentId) {
                const p = game.world?.entities?.find(e => e.id === currentParentId || (e.scriptId && e.scriptId === currentParentId));
                if (p && (!this._isEntityAndParentsActive(p, game.world))) return false;
                if (matchesEntity(p)) return true;
                currentParentId = p ? p.parentId : null;
            }
            return false;
        } else {
            if (!game.input || typeof game.input.getPointer !== 'function') return false;
            const pointer = game.input.getPointer(entity);
            if (!pointer) return false;

            const canvas = game.renderer?.canvas || game.renderer?.gl?.canvas || game.input?.mouse?.canvas || { width: 1920, height: 1080 };
            const canvasW = canvas.width || 1920;
            const canvasH = canvas.height || 1080;
            const uiSettings = game.world?.settings?.ui || { width: 1920, height: 1080 };
            const camera = game.camera || { x: 0, y: 0, scale: 1 };

            const uiPointer = {
                x: (pointer.x / canvasW) * (uiSettings.width || 1920),
                y: (pointer.y / canvasH) * (uiSettings.height || 1080)
            };
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;
            const worldPointer = {
                x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
                y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
            };

            return this._checkEntityAndDescendantsHit(game, entity, uiPointer, worldPointer);
        }
    }

    static _getEntityDepth(entity, world) {
        let depth = 0;
        let current = entity;
        while (current.parentId) {
            depth++;
            current = world.entities.find(e => e.id === current.parentId);
            if (!current) break;
        }
        return depth;
    }

    static _getGlobalTransform(e, world) {
        return RenderUtils.calculateAbsoluteTransform(e, world);
    }

    static _checkIntersection(entity, t, drawX, drawY, pointerX, pointerY) {
        const tRotRad = (t.rotation || 0) * (Math.PI / 180);
        const hasColliderData = entity.components?.Collider?.data && Array.isArray(entity.components.Collider.data);

        if (hasColliderData) {
            const colData = entity.components.Collider.data;
            const cosT = Math.cos(tRotRad);
            const sinT = Math.sin(tRotRad);

            for (let i = 0; i < colData.length; i++) {
                const c = colData[i];
                if (!c.enabled) continue;

                const cW = (c.autoFit ? t.width : c.width) * Math.abs(t.scaleX ?? 1);
                const cH = (c.autoFit ? t.height : c.height) * Math.abs(t.scaleY ?? 1);
                const pX = c.pivotX ?? 0.5;
                const pY = c.pivotY ?? 0.5;

                const localTlX = -t.width * Math.abs(t.scaleX ?? 1) * (t.pivotX ?? 0.5) + (c.offsetX || 0) * Math.abs(t.scaleX ?? 1);
                const localTlY = -t.height * Math.abs(t.scaleY ?? 1) * (t.pivotY ?? 0.5) + (c.offsetY || 0) * Math.abs(t.scaleY ?? 1);

                const localPx = localTlX + cW * pX;
                const localPy = localTlY + cH * pY;

                const worldPx = drawX + localPx * cosT - localPy * sinT;
                const worldPy = drawY + localPx * sinT + localPy * cosT;

                const totalRot = c.autoFit ? tRotRad : tRotRad + ((c.rotation || 0) * (Math.PI / 180));

                const relX = pointerX - worldPx;
                const relY = pointerY - worldPy;
                const rotMouseX = relX * Math.cos(-totalRot) - relY * Math.sin(-totalRot);
                const rotMouseY = relX * Math.sin(-totalRot) + relY * Math.cos(-totalRot);

                const left = -cW * pX;
                const right = cW * (1 - pX);
                const top = -cH * pY;
                const bottom = cH * (1 - pY);

                if (rotMouseX >= left && rotMouseX <= right && rotMouseY >= top && rotMouseY <= bottom) {
                    return true;
                }
            }
            return false;
        } else {
            const boxW = t.width * Math.abs(t.scaleX ?? 1);
            const boxH = t.height * Math.abs(t.scaleY ?? 1);
            const pivotOffsetX = boxW * (t.pivotX ?? 0.5);
            const pivotOffsetY = boxH * (t.pivotY ?? 0.5);
            
            const centerX = drawX - pivotOffsetX + (boxW / 2);
            const centerY = drawY - pivotOffsetY + (boxH / 2);

            const relX = pointerX - centerX;
            const relY = pointerY - centerY;
            
            const rotMouseX = relX * Math.cos(-tRotRad) - relY * Math.sin(-tRotRad);
            const rotMouseY = relX * Math.sin(-tRotRad) + relY * Math.cos(-tRotRad);

            return Math.abs(rotMouseX) <= boxW / 2 && Math.abs(rotMouseY) <= boxH / 2;
        }
    }
}