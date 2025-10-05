import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

export default class GLImage {
  constructor(gl) {
    this.gl = gl;
    this.program = this._createProgram();

    this.aPosition   = gl.getAttribLocation(this.program, "aPosition");
    this.aTexCoord   = gl.getAttribLocation(this.program, "aTexCoord");
    this.uProjection = gl.getUniformLocation(this.program, "uProjection");
    this.uSampler    = gl.getUniformLocation(this.program, "uSampler");

    this.vertexBuffer   = gl.createBuffer();
    this.texCoordBuffer = gl.createBuffer();

    this.texture  = null;
    this.isLoaded = false;
  }

  _compileShader(type, src) {
    const gl = this.gl;
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
    }
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
      }
    `);

    const fs = this._compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uSampler;
      varying vec2 vTexCoord;
      void main() {
        gl_FragColor = texture2D(uSampler, vTexCoord);
      }
    `);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
    }
    return program;
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.texture = this._createTexture(img);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
  }

  // ❗ Tidak ada clear di sini. Clear hanya di GLRenderer.
  drawImage(x, y, w, h) {
    if (!this.isLoaded) return;

    const gl = this.gl;
    gl.useProgram(this.program);

    const canvas = gl.canvas;
    const proj = mat4.create();
    mat4.ortho(proj, 0, canvas.width, canvas.height, 0, -1, 1);

    const verts = new Float32Array([
      x,     y,
      x + w, y,
      x,     y + h,
      x + w, y,
      x + w, y + h,
      x,     y + h,
    ]);

    const tex = new Float32Array([
      0,0, 1,0, 0,1,
      1,0, 1,1, 0,1
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
  }
}
