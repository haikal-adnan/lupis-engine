import OPFSHelper from "../../Util/opfsHelper.js";
import LupisPackageHelper from "../../Util/LupisPackageHelper.js";

let __textureID = 1;

export default class GLImageResource {
  constructor(gl) {
    this.gl = gl;
  }

  async _getOpfsBlobUrl(projectId, fileName) {
    return await OPFSHelper.createBlobUrl(projectId, fileName);
  }

  async loadTextureFromAsset(asset, opfsConfig) {
    let objectUrl = null;
    let srcForImage = '';

    const ext = asset.meta?.extension || '';
    const isOpfsMode = typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId;

    if (asset.fileKey && (ext || asset.meta?.lupisDataFile)) {
      const rawFileName = `${asset.fileKey}${ext}`;
      const protectedFileName = asset.meta?.lupisDataFile || `${asset.fileKey}.lupisdata`;

      if (isOpfsMode) {
        objectUrl = await this._getOpfsBlobUrl(opfsConfig.projectId, rawFileName);
        srcForImage = objectUrl;
      } else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
        const cleanBaseURL = opfsConfig.replace(/\/$/, "");
        const targetFile = (asset.meta?.protected || asset.meta?.lupisDataFile) ? protectedFileName : rawFileName;

        if (asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/')) && !asset.meta?.protected) {
          srcForImage = asset.fileUrl;
        } else {
          srcForImage = `${cleanBaseURL}/assets/${targetFile}`;
        }
      } else {
        srcForImage = asset.fileUrl || rawFileName;
      }
    } else {
      srcForImage = asset.fileUrl || '';
    }

    try {
      if (!isOpfsMode && srcForImage && !srcForImage.startsWith('blob:') && !srcForImage.startsWith('data:')) {
        if (srcForImage.endsWith('.lupisdata') || asset.meta?.protected || LupisPackageHelper.hasVirtualArchive()) {
          objectUrl = await LupisPackageHelper.createDecodedBlobUrl(srcForImage);
          srcForImage = objectUrl;
        } else if (asset.fileKey && typeof opfsConfig === 'string' && opfsConfig.length > 0) {
          try {
            objectUrl = await LupisPackageHelper.createDecodedBlobUrl(srcForImage);
            srcForImage = objectUrl;
          } catch {
            const cleanBaseURL = opfsConfig.replace(/\/$/, "");
            const fallbackProtectedUrl = `${cleanBaseURL}/assets/${asset.fileKey}.lupisdata`;
            objectUrl = await LupisPackageHelper.createDecodedBlobUrl(fallbackProtectedUrl);
            srcForImage = objectUrl;
          }
        }
      }

      const img = await this._loadImage(srcForImage);
      const textureData = this._uploadToGPU(img);
      textureData.src = srcForImage;
      textureData.image = img;
      
      if (asset.meta?.dimensions) {
        if (!asset.meta.dimensions.w) asset.meta.dimensions.w = img.width;
        if (!asset.meta.dimensions.h) asset.meta.dimensions.h = img.height;
      }

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
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  async load(url, config = {}) {
    let targetUrl = url;
    let isBlob = false;

    if (url.startsWith('opfs://')) {
      const parsed = OPFSHelper.parseOpfsUrl(url);
      if (parsed) {
        targetUrl = await OPFSHelper.createBlobUrl(parsed.projectId, parsed.fileName);
        isBlob = true;
      }
    } else if (url.endsWith('.lupisdata') || LupisPackageHelper.hasVirtualArchive()) {
      targetUrl = await LupisPackageHelper.createDecodedBlobUrl(url);
      isBlob = true;
    }

    try {
      const img = await this._loadImage(targetUrl);
      return this._uploadToGPU(img);
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
      id: __textureID++,
      type: "gl",
      glTexture: tex,
      width: image.width,
      height: image.height
    };
  }
}
