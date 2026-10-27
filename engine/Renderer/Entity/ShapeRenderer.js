import { HexToVec4 } from "../../Util/HexToVec4.js";

export default class ShapeRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;
        this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;

        this.maxVerts = 60000;
        this.floatsPerVert = 6; 
        this.data = new Float32Array(this.maxVerts * this.floatsPerVert);
        this.index = 0;
        this.currentProjection = null;

        this._createShader();
        this._createBuffers();
    }

    _createShader() {
        const gl = this.gl;
        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec4 aColor;
            uniform mat4 uProjection;
            out vec4 vColor;
            void main() {
                vColor = aColor;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }` : `
            attribute vec2 aPos;
            attribute vec4 aColor;
            uniform mat4 uProjection;
            varying vec4 vColor;
            void main() {
                vColor = aColor;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }`;

        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec4 vColor;
            out vec4 outColor;
            void main() { outColor = vColor; }` : `
            precision mediump float;
            varying vec4 vColor;
            void main() { gl_FragColor = vColor; }`;

        const compile = (t, s) => { 
            const sh = gl.createShader(t); 
            gl.shaderSource(sh, s); 
            gl.compileShader(sh); 
            return sh; 
        };

        const vsObj = compile(gl.VERTEX_SHADER, vs);
        const fsObj = compile(gl.FRAGMENT_SHADER, fs);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vsObj);
        gl.attachShader(this.program, fsObj);
        
        if (!this.isWebGL2) { 
            gl.bindAttribLocation(this.program, 0, "aPos"); 
            gl.bindAttribLocation(this.program, 1, "aColor"); 
        }
        
        gl.linkProgram(this.program);
        this.uProjection = gl.getUniformLocation(this.program, "uProjection");
    }

    _createBuffers() {
        const gl = this.gl;
        this.vbo = gl.createBuffer();
        this.vao = this.ctx.createVAO();
        this.cache.bindVAO(this.vao);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.DYNAMIC_DRAW);
        
        const stride = this.floatsPerVert * 4;
        gl.enableVertexAttribArray(0); 
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1); 
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 8);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    _push(x, y, color) {
        const d = this.data;
        let i = this.index;
        d[i++] = x; d[i++] = y;
        d[i++] = color[0]; d[i++] = color[1]; d[i++] = color[2]; d[i++] = color[3];
        this.index = i;
    }

    _ensureCapacity(vertexCount) {
        if (this.index + (vertexCount * this.floatsPerVert) >= this.data.length) {
            this.flush();
        }
    }

    setProjection(projection) {
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }
    }

    _transformPoint(lx, ly, x, y, scaleX, scaleY, cos, sin) {
        const dx = lx * scaleX;
        const dy = ly * scaleY;
        return {
            x: x + (dx * cos - dy * sin),
            y: y + (dx * sin + dy * cos)
        };
    }

    drawPoint(x, y, radius, color = [1, 1, 1, 1], projection) {
        if (color[3] <= 0) return;
        this.drawCircle(x, y, radius, color, 16, projection);
    }

    drawLine(x1, y1, x2, y2, color = [1, 1, 1, 1], thickness = 2, projection) {
        if (color[3] <= 0) return;
        this.setProjection(projection);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 0.001) return;

        const nx = (-dy / len) * (thickness * 0.5);
        const ny = (dx / len) * (thickness * 0.5);

        this._ensureCapacity(6);
        this._push(x1 - nx, y1 - ny, color);
        this._push(x1 + nx, y1 + ny, color);
        this._push(x2 - nx, y2 - ny, color);
        this._push(x2 - nx, y2 - ny, color);
        this._push(x1 + nx, y1 + ny, color);
        this._push(x2 + nx, y2 + ny, color);
    }

    drawCircle(cx, cy, r, color = [1, 1, 1, 1], segments = 32, projection) {
        if (color[3] <= 0) return;
        this.setProjection(projection);

        const step = (Math.PI * 2) / segments;
        for (let i = 0; i < segments; i++) {
            const a1 = i * step;
            const a2 = (i + 1) * step;
            this._ensureCapacity(3);
            this._push(cx, cy, color);
            this._push(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, color);
            this._push(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r, color);
        }
    }

    _fillConvexPolygon(verts, color) {
        if (verts.length < 3 || color[3] <= 0) return;
        const v0 = verts[0];
        for (let i = 1; i < verts.length - 1; i++) {
            this._ensureCapacity(3);
            this._push(v0.x, v0.y, color);
            this._push(verts[i].x, verts[i].y, color);
            this._push(verts[i + 1].x, verts[i + 1].y, color);
        }
    }

    _strokePolyline(verts, color, thickness, proj, isClosed = false) {
        if (verts.length < 2 || color[3] <= 0) return;
        const len = isClosed ? verts.length : verts.length - 1;
        
        for (let i = 0; i < len; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % verts.length];
            this.drawLine(v1.x, v1.y, v2.x, v2.y, color, thickness, proj);
        }
    }

    drawParametricShape(type, x, y, w, h, fillCol, strokeCol, isFilled, strokeW, cornerRadius, sides, proj, rot = 0, sx = 1, sy = 1, px = 0.5, py = 0.5, flipX = false, flipY = false) {
        if (w === 0 || h === 0) return;
        this.setProjection(proj);

        const scaleX = w * (flipX ? -sx : sx);
        const scaleY = h * (flipY ? -sy : sy);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        let verts = [];
        if (type === "rectangle") {
            // Gunakan parameter px (pivotX) dan py (pivotY) 
            // bukan hardcode [-0.5, -0.5]
            const offsets = [
                [-px, -py], 
                [1 - px, -py], 
                [1 - px, 1 - py], 
                [-px, 1 - py]
            ];
            verts = offsets.map(([ox, oy]) => this._transformPoint(ox, oy, x, y, scaleX, scaleY, cos, sin));
        } else if (type === "ellipse" || type === "circle") {
            const segs = 32;
            for (let i = 0; i < segs; i++) {
                const ang = (i / segs) * Math.PI * 2;
                // Sesuaikan posisi render ellipse agar sejalan dengan pivotX dan pivotY
                const ox = (Math.cos(ang) * 0.5) + (0.5 - px);
                const oy = (Math.sin(ang) * 0.5) + (0.5 - py);
                verts.push(this._transformPoint(ox, oy, x, y, scaleX, scaleY, cos, sin));
            }
        }

        if (isFilled && fillCol) this._fillConvexPolygon(verts, fillCol);
        if (strokeW > 0 && strokeCol) this._strokePolyline(verts, strokeCol, strokeW, proj, true);
    }

    drawCustomShape(
        elements, x, y, w = 100, h = 100, proj, rot = 0, sx = 1, sy = 1, 
        px = 0.5, py = 0.5, flipX = false, flipY = false, editors = null, globalOptions = {}
    ) {
        if (!Array.isArray(elements) || elements.length === 0) return;
        this.setProjection(proj);

        const scaleX = (w / 100) * (flipX ? -sx : sx);
        const scaleY = (h / 100) * (flipY ? -sy : sy);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        const toWorld = (lx, ly) => this._transformPoint(lx, ly, x, y, scaleX, scaleY, cos, sin);
        
        const parseColor = (hex, alpha, fallbackHex, fallbackAlpha) => {
            const finalHex = hex || fallbackHex || "#0066FF";
            let finalAlpha = alpha ?? fallbackAlpha ?? 1.0;
            
            finalAlpha *= (globalOptions.globalOpacity ?? 1.0);
            
            const c = HexToVec4(finalHex);
            return [c[0], c[1], c[2], c[3] * finalAlpha];
        };

        const pointMap = new Map();
        const usedPointIds = new Set();

        for (const el of elements) {
            if (el.type === 'point') pointMap.set(el.id, el);
            else if (el.type === 'segment' || el.type === 'polygon') {
                (el.points || []).forEach(id => usedPointIds.add(id));
            } else if (el.type === 'line') {
                if (el.p1) usedPointIds.add(el.p1);
                if (el.p2) usedPointIds.add(el.p2);
            } else if (el.type === 'circle') {
                if (el.pCenter) usedPointIds.add(el.pCenter);
                if (el.pEdge) usedPointIds.add(el.pEdge);
            }
        }

        const cameraScale = this.ctx.camera?.scale || 1;
        const baseWorldRadius = 5.0; 
        const ptRadius = baseWorldRadius / cameraScale;

        for (const elem of elements) {
            if (!elem || elem.enabled === false) continue;

            const strokeW = elem.strokeWidth ?? globalOptions.outlineWidth ?? 2;
            
            const strokeCol = parseColor(
                elem.strokeColor, 
                elem.strokeOpacity, 
                globalOptions.outlineColor, 
                globalOptions.outlineOpacity
            );

            const fillCol = parseColor(
                elem.fillColor, 
                elem.fillOpacity, 
                globalOptions.color, 
                globalOptions.fillOpacity
            );

            const canFill = elem.isFilled ?? globalOptions.isFilled ?? true;

            if (elem.type === "point") {
                if (usedPointIds.has(elem.id) && !editors) continue;

                const pt = toWorld(elem.x, elem.y);
                const ptColor = parseColor(elem.fillColor, elem.fillOpacity, globalOptions.color, 1.0);

                if (editors) {
                    const borderThickness = 1.5 / cameraScale;
                    this.drawPoint(pt.x, pt.y, ptRadius + borderThickness, [0, 0, 0, 1.0], proj);
                }

                this.drawPoint(pt.x, pt.y, ptRadius, ptColor, proj);
            }
            else if (elem.type === "polygon") {
                const pts = (elem.points || []).map(id => pointMap.get(id)).filter(Boolean);
                if (pts.length < 3) continue;

                const worldVerts = pts.map(p => toWorld(p.x, p.y));
                if (canFill) {
                    this._fillConvexPolygon(worldVerts, fillCol);
                }
                if (strokeW > 0) {
                    this._strokePolyline(worldVerts, strokeCol, strokeW, proj, true);
                }
            }
            else if (elem.type === "segment") {
                const pts = (elem.points || []).map(id => pointMap.get(id)).filter(Boolean);
                if (pts.length < 2) continue;

                const worldVerts = pts.map(p => toWorld(p.x, p.y));
                
                // Tetap terlihat meski outline 0
                const finalStrokeW = strokeW <= 0 ? 2 : strokeW; 
                
                // Gunakan fillCol agar warnanya mengikuti warna utama (overall) objek
                this._strokePolyline(worldVerts, fillCol, finalStrokeW, proj, false);
            } 
            else if (elem.type === "line") {
                const p1 = pointMap.get(elem.p1);
                const p2 = pointMap.get(elem.p2);
                if (p1 && p2) {
                    const w1 = toWorld(p1.x, p1.y);
                    const w2 = toWorld(p2.x, p2.y);
                    const len = Math.hypot(w2.x - w1.x, w2.y - w1.y);
                    if (len > 0) {
                        const nx = (w2.x - w1.x) / len * 100000;
                        const ny = (w2.y - w1.y) / len * 100000;
                        
                        // Tetap terlihat meski outline 0
                        const finalStrokeW = strokeW <= 0 ? 2 : strokeW;
                        
                        // Gunakan fillCol agar warnanya mengikuti warna utama (overall) objek
                        this.drawLine(w1.x - nx, w1.y - ny, w1.x + nx, w1.y + ny, fillCol, finalStrokeW, proj);
                    }
                }
            }
            else if (elem.type === "circle") {
                const pCenter = pointMap.get(elem.pCenter);
                const pEdge = pointMap.get(elem.pEdge);
                if (pCenter && pEdge) {
                    const wCenter = toWorld(pCenter.x, pCenter.y);
                    const wEdge = toWorld(pEdge.x, pEdge.y);
                    
                    const r = Math.hypot(wEdge.x - wCenter.x, wEdge.y - wCenter.y);
                    
                    let verts = [];
                    const segs = elem.segments || 32;
                    for (let i = 0; i < segs; i++) {
                        const ang = (i / segs) * Math.PI * 2;
                        verts.push({
                            x: wCenter.x + Math.cos(ang) * r,
                            y: wCenter.y + Math.sin(ang) * r
                        });
                    }
                    
                    if (canFill) {
                        this._fillConvexPolygon(verts, fillCol);
                    }
                    if (strokeW > 0) {
                        this._strokePolyline(verts, strokeCol, strokeW, proj, true);
                    }
                }
            }
        }

        if (editors) this._renderEditorGizmos(editors, pointMap, toWorld, proj, ptRadius, cameraScale);
    }
    
    _renderEditorGizmos(editors, pointMap, toWorld, proj, ptRadius, cameraScale = 1) {
        const showPointsTools = ['point', 'line', 'segment', 'polygon', 'circle', 'select', 'move', 'delete', 'eraser'];
        if (showPointsTools.includes(editors.activeTool)) {
            const outlineOffset = 1.5 / cameraScale;
            
            for (const elem of pointMap.values()) {
                if (elem.enabled === false) continue;
                const pt = toWorld(elem.x, elem.y);
                const isSelected = editors.shapeSelectedPoints?.includes(elem.id);
                const isHovered = editors.shapeHoveredPoint === elem.id;

                if (isSelected) {
                    this.drawPoint(pt.x, pt.y, (ptRadius * 1.8) + outlineOffset, [0, 0, 0, 1.0], proj);
                    this.drawPoint(pt.x, pt.y, ptRadius * 1.8, [0.0, 0.5, 1.0, 1.0], proj);
                    this.drawPoint(pt.x, pt.y, ptRadius * 0.8, [1.0, 1.0, 1.0, 1.0], proj);
                } else if (isHovered) {
                    this.drawPoint(pt.x, pt.y, (ptRadius * 1.6) + outlineOffset, [0, 0, 0, 0.5], proj);
                    this.drawPoint(pt.x, pt.y, ptRadius * 1.6, [1, 1, 1, 0.6], proj);
                }
            }
        }

        const ds = editors.shapeDraftState;
        if (ds && ds.points?.length > 0) {
            const m = toWorld(ds.mouseLocal.x, ds.mouseLocal.y);
            const draftPts = ds.points.map(id => pointMap.get(id)).filter(Boolean);
            const ghostStrokeCol = [0, 0.8, 1, 0.6];

            if (ds.tool === 'segment' || ds.tool === 'polygon') {
                const worldVerts = draftPts.map(p => toWorld(p.x, p.y));
                
                // Gambar garis draft antar titik yang sudah ditaruh
                if (worldVerts.length >= 2) {
                    this._strokePolyline(worldVerts, ghostStrokeCol, 2, proj, false);
                }

                // Gambar garis tarikan dari titik terakhir ke cursor mouse
                const lastPt = worldVerts[worldVerts.length - 1];
                this.drawLine(lastPt.x, lastPt.y, m.x, m.y, ghostStrokeCol, 2, proj);

                if (ds.tool === 'polygon' && draftPts.length >= 2) {
                    const firstPt = worldVerts[0];
                    this.drawLine(firstPt.x, firstPt.y, m.x, m.y, ghostStrokeCol, 2, proj);

                    const fillVerts = [...worldVerts, m];
                    this._fillConvexPolygon(fillVerts, [1, 1, 1, 0.3]);
                }
            }
            else if (ds.tool === 'line' && draftPts.length === 1) {
                const pt = toWorld(draftPts[0].x, draftPts[0].y);
                const len = Math.hypot(m.x - pt.x, m.y - pt.y);
                if (len > 0) {
                    const nx = (m.x - pt.x) / len * 100000;
                    const ny = (m.y - pt.y) / len * 100000;
                    this.drawLine(pt.x - nx, pt.y - ny, pt.x + nx, pt.y + ny, ghostStrokeCol, 2, proj);
                }
            } 
            else if (ds.tool === 'circle' && draftPts.length === 1) {
                const pt = toWorld(draftPts[0].x, draftPts[0].y);
                const r = Math.hypot(m.x - pt.x, m.y - pt.y);
                
                this.drawCircle(pt.x, pt.y, r, [0, 1, 0, 0.2], 32, proj);
                
                const ghostBorder = [];
                const segs = 32;
                for (let i = 0; i < segs; i++) {
                    const ang = (i / segs) * Math.PI * 2;
                    ghostBorder.push({ x: pt.x + Math.cos(ang) * r, y: pt.y + Math.sin(ang) * r });
                }
                this._strokePolyline(ghostBorder, [0, 0.8, 0, 0.8], 2, proj, true);
            }
        }

        if (editors.shapeMarquee) {
            const mStart = toWorld(editors.shapeMarquee.start.x, editors.shapeMarquee.start.y);
            const mEnd = toWorld(editors.shapeMarquee.end.x, editors.shapeMarquee.end.y);
            const minX = Math.min(mStart.x, mEnd.x), maxX = Math.max(mStart.x, mEnd.x);
            const minY = Math.min(mStart.y, mEnd.y), maxY = Math.max(mStart.y, mEnd.y);

            const box = [{x: minX, y: minY}, {x: maxX, y: minY}, {x: maxX, y: maxY}, {x: minX, y: maxY}];
            this._fillConvexPolygon(box, [0, 0.5, 1, 0.15]);
            this._strokePolyline(box, [0, 0.5, 1, 0.8], 2, proj, true);
        }
    }

    flush() {
        const gl = this.gl;
        if (this.index > 0) {
            this.cache.useProgram(this.program);
            this.cache.bindVAO(this.vao);
            gl.uniformMatrix4fv(this.uProjection, false, this.currentProjection);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.subarray(0, this.index));
            gl.drawArrays(gl.TRIANGLES, 0, this.index / this.floatsPerVert);
            this.index = 0;
        }
    }
}