import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

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
            void main(){
                vColor = aColor;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        ` : `
            attribute vec2 aPos;
            attribute vec4 aColor;
            uniform mat4 uProjection;
            varying vec4 vColor;
            void main(){
                vColor = aColor;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        `;
        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec4 vColor;
            out vec4 outColor;
            void main(){ outColor = vColor; }
        ` : `
            precision mediump float;
            varying vec4 vColor;
            void main(){ gl_FragColor = vColor; }
        `;
        
        const compile = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
        const vsObj = compile(gl.VERTEX_SHADER, vs);
        const fsObj = compile(gl.FRAGMENT_SHADER, fs);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vsObj);
        gl.attachShader(this.program, fsObj);
        if(!this.isWebGL2) { gl.bindAttribLocation(this.program,0,"aPos"); gl.bindAttribLocation(this.program,1,"aColor"); }
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
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 8);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    _push(x, y, r, g, b, a) {
        const d = this.data;
        let i = this.index;
        d[i++] = x; d[i++] = y;
        d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
        this.index = i;
    }

    _ensureCapacity(vertexCount) {
        if (this.index + (vertexCount * this.floatsPerVert) >= this.data.length) {
            this.flush();
        }
    }

    drawLine(x1, y1, x2, y2, color=[1,1,1,1], thickness=2, projection) {
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        const dx = x2 - x1; const dy = y2 - y1;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 0.001) return;

        const nx = -dy / len * (thickness * 0.5);
        const ny =  dx / len * (thickness * 0.5);
        const [r,g,b,a] = color;

        this._ensureCapacity(6);

        this._push(x1 - nx, y1 - ny, r,g,b,a);
        this._push(x1 + nx, y1 + ny, r,g,b,a);
        this._push(x2 - nx, y2 - ny, r,g,b,a);
        this._push(x2 - nx, y2 - ny, r,g,b,a);
        this._push(x1 + nx, y1 + ny, r,g,b,a);
        this._push(x2 + nx, y2 + ny, r,g,b,a);
    }

    drawParametricShape(type, x, y, w, h, fillCol, strokeCol, isFilled, strokeW, cornerRadius, sides, proj, rot, sx, sy, px, py, flipX, flipY) {
        if (w === 0 || h === 0) return;

        const finalSX = flipX ? -sx : sx;
        const finalSY = flipY ? -sy : sy;

        const getVerts = (transformFn) => {
            let verts = [];
            if (type === "rectangle") {
                const r = Math.max(0, Math.min(cornerRadius || 0, w / 2, h / 2));
                if (r > 0 && w > 0 && h > 0) {
                    const rx = r / w;
                    const ry = r / h;
                    const segments = 16;
                    
                    for (let i = 0; i <= segments; i++) {
                        const ang = Math.PI + (i / segments) * (Math.PI / 2);
                        verts.push(transformFn(rx + Math.cos(ang) * rx, ry + Math.sin(ang) * ry));
                    }
                    for (let i = 0; i <= segments; i++) {
                        const ang = 1.5 * Math.PI + (i / segments) * (Math.PI / 2);
                        verts.push(transformFn((1 - rx) + Math.cos(ang) * rx, ry + Math.sin(ang) * ry));
                    }
                    for (let i = 0; i <= segments; i++) {
                        const ang = 0 + (i / segments) * (Math.PI / 2);
                        verts.push(transformFn((1 - rx) + Math.cos(ang) * rx, (1 - ry) + Math.sin(ang) * ry));
                    }
                    for (let i = 0; i <= segments; i++) {
                        const ang = 0.5 * Math.PI + (i / segments) * (Math.PI / 2);
                        verts.push(transformFn(rx + Math.cos(ang) * rx, (1 - ry) + Math.sin(ang) * ry));
                    }
                } else {
                    verts.push(transformFn(0, 0));
                    verts.push(transformFn(1, 0));
                    verts.push(transformFn(1, 1));
                    verts.push(transformFn(0, 1));
                }
            } 
            else if (type === "ellipse" || type === "circle") {
                const segs = 64; 
                for(let i = 0; i < segs; i++) {
                    const ang = (i / segs) * Math.PI * 2;
                    verts.push(transformFn(0.5 + Math.cos(ang) * 0.5, 0.5 + Math.sin(ang) * 0.5));
                }
            } 
            else if (type === "polygon") {
                const s = Math.max(3, sides);
                let rawVerts = [];
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

                for(let i = 0; i < s; i++) {
                    const ang = (i / s) * Math.PI * 2 - Math.PI / 2;
                    const vx = Math.cos(ang);
                    const vy = Math.sin(ang);
                    rawVerts.push({x: vx, y: vy});
                    
                    if (vx < minX) minX = vx;
                    if (vx > maxX) maxX = vx;
                    if (vy < minY) minY = vy;
                    if (vy > maxY) maxY = vy;
                }

                const rangeX = maxX - minX || 1;
                const rangeY = maxY - minY || 1;
                const cr = Math.max(0, cornerRadius || 0);

                let finalVerts = [];

                if (cr > 0) {
                    const scaleX = w / rangeX;
                    const scaleY = h / rangeY;
                    const avgScale = (scaleX + scaleY) / 2;
                    const localCR = cr / avgScale;

                    const len = rawVerts.length;
                    for (let i = 0; i < len; i++) {
                        const p1 = rawVerts[(i - 1 + len) % len];
                        const p2 = rawVerts[i];
                        const p3 = rawVerts[(i + 1) % len];

                        let v1x = p1.x - p2.x, v1y = p1.y - p2.y;
                        let v2x = p3.x - p2.x, v2y = p3.y - p2.y;

                        const l1 = Math.hypot(v1x, v1y);
                        const l2 = Math.hypot(v2x, v2y);

                        v1x /= l1; v1y /= l1;
                        v2x /= l2; v2y /= l2;

                        const dot = Math.max(-1, Math.min(1, v1x * v2x + v1y * v2y));
                        const angle = Math.acos(dot);
                        const tanHalf = Math.tan(angle / 2);
                        
                        let tanLen = localCR / Math.abs(tanHalf);
                        
                        const maxTanLen = Math.min(l1 / 2, l2 / 2);
                        let clampedCR = localCR;
                        if (tanLen > maxTanLen) {
                            tanLen = maxTanLen;
                            clampedCR = tanLen * Math.abs(tanHalf);
                        }

                        const t1 = { x: p2.x + v1x * tanLen, y: p2.y + v1y * tanLen };
                        const t2 = { x: p2.x + v2x * tanLen, y: p2.y + v2y * tanLen };

                        const bisX = v1x + v2x, bisY = v1y + v2y;
                        const bisLen = Math.hypot(bisX, bisY);
                        
                        const centerDist = clampedCR / Math.sin(angle / 2);
                        const cx = p2.x + (bisX / bisLen) * centerDist;
                        const cy = p2.y + (bisY / bisLen) * centerDist;

                        let a1 = Math.atan2(t1.y - cy, t1.x - cx);
                        let a2 = Math.atan2(t2.y - cy, t2.x - cx);

                        let delta = a2 - a1;
                        if (delta > Math.PI) delta -= Math.PI * 2;
                        if (delta < -Math.PI) delta += Math.PI * 2;
                        
                        const arcSegs = 8;
                        for (let j = 0; j <= arcSegs; j++) {
                            const a = a1 + delta * (j / arcSegs);
                            finalVerts.push({
                                x: cx + Math.cos(a) * clampedCR,
                                y: cy + Math.sin(a) * clampedCR
                            });
                        }
                    }
                } else {
                    finalVerts = rawVerts;
                }

                for(let i = 0; i < finalVerts.length; i++) {
                    const normalizedX = (finalVerts[i].x - minX) / rangeX;
                    const normalizedY = (finalVerts[i].y - minY) / rangeY;
                    verts.push(transformFn(normalizedX, normalizedY));
                }
            }
            return verts;
        };

        if (proj !== this.currentProjection) {
            this.flush();
            this.currentProjection = proj;
        }

        const signX = Math.sign(finalSX) || 1;
        const signY = Math.sign(finalSY) || 1;

        if (isFilled) {
            const transformFill = (lx, ly) => {
                let dx = (lx - px) * w * finalSX;
                let dy = (ly - py) * h * finalSY;

                if (strokeW > 0) {
                    dx -= (lx - 0.5) * 2 * (strokeW / 2) * signX;
                    dy -= (ly - 0.5) * 2 * (strokeW / 2) * signY;
                }

                const cos = Math.cos(rot);
                const sin = Math.sin(rot);
                return {
                    x: x + (dx * cos - dy * sin),
                    y: y + (dx * sin + dy * cos)
                };
            };
            const fillVerts = getVerts(transformFill);
            this._fillConvexPolygon(fillVerts, fillCol);
        }

        if (Math.abs(strokeW) > 0) {
            const transformStroke = (lx, ly) => {
                let dx = (lx - px) * w * finalSX;
                let dy = (ly - py) * h * finalSY;
                
                dx -= (lx - 0.5) * 2 * (strokeW / 2) * signX;
                dy -= (ly - 0.5) * 2 * (strokeW / 2) * signY;

                const cos = Math.cos(rot);
                const sin = Math.sin(rot);
                return {
                    x: x + (dx * cos - dy * sin),
                    y: y + (dx * sin + dy * cos)
                };
            };

            const strokeVerts = getVerts(transformStroke);
            this._strokePolyline(strokeVerts, strokeCol, Math.abs(strokeW), proj, type, cornerRadius, rot);
        }
    }

    _fillConvexPolygon(verts, color) {
        if (verts.length < 3) return;
        const [r, g, b, a] = color;
        if (a <= 0) return;

        const v0 = verts[0];
        for (let i = 1; i < verts.length - 1; i++) {
            const v1 = verts[i];
            const v2 = verts[i+1];
            
            this._ensureCapacity(3);

            this._push(v0.x, v0.y, r, g, b, a);
            this._push(v1.x, v1.y, r, g, b, a);
            this._push(v2.x, v2.y, r, g, b, a);
        }
    }

    _drawSquareJoint(x, y, size, rot, color) {
        const hw = size * 0.5;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        const tlX = -hw * cos - (-hw) * sin; const tlY = -hw * sin + (-hw) * cos;
        const trX =  hw * cos - (-hw) * sin; const trY =  hw * sin + (-hw) * cos;
        const brX =  hw * cos -   hw  * sin; const brY =  hw * sin +   hw  * cos;
        const blX = -hw * cos -   hw  * sin; const blY = -hw * sin +   hw  * cos;

        const [r, g, b, a] = color;
        
        this._ensureCapacity(6);

        this._push(x + tlX, y + tlY, r,g,b,a);
        this._push(x + trX, y + trY, r,g,b,a);
        this._push(x + brX, y + brY, r,g,b,a);

        this._push(x + tlX, y + tlY, r,g,b,a); 
        this._push(x + brX, y + brY, r,g,b,a);
        this._push(x + blX, y + blY, r,g,b,a);
    }

    _strokePolyline(verts, color, thickness, proj, type, cornerRadius, rot) {
        if (verts.length < 2) return;
        const len = verts.length;
        
        for (let i = 0; i < len; i++) {
            const v1 = verts[i];
            const v2 = verts[(i + 1) % len];
            this.drawLine(v1.x, v1.y, v2.x, v2.y, color, thickness, proj);
        }

        if (thickness > 1.5) {
            const isSharpRectangle = (type === "rectangle" && (!cornerRadius || cornerRadius <= 0));

            for (let i = 0; i < len; i++) {
                if (isSharpRectangle) {
                    this._drawSquareJoint(verts[i].x, verts[i].y, thickness, rot, color);
                } else {
                    this.drawCircle(verts[i].x, verts[i].y, thickness * 0.5, color, 24, proj); 
                }
            }
        }
    }

    drawCircle(cx, cy, r, color=[1,1,1,1], segments=64, projection) {
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }
        const [cr, cg, cb, ca] = color;
        const step = (Math.PI * 2) / segments;
        for (let i = 0; i < segments; i++) {
            const a1 = i * step;
            const a2 = (i+1) * step;
            const x1 = cx + Math.cos(a1) * r;
            const y1 = cy + Math.sin(a1) * r;
            const x2 = cx + Math.cos(a2) * r;
            const y2 = cy + Math.sin(a2) * r;

            this._ensureCapacity(3);

            this._push(cx, cy, cr, cg, cb, ca);
            this._push(x1, y1, cr, cg, cb, ca);
            this._push(x2, y2, cr, cg, cb, ca);
        }
    }

    flush() {
        const gl = this.gl;
        if (this.index === 0) return;
        this.cache.useProgram(this.program);
        this.cache.bindVAO(this.vao);
        gl.uniformMatrix4fv(this.uProjection, false, this.currentProjection);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data.subarray(0, this.index));
        gl.drawArrays(gl.TRIANGLES, 0, this.index / this.floatsPerVert);
        this.index = 0;
    }
}