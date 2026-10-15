import RuntimeLoader from "./RuntimeLoader.js";
import Config from "../Core/Config.js";

import CameraController from "../Editor/CameraController.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TilemapTool from "../Editor/TilemapTool.js";
import TransformTool from "../Editor/TransformTool.js";
import ShapeTool from "../Editor/ShapeTool.js";
import SyncComponent from "../Editor/SyncComponent.js";
import Grid from "../Editor/Grid.js";
import Rulers from "../Editor/Rulers.js";
import EditorRenderer from "../Renderer/Scene/EditorRenderer.js";

import { TransformEngine } from "../Editor/Transform/TransformEngine.js";
import { bus } from "../Util/EventBus.js";

export default class EditorLoader extends RuntimeLoader {
    async initializeGame(game, canvas, baseURL, mode = "editor", payload = {}) {
        this._setupEditorState(game, payload.editorConfig);

        await super.initializeGame(game, canvas, baseURL, mode, payload);
    }

    _onPostInit(game, canvas, payload) {
        this._initializeEditorTools(game, canvas);
    }

    _initMain(game, canvas, mode) {
        super._initMain(game, canvas, mode);
    }

    _setupEditorState(game, config = {}) {
        game.world._editors = {
            activeTool: config.activeTool || "select",
            activeTabId: config.activeTabId || "scene",
            tabs: config.tabs || [],
            tilemapContext: {
                showOthers: config.tilemapContext?.showOthers ?? true,
                opacity: config.tilemapContext?.opacity ?? 0.5
            },
        };
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;
        const { EDITOR } = Config;

        game.transformEngine = new TransformEngine(world);

        const editorRenderer = new EditorRenderer(
            renderer.image, 
            renderer.shape, 
            renderer.text, 
            game
        );
        renderer.setEditorRenderer(editorRenderer);

        if (EDITOR.CAMERA_CONTROLLER) 
            game.cameraController = new CameraController(camera, canvas, input);

        if (EDITOR.GRID) {
            game.grid = new Grid(world, game, canvas, renderer, camera);
            world.gridRenderer = (shape, proj) => {
                if (world.settings.grid?.visible) game.grid.render(shape, proj);
            };
        }

        if (EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input, game.transformEngine);
        }

        if (EDITOR.TRANSFORM) {
            game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);
        }

        if (EDITOR.RULERS) {
            game.rulers = new Rulers(game);
            world.ui.push(ui => {
                if (world.settings.showRulers) game.rulers.render(ui);
            });
        }

        if (EDITOR.POINTER) game.pointerCoords = new PointerCoordinates(game, renderer);

        game.tilemapTool = new TilemapTool(game);
        game.shapeTool = new ShapeTool(game);
        game.syncSystem = new SyncComponent(world, bus, game); 
    }
}