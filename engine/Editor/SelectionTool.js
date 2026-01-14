import Config from "../Core/Config.js";
import { bus } from "../Util/EventBus.js";
import { HitTester } from "./Selection/HitTester.js";
import { SelectionRenderer } from "./Selection/SelectionRenderer.js";
import { AutoPanner } from "./Selection/AutoPanner.js";

export default class SelectionTool {
    constructor(world, game, canvas, renderer, input) {
        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = input;

        this.active = Config.EDITOR.SELECTION;

        this.hitTester = new HitTester(game);
        this.drawer = new SelectionRenderer(game);
        this.panner = new AutoPanner(game, canvas);

        this.hovered = null;
        this.hoverMarqueeList = [];
        this.selectedList = [];

        this.isPointerDown = false;
        this.marqueeActive = false;
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEnd = { x: 0, y: 0 };

        this.hoverHandle = null;
        this.pointerDownTime = 0;
        this.isLongPress = false;
        this.LONG_PRESS_TIME = 30;

        // Event Handlers
        this.onExternalSelect = (list) => { this.syncSelectionFromBus(list); };
        this.onUISelect = (ids) => { this.handleUISelect(ids); };
        this.onPrefabSelect = () => {
            this.selectedList = [];
            this.hovered = null;
        };

        bus.on("entity:selected", this.onExternalSelect);
        bus.on("ui:select-by-id", this.onUISelect);
        bus.on("prefab:selected", this.onPrefabSelect);
        bus.on("entity:deselected", () => {
            this.selectedList = [];
        });

        // Register Renderer
        world.selectionRenderer = (image, shape, text, proj) => {
            // Jika tool dimatikan (misal saat mode Tilemap), jangan render apapun
            if (!this.active) return;

            const marqueeBox = this.marqueeActive ? this.getMarqueeWorld() : null;
            
            // Draw hover marquee
            if(this.marqueeActive && this.hoverMarqueeList.length > 0) {
                 const c = [0, 0.55, 1, 0.5];
                 for(const e of this.hoverMarqueeList) {
                      if(e.type !== 'group') this.drawer.drawObb(shape, e, c, proj);
                 }
            }

            this.drawer.draw(shape, proj, this.selectedList, this.hovered, marqueeBox, this.transform);
        };
    }

    // [HAPUS] Method _isTilemapMode dihapus total.

    toWorld(px, py) {
        const c = this.game.camera;
        const s = c.scale || 1;
        const W = this.canvas.width;
        const H = this.canvas.height;
        return {
            x: c.x + (px - W * 0.5) / s,
            y: c.y + (py - H * 0.5) / s
        };
    }

    getMarqueeWorld() {
        const x1 = Math.min(this.marqueeStart.x, this.marqueeEnd.x);
        const y1 = Math.min(this.marqueeStart.y, this.marqueeEnd.y);
        const x2 = Math.max(this.marqueeStart.x, this.marqueeEnd.x);
        const y2 = Math.max(this.marqueeStart.y, this.marqueeEnd.y);
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }

    destroy() {
        bus.off("entity:selected", this.onExternalSelect);
        bus.off("ui:select-by-id", this.onUISelect);
        bus.off("prefab:selected", this.onPrefabSelect);
    }

    attachTransform(t) {
        this.transform = t;
    }

    syncSelectionFromBus(externalList) {
        if (!externalList || externalList.length === 0) {
            this.selectedList = [];
            return;
        }
        if (externalList === this.selectedList) return;
        this.selectedList = externalList;
    }

    handleUISelect(ids) {
        if (!ids || ids.length === 0) {
            this.selectedList = [];
            bus.emit("entity:deselected");
            return;
        }

        const realEntities = [];
        const idsToFind = Array.isArray(ids) ? ids : [ids];

        // Helper recursive pencari entity
        const findRecursive = (id, entities) => {
            for (const e of entities) {
                if ((e._id || e.id) === id) return e;
                if (e.children && e.children.length > 0) {
                    const found = findRecursive(id, e.children);
                    if (found) return found;
                }
            }
            return null;
        };

        for (const id of idsToFind) {
            let found = null;
            for (const layer of this.world.layers) {
                if (layer.entities) {
                    found = findRecursive(id, layer.entities);
                    if (found) break;
                }
            }
            if (found) realEntities.push(found);
        }

        if (realEntities.length > 0) {
            this.selectedList = realEntities;
            bus.emit("entity:selected", this.selectedList);
        }
    }

    consolidateSelection(candidates) {
        if (!candidates || candidates.length <= 1) return candidates;

        const finalSet = new Set(candidates);
        let changed = true;
        let safeCounter = 0;

        while (changed && safeCounter < 10) {
            changed = false;
            safeCounter++;

            const parentMap = new Map();

            for (const e of finalSet) {
                if (e.parentId) {
                    if (!parentMap.has(e.parentId)) parentMap.set(e.parentId, []);
                    parentMap.get(e.parentId).push(e);
                }
            }

            for (const [parentId, childrenInSelection] of parentMap.entries()) {
                let parentEntity = null;
                const findRecursive = (id, list) => {
                    for (const e of list) {
                        if ((e.id || e._id) === id) return e;
                        if (e.children) {
                            const f = findRecursive(id, e.children);
                            if (f) return f;
                        }
                    }
                    return null;
                };

                for (const l of this.world.layers) {
                    if (l.entities) {
                        parentEntity = findRecursive(parentId, l.entities);
                        if (parentEntity) break;
                    }
                }

                if (parentEntity && parentEntity.children) {
                    if (childrenInSelection.length === parentEntity.children.length) {
                        childrenInSelection.forEach(child => finalSet.delete(child));
                        finalSet.add(parentEntity);
                        changed = true;
                    }
                }
            }
        }

        return Array.from(finalSet);
    }

    isInsideGroup(wx, wy) {
        if (this.selectedList.length <= 1) return false;
        const box = this.transform ? this.transform.computeGroupBounds() : null;
        if (!box) return false;
        return wx >= box.x && wx <= box.x + box.w && wy >= box.y && wy <= box.y + box.h;
    }

    update() {
        // 1. MASTER SWITCH
        // Jika active false (diset oleh WorldRenderer saat mode Tilemap),
        // maka seluruh logic selection berhenti total.
        if (!this.active) return;

        // [HAPUS] Blok logic `if (this._isTilemapMode())` dihapus.

        if (this.transform) {
            this.transform.update(); 
        }

        const p = this.input.getPointer();
        const px = p.x;
        const py = p.y;
        const w = this.toWorld(px, py);

        this.updateHover(px, py, w);

        if (p.down && !this.isPointerDown) {
            this.pointerDownTime = performance.now();
            this.isLongPress = false;
            this.pointerDown(px, py, w, p.isTouch);
            this.isPointerDown = true;
        }

        const isDraggingResize =
            this.transform &&
            (this.transform.draggingResize ||
                this.transform.draggingMove ||
                this.transform.draggingRotate);

        if (p.down && this.isPointerDown && !this.isLongPress && !isDraggingResize) {
            if (performance.now() - this.pointerDownTime >= this.LONG_PRESS_TIME) {
                this.isLongPress = true;

                if (this.selectedList.length > 1 && this.isInsideGroup(w.x, w.y)) {
                    if (this.transform) this.transform.beginMove(px, py, false);
                } else {
                    const hit = this.hitTester.hit(this.world, w.x, w.y);
                    if (hit && this.transform) {
                        if (!this.selectedList.includes(hit)) {
                            this.selectedList = [hit];
                            bus.emit("entity:selected", this.selectedList);
                        }
                        this.transform.beginMove(px, py, false);
                    }
                }
            }
        }

        if (!p.isTouch && p.down && this.marqueeActive) {
            this.marqueeEnd.x = w.x;
            this.marqueeEnd.y = w.y;
            
            const box = this.getMarqueeWorld();
            this.hoverMarqueeList = this.hitTester.checkMarquee(this.world, box);
            
            this.panner.apply(px, py);
        }

        if (!p.down && this.isPointerDown) {
            this.pointerUp(px, py);
            this.isPointerDown = false;
        }

        this.panner.update();
    }

    updateHover(px, py, w) {
        this.hoverHandle = null;
        if (this.isPointerDown) return;

        if (this.transform && this.selectedList.length > 0) {
            this.transform.computeHandles();
            this.hoverHandle = this.transform.getHoverHandle(px, py);
            if (this.hoverHandle) {
                this.canvas.style.cursor = this.transform.getCursor(this.hoverHandle);
                this.hovered = null;
                return;
            }
        }

        if (this.selectedList.length > 1 && this.isInsideGroup(w.x, w.y)) {
            this.canvas.style.cursor = "move";
            this.hovered = null;
            return;
        }

        this.hovered = this.hitTester.hit(this.world, w.x, w.y);

        if (this.hovered) {
            const isSelected = this.selectedList.includes(this.hovered);
            this.canvas.style.cursor = isSelected ? "move" : "pointer";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    pointerDown(px, py, w, isTouch) {
        if (this.transform && this.hoverHandle) {
            this.transform.beginResize(this.hoverHandle, px, py);
            return;
        }

        const ctrl =
            this.input.keyboard.ctrl ||
            this.input.keyboard.shift ||
            this.input.keyboard.meta;

        const hit = this.hitTester.hit(this.world, w.x, w.y);

        if (hit) {
            const inside = this.selectedList.includes(hit);

            if (ctrl) {
                let newList = inside
                    ? this.selectedList.filter(a => a !== hit)
                    : [...this.selectedList, hit];

                newList = this.consolidateSelection(newList);
                this.selectedList = newList;
            } else {
                if (!inside) {
                    this.selectedList = [hit];
                }
            }

            bus.emit("entity:selected", this.selectedList);
            return;
        }

        if (!isTouch && !hit) {
            this.panner.calculateInsets();
            this.marqueeActive = true;
            this.selectedList = [];
            bus.emit("entity:deselected");

            this.marqueeStart.x = w.x;
            this.marqueeStart.y = w.y;
            this.marqueeEnd.x = w.x;
            this.marqueeEnd.y = w.y;

            this.hoverMarqueeList = [];
        }
    }

    pointerUp(px, py) {
        if (this.transform) this.transform.resetDrag();

        if (this.marqueeActive) {
            let results = [...this.hoverMarqueeList];
            results = this.consolidateSelection(results);
            this.selectedList = results;
            bus.emit("entity:selected", this.selectedList);
            this.marqueeActive = false;
            this.hoverMarqueeList = [];
            return;
        }

        if (!this.isLongPress && !this.marqueeActive) {
            const w = this.toWorld(px, py);
            if (!this.hitTester.hit(this.world, w.x, w.y)) {
                this.selectedList = [];
                bus.emit("entity:deselected");
            }
        }
    }
}