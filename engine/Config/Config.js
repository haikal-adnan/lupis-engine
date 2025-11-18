class Configs {
  constructor() {
    // Mode utama engine
    this.ENGINE_MODE = "runtime";   // "runtime" | "editor"
    this.TICK_RATE = 60;

    this.EDITOR = {
      CAMERA_CONTROLLER: true,
      RULERS: false,             
      SELECTION: true,
      POINTER: true,
      MOVE: true,
    };
  }
}

const Config = new Configs();
export default Config;
