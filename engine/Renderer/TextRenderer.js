import Mat4 from "../Util/Mat4.js";

const _shared = new WeakMap();

// =====================================================================================
// SHARED SHADER (HANYA 1 PER GL)
// =====================================================================================
function getShared(gl) {
    let s = _shared.get(gl);
    if (s) return s;

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    const hasDeriv = isWebGL2 || !!gl.getExtension("OES_standard_derivatives");

    // ---------------------------------------------------------------------
    // VERTEX SHADER (pos + uv + color)
    // ---------------------------------------------------------------------
    const vs = isWebGL2 ? `#version 300 es
        layout(location=0) in vec2 aPos;
        layout(location=1) in vec2 aUV;
        layout(location=2) in vec4 aColor;

        uniform mat4 uProjection;

        out vec2 vUV;
        out vec4 vColor;

        void main() {
            vUV = aUV;
            vColor = aColor;
            gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
        }
    ` : `
        attribute vec2 aPos;
        attribute vec2 aUV;
        attribute vec4 aColor;

        uniform mat4 uProjection;

        varying vec2 vUV;
        varying vec4 vColor;

        void main() {
            vUV = aUV;
            vColor = aColor;
            gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
        }
    `;

    // ---------------------------------------------------------------------
    // FRAGMENT SHADER (MSDF)
    // ---------------------------------------------------------------------
    const fs = isWebGL2 ? `#version 300 es
        precision mediump float;

        in vec2 vUV;
        in vec4 vColor;

        out vec4 outColor;

        uniform sampler2D uTex;
        uniform float uDist;

        float median3(vec3 v) {
            return max(min(v.r, v.g), min(max(v.r, v.g), v.b));
        }

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

        varying vec2 vUV;
        varying vec4 vColor;

        uniform sampler2D uTex;
        uniform float uDist;

        float median3(vec3 v) {
            return max(min(v.r, v.g), min(max(v.r, v.g), v.b));
        }

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

    // Compile util
    const compile = (t, src) => {
        const sh = gl.createShader(t);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
            console.error("Shader error:", gl.getShaderInfoLog(sh));
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Link error:", gl.getProgramInfoLog(program));
    }

    s = {
        gl, isWebGL2, program,
        uProjection: gl.getUniformLocation(program, "uProjection"),
        uTex: gl.getUniformLocation(program, "uTex"),
        uDist: gl.getUniformLocation(program, "uDist")
    };

    _shared.set(gl, s);
    return s;
}



// =====================================================================================
// TEXT RENDERER — PER GLYPH COLOR — FULL BATCH
// =====================================================================================

export default class TextRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;
        this.s = getShared(this.gl);

        // BATCH
        this.maxGlyphs = 20000;
        this.floatsPerVertex = 2 + 2 + 4;  // pos2 + uv2 + color4
        this.vertsPerGlyph = 6;
        this.floatsPerGlyph = this.floatsPerVertex * this.vertsPerGlyph;

        this.bufferData = new Float32Array(this.maxGlyphs * this.floatsPerGlyph);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.currentProjection = null;
        this._lastDist = 4;

        this.vbo = this.gl.createBuffer();
        this.vao = this.ctx.createVAO();

        this._initVAO();
    }

    // -------------------------------------------------------------------------
    // VAO
    // -------------------------------------------------------------------------
    _initVAO() {
        const gl = this.gl;
        const stride = this.floatsPerVertex * 4;

        this.cache.bindVAO(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        // aPos
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

        // aUV
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);

        // aColor
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }


    // -------------------------------------------------------------------------
    // LOAD MSDF FONT
    // -------------------------------------------------------------------------
    async loadFont(xmlURL, texURL) {
        const xml = new DOMParser().parseFromString(
            await (await fetch(xmlURL)).text(),
            "application/xml"
        );

        const chars = {};
        xml.querySelectorAll("char").forEach(c => {
            chars[c.getAttribute("id")] = {
                x: +c.getAttribute("x"),
                y: +c.getAttribute("y"),
                w: +c.getAttribute("width"),
                h: +c.getAttribute("height"),
                ox: +c.getAttribute("xoffset"),
                oy: +c.getAttribute("yoffset"),
                adv: +c.getAttribute("xadvance"),
            };
        });

        const common = xml.querySelector("common");
        const distField = xml.querySelector("distanceField");

        this.font = {
            chars,
            texW: +common.getAttribute("scaleW"),
            texH: +common.getAttribute("scaleH"),
            size: +(xml.querySelector("info").getAttribute("size")),
            distance: +(distField?.getAttribute("distanceRange") ?? 4),
        };

        // Load texture
        const img = new Image();
        img.src = texURL;
        await img.decode();

        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            img
        );

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }


    // -------------------------------------------------------------------------
    // ADD TO BATCH
    // -------------------------------------------------------------------------
    drawText(str, x, y, size, color, projection) {
        if (!this.font || !this.texture || !str) return;

        const gl = this.gl;
        const font = this.font;

        const scale = size / font.size;
        const chars = font.chars;

        // Jika teks pakai texture lain → flush dulu
        if (this.currentTexture !== this.texture) {
            this.flush();
            this.currentTexture = this.texture;
        }

        // Jika projection berbeda → flush dulu
        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        let cx = x;
        const cy = y;

        const d = this.bufferData;
        let i = this.bufferIndex;

        // parse color
        const r = color[0], g = color[1], b = color[2], a = color[3];

        for (const ch of str) {
            const gdat = chars[ch.charCodeAt(0)];
            if (!gdat) continue;

            const x0 = cx + gdat.ox * scale;
            const y0 = cy + gdat.oy * scale;
            const x1 = x0 + gdat.w * scale;
            const y1 = y0 + gdat.h * scale;

            const u0 = gdat.x / font.texW;
            const v0 = gdat.y / font.texH;
            const u1 = (gdat.x + gdat.w) / font.texW;
            const v1 = (gdat.y + gdat.h) / font.texH;

            // vertex (pos, uv, color)
            const push = (px, py, u, v) => {
                d[i++] = px;
                d[i++] = py;
                d[i++] = u;
                d[i++] = v;
                d[i++] = r;
                d[i++] = g;
                d[i++] = b;
                d[i++] = a;
            };

            push(x0, y0, u0, v0);
            push(x1, y0, u1, v0);
            push(x0, y1, u0, v1);

            push(x1, y0, u1, v0);
            push(x1, y1, u1, v1);
            push(x0, y1, u0, v1);

            cx += gdat.adv * scale;
        }

        this.bufferIndex = i;

        if (i >= this.bufferData.length - this.floatsPerGlyph) {
            this.flush();
        }

        this._lastDist = font.distance;
    }


    // -------------------------------------------------------------------------
    // FLUSH BATCH
    // -------------------------------------------------------------------------
    flush() {
        if (this.bufferIndex === 0) return;

        const gl = this.gl;
        const s = this.s;

        this.cache.useProgram(s.program);
        this.cache.bindVAO(this.vao);
        this.cache.bindTexture(this.currentTexture);

        gl.uniformMatrix4fv(s.uProjection, false, this.currentProjection);
        gl.uniform1f(s.uDist, this._lastDist);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(
            gl.ARRAY_BUFFER,
            0,
            this.bufferData.subarray(0, this.bufferIndex)
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            this.bufferIndex / this.floatsPerVertex
        );

        this.bufferIndex = 0;
    }
}
