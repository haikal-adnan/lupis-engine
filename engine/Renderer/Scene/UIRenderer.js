import { HexToVec4 } from "../../Util/HexToVec4.js";
import Config from "../../Core/Config.js"; // [BARU] Import Config untuk cek mode engine

export default class UIRenderer {
    constructor(image, shape, text, game) {
        this.renderer = { image, shape, text };
        this.game = game;
        this.renderQueue = [];
        
        this.borderColor = HexToVec4("#00aaff");
        this.dashedColor = [0, 0.66, 1, 0.5];
    }

    render(world, proj, isSceneMode = false) {
        // [MODIFIKASI] Hanya render border jika mode EDITOR
        const isEditor = Config.ENGINE_MODE === "editor";
        const showBorder = world._editors?.showUIBorder !== false;

        if (isEditor) {
            if (isSceneMode) {
                if (showBorder) {
                    this._renderDashedBorder(proj);
                }
            } else {
                this._renderWorkspaceGizmos(proj);
            }
        }

        this.renderQueue.length = 0;
        this._collectUIEntities(world, proj);
        this._executeRenderQueue(proj);
    }

    _renderWorkspaceGizmos(proj) {
        const width = 1920;
        const height = 1080;
        this.renderer.shape.drawRectStroke(0, 0, width, height, this.borderColor, 4, proj);
        this.renderer.shape.flush();
    }

    _renderDashedBorder(proj) {
        const width = 1920;
        const height = 1080;
        const scale = this.game.camera.scale || 1;
        const dashLen = 20 / scale;
        const gapLen = 10 / scale;

        this._drawDashedLine(0, 0, width, 0, dashLen, gapLen, proj);
        this._drawDashedLine(width, 0, width, height, dashLen, gapLen, proj);
        this._drawDashedLine(width, height, 0, height, dashLen, gapLen, proj);
        this._drawDashedLine(0, height, 0, 0, dashLen, gapLen, proj);
        
        this.renderer.shape.flush();
    }

    _drawDashedLine(x1, y1, x2, y2, dashLen, gapLen, proj) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const nx = dx / len;
        const ny = dy / len;
        
        let dist = 0;
        while (dist < len) {
            const segmentLen = Math.min(dashLen, len - dist);
            
            this.renderer.shape.drawLine(
                x1 + nx * dist, 
                y1 + ny * dist, 
                x1 + nx * (dist + segmentLen), 
                y1 + ny * (dist + segmentLen), 
                this.dashedColor, 
                2 / (this.game.camera.scale || 1), 
                proj
            );
            
            dist += dashLen + gapLen;
        }
    }

    _collectUIEntities(world, proj) {
        const uiLayers = world.layers.filter(l => l.scriptId === 'ui' || l.name === 'UI');

        for (const layer of uiLayers) {
            if (!layer.visible) continue;
            for (const entity of layer.entities) {
                this._processEntityRecursive(entity, world, proj);
            }
        }
    }

    _processEntityRecursive(e, world, proj, parentOpacity = 1.0) {
        if (e.active === false || e.visible === false) return;

        const comps = e.components;
        if (!comps) return;

        const currentOpacity = (e.opacity ?? 1) * parentOpacity;
        const t = comps.Transform;
        
        const trans = {
            x: t.x, y: t.y,
            width: t.width, height: t.height,
            rotation: t.rotation,
            scaleX: t.scaleX, scaleY: t.scaleY,
            pivotX: t.pivotX, pivotY: t.pivotY
        };

        if (comps.SpriteRenderer) {
            const s = comps.SpriteRenderer;
            const a = (s.opacity ?? 1) * currentOpacity;
            if (a > 0 && world.assets.textures[s.assetId]) {
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
            const a = (s.opacity ?? 1) * currentOpacity;
            if (a > 0) {
                this.renderQueue.push({
                    type: "shape",
                    transformData: trans,
                    shapeOptions: {
                        type: s.type || "rectangle",
                        color: HexToVec4(s.color || "#FFFFFF"),
                        thickness: s.thickness || 1,
                        x2: s.x2 ?? (trans.x + t.width),
                        y2: s.y2 ?? (trans.y + t.height),
                        opacity: a
                    }
                });
            }
        }

        if (comps.TextRenderer) {
            const tx = comps.TextRenderer;
            const a = (tx.opacity ?? 1) * currentOpacity;
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

        if (e.children?.length > 0) {
            for (const child of e.children) {
                this._processEntityRecursive(child, world, proj, currentOpacity);
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
                this.renderer.text.drawText(font, text, t.x, t.y, t.width, t.height, fontSize, color, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opacity);
            }
        }
        if (currentType) this.renderer[currentType].flush();
    }

    _drawShape(opt, t, proj) {
        const shape = this.renderer.shape;
        if (opt.type === "rectangle") shape.drawRect(t.x, t.y, t.width, t.height, opt.color, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity);
        else if (opt.type === "rectStroke") shape.drawRectStroke(t.x, t.y, t.width, t.height, opt.color, opt.thickness, proj, t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opt.opacity);
        else if (opt.type === "circle") {
            const radius = (t.width / 2) * ((Math.abs(t.scaleX) + Math.abs(t.scaleY)) / 2);
            shape.drawCircle(t.x, t.y, radius, opt.color, 32, proj);
        } else if (opt.type === "line") shape.drawLine(t.x, t.y, opt.x2, opt.y2, opt.color, opt.thickness, proj);
    }
}