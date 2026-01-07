import Mat4 from "../../Util/Mat4.js";

const _shared = new WeakMap();

function getShared(gl) {
    let s = _shared.get(gl);
    if (s) return s;

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    const hasDeriv = isWebGL2 || !!gl.getExtension("OES_standard_derivatives");

    const vs = isWebGL2 ? `#version 300 es
        layout(location=0) in vec2 aPos;
        layout(location=1) in vec2 aUV;
        layout(location=2) in vec4 aColor;
        uniform mat4 uProjection;
        out vec2 vUV; out vec4 vColor;
        void main() { vUV = aUV; vColor = aColor; gl_Position = uProjection * vec4(aPos, 0.0, 1.0); }
    ` : `
        attribute vec2 aPos; attribute vec2 aUV; attribute vec4 aColor;
        uniform mat4 uProjection;
        varying vec2 vUV; varying vec4 vColor;
        void main() { vUV = aUV; vColor = aColor; gl_Position = uProjection * vec4(aPos, 0.0, 1.0); }
    `;

    const fs = isWebGL2 ? `#version 300 es
        precision mediump float;
        in vec2 vUV; in vec4 vColor; out vec4 outColor;
        uniform sampler2D uTex; uniform float uDist;
        float median3(vec3 v) { return max(min(v.r, v.g), min(max(v.r, v.g), v.b)); }
        void main() {
            vec3 msdf = texture(uTex, vUV).rgb;
            float sd = median3(msdf);
            float dist = sd - 0.5;
            float fw = fwidth(dist) * 0.5;
            float alpha = smoothstep(-fw, fw, dist);
            if (alpha < 0.01) discard;
            outColor = vec4(vColor.rgb, vColor.a * alpha);
        }
    ` : `
        precision mediump float;
        varying vec2 vUV; varying vec4 vColor;
        uniform sampler2D uTex; uniform float uDist;
        float median3(vec3 v) { return max(min(v.r, v.g), min(max(v.r, v.g), v.b)); }
        ${hasDeriv ? "#extension GL_OES_standard_derivatives : enable" : ""}
        void main() {
            vec3 msdf = texture2D(uTex, vUV).rgb;
            float sd = median3(msdf);
            float dist = sd - 0.5;
            float fw = ${hasDeriv ? "fwidth(dist) * 0.5" : "0.003 * uDist"};
            float alpha = smoothstep(-fw, fw, dist);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
        }
    `;

    const compile = (t, src) => {
        const sh = gl.createShader(t);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        return sh;
    };

    const vsObj = compile(gl.VERTEX_SHADER, vs);
    const fsObj = compile(gl.FRAGMENT_SHADER, fs);
    const program = gl.createProgram();
    gl.attachShader(program, vsObj);
    gl.attachShader(program, fsObj);

    if (!isWebGL2) {
        gl.bindAttribLocation(program, 0, "aPos");
        gl.bindAttribLocation(program, 1, "aUV");
        gl.bindAttribLocation(program, 2, "aColor");
    }
    gl.linkProgram(program);

    s = {
        gl, isWebGL2, program,
        uProjection: gl.getUniformLocation(program, "uProjection"),
        uTex: gl.getUniformLocation(program, "uTex"),
        uDist: gl.getUniformLocation(program, "uDist")
    };
    _shared.set(gl, s);
    return s;
}

export default class TextRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;
        this.s = getShared(this.gl);

        this.maxGlyphs = 20000;
        this.floatsPerVertex = 8; 
        this.floatsPerGlyph = this.floatsPerVertex * 6; 

        this.bufferData = new Float32Array(this.maxGlyphs * this.floatsPerGlyph);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.currentProjection = null;
        this._lastDist = 4; 

        this.vbo = this.gl.createBuffer();
        this.vao = this.ctx.createVAO();

        this._initVAO();
    }

    _initVAO() {
        const gl = this.gl;
        const stride = this.floatsPerVertex * 4;
        this.cache.bindVAO(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0); 
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8); 
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16); 
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    measureText(font, str, size) {
        // Safety check agar tidak error akses property of undefined
        if (!font || !font.chars || !font.info || !str) {
            return { width: 0, height: 0, xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
        }
        const scale = size / font.info.size; 
        let cx = 0, xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;

        for (const ch of str) {
            const gdat = font.chars[ch.charCodeAt(0)];
            if (!gdat) continue;
            
            const x0 = cx + gdat.ox * scale, y0 = gdat.oy * scale;
            const x1 = x0 + gdat.w * scale, y1 = y0 + gdat.h * scale;
            
            if (x0 < xMin) xMin = x0; if (y0 < yMin) yMin = y0;
            if (x1 > xMax) xMax = x1; if (y1 > yMax) yMax = y1;
            
            cx += gdat.adv * scale; 
        }
        
        if (xMin === Infinity) { 
            xMin = 0; xMax = cx; yMin = 0; yMax = (font.common?.lineHeight || 10) * scale; 
        }
        
        return { 
            width: cx, 
            boundsWidth: xMax - xMin, 
            boundsHeight: yMax - yMin, 
            xMin, yMin, xMax, yMax, 
            baseline: (font.common?.base || 0) * scale 
        };
    }

    drawText(font, str, x, y, w, h, size, color, projection, rot = 0, sx = 1, sy = 1, px = 0, py = 0, alpha = 1) {
        // Guard paling penting: Pastikan texture valid sebelum lanjut
        if (!font || !font.glTexture || !str || str.trim() === "") return;

        const measurement = this.measureText(font, str, size);
        
        const nativeW = measurement.boundsWidth;
        const nativeH = measurement.boundsHeight;
        
        const offsetX = measurement.xMin;
        const offsetY = measurement.yMin;

        const targetW = w || nativeW;
        const targetH = h || nativeH;
        
        const ratioX = (nativeW > 0 ? targetW / nativeW : 1);
        const ratioY = (nativeH > 0 ? targetH / nativeH : 1);

        const c = Math.cos(rot), s = Math.sin(rot);
        
        const pivotOffsetX = -px * targetW * sx;
        const pivotOffsetY = -py * targetH * sy;
        
        const transform = (lx, ly) => {
            const fx = lx * ratioX * sx + pivotOffsetX;
            const fy = ly * ratioY * sy + pivotOffsetY;
            return {
                x: x + (fx * c - fy * s),
                y: y + (fx * s + fy * c)
            };
        };

        if (this.currentTexture !== font.glTexture) { 
            this.flush(); 
            this.currentTexture = font.glTexture; 
        }
        if (projection !== this.currentProjection) { 
            this.flush(); 
            this.currentProjection = projection; 
        }

        const d = this.bufferData;
        let i = this.bufferIndex;
        const col = color || [1, 1, 1, 1];
        const alph = (col[3] ?? 1) * alpha;
        
        const scale = size / font.info.size;
        let cx = 0;

        for (const ch of str) {
            const g = font.chars[ch.charCodeAt(0)];
            if (!g) continue;

            const x0 = cx + g.ox * scale, y0 = g.oy * scale;
            const x1 = x0 + g.w * scale, y1 = y0 + g.h * scale;
            
            const pTL = transform(x0-offsetX, y0-offsetY);
            const pTR = transform(x1-offsetX, y0-offsetY);
            const pBL = transform(x0-offsetX, y1-offsetY);
            const pBR = transform(x1-offsetX, y1-offsetY);
            
            const u0 = g.x / font.common.texW, v0 = g.y / font.common.texH;
            const u1 = (g.x + g.w) / font.common.texW, v1 = (g.y + g.h) / font.common.texH;

            const push = (v, u, v_tex) => { 
                d[i++] = v.x; d[i++] = v.y; 
                d[i++] = u; d[i++] = v_tex; 
                d[i++] = col[0]; d[i++] = col[1]; d[i++] = col[2]; d[i++] = alph; 
            };
            
            push(pTL, u0, v0); push(pTR, u1, v0); push(pBL, u0, v1);
            push(pTR, u1, v0); push(pBR, u1, v1); push(pBL, u0, v1);
            
            cx += g.adv * scale;
        }

        this.bufferIndex = i;
        this._lastDist = font.info.distance; 
        
        if (i >= this.bufferData.length - this.floatsPerGlyph) this.flush();
    }

    flush() {
        if (this.bufferIndex === 0) return;
        const gl = this.gl; const s = this.s;

        this.cache.useProgram(s.program);
        this.cache.bindVAO(this.vao);
        this.cache.bindTexture(this.currentTexture);

        gl.uniformMatrix4fv(s.uProjection, false, this.currentProjection);
        gl.uniform1f(s.uDist, this._lastDist);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));
        
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);
        
        this.bufferIndex = 0;
    }
}