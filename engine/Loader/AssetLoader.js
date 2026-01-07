import { DEFAULT_FONT_XML, DEFAULT_FONT_TEXTURE_B64 } from "../Assets/Fonts/defaultFont.js";

export default class AssetLoader {
    constructor(imageResource, fontResource) {
        this.imageResource = imageResource;
        this.fontResource = fontResource;
    }

    async loadAsset(world, assets) {
        await this._loadSystemDefault(world);

        for (const asset of assets) {
            try {
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
            } catch (err) {
                console.error(
                    `[AssetLoader] Failed to load asset: ${asset.name} (${asset._id})`,
                    err
                );
            }
        }
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
                await this.fontResource.loadFontFromAsset(defaultAsset);

            world.addFont(defaultAsset._id, fontResult);

            URL.revokeObjectURL(xmlUrl);

            console.log("[AssetLoader] System Default Font loaded.");
        } catch (e) {
            console.error(
                "[AssetLoader] CRITICAL: Failed to load System Default Font.",
                e
            );
        }
    }

    async loadTexture(world, asset) {
        const textureData =
            await this.imageResource.loadTextureFromAsset(asset);

        const data = {
            _id: asset._id,
            glTexture: textureData.glTexture,
            fileurl: asset.fileUrl,
            width: textureData.width,
            height: textureData.height,
            filterMode: asset.meta?.filterMode || "nearest"
        };

        world.addTexture(asset._id, data);
    }

    async loadFont(world, asset) {
        const fontResult =
            await this.fontResource.loadFontFromAsset(asset);

        if (fontResult) {
            world.addFont(asset._id, fontResult);
        }
    }
}
