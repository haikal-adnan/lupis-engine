class Configs {
  constructor() {
    this.ENGINE_MODE = "runtime";   // "runtime" | "editor"
    this.TICK_RATE = 60;
    this.WIDTH = 1080;
    this.HEIGHT = 720;
    this.BACKGROUND_COLOR = "#000000"

    this.EDITOR = {
      CAMERA_CONTROLLER: true,
      RULERS: true,             
      SELECTION: true,
      POINTER: true,
      MOVE: true,
      TRANSFORM: true,
      GRID: true
    };
  }
}

const Config = new Configs();
export default Config;
