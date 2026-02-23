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

    drawRect(x, y, w, h, color=[1,1,1,1], projection, rot=0, sx=1, sy=1, px=0, py=0, alpha=1, flipX=false, flipY=false) {
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        const [r,g,b,ca] = color;
        const a = ca * alpha;
        
        const finalSX = flipX ? -sx : sx;
        const finalSY = flipY ? -sy : sy;

        const v = calculateQuadVertices(x, y, w, h, rot, finalSX, finalSY, px, py);

        this._push(v.tl.x, v.tl.y, r,g,b,a);
        this._push(v.tr.x, v.tr.y, r,g,b,a);
        this._push(v.bl.x, v.bl.y, r,g,b,a);

        this._push(v.tr.x, v.tr.y, r,g,b,a);
        this._push(v.br.x, v.br.y, r,g,b,a);
        this._push(v.bl.x, v.bl.y, r,g,b,a);
    } 
    
    drawRectStroke(x, y, w, h, color=[1,1,1,1], thickness=2, projection, rot=0, sx=1, sy=1, px=0, py=0, alpha=1, flipX=false, flipY=false) {
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        const finalSX = flipX ? -sx : sx;
        const finalSY = flipY ? -sy : sy;

        const v = calculateQuadVertices(x, y, w, h, rot, finalSX, finalSY, px, py);
        const c = [color[0], color[1], color[2], color[3] * alpha];
        
        this.drawLine(v.tl.x, v.tl.y, v.tr.x, v.tr.y, c, thickness, projection); 
        this.drawLine(v.tr.x, v.tr.y, v.br.x, v.br.y, c, thickness, projection); 
        this.drawLine(v.br.x, v.br.y, v.bl.x, v.bl.y, c, thickness, projection); 
        this.drawLine(v.bl.x, v.bl.y, v.tl.x, v.tl.y, c, thickness, projection); 
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

        this._push(x1 - nx, y1 - ny, r,g,b,a);
        this._push(x1 + nx, y1 + ny, r,g,b,a);
        this._push(x2 - nx, y2 - ny, r,g,b,a);
        this._push(x2 - nx, y2 - ny, r,g,b,a);
        this._push(x1 + nx, y1 + ny, r,g,b,a);
        this._push(x2 + nx, y2 + ny, r,g,b,a);
    }

    drawCircle(cx, cy, r, color=[1,1,1,1], segments=24, projection) {
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
            this._push(cx, cy, cr, cg, cb, ca);
            this._push(x1, y1, cr, cg, cb, ca);
            this._push(x2, y2, cr, cg, cb, ca);
        }
    }

    drawCircleOutline(cx, cy, r, color=[0,0,0,1], thickness=2, segments=32, projection) {
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
            this.drawLine(x1, y1, x2, y2, [cr,cg,cb,ca], thickness, projection);
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