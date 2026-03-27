let __textureID = 1;

export default class GLImageResource {
    constructor(gl) {
        this.gl = gl;
    }

    async loadTextureFromAsset(asset, baseURL) {
        let src;
        if (asset.fileKey && asset.meta.extension) {
            src = `${baseURL}${asset.fileKey}${asset.meta.extension}`;
        }
        const img = await this._loadImage(src);
        const textureData = this._uploadToGPU(img); // Tidak perlu parameter filter lagi
        textureData.src = src;
        textureData.image = img;
        return textureData;
    }
    
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    async load(url, config = {}) {
        const img = await this._loadImage(url);
        
        // --- HARDCODE KE LINEAR UNTUK MENDUKUNG SDF ---
        const filter = this.gl.LINEAR;
        
        return this._uploadToGPU(img, filter);
    }

    _uploadToGPU(image) {
        const gl = this.gl;
        const tex = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Upload awal biarkan NEAREST, nanti akan di-override oleh ImageRenderer
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return {
            id: __textureID++, type: "gl", glTexture: tex,
            width: image.width, height: image.height
        };
    }
}