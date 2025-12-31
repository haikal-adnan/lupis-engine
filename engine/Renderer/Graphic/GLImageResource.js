let __textureID = 1;

export default class GLImageResource {
    constructor(gl) {
        this.gl = gl;
    }

    // --- BARU: Method All-in-One untuk Runtime Load ---
    async loadTextureFromAsset(asset) {
        // 1. Resolve Source (Blob vs URL)
        let src = asset.fileUrl;
        if (asset.localBlob) {
            src = URL.createObjectURL(asset.localBlob);
        }

        if (!src) throw new Error("No source found for asset");

        // 2. Load Image
        const img = await this._loadImage(src);

        // 3. Tentukan Filter Mode
        const filterMode = (asset.meta?.filterMode === 'linear') 
            ? this.gl.LINEAR 
            : this.gl.NEAREST;

        // 4. Upload ke GPU
        const textureData = this._uploadToGPU(img, filterMode);

        // Tambahkan properti src/image asli untuk referensi jika perlu
        textureData.src = src;
        textureData.image = img;
        
        return textureData;
    }

    // Wrapper Promise untuk load image HTML
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
        const filter = config.filterMode === 'linear' ? this.gl.LINEAR : this.gl.NEAREST;
        return this._uploadToGPU(img, filter);
    }

    // --- UPDATE: Terima parameter filterMode ---
    _uploadToGPU(image, filterMode) {
        const gl = this.gl;
        const tex = gl.createTexture();
        const filter = filterMode || gl.NEAREST; // Default Nearest/Pixelated

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        // Upload Pixel
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Set Parameter
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return {
            id: __textureID++,
            type: "gl",
            glTexture: tex,
            width: image.width,
            height: image.height
        };
    }
}