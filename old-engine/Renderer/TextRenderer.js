import Config from "../Config/Config.js";
import Mat4 from "../Util/Mat4.js";


const _sharedTextByGL = new WeakMap();

/**
 * Compiles and links the SDF text shader program, and sets up shared state.
 * @param {WebGLRenderingContext | WebGL2RenderingContext} gl
 * @returns {object} Shared state object.
 */
function getShared(gl) {
    let s = _sharedTextByGL.get(gl);
    if (s) return s;

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    const hasDeriv = isWebGL2 || !!gl.getExtension("OES_standard_derivatives");
    const canUseFwidth = hasDeriv;

    // --- Vertex Shader: Use 'in' and 'out' for WebGL2, 'attribute' and 'varying' for WebGL1
    const vsSrc = `
        ${isWebGL2 ? '#version 300 es\n in vec2 aPosition; in vec2 aUV; out vec2 vUV;' : 'attribute vec2 aPosition; attribute vec2 aUV; varying vec2 vUV;'}
        uniform Mat4 uProjection;
        uniform Mat4 uModel;
        void main() {
            gl_Position = uProjection * uModel * vec4(aPosition, 0.0, 1.0);
            vUV = aUV;
        }
    `;

    // --- Fragment Shader (SDF Smoothing Logic) ---
    const fsPreamble = `
        ${isWebGL2 ? '#version 300 es\n precision mediump float; in vec2 vUV; out vec4 outColor;' : '#ifdef GL_ES\n precision mediump float; \n #endif \n varying vec2 vUV;'}
        uniform sampler2D uTex;
        uniform vec4 uColor;
        uniform float uDistRange;

        float median3(vec3 v) {
          return max(min(v.r, v.g), min(max(v.r, v.g), v.b));
        }
    `;

    const fsSrcGood = ` // Uses fwidth (preferred)
        ${fsPreamble}
        ${!isWebGL2 ? '#extension GL_OES_standard_derivatives : enable' : ''}
        void main() {
            vec3 msd = texture(uTex, vUV).rgb;
            float sd = median3(msd);
            float dist = sd - 0.5;
            // fwidth is available via standard WebGL2 or OES_standard_derivatives
            float fw = fwidth(sd);
            float alpha = smoothstep(-fw, fw, dist);
            vec4 finalColor = vec4(uColor.rgb, alpha * uColor.a);
            if (finalColor.a < 0.01) discard;
            ${isWebGL2 ? 'outColor = finalColor;' : 'gl_FragColor = finalColor;'}
        }
    `;

    const fsSrcFallback = ` // Uses uDistRange (if fwidth not available)
        ${fsPreamble}
        void main() {
            vec3 msd = texture(uTex, vUV).rgb;
            float sd = median3(msd);
            float dist = sd - 0.5;
            float smooth = 0.0075 * uDistRange;
            float alpha = smoothstep(-smooth, smooth, dist);
            vec4 finalColor = vec4(uColor.rgb, alpha * uColor.a);
            if (finalColor.a < 0.01) discard;
            ${isWebGL2 ? 'outColor = finalColor;' : 'gl_FragColor = finalColor;'}
        }
    `;

    const fsSrc = canUseFwidth ? fsSrcGood : fsSrcFallback;
    if (!canUseFwidth) {
        console.warn("[TextRenderer] OES_standard_derivatives not supported — using fallback smoothing.");
    }

    // --- Shader Compilation ---
    const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(sh));
        }
        return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }

    const aPosition   = gl.getAttribLocation(program, "aPosition");
    const aUV         = gl.getAttribLocation(program, "aUV");
    const uProjection = gl.getUniformLocation(program, "uProjection");
    const uModel      = gl.getUniformLocation(program, "uModel");
    const uTex        = gl.getUniformLocation(program, "uTex");
    const uColor      = gl.getUniformLocation(program, "uColor");
    const uDistRange  = gl.getUniformLocation(program, "uDistRange");

    // Use WebGL2 VAO API if available, otherwise fallback to extension
    const vaoExt = isWebGL2 ? null : gl.getExtension("OES_vertex_array_object");
    const vaoCreate = isWebGL2 ? () => gl.createVertexArray() : (vaoExt ? vaoExt.createVertexArrayOES.bind(vaoExt) : null);
    const vaoBind = isWebGL2 ? gl.bindVertexArray.bind(gl) : (vaoExt ? vaoExt.bindVertexArrayOES.bind(vaoExt) : null);
    const vaoDelete = isWebGL2 ? gl.deleteVertexArray.bind(gl) : (vaoExt ? vaoExt.deleteVertexArrayOES.bind(vaoExt) : null);

    if (!vaoBind) {
        console.warn("[TextRenderer] Vertex Array Object (VAO) support not found. Performance may be degraded.");
    }

    const shared = {
        program, aPosition, aUV, uProjection, uModel, uTex, uColor, uDistRange,
        vaoCreate, vaoBind, vaoDelete, vaoCache: new Map(),
        lastProgram: null,
        // Use Mat4.create()
        projectionCache: { w: 0, h: 0, m: Mat4.create() },
        lastBoundTexture: null,
    };

    _sharedTextByGL.set(gl, shared);
    return shared;
}

export default class TextRenderer {
    /**
     * @param {WebGLRenderingContext | WebGL2RenderingContext} gl
     */
    constructor(gl) {
        this.gl = gl;
        this.s = getShared(gl);
        this.font = null;
        this.texture = null;
        // Use Mat4.create()
        this._model = Mat4.create();
    }

    // === Load Font XML + Texture ===
    async loadFont(fontUrl, imageUrl) {
        const xml = new DOMParser().parseFromString(
            await (await fetch(fontUrl)).text(),
            "application/xml"
        );

        const chars = [...xml.querySelectorAll("char")].map(c => ({
            id: +c.getAttribute("id"),
            x: +c.getAttribute("x"),
            y: +c.getAttribute("y"),
            width: +c.getAttribute("width"),
            height: +c.getAttribute("height"),
            xoffset: +c.getAttribute("xoffset"),
            yoffset: +c.getAttribute("yoffset"),
            xadvance: +c.getAttribute("xadvance"),
        }));

        const common = xml.querySelector("common");
        const info = xml.querySelector("info");
        const df = xml.querySelector("distanceField");

        this.font = {
            chars,
            lineHeight: +common.getAttribute("lineHeight"),
            scaleW: +common.getAttribute("scaleW"),
            scaleH: +common.getAttribute("scaleH"),
            size: +info.getAttribute("size"),
            distanceRange: +(df?.getAttribute("distanceRange") || 4.0),
        };

        this.texture = await this._loadTexture(imageUrl);
    }

    async _loadTexture(url) {
        const gl = this.gl;
        const tex = gl.createTexture();
        const img = new Image();
        img.src = url;
        await img.decode();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        // Use internal format RGBA in WebGL2, which is better practice
        const internalFormat = gl.RGBA;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;

        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, img);

        const pixelArt = Config.PIXEL_ART ?? false;
        // Use gl.LINEAR for SDF text, generally, unless pixel art is forced.
        // SDF fonts rely on linear filtering for smooth edges.
        const filter = pixelArt ? gl.NEAREST : gl.LINEAR;
        
        // Use gl.LINEAR for MAG filter for best SDF quality
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // WebGL1 requires power-of-two texture for mipmaps, but we're not using them.
        // For non-power-of-two textures in WebGL1, we must use gl.CLAMP_TO_EDGE and gl.NEAREST/gl.LINEAR
        // Since we are using GL_LINEAR and CLAMP_TO_EDGE, this is generally safe for non-POT.

        return tex;
    }

    // === Konversi Warna HEX ke RGBA ===
    parseColor(color) {
        if (typeof color === "string" && color.startsWith("#")) {
            color = color.slice(1);
            const len = color.length;
            const parse = (c) => parseInt(c, 16) / 255;
            let r, g, b, a = 1;

            if (len === 3 || len === 4) {
                r = parse(color[0] + color[0]);
                g = parse(color[1] + color[1]);
                b = parse(color[2] + color[2]);
                if (len === 4) a = parse(color[3] + color[3]);
            } else if (len === 6 || len === 8) {
                r = parse(color.slice(0, 2));
                g = parse(color.slice(2, 4));
                b = parse(color.slice(4, 6));
                if (len === 8) a = parse(color.slice(6, 8));
            } else {
                 return [1, 1, 1, 1]; // Fallback to white if format is wrong
            }
            return [r, g, b, a];
        }
        if (Array.isArray(color)) return color;
        return [1, 1, 1, 1];
    }

    // === Gambar Teks ke Layar ===
    drawText(text, x = 0, y = 0, color = "#FFFFFF", fontSize = 96, projectionArg = null) {
        const gl = this.gl, s = this.s;
        if (!this.font || !this.texture) return;
        if (!text) return;

        color = this.parseColor(color);
        const { chars, scaleW, scaleH, size, distanceRange } = this.font;
        const scale = fontSize / size;
        let px = x;
        let py = y;

        const verts = [];
        const uvs = [];

        // 1. Build Geometry
        for (const ch of text) {
            const g = chars.find(c => c.id === ch.charCodeAt(0));
            if (!g) continue;

            const gw = g.width * scale;
            const gh = g.height * scale;
            const x0 = px + g.xoffset * scale;
            const y0 = py + g.yoffset * scale;
            const x1 = x0 + gw;
            const y1 = y0 + gh;

            const u0 = g.x / scaleW;
            const v0 = g.y / scaleH;
            const u1 = (g.x + g.width) / scaleW;
            const v1 = (g.y + g.height) / scaleH;

            // Quad vertices (2 triangles)
            verts.push(
                x0, y0, x1, y0, x0, y1,
                x1, y0, x1, y1, x0, y1
            );
            // Quad UVs (matching vertices)
            uvs.push(
                u0, v0, u1, v0, u0, v1,
                u1, v0, u1, v1, u0, v1
            );

            px += g.xadvance * scale;
        }

        if (!verts.length) return;

        // 2. Setup VAO (if available) - Create buffers on demand
        // Since geometry changes every frame, we don't cache VAOs/VBOs,
        // we create them, bind them, use them, and delete them immediately
        // (This assumes low-frequency text drawing or that the performance hit
        // of frequent buffer creation/deletion is acceptable vs. constant buffer updates).

        let vao = null;
        if (s.vaoBind) {
            vao = s.vaoCreate();
            s.vaoBind(vao);
        }

        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(s.aPosition);
        gl.vertexAttribPointer(s.aPosition, 2, gl.FLOAT, false, 0, 0);

        const uvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(s.aUV);
        gl.vertexAttribPointer(s.aUV, 2, gl.FLOAT, false, 0, 0);

        // 3. Setup Program and Uniforms
        if (s.lastProgram !== s.program) { gl.useProgram(s.program); s.lastProgram = s.program; }

        // --- Projection ---
        let proj = projectionArg ? projectionArg.matrix : null;
        if (!proj) {
            const w = gl.canvas.width, h = gl.canvas.height;
            if (s.projectionCache.w !== w || s.projectionCache.h !== h) {
                s.projectionCache.w = w; s.projectionCache.h = h;
                // Use Mat4.ortho
                Mat4.ortho(s.projectionCache.m, 0, w, h, 0, -1, 1);
            }
            proj = s.projectionCache.m;
        }
        gl.uniformMatrix4fv(s.uProjection, false, proj);

        // --- Model Matrix ---
        // Use Mat4.identity
        Mat4.identity(this._model);
        gl.uniformMatrix4fv(s.uModel, false, this._model);

        // --- Other Uniforms ---
        gl.uniform4fv(s.uColor, color);
        gl.uniform1f(s.uDistRange, distanceRange);

        // --- Texture ---
        if (s.lastBoundTexture !== this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(s.uTex, 0);
            s.lastBoundTexture = this.texture;
        }

        // 4. Draw
        gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);

        // 5. Cleanup
        if (s.vaoBind) {
            s.vaoBind(null); // Unbind VAO
            s.vaoDelete(vao);
        }
        // Delete VBOs immediately after use, as they are part of dynamic text geometry
        gl.deleteBuffer(vbo);
        gl.deleteBuffer(uvbo);

        // Revert bindings if no VAO was used
        if (!s.vaoBind) {
            gl.disableVertexAttribArray(s.aPosition);
            gl.disableVertexAttribArray(s.aUV);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
    }
}