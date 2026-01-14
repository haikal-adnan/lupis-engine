import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class WorldRenderer {
    constructor(image, text, shape, game) {
        this.game = game;
        this.image = image;
        this.text = text;
        this.shape = shape;
        this.renderQueue = [];
    }

    render(world, proj) {
        const editors = world._editors || {};
        const activeTabId = editors.activeTabId;
        const tabs = editors.tabs || [];
        
        if (world.gridRenderer) {
            world.gridRenderer(this.shape, proj);
            this.shape.flush();
        }

        this.renderQueue.length = 0;

        for (let li = 0; li < world.layers.length; li++) {
                const layer = world.layers[li];
                if (!layer.visible) continue;

                for (const e of layer.entities) {
                    if (!e.parentId) {
                        this._processEntity(e, li, world);
                    }
                }
            }

        for (const item of this.renderQueue) {
            if (item.type === "image") {
                this.image.draw(
                    item.texture, item.frame, item.transformData,
                    item.options, proj
                );
            } else if (item.type === "shape") {
                const s = item.shapeOptions;
                const t = item.transformData;
                const c = s.colorVec4;

                if (s.type === "rectangle") {
                    this.shape.drawRect(
                        t.x, t.y, t.width, t.height, c, proj,
                        t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, s.opacity
                    );
                } else if (s.type === "rectStroke") {
                    this.shape.drawRectStroke(
                        t.x, t.y, t.width, t.height, c, s.thickness, proj,
                        t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, s.opacity
                    );
                } else if (s.type === "circle") {
                    const avgScale = (Math.abs(t.scaleX) + Math.abs(t.scaleY)) / 2;
                    const radius = (t.width / 2) * avgScale;
                    this.shape.drawCircle(t.x, t.y, radius, c, 32, proj);
                } else if (s.type === "line") {
                    this.shape.drawLine(t.x, t.y, s.x2, s.y2, c, s.thickness, proj);
                }
            } else if (item.type === "text") {
                const o = item.textOptions;
                const t = item.transformData;
                this.text.drawText(
                    o.font, o.text, t.x, t.y, t.width, t.height,
                    o.fontSize, o.colorVec4, proj,
                    t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, o.opacity
                );
            }
        }

        this.image.flush();
        this.shape.flush();
        this.text.flush();

        if (world.selectionRenderer && this.game.selection.active) {
            world.selectionRenderer(this.image, this.shape, this.text, proj);
        }
    }

    _findEntityById(world, id) {
        for (const layer of world.layers) {
            for (const entity of layer.entities) {
                if (entity.id === id) return entity;
            }
        }
        return null;
    }

    _processEntity(e, layerIndex, world) {
        if (!e.visible) return;

        const comps = e.components;
        if (!comps) return;

        const t = comps.Transform;
        const entityOpacity = e.opacity ?? 1;

        const spriteComp = comps.SpriteRenderer;
        if (spriteComp) {
            const texture = world.assets.textures[spriteComp.assetId];
            const finalAlpha = (spriteComp.opacity ?? 1) * entityOpacity;

            if (finalAlpha > 0) {
                const frame = spriteComp.source || { x: 0, y: 0, w: 0, h: 0 };
                this.renderQueue.push({
                    type: "image",
                    layerIndex,
                    texture,
                    frame,
                    transformData: {
                        x: t.x, y: t.y, width: t.width, height: t.height,
                        rotation: t.rotation, scaleX: t.scaleX, scaleY: t.scaleY,
                        pivotX: t.pivotX, pivotY: t.pivotY
                    },
                    options: {
                        flipX: spriteComp.flipX || false,
                        flipY: spriteComp.flipY || false,
                        opacity: finalAlpha
                    }
                });
            }
        }

        const shapeComp = comps.ShapeRenderer;
        if (shapeComp) {
            const finalAlpha = (shapeComp.opacity ?? 1) * entityOpacity;
            if (finalAlpha > 0) {
                this.renderQueue.push({
                    type: "shape",
                    layerIndex,
                    transformData: {
                        x: t.x, y: t.y, width: t.width, height: t.height,
                        rotation: t.rotation, scaleX: t.scaleX, scaleY: t.scaleY,
                        pivotX: t.pivotX, pivotY: t.pivotY
                    },
                    shapeOptions: {
                        type: shapeComp.type || "rectangle",
                        colorVec4: HexToVec4(shapeComp.color || "#FFFFFF"),
                        opacity: finalAlpha,
                        thickness: shapeComp.thickness || 1,
                        x2: shapeComp.x2 ?? (t.x + t.width),
                        y2: shapeComp.y2 ?? (t.y + t.height)
                    }
                });
            }
        }

        const textComp = comps.TextRenderer;
        if (textComp) {
            let font = world.assets.fonts[textComp.assetId];
            if (!font || !font.ready || !font.glTexture) {
                font = world.assets.fonts["system_default"];
            }

            if (font && font.glTexture) {
                const finalAlpha = (textComp.opacity ?? 1) * entityOpacity;
                if (finalAlpha > 0) {
                    this.renderQueue.push({
                        type: "text",
                        layerIndex,
                        transformData: {
                            x: t.x, y: t.y, width: t.width, height: t.height,
                            rotation: t.rotation, scaleX: t.scaleX, scaleY: t.scaleY,
                            pivotX: t.pivotX, pivotY: t.pivotY
                        },
                        textOptions: {
                            text: textComp.value ?? "",
                            fontSize: textComp.fontSize || 24,
                            colorVec4: HexToVec4(textComp.color || "#FFFFFF"),
                            opacity: finalAlpha,
                            font
                        }
                    });
                }
            }
        }

        if (e.children && e.children.length > 0) {
            for (const child of e.children) {
                this._processEntity(child, layerIndex, world);
            }
        }
    }
}
