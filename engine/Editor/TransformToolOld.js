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
        
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
    }

    _getTransform(e) {
        return e.components && e.components.Transform;
    }

    toWorld(px, py) {
        return this.selection.toWorld(px, py);
    }

    _cleanComponents(c) { 
        return JSON.parse(JSON.stringify(c)); 
    }

    _createSnapshot() {
        return this.selection.selectedList.map(e => {
            const t = this._getTransform(e);
            return {
                _id: e._id || e.id, 
                components: this._cleanComponents(e.components),
                active: e.active,
                visible: e.visible
            };
        });
    }

    _applyState(list) {
        const world = this.world;
        const affected = [];

        const findEntity = (id) => {
            for(const layer of world.layers) {
                const found = layer.entities.find(e => (e._id || e.id) === id); 
                if(found) return found;
            }
            return null;
        };

        list.forEach(s => {
            const ent = findEntity(s._id);
            if(ent) {
                ent.components = JSON.parse(JSON.stringify(s.components));
                ent.active = s.active;
                ent.visible = s.visible;
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
            const t = this._getTransform(e);
            if (!t) return;

            const r = t.rotation || 0;
            const sx = t.scaleX ?? 1;
            const sy = t.scaleY ?? 1;
            const px = t.pivotX ?? 0.5;
            const py = t.pivotY ?? 0.5;
            
            const v = calculateQuadVertices(t.x, t.y, t.width, t.height, r, sx, sy, px, py);

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

        this.moveStartData = list.map(e => {
            const t = this._getTransform(e);
            return {
                e,
                x: t.x, 
                y: t.y
            };
        });

        if (list.length === 1) {
            const t = this._getTransform(list[0]);
            this.dragOffsetX = p.x - t.x;
            this.dragOffsetY = p.y - t.y;
        } else {
            this.dragOffsetX = 0;
            this.dragOffsetY = 0;
        }
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
            const t = this._getTransform(e);
            
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
                const t = this._getTransform(e);
                return {
                    e,
                    x: t.x, y: t.y, 
                    w: t.width, h: t.height,
                    r: t.rotation || 0, 
                    sx: t.scaleX ?? 1, sy: t.scaleY ?? 1
                };
            });
        }
    }

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
            
            const command = {
                name: "Transform Entity",
                undo: () => this._applyState(startState),
                redo: () => this._applyState(finalState)
            };
            if (this.game.history) this.game.history.push(command);
            
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
        
        // 1. Delta Mouse (Raw)
        const dx = n.x - this.startWorld.x;
        const dy = n.y - this.startWorld.y;

        // 2. Config Magnet
        const gridCtx = this.world._editors?.gridContext;
        const globalMagnet = gridCtx ? gridCtx.magnet : true;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;

        let finalDx = dx;
        let finalDy = dy;

        // 3. Logic Snap (Absolute Visual Top-Left)
        if (shouldSnap && this.moveStartData.length > 0) {
            const gridSize = (this.game.grid && this.game.grid.width) ? this.game.grid.width : 50;

            // Gunakan leader untuk kalkulasi delta
            const leader = this.moveStartData[0];
            const t = this._getTransform(leader.e);
            
            // Ambil pivot info
            const w = t.width || 0;
            const h = t.height || 0;
            const sx = t.scaleX ?? 1;
            const sy = t.scaleY ?? 1;
            const px_pivot = t.pivotX ?? 0.5;
            const py_pivot = t.pivotY ?? 0.5;

            // Offset dari Pivot ke Visual Top-Left (Local, tapi tanpa rotasi karena move di world axis)
            // Note: Jika entity rotate, bounding box AABB akan berubah.
            // Di sini kita snap posisi "jangkar" (anchor) yang sudah dikompensasi pivot.
            // Asumsi snap sederhana pada X/Y world.
            
            const offsetX = w * Math.abs(sx) * px_pivot;
            const offsetY = h * Math.abs(sy) * py_pivot;

            const rawDestX = leader.x + dx;
            const rawDestY = leader.y + dy;

            // Target Visual Top-Left (Unrotated approximation for snap)
            const rawTLX = rawDestX - offsetX;
            const rawTLY = rawDestY - offsetY;

            // Snap Top-Left ke Grid
            const snappedTLX = Math.round(rawTLX / gridSize) * gridSize;
            const snappedTLY = Math.round(rawTLY / gridSize) * gridSize;

            // Kembalikan ke Pivot
            const snappedPivotX = snappedTLX + offsetX;
            const snappedPivotY = snappedTLY + offsetY;

            finalDx = snappedPivotX - leader.x;
            finalDy = snappedPivotY - leader.y;
        }

        // Apply
        for (const item of this.moveStartData) {
            const t = this._getTransform(item.e);
            t.x = Math.round(item.x + finalDx);
            t.y = Math.round(item.y + finalDy);
        }
        
        bus.emit("entity:modified", this.selection.selectedList, true); 
    }

    rotate(px, py) {
        const list = this.selection.selectedList;
        if (!list.length) return;

        const p = this.toWorld(px, py);
        const e = list[0];
        const t = this._getTransform(e);

        const currentAngle = Math.atan2(p.y - this.rotateCenter.y, p.x - this.rotateCenter.x);
        let deltaAngle = currentAngle - this.rotateStartAngle;
        let newRotation = this.entityStartRotation + deltaAngle;

        // Snap Angle Logic
        const gridCtx = this.world._editors?.gridContext;
        const globalMagnet = gridCtx ? gridCtx.magnet : true;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;

        if (shouldSnap) {
            const deg = newRotation * (180 / Math.PI);
            const snapInterval = 15; // 15 Derajat
            const snappedDeg = Math.round(deg / snapInterval) * snapInterval;
            newRotation = snappedDeg * (Math.PI / 180);
        }

        t.rotation = newRotation;
        bus.emit("entity:modified", list, true);
    }

    resize(px, py) {
        if (!this.resizeType) return;
        const list = this.selection.selectedList;
        if (!list.length) return;
        if (this.selection.applyPointerAutoPan) this.selection.applyPointerAutoPan(px, py);

        const now = this.toWorld(px, py);
        const dx = now.x - this.startWorld.x;
        const dy = now.y - this.startWorld.y;

        const gridCtx = this.world._editors?.gridContext;
        const globalMagnet = gridCtx ? gridCtx.magnet : true;
        const isCtrlHeld = this.input.keyboard.isDown("Control");
        const shouldSnap = globalMagnet ? !isCtrlHeld : isCtrlHeld;
        const gridSize = (this.game.grid && this.game.grid.width) ? this.game.grid.width : 50;

        if (dx === 0 && dy === 0) return;

        if (list.length === 1) {
            const item = this.resizeEntityStarts[0];
            const e = item.e;
            const t = this._getTransform(e);

            // 1. Local Delta (Unrotate)
            const c = Math.cos(-item.r);
            const s = Math.sin(-item.r);
            const localDx = dx * c - dy * s;
            const localDy = dx * s + dy * c;

            const signX = item.sx < 0 ? -1 : 1;
            const signY = item.sy < 0 ? -1 : 1;
            const safeScaleX = Math.abs(item.sx) < 0.001 ? 0.001 : Math.abs(item.sx);
            const safeScaleY = Math.abs(item.sy) < 0.001 ? 0.001 : Math.abs(item.sy);

            let dX_Adjusted = (localDx * signX) / safeScaleX;
            let dY_Adjusted = (localDy * signY) / safeScaleY;

            let dW = 0, dH = 0;
            let anchorX = null, anchorY = null;

            if (this.resizeType.includes('w')) { dW = -dX_Adjusted; anchorX = item.sx > 0 ? 1 : 0; }
            if (this.resizeType.includes('e')) { dW = dX_Adjusted;  anchorX = item.sx > 0 ? 0 : 1; }
            if (this.resizeType.includes('n')) { dH = -dY_Adjusted; anchorY = item.sy > 0 ? 1 : 0; }
            if (this.resizeType.includes('s')) { dH = dY_Adjusted;  anchorY = item.sy > 0 ? 0 : 1; }

            let rawW = item.w + dW;
            let rawH = item.h + dH;

            // 2. Snap Resize
            if (shouldSnap) {
                if (this.resizeType.includes('w') || this.resizeType.includes('e')) {
                    rawW = Math.round(rawW / gridSize) * gridSize;
                    if (rawW === 0) rawW = gridSize * (item.w < 0 ? -1 : 1); 
                    dW = rawW - item.w;
                }
                if (this.resizeType.includes('n') || this.resizeType.includes('s')) {
                    rawH = Math.round(rawH / gridSize) * gridSize;
                    if (rawH === 0) rawH = gridSize * (item.h < 0 ? -1 : 1);
                    dH = rawH - item.h;
                }
            }

            const newW = Math.round(Math.abs(rawW)); 
            const newH = Math.round(Math.abs(rawH)); 
            
            // --- 3. SPECIAL CASE: Tilemap (Update Cols/Rows) ---
            if (e.components.Tilemap) {
                const tileSize = e.components.Tilemap.tileSize || 32;
                const newCols = Math.round(newW / tileSize);
                const newRows = Math.round(newH / tileSize);
                
                // Event: Update Tilemap Data
                bus.emit("editor:tilemap:resize", { id: e.id, width: newCols, height: newRows });
            }

            // 4. Update Visual Transform
            const newScaleX = (rawW < 0) ? -item.sx : item.sx;
            const newScaleY = (rawH < 0) ? -item.sy : item.sy;

            t.width = newW;
            t.height = newH;
            t.scaleX = newScaleX;
            t.scaleY = newScaleY;

            // 5. Pivot Compensation
            let shiftX = 0, shiftY = 0;
            if (anchorX !== null) shiftX = dW * ((t.pivotX ?? 0.5) - anchorX);
            if (anchorY !== null) shiftY = dH * ((t.pivotY ?? 0.5) - anchorY);
            
            const dW_Visual = dW * safeScaleX;
            const dH_Visual = dH * safeScaleY;

            let shiftX_World = 0, shiftY_World = 0;
            if (anchorX !== null) shiftX_World = dW_Visual * ((t.pivotX ?? 0.5) - anchorX);
            if (anchorY !== null) shiftY_World = dH_Visual * ((t.pivotY ?? 0.5) - anchorY);

            const wc = Math.cos(item.r);
            const ws = Math.sin(item.r);

            t.x = Math.round(item.x + (shiftX_World * wc - shiftY_World * ws));
            t.y = Math.round(item.y + (shiftX_World * ws + shiftY_World * wc));
            
            ApplyResizeToEntity(e, this.world);
        } 
        
        bus.emit("entity:modified", this.selection.selectedList, true);
    }

    draw(shape, proj) {
        if(!this.active) return;
        const list = this.selection.selectedList;
        if (!list.length) return;

        this.computeHandles();
        
        const scale = this.game.camera.scale;
        const rCorner = 5 / scale; 
        const t = 2 / scale;
        const c = this.selection.outlineColor;
        
        const b = this.groupBounds;
        if (b) {
            if (b.type === 'obb') {
                const v = b.v;
                shape.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, c, t, proj);
                shape.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, c, t, proj);
                shape.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, c, t, proj);
                shape.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, c, t, proj);
            } else {
                shape.drawLine(b.x, b.y, b.x + b.w, b.y, c, t, proj);
                shape.drawLine(b.x + b.w, b.y, b.x + b.w, b.y + b.h, c, t, proj);
                shape.drawLine(b.x + b.w, b.y + b.h, b.x, b.y + b.h, c, t, proj);
                shape.drawLine(b.x, b.y + b.h, b.x, b.y, c, t, proj);
            }
        }

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