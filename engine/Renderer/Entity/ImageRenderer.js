import { calculateQuadVertices } from "../../Util/calculateQuadVertices.js";

export default class ImageRenderer {
    constructor(ctx, cache) {
        this.ctx = ctx;
        this.gl = ctx.gl;
        this.cache = cache;

        this.isWebGL2 = this.gl instanceof WebGL2RenderingContext;

        this.maxSprites = 20000;
        this.verticesPerQuad = 6;
        
        this.floatsPerVertex = 7; 
        this.floatsPerQuad = this.verticesPerQuad * this.floatsPerVertex;

        this.bufferData = new Float32Array(this.maxSprites * this.floatsPerQuad);
        this.bufferIndex = 0;

        this.currentTexture = null;
        this.lastProjection = null;

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
        
        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;
            layout(location=2) in float aAlpha;
            layout(location=3) in vec2 aDimension;
            uniform mat4 uProjection;
            out vec2 vUV;
            out float vAlpha;
            out vec2 vDimension;
            void main(){
                vUV = aUV; vAlpha = aAlpha; vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        ` : `
            attribute vec2 aPos;
            attribute vec2 aUV;
            attribute float aAlpha;
            attribute vec2 aDimension;
            uniform mat4 uProjection;
            varying vec2 vUV;
            varying float vAlpha;
            varying vec2 vDimension;
            void main(){
                vUV = aUV; vAlpha = aAlpha; vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        `;

        const fs = this.isWebGL2 ? `#version 300 es
            precision mediump float;
            in vec2 vUV; in float vAlpha; in vec2 vDimension;
            out vec4 outColor;
            uniform sampler2D uTex;
            void main(){
                vec4 c;
                if (vDimension.x > 0.0) {
                    float size = 32.0;
                    vec2 cell = floor((vUV * vDimension) / size);
                    float isLight = mod(cell.x + cell.y, 2.0);
                    vec3 col = mix(vec3(0.2), vec3(0.3), isLight);
                    c = vec4(col, 1.0);
                } else {
                    if (vUV.x < 0.0 || vUV.x > 1.0 || vUV.y < 0.0 || vUV.y > 1.0) {
                        c = vec4(0.0, 0.0, 0.0, 0.0);
                    } else {
                        c = texture(uTex, vUV);
                    }
                }
                c.a *= vAlpha;
                outColor = c;
            }
        ` : `
            precision mediump float;
            varying vec2 vUV; varying float vAlpha; varying vec2 vDimension;
            uniform sampler2D uTex;
            void main(){
                vec4 c;
                if (vDimension.x > 0.0) {
                    float size = 32.0;
                    vec2 cell = floor((vUV * vDimension) / size);
                    float isLight = mod(cell.x + cell.y, 2.0);
                    vec3 col = mix(vec3(0.2), vec3(0.3), isLight);
                    c = vec4(col, 1.0);
                } else {
                    if (vUV.x < 0.0 || vUV.x > 1.0 || vUV.y < 0.0 || vUV.y > 1.0) {
                        c = vec4(0.0, 0.0, 0.0, 0.0);
                    } else {
                        c = texture2D(uTex, vUV);
                    }
                }
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

        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
        
        if (!this.isWebGL2) {
            gl.bindAttribLocation(program, 0, "aPos");
            gl.bindAttribLocation(program, 1, "aUV");
            gl.bindAttribLocation(program, 2, "aAlpha");
            gl.bindAttribLocation(program, 3, "aDimension");
        }
        
        gl.linkProgram(program);
        this.program = program;
        this.uProjection = gl.getUniformLocation(program, "uProjection");
        this.uTex = gl.getUniformLocation(program, "uTex");
    }

    _createBuffers() {
        const gl = this.gl;
        this.vbo = gl.createBuffer();
        this.vao = this.ctx.createVAO();

        this.cache.bindVAO(this.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.bufferData, gl.DYNAMIC_DRAW);

        const stride = this.floatsPerVertex * 4;
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0); 
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8); 
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 16); 
        gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 20); 

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.cache.bindVAO(null);
    }

    draw(texRes, source, transform, options, projection) {
        if (!projection) return;
        this.lastProjection = projection;

        const { x, y, width: w, height: h, rotation: rot, scaleX: sx = 1, scaleY: sy = 1, pivotX: px = 0.5, pivotY: py = 0.5 } = transform;
        
        const { flipX = false, flipY = false, opacity = 1, useCheckerboard = false } = options || {};

        const isValidTexture = texRes && texRes.glTexture;
        const shouldChecker = useCheckerboard || !isValidTexture;
        const targetGLTexture = shouldChecker ? this.whiteTexture : texRes.glTexture;
        
        const dimW = shouldChecker ? w : 0;
        const dimH = shouldChecker ? h : 0;

        if (this.currentTexture !== targetGLTexture) {
            this.flush();
            this.currentTexture = targetGLTexture;
        }

        const finalSX = flipX ? -sx : sx;
        const finalSY = flipY ? -sy : sy;

        const v = calculateQuadVertices(x, y, w, h, rot, finalSX, finalSY, px, py);

        let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
        if (!shouldChecker && isValidTexture) {
            const tw = texRes.width || 1; 
            const th = texRes.height || 1;
            u0 = source.x / tw; 
            v0 = source.y / th;
            u1 = (source.x + source.w) / tw; 
            v1 = (source.y + source.h) / th;
        }

        const d = this.bufferData;
        let i = this.bufferIndex;

        d[i++] = v.tl.x; d[i++] = v.tl.y; d[i++] = u0; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.tr.x; d[i++] = v.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.br.x; d[i++] = v.br.y; d[i++] = u1; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = v.bl.x; d[i++] = v.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;

        this.bufferIndex = i;
        if (i >= this.bufferData.length) this.flush();
    }

    flush() {
        if (this.bufferIndex === 0) return;
        const gl = this.gl;

        this.cache.useProgram(this.program);
        this.cache.bindVAO(this.vao);
        this.cache.bindTexture(this.currentTexture);

        gl.uniformMatrix4fv(this.uProjection, false, this.lastProjection);
        gl.uniform1i(this.uTex, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));

        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);

        this.bufferIndex = 0;
    }
}