let __textureID = 1;

export default class GLImageResource {
    constructor(gl) {
        this.gl = gl;
    }

    async load(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.crossOrigin = "anonymous"; 
            
            img.onload = async () => {
                try {
                    img.decoding = "async";
                    await img.decode();
                    const result = this._uploadToGPU(img);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            
            img.onerror = (err) => {
                reject(new Error(`Failed to load image at ${url}`));
            };

            img.src = url;
        });
    }

    async loadBitmap(bitmap) {
        return this._uploadToGPU(bitmap);
    }

    _uploadToGPU(image) {
        const gl = this.gl;
        const tex = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return {
            id: __textureID++,
            glTexture: tex,
            width: image.width,
            height: image.height
        };
    }
}