import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export default class ImageRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;

        this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;

        this.maxSprites = 20000;
        this.verticesPerQuad = 6;
        
        // [MODIFIKASI] Menambah 2 float untuk aDimension (Width, Height)
        // x, y, u, v, alpha, dimW, dimH
        this.floatsPerVertex = 7; 
        this.floatsPerQuad = this.verticesPerQuad * this.floatsPerVertex;

        this.bufferData = new Float32Array(this.maxSprites * this.floatsPerQuad);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.currentPixelPerfect = null;
        this.lastProjection = null;

        // [MODIFIKASI] Buat 1x1 White Texture sebagai dummy saat render Checkerboard
        this.whiteTexture = this._createWhiteTexture();

        this._createShader();
        this._createBuffers();
    }

    _createWhiteTexture() {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
    }

    _createShader() {
        const gl = this.gl;
        
        // [SHADER LOGIC]
        // Kita tambah aDimension. 
        // Di Fragment Shader, kita hitung posisi pixel berdasarkan UV * Dimension.
        // Floor(pixel / 32) menentukan index kotak catur.

        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;
            layout(location=2) in float aAlpha;
            layout(location=3) in vec2 aDimension; // [NEW]

            uniform mat4 uProjection;
            out vec2 vUV;
            out float vAlpha;
            out vec2 vDimension; // Pass ke Fragment

            void main(){
                vUV = aUV;
                vAlpha = aAlpha;
                vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        ` : `
            attribute vec2 aPos;
            attribute vec2 aUV;
            attribute float aAlpha;
            attribute vec2 aDimension; // [NEW]

            uniform mat4 uProjection;
            varying vec2 vUV;
            varying float vAlpha;
            varying vec2 vDimension;

            void main(){
                vUV = aUV;
                vAlpha = aAlpha;
                vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        `;

        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV;
            in float vAlpha;
            in vec2 vDimension;
            out vec4 outColor;
            uniform sampler2D uTex;

            void main(){
                vec4 c;
                
                // [LOGIC CHECKERBOARD]
                // Jika vDimension > 0, kita render pola catur
                if (vDimension.x > 0.0) {
                    // Hitung posisi pixel lokal (0..Width, 0..Height)
                    vec2 pixelPos = vUV * vDimension;
                    
                    // Ukuran kotak catur
                    float size = 32.0; 
                    
                    // Matematika Catur: (floor(x) + floor(y)) % 2
                    vec2 cell = floor(pixelPos / size);
                    float isLight = mod(cell.x + cell.y, 2.0);

                    // Warna Catur (Abu Gelap & Abu Terang)
                    // Warna 1: #333333 (0.2)
                    // Warna 2: #444444 (0.26)
                    vec3 col1 = vec3(0.2, 0.2, 0.2); 
                    vec3 col2 = vec3(0.3, 0.3, 0.3);
                    
                    c = vec4(mix(col1, col2, isLight), 1.0);
                } else {
                    // Render Texture Biasa
                    c = texture(uTex, vUV);
                }

                c.a *= vAlpha;
                outColor = c;
            }
        ` : `
            precision mediump float;
            varying vec2 vUV;
            varying float vAlpha;
            varying vec2 vDimension;
            uniform sampler2D uTex;

            void main(){
                vec4 c;
                if (vDimension.x > 0.0) {
                    vec2 pixelPos = vUV * vDimension;
                    float size = 32.0;
                    vec2 cell = floor(pixelPos / size);
                    float isLight = mod(cell.x + cell.y, 2.0);
                    vec3 col1 = vec3(0.2, 0.2, 0.2);
                    vec3 col2 = vec3(0.3, 0.3, 0.3);
                    c = vec4(mix(col1, col2, isLight), 1.0);
                } else {
                    c = texture2D(uTex, vUV);
                }
                c.a *= vAlpha;
                gl_FragColor = c;
            }
        `;

        const compile = (t, s) => {
            const sh = gl.createShader(t);
            gl.shaderSource(sh, s);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(sh));
            }
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
            gl.bindAttribLocation(this.program, 3, "aDimension"); // [NEW]
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
        
        // aPos
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
        // aUV
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);
        // aAlpha
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16);
        // aDimension [NEW]
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 20); // Offset 20 bytes (5 floats * 4)

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    // --- UPDATE: Parameter useCheckerboard ---
    draw(texRes, frame, x, y, w, h, rot, sx, sy, px, py, projection, pixelPerfect = false, alpha = 1, useCheckerboard = false) {
        if (!projection) return;
        this.lastProjection = projection;

        // Tentukan Texture mana yang dipakai
        // Jika Checkerboard, kita pakai Texture Putih 1x1 (Dummy) agar shader tidak error
        const targetGLTexture = useCheckerboard ? this.whiteTexture : (texRes ? texRes.glTexture : this.whiteTexture);

        if (this.currentTexture !== targetGLTexture) {
            this.flush();
            this.currentTexture = targetGLTexture;
        }

        if (this.currentPixelPerfect !== pixelPerfect) {
            this.flush();
            this.currentPixelPerfect = pixelPerfect;
        }

        // Hitung Vertices
        const v = calculateQuadVertices(x, y, w, h, rot, sx, sy, px, py);

        // Hitung UV
        let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
        
        if (!useCheckerboard && texRes) {
            const texW = texRes.width;
            const texH = texRes.height;
            u0 = frame.sx / texW;
            v0 = frame.sy / texH;
            u1 = (frame.sx + frame.sw) / texW;
            v1 = (frame.sy + frame.sh) / texH;
        } else {
            // Jika checkerboard, UV tetap 0-1, nanti scaling dilakukan di Shader menggunakan Dimension
            u0 = 0; v0 = 0; u1 = 1; v1 = 1;
        }

        // Tentukan nilai Dimension untuk dikirim ke Shader
        // Jika useCheckerboard = true, kirim size asli (w, h). Jika tidak, kirim 0,0.
        const dimW = useCheckerboard ? w : 0;
        const dimH = useCheckerboard ? h : 0;

        const d = this.bufferData;
        let i = this.bufferIndex;

        // Push Vertices
        // Layout: x, y, u, v, alpha, dimW, dimH
        
        // Triangle 1
        d[i++] = v.tl.x; d[i++] = v.tl.y; d[i++] = u0; d[i++] = v0; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;

        // Triangle 2
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.br.x; d[i++] = v.br.y; d[i++] = u1; d[i++] = v1; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = alpha; d[i++] = dimW; d[i++] = dimH;

        this.bufferIndex = i;
        if (i >= this.bufferData.length) this.flush();
    }
    
    // ... flush() sama seperti sebelumnya (hanya pastikan drawArrays pakai floatsPerVertex yang baru)
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
        
        // Update count calculation
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);

        this.bufferIndex = 0;
    }
}