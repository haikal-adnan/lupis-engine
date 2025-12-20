export default class AssetLoader {
    constructor(glLoader, fontLoaderFunc) {
        this.glLoader = glLoader;
        this.fontLoaderFunc = fontLoaderFunc;
        this.assets = { textures: {}, fonts: {} };
    }

    async loadMap(assetsMap, baseURL) {
        if (!assetsMap) return this.assets;

        const promises = [];

        // 1. Queue Textures
        if (assetsMap.textures) {
            for (const [id, val] of Object.entries(assetsMap.textures)) {
                const config = (typeof val === 'string') 
                    ? { uri: val, filterMode: 'smooth' } 
                    : val;

                const url = baseURL + config.uri;
                
                promises.push(
                    this._loadTexture(id, url, config)
                        .catch(err => console.error(`Failed texture: ${config.uri}`, err))
                );
            }
        }

        // 2. Queue Fonts
        if (assetsMap.fonts) {
            for (const [id, fileKey] of Object.entries(assetsMap.fonts)) {
                promises.push(
                    this._loadFont(id, fileKey, baseURL)
                        .catch(err => console.error(`[AssetLoader] Failed font: ${fileKey}`, err))
                );
            }
        }

        await Promise.all(promises);
        return this.assets;
    }

    async _loadTexture(id, url, config) {
        const raw = await this.glLoader.load(url);
        const normalized = this._normalizeTextureResult(raw);
        if (normalized) {
            this.assets.textures[id] = {
                ...normalized,
                filterMode: config.filterMode 
            };
        }
    }


    async _loadFont(id, fileKey, baseURL) {
        // fileKey adalah nama file fisik di storage (misal: "uud-v4-uuid.ttf" atau "uud-v4-uuid")
        // Kita perlu membuang ekstensinya (misal .ttf) agar bisa diganti .fnt dan .png
        
        // Regex: Hapus teks mulai dari titik terakhir sampai ujung string
        const cleanKey = fileKey.replace(/\.[^/.]+$/, "");
        
        const pathPrefix = baseURL.endsWith('/') ? baseURL : baseURL + '/';

        // Engine otomatis mencari pasangan .fnt dan .png
        const fntUrl = `${pathPrefix}${cleanKey}.fnt`;
        const pngUrl = `${pathPrefix}${cleanKey}.png`;

        // console.log(`🔤 Loading Font: ${cleanKey}`);
        
        this.assets.fonts[id] = await this.fontLoaderFunc(fntUrl, pngUrl);
    }
     
    _normalizeTextureResult(raw) {
        if (!raw) return null;

        if (raw.texture || raw.glTexture) {
            return { 
                type: "gl", 
                glTexture: raw.texture || raw.glTexture, 
                width: raw.width || raw.w, 
                height: raw.height || raw.h, 
                meta: raw 
            };
        }

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