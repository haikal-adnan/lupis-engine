    let __audioID = 1;

    export default class GLAudioResource {
        constructor(audioContext) {
            this.audioContext = audioContext;
        }

        async loadAudioFromAsset(asset, baseURL) {
            let src;
            if (asset.fileKey && asset.meta.extension) {
                src = `${baseURL}${asset.fileKey}${asset.meta.extension}`;
            } else if (asset.fileUrl) {
                src = asset.fileUrl; 
            }

            const audioBuffer = await this._loadAudio(src);

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
                
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                return audioBuffer;
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