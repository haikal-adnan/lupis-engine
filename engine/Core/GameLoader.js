// engine/Loader/GameLoader.js

import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import CameraController from "../Editor/CameraController.js";
import SelectionOutline from "../Editor/SelectionOutline.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
// import EntityMoveTool from "../Editor/EntityMoveTool.js";
import InputManager from "../Input/InputManager.js";
// import TransformBox from "../Editor/TransformBox.js";

export default class GameLoader {

    async initializeGame(game, canvas, mode = "runtime", baseURL = "./") {
        Config.ENGINE_MODE = mode;

        game.renderer = new RendererManager(canvas);
        const gl = game.renderer.gl;
        const loader = new GLImageResource(gl);

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

        game.input = new InputManager(canvas);

        if (mode === "editor") {

            if (Config.EDITOR.CAMERA_CONTROLLER)
                game.cameraController = new CameraController(game.camera, canvas, game.input);

            if (Config.EDITOR.SELECTION)
                game.selectionOutline = new SelectionOutline(world, game, canvas, game.renderer, game.input);

            // if (Config.EDITOR.MOVE && Config.EDITOR.SELECTION){
            //     game.entityMoveTool = new EntityMoveTool(
            //         world,
            //         game,
            //         canvas,
            //         game.input,
            //         game.selectionOutline,
            //     );
            // }

            if (Config.EDITOR.RULERS)
                game.rulers = new Rulers(game.renderer, game.camera);

            if (Config.EDITOR.POINTER)
                game.pointerCoords = new PointerCoordinates(game, game.renderer);

            // if (Config.EDITOR.TRANSFORM)
            //     game.transformBox = new TransformBox(
            //         world,
            //         game,
            //         canvas,
            //         game.renderer,
            //         game.input,
            //         game.selectionOutline,
            //     );
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
