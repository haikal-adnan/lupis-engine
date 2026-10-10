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

        const cols = Number(tm.width) || 10;
        const rows = Number(tm.height) || 10;
        const baseTileW = Number(tm.tileWidth) || 32;
        const baseTileH = Number(tm.tileHeight) || 32;

        const scaleX = globalT.scaleX ?? 1;
        const scaleY = globalT.scaleY ?? 1;

        const scaledTileW = baseTileW * scaleX;
        const scaledTileH = baseTileH * scaleY;

        if (scaledTileW === 0 || scaledTileH === 0) return null;

        const totalW = cols * scaledTileW;
        const totalH = rows * scaledTileH;

        const mapLocalX = localX + (totalW * (globalT.pivotX ?? 0));
        const mapLocalY = localY + (totalH * (globalT.pivotY ?? 0));

        const gx = Math.floor(mapLocalX / scaledTileW);
        const gy = Math.floor(mapLocalY / scaledTileH);

        return (gx < 0 || gy < 0 || gx >= cols || gy >= rows) ? null : { x: gx, y: gy };
    }

    static findEntity(world, activeId) {
        const allLayers = [...(world?.layersWorld || []), ...(world?.layersUI || [])];

        for (const layer of allLayers) {
            if (!layer?.entities) continue;

            for (const e of layer.entities) {
                if (e.id === activeId) return e;

                if (e.children && e.children.length > 0) {
                    const found = this._findInChildren(e, activeId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    static _findInChildren(entity, id) {
        for (const child of entity.children) {
            if (child.id === id) return child;

            if (child.children && child.children.length > 0) {
                const found = this._findInChildren(child, id);
                if (found) return found;
            }
        }
        return null;
    }
}