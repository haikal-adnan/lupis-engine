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
        this.currentFilterMode = null;
        this.currentUseSDF = null;
        this.lastProjection = null;

        this.FILTER_MODES = {
            pixelated: this.gl.NEAREST,
            smooth: this.gl.LINEAR
        };

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
        const hasDeriv = this.isWebGL2 || !!gl.getExtension("OES_standard_derivatives");
        
        const vs = this.isWebGL2 ? `#version 300 es
            layout(location=0) in vec2 aPos;
            layout(location=1) in vec2 aUV;
            layout(location=2) in float aAlpha;
            layout(location=3) in vec2 aDimension;
            uniform mat4 uProjection;
            out vec2 vUV; out float vAlpha; out vec2 vDimension;
            void main(){
                vUV = aUV; vAlpha = aAlpha; vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        ` : `
            attribute vec2 aPos; attribute vec2 aUV; attribute float aAlpha; attribute vec2 aDimension;
            uniform mat4 uProjection;
            varying vec2 vUV; varying float vAlpha; varying vec2 vDimension;
            void main(){
                vUV = aUV; vAlpha = aAlpha; vDimension = aDimension;
                gl_Position = uProjection * vec4(aPos, 0.0, 1.0);
            }
        `;

        const fs = this.isWebGL2 ? `#version 300 es
            precision highp float;
            in vec2 vUV; in float vAlpha; in vec2 vDimension;
            out vec4 outColor;
            
            uniform sampler2D uTex;
            uniform float uUseSDF;
            
            void main(){
                vec4 c;
                if (vDimension.x > 0.0) {
                    float size = 32.0;
                    vec2 cell = floor((vUV * vDimension) / size);
                    float isLight = mod(cell.x + cell.y, 2.0);
                    c = vec4(mix(vec3(0.2), vec3(0.3), isLight), 1.0);
                } else {
                    vec4 texColor = texture(uTex, vUV);
                    
                    if (uUseSDF > 0.5) {
                        float distance = texColor.a; 
                        float fw = fwidth(distance); 
                        float sdfAlpha = smoothstep(0.5 - fw, 0.5 + fw, distance);
                        c = vec4(texColor.rgb, sdfAlpha);
                    } else {
                        c = texColor;
                    }
                }
                c.a *= vAlpha;
                if (c.a < 0.001) discard;
                outColor = c;
            }
        ` : `
            ${hasDeriv ? "#extension GL_OES_standard_derivatives : enable" : ""}
            #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
            #else
            precision mediump float;
            #endif
            varying vec2 vUV; varying float vAlpha; varying vec2 vDimension;
            
            uniform sampler2D uTex;
            uniform float uUseSDF; 
            
            void main(){
                vec4 c;
                if (vDimension.x > 0.0) {
                    float size = 32.0;
                    vec2 cell = floor((vUV * vDimension) / size);
                    float isLight = mod(cell.x + cell.y, 2.0);
                    c = vec4(mix(vec3(0.2), vec3(0.3), isLight), 1.0);
                } else {
                    vec4 texColor = texture2D(uTex, vUV);
                    
                    if (uUseSDF > 0.5) {
                        float distance = texColor.a; 
                        float fw = ${hasDeriv ? "fwidth(distance)" : "0.04"};
                        float sdfAlpha = smoothstep(0.5 - fw, 0.5 + fw, distance);
                        c = vec4(texColor.rgb, sdfAlpha);
                    } else {
                        c = texColor;
                    }
                }
                c.a *= vAlpha;
                if (c.a < 0.001) discard;
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
        this.uUseSDF = gl.getUniformLocation(program, "uUseSDF"); 
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

    drawQuad(texRes, source, vertices, options, projection) {
        if (!projection || !vertices) return;
        this.lastProjection = projection;

        const { 
            opacity = 1, useCheckerboard = false,
            filterMode = 'pixelated', useSDF = false,
            uvInset
        } = options || {};

        const isValidTexture = texRes && texRes.glTexture;
        const shouldChecker = useCheckerboard || !isValidTexture;
        const targetGLTexture = shouldChecker ? this.whiteTexture : texRes.glTexture;
        const dimW = shouldChecker ? (source?.w || 32) : 0;
        const dimH = shouldChecker ? (source?.h || 32) : 0;

        if (this.currentTexture !== targetGLTexture || 
            this.currentFilterMode !== filterMode || 
            this.currentUseSDF !== useSDF) {
            
            this.flush();
            this.currentTexture = targetGLTexture;
            this.currentFilterMode = filterMode;
            this.currentUseSDF = useSDF;
        }

        let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
        if (!shouldChecker && isValidTexture) {
            const tw = texRes.width || 1; 
            const th = texRes.height || 1;

            const isSubRect = (source.w < tw || source.h < th || source.x > 0 || source.y > 0);
            let insetX = 0;
            let insetY = 0;
            if (isSubRect) {
                const defaultInset = 0.5;
                const eps = uvInset !== undefined ? uvInset : defaultInset;
                insetX = eps / tw;
                insetY = eps / th;
            }

            u0 = (source.x / tw) + insetX;
            v0 = (source.y / th) + insetY;
            u1 = ((source.x + source.w) / tw) - insetX;
            v1 = ((source.y + source.h) / th) - insetY;
        }

        const d = this.bufferData;
        let i = this.bufferIndex;

        d[i++] = vertices.tl.x; d[i++] = vertices.tl.y; d[i++] = u0; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = vertices.tr.x; d[i++] = vertices.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = vertices.bl.x; d[i++] = vertices.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = vertices.tr.x; d[i++] = vertices.tr.y; d[i++] = u1; d[i++] = v0; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = vertices.br.x; d[i++] = vertices.br.y; d[i++] = u1; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;
        d[i++] = vertices.bl.x; d[i++] = vertices.bl.y; d[i++] = u0; d[i++] = v1; d[i++] = opacity; d[i++] = dimW; d[i++] = dimH;

        this.bufferIndex = i;
        if (i >= this.bufferData.length) this.flush();
    }

    draw(texRes, source, transform, options, projection) {
        if (!projection) return;

        if (transform && transform.tl && transform.tr && transform.bl && transform.br) {
            return this.drawQuad(texRes, source, transform, options, projection);
        }

        this.lastProjection = projection;

        const { x, y, width: w, height: h, rotation: rot, scaleX: sx = 1, scaleY: sy = 1, pivotX: px = 0.5, pivotY: py = 0.5 } = transform;
        const { 
            flipX = false, flipY = false, opacity = 1, useCheckerboard = false,
            filterMode = 'pixelated', useSDF = false,
            uvInset
        } = options || {};

        const isValidTexture = texRes && texRes.glTexture;
        const shouldChecker = useCheckerboard || !isValidTexture;
        const targetGLTexture = shouldChecker ? this.whiteTexture : texRes.glTexture;
        const dimW = shouldChecker ? w : 0;
        const dimH = shouldChecker ? h : 0;

        if (this.currentTexture !== targetGLTexture || 
            this.currentFilterMode !== filterMode || 
            this.currentUseSDF !== useSDF) {
            
            this.flush();
            this.currentTexture = targetGLTexture;
            this.currentFilterMode = filterMode;
            this.currentUseSDF = useSDF;
        }

        const finalSX = flipX ? -sx : sx;
        const finalSY = flipY ? -sy : sy;
        const v = calculateQuadVertices(x, y, w, h, rot, finalSX, finalSY, px, py);

        let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
        if (!shouldChecker && isValidTexture) {
            const tw = texRes.width || 1; 
            const th = texRes.height || 1;

            const isSubRect = (source.w < tw || source.h < th || source.x > 0 || source.y > 0);
            let insetX = 0;
            let insetY = 0;
            if (isSubRect) {
                const defaultInset = 0.5;
                const eps = uvInset !== undefined ? uvInset : defaultInset;
                insetX = eps / tw;
                insetY = eps / th;
            }

            u0 = (source.x / tw) + insetX;
            v0 = (source.y / th) + insetY;
            u1 = ((source.x + source.w) / tw) - insetX;
            v1 = ((source.y + source.h) / th) - insetY;
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

        const glFilter = this.FILTER_MODES[this.currentFilterMode] || gl.NEAREST;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, glFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, glFilter);

        gl.uniformMatrix4fv(this.uProjection, false, this.lastProjection);
        gl.uniform1i(this.uTex, 0);
        gl.uniform1f(this.uUseSDF, this.currentUseSDF ? 1.0 : 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.bufferData.subarray(0, this.bufferIndex));
        gl.drawArrays(gl.TRIANGLES, 0, this.bufferIndex / this.floatsPerVertex);

        this.bufferIndex = 0;
    }
}