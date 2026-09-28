let __audioID = 1;

export default class GLAudioResource {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    async _getOpfsAudioBuffer(userId, projectId, fileName) {
        try {
            const root = await navigator.storage.getDirectory();
            const userDir = await root.getDirectoryHandle(String(userId));
            const projectsDir = await userDir.getDirectoryHandle('projects');
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

            if (typeof opfsConfig === 'object' && opfsConfig !== null && opfsConfig.userId && opfsConfig.projectId) {
                audioBuffer = await this._getOpfsAudioBuffer(opfsConfig.userId, opfsConfig.projectId, fileName);
                resolvedSrc = `opfs://${opfsConfig.userId}/projects/${opfsConfig.projectId}/${fileName}`;
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
                const userId = parts[0];
                const projectId = parts[2];
                const fileName = parts[3] || parts[parts.length - 1];

                return await this._getOpfsAudioBuffer(userId, projectId, fileName);
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