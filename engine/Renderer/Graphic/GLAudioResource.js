// File: src/Renderer/Audio/GLAudioResource.js

let __audioID = 1;

export default class GLAudioResource {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }

    async loadAudioFromAsset(asset, baseURL) {
        let src;
        // Menyesuaikan pembentukan URL persis seperti GLImageResource
        if (asset.fileKey && asset.meta.extension) {
            src = `${baseURL}${asset.fileKey}${asset.meta.extension}`;
        } else if (asset.fileUrl) {
            src = asset.fileUrl; // Fallback jika path langsung tersedia
        }

        const audioBuffer = await this._loadAudio(src);

        // Kembalikan dalam bentuk objek agar konsisten dengan textureData
        const audioData = {
            id: __audioID++,
            type: "audio_buffer",
            buffer: audioBuffer,
            src: src,
            duration: audioBuffer ? audioBuffer.duration : 0
        };

        return audioData;
    }

    async _loadAudio(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            
            // Proses decode raw data menjadi AudioBuffer (analoginya seperti _uploadToGPU)
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load or decode audio: ${url}`, error);
            return null;
        }
    }

    // Fungsi load mandiri (opsional, konsisten dengan GLImageResource)
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