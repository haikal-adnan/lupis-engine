import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import GLFontResource from "../Renderer/Graphic/GLFontResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js"; 

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", payload = {}) {
        try {
            this._initMain(game, canvas, mode);
        } catch (err) {
            console.error("[GameLoader] Critical Init Failed.", err);
            return;
        }

        const { project, assets, scene, prefabs } = payload;

        try {
            this._initProject(game, project);
        } catch (err) {
            console.error("[GameLoader] Project Init Failed.", err);
            return;
        }

        const textureLoader = new GLImageResource(game.renderer.gl);
        const fontLoader = new GLFontResource(game.renderer.gl);
        const assetLoader = new AssetLoader(textureLoader, fontLoader);

        try {
            await this._initAsset(assetLoader, game.world, assets);
        } catch (err) {
            console.error("[GameLoader] Asset Init Failed.", err);
            return;
        }

        try {
            this._initPrefabLibrary(game.world, prefabs);
        } catch (err) {
            console.error("[GameLoader] Prefab Init Failed.", err);
        }

        if (scene && scene.entities) {
            try {
                const sceneLoader = new SceneLoader(game.world);
                sceneLoader.loadScene(scene);
            } catch (err) {
                console.error("[GameLoader] Scene Load Failed.", err);
            }
        } else {
            console.warn("[GameLoader] No valid scene object found in payload.");
        }

        console.log("🚀 Game Initialized Successfully!");
        console.log(game.world);
    }

    _initMain(game, canvas, mode) {
        Config.ENGINE_MODE = mode;
        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();
    }

    _initProject(game, project) {
        game._id = project._id;

        game.world.layers = project.layers.map(layer => ({
            _id: layer._id,
            visible: layer.visible,
            locked: layer.locked,
            entities: []
        }));

        Config.WIDTH = project.settings.width;
        Config.HEIGHT = project.settings.height;
        Config.BACKGROUND_COLOR = project.settings.backgroundColor;
    }

    _initAsset(assetLoader, world, assets) {
        return assetLoader.loadAsset(world, assets);
    }

    _initPrefabLibrary(world, prefabs) {
        if (!Array.isArray(prefabs)) return;

        world.prefabs = prefabs.reduce((map, item) => {
            map[item._id] = {
                _id: item._id,
                name: item.name,
                data: item.data
            };
            return map;
        }, {});

        console.log(
            `[GameLoader] Registered ${Object.keys(world.prefabs).length} prefabs.`
        );
    }
}
