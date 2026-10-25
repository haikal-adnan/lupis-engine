import { TilemapMath } from "./TilemapMath.js";

export default class TilemapSystem {
    constructor(game) {
        this.game = game;
    }

    getBounds(tm) {
        return TilemapMath.getBounds(tm);
    }

    invalidateBounds(tm) {
        TilemapMath.invalidateBounds(tm);
    }

    getPlacedTiles(tm) {
        return TilemapMath.getPlacedTiles(tm);
    }

    getQuadVertices(absPos, tm, rotationRad, scaleX = 1, scaleY = 1) {
        return TilemapMath.getTilemapQuadVertices(absPos, tm, rotationRad, scaleX, scaleY);
    }

    getMouseGridPosition(entity, tm) {
        return TilemapMath.getMouseGridPosition(this.game, entity, tm);
    }

    getTile(tm, x, y) {
        if (!tm || !tm.data) return 0;
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        return tm.data[key] || 0;
    }

    setTile(tm, x, y, tileId) {
        if (!tm) return;
        if (!tm.data) tm.data = {};
        const key = `${Math.floor(x)},${Math.floor(y)}`;
        const id = Number(tileId) || 0;

        if (id <= 0) {
            delete tm.data[key];
        } else {
            tm.data[key] = id;
        }

        TilemapMath.invalidateBounds(tm);
    }

    hasTile(tm, x, y) {
        return this.getTile(tm, x, y) > 0;
    }

    clear(tm) {
        if (!tm) return;
        tm.data = {};
        TilemapMath.invalidateBounds(tm);
    }
}

export { TilemapSystem, TilemapMath };
