let __audioID = 1;

export default class GLAudioResource {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    async _getOpfsAudioBuffer(projectId, fileName) {
        try {
            const root = await navigator.storage.getDirectory();
            const appDir = await root.getDirectoryHandle('lupis-engine', { create: true });
            const projectsDir = await appDir.getDirectoryHandle('projects');
            const projectDir = await projectsDir.getDirectoryHandle(String(projectId));
            const assetsDir = await projectDir.getDirectoryHandle('assets');

            const fileHandle = await assetsDir.getFileHandle(fileName);
            const file = await fileHandle.getFile();

            const arrayBuffer = await file.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (err) {
            console.error(`[GLAudioResource] Gagal membaca audio OPFS (${fileName}):`, err);
            return null;
        }
    }

    async loadAudioFromAsset(asset, opfsConfig) {
        let audioBuffer = null;
        let resolvedSrc = '';

        if (asset.fileKey && asset.meta?.extension) {
            const fileName = `${asset.fileKey}${asset.meta.extension}`;

            if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.projectId) {
                audioBuffer = await this._getOpfsAudioBuffer(opfsConfig.projectId, fileName);
                resolvedSrc = `opfs://projects/${opfsConfig.projectId}/${fileName}`;
            } 
            else if (typeof opfsConfig === 'string' && opfsConfig.length > 0) {
                const cleanBaseURL = opfsConfig.replace(/\/$/, "");

                if (asset.fileUrl && (asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/'))) {
                    resolvedSrc = asset.fileUrl;
                } else {
                    resolvedSrc = `${cleanBaseURL}/assets/${fileName}`;
                }
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
            type: "audio_buffer",
            buffer: audioBuffer,
            src: resolvedSrc,
            duration: audioBuffer ? audioBuffer.duration : 0
        };
    }

    async _loadAudio(url) {
        try {
            if (url.startsWith('opfs://')) {
                const cleanPath = url.replace('opfs://', '');
                const parts = cleanPath.split('/'); 
                const projectId = parts[0] === 'projects' ? parts[1] : parts[0];
                const fileName = parts[parts.length - 1];

                return await this._getOpfsAudioBuffer(projectId, fileName);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Failed to load or decode audio: ${url}`, error);
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