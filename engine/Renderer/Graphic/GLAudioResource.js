import OPFSHelper from "../../Util/opfsHelper.js";

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

    if (asset.fileKey && ext) {
      const fileName = `${asset.fileKey}${ext}`;

      if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId) {
        audioBuffer = await this._getOpfsAudioBuffer(opfsConfig.projectId, fileName);
        resolvedSrc = `opfs://projects/${opfsConfig.projectId}/${fileName}`;
      } 
      else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
        const cleanBaseURL = opfsConfig.replace(/\/$/, "");
        resolvedSrc = (asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/')))
          ? asset.fileUrl
          : `${cleanBaseURL}/assets/${fileName}`;
        audioBuffer = await this._loadAudio(resolvedSrc);
      } 
      else {
        resolvedSrc = asset.fileUrl || fileName;
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

  async _loadAudio(url) {
    try {
      if (url.startsWith('opfs://')) {
        const parsed = OPFSHelper.parseOpfsUrl(url);
        if (parsed) {
          return await this._getOpfsAudioBuffer(parsed.projectId, parsed.fileName);
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
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