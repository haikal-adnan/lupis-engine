import { DEFAULT_FONT_XML, DEFAULT_FONT_TEXTURE_B64 } from "../Assets/Fonts/defaultFont.js";
import Config from "../Core/Config.js";

export default class AssetLoader {
    constructor(imageResource, fontResource, audioResource) {
        this.imageResource = imageResource;
        this.fontResource = fontResource;
        this.audioResource = audioResource;
        this._isSystemDefaultLoaded = false;
    }

    async loadAsset(world, assets, baseURL) {
        if (!this._isSystemDefaultLoaded) {
            await this._loadSystemDefault(world);
            this._isSystemDefaultLoaded = true;
        }
        
        if (!world.audios) world.audios = {};

        const loadPromises = assets.map(async (asset) => {
            try {
                switch (asset.type) {
                    case "texture":
                        await this.loadTexture(world, asset, baseURL);
                        break;
                    case "font":
                        await this.loadFont(world, asset, baseURL);
                        break;
                    case "audio":
                        if (Config.ENGINE_MODE !== "editor") {
                            await this.loadAudio(world, asset, baseURL);
                        } 
                        break;
                }
            } catch (err) {
                console.error(`[AssetLoader] Failed to load: ${asset.name}`, err);
            }
        });

        await Promise.all(loadPromises);
    }

    async _loadSystemDefault(world) {
        try {
            const blob = new Blob([DEFAULT_FONT_XML], {
                type: "application/xml"
            });
            const xmlUrl = URL.createObjectURL(blob);

            const defaultAsset = {
                _id: "system_default",
                name: "System Default Font",
                fileUrl: xmlUrl, 
                meta: {
                    textureUrl: DEFAULT_FONT_TEXTURE_B64
                }
            };

            const fontResult =
                await this.fontResource.loadFontFromAsset(defaultAsset, null, true);

            world.addFont(defaultAsset._id, fontResult);

            URL.revokeObjectURL(xmlUrl);
        } catch (e) {
            console.error(
                "[AssetLoader] CRITICAL: Failed to load System Default Font.",
                e
            );
        }
    }

    async loadTexture(world, asset, baseURL) {
        const textureData =
            await this.imageResource.loadTextureFromAsset(asset, baseURL);

        const data = {
            _id: asset._id,
            glTexture: textureData.glTexture,
            fileurl: textureData.src, 
            width: textureData.width,
            height: textureData.height,
            filterMode: asset.meta?.filterMode || "nearest"
        };

        world.addTexture(asset._id, data);
    }

    async loadFont(world, asset, baseURL) {
        const fontResult =
            await this.fontResource.loadFontFromAsset(asset, baseURL);

        if (fontResult) {
            world.addFont(asset._id, fontResult);
        }
    }

    async loadAudio(world, asset, baseURL) {
        const audioData = await this.audioResource.loadAudioFromAsset(asset, baseURL);
        
        if (audioData && audioData.buffer) {
            world.audios[asset._id] = audioData.buffer; 
        }
    }
}