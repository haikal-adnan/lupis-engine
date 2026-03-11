import Config from "../Core/Config.js";

// File: src/System/AudioSystem.js
export default class AudioSystem {
    constructor(game) {
        this.game = game;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        
        // Node utama untuk mengatur volume global engine
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.activeNodes = new Map();
        this.isPermissionGranted = localStorage.getItem('engine_audio_permit') === 'true';
        this.overlay = null; // Menyimpan referensi overlay
    }

    _showAutoplayOverlay() {
        if (Config.ENGINE_MODE !== "editor") {
            this.isPermissionGranted = true; 
            return;
        }

        if (this.context.state === 'running' || this.isPermissionGranted) return;
        if (this.overlay) return; // Mencegah overlay dibuat lebih dari satu kali

        this.overlay = document.createElement('div');
        Object.assign(this.overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif', fontSize: '24px', zIndex: '9999',
            cursor: 'pointer', opacity: '1', transition: 'opacity 0.5s ease'
        });
        this.overlay.innerText = 'Click anywhere to play audio';
        document.body.appendChild(this.overlay);

        const unlockAudio = async () => {
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }
            this.isPermissionGranted = true;
            localStorage.setItem('engine_audio_permit', 'true');
            
            this.overlay.style.opacity = '0';
            setTimeout(() => this.overlay.remove(), 500);

            this._fadeInActiveNodes();
        };

        this.overlay.addEventListener('click', unlockAudio, { once: true });
    }

    _fadeInActiveNodes() {
        const now = this.context.currentTime;
        for (const { gainNode, targetVolume } of this.activeNodes.values()) {
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.0); 
        }
    }

    play(entity, clipData) {
        const audioBuffer = this.game.world.audios?.[clipData.assetId];
        if (!audioBuffer) return null;

        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = clipData.pitch ?? 1.0;
        source.loop = clipData.loop ?? false;

        const gainNode = this.context.createGain();
        
        const targetVolume = clipData.isMute ? 0 : (clipData.volume ?? 1.0);

        if (this.context.state === 'suspended') {
            gainNode.gain.value = 0;
        } else {
            gainNode.gain.value = targetVolume;
        }

        source.connect(gainNode);

        let finalNode = gainNode;
        let pannerNode = null;

        if (clipData.spatial) {
            pannerNode = this.context.createPanner();
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = clipData.refDistance ?? 100;
            pannerNode.maxDistance = clipData.maxDistance ?? 1000;
            pannerNode.rolloffFactor = 1;

            const transform = entity.components?.Transform;
            if (transform) {
                pannerNode.positionX.value = transform.x;
                pannerNode.positionY.value = transform.y;
                pannerNode.positionZ.value = 0;
            }

            gainNode.connect(pannerNode);
            finalNode = pannerNode;
        }

        finalNode.connect(this.masterGain);
        source.start();

        const nodeId = crypto.randomUUID();
        this.activeNodes.set(nodeId, { entity, source, gainNode, pannerNode, targetVolume });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    startSceneAutoplay(world) {
        let requiresInteraction = false;

        world.entities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && Array.isArray(audioComp.clips)) {
                audioComp.clips.forEach(clip => {
                    if (clip.autoplay) {
                        this.play(entity, clip);
                        if (this.context.state === 'suspended') {
                            requiresInteraction = true;
                        }
                    }
                });
            }
        });

        if (requiresInteraction) {
            this._showAutoplayOverlay();
        }
    }

    update() {
        if (!this.game.camera) return;

        const listener = this.context.listener;
        listener.positionX.value = this.game.camera.x;
        listener.positionY.value = this.game.camera.y;
        listener.positionZ.value = 300; 

        for (const { entity, pannerNode } of this.activeNodes.values()) {
            if (pannerNode && entity) {
                const transform = entity.components?.Transform;
                if (transform) {
                    pannerNode.positionX.value = transform.x;
                    pannerNode.positionY.value = transform.y;
                }
            }
        }
    }
}