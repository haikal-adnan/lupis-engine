import { bus } from '../../Util/EventBus.js';

export class TilemapOperations {
    constructor() {
        this.blockBucket = false;
    }

    paint(world, entity, tm, gridX, gridY, assetId, selection, isEraser = false) {
        if (!selection || !tm.data) return;
        const cols = tm.width;
        const asset = world?.assets?.textures?.[assetId];
        if (!asset) return;

        const tileW = Number(tm.tileWidth) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        const newData = [...tm.data];
        let isChanged = false;

        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const tx = gridX + dx;
                const ty = gridY + dy;
                if (tx >= 0 && tx < cols && ty >= 0 && ty < tm.height) {
                    const idx = ty * cols + tx;
                    const tileId = isEraser ? 0 : (selection.y + dy) * tilesetCols + (selection.x + dx) + 1;
                    if (newData[idx] !== tileId) {
                        newData[idx] = tileId;
                        isChanged = true;
                    }
                }
            }
        }
        if (isChanged) this.applyDataChange(entity, tm, newData);
    }

    handleBucket(world, entity, tm, gridX, gridY, selection) {
        if (!selection || !tm.data) return;

        if (this.blockBucket) return;
        this.blockBucket = true;
        setTimeout(() => this.blockBucket = false, 200);

        const cols = tm.width;
        const rows = tm.height;
        const targetId = tm.data[gridY * cols + gridX];
        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset) return;

        const tileW = Number(tm.tileWidth) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        const replaceId = (selection.y * tilesetCols) + selection.x + 1;
        if (targetId === replaceId) return;

        const newData = [...tm.data];
        const stack = [{ x: gridX, y: gridY }];
        while (stack.length) {
            const p = stack.pop();
            const idx = p.y * cols + p.x;
            if (newData[idx] === targetId) {
                newData[idx] = replaceId;
                if (p.x > 0) stack.push({ x: p.x - 1, y: p.y });
                if (p.x < cols - 1) stack.push({ x: p.x + 1, y: p.y });
                if (p.y > 0) stack.push({ x: p.x, y: p.y - 1 });
                if (p.y < rows - 1) stack.push({ x: p.x, y: p.y + 1 });
            }
        }
        this.applyDataChange(entity, tm, newData);
    }

    handleEyedropper(world, tm, gridX, gridY) {
        if (!tm.data) return;
        const tileId = tm.data[gridY * tm.width + gridX];
        if (tileId === 0) return;

        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset) return;

        const tileW = Number(tm.tileWidth) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        const id = tileId - 1;
        bus.emit("editor:tool:pickup", { x: id % tilesetCols, y: Math.floor(id / tilesetCols), w: 1, h: 1 });
    }

    applyDataChange(entity, tm, newData) {
        tm.data = newData;
        entity.isDirty = true;
        bus.emit("editor:tilemap:update-data", { entityId: entity.id, newData: newData });
    }
}