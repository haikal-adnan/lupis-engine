import { HexToVec4 } from "../../Util/HexToVec4.js";
import { TilemapMath } from "../../Editor/Tilemap/TilemapMath.js";
import RenderUtils from "./RenderUtils.js";

export default class TilemapRenderer {
    constructor(image, shape, game) {
        this.game = game;
        this.image = image;
        this.shape = shape;
        
        this.colors = {
            grid: HexToVec4("#ffffff14"),
            border: HexToVec4("#00ffff"),
            validGhost: HexToVec4("#00ff00"),
            invalidGhost: HexToVec4("#ff0000"),
            invalidGhostFill: HexToVec4("#ff000040"),
            picker: HexToVec4("#ffff00"),
            selectionBlue: HexToVec4("#008cff"),
            selectionBlueFill: HexToVec4("#008cff33")
        };
    }

    _calculateRenderData(entity, tm, world) {
        const tf = RenderUtils.getGlobalTransform(entity, world);
        
        const tileW = Number(tm.width) || 32;
        const tileH = Number(tm.height) || 32;

        const editors = world?._editors || {};
        const isEditingThisMap = (String(editors.activeTabId) === String(entity.id));

        const renderScaleX = (tf.flipX ? -1 : 1) * (tf.scaleX ?? 1);
        const renderScaleY = (tf.flipY ? -1 : 1) * (tf.scaleY ?? 1);
        const renderRotation = (tf.rotation || 0) * (Math.PI / 180);

        return {
            tfX: tf.x || 0, 
            tfY: tf.y || 0,
            scaleX: renderScaleX, 
            scaleY: renderScaleY, 
            rotation: renderRotation,
            tileW, 
            tileH,
            isEditing: isEditingThisMap
        };
    }

    renderEntity(entity, world, proj, opacity = 1.0) {
        const tm = entity?.components?.Tilemap;
        if (!tm) return;

        const renderData = this._calculateRenderData(entity, tm, world);

        this._drawTiles(entity, tm, renderData, world, proj, world?._editors, opacity);

        if (renderData.isEditing && !world?._editors?.isIsolationMode) {
            this._drawEditorGizmos(entity, tm, renderData, world, proj, world?._editors);
        }
    }

    renderOnlyGizmos(entity, world, proj) {
        const tm = entity?.components?.Tilemap;
        if (!tm) return;

        const renderData = this._calculateRenderData(entity, tm, world);
        const editors = world?._editors || {};

        this._drawEditorGizmos(entity, tm, renderData, world, proj, editors);
        
        this.image?.flush();
        this.shape?.flush();
    }

    _drawTiles(entity, tm, rData, world, proj, editors, externalOpacity = 1.0) {
        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset || !tm.data) return;

        const textureWidth = asset.width;
        const tilesetCols = Math.floor(textureWidth / rData.tileW);
        if (tilesetCols <= 0) return;

        const baseOpacity = (tm.opacity ?? 1) * (entity.opacity ?? 1) * externalOpacity;
        const dragState = editors?.dragState;
        const filterMode = tm.filterMode || "pixelated";

        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        const overlapFixX = 0.4 * Math.abs(rData.scaleX);
        const overlapFixY = 0.4 * Math.abs(rData.scaleY);

        for (const [key, tileId] of Object.entries(tm.data)) {
            if (!tileId || tileId <= 0) continue;

            const [xStr, yStr] = key.split(',');
            const x = Number(xStr);
            const y = Number(yStr);

            let currentOpacity = baseOpacity;
            if (dragState) {
                const isInSource = x >= dragState.sourceX && x < dragState.sourceX + dragState.w &&
                                   y >= dragState.sourceY && y < dragState.sourceY + dragState.h;
                if (isInSource) currentOpacity *= 0.4;
            }

            const actualIndex = tileId - 1;
            const srcX = (actualIndex % tilesetCols) * rData.tileW;
            const srcY = Math.floor(actualIndex / tilesetCols) * rData.tileH;

            const tileLocalX = x * scaledTileW;
            const tileLocalY = y * scaledTileH;

            const rotatedX = (tileLocalX * cosR) - (tileLocalY * sinR);
            const rotatedY = (tileLocalX * sinR) + (tileLocalY * cosR);

            const dstX = rData.tfX + rotatedX;
            const dstY = rData.tfY + rotatedY;

            this.image.draw(
                asset,
                { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH },
                { 
                    x: dstX, 
                    y: dstY, 
                    width: scaledTileW + overlapFixX, 
                    height: scaledTileH + overlapFixY, 
                    rotation: rData.rotation, 
                    scaleX: 1, 
                    scaleY: 1, 
                    pivotX: 0, 
                    pivotY: 0 
                },
                { opacity: currentOpacity, filterMode },
                proj
            );
        }
        this.image?.flush();
    }

    _drawEditorGizmos(entity, tm, rData, world, proj, editors) {
        if (!editors) return;

        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;

        const absTileW = Math.abs(scaledTileW);
        const absTileH = Math.abs(scaledTileH);
        if (absTileW === 0 || absTileH === 0) return;

        const cam = this.game?.camera;
        const canvas = this.game?.renderer?.canvas;
        if (!cam || !canvas) return;

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        // 1. Grid Lines Viewport
        const showGrid = editors?.tilemapContext?.showGrid ?? true;
        if (showGrid) {
            const camScale = Math.max(0.001, cam.scale || 1);
            const halfViewW = (canvas.width / camScale) / 2 + absTileW * 2;
            const halfViewH = (canvas.height / camScale) / 2 + absTileH * 2;
            const viewRadius = Math.hypot(halfViewW, halfViewH);

            const centerGridX = Math.floor((cam.x - rData.tfX) / scaledTileW);
            const centerGridY = Math.floor((cam.y - rData.tfY) / scaledTileH);

            const spanX = Math.ceil(viewRadius / absTileW) + 2;
            const spanY = Math.ceil(viewRadius / absTileH) + 2;

            const minX = centerGridX - spanX;
            const maxX = centerGridX + spanX;
            const minY = centerGridY - spanY;
            const maxY = centerGridY + spanY;

            for (let i = minX; i <= maxX; i++) {
                const xLocal = i * scaledTileW;
                const yLocalStart = minY * scaledTileH;
                const yLocalEnd = maxY * scaledTileH;

                const x1 = rData.tfX + (xLocal * cosR - yLocalStart * sinR);
                const y1 = rData.tfY + (xLocal * sinR + yLocalStart * cosR);
                const x2 = rData.tfX + (xLocal * cosR - yLocalEnd * sinR);
                const y2 = rData.tfY + (xLocal * sinR + yLocalEnd * cosR);

                this.shape.drawLine(x1, y1, x2, y2, this.colors.grid, 1, proj);
            }

            for (let j = minY; j <= maxY; j++) {
                const yLocal = j * scaledTileH;
                const xLocalStart = minX * scaledTileW;
                const xLocalEnd = maxX * scaledTileW;

                const x1 = rData.tfX + (xLocalStart * cosR - yLocal * sinR);
                const y1 = rData.tfY + (xLocalStart * sinR + yLocal * cosR);
                const x2 = rData.tfX + (xLocalEnd * cosR - yLocal * sinR);
                const y2 = rData.tfY + (xLocalEnd * sinR + yLocal * cosR);

                this.shape.drawLine(x1, y1, x2, y2, this.colors.grid, 1, proj);
            }
        }

        const activeTab = editors.tabs?.find(t => String(t.id) === String(editors.activeTabId));
        if (activeTab?.type === 'tilemap') {
            const bounds = TilemapMath.getBounds(tm);
            const boundsLocalX = bounds.minX * scaledTileW;
            const boundsLocalY = bounds.minY * scaledTileH;

            const boundsRotatedX = (boundsLocalX * cosR) - (boundsLocalY * sinR);
            const boundsRotatedY = (boundsLocalX * sinR) + (boundsLocalY * cosR);

            const boundsDstX = rData.tfX + boundsRotatedX;
            const boundsDstY = rData.tfY + boundsRotatedY;

            const boundsScaledW = bounds.width * rData.scaleX;
            const boundsScaledH = bounds.height * rData.scaleY;

            this.shape.drawParametricShape(
                "rectangle", boundsDstX, boundsDstY, boundsScaledW, boundsScaledH,
                [0, 0, 0, 0], this.colors.border, false, 2, 0, 4,
                proj, rData.rotation, 1, 1, 0, 0, false, false
            );
        }

        if (editors.marqueeSelection) {
            const ms = editors.marqueeSelection;
            const isEraser = editors.activeTool === 'eraser';
            const borderCol = isEraser ? this.colors.invalidGhost : this.colors.selectionBlue;
            const fillCol = isEraser ? this.colors.invalidGhostFill : this.colors.selectionBlueFill;

            this._renderMarquee(rData, ms, borderCol, fillCol, proj);
        }

        const activeTool = editors.activeTool;
        const selection = editors.tileSelection;
        const asset = world?.assets?.textures?.[tm.assetId];

        const gridPos = TilemapMath.getMouseGridPosition(this.game, entity, tm);
        const gridX = gridPos ? gridPos.x : -1;
        const gridY = gridPos ? gridPos.y : -1;
        const isHoverValid = gridPos !== null;

        if (editors.dragState && isHoverValid && asset) {
            const ds = editors.dragState;
            const tilesetCols = Math.floor(asset.width / rData.tileW);
            const drawGridX = gridX - (ds.offX || 0);
            const drawGridY = gridY - (ds.offY || 0);

            const filterMode = tm.filterMode || "pixelated";

            for (let dy = 0; dy < ds.h; dy++) {
                for (let dx = 0; dx < ds.w; dx++) {
                    const tileId = ds.data[dy * ds.w + dx];
                    if (!tileId || tileId <= 0) continue;
                    const tx = drawGridX + dx;
                    const ty = drawGridY + dy;

                    const actualIndex = tileId - 1;
                    const srcX = (actualIndex % tilesetCols) * rData.tileW;
                    const srcY = Math.floor(actualIndex / tilesetCols) * rData.tileH;

                    const tileLocalX = tx * scaledTileW;
                    const tileLocalY = ty * scaledTileH;

                    const rotatedX = (tileLocalX * cosR) - (tileLocalY * sinR);
                    const rotatedY = (tileLocalX * sinR) + (tileLocalY * cosR);

                    const dstX = rData.tfX + rotatedX;
                    const dstY = rData.tfY + rotatedY;

                    this.image.draw(
                        asset,
                        { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH },
                        {
                            x: dstX,
                            y: dstY,
                            width: scaledTileW,
                            height: scaledTileH,
                            rotation: rData.rotation,
                            scaleX: 1,
                            scaleY: 1,
                            pivotX: 0,
                            pivotY: 0
                        },
                        { opacity: 0.8, filterMode },
                        proj
                    );
                }
            }
            this.image?.flush();
            this._renderHighlightRect(rData, drawGridX, drawGridY, ds.w, ds.h, this.colors.selectionBlue, proj, 2);
        } else if (isHoverValid && !editors.marqueeSelection) {
            if ((activeTool === 'brush' || activeTool === 'bucket') && selection && asset) {
                this._renderGhost(rData, tm, asset, selection, proj, gridX, gridY);
            } else if (activeTool === 'eraser') {
                this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.invalidGhost, proj);
            } else if (activeTool === 'eyedropper') {
                this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.picker, proj);
            } else if (activeTool === 'select') {
                this._renderHighlightRect(rData, gridX, gridY, 1, 1, this.colors.selectionBlue, proj, 1);
            }
        }
        this.shape?.flush();
    }

    _renderMarquee(rData, ms, colorBorder, colorFill, proj) {
        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;

        const cellLocalX = ms.x * scaledTileW;
        const cellLocalY = ms.y * scaledTileH;

        const highlightW = ms.w * scaledTileW;
        const highlightH = ms.h * scaledTileH;

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        const rotatedX = (cellLocalX * cosR) - (cellLocalY * sinR);
        const rotatedY = (cellLocalX * sinR) + (cellLocalY * cosR);

        const dstX = rData.tfX + rotatedX;
        const dstY = rData.tfY + rotatedY;

        this.shape.drawParametricShape(
            "rectangle", dstX, dstY, highlightW, highlightH,
            [0, 0, 0, 0], colorFill, true, 1, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );

        this.shape.drawParametricShape(
            "rectangle", dstX, dstY, highlightW, highlightH,
            [0, 0, 0, 0], colorBorder, false, 2, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );
    }

    _renderGhost(rData, tm, asset, selection, proj, gridX, gridY) {
        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;
        const filterMode = tm.filterMode || "pixelated"; 

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const tx = gridX + dx;
                const ty = gridY + dy;
                
                const tileLocalX = tx * scaledTileW;
                const tileLocalY = ty * scaledTileH;

                const rotatedX = (tileLocalX * cosR) - (tileLocalY * sinR);
                const rotatedY = (tileLocalX * sinR) + (tileLocalY * cosR);

                const dstX = rData.tfX + rotatedX;
                const dstY = rData.tfY + rotatedY;

                const srcX = (selection.x + dx) * rData.tileW;
                const srcY = (selection.y + dy) * rData.tileH;
                
                this.image.draw(
                    asset, 
                    { x: srcX, y: srcY, w: rData.tileW, h: rData.tileH }, 
                    { 
                        x: dstX, 
                        y: dstY, 
                        width: scaledTileW, 
                        height: scaledTileH, 
                        rotation: rData.rotation, 
                        scaleX: 1, 
                        scaleY: 1, 
                        pivotX: 0, 
                        pivotY: 0 
                    }, 
                    { opacity: 0.6, filterMode }, 
                    proj
                );
            }
        }
        this.image?.flush();
        this._renderHighlightRect(rData, gridX, gridY, selection.w, selection.h, this.colors.validGhost, proj, 2);
    }

    _renderHighlightRect(rData, gridX, gridY, w, h, color, proj, thickness = 2) {
        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;

        const cellLocalX = gridX * scaledTileW;
        const cellLocalY = gridY * scaledTileH;

        const highlightW = w * scaledTileW;
        const highlightH = h * scaledTileH;

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        const rotatedX = (cellLocalX * cosR) - (cellLocalY * sinR);
        const rotatedY = (cellLocalX * sinR) + (cellLocalY * cosR);

        const dstX = rData.tfX + rotatedX;
        const dstY = rData.tfY + rotatedY;

        this.shape.drawParametricShape(
            "rectangle", dstX, dstY, highlightW, highlightH,
            [0, 0, 0, 0], color, false, thickness, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );
    }
}