// engine/Renderer/TextRenderer.js

import GLStateCache from "./GLStateCache.js";

export default class TextRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = new GLStateCache(this.gl);

        this.maxGlyphs = 8000;            // Banyak glyph yang bisa di-batch
        this.floatsPerVertex = 4;        // x, y, u, v
        this.verticesPerQuad = 6;        // 2 triangles (x6)
        this.floatsPerQuad = this.floatsPerVertex * this.verticesPerQuad;

        this.bufferData = new Float32Array(this.maxGlyphs * this.floatsPerQuad);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.currentFont = null;

        this._createShader();
        this._createBuffers();
    }

    // ============================================================
    //  Shader MSDF (WebGL2 + fallback WebGL1)
    // ============================================================
    _createShader() {
        const gl = this.gl;
        const isWebGL2 = this.ctx.isWebGL2;
        const hasDeriv = isWebGL2 || this.ctx.derivativesExt;

        // --------------------------
        // Vertex Shader
        // --------------------------
        const vs = isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;

            uniform mat4 uProjection;

            out vec2 vUV;

            void main() {
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
                vUV = aUV;
            }
        ` : `
            attribute vec2 aPos;
            attribute vec2 aUV;

            uniform mat4 uProjection;
            varying vec2 vUV;

            void main() {
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
                vUV = aUV;
            }
        `;

        // ================================================================
        //  FRAGMENT SHADER (MSDF)
        //  - If derivative available: use fwidth (ideal)
        //  - Else: use fallback smoothing
        // ================================================================
        const fs_header = isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV;
            out vec4 outColor;

            uniform sampler2D uTexture;
            uniform vec4 uColor;
            uniform float uDist;       // distanceRange MSDF
        ` : `
            precision mediump float;
            varying vec2 vUV;

            uniform sampler2D uTexture;
            uniform vec4 uColor;
            uniform float uDist;
        `;

        const fs_msdf_core = hasDeriv ? `
            // MSDF median edge
            float median3(vec3 v) {
                return max(min(v.r, v.g), min(max(v.r, v.g), v.b));
            }

            void main() {
                vec3 sample = texture2D(uTexture, vUV).rgb;
                float sd = median3(sample);

                // fwidth smoothing (high quality, like TextMeshPro)
                float width = fwidth(sd) * uDist;
                float alpha = smoothstep(0.5 - width, 0.5 + width, sd);

                if (alpha < 0.01) discard;

                ${isWebGL2 ? "outColor = vec4(uColor.rgb, alpha * uColor.a);" 
                           : "gl_FragColor = vec4(uColor.rgb, alpha * uColor.a);" }
            }
        `
        :
        `
            // Fallback if fwidth not available
            float median3(vec3 v) {
                return max(min(v.r, v.g), min(max(v.r, v.g), v.b));
            }

            void main() {
                vec3 sample = texture2D(uTexture, vUV).rgb;
                float sd = median3(sample);

                float smooth = 0.0075 * uDist;
                float alpha = smoothstep(0.5 - smooth, 0.5 + smooth, sd);

                if (alpha < 0.01) discard;

                ${isWebGL2 ? "outColor = vec4(uColor.rgb, alpha * uColor.a);" 
                           : "gl_FragColor = vec4(uColor.rgb, alpha * uColor.a);" }
            }
        `;

        const fs = (hasDeriv ? fs_header + (isWebGL2 ? "" : "#extension GL_OES_standard_derivatives : enable\n") + fs_msdf_core
                             : fs_header + fs_msdf_core);

        // Compile & link
        const vsShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vsShader, vs);
        gl.compileShader(vsShader);
        if (!gl.getShaderParameter(vsShader, gl.COMPILE_STATUS)) {
            console.error("VS Error:", gl.getShaderInfoLog(vsShader));
        }

        const fsShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fsShader, fs);
        gl.compileShader(fsShader);
        if (!gl.getShaderParameter(fsShader, gl.COMPILE_STATUS)) {
            console.error("FS Error:", gl.getShaderInfoLog(fsShader));
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vsShader);
        gl.attachShader(this.program, fsShader);

        if (!isWebGL2) {
            gl.bindAttribLocation(this.program, 0, "aPos");
            gl.bindAttribLocation(this.program, 1, "aUV");
        }

        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("LINK ERROR:", gl.getProgramInfoLog(this.program));
        }

        this.uProjection = gl.getUniformLocation(this.program, "uProjection");
        this.uTexture = gl.getUniformLocation(this.program, "uTexture");
        this.uColor = gl.getUniformLocation(this.program, "uColor");
        this.uDist = gl.getUniformLocation(this.program, "uDist");
    }

    // ============================================================
    //  BUFFERS + VAO
    // ============================================================
    _createBuffers() {
        const gl = this.gl;

        this.vao = this.ctx.createVAO();
        this.ctx.bindVAO(this.vao);

        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        const stride = this.floatsPerVertex * 4;

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * 4);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.ctx.bindVAO(null);
    }

    // ============================================================
    //  LOAD FONT
    // ============================================================
    async loadFont(fontXMLUrl, imageUrl) {
        const xml = new DOMParser().parseFromString(
            await (await fetch(fontXMLUrl)).text(),
            "application/xml"
        );

        const chars = {};
        [...xml.querySelectorAll("char")].forEach(c => {
            chars[c.getAttribute("id")] = {
                x: +c.getAttribute("x"),
                y: +c.getAttribute("y"),
                w: +c.getAttribute("width"),
                h: +c.getAttribute("height"),
                ox: +c.getAttribute("xoffset"),
                oy: +c.getAttribute("yoffset"),
                adv: +c.getAttribute("xadvance")
            };
        });

        const common = xml.querySelector("common");
        const df = xml.querySelector("distanceField");

        const img = new Image();
        img.src = imageUrl;
        await img.decode();

        const tex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        this.fontTexture = tex;
        this.currentTexture = tex;

        this.font = {
            chars,
            texWidth: +common.getAttribute("scaleW"),
            texHeight: +common.getAttribute("scaleH"),
            lineHeight: +common.getAttribute("lineHeight"),
            distanceRange: +(df?.getAttribute("distanceRange") || 4)
        };
    }

    // ============================================================
    //  RENDER TEXT → BATCH
    // ============================================================
    fill(text, x, y, size = 32, color = [1, 1, 1, 1]) {
        const font = this.font;
        const chars = font.chars;

        const scale = size / font.lineHeight;
        let cursorX = x;

        const texW = font.texWidth;
        const texH = font.texHeight;

        for (const ch of text) {
            const g = chars[ch.charCodeAt(0)];
            if (!g) continue;

            const gw = g.w * scale;
            const gh = g.h * scale;
            const x0 = cursorX + g.ox * scale;
            const y0 = y + g.oy * scale;
            const x1 = x0 + gw;
            const y1 = y0 + gh;

            const u0 = g.x / texW;
            const v0 = g.y / texH;
            const u1 = (g.x + g.w) / texW;
            const v1 = (g.y + g.h) / texH;

            const d = this.bufferData;
            let i = this.bufferIndex;

            d[i++] = x0; d[i++] = y0; d[i++] = u0; d[i++] = v0;
            d[i++] = x1; d[i++] = y0; d[i++] = u1; d[i++] = v0;
            d[i++] = x0; d[i++] = y1; d[i++] = u0; d[i++] = v1;

            d[i++] = x1; d[i++] = y0; d[i++] = u1; d[i++] = v0;
            d[i++] = x1; d[i++] = y1; d[i++] = u1; d[i++] = v1;
            d[i++] = x0; d[i++] = y1; d[i++] = u0; d[i++] = v1;

            cursorX += g.adv * scale;

            this.bufferIndex = i;

            if (i >= this.bufferData.length) this.flush();
        }

        this.color = color;
    }

    // ============================================================
    //  FLUSH BATCH
    // ============================================================
    flush(projection) {
        if (this.bufferIndex === 0) return;

        const gl = this.gl;

        this.cache.useProgram(this.program);
        this.cache.bindTexture(this.fontTexture);
        this.cache.bindVAO(this.vao, this.ctx);

        gl.uniformMatrix4fv(this.uProjection, false, projection);
        gl.uniform4fv(this.uColor, this.color);
        gl.uniform1f(this.uDist, this.font.distanceRange);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));

        const vertexCount = this.bufferIndex / this.floatsPerVertex;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        this.bufferIndex = 0;
    }
}
