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
        this.dragStartPosition = { x: 0, y: 0 };
        
        this.marqueeActive = false;
        this.marqueeStart = { x: 0, y: 0 };
        this.marqueeEnd = { x: 0, y: 0 };

        this.hoverHandle = null;

        this.onExternalSelect = (list) => { this.syncSelectionFromBus(list); };
        this.onEditorSelect = (ids) => { this.handleEditorSelect(ids); }; 
        this.onPrefabSelect = () => { this.setSelection([], "prefab"); };

        bus.on("entity:selected", this.onExternalSelect);
        bus.on("prefab:selected", this.onPrefabSelect);
        bus.on("entity:deselected", () => { this.setSelection([], "deselect"); });

        world.selectionRenderer = (image, shape, text, proj) => {
            if (!this.active) return;
            const { activeTabId, tabs } = this.world._editors || {};
            const activeTab = tabs?.find(t => t.id === activeTabId);
            if (activeTab?.type === 'tilemap') return;

            const marqueeBox = this.marqueeActive ? this.getMarqueeWorld() : null;
            
            if(this.marqueeActive && this.hoverMarqueeList.length > 0) {
                 const c = [0, 0.55, 1, 0.5];
                 for(const e of this.hoverMarqueeList) {
                      if(this._isClickable(e)) {
                          this.drawer.drawObb(shape, e, c, proj);
                      }
                 }
            }

            const drawableSelection = this.selectedList;
            const drawableHover = (this.hovered && this._isClickable(this.hovered)) ? this.hovered : null;

            this.drawer.draw(shape, proj, drawableSelection, drawableHover, marqueeBox, this.transform);

            if (this.transform && this.selectedList.length > 0) {
                this.transform.draw(shape, proj);
            }
        };
    }

    clear() {
        this.setSelection([], "internal");
        bus.emit("entity:deselected");
    }

    _isClickable(e) {
        if (!e) return false;
        if (e.type === 'layer' || !e.components) return false; 
        
        if (e.active === false || e.visible === false) return false;
        if (e.locked || (e._editor && e._editor.locked)) return false;
        return true;
    }

    _findEntityInWorld(id) {
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (layer.entities) {
                const found = layer.entities.find(e => String(e.id || e._id) === String(id));
                if (found) return found;
            }
        }
        return null;
    }

    _getRootParent(entity) {
        let current = entity;
        while (current && current.parentId) {
            const parent = this._findEntityInWorld(current.parentId);
            if (parent) {
                current = parent;
            } else {
                break;
            }
        }
        return current;
    }

    _getAllDescendants(parentId) {
        let descendants = [];
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        for (const layer of allLayers) {
            if (!layer.entities) continue;
            const children = layer.entities.filter(e => e.parentId === parentId);
            for (const child of children) {
                descendants.push(child);
                descendants = descendants.concat(this._getAllDescendants(child._id || child.id));
            }
        }
        return descendants;
    }

    setSelection(newList, source = "internal") {
        this.selectedList = [...new Set(newList)];
        if (this.transform) {
            this.transform.computeHandles();
        }
        if (source === "internal") {
            bus.emit("entity:selected", this.selectedList);
        }
    }
    
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
        bus.off("prefab:selected", this.onPrefabSelect);
    }

    attachTransform(t) {
        this.transform = t;
    }
    
    syncSelectionFromBus(externalList) {
        if (!externalList) externalList = [];
        if (externalList === this.selectedList) return;
        this.selectedList = externalList;
        if (this.transform) this.transform.computeHandles();
    }

    handleEditorSelect(ids) {
        if (!ids || ids.length === 0) {
            this.setSelection([], "ui");
            bus.emit("entity:deselected");
            return;
        }

        const idsToFind = Array.isArray(ids) ? ids : [ids];
        const realEntities = [];
        const allLayers = [...(this.world.layersWorld || []), ...(this.world.layersUI || [])];
        
        for (const id of idsToFind) {
            const layerMatch = allLayers.find(l => String(l._id || l.id) === String(id));
            if (layerMatch) {
                realEntities.push(layerMatch);
                continue;
            }

            for (const layer of allLayers) {
                if (layer.entities) {
                    const entityMatch = layer.entities.find(e => String(e._id || e.id) === String(id));
                    if (entityMatch) {
                        realEntities.push(entityMatch);
                        break;
                    }
                }
            }
        }

        this.setSelection(realEntities, "internal");
    }

    consolidateSelection(candidates) {
        return [...new Set(candidates)];
    }

    _updateSelectionFilter() {
        const { activeTabId, tabs } = this.world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        
        const isUIMode = activeTab?.type === 'ui';
        const isSceneMode = activeTabId === 'scene' || !activeTabId;

        if (!this.game.selection) this.game.selection = {};

        this.game.selection.filter = (entity, layer) => {
            const layersUI = this.world.layersUI || [];
            const isUILayer = layersUI.includes(layer);

            if (isUIMode) return isUILayer; 
            if (isSceneMode) return true; 
            return true; 
        };
    }

    update() {
        if (!this.active) return;
        
        const { activeTabId, tabs } = this.world._editors || {};
        const activeTab = tabs?.find(t => t.id === activeTabId);
        if (activeTab && activeTab.type === 'tilemap') {
            if (this.selectedList.length > 0) this.clear();
            this.canvas.style.cursor = "default";
            return; 
        }

        this._updateSelectionFilter();
        if (this.transform) this.transform.update(); 

        const p = this.input.getPointer();
        const px = p.x;
        const py = p.y;
        const w = this.toWorld(px, py);

        this.updateHover(px, py, w);

        const isInputDown = p.down || p.rightDown;

        if (isInputDown && !this.isPointerDown) {
            this.isPointerDown = true;
            this.pointerDown(px, py, w, p.isTouch, p.rightDown);
        }

        if (!p.isTouch && p.down && !p.rightDown && this.marqueeActive) {
            this.marqueeEnd.x = w.x;
            this.marqueeEnd.y = w.y;
            const box = this.getMarqueeWorld();
            const rawMarquee = this.hitTester.checkMarquee(this.world, box);
            this.hoverMarqueeList = rawMarquee.filter(e => this._isClickable(e));
            this.panner.apply(px, py);
        }

        if (!isInputDown && this.isPointerDown) {
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

        let hit = this.hitTester.hit(this.world, w.x, w.y, px, py);
        
        const isCtrlDown = this.input.keyboard.isDown("Control") || this.input.keyboard.isDown("Meta");
        if (hit && !isCtrlDown) {
            hit = this._getRootParent(hit);
        }
        
        if (hit && this._isClickable(hit)) {
            const isSelected = this.selectedList.includes(hit);
            this.canvas.style.cursor = isSelected ? "move" : "pointer";
            this.hovered = hit;
        } else {
            this.hovered = null;
            this.canvas.style.cursor = "default";
        }
    }

    pointerDown(px, py, w, isTouch, isRightClick = false) {
        this.dragStartPosition = { x: px, y: py }; 

        const isCtrl = this.input.keyboard.isDown("Control") || this.input.keyboard.isDown("Meta");
        const isShift = this.input.keyboard.isDown("Shift");

        let hit = this.hitTester.hit(this.world, w.x, w.y, px, py);

        if (hit && !isCtrl) {
            hit = this._getRootParent(hit);
        }

        if (isRightClick) {
            if (hit && this._isClickable(hit)) {
                if (!this.selectedList.includes(hit)) {
                    const selectionGroup = [hit, ...this._getAllDescendants(hit._id || hit.id)];
                    this.setSelection(selectionGroup, "internal");
                }
            } else {
                this.setSelection([], "internal");
                bus.emit("entity:deselected");
            }
            return;
        }

        if (this.transform && this.hoverHandle) {
            this.transform.beginResize(this.hoverHandle, px, py);
            return;
        }

        if (hit && this._isClickable(hit)) {
            const alreadySelected = this.selectedList.includes(hit);
            const selectionGroup = [hit, ...this._getAllDescendants(hit._id || hit.id)];
            
            if (isShift) {
                let newList = alreadySelected 
                    ? this.selectedList.filter(a => !selectionGroup.includes(a))
                    : [...this.selectedList, ...selectionGroup];
                newList = this.consolidateSelection(newList);
                this.setSelection(newList, "internal");
            } 
            else {
                if (!alreadySelected) {
                    this.setSelection(selectionGroup, "internal");
                }
            }

            if (this.transform) {
                this.transform.beginMove(px, py, isTouch);
            }
            return;
        }

        if (!isTouch && (!hit || !this._isClickable(hit))) {
            this.panner.calculateInsets();
            this.marqueeActive = true;
            if (!isShift) {
                this.setSelection([], "internal"); 
                bus.emit("entity:deselected");
            }
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
            let results = [...this.hoverMarqueeList].filter(e => this._isClickable(e));
            
            const isCtrl = this.input.keyboard.isDown("Control") || this.input.keyboard.isDown("Meta");
            let finalResults = [];
            
            if (!isCtrl) {
                const rootParents = [...new Set(results.map(e => this._getRootParent(e)))];
                for (const root of rootParents) {
                    finalResults.push(root, ...this._getAllDescendants(root._id || root.id));
                }
            } else {
                finalResults = results;
            }

            const isShift = this.input.keyboard.isDown("Shift");
            if (isShift) {
                finalResults = [...this.selectedList, ...finalResults];
            }
            
            finalResults = this.consolidateSelection(finalResults);
            this.setSelection(finalResults, "internal");
            
            this.marqueeActive = false;
            this.hoverMarqueeList = [];
            return;
        }

        const start = this.dragStartPosition || { x: px, y: py };
        const dx = Math.abs(px - start.x);
        const dy = Math.abs(py - start.y);
        if (dx > 5 || dy > 5) return;

        const w = this.toWorld(px, py);
        let hit = this.hitTester.hit(this.world, w.x, w.y, px, py);
        
        const isShift = this.input.keyboard.isDown("Shift");
        
        if (!hit && !isShift && this.input.mouse.isDown(0)) { 
            this.setSelection([], "internal");
            bus.emit("entity:deselected");
        }
    }
}