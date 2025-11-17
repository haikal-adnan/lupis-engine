// engine/Loader/GameLoader.js

import Config from "../Config/Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "../World/World.js";
import GameLoop from "../Loop/GameLoop.js";
import CameraController from "../Editor/CameraController.js";
import SelectionOutline from "../Editor/SelectionOutline.js";
import Rulers from "../Editor/Rulers.js";
import GLImageResource from "../Renderer/GLImageResource.js";

window.LUPIS = window.LUPIS || {};
window.LUPIS.runtime = window.LUPIS.runtime || {};

export default class GameLoader {

    async initializeGame(game, canvas, mode = "runtime", baseURL = "./") {

        Config.ENGINE_MODE = mode;

        // Renderer
        game.renderer = new RendererManager(canvas);
        const gl = game.renderer.gl;
        const loader = new GLImageResource(gl);

        const world = new World();
        game.world = world;

        let project, scene;

        // ===============================
        // HYBRID MODE (data dari Vue)
        // ===============================
        if (window.LUPIS.runtime.project) {
            console.log("📦 Hybrid project → loaded from memory");

            project = window.LUPIS.runtime.project;
            scene   = window.LUPIS.runtime.scene;
        }

        // ===============================
        // OFFLINE MODE (fetch dari folder)
        // ===============================
        else {
            console.log("🌐 Loading project from:", baseURL);

            project = await fetch(baseURL + "project.json").then(r => r.json());
            const sceneName = project.startScene;
            scene   = await fetch(`${baseURL}scenes/${sceneName}.json`).then(r => r.json());
        }

        // ===============================
        // LOAD WORLD
        // ===============================
        await world.loadProject(
            project,
            scene,
            loader,
            baseURL,
            async (fnt, png) => {
                await game.renderer.text.loadFont(fnt, png);
                return game.renderer.text;
            }
        );

        // Editor Tools
        // if (mode === "editor") {
        //     game.cameraController = new CameraController(world.camera, canvas);
        //     game.selectionOutline = new SelectionOutline(world, canvas, game.renderer);
        //     game.rulers = new Rulers(game.renderer, world.camera);
        // }

        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: a => game.render(a)
        });
    }

    start(game) {
        game.loop.start();
    }
}
