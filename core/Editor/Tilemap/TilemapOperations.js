import { bus } from '../../Util/EventBus.js';
import { TilemapMath } from './TilemapMath.js';

export class TilemapOperations {
    constructor() {
        this.blockBucket = false;
    }

    /**
     * Paint or erase tile at specified grid coordinates
     */
    paint(world, entity, tm, gridX, gridY, assetId, selection, isEraser = false) {
        if (!tm || !tm.data) return;

        const newData = { ...tm.data };
        let isChanged = false;

        // --- ERASER MODE ---
        if (isEraser) {
            const eraserW = selection?.w || 1;
            const eraserH = selection?.h || 1;

            for (let dy = 0; dy < eraserH; dy++) {
                for (let dx = 0; dx < eraserW; dx++) {
                    const tx = Math.floor(gridX + dx);
                    const ty = Math.floor(gridY + dy);
                    const key = `${tx},${ty}`;

                    if (newData[key] !== undefined) {
                        delete newData[key];
                        isChanged = true;
                    }
                }
            }

            if (isChanged) this.applyDataChange(entity, tm, newData);
            return;
        }

        // --- MODE BRUSH / PAINT ---
        if (!selection) return;
        const asset = world?.assets?.textures?.[assetId];
        if (!asset) return;

        const tileW = Number(tm.width) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        if (tilesetCols <= 0) return;

        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const tx = Math.floor(gridX + dx);
                const ty = Math.floor(gridY + dy);
                const key = `${tx},${ty}`;
                const tileId = (selection.y + dy) * tilesetCols + (selection.x + dx) + 1;

                if (newData[key] !== tileId) {
                    newData[key] = tileId;
                    isChanged = true;
                }
            }
        }

        if (isChanged) this.applyDataChange(entity, tm, newData);
    }

    /**
     * Clear all tiles within rectangular marquee area
     */
    deleteArea(entity, tm, startX, startY, width = 1, height = 1) {
        if (!tm || !tm.data) return;

        const oldData = { ...tm.data };
        const newData = { ...tm.data };
        let isChanged = false;

        const minX = Math.floor(startX);
        const minY = Math.floor(startY);
        const maxX = minX + Math.floor(width);
        const maxY = minY + Math.floor(height);

        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                const key = `${x},${y}`;
                if (newData[key] !== undefined) {
                    delete newData[key];
                    isChanged = true;
                }
            }
        }

        if (isChanged) {
            const desc = (width > 1 || height > 1) ? 'Delete Marquee Tiles' : 'Delete Tile';
            this.applyDataChange(entity, tm, newData, oldData, desc);
        }
    }

    /**
     * Strict Bounded Bucket Fill
     */
    handleBucket(world, entity, tm, gridX, gridY, selection) {
        if (!selection || !tm.data) return;
        if (this.blockBucket) return;

        const bounds = TilemapMath.getBounds(tm);

        if (!bounds || !bounds.hasTiles) return;

        if (gridX < bounds.minX || gridX > bounds.maxX || gridY < bounds.minY || gridY > bounds.maxY) {
            return;
        }

        this.blockBucket = true;
        setTimeout(() => this.blockBucket = false, 200);

        const targetX = Math.floor(gridX);
        const targetY = Math.floor(gridY);
        const targetKey = `${targetX},${targetY}`;
        const targetId = tm.data[targetKey] || 0;

        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset) return;

        const tileW = Number(tm.width) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        if (tilesetCols <= 0) return;
        const replaceId = (selection.y * tilesetCols) + selection.x + 1;
        if (targetId === replaceId) return;

        const oldData = { ...tm.data };
        const newData = { ...tm.data };
        const stack = [{ x: targetX, y: targetY }];
        const visited = new Set();
        const MAX_FILL = 20000;
        let count = 0;

        while (stack.length && count < MAX_FILL) {
            const p = stack.pop();
            const key = `${p.x},${p.y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (p.x < bounds.minX || p.x > bounds.maxX || p.y < bounds.minY || p.y > bounds.maxY) {
                continue;
            }

            const currVal = newData[key] || 0;
            if (currVal === targetId) {
                if (replaceId === 0) {
                    delete newData[key];
                } else {
                    newData[key] = replaceId;
                }
                count++;

                stack.push({ x: p.x - 1, y: p.y });
                stack.push({ x: p.x + 1, y: p.y });
                stack.push({ x: p.x, y: p.y - 1 });
                stack.push({ x: p.x, y: p.y + 1 });
            }
        }

        if (count > 0) {
            this.applyDataChange(entity, tm, newData, oldData, 'Bucket Fill');
        }
    }

    startStroke(entity, tm, toolName = 'Paint') {
        if (!this.activeStroke && entity && tm?.data) {
            this.activeStroke = {
                entityId: entity.id,
                initialData: { ...tm.data },
                toolName
            };
        }
    }

    endStroke(entity, tm) {
        if (!this.activeStroke) return;
        const stroke = this.activeStroke;
        this.activeStroke = null;

        if (!entity || !tm?.data) return;
        if (stroke.entityId !== entity.id) return;

        if (JSON.stringify(stroke.initialData) !== JSON.stringify(tm.data)) {
            this.applyDataChange(entity, tm, tm.data, stroke.initialData, `${stroke.toolName} Tiles`);
        }
    }

    handleEyedropper(world, tm, gridX, gridY) {
        if (!tm.data) return;
        const key = `${Math.floor(gridX)},${Math.floor(gridY)}`;
        const tileId = tm.data[key] || 0;
        if (tileId === 0) return;

        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset) return;

        const tileW = Number(tm.width) || 32;
        const tilesetCols = Math.floor(asset.width / tileW);
        if (tilesetCols <= 0) return;
        const id = tileId - 1;
        bus.emit("editor:tool:pickup", { x: id % tilesetCols, y: Math.floor(id / tilesetCols), w: 1, h: 1 });
    }

    applyDataChange(entity, tm, newData, oldData = null, description = 'Update Tilemap') {
        tm.data = newData;
        entity.isDirty = true;
        const payload = { entityId: entity.id, newData: newData };
        if (oldData) {
            payload.oldData = oldData;
            payload.description = description;
        }
        bus.emit("editor:tilemap:update-data", payload);
    }
}