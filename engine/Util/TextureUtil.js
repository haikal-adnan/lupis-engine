export default class TextureUtil {
    
    // --- Helper CSS Thumbnail ---
    static getThumbnailStyle(url, source, dims, containerSize = 48) {
        if (!url || !dims || dims.width === 0) return { display: 'none' };

        const sx = Number(source.x) || 0;
        const sy = Number(source.y) || 0;
        const sw = Number(source.w) || dims.width; 
        
        // Scale logic
        const scale = containerSize / Math.max(sw, 1);

        return {
            backgroundImage: `url('${url}')`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: `${-sx * scale}px ${-sy * scale}px`,
            backgroundSize: `${dims.width * scale}px ${dims.height * scale}px`,
            imageRendering: 'pixelated',
            width: '100%',
            height: '100%'
        };
    }

    // --- Helper Browser Cache Size ---
    static fetchImageSize(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 0, height: 0 });
            img.src = url;
        });
    }

    // --- BARU: Helper Ambil Meta dari Engine World ---
    static getAssetMetaFromWorld(world, assetId) {
        if (!world || !world.assets || !world.assets.textures) return null;
        
        const texture = world.assets.textures[assetId];
        if (texture) {
            return { width: texture.width, height: texture.height };
        }
        return null;
    }
}