import Config from "./Config.js";
import RendererManager from "../Renderer/RendererManager.js";
import World from "./World.js";
import GameLoop from "../Loop/GameLoop.js";
import InputManager from "../Input/InputManager.js";
import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import AssetLoader from "../Loader/AssetLoader.js";
import SceneLoader from "../Loader/SceneLoader.js";

// Tools
import CameraController from "../Editor/CameraController.js";
import Rulers from "../Editor/Rulers.js";
import PointerCoordinates from "../Editor/PointerCoordinates.js";
import SelectionTool from "../Editor/SelectionTool.js";
import TransformTool from "../Editor/TransformTool.js";
import Grid from "../Editor/Grid.js";

export default class GameLoader {
    async initializeGame(game, canvas, mode = "runtime", baseURL = "./", payload = {}) {
        Config.ENGINE_MODE = mode;

        game.renderer = new RendererManager(canvas);
        game.input = new InputManager(canvas);
        game.world = new World();

        console.log("📦 [GameLoader] Received Payload:", payload);

        // --- 1. SAFETY CHECK & PREPARATION ---
        // Kita validasi dulu payload-nya. Jika kosong, kita buat object dummy agar tidak crash.
        const safePayload = payload || {};
        
        // Cek apakah 'project' ada isinya. Jika undefined, kita stop atau beri warning.
        if (!safePayload.project) {
            console.error("❌ [GameLoader] CRITICAL: Payload 'project' is missing!", safePayload);
            // Jangan lanjutkan jika data project fatal error, atau gunakan default
             safePayload.project = { name: "Error Project", settings: {}, layers: ["default"] };
        }

        const prepared = this._prepareEditorData(safePayload);
        
        const projectConfig = prepared.project;
        const assetsMap = prepared.assetsMap;
        const sceneData = prepared.sceneData;

        // --- 2. INITIALIZE LOADERS ---
        const glImageLoader = new GLImageResource(game.renderer.gl);
        
        const assetLoader = new AssetLoader(
            glImageLoader,
            async (fntUrl, pngUrl) => {
                await game.renderer.text.loadFont(fntUrl, pngUrl);
                return game.renderer.text; 
            }
        );

        const sceneLoader = new SceneLoader(game.world);
        
        // --- 3. LOAD ASSETS (TANPA FETCH JSON) ---
        // Kita pastikan assetsMap valid. AssetLoader Anda yang baru sudah aman (tidak fetch json).
        console.log(`🔄 [GameLoader] Loading ${Object.keys(assetsMap.textures).length} textures...`);
        game.world.assets = await assetLoader.loadMap(assetsMap, baseURL);

        // --- 4. LOAD SCENE (TANPA FETCH JSON) ---
        if (sceneData) {
            console.log("🔄 [GameLoader] Loading Scene Data...");
            await sceneLoader.load(sceneData, projectConfig, baseURL, game.world.assets);
        } else {
            console.warn("⚠️ [GameLoader] No scene data found in payload.");
        }

        // --- 5. EDITOR TOOLS ---
        if (mode === "editor") {
            this._initializeEditorTools(game, canvas);
        }

        // --- 6. START LOOP ---
        game.loop = new GameLoop({
            update: dt => game.update(dt),
            render: alpha => game.render(alpha),
        });
        
        console.log("✅ [GameLoader] Initialization Complete.");
    }

    _prepareEditorData(payload) {
        // Destructure dengan default empty object untuk keamanan
        const { project, assets, scene } = payload;

        // SAFE GUARD: Jika project null/undefined (meski sudah dicek diatas), gunakan fallback
        const rawProject = project || { name: "Untitled", settings: {}, layers: [] };
        
        const projectConfig = {
            name: rawProject.name,
            ...rawProject.settings, 
            layers: rawProject.layers || ["layer_background", "layer_objects"]
        };

        const texturesMap = {};
        const fontsMap = {};

        // Validasi: Pastikan assets adalah Array
        if (Array.isArray(assets)) {
            assets.forEach(asset => {
                const fileName = asset.fileKey || asset._id;

                if (asset.type === 'texture' || asset.type === 'sprite') {
                    const ext = asset.meta?.extension || '.png';
                    const fullName = `${fileName}${ext}`;
                    
                    texturesMap[asset._id] = {
                        uri: fullName,
                        filterMode: asset.meta?.filterMode || 'smooth' 
                    };
                } else if (asset.type === 'font') {
                    fontsMap[asset._id] = fileName; 
                }
            });
        }

        return {
            project: projectConfig,
            assetsMap: {
                textures: texturesMap,
                fonts: fontsMap
            },
            // Jika scene undefined, kirim object kosong agar SceneLoader tidak error
            sceneData: scene || { entities: [] } 
        };
    }

    _initializeEditorTools(game, canvas) {
        const { world, renderer, camera, input } = game;

        if (Config.EDITOR.CAMERA_CONTROLLER)
            game.cameraController = new CameraController(camera, canvas, input);

        if (Config.EDITOR.GRID)
            game.grid = new Grid(world, game, canvas, renderer, camera, {
                color: "#ffffff", width: 50, height: 50, alpha: 0.5
            });

        if (Config.EDITOR.SELECTION) {
            game.selection = new SelectionTool(world, game, canvas, renderer, input);
            if (!world.layers.has("__editor_selection")) {
                world.layers.set("__editor_selection", []);
                world.layerOrder.push("__editor_selection");
            }
        }

        if (Config.EDITOR.TRANSFORM)
            game.transform = new TransformTool(game.selection, world, game, canvas, renderer, input);

        if (Config.EDITOR.RULERS)
            game.rulers = new Rulers(renderer, camera);

        if (Config.EDITOR.POINTER)
            game.pointerCoords = new PointerCoordinates(game, renderer);
    }

    start(game) {
        if(game.loop) game.loop.start();
    }
}