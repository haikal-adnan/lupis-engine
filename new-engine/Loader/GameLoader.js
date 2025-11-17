// engine/Loader/GameLoader.js

import Config from "../Config/Config.js";
import { game } from "../main.js";
import World from "../World/World.js";
import RendererManager from "../Renderer/RendererManager.js";
import GameLoop from "../Loop/GameLoop.js";
import TextRenderer from "../Renderer/TextRenderer.js";

import CameraController from "../Editor/CameraController.js";
import SelectionOutline from "../Editor/SelectionOutline.js";
import Rulers from "../Editor/Rulers.js";

export default class GameLoader {
    async initializeGame(canvas, mode = "runtime") {

        // ==============================
        // MODE
        // ==============================
        Config.ENGINE_MODE = mode;

        // ==============================
        // RENDERER
        // ==============================
        game.renderer = new RendererManager(canvas);

        // ==============================
        // WORLD
        // ==============================
        const world = new World();
        await world.load();
        game.world = world;

        // ==============================
        // FONT
        // ==============================
        game.text = game.renderer.textRenderer;
        await game.text.loadFont(
            "/engine/Assets/Fonts/poppins.fnt",
            "/engine/Assets/Fonts/poppins.png"
        );

        // ==============================
        // EDITOR TOOLS
        // ==============================
        if (mode === "editor") {
            game.cameraController = new CameraController(world.camera, canvas);
            game.selectionOutline = new SelectionOutline(world, canvas, game.renderer);
            game.rulers = new Rulers(game.renderer, world.camera);
        }

        // ==============================
        // GAME LOOP
        // ==============================
        game.loop = new GameLoop({
            update: (dt) => game.update(dt),
            render: (a) => game.render(a),
        });
    }

    start() {
        game.loop.start();
    }
}
