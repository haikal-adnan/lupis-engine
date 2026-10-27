import { bus } from "../../Util/EventBus.js";
import { TransformEngine } from "./TransformEngine.js";

export class TransformMediator {
    constructor(world, game, input, smartGuides = null) {
        this.world = world;
        this.game = game;
        this.input = input;
        this.smartGuides = smartGuides;
        this.engine = new TransformEngine(world);
    }

    _isTilemapMode() {
        const { activeTabId, tabs } = this.world?._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        return activeTab?.type === 'tilemap';
    }

    getSnapSettings(isUIMode = false) {
        if (isUIMode) return { shouldSnap: false, gridSize: 1 };
        const gridSettings = this.world?.settings?.grid || { snap: true, width: 32 };
        const globalMagnet = gridSettings.snap;
        const isCtrlHeld = Boolean(this.input?.keyboard?.isDown("Control"));
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = gridSettings.width || 32;
        return { shouldSnap, gridSize };
    }

    processMove(nowPos, startPos, startData, selectedList, isUIMode) {
        if (this._isTilemapMode() || !startData?.length) return;

        const dx = nowPos.x - startPos.x;
        const dy = nowPos.y - startPos.y;

        let finalDx = dx;
        let finalDy = dy;

        if (isUIMode) {
            const smartGuidesEnabled = this.world?.settings?.ui?.smartGuides !== false;
            const isCtrlHeld = Boolean(this.input?.keyboard?.isDown("Control"));
            const shouldSnap = smartGuidesEnabled ? !isCtrlHeld : isCtrlHeld;

            if (shouldSnap && this.smartGuides) {
                const snapRes = this.smartGuides.calculateSnap(dx, dy);
                finalDx = snapRes.dx;
                finalDy = snapRes.dy;
            } else if (this.smartGuides) {
                this.smartGuides.clearGuides();
            }
        } else {
            const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);

            if (shouldSnap && startData.length > 0) {
                const leader = startData[0];
                const targetX = leader.x + dx;
                const targetY = leader.y + dy;
                const snappedX = Math.round(targetX / gridSize) * gridSize;
                const snappedY = Math.round(targetY / gridSize) * gridSize;
                finalDx = snappedX - leader.x;
                finalDy = snappedY - leader.y;
            }
        }

        let changed = false;
        for (const item of startData) {
            if (this.engine.applyTranslation(item.e, item.x, item.y, finalDx, finalDy)) {
                changed = true;
            }
        }

        if (changed) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    processRotateSingle(nowPos, rotateCenter, rotateStartAngle, entityStartRotation, selectedList, isUIMode) {
        if (this._isTilemapMode() || !selectedList?.length) return;

        const e = selectedList[0];
        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        const deltaAngle = currentAngle - rotateStartAngle;

        const startRad = entityStartRotation * (Math.PI / 180);
        let newDeg = (startRad + deltaAngle) * (180 / Math.PI);

        const { shouldSnap } = this.getSnapSettings(isUIMode);
        if (shouldSnap) newDeg = Math.round(newDeg / 15) * 15;

        if (this.engine.applyRotation(e, newDeg)) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    processRotateMulti(nowPos, rotateCenter, rotateStartAngle, entityStartData, selectedList, isUIMode) {
        if (this._isTilemapMode() || !entityStartData?.length) return;

        const currentAngle = Math.atan2(nowPos.y - rotateCenter.y, nowPos.x - rotateCenter.x);
        let deltaAngle = currentAngle - rotateStartAngle;

        const { shouldSnap } = this.getSnapSettings(isUIMode);
        let deltaDeg = deltaAngle * (180 / Math.PI);
        if (shouldSnap) deltaDeg = Math.round(deltaDeg / 15) * 15;
        deltaAngle = deltaDeg * (Math.PI / 180);

        let changed = false;
        for (const item of entityStartData) {
            const startRad = item.startRotation * (Math.PI / 180);
            const newDeg = (startRad + deltaAngle) * (180 / Math.PI);

            const dx = item.startX - rotateCenter.x;
            const dy = item.startY - rotateCenter.y;
            const cos = Math.cos(deltaAngle);
            const sin = Math.sin(deltaAngle);

            const newX = Math.round(rotateCenter.x + (dx * cos - dy * sin));
            const newY = Math.round(rotateCenter.y + (dx * sin + dy * cos));

            const rotChanged = this.engine.applyRotation(item.e, newDeg);
            const t = this.engine.getTransform(item.e);
            let posChanged = false;

            if (t && (t.x !== newX || t.y !== newY)) {
                t.x = newX;
                t.y = newY;
                posChanged = true;
            }

            if (rotChanged || posChanged) changed = true;
        }

        if (changed) {
            bus.emit("entity:modified", selectedList, true);
        }
    }

    processResize(nowPos, startPos, resizeType, startData, selectedList, isUIMode) {
        if (this._isTilemapMode() || !startData?.length) return;

        const item = startData[0];
        const e = item.e;
        if (e?.components?.Tilemap?.autoFit) return;

        let dx = nowPos.x - startPos.x;
        let dy = nowPos.y - startPos.y;

        if (isUIMode) {
            const smartGuidesEnabled = this.world?.settings?.ui?.smartGuides !== false;
            const isCtrlHeld = Boolean(this.input?.keyboard?.isDown("Control"));
            const shouldSnap = smartGuidesEnabled ? !isCtrlHeld : isCtrlHeld;

            if (shouldSnap && this.smartGuides) {
                const snapRes = this.smartGuides.calculateResizeSnap(dx, dy, resizeType);
                dx = snapRes.dx;
                dy = snapRes.dy;
            } else if (this.smartGuides) {
                this.smartGuides.clearGuides();
            }
        }

        if (dx === 0 && dy === 0) return;

        const { shouldSnap, gridSize } = this.getSnapSettings(isUIMode);
        const globalT = this.engine.getGlobalTransform(e);
        const rRad = (globalT.rotation || 0) * (Math.PI / 180);

        const localDx = dx * Math.cos(-rRad) - dy * Math.sin(-rRad);
        const localDy = dx * Math.sin(-rRad) + dy * Math.cos(-rRad);

        const t = this.engine.getTransform(e);
        const isShift = Boolean(this.input?.keyboard?.isDown("Shift"));
        const lockRatio = Boolean(t?.isRatioLocked || item.isRatioLocked || isShift);

        const res = this.engine.applyResize(e, item, localDx, localDy, resizeType, shouldSnap, gridSize, lockRatio);

        if (res.changed) {
            if (e.components.Tilemap) {
                const tileSizeX = e.components.Tilemap.tileWidth || 32;
                const tileSizeY = e.components.Tilemap.tileHeight || 32;
                bus.emit("editor:tilemap:resize", {
                    id: e.id,
                    width: Math.round(res.newW / tileSizeX),
                    height: Math.round(res.newH / tileSizeY)
                });
            }
            bus.emit("entity:modified", selectedList, true);
        }
    }
}