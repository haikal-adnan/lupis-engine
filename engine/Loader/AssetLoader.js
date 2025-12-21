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

        // 1. Process Textures
        if (assetsMap.textures) {
            const texturePromises = Object.entries(assetsMap.textures).map(([id, val]) => {
                const config = (typeof val === 'string') ? { uri: val, filterMode: 'smooth' } : val;
                const url = pathPrefix + config.uri;
                
                return this._loadTexture(id, url, config)
                    .catch(err => console.error(`❌ Failed texture: ${config.uri}`, err));
            });
            promises.push(...texturePromises);
        }

        // 2. Process Fonts
        if (assetsMap.fonts) {
            const fontPromises = Object.entries(assetsMap.fonts).map(([id, fileKey]) => {
                return this._loadFont(id, fileKey, pathPrefix)
                    .catch(err => console.error(`❌ Failed font: ${fileKey}`, err));
            });
            promises.push(...fontPromises);
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

    async _loadFont(id, fileKey, pathPrefix) {
        const cleanKey = fileKey.replace(/\.[^/.]+$/, ""); // Strip extension
        const fntUrl = `${pathPrefix}${cleanKey}.fnt`;
        const pngUrl = `${pathPrefix}${cleanKey}.png`;
        
        this.assets.fonts[id] = await this.fontLoaderFunc(fntUrl, pngUrl);
    }
     
    _normalizeTextureResult(raw) {
        if (!raw) return null;

        // Handle GL Texture Wrapper
        if (raw.texture || raw.glTexture) {
            return { 
                type: "gl", 
                glTexture: raw.texture || raw.glTexture, 
                width: raw.width || raw.w, 
                height: raw.height || raw.h, 
                meta: raw 
            };
        }

        // Handle Raw HTML Image
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