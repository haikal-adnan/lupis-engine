// engine/Loader/GameLoader.js

import Config from "../Config/Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "../World/World.js";
import GameLoop from "../Loop/GameLoop.js";
import CameraController from "../Editor/CameraController.js";
import SelectionOutline from "../Editor/SelectionOutline.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import GLImageResource from "../Renderer/GLImageResource.js";
import EntityMoveTool from "../Editor/EntityMoveTool.js";

export default class GameLoader {

    async initializeGame(game, canvas, mode = "runtime", baseURL = "./") {
        Config.ENGINE_MODE = mode;

        game.renderer = new RendererManager(canvas);
        const gl = game.renderer.gl;
        const loader = new GLImageResource(gl);

        // WORLD
        const world = new World();
        game.world = world;

        const project = await fetch(baseURL + "project.json").then(r => r.json());
        const sceneName = project.startScene;
        const scene = await fetch(`${baseURL}scenes/${sceneName}.json`).then(r => r.json());

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

        if (mode === "editor") {

            if (Config.EDITOR.CAMERA_CONTROLLER)
                game.cameraController = new CameraController(game.camera, canvas);

            if (Config.EDITOR.SELECTION)
                game.selectionOutline = new SelectionOutline(world, game, canvas, game.renderer);
                //                          ⬆ world  ⬆ game  ⬆ canvas  ⬆ renderer

            if (Config.EDITOR.MOVE && Config.EDITOR.SELECTION){
                game.selectionOutline = new SelectionOutline(world, game, canvas, game.renderer);
                // ---------------------------
                // ✨ Tambahkan MoveTool
                // ---------------------------
                game.entityMoveTool = new EntityMoveTool(
                    world,
                    game,
                    canvas,
                    game.selectionOutline
                );
            }

            if (Config.EDITOR.RULERS)
                game.rulers = new Rulers(game.renderer, game.camera);

            if (Config.EDITOR.POINTER)
                game.pointerCoords = new PointerCoordinates(game, game.renderer);
        }


        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: a  => game.render(a),
        });
    }

    start(game) {
        game.loop.start();
    }
}
