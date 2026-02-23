class Configs {
    constructor() {
        this.ENGINE_MODE = "runtime"; 

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