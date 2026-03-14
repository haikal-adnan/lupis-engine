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
        this.overlay = null; 
    }

    _showAutoplayOverlay() {
        if (Config.ENGINE_MODE !== "editor") {
            this.isPermissionGranted = true; 
            return;
        }

        if (this.context.state === 'running' || this.isPermissionGranted) return;
        if (this.overlay) return; 

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
        const fadeInDuration = clipData.fadeIn || 0;

        if (this.context.state === 'suspended') {
            gainNode.gain.value = 0;
        } else {
            if (fadeInDuration > 0) {
                gainNode.gain.setValueAtTime(0, this.context.currentTime);
                gainNode.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + fadeInDuration);
            } else {
                gainNode.gain.value = targetVolume;
            }
        }

        source.connect(gainNode);

        let finalNode = gainNode;
        let pannerNode = null;

        if (clipData.spatial && !clipData.persist) {
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
        this.activeNodes.set(nodeId, { entity, source, gainNode, pannerNode, targetVolume, clipData });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    handleSceneTransition(newEntities) {
        const upcomingPersistentAssets = new Set();
        
        newEntities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && Array.isArray(audioComp.clips)) {
                audioComp.clips.forEach(clip => {
                    if (clip.persist && clip.autoplay) {
                        upcomingPersistentAssets.add(clip.assetId);
                    }
                });
            }
        });

        const now = this.context.currentTime;

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { source, gainNode, clipData } = nodeData;

            if (clipData.persist) {
                if (upcomingPersistentAssets.has(clipData.assetId)) {
                    nodeData.keptAlive = true; 
                }
            } else {
                const fadeOutDuration = clipData.fadeOut || 0;
                
                if (fadeOutDuration > 0) {
                    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                    gainNode.gain.linearRampToValueAtTime(0, now + fadeOutDuration);
                    
                    setTimeout(() => {
                        try { source.stop(); } catch(e) {}
                    }, fadeOutDuration * 1000);
                } else {
                    try { source.stop(); } catch(e) {}
                }
                
                this.activeNodes.delete(nodeId);
            }
        }
    }

    startSceneAutoplay(world) {
        let requiresInteraction = false;

        world.entities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && Array.isArray(audioComp.clips)) {
                audioComp.clips.forEach(clip => {
                    if (clip.autoplay) {
                        
                        let isAlreadyPlaying = false;
                        for (const nodeData of this.activeNodes.values()) {
                            if (nodeData.clipData.assetId === clip.assetId && nodeData.keptAlive) {
                                isAlreadyPlaying = true;
                                nodeData.keptAlive = false; 
                                nodeData.entity = entity;   
                                break;
                            }
                        }

                        if (!isAlreadyPlaying) {
                            this.play(entity, clip);
                            if (this.context.state === 'suspended') {
                                requiresInteraction = true;
                            }
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

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { entity, pannerNode, clipData } = nodeData;

            // Handler: Jika audio persist atau kehilangan referensi entitas, abaikan update spasial
            if (clipData.persist || !entity || !entity.components?.Transform) {
                continue; 
            }

            if (pannerNode) {
                const transform = entity.components.Transform;
                pannerNode.positionX.value = transform.x;
                pannerNode.positionY.value = transform.y;
            }
        }
    }
}