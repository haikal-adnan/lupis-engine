import { econsole } from "../Util/EngineConsole.js";

export default class AssetLoader {
    constructor(glLoader, fontLoaderFunc) {
        this.glLoader = glLoader;
        this.fontLoaderFunc = fontLoaderFunc;
        this.assets = { textures: {}, fonts: {} };
    }

    async loadMap(assetsMap, baseURL) {
        if (!assetsMap) return this.assets;
        
        const pathPrefix = baseURL.endsWith('/') ? baseURL : baseURL + '/';
        const promises = [];

        if (assetsMap.textures) {
            for (const [id, config] of Object.entries(assetsMap.textures)) {
                let url = config.fileUrl;
                if (!url) {
                    const uri = config.uri || '';
                    url = (uri.startsWith('http') || uri.startsWith('blob:')) ? uri : pathPrefix + uri;
                }

                promises.push(
                    this._loadTexture(id, url, config)
                        // [UPDATE] Log error ke econsole, tapi jangan throw agar Promise.all jalan terus
                        .catch(() => econsole.warn(`[AssetLoader] Texture 404: ${url}`)) 
                );
            }
        }

        if (assetsMap.fonts) {
            for (const [id, config] of Object.entries(assetsMap.fonts)) {
                const rawKey = config.fileKey || config.uri || 'unknown_font';
                const cleanKey = String(rawKey).replace(/\.[^/.]+$/, ""); 

                const fntUrl = `${pathPrefix}${cleanKey}.fnt`;
                const pngUrl = `${pathPrefix}${cleanKey}.png`;

                promises.push(
                    this.fontLoaderFunc(fntUrl, pngUrl)
                        .then(font => {
                            // Validasi hasil load font (karena loadFont return null jika gagal)
                            if (font) this.assets.fonts[id] = font;
                            else throw new Error("Font load returned null");
                        })
                        .catch(() => econsole.warn(`[AssetLoader] Font 404: ${cleanKey}`))
                );
            }
        }

        await Promise.all(promises);
        return this.assets;
    }

    async _loadTexture(id, url, config) {
        // [UPDATE] Gunakan Try-Catch block di sini
        try {
            const raw = await this.glLoader.load(url);
            const normalized = this._normalizeTextureResult(raw);
            if (normalized) {
                this.assets.textures[id] = { ...normalized, filterMode: config.filterMode };
            }
        } catch (err) {
            // Re-throw agar ditangkap oleh .catch di loop utama dan dicatat
            throw err; 
        }
    }
      
    _normalizeTextureResult(raw) {
        if (!raw) return null;
        if (raw.texture || raw.glTexture) {
            return { type: "gl", glTexture: raw.texture || raw.glTexture, width: raw.width || raw.w, height: raw.height || raw.h, meta: raw };
        }
        if (raw instanceof HTMLImageElement || raw.src) {
            return { type: "image", image: raw, width: raw.naturalWidth || raw.width, height: raw.naturalHeight || raw.height };
        }
        return null;
    }
}