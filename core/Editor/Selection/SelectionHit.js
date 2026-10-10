import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export class SelectionHit {
    constructor(game, transformEngine) {
        this.game = game;
        this.engine = transformEngine;
    }

    locked(e) {
        return Boolean(e?.locked || (e?._editor && e._editor.locked));
    }

    _getEntityDimensions(e) {
        const comps = e?.components;
        if (!comps) return { width: 0, height: 0 };
        const t = comps.UITransform || comps.Transform;

        if (comps.Tilemap) {
            const tm = comps.Tilemap;
            const cols = Number(tm.width) || 10;
            const rows = Number(tm.height) || 10;
            const tileW = Number(tm.tileWidth) || 32;
            const tileH = Number(tm.tileHeight) || 32;

            return {
                width: t?.width || (cols * tileW),
                height: t?.height || (rows * tileH)
            };
        }

        return {
            width: t?.width || 0,
            height: t?.height || 0
        };
    }

    _calculateAbsolutePosition(e, parentBounds) {
        const t = this.engine.getTransform(e);
        if (!t) return { x: 0, y: 0 };

        const globalT = this.engine.getGlobalTransform(e);

        if (e.components?.UITransform) {
            if (!parentBounds) {
                const uiSettings = this.game.world.settings?.ui || { width: 1920, height: 1080 };
                parentBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };
            }
            const anchorX = t.anchorX ?? 0.5;
            const anchorY = t.anchorY ?? 0.5;
            return {
                x: parentBounds.x + (parentBounds.width * anchorX) + (globalT.x || 0),
                y: parentBounds.y + (parentBounds.height * anchorY) + (globalT.y || 0)
            };
        }
        return { x: globalT.x || 0, y: globalT.y || 0 };
    }

    _isPointInEntity(wx, wy, e, parentBounds) {
        const t = this.engine.getTransform(e);
        if (!t) return false;

        const globalT = this.engine.getGlobalTransform(e);
        const absPos = this._calculateAbsolutePosition(e, parentBounds);
        const dims = this._getEntityDimensions(e);

        const r = (globalT.rotation || 0) * (Math.PI / 180);
        const sx = globalT.scaleX ?? 1;
        const sy = globalT.scaleY ?? 1;
        const px = globalT.pivotX ?? 0.5;
        const py = globalT.pivotY ?? 0.5;

        const dx = wx - absPos.x;
        const dy = wy - absPos.y;

        const c = Math.cos(-r);
        const s = Math.sin(-r);
        const localX = dx * c - dy * s;
        const localY = dx * s + dy * c;

        const unscaledMouseX = sx !== 0 ? localX / sx : 0;
        const unscaledMouseY = sy !== 0 ? localY / sy : 0;

        const left = -px * dims.width;
        const right = dims.width - (px * dims.width);
        const top = -py * dims.height;
        const bottom = dims.height - (py * dims.height);

        const buffer = 5;

        return (
            unscaledMouseX >= Math.min(left, right) - buffer &&
            unscaledMouseX <= Math.max(left, right) + buffer &&
            unscaledMouseY >= Math.min(top, bottom) - buffer &&
            unscaledMouseY <= Math.max(top, bottom) + buffer
        );
    }

    hit(world, wx, wy, px, py) {
        const filter = this.game.selection?.filter;
        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const layersWorld = world.layersWorld || [];
        const layersUI = world.layersUI || [];
        const allLayers = [...layersWorld, ...layersUI];

        allLayers.sort((a, b) => {
            const zA = a.zIndex ?? 0;
            const zB = b.zIndex ?? 0;
            if (zA !== zB) return zB - zA;
            return (b.orderIndex ?? 0) - (a.orderIndex ?? 0);
        });

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || layer.locked) continue;

            const isUILayer = layersUI.includes(layer);
            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            const sortedEntities = [...layer.entities].sort((a, b) => {
                const zA = a.zIndex ?? 0;
                const zB = b.zIndex ?? 0;
                if (zA !== zB) return zB - zA;
                return (b.orderIndex ?? 0) - (a.orderIndex ?? 0);
            });

            for (const e of sortedEntities) {
                if (!e.visible || this.locked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                if (this._isPointInEntity(wx, wy, e, rootBounds)) {
                    return e;
                }
            }
        }
        return null;
    }

    checkMarquee(world, box) {
        const results = [];
        const filter = this.game.selection?.filter;
        const uiSettings = world.settings?.ui || { width: 1920, height: 1080 };
        const uiRootBounds = { x: 0, y: 0, width: uiSettings.width, height: uiSettings.height };

        const layersWorld = world.layersWorld || [];
        const layersUI = world.layersUI || [];
        const allLayers = [...layersWorld, ...layersUI];

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || layer.locked) continue;

            const isUILayer = layersUI.includes(layer);
            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            for (const e of layer.entities) {
                if (!e.visible || this.locked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                const t = this.engine.getTransform(e);
                if (!t) continue;

                const globalT = this.engine.getGlobalTransform(e);
                const absPos = this._calculateAbsolutePosition(e, rootBounds);
                const dims = this._getEntityDimensions(e);

                const r = (globalT.rotation || 0) * (Math.PI / 180);
                const sx = globalT.scaleX ?? 1;
                const sy = globalT.scaleY ?? 1;
                const px = globalT.pivotX ?? 0.5;
                const py = globalT.pivotY ?? 0.5;

                const v = calculateQuadVertices(absPos.x, absPos.y, dims.width, dims.height, r, sx, sy, px, py);

                const xs = [v.tl.x, v.tr.x, v.br.x, v.bl.x];
                const ys = [v.tl.y, v.tr.y, v.br.y, v.bl.y];

                const eLeft = Math.min(...xs);
                const eRight = Math.max(...xs);
                const eTop = Math.min(...ys);
                const eBottom = Math.max(...ys);

                const isOverlapping = !(
                    box.x + box.w < eLeft ||
                    box.x > eRight ||
                    box.y + box.h < eTop ||
                    box.y > eBottom
                );

                if (isOverlapping) {
                    results.push(e);
                }
            }
        }

        return results;
    }
}