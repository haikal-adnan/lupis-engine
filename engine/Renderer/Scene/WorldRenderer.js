import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class WorldRenderer {
    constructor(image, text, shape, game, tilemapRenderer) {
        this.game = game;
        this.renderer = { image, text, shape };
        this.tilemapRenderer = tilemapRenderer;
        this.renderQueue = [];
    }

    render(world, proj, alpha = 1.0) {
        const { activeTabId, tabs } = world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isIsolationMode = activeTab?.type === "tilemap";

        if (world.gridRenderer && !isIsolationMode) {
            this._flushAll();
            world.gridRenderer(this.renderer.shape, proj);
            this.renderer.shape.flush();
        }

        this.renderQueue.length = 0;

        this._collectRenderables(world, activeTabId, isIsolationMode, proj, alpha);

        this._executeRenderQueue(proj);

        if (!isIsolationMode && world.selectionRenderer && this.game.selection.active) {
            this._flushAll();
            world.selectionRenderer(this.renderer.image, this.renderer.shape, this.renderer.text, proj);
        }
    }

    _collectRenderables(world, activeTabId, isIsolationMode, proj, alpha) {
        for (let li = 0; li < world.layers.length; li++) {
            const layer = world.layers[li];
            if (layer.visible === false) continue;

            for (const e of layer.entities) {
                if (isIsolationMode && e.id !== activeTabId) continue;
                if (!e.parentId) {
                    this._processEntityRecursive(e, world, proj, alpha);
                }
            }
        }
    }

    _processEntityRecursive(e, world, proj, alpha) {
        if (e.active === false) return;
        if (e.visible === false) return;

        const comps = e.components;
        if (!comps) return;

        if (comps.Tilemap && this.tilemapRenderer) {
            this._executeRenderQueue(proj);
            this.renderQueue.length = 0;
            this.tilemapRenderer.renderEntity(e, world, proj);
            return;
        }

        const t = comps.Transform;
        const opacity = e.opacity ?? 1;

        const drawX = t.prevX !== undefined ? t.prevX + (t.x - t.prevX) * alpha : t.x;
        const drawY = t.prevY !== undefined ? t.prevY + (t.y - t.prevY) * alpha : t.y;

        const trans = {
            x: drawX,
            y: drawY,
            width: t.width,
            height: t.height,
            rotation: t.rotation,
            scaleX: t.scaleX,
            scaleY: t.scaleY,
            pivotX: t.pivotX,
            pivotY: t.pivotY
        };

        if (comps.SpriteRenderer) {
            const s = comps.SpriteRenderer;
            const a = (s.opacity ?? 1) * opacity;
            if (a > 0) {
                this.renderQueue.push({
                    type: "image",
                    texture: world.assets.textures[s.assetId],
                    frame: s.source || { x: 0, y: 0, w: 0, h: 0 },
                    transformData: trans,
                    options: { flipX: s.flipX, flipY: s.flipY, opacity: a }
                });
            }
        }

        if (comps.ShapeRenderer) {
            const s = comps.ShapeRenderer;
            const a = (s.opacity ?? 1) * opacity;
            if (a > 0) {
                this.renderQueue.push({
                    type: "shape",
                    transformData: trans,
                    shapeOptions: {
                        type: s.type || "rectangle",
                        color: HexToVec4(s.color || "#FFFFFF"),
                        thickness: s.thickness || 1,
                        x2: s.x2 ?? (drawX + t.width),
                        y2: s.y2 ?? (drawY + t.height),
                        opacity: a
                    }
                });
            }
        }

        if (comps.TextRenderer) {
            const tx = comps.TextRenderer;
            const a = (tx.opacity ?? 1) * opacity;
            let font = world.assets.fonts[tx.assetId];
            if (!font?.ready) font = world.assets.fonts["system_default"];

            if (a > 0 && font) {
                this.renderQueue.push({
                    type: "text",
                    transformData: trans,
                    textOptions: {
                        text: tx.value ?? "",
                        fontSize: tx.fontSize || 24,
                        color: HexToVec4(tx.color || "#FFFFFF"),
                        font,
                        opacity: a
                    }
                });
            }
        }

        if (e.children && e.children.length > 0) {
            for (const child of e.children) {
                this._processEntityRecursive(child, world, proj, alpha);
            }
        }
    }

    _executeRenderQueue(proj) {
        if (this.renderQueue.length === 0) return;

        let currentType = null;

        for (const item of this.renderQueue) {
            if (currentType && currentType !== item.type) {
                this.renderer[currentType].flush();
            }
            currentType = item.type;

            if (item.type === "image") {
                this.renderer.image.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } else if (item.type === "shape") {
                this._drawShape(item.shapeOptions, item.transformData, proj);
            } else if (item.type === "text") {
                const { text, font, fontSize, color, opacity } = item.textOptions;
                const t = item.transformData;
                this.renderer.text.drawText(
                    font, text, t.x, t.y, t.width, t.height, fontSize, color, proj,
                    t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opacity
                );
            }
        }

        if (currentType) {
            this.renderer[currentType].flush();
        }
    }

    _drawShape(opt, t, proj) {
        const shape = this.renderer.shape;
        if (opt.type === "rectangle") {
            shape.drawRect(t.x, t.y, t.width, t.height, opt.color, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity);
        } else if (opt.type === "rectStroke") {
            shape.drawRectStroke(t.x, t.y, t.width, t.height, opt.color, opt.thickness, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity);
        } else if (opt.type === "circle") {
            const radius = (t.width / 2) * ((Math.abs(t.scaleX) + Math.abs(t.scaleY)) / 2);
            shape.drawCircle(t.x, t.y, radius, opt.color, 32, proj);
        } else if (opt.type === "line") {
            shape.drawLine(t.x, t.y, opt.x2, opt.y2, opt.color, opt.thickness, proj);
        }
    }

    _flushAll() {
        this.renderer.image.flush();
        this.renderer.shape.flush();
        this.renderer.text.flush();
    }
}
