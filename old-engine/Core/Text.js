import Mat4 from "../Util/Mat4.js";
import TextRenderer from "../Renderer/TextRenderer.js";

export default class Text {
  constructor(gl) {
    this.gl = gl;
    this.renderer = new TextRenderer(gl);
    this.loaded = false;
    this.error = null;
  }

  async init(fontPath, imagePath) {
    await this.renderer.loadFont(fontPath, imagePath);

    if (!this.renderer.isLoaded) {
      this.error = this.renderer.error || "Unknown font load error";
      console.warn(`⚠️ Text init failed: ${this.error}`);
      return false;
    }

    this.loaded = true;
    this.error = null;
    this._setupProjection();
    return true;
  }

  _setupProjection() {
    const canvas = this.gl.canvas;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr * 1.5);
    canvas.height = Math.floor(window.innerHeight * dpr * 1.5);
    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.baseProj = Mat4.create();
    Mat4.ortho(this.baseProj, 0, canvas.width, canvas.height, 0, -1, 1);
  }

  draw(...args) {
    if (!this.loaded) {
      console.warn("TextRenderer is not ready. Font not loaded or invalid.");
      return;
    }
    this.renderer.drawText(...args);
  }
}
