// engine/Core/Game.js

import RendererManager from "../Renderer/RendererManager.js";
import GameLoop from "../Loop/GameLoop.js";
import World from "../World/World.js";
import Camera from "../Camera/Camera.js";

export default class Game {
    constructor() {

        this.world = new World();

        this.camera = new Camera(0, 0);
        this.camera.scale = 1;

        this.loop = new GameLoop({
            update: (dt) => this.update(dt),
            render: (alpha) => this.render(alpha)
        });
    }

    start() {
        this.loop.start();
    }

    update(dt) {
        this.world.update(dt);

        if (this.world.player) {
            this.camera.follow(
                this.world.player,
                dt
            );
        }
    }

    render(alpha) {
        const cam = this.camera.getInterpolated(alpha);
        this.renderer?.render(this.world, cam);
    }
}
