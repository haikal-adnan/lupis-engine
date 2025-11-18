import Mat4 from "../../Util/Mat4.js";

export default class ImageRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;

        this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;

        this.maxSprites = 20000;
        this.verticesPerQuad = 6;
        this.floatsPerVertex = 4;
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

        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;
            uniform mat4 uProjection;
            out vec2 vUV;
            void main(){
                vUV = aUV;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        ` : `
            attribute vec2 aPos;
            attribute vec2 aUV;
            uniform mat4 uProjection;
            varying vec2 vUV;
            void main(){
                vUV = aUV;
                gl_Position = uProjection * vec4(aPos,0.0,1.0);
            }
        `;

        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV;
            out vec4 outColor;
            uniform sampler2D uTex;
            void main(){
                outColor = texture(uTex,vUV);
            }
        ` : `
            precision mediump float;
            varying vec2 vUV;
            uniform sampler2D uTex;
            void main(){
                gl_FragColor = texture2D(uTex,vUV);
            }
        `;

        const compile = (type, src) => {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.error("Shader error:", gl.getShaderInfoLog(sh));
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

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    draw(texRes, frame, x, y, w, h, projection, pixelPerfect = false) {
        if (!projection) throw new Error("ImageRenderer.draw() requires projection.");

        this.lastProjection = projection;

        if (this.currentTexture !== texRes.glTexture) {
            this.flush();
            this.currentTexture = texRes.glTexture;
        }

        if (this.currentPixelPerfect !== pixelPerfect) {
            this.flush();
            this.currentPixelPerfect = pixelPerfect;
        }

        const texW = texRes.width;
        const texH = texRes.height;

        const u0 = frame.sx / texW;
        const v0 = frame.sy / texH;
        const u1 = (frame.sx + frame.sw) / texW;
        const v1 = (frame.sy + frame.sh) / texH;

        const x0 = x,     y0 = y;
        const x1 = x + w, y1 = y + h;

        const d = this.bufferData;
        let i = this.bufferIndex;

        d[i++] = x0; d[i++] = y0; d[i++] = u0; d[i++] = v0;
        d[i++] = x1; d[i++] = y0; d[i++] = u1; d[i++] = v0;
        d[i++] = x0; d[i++] = y1; d[i++] = u0; d[i++] = v1;

        d[i++] = x1; d[i++] = y0; d[i++] = u1; d[i++] = v0;
        d[i++] = x1; d[i++] = y1; d[i++] = u1; d[i++] = v1;
        d[i++] = x0; d[i++] = y1; d[i++] = u0; d[i++] = v1;

        this.bufferIndex = i;

        if (this.bufferIndex >= this.bufferData.length) {
            this.flush();
        }
    }

    flush() {
        const gl = this.gl;
        if (this.bufferIndex === 0) return;

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

        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);

        this.bufferIndex = 0;
    }
}
