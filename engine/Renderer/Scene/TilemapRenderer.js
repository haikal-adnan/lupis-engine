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
            invalidGhost: HexToVec4("#ff0000"),
            picker: HexToVec4("#ffff00"),
            selectionBlue: HexToVec4("#008cff")
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
        const isEditingThisMap = (editors.activeTabId === entity.id);

        let renderScaleX = 1, renderScaleY = 1, renderRotation = 0;

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
        const startDrawX = tf.x - (currentWidth * (tf.pivotX ?? 0));
        const startDrawY = tf.y - (currentHeight * (tf.pivotY ?? 0));

        const renderData = {
            startX: startDrawX, startY: startDrawY,
            scaleX: renderScaleX, scaleY: renderScaleY, rotation: renderRotation,
            tileW, tileH, cols, rows, naturalW, naturalH,
            totalW: currentWidth, totalH: currentHeight
        };

        this._drawTiles(entity, tm, renderData, world, proj, editors);

        if (isEditingThisMap) {
            this._drawEditorGizmos(entity, tm, renderData, world, proj, editors);
        }
    }

    _drawTiles(entity, tm, rData, world, proj, editors) {
        const asset = world.assets.textures[tm.assetId];
        if (!asset || !tm.data) return;

        const textureWidth = asset.width;
        const tilesetCols = Math.floor(textureWidth / rData.tileW);
        const baseOpacity = (tm.opacity ?? 1) * (entity.opacity ?? 1);
        const dragState = editors.dragState;

        const cam = this.game.camera;
        const canvas = this.game.renderer.canvas;
        const viewW = (canvas.width / cam.scale) + rData.tileW * 2;
        const viewH = (canvas.height / cam.scale) + rData.tileH * 2;

        const startCol = Math.floor(((cam.x - viewW / 2) - rData.startX) / rData.tileW);
        const endCol = Math.ceil(((cam.x + viewW / 2) - rData.startX) / rData.tileW);
        const startRow = Math.floor(((cam.y - viewH / 2) - rData.startY) / rData.tileH);
        const endRow = Math.ceil(((cam.y + viewH / 2) - rData.startY) / rData.tileH);

        const loopStartX = Math.max(0, startCol);
        const loopEndX = Math.min(rData.cols, endCol);
        const loopStartY = Math.max(0, startRow);
        const loopEndY = Math.min(rData.rows, endRow);

        for (let y = loopStartY; y < loopEndY; y++) {
            for (let x = loopStartX; x < loopEndX; x++) {
                const index = y * rData.cols + x;
                if (index >= tm.data.length) continue;

                const tileId = tm.data[index];
                if (tileId > 0) {
                    let currentOpacity = baseOpacity;
                    
                    if (dragState) {
                        const isInSource = x >= dragState.sourceX && x < dragState.sourceX + dragState.w &&
                                           y >= dragState.sourceY && y < dragState.sourceY + dragState.h;
                        if (isInSource) {
                            currentOpacity *= 0.4;
                        }
                    }

                    const actualIndex = tileId - 1;
                    const srcX = (actualIndex % tilesetCols) * rData.tileW;
                    const srcY = Math.floor(actualIndex / tilesetCols) * rData.tileH;
                    const dstX = rData.startX + (x * rData.tileW);
                    const dstY = rData.startY + (y * rData.tileH);

                    this.image.draw(
                        asset,
                        { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH },
                        {
                            x: dstX, y: dstY, width: rData.tileW, height: rData.tileH,
                            rotation: rData.rotation, scaleX: 1, scaleY: 1,
                            pivotX: 0, pivotY: 0
                        },
                        { opacity: currentOpacity },
                        proj
                    );
                }
            }
        }
        this.image.flush();
    }

    _drawEditorGizmos(entity, tm, rData, world, proj, editors) {
        const cam = this.game.camera;
        const canvas = this.game.renderer.canvas;
        const viewW = canvas.width / cam.scale;
        const viewH = canvas.height / cam.scale;

        const startCol = Math.floor((cam.x - (viewW / 2) - rData.startX) / rData.tileW);
        const endCol = Math.ceil((cam.x + (viewW / 2) - rData.startX) / rData.tileW);
        const startRow = Math.floor((cam.y - (viewH / 2) - rData.startY) / rData.tileH);
        const endRow = Math.ceil((cam.y + (viewH / 2) - rData.startY) / rData.tileH);

        const loopStartX = Math.max(0, startCol);
        const loopEndX = Math.min(rData.cols, endCol);
        const loopStartY = Math.max(0, startRow);
        const loopEndY = Math.min(rData.rows, endRow);

        for (let i = loopStartX; i <= loopEndX; i++) {
            const xPos = rData.startX + (i * rData.tileW);
            this.shape.drawLine(xPos, rData.startY, xPos, rData.startY + rData.totalH, this.colors.grid, 1, proj);
        }
        for (let j = loopStartY; j <= loopEndY; j++) {
            const yPos = rData.startY + (j * rData.tileH);
            this.shape.drawLine(rData.startX, yPos, rData.startX + rData.totalW, yPos, this.colors.grid, 1, proj);
        }

        this.shape.drawRectStroke(rData.startX, rData.startY, rData.totalW, rData.totalH, this.colors.border, 2, proj);

        const mx = this.game.input?.mouse?.x || 0;
        const my = this.game.input?.mouse?.y || 0;
        const worldX = (mx - canvas.width / 2) / cam.scale + cam.x;
        const worldY = (my - canvas.height / 2) / cam.scale + cam.y;
        const gridX = Math.floor((worldX - rData.startX) / rData.tileW);
        const gridY = Math.floor((worldY - rData.startY) / rData.tileH);

        const isHoverValid = (gridX >= 0 && gridX < rData.cols && gridY >= 0 && gridY < rData.rows);
        const activeTool = editors.activeTool;
        const selection = editors.tileSelection;
        const asset = world.assets.textures[tm.assetId];

        if (editors.marqueeSelection) {
            const ms = editors.marqueeSelection;
            const color = activeTool === 'eraser' ? this.colors.invalidGhost : this.colors.selectionBlue;
            this._renderHighlightRect(rData, ms.x, ms.y, ms.w, ms.h, color, proj, 2);
        }

        if (editors.dragState && isHoverValid && asset) {
            const ds = editors.dragState;
            const tilesetCols = Math.floor(asset.width / rData.tileW);
            
            const drawGridX = gridX - (ds.offX || 0);
            const drawGridY = gridY - (ds.offY || 0);

            for (let dy = 0; dy < ds.h; dy++) {
                for (let dx = 0; dx < ds.w; dx++) {
                    const tileId = ds.data[dy * ds.w + dx];
                    if (tileId === 0) continue;

                    const tx = drawGridX + dx;
                    const ty = drawGridY + dy;

                    if (tx >= 0 && tx < rData.cols && ty >= 0 && ty < rData.rows) {
                        const actualIndex = tileId - 1;
                        const srcX = (actualIndex % tilesetCols) * rData.tileW;
                        const srcY = Math.floor(actualIndex / tilesetCols) * rData.tileH;
                        const dstX = rData.startX + (tx * rData.tileW);
                        const dstY = rData.startY + (ty * rData.tileH);

                        this.image.draw(
                            asset,
                            { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH },
                            { x: dstX, y: dstY, width: rData.tileW, height: rData.tileH },
                            { opacity: 0.8 },
                            proj
                        );
                    }
                }
            }
            this.image.flush();
            this._renderHighlightRect(rData, drawGridX, drawGridY, ds.w, ds.h, this.colors.selectionBlue, proj, 2);
        } else if (isHoverValid) {
            if ((activeTool === 'brush' || activeTool === 'bucket') && selection && asset) {
                this._renderGhost(rData, tm, asset, selection, proj, gridX, gridY);
            } else if (activeTool === 'eraser') {
                this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.invalidGhost, proj);
            } else if (activeTool === 'eyedropper') {
                this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.picker, proj);
            } else if (activeTool === 'select' || activeTool === 'move') {
                if (!editors.marqueeSelection) {
                    this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.selectionBlue, proj, 1);
                }
            }
        }

        this.shape.flush();
    }

    _renderGhost(rData, tm, asset, selection, proj, gridX, gridY) {
        const tilesetCols = Math.floor(asset.width / rData.tileW);
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
        this._renderHighlightRect(rData, gridX, gridY, selection.w, selection.h, this.colors.validGhost, proj, 2);
    }

    _renderHighlightRect(rData, gridX, gridY, w, h, color, proj, thickness = 2) {
        const dstX = rData.startX + (gridX * rData.tileW);
        const dstY = rData.startY + (gridY * rData.tileH);
        const dstW = w * rData.tileW;
        const dstH = h * rData.tileH;
        this.shape.drawRectStroke(dstX, dstY, dstW, dstH, color, thickness, proj);
    }
}