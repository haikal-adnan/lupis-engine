import { econsole } from "../Util/EngineConsole.js";

export default class AssetLoader {
    constructor(imageResource, fontResource) {
        this.imageResource = imageResource
        this.fontResource = fontResource 
    }

    async loadAsset(world, assets) {
        for (const asset of assets) {
            switch (asset.type) {
                case "texture":
                    await this.loadTexture(world, asset);
                    break;
                case "font":
                    await this.loadFont(world, asset);
                    break;
                default:
                    break;
            }
        }
    }

    async loadTexture(world, asset) {
        try {
            const textureData = await this.imageResource.loadTextureFromAsset(asset);
            
            const data = {
                _id: asset._id, 
                gltexture: textureData.glTexture,
                fileurl: asset.fileUrl,
                width: textureData.width,
                height: textureData.height,
                filterMode: asset.meta?.filterMode || "nearest"
            };

            // Simpan ke world menggunakan key _id
            world.addTexture(asset._id, data);

        } catch (error) {
            console.error(error);
        }
    }

    async loadFont(world, asset) {
        const fontResult = await this.fontResource.loadFontFromAsset(asset);
        
        if (fontResult) {
            // Font result sudah dimodifikasi di class GLFontResource untuk pakai _id
            world.addFont(asset._id, fontResult);
        }
    }
}