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
        gl,
        isWebGL2,
        program,
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

    _initVAO() {
        const gl = this.gl;
        const stride = this.floatsPerVertex * 4;

        this.cache.bindVAO(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

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
                adv: +c.getAttribute("xadvance")
            };
        });

        const common = xml.querySelector("common");
        const distField = xml.querySelector("distanceField");
        const info = xml.querySelector("info");

        this.font = {
            chars,
            texW: +common.getAttribute("scaleW"),
            texH: +common.getAttribute("scaleH"),
            base: +common.getAttribute("base"),
            lineHeight: +common.getAttribute("lineHeight"),
            size: +info.getAttribute("size"),
            distance: +(distField?.getAttribute("distanceRange") ?? 4)
        };

        const img = new Image();
        img.src = texURL;
        img.crossOrigin = "anonymous";
        await img.decode();

        this.texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img
        );

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    }

    measureText(str, size, fontOverride = null) {
        const font = fontOverride || this.font;
        if (!font || !str) {
            return { width: 0, height: 0, xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
        }

        const scale = size / font.size;
        let cx = 0;

        let xMin = Infinity;
        let yMin = Infinity;
        let xMax = -Infinity;
        let yMax = -Infinity;

        for (const ch of str) {
            const gdat = font.chars[ch.charCodeAt(0)];
            if (!gdat) continue;

            const x0 = cx + gdat.ox * scale;
            const y0 = gdat.oy * scale;
            const x1 = x0 + gdat.w * scale;
            const y1 = y0 + gdat.h * scale;

            if (x0 < xMin) xMin = x0;
            if (y0 < yMin) yMin = y0;
            if (x1 > xMax) xMax = x1;
            if (y1 > yMax) yMax = y1;

            cx += gdat.adv * scale;
        }

        if (xMin === Infinity) {
            xMin = 0; xMax = cx; yMin = 0; yMax = font.lineHeight * scale;
        }

        return {
            width: cx,
            boundsWidth: xMax - xMin,
            boundsHeight: yMax - yMin,
            xMin, yMin, xMax, yMax,
            baseline: font.base * scale
        };
    }

    drawText(str, x, y, w, h, size, color, projection, rot = 0, sx = 1, sy = 1, px = 0, py = 0, alpha = 1) {
        if (!this.font || !this.texture || !str || str.trim() === "") return;

        const font = this.font;
        const measurement = this.measureText(str, size);

        const nativeW = measurement.boundsWidth;
        const nativeH = measurement.boundsHeight;

        const offsetX = measurement.xMin;
        const offsetY = measurement.yMin;

        const targetW = w || nativeW;
        const targetH = h || nativeH;

        const ratioX = (nativeW > 0 ? targetW / nativeW : 1);
        const ratioY = (nativeH > 0 ? targetH / nativeH : 1);

        const c = Math.cos(rot);
        const s = Math.sin(rot);

        const pivotOffsetX = -px * targetW * sx;
        const pivotOffsetY = -py * targetH * sy;

        const transform = (localX, localY) => {
            const finalX = localX * ratioX * sx;
            const finalY = localY * ratioY * sy;

            const ox = finalX + pivotOffsetX;
            const oy = finalY + pivotOffsetY;

            return {
                x: x + (ox * c - oy * s),
                y: y + (ox * s + oy * c)
            };
        };

        if (this.currentTexture !== this.texture) {
            this.flush();
            this.currentTexture = this.texture;
        }

        if (projection !== this.currentProjection) {
            this.flush();
            this.currentProjection = projection;
        }

        const d = this.bufferData;
        let i = this.bufferIndex;

        const safeColor = color || [1, 1, 1, 1];
        const r = safeColor[0];
        const g = safeColor[1];
        const b = safeColor[2];
        const a = (safeColor[3] !== undefined ? safeColor[3] : 1) * alpha;

        const scaleFont = size / font.size;
        let cx = 0;

        for (const ch of str) {
            const gdat = font.chars[ch.charCodeAt(0)];
            if (!gdat) continue;

            const x0 = cx + gdat.ox * scaleFont;
            const y0 = gdat.oy * scaleFont;
            const x1 = x0 + gdat.w * scaleFont;
            const y1 = y0 + gdat.h * scaleFont;

            const pTL = transform(x0 - offsetX, y0 - offsetY);
            const pTR = transform(x1 - offsetX, y0 - offsetY);
            const pBL = transform(x0 - offsetX, y1 - offsetY);
            const pBR = transform(x1 - offsetX, y1 - offsetY);

            const u0 = gdat.x / font.texW;
            const v0 = gdat.y / font.texH;
            const u1 = (gdat.x + gdat.w) / font.texW;
            const v1 = (gdat.y + gdat.h) / font.texH;

            const push = (vtx, u, v) => {
                d[i++] = vtx.x; d[i++] = vtx.y;
                d[i++] = u; d[i++] = v;
                d[i++] = r; d[i++] = g; d[i++] = b; d[i++] = a;
            };

            push(pTL, u0, v0);
            push(pTR, u1, v0);
            push(pBL, u0, v1);
            push(pTR, u1, v0);
            push(pBR, u1, v1);
            push(pBL, u0, v1);

            cx += gdat.adv * scaleFont;
        }

        this.bufferIndex = i;

        if (i >= this.bufferData.length - this.floatsPerGlyph) {
            this.flush();
        }
        this._lastDist = font.distance;
    }

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