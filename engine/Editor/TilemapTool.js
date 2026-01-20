// TilemapTool.js
import { bus } from '../Util/EventBus.js'; // Import bus standalone

export default class TilemapTool {
    constructor(game) {
        this.game = game;
        this.world = game.world;
        this.input = game.input;
        this.camera = game.camera;
        this.renderer = game.renderer;
    }

    update() {
        const editors = this.world._editors;
        if (!editors || editors.activeTool !== 'brush' || !editors.tileSelection) return;

        if (this.input.mouse.isDown(0)) {
            this._handlePainting(editors);
        }
    }

    _handlePainting(editors) {
        const activeId = editors.activeTabId;
        const entity = this._findEntity(activeId);
        
        if (!entity || !entity.components || !entity.components.Tilemap) return;
        
        const tm = entity.components.Tilemap;
        const tf = entity.components.Transform || { x: 0, y: 0, pivotX: 0, pivotY: 0 };
        const asset = this.world.assets.textures[tm.assetId];

        if (!asset || !asset.width) return;

        // --- Kalkulasi Grid (Standard) ---
        const tileW = Number(tm.tileWidth) || 32;
        const tileH = Number(tm.tileHeight) || 32;
        const cols = Number(tm.width) || 10;
        const rows = Number(tm.height) || 10;
        const naturalW = cols * tileW;
        const naturalH = rows * tileH;
        const pX = tf.pivotX ?? 0;
        const pY = tf.pivotY ?? 0;
        const startX = tf.x - (naturalW * pX);
        const startY = tf.y - (naturalH * pY);

        const canvas = this.game.renderer.canvas;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const worldX = (this.input.mouse.x - cx) / this.camera.scale + this.camera.x;
        const worldY = (this.input.mouse.y - cy) / this.camera.scale + this.camera.y;

        const localX = worldX - startX;
        const localY = worldY - startY;
        const gridX = Math.floor(localX / tileW);
        const gridY = Math.floor(localY / tileH);

        if (gridX < 0 || gridY < 0 || gridX >= tm.width || gridY >= tm.height) return;

        this._paint(entity, tm, gridX, gridY, asset, editors.tileSelection);
    }

    _paint(entity, tm, gridX, gridY, asset, selection) {
        const cols = tm.width;
        const tilesetCols = Math.floor(asset.width / tm.tileWidth);
        
        // Buat array baru (Spread operator) untuk memutus referensi lama
        const newData = [...tm.data];
        let isChanged = false;

        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const targetX = gridX + dx;
                const targetY = gridY + dy;

                if (targetX >= 0 && targetX < cols && targetY >= 0 && targetY < tm.height) {
                    const index = targetY * cols + targetX;
                    const srcX = selection.x + dx;
                    const srcY = selection.y + dy;
                    const tileId = (srcY * tilesetCols) + srcX + 1;

                    if (newData[index] !== tileId) {
                        newData[index] = tileId;
                        isChanged = true;
                    }
                }
            }
        }

        if (isChanged) {
            tm.data = newData; 
            entity.isDirty = true; 

            // 2. Emit via Standalone Bus
            bus.emit("editor:tilemap:update-data", {
                entityId: entity.id,
                newData: newData 
            });
        }
    }

    _findEntity(activeId) {
        if (!this.world.layers) return null;
        for (const layer of this.world.layers) {
            if (!layer.entities) continue;
            for (const e of layer.entities) {
                if (e.id === activeId) return e;
            }
        }
        return null;
    }
}