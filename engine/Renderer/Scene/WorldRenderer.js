import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class WorldRenderer {
    constructor(image, text, shape, game, tilemapRenderer) {
        this.game = game;
        // Grouping renderer agar code lebih rapi
        this.renderer = { image, text, shape }; 
        this.tilemapRenderer = tilemapRenderer;
        
        // Antrian render
        this.renderQueue = [];
    }

    render(world, proj) {
        const { activeTabId, tabs } = world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        const isIsolationMode = (activeTab?.type === "tilemap");
        
        // 1. Render Grid (Background) - Selalu paling awal
        if (world.gridRenderer && !isIsolationMode) {
            this._flushAll();
            world.gridRenderer(this.renderer.shape, proj);
            this.renderer.shape.flush();
        }

        // 2. Reset Queue
        this.renderQueue.length = 0;

        // 3. PENGUMPULAN DATA (Strict Traversal / Painter's Algorithm)
        // Kita percaya bahwa SyncComponent sudah menyusun Array dengan benar.
        // Jadi kita hanya perlu loop dan gambar sesuai urutan. Tanpa Sorting.
        this._collectRenderables(world, activeTabId, isIsolationMode, proj);

        // 4. EKSEKUSI RENDER QUEUE
        this._executeRenderQueue(proj);

        // 5. Render Selection Overlay (Foreground) - Selalu paling atas
        if (!isIsolationMode && world.selectionRenderer && this.game.selection.active) {
            this._flushAll(); 
            world.selectionRenderer(this.renderer.image, this.renderer.shape, this.renderer.text, proj);
        }
    }

    // --- Core Logic Helpers ---

    _collectRenderables(world, activeTabId, isIsolationMode, proj) {
        // Loop Layer (Bawah ke Atas)
        for (let li = 0; li < world.layers.length; li++) {
            const layer = world.layers[li];
            if (!layer.visible) continue;

            // Loop Entity sesuai urutan Array (WYSIWYG dari Frontend)
            for (const e of layer.entities) {
                if (isIsolationMode && e.id !== activeTabId) continue;
                
                // Hanya proses root entity, children akan diproses rekursif
                if (!e.parentId) {
                    this._processEntityRecursive(e, world, proj);
                }
            }
        }
    }

    _processEntityRecursive(e, world, proj) {
        if (!e.visible) return;

        const comps = e.components;
        if (!comps) return;

        // Special Case: Tilemap (Direct Render)
        // Flush antrian sebelumnya agar tilemap berada di tumpukan yang benar
        if (comps.Tilemap && this.tilemapRenderer) {
            this._executeRenderQueue(proj); // Render antrian sebelumnya
            this.renderQueue.length = 0;    // Reset queue
            
            this.tilemapRenderer.renderEntity(e, world, proj);
            return;
        }

        // --- PREPARE DATA ---
        const t = comps.Transform;
        const opacity = e.opacity ?? 1;

        // Helper Data Transform
        const trans = {
            x: t.x, y: t.y, width: t.width, height: t.height,
            rotation: t.rotation, scaleX: t.scaleX, scaleY: t.scaleY,
            pivotX: t.pivotX, pivotY: t.pivotY
        };

        // --- PUSH TO QUEUE (Sesuai urutan kedatangan) ---
        
        // 1. Image Component
        if (comps.SpriteRenderer) {
            const s = comps.SpriteRenderer;
            const alpha = (s.opacity ?? 1) * opacity;
            if (alpha > 0) {
                this.renderQueue.push({
                    type: "image",
                    texture: world.assets.textures[s.assetId],
                    frame: s.source || { x: 0, y: 0, w: 0, h: 0 },
                    transformData: trans,
                    options: { flipX: s.flipX, flipY: s.flipY, opacity: alpha }
                });
            }
        }

        // 2. Shape Component
        if (comps.ShapeRenderer) {
            const s = comps.ShapeRenderer;
            const alpha = (s.opacity ?? 1) * opacity;
            if (alpha > 0) {
                this.renderQueue.push({
                    type: "shape",
                    transformData: trans,
                    shapeOptions: {
                        type: s.type || "rectangle",
                        color: HexToVec4(s.color || "#FFFFFF"),
                        thickness: s.thickness || 1,
                        x2: s.x2 ?? (t.x + t.width), y2: s.y2 ?? (t.y + t.height),
                        opacity: alpha
                    }
                });
            }
        }

        // 3. Text Component
        if (comps.TextRenderer) {
            const tx = comps.TextRenderer;
            const alpha = (tx.opacity ?? 1) * opacity;
            let font = world.assets.fonts[tx.assetId];
            if (!font?.ready) font = world.assets.fonts["system_default"];

            if (alpha > 0 && font) {
                this.renderQueue.push({
                    type: "text",
                    transformData: trans,
                    textOptions: {
                        text: tx.value ?? "", fontSize: tx.fontSize || 24,
                        color: HexToVec4(tx.color || "#FFFFFF"),
                        font, opacity: alpha
                    }
                });
            }
        }

        // --- RECURSION (CHILDREN) ---
        // Anak digambar setelah (di atas) orang tua
        if (e.children && e.children.length > 0) {
            for (const child of e.children) {
                this._processEntityRecursive(child, world, proj);
            }
        }
    }

    _executeRenderQueue(proj) {
        if (this.renderQueue.length === 0) return;

        let currentType = null;

        for (const item of this.renderQueue) {
            // Smart Batching: Flush jika tipe renderer berubah
            if (currentType && currentType !== item.type) {
                this.renderer[currentType].flush();
            }
            currentType = item.type;

            // Execute Draw
            if (item.type === "image") {
                this.renderer.image.draw(item.texture, item.frame, item.transformData, item.options, proj);
            } 
            else if (item.type === "shape") {
                this._drawShape(item.shapeOptions, item.transformData, proj);
            } 
            else if (item.type === "text") {
                const { text, font, fontSize, color, opacity } = item.textOptions;
                const t = item.transformData;
                this.renderer.text.drawText(
                    font, text, t.x, t.y, t.width, t.height, fontSize, color, proj,
                    t.rotation, t.scaleX, t.scaleY, t.pivotX, t.pivotY, opacity
                );
            }
        }

        // Flush sisa terakhir
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