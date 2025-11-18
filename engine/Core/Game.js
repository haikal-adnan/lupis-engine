// engine/Core/Game.js

import RendererManager from "../Renderer/RendererManager.js";
import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";

export default class Game {
    constructor() {

        this.world = new World();

        this.camera = new Camera(0, 0);
        this.camera.scale = 1;

        this.renderer = null;

        this.loop = new GameLoop({
            update: dt => this.update(dt),
            render: a  => this.render(a),
        });
    }

    start() {
        this.loop.start();
    }

    update(dt) {

        if (Config.ENGINE_MODE !== "editor") {
            if (this.world.player) {
                this.camera.updateFollow(this.world.player, dt);
            }
        }

        this.world.update(dt);
    }

    render(alpha) {
        const cam = this.camera.getInterpolated(alpha);

        if(this.selectionOutline) {
            this.selectionOutline?.redraw();
        }

        this.renderer?.render(this.world, cam, this);
    }
}
