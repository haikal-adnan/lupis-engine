import Config from "../Core/Config.js";
import { ApplyResizeToEntity } from "../Util/ApplyResizeToEntity.js";
import { bus } from "../Util/EventBus.js";
import { calculateQuadVertices } from "../Util/calculateQuadVertices.js";

export default class TransformTool {
    constructor(selectionTool, world, game, canvas, renderer, input) {
        this.selection = selectionTool;
        this.selection.attachTransform(this);

        this.world = world;
        this.game = game;
        this.canvas = canvas;
        this.renderer = renderer;
        this.input = input;

        this.active = Config.EDITOR.TRANSFORM;

        this.draggingMove = false;
        this.draggingResize = false;
        this.draggingRotate = false;
        
        this.resizeType = null;
        this.rotateStartAngle = 0; 
        this.entityStartRotation = 0; 

        this.handles = [];
        this.startWorld = { x: 0, y: 0 };
        this.moveStartData = null;

        this.groupBounds = null; 
        this.resizeEntityStarts = null;
        this.initialState = [];
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    _cleanComponents(c) { return JSON.parse(JSON.stringify(c)); }

    _createSnapshot() {
        return this.selection.selectedList.map(e => {
            const t = e.transform;
            return {
                _id: e._id, version: e.version, 
                // Flatten data transform untuk snapshot
                x: t.x, y: t.y, rotation: t.rotation, 
                scaleX: t.scaleX, scaleY: t.scaleY, 
                pivotX: t.pivotX, pivotY: t.pivotY,
                zIndex: t.zIndex,
                // Data root
                width: e.width, height: e.height,
                opacity: e.opacity ?? 100, visible: e.visible ?? true, tag: e.tag,
                components: this._cleanComponents(e.components)
            };
        });
    }

    _applyState(list) {
        const world = this.world;
        const affected = [];
        list.forEach(s => {
            let ent = null;
            for(const [lid, ents] of world.layers) {
                const f = ents.find(e => e._id === s._id);
                if(f) { ent = f; break; }
            }
            if(ent) {
                const t = ent.transform;
                t.x = s.x; t.y = s.y; 
                t.rotation = s.rotation; t.scaleX = s.scaleX; t.scaleY = s.scaleY;
                t.pivotX = s.pivotX; t.pivotY = s.pivotY;
                t.zIndex = s.zIndex;

                ent.width = s.width; ent.height = s.height;
                ent.opacity = s.opacity; ent.visible = s.visible;
                ent.tag = s.tag;
                ent.components = s.components;
                
                ApplyResizeToEntity(ent, world);
                affected.push(ent);
            }
        });
        if(affected.length) {
            this.selection.selectedList = affected;
            bus.emit("entity:modified", list);
        }
    }

    _mid(p1, p2) {
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    computeHandles() {
        const list = this.selection.selectedList;
        if (!list.length) return;

        if (list.length === 1) {
            const e = list[0];
            const t = e.transform;
            const r = t.rotation || 0;
            const sx = t.scaleX ?? 1;
            const sy = t.scaleY ?? 1;
            const px = t.pivotX ?? 0.5;
            const py = t.pivotY ?? 0.5;

            const v = calculateQuadVertices(t.x, t.y, e.width, e.height, r, sx, sy, px, py);

            const nw = { type: "nw", x: v.tl.x, y: v.tl.y };
            const ne = { type: "ne", x: v.tr.x, y: v.tr.y };
            const sw = { type: "sw", x: v.bl.x, y: v.bl.y };
            const se = { type: "se", x: v.br.x, y: v.br.y };

            const n = { type: "n", ...this._mid(nw, ne) };
            const e_side = { type: "e", ...this._mid(ne, se) };
            const s = { type: "s", ...this._mid(sw, se) };
            const w = { type: "w", ...this._mid(nw, sw) };

            this.handles = [nw, ne, sw, se, n, e_side, s, w];
            this.activeRotation = r; 
            
            this.groupBounds = { type: 'obb', v }; 
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const e of list) {
            const b = this.selection.getAABB(e);
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.w > maxX) maxX = b.x + b.w;
            if (b.y + b.h > maxY) maxY = b.y + b.h;
        }

        this.groupBounds = { type: 'aabb', x: minX, y: minY, w: maxX - minX, h: maxY - minY };
        
        const nw = { type: "nw", x: minX, y: minY };
        const ne = { type: "ne", x: maxX, y: minY };
        const sw = { type: "sw", x: minX, y: maxY };
        const se = { type: "se", x: maxX, y: maxY };
        
        const n = { type: "n", ...this._mid(nw, ne) };
        const e_side = { type: "e", ...this._mid(ne, se) };
        const s = { type: "s", ...this._mid(sw, se) };
        const w = { type: "w", ...this._mid(nw, sw) };

        this.handles = [nw, ne, sw, se, n, e_side, s, w];
        this.activeRotation = 0; 
    }
    
    computeGroupBounds() {
        this.computeHandles();
        if (this.groupBounds?.type === 'aabb') return this.groupBounds;
        if (this.groupBounds?.type === 'obb') {
            const v = this.groupBounds.v;
            const xs = [v.tl.x, v.tr.x, v.bl.x, v.br.x];
            const ys = [v.tl.y, v.tr.y, v.bl.y, v.br.y];
            return {
                x: Math.min(...xs), y: Math.min(...ys),
                w: Math.max(...xs) - Math.min(...xs),
                h: Math.max(...ys) - Math.min(...ys)
            };
        }
        return null;
    }

    getHoverHandle(px, py) {
        const p = this.toWorld(px, py);
        const scale = this.game.camera.scale;
        
        const resizeRadius = 10 / scale;
        const rotateRadius = 25 / scale;

        for (const h of this.handles) {
            const dx = p.x - h.x;
            const dy = p.y - h.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist <= resizeRadius) {
                return { ...h, mode: 'resize' };
            }
            if (h.type.length === 2 && dist <= rotateRadius) {
                return { ...h, mode: 'rotate' };
            }
        }
        return null;
    }

    getCursor(handle) {
        if (handle.mode === 'rotate') {
            return "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\" style=\"fill:white; stroke:black; stroke-width:1px; font-size:24px;\"><text x=\"50%\" y=\"55%\" dominant-baseline=\"middle\" text-anchor=\"middle\">↻</text></svg>') 16 16, alias"; 
        }

        const map = {
            nw: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", se: "nwse-resize",
            n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize"
        };
        return map[handle.type];
    }

    beginMove(px, py, isTouch) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.initialState = this._createSnapshot();
        if (this.selection.calculateViewportInsets) this.selection.calculateViewportInsets();

        const p = this.toWorld(px, py);
        this.draggingMove = true;
        this.draggingResize = false;
        this.draggingRotate = false;
        this.startWorld = p;

        this.moveStartData = list.map(e => ({
            e,
            x: e.transform.x, // Read from transform
            y: e.transform.y
        }));
    }

    beginResize(handle, px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.initialState = this._createSnapshot();
        if (this.selection.calculateViewportInsets) this.selection.calculateViewportInsets();

        const p = this.toWorld(px, py);
        
        if (handle.mode === 'rotate') {
            this.draggingRotate = true;
            this.draggingResize = false;
            this.draggingMove = false;
            
            const e = list[0];
            const t = e.transform;
            
            this.rotateCenter = { x: t.x, y: t.y };
            this.rotateStartAngle = Math.atan2(p.y - t.y, p.x - t.x);
            this.entityStartRotation = t.rotation || 0;

        } else {
            this.draggingResize = true;
            this.draggingRotate = false;
            this.draggingMove = false;
            this.resizeType = handle.type;
            this.startWorld = p;

            this.resizeEntityStarts = list.map(e => {
                const t = e.transform;
                return {
                    e,
                    x: t.x, y: t.y, w: e.width, h: e.height,
                    r: t.rotation || 0, sx: t.scaleX ?? 1, sy: t.scaleY ?? 1
                };
            });
        }
    }

// Ganti method resetDrag() dengan ini:

    resetDrag() {
        const wasInteracting = this.draggingMove || this.draggingResize || this.draggingRotate;
        
        this.draggingMove = false;
        this.draggingResize = false;
        this.draggingRotate = false;
        this.resizeType = null;
        this.computeHandles();

        if (this.selection.autoPanVel) {
            this.selection.autoPanVel.x = 0;
            this.selection.autoPanVel.y = 0;
        }

        if (wasInteracting) {
            const finalState = this._createSnapshot();
            const startState = this.initialState;
            
            // Simpan ke history (Undo/Redo)
            const command = {
                name: "Transform Entity",
                undo: () => this._applyState(startState),
                redo: () => this._applyState(finalState)
            };
            if (this.game.history) this.game.history.push(command);
            
            // PERBAIKAN: Kirim Entity Asli (this.selection.selectedList)
            // Agar SyncEntity menerima objek dengan properti lengkap (.transform, dll)
            if (this.selection.selectedList.length > 0) {
                bus.emit("entity:modified", this.selection.selectedList);
            }
        }
    }

    update() {
        if (!this.active) return;
        const list = this.selection.selectedList;
        if (!list.length) return;

        const p = this.input.getPointer();
        
        if (this.draggingMove) this.move(p.x, p.y);
        if (this.draggingResize) this.resize(p.x, p.y);
        if (this.draggingRotate) this.rotate(p.x, p.y);
        
        if (this.selection.updateAutoPan) this.selection.updateAutoPan();
        if (!p.down) this.resetDrag();
    }

    move(px, py) {
        if (!this.moveStartData) return;
        if (this.selection.applyPointerAutoPan) this.selection.applyPointerAutoPan(px, py);

        const n = this.toWorld(px, py);
        const dx = n.x - this.startWorld.x;
        const dy = n.y - this.startWorld.y;

        if (dx === 0 && dy === 0) return;

        for (const item of this.moveStartData) {
            item.e.transform.x = item.x + dx; // Write to transform
            item.e.transform.y = item.y + dy;
        }
        bus.emit("entity:modified", this.selection.selectedList, true); 
    }

    resize(px, py) {
        if (!this.resizeType) return;

        const list = this.selection.selectedList;
        if (!list.length) return;
        if (this.selection.applyPointerAutoPan) this.selection.applyPointerAutoPan(px, py);

        const now = this.toWorld(px, py);
        const dx = now.x - this.startWorld.x;
        const dy = now.y - this.startWorld.y;

        if (dx === 0 && dy === 0) return;

        if (list.length === 1) {
            const item = this.resizeEntityStarts[0];
            const e = item.e;

            const c = Math.cos(-item.r);
            const s = Math.sin(-item.r);
            const localDx = dx * c - dy * s;
            const localDy = dx * s + dy * c;

            const signX = item.sx < 0 ? -1 : 1;
            const signY = item.sy < 0 ? -1 : 1;

            const dX_Adjusted = localDx * signX;
            const dY_Adjusted = localDy * signY;

            let dW = 0;
            let dH = 0;
            
            let anchorX = null; 
            let anchorY = null;

            if (this.resizeType.length === 2) {
                if (this.resizeType.includes('w')) { dW = -dX_Adjusted; anchorX = item.sx > 0 ? 1 : 0; }
                if (this.resizeType.includes('e')) { dW = dX_Adjusted;  anchorX = item.sx > 0 ? 0 : 1; }
                if (this.resizeType.includes('n')) { dH = -dY_Adjusted; anchorY = item.sy > 0 ? 1 : 0; }
                if (this.resizeType.includes('s')) { dH = dY_Adjusted;  anchorY = item.sy > 0 ? 0 : 1; }
            } 
            else {
                if (this.resizeType === 'w') { dW = -dX_Adjusted; anchorX = item.sx > 0 ? 1 : 0; }
                if (this.resizeType === 'e') { dW = dX_Adjusted;  anchorX = item.sx > 0 ? 0 : 1; }
                if (this.resizeType === 'n') { dH = -dY_Adjusted; anchorY = item.sy > 0 ? 1 : 0; }
                if (this.resizeType === 's') { dH = dY_Adjusted;  anchorY = item.sy > 0 ? 0 : 1; }
            }

            let newW = Math.max(1, item.w + dW);
            let newH = Math.max(1, item.h + dH);

            e.width = newW;
            e.height = newH;

            let shiftX = 0;
            let shiftY = 0;

            if (anchorX !== null) {
                const ratioX = (e.transform.pivotX ?? 0.5) - anchorX;
                shiftX = dW * ratioX; 
            }
            
            if (anchorY !== null) {
                const ratioY = (e.transform.pivotY ?? 0.5) - anchorY;
                shiftY = dH * ratioY;
            }

            const wc = Math.cos(item.r);
            const ws = Math.sin(item.r);

            e.transform.x = item.x + (shiftX * wc - shiftY * ws);
            e.transform.y = item.y + (shiftX * ws + shiftY * wc);
            
            ApplyResizeToEntity(e, this.world);
        } 
        
        bus.emit("entity:modified", this.selection.selectedList, true);
    }

    rotate(px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        const p = this.toWorld(px, py);
        const e = list[0];

        const currentAngle = Math.atan2(p.y - this.rotateCenter.y, p.x - this.rotateCenter.x);
        let deltaAngle = currentAngle - this.rotateStartAngle;
        let newRotation = this.entityStartRotation + deltaAngle;

        if (this.input.keyboard.shift) {
            const deg = newRotation * (180 / Math.PI);
            const snap = Math.round(deg / 15) * 15;
            newRotation = snap * (Math.PI / 180);
        }

        e.transform.rotation = newRotation;

        bus.emit("entity:modified", list, true);
    }

    draw(shape, proj) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.computeHandles();
        
        const scale = this.game.camera.scale;
        
        const rCorner = 5 / scale; 
        const t = 2 / scale;
        const c = this.selection.outlineColor;
        
        // --- DRAW BOX ---
        const b = this.groupBounds;
        if (b) {
            if (b.type === 'obb') {
                const v = b.v;
                shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, c, t, proj);
                shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, c, t, proj);
                shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, c, t, proj);
                shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, c, t, proj);
            } else {
                // AABB (Multi Select)
                shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
                shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
                shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
                shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
            }
        }

        // --- DRAW HANDLES ---
        const capLen = 24 / scale; 
        const capThick = 6 / scale;
        const rot = this.activeRotation || 0;

        for (const h of this.handles) {
            if (h.type.length === 2) {
                shape.drawCircle(h.x, h.y, rCorner, [1, 1, 1, 1], 12, proj);
                shape.drawCircleOutline(h.x, h.y, rCorner, [0, 0, 0, 1], t, 16, proj);
            } 
            else {
                let w = 0, h_dim = 0;
                if (h.type === 'n' || h.type === 's') { w = capLen; h_dim = capThick; } 
                else { w = capThick; h_dim = capLen; }

                shape.drawRect(h.x, h.y, w, h_dim, [1,1,1,1], proj, rot, 1, 1, 0.5, 0.5);
                shape.drawRectStroke(h.x, h.y, w, h_dim, [0,0,0,1], t, proj, rot, 1, 1, 0.5, 0.5);
            }
        }
    }
}