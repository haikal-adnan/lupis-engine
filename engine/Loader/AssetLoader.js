export default class AssetLoader {
    constructor(glLoader, fontLoaderFunc) {
        this.glLoader = glLoader;
        this.fontLoaderFunc = fontLoaderFunc;
        // Container penyimpanan hasil load
        this.assets = { textures: {}, fonts: {} };
    }

    async loadMap(assetsMap, baseURL) {
        if (!assetsMap) return this.assets;

        const promises = [];

        // 1. Queue Textures
        if (assetsMap.textures) {
            for (const [id, val] of Object.entries(assetsMap.textures)) {
                // Handle jika val berupa string (Legacy/Simple JSON) atau Object (Editor Payload)
                const config = (typeof val === 'string') 
                    ? { uri: val, filterMode: 'smooth' } 
                    : val;

                const url = baseURL + config.uri;
                
                promises.push(
                    this._loadTexture(id, url, config)
                        .catch(err => console.error(`Failed: ${config.uri}`, err))
                );
            }
        }
        // 2. Queue Fonts
        if (assetsMap.fonts) {
            for (const [id, fileName] of Object.entries(assetsMap.fonts)) {
                promises.push(
                    this._loadFont(id, fileName, baseURL)
                        .catch(err => console.error(`[AssetLoader] Failed font: ${fileName}`, err))
                );
            }
        }

        // 3. Tunggu semua selesai (Parallel)
        await Promise.all(promises);
        
        return this.assets;
    }

    async _loadTexture(id, url, config) {
        const raw = await this.glLoader.load(url);
        const normalized = this._normalizeTextureResult(raw);
        if (normalized) {
            // Gabungkan hasil load dengan meta filterMode dari backend
            this.assets.textures[id] = {
                ...normalized,
                filterMode: config.filterMode 
            };
        }
    }

    async _loadFont(id, fileName, baseURL) {
        // Asumsi format font bitmap: .fnt dan .png dengan nama sama
        const cleanPath = fileName.replace(/\.[^/.]+$/, "");
        const fntPath = baseURL + fileName;
        const pngPath = baseURL + cleanPath + ".png";
        
        this.assets.fonts[id] = await this.fontLoaderFunc(fntPath, pngPath);
    }

    _normalizeTextureResult(raw) {
        if (!raw) return null;
        console.log(raw)
        // Jika output dari GLImageResource adalah WebGL Texture
        if (raw.texture || raw.glTexture) {
            return { 
                type: "gl", 
                glTexture: raw.texture || raw.glTexture, 
                width: raw.width || raw.w, 
                height: raw.height || raw.h, 
                meta: raw 
            };
        }

        // Fallback untuk HTML Image (jarang terjadi jika pake GLImageResource)
        if (raw instanceof HTMLImageElement || raw.src) {
            return { 
                type: "image", 
                image: raw, 
                width: raw.naturalWidth || raw.width, 
                height: raw.naturalHeight || raw.height 
            };
        }
        
        return null;
    }
}