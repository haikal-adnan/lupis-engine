export default class AssetLoader {
    constructor(glLoader, fontLoaderFunc) {
        this.glLoader = glLoader;
        this.fontLoaderFunc = fontLoaderFunc;
        this.assets = { textures: {}, fonts: {} };
    }

    async loadMap(assetsMap, baseURL) {
        if (!assetsMap) return this.assets;

        const promises = [];

        if (assetsMap.textures) {
            for (const [id, path] of Object.entries(assetsMap.textures)) {
                promises.push(this._loadTexture(id, baseURL + "assets/" + path));
            }
        }

        if (assetsMap.fonts) {
            for (const [id, path] of Object.entries(assetsMap.fonts)) {
                promises.push(this._loadFont(id, path, baseURL));
            }
        }

        await Promise.all(promises);
        return this.assets;
    }

    async _loadTexture(id, url) {
        try {
            const raw = await this.glLoader.load(url);
            this.assets.textures[id] = this._normalizeTextureResult(raw);
        } catch (err) {
            console.error("Failed to load texture", id, url, err);
        }
    }

    async _loadFont(id, path, baseURL) {
        try {
            const cleanPath = path.replace(/\.[^/.]+$/, "");
            const fntPath = baseURL + "assets/" + path;
            const pngPath = baseURL + "assets/" + cleanPath + ".png";
            this.assets.fonts[id] = await this.fontLoaderFunc(fntPath, pngPath);
        } catch (err) {
            console.error("Failed to load font", id, path, err);
        }
    }

    _normalizeTextureResult(raw) {
        if (!raw) return null;
        if (raw instanceof HTMLImageElement) {
            return { type: "image", image: raw, width: raw.naturalWidth || raw.width, height: raw.naturalHeight || raw.height };
        }
        if (raw.texture || raw.glTexture) {
            return { type: "gl", glTexture: raw.texture || raw.glTexture, width: raw.width || raw.w, height: raw.height || raw.h, meta: raw };
        }
        if (raw.src) {
            return { type: "image", image: raw, width: raw.naturalWidth || raw.width, height: raw.naturalHeight || raw.height };
        }
        return { type: "unknown", value: raw };
    }
}