class Configs {
  constructor() {
    this.ENGINE_MODE = "runtime";   // "runtime" | "editor"
    this.TICK_RATE = 60;
    this.FONT = "font_gaegu";

    this.EDITOR = {
      CAMERA_CONTROLLER: true,
      RULERS: false,             
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
