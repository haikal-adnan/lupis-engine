import RenderUtils from "../Renderer/Scene/RenderUtils.js";

export default class PointerRaycast {
    static getTopEntityUnderPointer(game) {
        const world = game.world;
        const camera = game.camera;
        const pointer = game.input.getPointer();
        const canvas = game.renderer?.canvas || { width: 1920, height: 1080 };

        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiPointer = {
            x: (pointer.x / canvas.width) * uiSettings.width,
            y: (pointer.y / canvas.height) * uiSettings.height
        };

        const halfW = canvas.width / 2;
        const halfH = canvas.height / 2;
        const worldPointer = {
            x: camera.x + (pointer.x - halfW) / (camera.scale || 1),
            y: camera.y + (pointer.y - halfH) / (camera.scale || 1)
        };

        const sortLayersDescending = (a, b) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zB - zA;
            
            const oA = a.orderIndex ?? 0;
            const oB = b.orderIndex ?? 0;
            return oB - oA;
        };

        const sortedUILayers = [...(world.layersUI || [])].sort(sortLayersDescending);
        const sortedWorldLayers = [...(world.layersWorld || [])].sort(sortLayersDescending);

        const allLayers = [...sortedUILayers, ...sortedWorldLayers];

        const isEntityAndParentsActive = (entity, world) => {
            if (entity.active === false || entity.visible === false) return false;
            
            let current = entity;
            while (current.parentId) {
                current = world.entities.find(e => e.id === current.parentId);
                if (!current) break; 
                if (current.active === false || current.visible === false) return false;
            }
            return true;
        };

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || !layer.entities) continue;
            
            const isUILayer = layer.scriptId === 'ui' || layer.scriptId?.toLowerCase().includes('ui');

            const sortedEntities = RenderUtils.getHierarchicalOrder(layer.entities).reverse();

            for (const entity of sortedEntities) {
                if (!isEntityAndParentsActive(entity, world)) continue;

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