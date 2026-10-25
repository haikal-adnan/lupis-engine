import RenderUtils from "../../Renderer/Scene/RenderUtils.js";
import { CanvasToWorld } from "../../Util/MapToCanvasPixels.js";

export class TilemapMath {
    static getMouseGridPosition(game, entity, tm) {
        const globalT = RenderUtils.getGlobalTransform(entity, game.world);
        const canvas = game?.renderer?.canvas;
        if (!canvas || !game.camera || !game.input) return null;

        const worldP = CanvasToWorld(game.input.mouse.x, game.input.mouse.y, game.camera, canvas);

        const dx = worldP.x - globalT.x;
        const dy = worldP.y - globalT.y;

        const rad = -(globalT.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const localX = (dx * cos) - (dy * sin);
        const localY = (dx * sin) + (dy * cos);

        const scaleX = (globalT.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
        const scaleY = (globalT.flipY ? -1 : 1) * (globalT.scaleY ?? 1);

        const tileW = (Number(tm.width) || 32) * scaleX;
        const tileH = (Number(tm.height) || 32) * scaleY;

        if (tileW === 0 || tileH === 0) return null;

        const gx = Math.floor(localX / tileW);
        const gy = Math.floor(localY / tileH);

        return { x: gx, y: gy };
    }

    // Invalidates cached bounds to force recalculation on next query
    static invalidateBounds(tm) {
        if (tm) tm._boundsDirty = true;
    }

    // Computes actual bounding box from placed tiles with caching
    static getBounds(tm) {
        if (!tm) {
            return {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: 32,
                height: 32,
                hasTiles: false
            };
        }

        const tileW = Number(tm.width) || 32;
        const tileH = Number(tm.height) || 32;

        // Return cached bounds if data reference hasn't changed and not marked dirty
        if (
            !tm._boundsDirty &&
            tm._bounds &&
            tm._boundsDataRef === tm.data &&
            tm._boundsTileW === tileW &&
            tm._boundsTileH === tileH
        ) {
            return tm._bounds;
        }

        const data = tm.data;
        if (!data) {
            const defaultBounds = {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: tileW,
                height: tileH,
                hasTiles: false
            };
            tm._bounds = defaultBounds;
            tm._boundsDataRef = data;
            tm._boundsTileW = tileW;
            tm._boundsTileH = tileH;
            tm._boundsDirty = false;
            tm._placedTiles = [];
            return defaultBounds;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let hasTiles = false;
        const placedTiles = [];

        for (const key in data) {
            const id = data[key];
            if (!id || id <= 0) continue;

            const commaIdx = key.indexOf(',');
            if (commaIdx === -1) continue;

            const x = parseInt(key.substring(0, commaIdx), 10);
            const y = parseInt(key.substring(commaIdx + 1), 10);
            if (isNaN(x) || isNaN(y)) continue;

            hasTiles = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            placedTiles.push({ x, y, tileId: id });
        }

        let bounds;
        if (!hasTiles) {
            bounds = {
                minX: 0, maxX: 0, minY: 0, maxY: 0,
                offsetX: 0, offsetY: 0,
                width: tileW,
                height: tileH,
                hasTiles: false
            };
        } else {
            const cols = maxX - minX + 1;
            const rows = maxY - minY + 1;
            bounds = {
                minX, maxX, minY, maxY,
                offsetX: minX * tileW,
                offsetY: minY * tileH,
                width: cols * tileW,
                height: rows * tileH,
                hasTiles: true
            };
        }

        tm._bounds = bounds;
        tm._boundsDataRef = data;
        tm._boundsTileW = tileW;
        tm._boundsTileH = tileH;
        tm._boundsDirty = false;
        tm._placedTiles = placedTiles;

        return bounds;
    }

    static getPlacedTiles(tm) {
        if (!tm) return [];
        this.getBounds(tm);
        return tm._placedTiles || [];
    }

    static getTilemapQuadVertices(absPos, tm, rotationRad, scaleX, scaleY) {
        const bounds = this.getBounds(tm);
        const tileW = Number(tm?.width) || 32;
        const tileH = Number(tm?.height) || 32;

        const localMinX = bounds.minX * tileW * scaleX;
        const localMinY = bounds.minY * tileH * scaleY;
        const localW = bounds.width * scaleX;
        const localH = bounds.height * scaleY;

        const localCorners = [
            { x: localMinX,          y: localMinY },          
            { x: localMinX + localW, y: localMinY },          
            { x: localMinX + localW, y: localMinY + localH }, 
            { x: localMinX,          y: localMinY + localH }  
        ];

        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        const worldCorners = localCorners.map(pt => ({
            x: absPos.x + (pt.x * cos - pt.y * sin),
            y: absPos.y + (pt.x * sin + pt.y * cos)
        }));

        return {
            tl: worldCorners[0],
            tr: worldCorners[1],
            br: worldCorners[2],
            bl: worldCorners[3]
        };
    }

    static findEntity(world, activeId) {
        if (!activeId) return null;
        const allLayers = [...(world?.layersWorld || []), ...(world?.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer?.entities) continue;
            for (const e of layer.entities) {
                if (String(e.id) === String(activeId)) return e;
                if (e.children?.length) {
                    const found = this._findInChildren(e, activeId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    static _findInChildren(entity, id) {
        for (const child of entity.children) {
            if (String(child.id) === String(id)) return child;
            if (child.children?.length) {
                const found = this._findInChildren(child, id);
                if (found) return found;
            }
        }
        return null;
    }
}

export default TilemapMath;
