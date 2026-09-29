let __textureID = 1;

export default class GLImageResource {
    constructor(gl) {
        this.gl = gl;
    }

    async _getOpfsBlobUrl(projectId, fileName) {
        try {
            const root = await navigator.storage.getDirectory();
            const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
            const projectsDir = await appDir.getDirectoryHandle('projects');
            const projectDir = await projectsDir.getDirectoryHandle(String(projectId));
            const assetsDir = await projectDir.getDirectoryHandle('assets');

            const fileHandle = await assetsDir.getFileHandle(fileName);
            const file = await fileHandle.getFile();

            return URL.createObjectURL(file);
        } catch (err) {
            console.error(`[GLImageResource] Gagal mengambil file ${fileName} dari OPFS:`, err);
            throw err;
        }
    }

    async loadTextureFromAsset(asset, opfsConfig) {
        let objectUrl = null;
        let srcForImage = '';

        if (asset.fileKey && asset.meta?.extension) {
            const fileName = `${asset.fileKey}${asset.meta.extension}`;
            
            if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId) {
                objectUrl = await this._getOpfsBlobUrl(opfsConfig.projectId, fileName);
                srcForImage = objectUrl;
            } 
            else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
                const cleanBaseURL = opfsConfig.replace(/\/$/, "");
                
                if (asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/'))) {
                    srcForImage = asset.fileUrl;
                } else {
                    srcForImage = `${cleanBaseURL}/assets/${fileName}`;
                }
            } 
            else {
                srcForImage = asset.fileUrl || fileName;
            }
        } else {
            srcForImage = asset.fileUrl || '';
        }

        try {
            const img = await this._loadImage(srcForImage);
            const textureData = this._uploadToGPU(img); 
            textureData.src = srcForImage;
            textureData.image = img;
            return textureData;
        } finally {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        }
    }
    
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            if (!url.startsWith('blob:')) {
                img.crossOrigin = "anonymous";
            }
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    async load(url, config = {}) {
        let targetUrl = url;
        let isBlob = false;

        if (url.startsWith('opfs://')) {
            const cleanPath = url.replace('opfs://', '');
            const parts = cleanPath.split('/'); 
            const projectId = parts[1] === 'projects' ? parts[2] : parts[0];
            const fileName = parts[parts.length - 1];

            targetUrl = await this._getOpfsBlobUrl(projectId, fileName);
            isBlob = true;
        }

        try {
            const img = await this._loadImage(targetUrl);
            const filter = this.gl.LINEAR;
            return this._uploadToGPU(img, filter);
        } finally {
            if (isBlob) {
                URL.revokeObjectURL(targetUrl);
            }
        }
    }

    _uploadToGPU(image) {
        const gl = this.gl;
        const tex = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

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