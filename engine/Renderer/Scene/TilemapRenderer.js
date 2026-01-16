import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class TilemapRenderer {
    constructor(image, shape, game) {
        this.game = game;
        this.image = image;
        this.shape = shape;
        this.renderQueue = [];

        this.colors = {
            grid: HexToVec4("#ffffff14"),
            border: HexToVec4("#00ffff"),
            validGhost: HexToVec4("#00ff00"), 
            invalidGhost: HexToVec4("#ff0000")
        };
    }

    renderEntity(entity, world, proj) {
        const tm = entity.components.Tilemap;
        if (!tm) return;

        const tf = entity.components.Transform || { x: 0, y: 0, width: 0, height: 0, scaleX: 1, scaleY: 1, rotation: 0, pivotX: 0, pivotY: 0 };
        
        const tileW = Number(tm.tileWidth) || 32;
        const tileH = Number(tm.tileHeight) || 32;
        const cols = Number(tm.width) || 10;
        const rows = Number(tm.height) || 10;
        const naturalW = cols * tileW;
        const naturalH = rows * tileH;

        const editors = world._editors || {};
        const activeId = editors.activeTabId;
        const tabs = editors.tabs || [];
        const activeTab = tabs.find(t => t.id === activeId);
        const activeType = activeTab ? activeTab.type : "scene";
        const isEditingThisMap = (activeType === "tilemap" && activeId === entity.id);

        let renderScaleX = 1;
        let renderScaleY = 1;
        let renderRotation = 0;

        // Logic Scale/Resize (Scene Mode vs Editor Mode)
        if (isEditingThisMap) {
            renderScaleX = 1; renderScaleY = 1; renderRotation = 0;
        } else {
            if (tf.width && tf.width !== naturalW && naturalW > 0) renderScaleX = tf.width / naturalW;
            else renderScaleX = tf.scaleX || 1;
            
            if (tf.height && tf.height !== naturalH && naturalH > 0) renderScaleY = tf.height / naturalH;
            else renderScaleY = tf.scaleY || 1;
            
            renderRotation = tf.rotation || 0;
        }

        const currentWidth = naturalW * renderScaleX;
        const currentHeight = naturalH * renderScaleY;
        const pX = tf.pivotX ?? 0;
        const pY = tf.pivotY ?? 0;

        // Logic Start Drawing Position (Pivot Aware)
        const startDrawX = tf.x - (currentWidth * pX);
        const startDrawY = tf.y - (currentHeight * pY);

        const renderData = {
            startX: startDrawX, startY: startDrawY,
            scaleX: renderScaleX, scaleY: renderScaleY, rotation: renderRotation,
            tileW, tileH, cols, rows, naturalW, naturalH,
            totalW: currentWidth, totalH: currentHeight
        };

        this._drawTiles(entity, tm, renderData, world, proj);

        if (isEditingThisMap) {
            this._drawEditorGizmos(entity, tm, renderData, world, proj, editors);
        }
    }

    _drawTiles(entity, tm, rData, world, proj) {
        const asset = world.assets.textures[tm.assetId];
        if (!asset || !tm.data) return;

        const textureWidth = asset.width; 
        const tilesetCols = Math.floor(textureWidth / rData.tileW); 
        const layerOpacity = (tm.opacity ?? 1) * (entity.opacity ?? 1);

        const cam = this.game.camera;
        const canvas = this.game.renderer.canvas;
        const viewW = (canvas.width / cam.scale) + rData.tileW * 2; 
        const viewH = (canvas.height / cam.scale) + rData.tileH * 2;

        const absScaleX = Math.abs(rData.scaleX);
        const absScaleY = Math.abs(rData.scaleY);

        const startCol = Math.floor(((cam.x - viewW/2) - rData.startX) / (rData.tileW * absScaleX));
        const endCol   = Math.ceil(((cam.x + viewW/2) - rData.startX) / (rData.tileW * absScaleX));
        const startRow = Math.floor(((cam.y - viewH/2) - rData.startY) / (rData.tileH * absScaleY));
        const endRow   = Math.ceil(((cam.y + viewH/2) - rData.startY) / (rData.tileH * absScaleY));

        const loopStartX = Math.max(0, startCol);
        const loopEndX   = Math.min(rData.cols, endCol);
        const loopStartY = Math.max(0, startRow);
        const loopEndY   = Math.min(rData.rows, endRow);

        for (let y = loopStartY; y < loopEndY; y++) {
            for (let x = loopStartX; x < loopEndX; x++) {
                const index = y * rData.cols + x;
                if (index >= tm.data.length) continue;

                const tileId = tm.data[index];
                if (tileId > 0) {
                    const actualIndex = tileId - 1;
                    const srcX = (actualIndex % tilesetCols) * rData.tileW;
                    const srcY = Math.floor(actualIndex / tilesetCols) * rData.tileH;
                    const dstX = rData.startX + (x * rData.tileW * rData.scaleX);
                    const dstY = rData.startY + (y * rData.tileH * rData.scaleY);
                    const dstW = rData.tileW * rData.scaleX;
                    const dstH = rData.tileH * rData.scaleY;

                    this.image.draw(
                        asset,
                        { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH }, 
                        { 
                            x: dstX, y: dstY, width: dstW, height: dstH, 
                            rotation: rData.rotation, scaleX: 1, scaleY: 1, 
                            pivotX: 0, pivotY: 0 
                        }, 
                        { opacity: layerOpacity }, 
                        proj 
                    );
                }
            }
        }
        this.image.flush();
    }

    _drawEditorGizmos(entity, tm, rData, world, proj, editors) {
        this.renderQueue.length = 0;

        const cam = this.game.camera;
        const canvas = this.game.renderer.canvas;
        const viewW = canvas.width / cam.scale;
        const viewH = canvas.height / cam.scale;

        const startCol = Math.floor((cam.x - (viewW/2) - rData.startX) / rData.tileW);
        const endCol   = Math.ceil((cam.x + (viewW/2) - rData.startX) / rData.tileW);
        const startRow = Math.floor((cam.y - (viewH/2) - rData.startY) / rData.tileH);
        const endRow   = Math.ceil((cam.y + (viewH/2) - rData.startY) / rData.tileH);

        const loopStartX = Math.max(0, startCol);
        const loopEndX   = Math.min(rData.cols, endCol);
        const loopStartY = Math.max(0, startRow);
        const loopEndY   = Math.min(rData.rows, endRow);

        // 1. Grid Vertical
        for (let i = loopStartX; i <= loopEndX; i++) {
            const xPos = rData.startX + (i * rData.tileW);
            this.renderQueue.push({
                type: "line", x1: xPos, y1: rData.startY, x2: xPos, y2: rData.startY + rData.totalH,
                color: this.colors.grid
            });
        }
        // 2. Grid Horizontal
        for (let j = loopStartY; j <= loopEndY; j++) {
            const yPos = rData.startY + (j * rData.tileH);
            this.renderQueue.push({
                type: "line", x1: rData.startX, y1: yPos, x2: rData.startX + rData.totalW, y2: yPos,
                color: this.colors.grid
            });
        }

        // 3. Border Luar
        this.renderQueue.push({
            type: "rectStroke", 
            x: rData.startX, y: rData.startY, w: rData.totalW, h: rData.totalH,
            color: this.colors.border, thickness: 2
        });

        // 4. Ghost Preview
        const asset = world.assets.textures[tm.assetId];
        if (editors.activeTool === 'brush' && editors.tileSelection && asset) {
             this._renderGhost(rData, tm, asset, editors.tileSelection, proj);
        }

        // Execute Queue
        for (const item of this.renderQueue) {
            if (item.type === "line") {
                this.shape.drawLine(item.x1, item.y1, item.x2, item.y2, item.color, 1, proj);
            } else if (item.type === "rectStroke") {
                this.shape.drawRectStroke(item.x, item.y, item.w, item.h, item.color, item.thickness, proj);
            }
        }
        this.shape.flush();
    }

    _renderGhost(rData, tm, asset, selection, proj) {
         const mx = this.game.input?.mouse?.x || 0; 
         const my = this.game.input?.mouse?.y || 0;
         const cam = this.game.camera;
         const cx = this.game.renderer.canvas.width / 2;
         const cy = this.game.renderer.canvas.height / 2;
         
         const worldX = (mx - cx) / cam.scale + cam.x;
         const worldY = (my - cy) / cam.scale + cam.y;

         const localX = worldX - rData.startX;
         const localY = worldY - rData.startY;
         
         const gridX = Math.floor(localX / rData.tileW);
         const gridY = Math.floor(localY / rData.tileH);

         for (let dy = 0; dy < selection.h; dy++) {
             for (let dx = 0; dx < selection.w; dx++) {
                 const tx = gridX + dx;
                 const ty = gridY + dy;

                 if (tx >= 0 && tx < rData.cols && ty >= 0 && ty < rData.rows) {
                     const dstX = rData.startX + (tx * rData.tileW); 
                     const dstY = rData.startY + (ty * rData.tileH);
                     
                     const srcX = (selection.x + dx) * rData.tileW;
                     const srcY = (selection.y + dy) * rData.tileH;

                     this.image.draw(
                         asset,
                         { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH },
                         { x: dstX, y: dstY, width: rData.tileW, height: rData.tileH },
                         { opacity: 0.6 },
                         proj
                     );
                 }
             }
         }
         this.image.flush();

         const selW = selection.w * rData.tileW;
         const selH = selection.h * rData.tileH;
         this.shape.drawRectStroke(
             rData.startX + (gridX * rData.tileW),
             rData.startY + (gridY * rData.tileH),
             selW, selH, this.colors.validGhost, 2, proj
         );
    }
}