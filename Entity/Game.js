import Config from "../Config/Config.js";
import GLImage from "../Renderer/GLImage.js";

export default class Game {
  constructor() {
    this.glRenderer = null;
    this.uiRenderer = null;
    this.glContext  = null;
    this.uiContext  = null; 
    this.loop = null;
    this.input = null;
    this.touch = null;
    this.width  = Config.VIRTUAL_WIDTH;
    this.height = Config.VIRTUAL_HEIGHT;
    this.image = null;
  }

  async init() {
    // siapkan sprite
    this.image = new GLImage(this.glContext);
    await this.image.loadImage("./mage.png");
    console.log("✅ Gambar sudah dimuat");
  }

  update(dt) {
    // game logic di sini
  }

  render(alpha) {
    // 1) clear hitam dari renderer
    this.glRenderer.clear();

    // 2) gambar sprite
    if (this.image?.isLoaded) {
      this.image.drawImage(400, 200, 2408, 807);
    }

    // 3) UI transparan
    this.uiRenderer.clear();
  }
}
