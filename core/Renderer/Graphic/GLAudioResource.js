import OPFSHelper from "../../Util/opfsHelper.js";
import LupisPackageHelper from "../../Util/LupisPackageHelper.js";

let __audioID = 1;

export default class GLAudioResource {
  constructor(audioContext) {
    this.audioContext = audioContext;
  }

  async _getOpfsAudioBuffer(projectId, fileName) {
    try {
      const arrayBuffer = await OPFSHelper.readAsArrayBuffer(projectId, fileName);
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error(`[GLAudioResource] Error decoding OPFS audio (${fileName}):`, err);
      return null;
    }
  }

  async loadAudioFromAsset(asset, opfsConfig) {
    let audioBuffer = null;
    let resolvedSrc = '';

    const ext = asset.meta?.extension || '';

    if (asset.fileKey && (ext || asset.meta?.lupisDataFile)) {
      const rawFileName = `${asset.fileKey}${ext}`;
      const protectedFileName = asset.meta?.lupisDataFile || `${asset.fileKey}.lupisdata`;

      if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId) {
        audioBuffer = await this._getOpfsAudioBuffer(opfsConfig.projectId, rawFileName);
        resolvedSrc = `opfs://projects/${opfsConfig.projectId}/${rawFileName}`;
      } 
      else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
        const cleanBaseURL = LupisPackageHelper.resolveAssetBaseUrl(opfsConfig);
        const targetFile = (asset.meta?.protected || asset.meta?.lupisDataFile) ? protectedFileName : rawFileName;

        resolvedSrc = (asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/')) && !asset.meta?.protected)
          ? asset.fileUrl
          : `${cleanBaseURL}/assets/${targetFile}`;

        audioBuffer = await this._loadAudio(resolvedSrc, `${cleanBaseURL}/assets/${protectedFileName}`);
      } 
      else {
        resolvedSrc = asset.fileUrl || rawFileName;
        audioBuffer = await this._loadAudio(resolvedSrc);
      }
    } else if (asset.fileUrl) {
      resolvedSrc = asset.fileUrl;
      audioBuffer = await this._loadAudio(resolvedSrc);
    }

    return {
      id: __audioID++,
      assetId: asset.id,
      type: "audio_buffer",
      buffer: audioBuffer,
      src: resolvedSrc,
      duration: audioBuffer ? audioBuffer.duration : (asset.meta?.duration || 0)
    };
  }

  async _loadAudio(url, fallbackProtectedUrl = null) {
    try {
      if (url.startsWith('opfs://')) {
        const parsed = OPFSHelper.parseOpfsUrl(url);
        if (parsed) {
          return await this._getOpfsAudioBuffer(parsed.projectId, parsed.fileName);
        }
      }

      let decodedBuffer;
      try {
        decodedBuffer = await LupisPackageHelper.fetchBuffer(url);
      } catch (fetchErr) {
        if (fallbackProtectedUrl && fallbackProtectedUrl !== url) {
          decodedBuffer = await LupisPackageHelper.fetchBuffer(fallbackProtectedUrl);
        } else {
          throw fetchErr;
        }
      }

      return await this.audioContext.decodeAudioData(decodedBuffer);
    } catch (error) {
      console.error(`[GLAudioResource] Failed to load/decode audio: ${url}`, error);
      return null;
    }
  }

  async load(url, config = {}) {
    const audioBuffer = await this._loadAudio(url);
    return {
      id: __audioID++,
      type: "audio_buffer",
      buffer: audioBuffer,
      src: url,
      duration: audioBuffer ? audioBuffer.duration : 0
    };
  }
}
