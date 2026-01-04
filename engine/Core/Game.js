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

            // 1. HANDLE TEXTURE / IMAGE
            const isTexture = ['texture', 'sprite', 'image'].includes(assetData.type) || 
                              assetData.itemType === 'image';
                              
            if (isTexture) {
                const loader = new GLImageResource(this.renderer.gl);
                try {
                    const textureData = await loader.loadTextureFromAsset(assetData);
                    if (!this.world.assets.textures) this.world.assets.textures = {};
                    this.world.assets.textures[assetData._id] = textureData;
                    console.log(`✅ Engine: Texture loaded [${assetData.name}]`);
                } catch (err) {
                    console.error("❌ Engine: Failed runtime texture load", err);
                }
                return; // Selesai untuk texture
            }

            // 2. HANDLE FONT (KODE BARU)
            const isFont = ['font', 'typeface'].includes(assetData.type) || 
                           assetData.itemType === 'font' ||
                           (assetData.meta?.extension && ['.ttf', '.fnt'].includes(assetData.meta.extension));

            if (isFont) {
                try {
                    // Konstruksi URL (Sesuaikan logika ini dengan AssetLoader kamu)
                    const baseUrl = this.world.cdnUrl || Config.CDN_URL || ""; 
                    const pathPrefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
                    
                    // Asumsi: assetData memiliki fileKey. Jika .ttf, backend harusnya sudah convert ke .fnt + .png
                    // Kita ambil nama file tanpa ekstensi untuk mencari pasangan .fnt dan .png
                    const fileKey = assetData.fileKey;
                    const cleanKey = fileKey.replace(/\.[^/.]+$/, ""); 
                    
                    // Construct URL untuk folder projects
                    const pId = assetData.projectId;
                    const fullPrefix = `${pathPrefix}projects/${pId}/`;
                    
                    const fntUrl = `${fullPrefix}${cleanKey}.fnt`;
                    const pngUrl = `${fullPrefix}${cleanKey}.png`;

                    // Gunakan TextRenderer yang sudah ada di instance renderer untuk memuat font
                    // Pastikan TextRenderer memiliki method loadFont yang public
                    if (this.renderer && this.renderer.text) {
                        const fontData = await this.renderer.text.loadFont(fntUrl, pngUrl);
                        
                        if (!this.world.assets.fonts) this.world.assets.fonts = {};
                        this.world.assets.fonts[assetData._id] = fontData;
                        
                        console.log(`✅ Engine: Font loaded [${assetData.name}]`);
                    }
                } catch (err) {
                    console.error("❌ Engine: Failed runtime font load", err);
                }
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

    getAssetMeta(assetId) {
        return TextureUtil.getAssetMetaFromWorld(this.world, assetId);
    }

    computeThumbnailStyle(url, source, assetId, containerSize) {
        const dims = this.getAssetMeta(assetId);
        if (!dims) return null; 
        return TextureUtil.getThumbnailStyle(url, source, dims, containerSize);
    }

    handleHierarchyUpdate({ _id, parentId, layerId, reorderInfo }) {
        const entity = this.world.entities.find(e => String(e._id) === String(_id));
        if (!entity) return;

        const nextParentId = parentId || null;
        const nextLayerId = layerId;

        entity.parentId = nextParentId;
        entity.layerId = nextLayerId;

        const siblings = this.world.entities.filter(e => {
            if (String(e._id) === String(_id)) return false;

            const eParent = e.parentId || null;
            return String(eParent) === String(nextParentId) && 
                   String(e.layerId) === String(nextLayerId);
        });

        siblings.sort((a, b) => {
            const zA = Number(a.transform?.zIndex ?? 0);
            const zB = Number(b.transform?.zIndex ?? 0);
            
            if (zA !== zB) return zA - zB;
            
            return String(a._id).localeCompare(String(b._id));
        });

        if (reorderInfo && reorderInfo.position !== 'inside') {
            const targetId = reorderInfo.targetId;
            const targetIndex = siblings.findIndex(e => String(e._id) === String(targetId));

            if (targetIndex !== -1) {
                if (reorderInfo.position === 'top') {
                    siblings.splice(targetIndex, 0, entity);
                } else {
                    siblings.splice(targetIndex + 1, 0, entity);
                }
            } else {
                siblings.push(entity);
            }
        } else {
            siblings.push(entity);
        }

        siblings.forEach((sib, index) => {
            if (!sib.transform) sib.transform = {};
            sib.transform.zIndex = index;
            
            sib.parentId = nextParentId;
            sib.layerId = nextLayerId;
        });

        bus.emit("entity:modified", siblings);
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