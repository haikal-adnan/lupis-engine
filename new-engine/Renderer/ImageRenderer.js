// engine/Renderer/ImageRenderer.js

import GLStateCache from "./GLStateCache.js";

export default class ImageRenderer {
    constructor(ctx) {
        this.ctx = ctx;               // GLContext instance
        this.gl = ctx.gl;
        this.cache = new GLStateCache(this.gl);

        this.maxSprites = 10000;      // batching besar
        this.verticesPerQuad = 6;     // 2 triangles
        this.floatsPerVertex = 4;     // x,y,u,v
        this.floatsPerQuad = this.verticesPerQuad * this.floatsPerVertex;

        // Buffer all vertices here
        this.bufferData = new Float32Array(this.maxSprites * this.floatsPerQuad);
        this.bufferIndex = 0;

        // Currently bound texture (for grouping batches)
        this.currentTexture = null;

        this._createShader();
        this._createBuffers();
    }

    // ================================================================
    //  SHADER PROGRAM (WebGL2 + fallback WebGL1)
    // ================================================================
    _createShader() {
        const gl = this.gl;
        const isWebGL2 = this.ctx.isWebGL2;

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

        // --------------------------
        // Fragment Shader
        // --------------------------
        const fs = isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV;
            uniform sampler2D uTexture;

            out vec4 outColor;

            void main() {
                outColor = texture(uTexture, vUV);
            }
        ` : `
            precision mediump float;

            varying vec2 vUV;
            uniform sampler2D uTexture;

            void main() {
                gl_FragColor = texture2D(uTexture, vUV);
            }
        `;

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
            console.error("LINK Error:", gl.getProgramInfoLog(this.program));
        }

        this.uProjection = gl.getUniformLocation(this.program, "uProjection");
        this.uTexture = gl.getUniformLocation(this.program, "uTexture");
    }

    // ================================================================
    //  BUFFER + VAO CREATION
    // ================================================================
    _createBuffers() {
        const gl = this.gl;

        // create VAO
        this.vao = this.ctx.createVAO();
        this.ctx.bindVAO(this.vao);

        // create VBO
        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        // attribute pointers
        const stride = this.floatsPerVertex * 4;

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(
            0,
            2,
            gl.FLOAT,
            false,
            stride,
            0
        );

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(
            1,
            2,
            gl.FLOAT,
            false,
            stride,
            2 * 4
        );

        // unbind
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.ctx.bindVAO(null);
    }

    // ================================================================
    //  DRAW (batch)
    // ================================================================
    draw(textureRes, frame, x, y, w, h) {
        // if texture different → flush batch dulu
        if (this.currentTexture !== textureRes.glTexture) {
            this.flushPending();
            this.currentTexture = textureRes.glTexture;
        }

        const texW = textureRes.width;
        const texH = textureRes.height;

        const u0 = frame.sx / texW;
        const v0 = frame.sy / texH;
        const u1 = (frame.sx + frame.sw) / texW;
        const v1 = (frame.sy + frame.sh) / texH;

        // quad
        const x0 = x;
        const y0 = y;
        const x1 = x + w;
        const y1 = y + h;

        const data = this.bufferData;
        let i = this.bufferIndex;

        // 6 vertices (2 triangles)
        // v0
        data[i++] = x0; data[i++] = y0; data[i++] = u0; data[i++] = v0;
        data[i++] = x1; data[i++] = y0; data[i++] = u1; data[i++] = v0;
        data[i++] = x0; data[i++] = y1; data[i++] = u0; data[i++] = v1;

        // v1
        data[i++] = x1; data[i++] = y0; data[i++] = u1; data[i++] = v0;
        data[i++] = x1; data[i++] = y1; data[i++] = u1; data[i++] = v1;
        data[i++] = x0; data[i++] = y1; data[i++] = u0; data[i++] = v1;

        this.bufferIndex = i;

        // if full → flush sekarang
        if (this.bufferIndex >= this.bufferData.length) {
            this.flushPending();
        }
    }

    // ================================================================
    //  FLUSH BATCH (dipanggil oleh RendererManager)
    // ================================================================
    flush(projectionMatrix) {
        if (this.bufferIndex === 0) return;

        const gl = this.gl;

        this.cache.useProgram(this.program);
        this.cache.bindTexture(this.currentTexture);
        this.cache.bindVAO(this.vao, this.ctx);

        gl.uniformMatrix4fv(this.uProjection, false, projectionMatrix);
        gl.uniform1i(this.uTexture, 0);

        // upload partial data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));

        const vertexCount = this.bufferIndex / this.floatsPerVertex;
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        this.bufferIndex = 0;
    }

    // digunakan internal bila texture berubah
    flushPending() {
        if (this.bufferIndex > 0) {
            // Flush but without projection (will be called later)
            // just reset buffer
        }
        this.bufferIndex = 0;
    }
}
