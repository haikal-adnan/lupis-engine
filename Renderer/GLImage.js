import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import Config from "../Config/Config.js";

export default class GLImage {
  constructor(gl) {
    this.gl = gl;
    this.program = this._createProgram();
    this.aPosition = gl.getAttribLocation(this.program, "aPosition");
    this.aTexCoord = gl.getAttribLocation(this.program, "aTexCoord");
    this.uProjection = gl.getUniformLocation(this.program, "uProjection");
    this.uSampler = gl.getUniformLocation(this.program, "uSampler");
    this.vertexBuffer = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();
    this.texture = null;
    this.image = null;
    this.isLoaded = false;
  }

  _compileShader(type, src) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      console.error(gl.getShaderInfoLog(sh));
    return sh;
  }

  _createProgram() {
    const gl = this.gl;
    const vs = this._compileShader(gl.VERTEX_SHADER, `
      attribute vec2 aPosition;
      attribute vec2 aTexCoord;
      uniform mat4 uProjection;
      varying vec2 vTexCoord;
      void main() {
        gl_Position = uProjection * vec4(aPosition, 0.0, 1.0);
        vTexCoord = aTexCoord;
      }`);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uSampler;
      varying vec2 vTexCoord;
      void main() {
        gl_FragColor = texture2D(uSampler, vTexCoord);
      }`);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(program));
    return program;
  }

  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.texture = this._createTexture(img);
        this.image = img;
        this.isLoaded = true;
        console.log("✅ Texture dibuat:", img.width, "x", img.height);
        resolve();
      };
      img.onerror = reject;
    });
  }

  _createTexture(img) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const pixelArt = Config?.PIXEL_ART ?? true;
    const filter = pixelArt ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  cloneEmpty(glContext) {
    return new GLImage(glContext);
  }

  async loadFromBitmap(bitmap) {
    const gl = this.gl;
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const pixelArt = Config?.PIXEL_ART ?? true;
    const filter = pixelArt ? gl.NEAREST : gl.LINEAR;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.image = bitmap;
    this.isLoaded = true;
  }

  drawImage(...args) {
    if (!this.isLoaded || !this.texture || !this.image) {
      console.warn("⚠️ drawImage dipanggil sebelum texture siap:", this);
      return;
    }
    const gl = this.gl;
    let projection = null;
    if (args.length && typeof args[args.length - 1] === "object" && args[args.length - 1].isProjection)
      projection = args.pop().matrix;

    let sx = 0, sy = 0, sw = this.image.width, sh = this.image.height;
    let dx = 0, dy = 0, dw = this.image.width, dh = this.image.height;
    if (args.length === 4) [dx, dy, dw, dh] = args;
    else if (args.length === 8) [sx, sy, sw, sh, dx, dy, dw, dh] = args;

    gl.useProgram(this.program);
    const proj = projection || (() => {
      const p = mat4.create();
      const c = gl.canvas;
      mat4.ortho(p, 0, c.width, c.height, 0, -1, 1);
      return p;
    })();

    const verts = new Float32Array([
      dx, dy, dx + dw, dy, dx, dy + dh,
      dx + dw, dy, dx + dw, dy + dh, dx, dy + dh
    ]);
    const u0 = sx / this.image.width, v0 = sy / this.image.height;
    const u1 = (sx + sw) / this.image.width, v1 = (sy + sh) / this.image.height;
    const tex = new Float32Array([
      u0, v0, u1, v0, u0, v1,
      u1, v0, u1, v1, u0, v1
    ]);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, tex, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(this.uProjection, false, proj);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.uSampler, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    const err = gl.getError();
    if (err !== gl.NO_ERROR) console.error("❌ WebGL Error:", err);
  }
}
