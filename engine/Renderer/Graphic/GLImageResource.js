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

        console.log(`${baseURL}${asset.fileKey}${asset.meta.extension}`)

        const img = await this._loadImage(src);

        const filterMode = (asset.meta?.filterMode === 'linear') 
            ? this.gl.LINEAR 
            : this.gl.NEAREST;

        const textureData = this._uploadToGPU(img, filterMode);

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
        const filter = config.filterMode === 'linear' ? this.gl.LINEAR : this.gl.NEAREST;
        return this._uploadToGPU(img, filter);
    }

    _uploadToGPU(image, filterMode) {
        const gl = this.gl;
        const tex = gl.createTexture();
        const filter = filterMode || gl.NEAREST;

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

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