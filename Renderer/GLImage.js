// GLImage.js (optimized)
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import Config from "../Config/Config.js";

// Shared resources per-webgl-context
const _sharedByGL = new WeakMap();

function getShared(gl) {
  let s = _sharedByGL.get(gl);
  if (s) return s;

  const vsSrc = `
    attribute vec2 aPosition;   // unit quad [0..1]
    attribute vec2 aUnitUV;     // unit uv   [0..1]
    uniform mat4 uProjection;
    uniform mat4 uModel;
    uniform vec4 uUvRect; // (u0, v0, u1, v1)
    varying vec2 vTexCoord;
    void main() {
      vec2 pos = aPosition;
      gl_Position = uProjection * uModel * vec4(pos, 0.0, 1.0);
      // map 0..1 -> u0..u1
      vTexCoord = mix(uUvRect.xy, uUvRect.zw, aUnitUV);
    }`;

  const fsSrc = `
    precision mediump float;
    uniform sampler2D uSampler;
    varying vec2 vTexCoord;
    void main() {
      gl_FragColor = texture2D(uSampler, vTexCoord);
    }`;

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

  // Attributes & uniforms
  const aPosition  = gl.getAttribLocation(program, "aPosition");
  const aUnitUV    = gl.getAttribLocation(program, "aUnitUV");
  const uProjection = gl.getUniformLocation(program, "uProjection");
  const uModel      = gl.getUniformLocation(program, "uModel");
  const uUvRect     = gl.getUniformLocation(program, "uUvRect");
  const uSampler    = gl.getUniformLocation(program, "uSampler");

  // Static buffers: unit quad (TRIANGLE_STRIP)
  // positions: (0,0) (1,0) (0,1) (1,1)
  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([ 0,0,  1,0,  0,1,  1,1 ]),
    gl.STATIC_DRAW
  );

  const uvVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([ 0,0,  1,0,  0,1,  1,1 ]),
    gl.STATIC_DRAW
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Optional VAO
  const vaoExt = gl.getExtension("OES_vertex_array_object");
  let vao = null;
  if (vaoExt) {
    vao = vaoExt.createVertexArrayOES();
    vaoExt.bindVertexArrayOES(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvVBO);
    gl.enableVertexAttribArray(aUnitUV);
    gl.vertexAttribPointer(aUnitUV, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    vaoExt.bindVertexArrayOES(null);
  }

  const shared = {
    program, aPosition, aUnitUV, uProjection, uModel, uUvRect, uSampler,
    quadVBO, uvVBO, vao, vaoExt,
    // cache
    projectionCache: { w: 0, h: 0, m: mat4.create() },
    lastBoundTexture: null,
    lastProgram: null
  };
  _sharedByGL.set(gl, shared);
  return shared;
}

export default class GLImage {
  constructor(gl) {
    this.gl = gl;
    this.s = getShared(gl);
    this.texture = null;
    this.image   = null; // Image or ImageBitmap (must have width/height)
    this.isLoaded = false;

    // reuse matrix to avoid allocations each draw
    this._model = mat4.create();
    this._tmp   = mat4.create();
  }

  cloneEmpty(glContext) {
    return new GLImage(glContext);
  }

  async loadImage(src) {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();

    // Use ImageBitmap if available (faster upload)
    let bitmap = img;
    if (typeof createImageBitmap === "function") {
      try { bitmap = await createImageBitmap(img); } catch {}
    }
    this._uploadTexture(bitmap);
    this.image = bitmap;
    this.isLoaded = true;
  }

  async loadFromBitmap(bitmap) {

    this._uploadTexture(bitmap);
    this.image = bitmap;
    this.isLoaded = true;
  }

  _uploadTexture(source) {
    const gl = this.gl;
    if (!this.texture) this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Filtering
    const pixelArt = Config?.PIXEL_ART ?? true;
    const filter = pixelArt ? gl.NEAREST : gl.LINEAR;

    // Optional: reduce png halo with premultiplied alpha images
    // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  // drawImage([sx,sy,sw,sh,] dx,dy,dw,dh, [projection])
  drawImage(...args) {
    if (!this.isLoaded || !this.texture || !this.image) {
      // console.warn("drawImage dipanggil sebelum texture siap");
      return;
    }
    const gl = this.gl;
    const s  = this.s;

    // Pop projection if provided
    let projectionArg = null;
    if (args.length && typeof args[args.length - 1] === "object" && args[args.length - 1].isProjection) {
      projectionArg = args.pop().matrix;
    }

    // Parse args
    let sx = 0, sy = 0, sw = this.image.width, sh = this.image.height;
    let dx = 0, dy = 0, dw = this.image.width, dh = this.image.height;

    if (args.length === 4) {
      [dx, dy, dw, dh] = args;
    } else if (args.length === 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    } else {
      // single-arg default not supported; ignore silently
    }

    // Use/Bind program once
    if (s.lastProgram !== s.program) {
      gl.useProgram(s.program);
      s.lastProgram = s.program;
    }

    // Bind VAO or set attributes (once)
    if (s.vao) {
      s.vaoExt.bindVertexArrayOES(s.vao);
    } else {
      gl.bindBuffer(gl.ARRAY_BUFFER, s.quadVBO);
      gl.enableVertexAttribArray(s.aPosition);
      gl.vertexAttribPointer(s.aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, s.uvVBO);
      gl.enableVertexAttribArray(s.aUnitUV);
      gl.vertexAttribPointer(s.aUnitUV, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    // Projection: recompute only when canvas size changes (unless external given)
    let proj = projectionArg;
    if (!proj) {
      const w = gl.canvas.width, h = gl.canvas.height;
      if (s.projectionCache.w !== w || s.projectionCache.h !== h) {
        s.projectionCache.w = w; s.projectionCache.h = h;
        mat4.ortho(s.projectionCache.m, 0, w, h, 0, -1, 1);
      }
      proj = s.projectionCache.m;
    }
    gl.uniformMatrix4fv(s.uProjection, false, proj);

    // Model = Translation(dx,dy) * Scale(dw,dh)
    // (unit quad [0..1] akan diskalakan & dipindah)
    const model = this._model;
    mat4.identity(model);
    mat4.translate(model, model, [dx, dy, 0]);
    mat4.scale(model, model, [dw, dh, 1]);
    gl.uniformMatrix4fv(s.uModel, false, model);

    // UV rect uniform (map 0..1 ke subrect)
    const u0 = sx / this.image.width;
    const v0 = sy / this.image.height;
    const u1 = (sx + sw) / this.image.width;
    const v1 = (sy + sh) / this.image.height;
    gl.uniform4f(s.uUvRect, u0, v0, u1, v1);

    // Texture binding: avoid rebinding if already bound
    if (s.lastBoundTexture !== this.texture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      s.lastBoundTexture = this.texture;
      gl.uniform1i(s.uSampler, 0);
    }

    // Draw TRIANGLE_STRIP (4 vertices)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // If using VAO, unbind is optional; keep bound for next sprite
    // If you switch programs elsewhere, VAO pointer won't hurt.
  }
}