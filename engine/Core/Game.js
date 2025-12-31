import GameLoop from "../Loop/GameLoop.js";
import World from "./World.js";
import Camera from "../Util/Camera.js";
import Config from "./Config.js";
import { bus } from "../Util/EventBus.js";
import { SyncEntityComponents } from "../Util/SyncEntity.js";

import GLImageResource from "../Renderer/Graphic/GLImageResource.js";
import TextureUtil from "../Util/TextureUtil.js";

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

        bus.on("entity:modified", (entities) => {
            if (Array.isArray(entities)) {
                entities.forEach(entity => SyncEntityComponents(entity, this));
            }
        });

        bus.on("engine:load_asset", async (assetData) => {
            if (!this.renderer) return;

            const loader = new GLImageResource(this.renderer.gl);
            try {
                const textureData = await loader.loadTextureFromAsset(assetData);
                
                // Simpan ke World
                if (!this.world.assets.textures) this.world.assets.textures = {};
                this.world.assets.textures[assetData._id] = textureData;

                console.log(`✅ Engine: Texture loaded [${assetData.name}]`);
            } catch (err) {
                console.error("❌ Engine: Failed runtime load", err);
            }
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

    // --- BERSIH: Logic Meta dipindah ke TextureUtil ---
    getAssetMeta(assetId) {
        return TextureUtil.getAssetMetaFromWorld(this.world, assetId);
    }

    // --- BERSIH: Logic Thumbnail dipindah ke TextureUtil ---
    computeThumbnailStyle(url, source, assetId, containerSize) {
        const dims = this.getAssetMeta(assetId);
        if (!dims) return null; 
        return TextureUtil.getThumbnailStyle(url, source, dims, containerSize);
    }

    render(alpha) {
        const cam = this.camera.getInterpolated(alpha);
        this.history?.update();
        if(this.cameraController) this.cameraController.update();
        if (this.selection) this.selection.update();
        if (this.transform) this.transform.update();
        if (this.pointerCoords) this.pointerCoords.update();

        this.renderer?.render(this.world, cam, this);
    }
}