import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

/**
 * Pure function: Calculates Axis-Aligned Bounding Box (AABB) for a given UI entity.
 * Works with or without a TransformGeometry helper instance.
 */
export function calculateEntityAABB(entity, world = null, geometry = null) {
    if (!entity) return null;
    const comps = entity.components || {};
    const t = comps.UITransform || comps.Transform;
    if (!t) return null;

    let absX = 0, absY = 0;
    let width = Number(t.width || 0);
    let height = Number(t.height || 0);
    let rotDeg = Number(t.rotation || 0);
    let scaleX = t.scaleX ?? 1;
    let scaleY = t.scaleY ?? 1;
    let pivotX = t.pivotX ?? 0.5;
    let pivotY = t.pivotY ?? 0.5;
    const flipX = Boolean(t.flipX);
    const flipY = Boolean(t.flipY);

    if (geometry) {
        const absPos = geometry.calculateAbsolutePosition(entity);
        absX = absPos.x;
        absY = absPos.y;
        const dims = geometry._getEntityDimensions(entity);
        width = dims.width || width;
        height = dims.height || height;
        const globalT = geometry.getGlobalTransform(entity);
        rotDeg = globalT.rotation || 0;
        scaleX = globalT.scaleX ?? 1;
        scaleY = globalT.scaleY ?? 1;
        pivotX = globalT.pivotX ?? pivotX;
        pivotY = globalT.pivotY ?? pivotY;
    } else {
        const uiSettings = world?.settings?.ui || { width: 1920, height: 1080 };
        const canvasW = uiSettings.width || 1920;
        const canvasH = uiSettings.height || 1080;
        if (comps.UITransform) {
            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            absX = canvasW * anchorX + Number(t.x || 0);
            absY = canvasH * anchorY + Number(t.y || 0);
        } else {
            absX = Number(t.x || 0);
            absY = Number(t.y || 0);
        }
    }

    const sx = (flipX ? -1 : 1) * scaleX;
    const sy = (flipY ? -1 : 1) * scaleY;
    const rRad = rotDeg * (Math.PI / 180);

    const quad = calculateQuadVertices(absX, absY, width, height, rRad, sx, sy, pivotX, pivotY);

    const left = Math.min(quad.tl.x, quad.tr.x, quad.bl.x, quad.br.x);
    const right = Math.max(quad.tl.x, quad.tr.x, quad.bl.x, quad.br.x);
    const top = Math.min(quad.tl.y, quad.tr.y, quad.bl.y, quad.br.y);
    const bottom = Math.max(quad.tl.y, quad.tr.y, quad.bl.y, quad.br.y);

    return {
        id: entity.id,
        left,
        right,
        top,
        bottom,
        centerX: (left + right) / 2,
        centerY: (top + bottom) / 2,
        width: right - left,
        height: bottom - top
    };
}

/**
 * Pure function: Given start bounds, translation delta (rawDx, rawDy),
 * candidate bounding boxes, and canvas bounds, computes snapped delta and active guide lines.
 */
export function findSnapAdjustment({
    startBounds,
    rawDx,
    rawDy,
    candidates = [],
    canvasBounds = null,
    threshold = 6
}) {
    if (!startBounds) {
        return { dx: rawDx, dy: rawDy, guides: [] };
    }

    const currentBounds = {
        left: startBounds.left + rawDx,
        right: startBounds.right + rawDx,
        centerX: startBounds.centerX + rawDx,
        top: startBounds.top + rawDy,
        bottom: startBounds.bottom + rawDy,
        centerY: startBounds.centerY + rawDy,
        width: startBounds.width,
        height: startBounds.height
    };

    const allTargets = [];
    if (canvasBounds) {
        allTargets.push(canvasBounds);
    }
    for (const c of candidates) {
        allTargets.push(c);
    }

    // ----------------------------------------------------
    // X AXIS SNAPPING
    // ----------------------------------------------------
    const draggedXPoints = [
        { type: 'left', val: currentBounds.left },
        { type: 'centerX', val: currentBounds.centerX },
        { type: 'right', val: currentBounds.right }
    ];

    let bestDiffX = 0;
    let minDistanceX = Infinity;
    let snappedValX = null;

    for (const target of allTargets) {
        const targetPoints = [
            { type: 'left', val: target.left },
            { type: 'centerX', val: target.centerX },
            { type: 'right', val: target.right }
        ];

        for (const dPt of draggedXPoints) {
            for (const tPt of targetPoints) {
                // Center only pairs with center; edges only pair with edges
                if (dPt.type === 'centerX' && tPt.type !== 'centerX') continue;
                if (tPt.type === 'centerX' && dPt.type !== 'centerX') continue;

                const diff = tPt.val - dPt.val;
                const dist = Math.abs(diff);

                if (dist <= threshold) {
                    if (dist < minDistanceX - 0.0001) {
                        minDistanceX = dist;
                        bestDiffX = diff;
                        snappedValX = tPt.val;
                    }
                }
            }
        }
    }

    const finalDx = snappedValX !== null ? rawDx + bestDiffX : rawDx;

    // ----------------------------------------------------
    // Y AXIS SNAPPING
    // ----------------------------------------------------
    const draggedYPoints = [
        { type: 'top', val: currentBounds.top },
        { type: 'centerY', val: currentBounds.centerY },
        { type: 'bottom', val: currentBounds.bottom }
    ];

    let bestDiffY = 0;
    let minDistanceY = Infinity;
    let snappedValY = null;

    for (const target of allTargets) {
        const targetPoints = [
            { type: 'top', val: target.top },
            { type: 'centerY', val: target.centerY },
            { type: 'bottom', val: target.bottom }
        ];

        for (const dPt of draggedYPoints) {
            for (const tPt of targetPoints) {
                // Center only pairs with center; edges only pair with edges
                if (dPt.type === 'centerY' && tPt.type !== 'centerY') continue;
                if (tPt.type === 'centerY' && dPt.type !== 'centerY') continue;

                const diff = tPt.val - dPt.val;
                const dist = Math.abs(diff);

                if (dist <= threshold) {
                    if (dist < minDistanceY - 0.0001) {
                        minDistanceY = dist;
                        bestDiffY = diff;
                        snappedValY = tPt.val;
                    }
                }
            }
        }
    }

    const finalDy = snappedValY !== null ? rawDy + bestDiffY : rawDy;

    // ----------------------------------------------------
    // GENERATE ALIGNMENT GUIDE LINES
    // ----------------------------------------------------
    const snappedBounds = {
        left: startBounds.left + finalDx,
        right: startBounds.right + finalDx,
        centerX: startBounds.centerX + finalDx,
        top: startBounds.top + finalDy,
        bottom: startBounds.bottom + finalDy,
        centerY: startBounds.centerY + finalDy
    };

    const guides = [];
    const PAD = 12;

    if (snappedValX !== null) {
        const alignedTargets = allTargets.filter(t =>
            Math.abs(t.left - snappedValX) < 0.5 ||
            Math.abs(t.centerX - snappedValX) < 0.5 ||
            Math.abs(t.right - snappedValX) < 0.5
        );

        const hasCanvas = alignedTargets.some(t => t.isCanvas);
        let y1, y2;
        if (hasCanvas && canvasBounds) {
            y1 = canvasBounds.top;
            y2 = canvasBounds.bottom;
        } else {
            const allTops = [snappedBounds.top, ...alignedTargets.map(t => t.top)];
            const allBottoms = [snappedBounds.bottom, ...alignedTargets.map(t => t.bottom)];
            y1 = Math.min(...allTops) - PAD;
            y2 = Math.max(...allBottoms) + PAD;
        }

        guides.push({
            type: 'vertical',
            x: snappedValX,
            y1,
            y2
        });
    }

    if (snappedValY !== null) {
        const alignedTargets = allTargets.filter(t =>
            Math.abs(t.top - snappedValY) < 0.5 ||
            Math.abs(t.centerY - snappedValY) < 0.5 ||
            Math.abs(t.bottom - snappedValY) < 0.5
        );

        const hasCanvas = alignedTargets.some(t => t.isCanvas);
        let x1, x2;
        if (hasCanvas && canvasBounds) {
            x1 = canvasBounds.left;
            x2 = canvasBounds.right;
        } else {
            const allLefts = [snappedBounds.left, ...alignedTargets.map(t => t.left)];
            const allRights = [snappedBounds.right, ...alignedTargets.map(t => t.right)];
            x1 = Math.min(...allLefts) - PAD;
            x2 = Math.max(...allRights) + PAD;
        }

        guides.push({
            type: 'horizontal',
            y: snappedValY,
            x1,
            x2
        });
    }

    return {
        dx: finalDx,
        dy: finalDy,
        guides
    };
}

/**
 * Pure function: Computes snap adjustments during resizing of an edge/corner handle.
 */
export function findResizeSnapAdjustment({
    startBounds,
    rawDx,
    rawDy,
    resizeType,
    candidates = [],
    canvasBounds = null,
    threshold = 6
}) {
    if (!startBounds || !resizeType) {
        return { dx: rawDx, dy: rawDy, guides: [] };
    }

    const allTargets = [];
    if (canvasBounds) allTargets.push(canvasBounds);
    for (const c of candidates) allTargets.push(c);

    let finalDx = rawDx;
    let finalDy = rawDy;
    let snappedValX = null;
    let snappedValY = null;
    let minDistanceX = Infinity;
    let minDistanceY = Infinity;

    // Check horizontal edge resizing
    if (resizeType.includes('e')) {
        const currentRight = startBounds.right + rawDx;
        for (const target of allTargets) {
            for (const tVal of [target.left, target.centerX, target.right]) {
                const diff = tVal - currentRight;
                const dist = Math.abs(diff);
                if (dist <= threshold && dist < minDistanceX) {
                    minDistanceX = dist;
                    finalDx = rawDx + diff;
                    snappedValX = tVal;
                }
            }
        }
    } else if (resizeType.includes('w')) {
        const currentLeft = startBounds.left + rawDx;
        for (const target of allTargets) {
            for (const tVal of [target.left, target.centerX, target.right]) {
                const diff = tVal - currentLeft;
                const dist = Math.abs(diff);
                if (dist <= threshold && dist < minDistanceX) {
                    minDistanceX = dist;
                    finalDx = rawDx + diff;
                    snappedValX = tVal;
                }
            }
        }
    }

    // Check vertical edge resizing
    if (resizeType.includes('s')) {
        const currentBottom = startBounds.bottom + rawDy;
        for (const target of allTargets) {
            for (const tVal of [target.top, target.centerY, target.bottom]) {
                const diff = tVal - currentBottom;
                const dist = Math.abs(diff);
                if (dist <= threshold && dist < minDistanceY) {
                    minDistanceY = dist;
                    finalDy = rawDy + diff;
                    snappedValY = tVal;
                }
            }
        }
    } else if (resizeType.includes('n')) {
        const currentTop = startBounds.top + rawDy;
        for (const target of allTargets) {
            for (const tVal of [target.top, target.centerY, target.bottom]) {
                const diff = tVal - currentTop;
                const dist = Math.abs(diff);
                if (dist <= threshold && dist < minDistanceY) {
                    minDistanceY = dist;
                    finalDy = rawDy + diff;
                    snappedValY = tVal;
                }
            }
        }
    }

    const guides = [];
    const PAD = 12;

    const currentTop = resizeType.includes('n') ? startBounds.top + finalDy : startBounds.top;
    const currentBottom = resizeType.includes('s') ? startBounds.bottom + finalDy : startBounds.bottom;
    const currentLeft = resizeType.includes('w') ? startBounds.left + finalDx : startBounds.left;
    const currentRight = resizeType.includes('e') ? startBounds.right + finalDx : startBounds.right;

    if (snappedValX !== null) {
        const alignedTargets = allTargets.filter(t =>
            Math.abs(t.left - snappedValX) < 0.5 ||
            Math.abs(t.centerX - snappedValX) < 0.5 ||
            Math.abs(t.right - snappedValX) < 0.5
        );
        const hasCanvas = alignedTargets.some(t => t.isCanvas);
        let y1, y2;
        if (hasCanvas && canvasBounds) {
            y1 = canvasBounds.top;
            y2 = canvasBounds.bottom;
        } else {
            const allTops = [currentTop, ...alignedTargets.map(t => t.top)];
            const allBottoms = [currentBottom, ...alignedTargets.map(t => t.bottom)];
            y1 = Math.min(...allTops) - PAD;
            y2 = Math.max(...allBottoms) + PAD;
        }
        guides.push({ type: 'vertical', x: snappedValX, y1, y2 });
    }

    if (snappedValY !== null) {
        const alignedTargets = allTargets.filter(t =>
            Math.abs(t.top - snappedValY) < 0.5 ||
            Math.abs(t.centerY - snappedValY) < 0.5 ||
            Math.abs(t.bottom - snappedValY) < 0.5
        );
        const hasCanvas = alignedTargets.some(t => t.isCanvas);
        let x1, x2;
        if (hasCanvas && canvasBounds) {
            x1 = canvasBounds.left;
            x2 = canvasBounds.right;
        } else {
            const allLefts = [currentLeft, ...alignedTargets.map(t => t.left)];
            const allRights = [currentRight, ...alignedTargets.map(t => t.right)];
            x1 = Math.min(...allLefts) - PAD;
            x2 = Math.max(...allRights) + PAD;
        }
        guides.push({ type: 'horizontal', y: snappedValY, x1, x2 });
    }

    return { dx: finalDx, dy: finalDy, guides };
}

/**
 * UISmartGuides Class: Integrates Smart Guides calculation & rendering for Lupis Engine's UI Tab.
 */
export class UISmartGuides {
    constructor(world, game, geometry) {
        this.world = world;
        this.game = game;
        this.geometry = geometry;

        this.startBounds = null;
        this.canvasBounds = null;
        this.candidates = [];
        this.activeGuides = [];
        this.resizeType = null;

        // Selection blue line color: [0, 0.6, 1, 1]
        this.lineColor = [0, 0.6, 1, 1];
    }

    _getEffectiveThreshold() {
        const scale = this.game?.camera?.scale || 1;
        return Math.max(2, Math.min(20, 6 / scale));
    }

    calculateEntityAABB(entity) {
        return calculateEntityAABB(entity, this.world, this.geometry);
    }

    computeSelectionAABB(entities) {
        if (!entities || !entities.length) return null;
        const boxes = entities
            .map(e => this.calculateEntityAABB(e))
            .filter(b => b && b.width >= 0 && b.height >= 0);

        if (!boxes.length) return null;

        const left = Math.min(...boxes.map(b => b.left));
        const right = Math.max(...boxes.map(b => b.right));
        const top = Math.min(...boxes.map(b => b.top));
        const bottom = Math.max(...boxes.map(b => b.bottom));

        return {
            left,
            right,
            top,
            bottom,
            centerX: (left + right) / 2,
            centerY: (top + bottom) / 2,
            width: right - left,
            height: bottom - top
        };
    }

    beginDrag(selectedEntities) {
        if (!selectedEntities || !selectedEntities.length) {
            this.clear();
            return;
        }

        this.resizeType = null;
        this.startBounds = this.computeSelectionAABB(selectedEntities);

        const uiSettings = this.world?.settings?.ui || { width: 1920, height: 1080 };
        const canvasW = Number(uiSettings.width || 1920);
        const canvasH = Number(uiSettings.height || 1080);
        this.canvasBounds = {
            id: '__canvas__',
            isCanvas: true,
            left: 0,
            centerX: canvasW / 2,
            right: canvasW,
            top: 0,
            centerY: canvasH / 2,
            bottom: canvasH,
            width: canvasW,
            height: canvasH
        };

        const selectedIds = new Set(selectedEntities.map(e => String(e.id)));
        const uiLayers = this.world?.layersUI || [];

        const addDescendants = (parentId) => {
            for (const layer of uiLayers) {
                if (!layer?.entities) continue;
                for (const e of layer.entities) {
                    if (e.parentId === parentId) {
                        selectedIds.add(String(e.id));
                        addDescendants(e.id);
                    }
                }
            }
        };
        selectedEntities.forEach(e => addDescendants(e.id));

        this.candidates = [];
        for (const layer of uiLayers) {
            if (!layer || layer.active === false || layer.visible === false || layer.locked) continue;
            if (!layer.entities) continue;

            for (const entity of layer.entities) {
                if (!entity || entity.active === false || entity.visible === false) continue;
                if (entity.locked || entity._editor?.locked) continue;
                if (selectedIds.has(String(entity.id))) continue;

                const t = entity.components?.UITransform || entity.components?.Transform;
                if (!t) continue;

                const aabb = this.calculateEntityAABB(entity);
                if (aabb && aabb.width > 0 && aabb.height > 0) {
                    this.candidates.push({ ...aabb, id: entity.id, isCanvas: false });
                }
            }
        }

        this.activeGuides = [];
    }

    beginResize(selectedEntities, resizeType) {
        this.beginDrag(selectedEntities);
        this.resizeType = resizeType;
    }

    calculateSnap(rawDx, rawDy) {
        if (!this.startBounds) {
            return { dx: rawDx, dy: rawDy };
        }

        const threshold = this._getEffectiveThreshold();
        const result = findSnapAdjustment({
            startBounds: this.startBounds,
            rawDx,
            rawDy,
            candidates: this.candidates,
            canvasBounds: this.canvasBounds,
            threshold
        });

        this.activeGuides = result.guides;
        return { dx: result.dx, dy: result.dy };
    }

    calculateResizeSnap(rawDx, rawDy, resizeType) {
        if (!this.startBounds || !resizeType) {
            return { dx: rawDx, dy: rawDy };
        }

        const threshold = this._getEffectiveThreshold();
        const result = findResizeSnapAdjustment({
            startBounds: this.startBounds,
            rawDx,
            rawDy,
            resizeType,
            candidates: this.candidates,
            canvasBounds: this.canvasBounds,
            threshold
        });

        this.activeGuides = result.guides;
        return { dx: result.dx, dy: result.dy };
    }

    clearGuides() {
        this.activeGuides = [];
    }

    clear() {
        this.startBounds = null;
        this.canvasBounds = null;
        this.candidates = [];
        this.activeGuides = [];
        this.resizeType = null;
    }

    draw(shape, proj) {
        if (!this.activeGuides || !this.activeGuides.length) return;

        const scale = this.game?.camera?.scale || 1;
        const lineThick = 2 / scale;

        for (const guide of this.activeGuides) {
            if (guide.type === 'vertical') {
                shape.drawLine(guide.x, guide.y1, guide.x, guide.y2, this.lineColor, lineThick, proj);
            } else if (guide.type === 'horizontal') {
                shape.drawLine(guide.x1, guide.y, guide.x2, guide.y, this.lineColor, lineThick, proj);
            }
        }
    }
}
