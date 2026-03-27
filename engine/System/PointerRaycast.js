export default class PointerRaycast {
    /**
     * Mengembalikan satu Entity teratas (top-most) yang tersentuh oleh pointer.
     * Mengabaikan entitas yang tidak memiliki visual (Sprite/Shape/Text) ATAU Collider.
     */
    static getTopEntityUnderPointer(game) {
        const world = game.world;
        const camera = game.camera;
        const pointer = game.input.getPointer();
        const canvas = game.renderer?.canvas || { width: 1920, height: 1080 };

        // 1. Siapkan koordinat Pointer untuk UI dan World
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

        // 2. Kumpulkan layer, tapi PISAHKAN pengurutan UI dan World
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

        // Gabungkan: Pastikan layer UI SELALU dievaluasi duluan (berada di array terdepan)
        const allLayers = [...sortedUILayers, ...sortedWorldLayers];

        // 3. Evaluasi dari layer paling atas ke bawah
        for (const layer of allLayers) {
            if (layer.active === false || !layer.visible || !layer.entities) continue;
            
            const isUILayer = layer.scriptId === 'ui' || (layer.name && layer.name.includes('UI'));

            // Urutkan entitas di dalam layer DESCENDING
            const sortedEntities = [...layer.entities].sort((a, b) => {
                const zA = a.zIndex ?? 0;
                const zB = b.zIndex ?? 0;
                if (zA !== zB) return zB - zA;

                const oA = a.orderIndex ?? 0;
                const oB = b.orderIndex ?? 0;
                if (oA !== oB) return oB - oA;

                // Child harus dievaluasi mendahului Parent-nya
                const depthA = this._getEntityDepth(a, world);
                const depthB = this._getEntityDepth(b, world);
                return depthB - depthA; 
            });

            // 4. Hit-test setiap entity
            for (const entity of sortedEntities) {
                if (entity.active === false) continue;

                const comps = entity.components;
                if (!comps) continue;

                const hasUITransform = !!comps.UITransform;
                const hasTransform = !!comps.Transform;
                
                // Jika tidak punya Transform sama sekali, tidak bisa dihitung ukurannya
                if (!hasUITransform && !hasTransform) continue;

                // KITA HAPUS FILTER VISUAL/COLLIDER DI SINI.
                // Entitas kosong yang hanya punya Transform kini SAH menjadi penahan klik.

                const isEntityUI = isUILayer || hasUITransform;
                const t = hasUITransform ? comps.UITransform : comps.Transform;
                const globalT = this._getGlobalTransform(entity, world);

                let drawX = globalT.x || 0;
                let drawY = globalT.y || 0;
                let targetPointer = isEntityUI ? uiPointer : worldPointer;

                if (hasUITransform) {
                    const anchorX = t.anchorX ?? 0.5;
                    const anchorY = t.anchorY ?? 0.5;
                    drawX = (uiSettings.width * anchorX) + (globalT.x || 0);
                    drawY = (uiSettings.height * anchorY) + (globalT.y || 0);
                }

                // Cek apakah pointer berada di dalam area Transform atau Collider
                const isHit = this._checkIntersection(entity, globalT, drawX, drawY, targetPointer.x, targetPointer.y);
                
                if (isHit) {
                    return entity; // Kembalikan entitas ini, tidak peduli dia visible atau invisible!
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
            current = world.entities.find(e => e.id === current.parentId || e._id === current.parentId);
            if (!current) break;
        }
        return depth;
    }

    static _getGlobalTransform(e, world) {
        const t = e.components && (e.components.UITransform || e.components.Transform);
        if (!t) return { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, width: 100, height: 100 };

        if (!e.parentId) return {
            x: t.x, y: t.y, rotation: t.rotation || 0,
            scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1,
            pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5,
            width: t.width, height: t.height
        };

        const parentEntity = world.entities.find(ent => ent.id === e.parentId || ent._id === e.parentId);
        if (!parentEntity) return { ...t }; 

        const parentGlobal = this._getGlobalTransform(parentEntity, world);
        const parentRad = parentGlobal.rotation * (Math.PI / 180);
        const cos = Math.cos(parentRad);
        const sin = Math.sin(parentRad);

        const scaledLocalX = t.x * parentGlobal.scaleX;
        const scaledLocalY = t.y * parentGlobal.scaleY;

        return {
            x: parentGlobal.x + (scaledLocalX * cos) - (scaledLocalY * sin),
            y: parentGlobal.y + (scaledLocalX * sin) + (scaledLocalY * cos),
            rotation: parentGlobal.rotation + (t.rotation || 0),
            scaleX: parentGlobal.scaleX * (t.scaleX ?? 1),
            scaleY: parentGlobal.scaleY * (t.scaleY ?? 1),
            pivotX: t.pivotX ?? 0.5, pivotY: t.pivotY ?? 0.5,
            width: t.width, height: t.height
        };
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
            // Fallback bounding box murni jika tak ada collider
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