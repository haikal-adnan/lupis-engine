import Mat4 from "../../Util/Mat4.js";
import FontMath from "../../Util/FontMath.js";

const _shared = new WeakMap();

function getShared(gl) {
    let s = _shared.get(gl);
    if (s) return s;

    const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    const hasDeriv = isWebGL2 || (gl.getExtension && !!gl.getExtension("OES_standard_derivatives"));

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
        uniform sampler2D uTex; 
        uniform float uOutlineWidth;
        uniform vec4 uOutlineColor;
        
        uniform float uBias;
        uniform float uSmoothing;

        float median3(vec3 v) { return max(min(v.r, v.g), min(max(v.r, v.g), v.b)); }
        
        void main() {
            vec3 msdf = texture(uTex, vUV).rgb;
            
            float sd = median3(msdf) + uBias; 
            float dist = sd - 0.5;
            
            float fw = fwidth(dist) * (uSmoothing * 2.0); 
            float alpha = smoothstep(-fw, fw, dist);
            
            vec4 finalColor = vec4(vColor.rgb, vColor.a * alpha);

            if (uOutlineWidth > 0.0) {
                float outlineDist = sd - (0.5 - uOutlineWidth * 0.5);
                float outlineAlpha = smoothstep(-fw, fw, outlineDist);
                vec4 outlineRGBA = vec4(uOutlineColor.rgb, uOutlineColor.a * outlineAlpha * vColor.a);
                
                finalColor = mix(outlineRGBA, finalColor, alpha);
            }
            
            if (finalColor.a < 0.001) discard; 
            outColor = finalColor;
        }
    ` : `
        precision mediump float;
        varying vec2 vUV; varying vec4 vColor;
        uniform sampler2D uTex; 
        uniform float uOutlineWidth;
        uniform vec4 uOutlineColor;
        
        uniform float uBias;
        uniform float uSmoothing;

        float median3(vec3 v) { return max(min(v.r, v.g), min(max(v.r, v.g), v.b)); }
        ${hasDeriv ? "#extension GL_OES_standard_derivatives : enable" : ""}
        
        void main() {
            vec3 msdf = texture2D(uTex, vUV).rgb;
            float sd = median3(msdf) + uBias; 
            
            float dist = sd - 0.5;
            float fw = ${hasDeriv ? "fwidth(dist) * (uSmoothing * 2.0)" : "(0.04 * (uSmoothing * 2.0))"}; 
            float alpha = smoothstep(-fw, fw, dist);
            
            vec4 finalColor = vec4(vColor.rgb, vColor.a * alpha);

            if (uOutlineWidth > 0.0) {
                float outlineDist = sd - (0.5 - uOutlineWidth * 0.5);
                float outlineAlpha = smoothstep(-fw, fw, outlineDist);
                vec4 outlineRGBA = vec4(uOutlineColor.rgb, uOutlineColor.a * outlineAlpha * vColor.a);
                
                finalColor = mix(outlineRGBA, finalColor, alpha);
            }

            if (finalColor.a < 0.001) discard;
            gl_FragColor = finalColor;
        }
    `;

    const compile = (t, src) => {
        const sh = gl.createShader(t);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error("[Shader Error]:", gl.getShaderInfoLog(sh));
        }
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
        uBias: gl.getUniformLocation(program, "uBias"),
        uSmoothing: gl.getUniformLocation(program, "uSmoothing"),
        uOutlineWidth: gl.getUniformLocation(program, "uOutlineWidth"),
        uOutlineColor: gl.getUniformLocation(program, "uOutlineColor")
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
        
        this._lastBias = 0;
        this._lastSmoothing = 0.5;
        this._lastOutlineWidth = 0.0;
        this._lastOutlineColor = [0,0,0,1];

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

    drawText(font, str, x, y, w, h, size, color, projection, rot = 0, sx = 1, sy = 1, px = 0, py = 0, alpha = 1, flipX = false, flipY = false, options = {}) {
        if (!font || !font.glTexture || !str || str.trim() === "") return;

        const smoothing = options.smoothing ?? 0.5;
        const bias = options.bias ?? 0;
        const outWidth = options.outlineWidth ?? 0;
        const outCol = options.outlineColor ?? [0,0,0,1];
        
        if (this._lastBias !== bias || this._lastSmoothing !== smoothing || this._lastOutlineWidth !== outWidth || 
            this._lastOutlineColor[0] !== outCol[0] || this._lastOutlineColor[1] !== outCol[1] || 
            this._lastOutlineColor[2] !== outCol[2] || this._lastOutlineColor[3] !== outCol[3]) {
            this.flush();
            this._lastBias = bias;
            this._lastSmoothing = smoothing;
            this._lastOutlineWidth = outWidth;
            this._lastOutlineColor = outCol;
        }

        const measurement = options.measurement || FontMath.measureText(font, str, size, options);
        
        const nativeW = measurement.boundsWidth;
        const nativeH = measurement.boundsHeight;
        
        const offsetY = measurement.yMin;
        const targetW = w || nativeW;
        const targetH = h || nativeH;
        
        const safeRot = (typeof rot === 'number' && !isNaN(rot)) ? rot : 0;
        const c = Math.cos(safeRot), s = Math.sin(safeRot);
        const safeSX = (typeof sx === 'number' && !isNaN(sx)) ? sx : 1;
        const safeSY = (typeof sy === 'number' && !isNaN(sy)) ? sy : 1;
        const finalSX = flipX ? -safeSX : safeSX;
        const finalSY = flipY ? -safeSY : safeSY;

        const safePX = (typeof px === 'number' && !isNaN(px)) ? px : 0;
        const safePY = (typeof py === 'number' && !isNaN(py)) ? py : 0;
        const pivotOffsetX = -safePX * targetW * finalSX;
        const pivotOffsetY = -safePY * targetH * finalSY;
        
        if (this.currentTexture !== font.glTexture) {
            this.flush();
            this.currentTexture = font.glTexture;
        }
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        const renderStringVertices = (textColor, textAlpha, shadowOx = 0, shadowOy = 0) => {
            const d = this.bufferData;
            const maxBufferLen = d.length;
            let i = this.bufferIndex;
            const scale = size / font.info.size;
            const lSpacing = (options.letterSpacing || 0) * scale;
            
            const alignLine = options.alignLine || options.alignV || options.verticalAlign || "top";
            let verticalOffset = 0;
            if (alignLine === "mid" || alignLine === "center" || alignLine === "middle") {
                verticalOffset = Math.max(0, (targetH - nativeH) / 2);
            } else if (alignLine === "bottom") {
                verticalOffset = Math.max(0, targetH - nativeH);
            }
            let cy = verticalOffset;

            const r = textColor[0];
            const g = textColor[1];
            const b = textColor[2];
            const a = textAlpha;

            const texW = font.common?.texW || 512;
            const texH = font.common?.texH || 512;
            const invTexW = 1 / texW;
            const invTexH = 1 / texH;

            const lines = measurement.lines;
            const lineWidths = measurement.lineWidths;
            const wordCounts = measurement.wordCounts;
            const numLines = lines.length;

            for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
                const line = lines[lineIdx];
                let cx = 0;

                let alignOffsetX = 0;
                let justifySpaceAdd = 0;

                if (options.align === "center") {
                    alignOffsetX = (targetW - lineWidths[lineIdx]) / 2;
                } else if (options.align === "right") {
                    alignOffsetX = targetW - lineWidths[lineIdx];
                } else if (options.align === "justify") {
                    if (lineIdx < numLines - 1) {
                        const spaces = wordCounts[lineIdx];
                        if (spaces > 0) {
                            const extraSpace = targetW - lineWidths[lineIdx];
                            justifySpaceAdd = extraSpace / spaces;
                        }
                    }
                }

                const lineLen = line.length;
                for (let charIdx = 0; charIdx < lineLen; charIdx++) {
                    const ch = line[charIdx];
                    
                    if (ch === ' ' && options.align === "justify") {
                        cx += justifySpaceAdd;
                    }

                    const gdat = font.chars[ch.charCodeAt(0)];
                    if (!gdat) continue;

                    // Ensure capacity for 6 vertices (48 floats)
                    if (i + 48 >= maxBufferLen) {
                        this.bufferIndex = i;
                        this.flush();
                        i = 0;
                    }

                    const x0 = cx + gdat.ox * scale + alignOffsetX - measurement.xMin;
                    const y0 = cy + gdat.oy * scale - offsetY;
                    const x1 = x0 + gdat.w * scale;
                    const y1 = y0 + gdat.h * scale;

                    const fx0 = x0 * finalSX + pivotOffsetX;
                    const fx1 = x1 * finalSX + pivotOffsetX;
                    const fy0 = y0 * finalSY + pivotOffsetY;
                    const fy1 = y1 * finalSY + pivotOffsetY;

                    const tlX = x + (fx0 * c - fy0 * s) + shadowOx;
                    const tlY = y + (fx0 * s + fy0 * c) + shadowOy;

                    const trX = x + (fx1 * c - fy0 * s) + shadowOx;
                    const trY = y + (fx1 * s + fy0 * c) + shadowOy;

                    const blX = x + (fx0 * c - fy1 * s) + shadowOx;
                    const blY = y + (fx0 * s + fy1 * c) + shadowOy;

                    const brX = x + (fx1 * c - fy1 * s) + shadowOx;
                    const brY = y + (fx1 * s + fy1 * c) + shadowOy;

                    const u0 = gdat.x * invTexW, v0 = gdat.y * invTexH;
                    const u1 = (gdat.x + gdat.w) * invTexW, v1 = (gdat.y + gdat.h) * invTexH;

                    // Triangle 1: TL, TR, BL
                    d[i++] = tlX; d[i++] = tlY; d[i++] = u0; d[i++] = v0; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
                    d[i++] = trX; d[i++] = trY; d[i++] = u1; d[i++] = v0; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
                    d[i++] = blX; d[i++] = blY; d[i++] = u0; d[i++] = v1; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;

                    // Triangle 2: TR, BR, BL
                    d[i++] = trX; d[i++] = trY; d[i++] = u1; d[i++] = v0; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
                    d[i++] = brX; d[i++] = brY; d[i++] = u1; d[i++] = v1; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
                    d[i++] = blX; d[i++] = blY; d[i++] = u0; d[i++] = v1; d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;

                    cx += (gdat.adv * scale) + lSpacing;
                }
                cy += measurement.lineH;
            }
            this.bufferIndex = i;
            if (i >= maxBufferLen - (this.maxGlyphs * this.floatsPerGlyph / 2)) this.flush();
        };

        if (options.shadowEnabled && options.shadowColor) {
            const shCol = options.shadowColor;
            const shAlpha = (options.shadowOpacity ?? 0.5) * alpha;
            const shOffX = options.shadowOffset?.x || 0;
            const shOffY = options.shadowOffset?.y || 0;
            const shBlur = options.shadowBlur ?? 0.5; 
            
            this.flush();
            
            const originalOutlineWidth = this._lastOutlineWidth;
            const originalSmoothing = this._lastSmoothing;

            this._lastOutlineWidth = 0; 
            this._lastSmoothing = shBlur > 0 ? shBlur : originalSmoothing; 
            
            renderStringVertices(shCol, shAlpha, shOffX, shOffY);
            this.flush(); 
            
            this._lastOutlineWidth = originalOutlineWidth;
            this._lastSmoothing = originalSmoothing;
        }

        const col = color || [1, 1, 1, 1];
        const alph = (col[3] ?? 1) * alpha;
        renderStringVertices(col, alph, 0, 0);
    }

    flush() {
        if (this.bufferIndex === 0) return;
        const gl = this.gl; const s = this.s;

        this.cache.useProgram(s.program);
        this.cache.bindVAO(this.vao);
        this.cache.bindTexture(this.currentTexture);

        gl.uniformMatrix4fv(s.uProjection, false, this.currentProjection);
        gl.uniform1f(s.uBias, this._lastBias);
        gl.uniform1f(s.uSmoothing, this._lastSmoothing);
        gl.uniform1f(s.uOutlineWidth, this._lastOutlineWidth);
        gl.uniform4fv(s.uOutlineColor, this._lastOutlineColor);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));
        
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);
        
        this.bufferIndex = 0;
    }
}