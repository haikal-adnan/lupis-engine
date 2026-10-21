import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";
import { TilemapMath } from "../../Editor/Tilemap/TilemapMath.js";
import RenderUtils from "../../Renderer/Scene/RenderUtils.js";

export class SelectionHit {
    constructor(game, transformEngine) {
        this.game = game;
        this.engine = transformEngine;
    }

    locked(e) {
        return RenderUtils.isEntityEffectivelyLocked(e, this.game.world);
    }

    _getEntityDimensions(e) {
        const comps = e?.components;
        if (!comps) return { width: 0, height: 0 };
        const t = comps.UITransform || comps.Transform;

        if (comps.Tilemap) {
            const bounds = TilemapMath.getBounds(comps.Tilemap);
            return {
                width: bounds.width,
                height: bounds.height
            };
        }

        return {
            width: t?.width || 0,
            height: t?.height || 0
        };
    }

    _calculateAbsolutePosition(e) {
        const t = this.engine.getTransform(e);
        if (!t) return { x: 0, y: 0 };
        return RenderUtils.calculateAbsolutePosition(e, this.game.world);
    }

    _isPointInEntity(wx, wy, e, parentBounds) {
        const t = this.engine.getTransform(e);
        if (!t) return false;

        const globalT = this.engine.getGlobalTransform(e);
        const absPos = this._calculateAbsolutePosition(e, parentBounds);
        const dims = this._getEntityDimensions(e);

        const r = (globalT.rotation || 0) * (Math.PI / 180);
        const flipX = t.flipX || false;
        const flipY = t.flipY || false;
        const sx = (flipX ? -1 : 1) * (globalT.scaleX ?? 1);
        const sy = (flipY ? -1 : 1) * (globalT.scaleY ?? 1);

        const isTilemap = Boolean(e?.components?.Tilemap);
        const px = globalT.pivotX ?? (isTilemap ? 0 : 0.5);
        const py = globalT.pivotY ?? (isTilemap ? 0 : 0.5);

        const dx = wx - absPos.x;
        const dy = wy - absPos.y;

        const c = Math.cos(-r);
        const s = Math.sin(-r);
        const localX = dx * c - dy * s;
        const localY = dx * s + dy * c;

        const unscaledMouseX = sx !== 0 ? localX / sx : 0;
        const unscaledMouseY = sy !== 0 ? localY / sy : 0;

        let left = -px * dims.width;
        let right = dims.width - (px * dims.width);
        let top = -py * dims.height;
        let bottom = dims.height - (py * dims.height);

        if (isTilemap) {
            const bounds = TilemapMath.getBounds(e.components.Tilemap);
            const tileW = Number(e.components.Tilemap.width) || 32;
            const tileH = Number(e.components.Tilemap.height) || 32;
            left = bounds.minX * tileW;
            right = (bounds.maxX + 1) * tileW;
            top = bounds.minY * tileH;
            bottom = (bounds.maxY + 1) * tileH;
        }

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

        const isWorldActive = world?.settings?.world?.active !== false && world?.settings?.world?.visible !== false;
        const isUIActive = world?.settings?.ui?.active !== false && world?.settings?.ui?.visible !== false;

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || layer.locked) continue;

            const isUILayer = layersUI.includes(layer);
            if (isUILayer && !isUIActive) continue;
            if (!isUILayer && !isWorldActive) continue;

            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            const sortedEntities = RenderUtils.getHierarchicalOrder(layer.entities).reverse();

            for (const e of sortedEntities) {
                if (!RenderUtils.isEntityEffectivelyVisible(e, this.game.world) || !RenderUtils.isEntityEffectivelyActive(e, this.game.world) || this.locked(e)) continue;
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

        const isWorldActive = world?.settings?.world?.active !== false && world?.settings?.world?.visible !== false;
        const isUIActive = world?.settings?.ui?.active !== false && world?.settings?.ui?.visible !== false;

        for (const layer of allLayers) {
            if (layer.active === false || layer.visible === false || layer.locked) continue;

            const isUILayer = layersUI.includes(layer);
            if (isUILayer && !isUIActive) continue;
            if (!isUILayer && !isWorldActive) continue;

            const rootBounds = isUILayer ? uiRootBounds : null;

            if (!layer.entities) continue;

            for (const e of layer.entities) {
                if (!RenderUtils.isEntityEffectivelyVisible(e, this.game.world) || !RenderUtils.isEntityEffectivelyActive(e, this.game.world) || this.locked(e)) continue;
                if (filter && !filter(e, layer)) continue;

                const t = this.engine.getTransform(e);
                if (!t) continue;

                const globalT = this.engine.getGlobalTransform(e);
                const absPos = this._calculateAbsolutePosition(e, rootBounds);
                const r = (globalT.rotation || 0) * (Math.PI / 180);

                let v;
                if (e.components?.Tilemap) {
                    v = TilemapMath.getTilemapQuadVertices(
                        absPos, 
                        e.components.Tilemap, 
                        r, 
                        globalT.scaleX ?? 1, 
                        globalT.scaleY ?? 1
                    );
                } else {
                    const dims = this._getEntityDimensions(e);
                    const isTilemap = Boolean(e?.components?.Tilemap);
                    const px = globalT.pivotX ?? (isTilemap ? 0 : 0.5);
                    const py = globalT.pivotY ?? (isTilemap ? 0 : 0.5);
                    const sx = (t.flipX ? -1 : 1) * (globalT.scaleX ?? 1);
                    const sy = (t.flipY ? -1 : 1) * (globalT.scaleY ?? 1);
                    v = calculateQuadVertices(absPos.x, absPos.y, dims.width, dims.height, r, sx, sy, px, py);
                }

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