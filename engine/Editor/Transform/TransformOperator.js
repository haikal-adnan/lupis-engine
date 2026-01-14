import { ApplyResizeToEntity } from "../../Util/ApplyResizeToEntity.js";
import { bus } from "../../Util/EventBus.js";

export class TransformOperator {
    constructor(world, game, input) {
        this.world = world;
        this.game = game;
        this.input = input;
    }

    _getTransform(e) {
        return e.components && e.components.Transform;
    }

    getSnapSettings() {
        const gridCtx = this.world._editors?.gridContext;
        const globalMagnet = gridCtx ? gridCtx.magnet : true;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = (this.game.grid && this.game.grid.width) ? this.game.grid.width : 50;
        return { shouldSnap, gridSize };
    }

    move(nowPos, startPos, startData, selectedList) {
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        const { shouldSnap, gridSize } = this.getSnapSettings();

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

    rotate(nowPos, rotateCenter, rotateStartAngle, entityStartRotation, selectedList) {
        const t = this._getTransform(selectedList[0]);
        if (!t) return;

        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        let deltaAngle = currentAngle - rotateStartAngle;
        let newRotation = entityStartRotation + deltaAngle;

        const { shouldSnap } = this.getSnapSettings();

        if (shouldSnap) {
            const deg = newRotation * (180 / Math.PI);
            const snapInterval = 15;
            const snappedDeg = Math.round(deg / snapInterval) * snapInterval;
            newRotation = snappedDeg * (Math.PI / 180);
        }

        t.rotation = newRotation;
        bus.emit("entity:modified", selectedList, true);
    }

    resize(nowPos, startPos, resizeType, startData, selectedList) {
        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        if (dx === 0 && dy === 0) return;

        const { shouldSnap, gridSize } = this.getSnapSettings();

        const item = startData[0];
        const e = item.e;
        const t = this._getTransform(e);

        const c = Math.cos(-item.r);
        const s = Math.sin(-item.r);
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

        const wc = Math.cos(item.r);
        const ws = Math.sin(item.r);

        t.x = Math.round(item.x + (shiftX_World * wc - shiftY_World * ws));
        t.y = Math.round(item.y + (shiftX_World * ws + shiftY_World * wc));

        ApplyResizeToEntity(e, this.world);
        bus.emit("entity:modified", selectedList, true);
    }
}