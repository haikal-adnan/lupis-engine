// engine/Renderer/Entity/ImageRenderer.js
import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export default class ImageRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;

        this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;

        this.maxSprites = 20000;
        this.verticesPerQuad = 6;
        this.floatsPerVertex = 5; // x, y, u, v, alpha
        this.floatsPerQuad = this.verticesPerQuad * this.floatsPerVertex;

        this.bufferData = new Float32Array(this.maxSprites * this.floatsPerQuad);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.currentPixelPerfect = null;
        this.lastProjection = null;

        this._createShader();
        this._createBuffers();
    }

    _createShader() {
        const gl = this.gl;
        // Shader Vertex sederhana yang menerima Alpha
        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;
            layout(location=2) in float aAlpha;
            uniform mat4 uProjection;
            out vec2 vUV;
            out float vAlpha;
            void main(){
                vUV = aUV;
                vAlpha = aAlpha;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        ` : `
            attribute vec2 aPos;
            attribute vec2 aUV;
            attribute float aAlpha;
            uniform mat4 uProjection;
            varying vec2 vUV;
            varying float vAlpha;
            void main(){
                vUV = aUV;
                vAlpha = aAlpha;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        `;

        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV;
            in float vAlpha;
            out vec4 outColor;
            uniform sampler2D uTex;
            void main(){
                vec4 c = texture(uTex, vUV);
                c.a *= vAlpha;
                outColor = c;
            }
        ` : `
            precision mediump float;
            varying vec2 vUV;
            varying float vAlpha;
            uniform sampler2D uTex;
            void main(){
                vec4 c = texture2D(uTex, vUV);
                c.a *= vAlpha;
                gl_FragColor = c;
            }
        `;

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
            gl.bindAttribLocation(this.program, 1, "aUV");
            gl.bindAttribLocation(this.program, 2, "aAlpha");
        }
        
        gl.linkProgram(this.program);
        this.uProjection = gl.getUniformLocation(this.program, "uProjection");
        this.uTex = gl.getUniformLocation(this.program, "uTex");
    }

    _createBuffers() {
        const gl = this.gl;
        this.vbo = gl.createBuffer();
        this.vao = this.ctx.createVAO();

        this.cache.bindVAO(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        const stride = this.floatsPerVertex * 4;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    // --- UPDATE UTAMA: Parameter Transformasi Lengkap ---
    draw(texRes, frame, x, y, w, h, rot, sx, sy, px, py, projection, pixelPerfect = false, alpha = 1) {
        if (!projection) return;
        this.lastProjection = projection;

        if (this.currentTexture !== texRes.glTexture) {
            this.flush();
            this.currentTexture = texRes.glTexture;
        }

        if (this.currentPixelPerfect !== pixelPerfect) {
            this.flush();
            this.currentPixelPerfect = pixelPerfect;
        }

        // 1. Kalkulasi Vertex menggunakan Helper
        const v = calculateQuadVertices(x, y, w, h, rot, sx, sy, px, py);

        // 2. Kalkulasi UV
        const texW = texRes.width;
        const texH = texRes.height;
        const u0 = frame.sx / texW;
        const v0 = frame.sy / texH;
        const u1 = (frame.sx + frame.sw) / texW;
        const v1 = (frame.sy + frame.sh) / texH;

        const d = this.bufferData;
        let i = this.bufferIndex;

        // Push Vertices (2 Segitiga membentuk Kotak)
        // Triangle 1: TL -> TR -> BL
        d[i++] = v.tl.x; d[i++] = v.tl.y; d[i++] = u0; d[i++] = v0; d[i++] = alpha;
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = alpha;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = alpha;

        // Triangle 2: TR -> BR -> BL
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = alpha;
        d[i++] = v.br.x; d[i++] = v.br.y; d[i++] = u1; d[i++] = v1; d[i++] = alpha;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = alpha;

        this.bufferIndex = i;
        if (i >= this.bufferData.length) this.flush();
    }

    flush() {
        if (this.bufferIndex === 0) return;
        const gl = this.gl;

        this.cache.useProgram(this.program);
        this.cache.bindVAO(this.vao);
        this.cache.bindTexture(this.currentTexture);

        const filter = this.currentPixelPerfect ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

        gl.uniformMatrix4fv(this.uProjection, false, this.lastProjection);
        gl.uniform1i(this.uTex, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.verticesPerQuad * 2 * 3); // Safety calc

        // Lebih aman pakai vertex count langsung:
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);

        this.bufferIndex = 0;
    }
}