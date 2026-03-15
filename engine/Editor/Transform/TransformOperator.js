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

    _isTilemapMode() {
        const { activeTabId, tabs } = this.world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        return activeTab?.type === 'tilemap';
    }

    getSnapSettings(isUIMode = false) {
        if (isUIMode) return { shouldSnap: false, gridSize: 1 };
        const gridSettings = this.world.settings?.grid || { snap: true, width: 32 };
        const globalMagnet = gridSettings.snap;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = gridSettings.width || 32;
        return { shouldSnap, gridSize };
    }

    move(nowPos, startPos, startData, selectedList, isUIMode = false) {
        if (this._isTilemapMode()) return;
        if (!startData || startData.length === 0) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        let finalDx = dx;
        let finalDy = dy;

        if (shouldSnap && startData.length > 0) {
            const leader = startData[0];
            const targetX = leader.x + dx;
            const targetY = leader.y + dy;
            const snappedX = Math.round(targetX / gridSize) * gridSize;
            const snappedY = Math.round(targetY / gridSize) * gridSize;
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

    rotateSingle(nowPos, rotateCenter, rotateStartAngle, entityStartRotation, selectedList, isUIMode) {
        if (this._isTilemapMode()) return;
        if (!selectedList || selectedList.length === 0) return;
        const t = this._getTransform(selectedList[0]);
        if (!t) return;

        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        let deltaAngle = currentAngle - rotateStartAngle;

        const startRad = entityStartRotation * (Math.PI / 180);
        let newRad = startRad + deltaAngle;
        let newDeg = newRad * (180 / Math.PI);
        newDeg = (newDeg % 360 + 360) % 360;

        const { shouldSnap } = this.getSnapSettings(isUIMode);
        if (shouldSnap) {
            newDeg = Math.round(newDeg / 15) * 15;
        }

        const newRotation = Math.round(newDeg);
        
        if (t.rotation !== newRotation) {
            t.rotation = newRotation;
            t.overridden = true; 
            bus.emit("entity:modified", selectedList, true);
        }
    }

    rotateMulti(nowPos, rotateCenter, rotateStartAngle, entityStartData, selectedList, isUIMode) {
        if (this._isTilemapMode()) return;
        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        let deltaAngle = currentAngle - rotateStartAngle;
        
        const { shouldSnap } = this.getSnapSettings(isUIMode);
        let deltaDeg = deltaAngle * (180 / Math.PI);
        if (shouldSnap) deltaDeg = Math.round(deltaDeg / 15) * 15;
        deltaAngle = deltaDeg * (Math.PI / 180);

        let changed = false;

        for (const item of entityStartData) {
            const t = this._getTransform(item.e);
            if (!t) continue;

            const startRad = item.startRotation * (Math.PI / 180);
            let newDeg = (startRad + deltaAngle) * (180 / Math.PI);
            const newRotation = Math.round((newDeg % 360 + 360) % 360);

            const dx = item.startX - rotateCenter.x;
            const dy = item.startY - rotateCenter.y;
            const cos = Math.cos(deltaAngle);
            const sin = Math.sin(deltaAngle);
            
            const newX = Math.round(rotateCenter.x + (dx * cos - dy * sin));
            const newY = Math.round(rotateCenter.y + (dx * sin + dy * cos));

            if (t.rotation !== newRotation || t.x !== newX || t.y !== newY) {
                t.rotation = newRotation;
                t.x = newX;
                t.y = newY;
                t.overridden = true; 
                changed = true;
            }
        }
        
        if (changed) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    resize(nowPos, startPos, resizeType, startData, selectedList, isUIMode = false) {
        if (this._isTilemapMode()) return;
        if (!startData || startData.length === 0) return;
        const item = startData[0];
        const e = item.e;
        if (e.components?.TextRenderer?.autoFit || e.components?.Tilemap?.autoFit) return;
        
        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;
        if (dx === 0 && dy === 0) return;

        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

        const t = this._getTransform(e);
        if (!t) return;

        const rRad = item.r * (Math.PI / 180);
        const c = Math.cos(-rRad);
        const s = Math.sin(-rRad);
        
        const localDx = dx * c - dy * s;
        const localDy = dx * s + dy * c;

        const safeScaleX = Math.abs(item.sx) < 0.001 ? 0.001 : Math.abs(item.sx);
        const safeScaleY = Math.abs(item.sy) < 0.001 ? 0.001 : Math.abs(item.sy);

        let dVisualW = 0, dVisualH = 0;
        let anchorX = null, anchorY = null; 

        if (resizeType.includes('w')) { dVisualW = -localDx; anchorX = 1; } 
        if (resizeType.includes('e')) { dVisualW = localDx;  anchorX = 0; } 
        if (resizeType.includes('n')) { dVisualH = -localDy; anchorY = 1; } 
        if (resizeType.includes('s')) { dVisualH = localDy;  anchorY = 0; } 

        let rawVisualW = (item.w * safeScaleX) + dVisualW;
        let rawVisualH = (item.h * safeScaleY) + dVisualH;

        if (shouldSnap) {
            let snapW = gridSize;
            let snapH = gridSize;

            if (e.components.Tilemap) {
                const tileW = e.components.Tilemap.tileWidth || gridSize;
                const tileH = e.components.Tilemap.tileHeight || gridSize;
                snapW = tileW * safeScaleX;
                snapH = tileH * safeScaleY;
            }

            if (resizeType.includes('w') || resizeType.includes('e')) {
                rawVisualW = Math.round(rawVisualW / snapW) * snapW;
                if (Math.abs(rawVisualW) < snapW) rawVisualW = snapW * (rawVisualW < 0 ? -1 : 1); 
            }
            if (resizeType.includes('n') || resizeType.includes('s')) {
                rawVisualH = Math.round(rawVisualH / snapH) * snapH;
                if (Math.abs(rawVisualH) < snapH) rawVisualH = snapH * (rawVisualH < 0 ? -1 : 1);
            }
        }

        let rawW = rawVisualW / safeScaleX;
        let rawH = rawVisualH / safeScaleY;

        const startFlipX = item.flipX ?? false;
        const startFlipY = item.flipY ?? false;

        const newFlipX = (rawW < 0) ? !startFlipX : startFlipX;
        const newFlipY = (rawH < 0) ? !startFlipY : startFlipY;

        const newW = Math.max(1, Math.round(Math.abs(rawW)));
        const newH = Math.max(1, Math.round(Math.abs(rawH)));

        const dW = newW - item.w;
        const dH = newH - item.h;
        const dW_Visual = dW * safeScaleX * (startFlipX !== newFlipX ? -1 : 1);
        const dH_Visual = dH * safeScaleY * (startFlipY !== newFlipY ? -1 : 1);

        let shiftX_World = 0, shiftY_World = 0;
        if (anchorX !== null) shiftX_World = dW_Visual * ((t.pivotX ?? 0.5) - anchorX);
        if (anchorY !== null) shiftY_World = dH_Visual * ((t.pivotY ?? 0.5) - anchorY);

        const wc = Math.cos(rRad);
        const ws = Math.sin(rRad);

        const newX = Math.round(item.x + (shiftX_World * wc - shiftY_World * ws));
        const newY = Math.round(item.y + (shiftX_World * ws + shiftY_World * wc));
        
        if (t.width !== newW || t.height !== newH || t.x !== newX || t.y !== newY || t.flipX !== newFlipX || t.flipY !== newFlipY) {
            t.flipX = newFlipX;
            t.flipY = newFlipY;
            t.width = newW;
            t.height = newH;
            t.scaleX = safeScaleX; 
            t.scaleY = safeScaleY;
            t.x = newX;
            t.y = newY;
            t.overridden = true; 
            
            if (e.components.Tilemap) {
                const tileSizeX = e.components.Tilemap.tileWidth || 32;
                const tileSizeY = e.components.Tilemap.tileHeight || 32;
                bus.emit("editor:tilemap:resize", { 
                    id: e.id, 
                    width: Math.round(newW / tileSizeX), 
                    height: Math.round(newH / tileSizeY) 
                });
            }

            ApplyResizeToEntity(e, this.world);
            bus.emit("entity:modified", selectedList, true);
        }
    }
}