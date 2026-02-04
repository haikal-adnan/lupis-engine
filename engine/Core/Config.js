class Configs {
    constructor() {
        this.ENGINE_MODE = "runtime"; // "runtime" | "editor"

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