import { ApplyResizeToEntity } from "../../Util/ApplyResizeToEntity.js";
import { bus } from "../../Util/EventBus.js";

export class TransformOperator {
    constructor(world, game, input) {
        this.world = world;
        this.game = game;
        this.input = input;
    }

    _getTransform(e) {
        return e.components && (e.components.UITransform || e.components.Transform);
    }

    getSnapSettings(isUIMode = false) {
        if (isUIMode) {
            return { shouldSnap: false, gridSize: 1 };
        }

        const gridSettings = this.world.settings?.grid || { snap: true, width: 32 };
        const globalMagnet = gridSettings.snap;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = gridSettings.width || 32;

        return { shouldSnap, gridSize };
    }

    move(nowPos, startPos, startData, selectedList, isUIMode = false) {
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        
        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        let finalDx = dx;
        let finalDy = dy;

        if (shouldSnap && startData.length > 0) {
            const leader = startData[0];
            const rawDestX = leader.x + dx;
            const rawDestY = leader.y + dy;
            
            const snappedX = Math.round(rawDestX / gridSize) * gridSize;
            const snappedY = Math.round(rawDestY / gridSize) * gridSize;

            finalDx = snappedX - leader.x;
            finalDy = snappedY - leader.y;
        }

        let changed = false;
        for (const item of startData) {
            const t = this._getTransform(item.e);
            if (t) {
                const newX = Math.round(item.x + finalDx);
                const newY = Math.round(item.y + finalDy);
                
                if (t.x !== newX || t.y !== newY) {
                    t.x = newX;
                    t.y = newY;
                    changed = true;
                }
            }
        }

        if (changed) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    rotate(nowPos, rotateCenter, rotateStartAngle, entityStartRotation, selectedList, isUIMode = false) {
        if (!selectedList || selectedList.length === 0) return;

        const t = this._getTransform(selectedList[0]);
        if (!t) return;

        // Mouse angle sekarang (Radian)
        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        
        // Selisih rotasi (Radian)
        let deltaAngle = currentAngle - rotateStartAngle;

        // [FIX] Konversi entityStartRotation (Derajat) ke Radian untuk perhitungan
        const startRad = entityStartRotation * (Math.PI / 180);
        let newRad = startRad + deltaAngle;

        // [FIX] Konversi hasil Radian kembali ke Derajat
        let newDeg = newRad * (180 / Math.PI);

        // Normalize 0-360
        newDeg = (newDeg % 360 + 360) % 360;

        const { shouldSnap } = this.getSnapSettings(isUIMode);

        if (shouldSnap) {
            const snapInterval = 15;
            newDeg = Math.round(newDeg / snapInterval) * snapInterval;
        }

        // Simpan sebagai Derajat
        t.rotation = Math.round(newDeg);
        bus.emit("entity:modified", selectedList, true);
    }

    resize(nowPos, startPos, resizeType, startData, selectedList, isUIMode = false) {
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        if (dx === 0 && dy === 0) return;

        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        const item = startData[0];
        const e = item.e;
        const t = this._getTransform(e);
        
        if (!t) return;

        // [FIX] item.r adalah Derajat, konversi ke Radian untuk Math.cos/sin
        const rRad = item.r * (Math.PI / 180);

        const c = Math.cos(-rRad);
        const s = Math.sin(-rRad);
        const localDx = dx * c - dy * s;
        const localDy = dx * s + dy * c;

        const signX = item.sx < 0 ? -1 : 1;
        const signY = item.sy < 0 ? -1 : 1;
        const safeScaleX = Math.abs(item.sx) < 0.001 ? 0.001 : Math.abs(item.sx);
        const safeScaleY = Math.abs(item.sy) < 0.001 ? 0.001 : Math.abs(item.sy);

        let dX_Adjusted = (localDx * signX) / safeScaleX;
        let dY_Adjusted = (localDy * signY) / safeScaleY;

        let dW = 0, dH = 0;
        let anchorX = null, anchorY = null;

        if (resizeType.includes('w')) { dW = -dX_Adjusted; anchorX = item.sx > 0 ? 1 : 0; }
        if (resizeType.includes('e')) { dW = dX_Adjusted;  anchorX = item.sx > 0 ? 0 : 1; }
        if (resizeType.includes('n')) { dH = -dY_Adjusted; anchorY = item.sy > 0 ? 1 : 0; }
        if (resizeType.includes('s')) { dH = dY_Adjusted;  anchorY = item.sy > 0 ? 0 : 1; }

        let rawW = item.w + dW;
        let rawH = item.h + dH;

        if (shouldSnap) {
            if (resizeType.includes('w') || resizeType.includes('e')) {
                rawW = Math.round(rawW / gridSize) * gridSize;
                if (rawW === 0) rawW = gridSize * (item.w < 0 ? -1 : 1);
                dW = rawW - item.w;
            }
            if (resizeType.includes('n') || resizeType.includes('s')) {
                rawH = Math.round(rawH / gridSize) * gridSize;
                if (rawH === 0) rawH = gridSize * (item.h < 0 ? -1 : 1);
                dH = rawH - item.h;
            }
        }

        if (t.isRatioLocked && item.w !== 0 && item.h !== 0) {
            if (resizeType.length === 2 || resizeType === 'e' || resizeType === 'w') {
                rawH = (rawW / item.w) * item.h; 
                dH = rawH - item.h;
            } 
            else if (resizeType === 'n' || resizeType === 's') {
                rawW = (rawH / item.h) * item.w;
                dW = rawW - item.w;
            }
        }

        const newW = Math.round(Math.abs(rawW));
        const newH = Math.round(Math.abs(rawH));

        if (e.components.Tilemap) {
            const tileSize = e.components.Tilemap.tileSize || 32;
            const newCols = Math.round(newW / tileSize);
            const newRows = Math.round(newH / tileSize);
            bus.emit("editor:tilemap:resize", { id: e.id, width: newCols, height: newRows });
        }

        t.width = newW;
        t.height = newH;
        
        t.scaleX = (rawW < 0) ? -item.sx : item.sx;
        t.scaleY = (rawH < 0) ? -item.sy : item.sy;

        const dW_Visual = dW * safeScaleX;
        const dH_Visual = dH * safeScaleY;

        let shiftX_World = 0, shiftY_World = 0;
        if (anchorX !== null) shiftX_World = dW_Visual * ((t.pivotX ?? 0.5) - anchorX);
        if (anchorY !== null) shiftY_World = dH_Visual * ((t.pivotY ?? 0.5) - anchorY);

        const wc = Math.cos(rRad);
        const ws = Math.sin(rRad);

        t.x = Math.round(item.x + (shiftX_World * wc - shiftY_World * ws));
        t.y = Math.round(item.y + (shiftX_World * ws + shiftY_World * wc));
        
        ApplyResizeToEntity(e, this.world);
        bus.emit("entity:modified", selectedList, true);
    }
}