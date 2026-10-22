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

        // Reusable structures for zero-allocation quad rendering
        this._reusableVertices = {
            tl: { x: 0, y: 0 },
            tr: { x: 0, y: 0 },
            bl: { x: 0, y: 0 },
            br: { x: 0, y: 0 }
        };
        this._reusableSource = { x: 0, y: 0, w: 0, h: 0 };
        this._reusableOptions = { opacity: 1, filterMode: 'pixelated' };
        this._reusableRange = { minX: 0, maxX: 0, minY: 0, maxY: 0, isCulled: false };
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

    _getTileQuadVertices(rData, scaledTileW, scaledTileH, cosR, sinR, gx, gy) {
        const lx0 = gx * scaledTileW;
        const lx1 = (gx + 1) * scaledTileW;
        const ly0 = gy * scaledTileH;
        const ly1 = (gy + 1) * scaledTileH;

        return {
            tl: { x: rData.tfX + (lx0 * cosR - ly0 * sinR), y: rData.tfY + (lx0 * sinR + ly0 * cosR) },
            tr: { x: rData.tfX + (lx1 * cosR - ly0 * sinR), y: rData.tfY + (lx1 * sinR + ly0 * cosR) },
            bl: { x: rData.tfX + (lx0 * cosR - ly1 * sinR), y: rData.tfY + (lx0 * sinR + ly1 * cosR) },
            br: { x: rData.tfX + (lx1 * cosR - ly1 * sinR), y: rData.tfY + (lx1 * sinR + ly1 * cosR) }
        };
    }

    _setTileQuadVertices(rData, scaledTileW, scaledTileH, cosR, sinR, gx, gy) {
        const lx0 = gx * scaledTileW;
        const lx1 = (gx + 1) * scaledTileW;
        const ly0 = gy * scaledTileH;
        const ly1 = (gy + 1) * scaledTileH;

        const v = this._reusableVertices;
        v.tl.x = rData.tfX + (lx0 * cosR - ly0 * sinR);
        v.tl.y = rData.tfY + (lx0 * sinR + ly0 * cosR);
        v.tr.x = rData.tfX + (lx1 * cosR - ly0 * sinR);
        v.tr.y = rData.tfY + (lx1 * sinR + ly0 * cosR);
        v.bl.x = rData.tfX + (lx0 * cosR - ly1 * sinR);
        v.bl.y = rData.tfY + (lx0 * sinR + ly1 * cosR);
        v.br.x = rData.tfX + (lx1 * cosR - ly1 * sinR);
        v.br.y = rData.tfY + (lx1 * sinR + ly1 * cosR);
        return v;
    }

    _getViewportGridRange(rData, bounds) {
        const range = this._reusableRange;
        const cam = this.game?.camera;
        const canvas = this.game?.renderer?.canvas;

        if (!cam || !canvas) {
            range.minX = bounds.minX;
            range.maxX = bounds.maxX;
            range.minY = bounds.minY;
            range.maxY = bounds.maxY;
            range.isCulled = false;
            return range;
        }

        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;
        if (scaledTileW === 0 || scaledTileH === 0) {
            range.isCulled = true;
            return range;
        }

        const camScale = Math.max(0.001, cam.scale || 1);
        const halfViewW = (canvas.width / camScale) * 0.5;
        const halfViewH = (canvas.height / camScale) * 0.5;

        const left = cam.x - halfViewW;
        const right = cam.x + halfViewW;
        const top = cam.y - halfViewH;
        const bottom = cam.y + halfViewH;

        const invRot = -rData.rotation;
        const cosInv = Math.cos(invRot);
        const sinInv = Math.sin(invRot);

        let minLocalX = Infinity, maxLocalX = -Infinity;
        let minLocalY = Infinity, maxLocalY = -Infinity;

        // Top-left corner
        let dx = left - rData.tfX;
        let dy = top - rData.tfY;
        let lx = (dx * cosInv) - (dy * sinInv);
        let ly = (dx * sinInv) + (dy * cosInv);
        if (lx < minLocalX) minLocalX = lx; if (lx > maxLocalX) maxLocalX = lx;
        if (ly < minLocalY) minLocalY = ly; if (ly > maxLocalY) maxLocalY = ly;

        // Top-right corner
        dx = right - rData.tfX;
        dy = top - rData.tfY;
        lx = (dx * cosInv) - (dy * sinInv);
        ly = (dx * sinInv) + (dy * cosInv);
        if (lx < minLocalX) minLocalX = lx; if (lx > maxLocalX) maxLocalX = lx;
        if (ly < minLocalY) minLocalY = ly; if (ly > maxLocalY) maxLocalY = ly;

        // Bottom-right corner
        dx = right - rData.tfX;
        dy = bottom - rData.tfY;
        lx = (dx * cosInv) - (dy * sinInv);
        ly = (dx * sinInv) + (dy * cosInv);
        if (lx < minLocalX) minLocalX = lx; if (lx > maxLocalX) maxLocalX = lx;
        if (ly < minLocalY) minLocalY = ly; if (ly > maxLocalY) maxLocalY = ly;

        // Bottom-left corner
        dx = left - rData.tfX;
        dy = bottom - rData.tfY;
        lx = (dx * cosInv) - (dy * sinInv);
        ly = (dx * sinInv) + (dy * cosInv);
        if (lx < minLocalX) minLocalX = lx; if (lx > maxLocalX) maxLocalX = lx;
        if (ly < minLocalY) minLocalY = ly; if (ly > maxLocalY) maxLocalY = ly;

        const g0x = minLocalX / scaledTileW;
        const g1x = maxLocalX / scaledTileW;
        const g0y = minLocalY / scaledTileH;
        const g1y = maxLocalY / scaledTileH;

        const minGx = Math.floor(Math.min(g0x, g1x)) - 1;
        const maxGx = Math.ceil(Math.max(g0x, g1x)) + 1;
        const minGy = Math.floor(Math.min(g0y, g1y)) - 1;
        const maxGy = Math.ceil(Math.max(g0y, g1y)) + 1;

        const finalMinX = Math.max(minGx, bounds.minX);
        const finalMaxX = Math.min(maxGx, bounds.maxX);
        const finalMinY = Math.max(minGy, bounds.minY);
        const finalMaxY = Math.min(maxGy, bounds.maxY);

        if (finalMinX > finalMaxX || finalMinY > finalMaxY) {
            range.isCulled = true;
            return range;
        }

        range.minX = finalMinX;
        range.maxX = finalMaxX;
        range.minY = finalMinY;
        range.maxY = finalMaxY;
        range.isCulled = false;
        return range;
    }

    _drawTiles(entity, tm, rData, world, proj, editors, externalOpacity = 1.0) {
        const asset = world?.assets?.textures?.[tm.assetId];
        if (!asset || !tm.data) return;

        const bounds = TilemapMath.getBounds(tm);
        if (!bounds.hasTiles) return;

        const range = this._getViewportGridRange(rData, bounds);
        if (range.isCulled) return;

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

        const visibleCellsCount = (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
        const placedTiles = tm._placedTiles || [];

        const src = this._reusableSource;
        src.w = rData.tileW;
        src.h = rData.tileH;

        const opt = this._reusableOptions;
        opt.filterMode = filterMode;

        // Adaptive spatial query:
        // When viewport covers fewer cells than placed tiles, iterate the visible grid coordinates (Spatial Culling).
        // When zoomed out or sparse, iterate placed tiles and cull individually.
        if (visibleCellsCount <= placedTiles.length) {
            for (let y = range.minY; y <= range.maxY; y++) {
                for (let x = range.minX; x <= range.maxX; x++) {
                    const tileId = tm.data[`${x},${y}`];
                    if (!tileId || tileId <= 0) continue;

                    this._renderSingleTile(tileId, x, y, rData, scaledTileW, scaledTileH, cosR, sinR, tilesetCols, baseOpacity, dragState, asset, proj, src, opt);
                }
            }
        } else {
            for (let i = 0; i < placedTiles.length; i++) {
                const pt = placedTiles[i];
                if (pt.x < range.minX || pt.x > range.maxX || pt.y < range.minY || pt.y > range.maxY) continue;

                this._renderSingleTile(pt.tileId, pt.x, pt.y, rData, scaledTileW, scaledTileH, cosR, sinR, tilesetCols, baseOpacity, dragState, asset, proj, src, opt);
            }
        }

        this.image?.flush();
    }

    _renderSingleTile(tileId, x, y, rData, scaledTileW, scaledTileH, cosR, sinR, tilesetCols, baseOpacity, dragState, asset, proj, src, opt) {
        let currentOpacity = baseOpacity;
        if (dragState) {
            const isInSource = x >= dragState.sourceX && x < dragState.sourceX + dragState.w &&
                               y >= dragState.sourceY && y < dragState.sourceY + dragState.h;
            if (isInSource) currentOpacity *= 0.4;
        }

        const actualIndex = tileId - 1;
        src.x = (actualIndex % tilesetCols) * rData.tileW;
        src.y = Math.floor(actualIndex / tilesetCols) * rData.tileH;
        opt.opacity = currentOpacity;

        const vertices = this._setTileQuadVertices(rData, scaledTileW, scaledTileH, cosR, sinR, x, y);

        this.image.drawQuad(
            asset,
            src,
            vertices,
            opt,
            proj
        );
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

        // 1. Grid Lines Viewport with LOD and line clamping
        const showGrid = editors?.tilemapContext?.showGrid ?? true;
        if (showGrid) {
            const camScale = Math.max(0.001, cam.scale || 1);
            const screenTileW = absTileW * camScale;
            const screenTileH = absTileH * camScale;

            // Only draw grid if tiles are at least 5 pixels on screen to avoid performance drops and visual noise
            if (screenTileW >= 5 && screenTileH >= 5) {
                let step = 1;
                if (screenTileW < 12) step = 4;
                else if (screenTileW < 20) step = 2;

                const gridThickness = 1 / camScale;
                const halfViewW = (canvas.width / camScale) * 0.5 + absTileW * 2;
                const halfViewH = (canvas.height / camScale) * 0.5 + absTileH * 2;
                const viewRadius = Math.hypot(halfViewW, halfViewH);

                const centerGridX = Math.floor((cam.x - rData.tfX) / scaledTileW);
                const centerGridY = Math.floor((cam.y - rData.tfY) / scaledTileH);

                const maxSpan = 120;
                const spanX = Math.min(Math.ceil(viewRadius / absTileW) + 2, maxSpan);
                const spanY = Math.min(Math.ceil(viewRadius / absTileH) + 2, maxSpan);

                const minX = Math.floor((centerGridX - spanX) / step) * step;
                const maxX = Math.ceil((centerGridX + spanX) / step) * step;
                const minY = Math.floor((centerGridY - spanY) / step) * step;
                const maxY = Math.ceil((centerGridY + spanY) / step) * step;

                const yLocalStart = minY * scaledTileH;
                const yLocalEnd = maxY * scaledTileH;

                for (let i = minX; i <= maxX; i += step) {
                    const xLocal = i * scaledTileW;
                    const x1 = rData.tfX + (xLocal * cosR - yLocalStart * sinR);
                    const y1 = rData.tfY + (xLocal * sinR + yLocalStart * cosR);
                    const x2 = rData.tfX + (xLocal * cosR - yLocalEnd * sinR);
                    const y2 = rData.tfY + (xLocal * sinR + yLocalEnd * cosR);

                    this.shape.drawLine(x1, y1, x2, y2, this.colors.grid, gridThickness, proj);
                }

                const xLocalStart = minX * scaledTileW;
                const xLocalEnd = maxX * scaledTileW;

                for (let j = minY; j <= maxY; j += step) {
                    const yLocal = j * scaledTileH;
                    const x1 = rData.tfX + (xLocalStart * cosR - yLocal * sinR);
                    const y1 = rData.tfY + (xLocalStart * sinR + yLocal * cosR);
                    const x2 = rData.tfX + (xLocalEnd * cosR - yLocal * sinR);
                    const y2 = rData.tfY + (xLocalEnd * sinR + yLocal * cosR);

                    this.shape.drawLine(x1, y1, x2, y2, this.colors.grid, gridThickness, proj);
                }
            }
        }

        const activeTab = editors.tabs?.find(t => String(t.id) === String(editors.activeTabId));
        if (activeTab?.type === 'tilemap') {
            const camScale = Math.max(0.001, cam.scale || 1);
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
                [0, 0, 0, 0], this.colors.border, false, 2 / camScale, 0, 4,
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
            const src = this._reusableSource;
            src.w = rData.tileW;
            src.h = rData.tileH;
            const opt = this._reusableOptions;
            opt.opacity = 0.8;
            opt.filterMode = filterMode;

            for (let dy = 0; dy < ds.h; dy++) {
                for (let dx = 0; dx < ds.w; dx++) {
                    const tileId = ds.data[dy * ds.w + dx];
                    if (!tileId || tileId <= 0) continue;
                    const tx = drawGridX + dx;
                    const ty = drawGridY + dy;

                    const actualIndex = tileId - 1;
                    src.x = (actualIndex % tilesetCols) * rData.tileW;
                    src.y = Math.floor(actualIndex / tilesetCols) * rData.tileH;

                    const vertices = this._setTileQuadVertices(rData, scaledTileW, scaledTileH, cosR, sinR, tx, ty);

                    this.image.drawQuad(
                        asset,
                        src,
                        vertices,
                        opt,
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

        const camScale = Math.max(0.001, this.game?.camera?.scale || 1);

        this.shape.drawParametricShape(
            "rectangle", dstX, dstY, highlightW, highlightH,
            [0, 0, 0, 0], colorFill, true, 1 / camScale, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );

        this.shape.drawParametricShape(
            "rectangle", dstX, dstY, highlightW, highlightH,
            [0, 0, 0, 0], colorBorder, false, 2 / camScale, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );
    }

    _renderGhost(rData, tm, asset, selection, proj, gridX, gridY) {
        const scaledTileW = rData.tileW * rData.scaleX;
        const scaledTileH = rData.tileH * rData.scaleY;
        const filterMode = tm.filterMode || "pixelated"; 

        const cosR = Math.cos(rData.rotation);
        const sinR = Math.sin(rData.rotation);

        const src = this._reusableSource;
        src.w = rData.tileW;
        src.h = rData.tileH;
        const opt = this._reusableOptions;
        opt.opacity = 0.6;
        opt.filterMode = filterMode;

        for (let dy = 0; dy < selection.h; dy++) {
            for (let dx = 0; dx < selection.w; dx++) {
                const tx = gridX + dx;
                const ty = gridY + dy;
                
                const vertices = this._setTileQuadVertices(rData, scaledTileW, scaledTileH, cosR, sinR, tx, ty);

                src.x = (selection.x + dx) * rData.tileW;
                src.y = (selection.y + dy) * rData.tileH;
                
                this.image.drawQuad(
                    asset, 
                    src, 
                    vertices, 
                    opt, 
                    proj
                );
            }
        }
        this.image?.flush();
        this._renderHighlightRect(rData, gridX, gridY, selection.w, selection.h, this.colors.validGhost, proj, 2);
    }

    _renderHighlightRect(rData, gridX, gridY, w, h, color, proj, thickness = 2) {
        const camScale = Math.max(0.001, this.game?.camera?.scale || 1);
        const finalThickness = thickness / camScale;

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
            [0, 0, 0, 0], color, false, finalThickness, 0, 4,
            proj, rData.rotation, 1, 1, 0, 0, false, false
        );
    }
}
