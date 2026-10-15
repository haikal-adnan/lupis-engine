export default class AudioSystem {
    constructor(game) {
        this.game = game;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.activeNodes = new Map();
        this.pendingAutoplayAudio = [];
        this.isUnlocked = this.context.state === 'running';

        this._canvas = null;
        this._unlockHandler = null;
    }

    attachCanvas(canvas) {
        this._canvas = canvas;

        if (this.context.state === 'running') {
            this.isUnlocked = true;
        }
    }

    _attachUnlockListenersIfNeeded() {
        if (this.isUnlocked || !this._canvas || this._unlockHandler) return;

        this._unlockHandler = async () => {
            await this.unlockAudio();
        };

        this._canvas.addEventListener('pointerdown', this._unlockHandler);
        this._canvas.addEventListener('keydown', this._unlockHandler);
    }

    _detachUnlockListeners() {
        if (this._canvas && this._unlockHandler) {
            this._canvas.removeEventListener('pointerdown', this._unlockHandler);
            this._canvas.removeEventListener('keydown', this._unlockHandler);
            this._unlockHandler = null;
        }
    }

    async unlockAudio() {
        try {
            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            if (this.context.state === 'running') {
                this.isUnlocked = true;
                
                this._detachUnlockListeners();

                this._flushPendingAutoplay();
            }
        } catch (err) {
            console.error("[AudioSystem] Failed to resume AudioContext:", err);
        }
    }

    _flushPendingAutoplay() {
        while (this.pendingAutoplayAudio.length > 0) {
            const { entity, audioData } = this.pendingAutoplayAudio.shift();
            this.play(entity, audioData);
        }
    }

    /**
     * Plays audio based on entity and Audio component data (or optional override data)
     * @param {Object} entity 
     * @param {Object} [overrideAudioData] 
     */
    play(entity, overrideAudioData = null) {
        if (this.context.state === 'suspended') {
            this.context.resume().then(() => {
                if (this.context.state === 'running') {
                    this.isUnlocked = true;
                }
            }).catch(() => {});
        }

        const audioData = overrideAudioData || entity.components?.Audio;
        if (!audioData || !audioData.assetId) return null;

        if (this.context.state === 'suspended' && !this.isUnlocked) {
            const isAlreadyPending = this.pendingAutoplayAudio.some(
                item => item.entity.id === entity.id && item.audioData.assetId === audioData.assetId
            );
            if (!isAlreadyPending) {
                this.pendingAutoplayAudio.push({ entity, audioData });
            }

            this._attachUnlockListenersIfNeeded();
            return null;
        }

        const audioBuffer = this.game.world.audios?.[audioData.assetId];
        if (!audioBuffer) return null;

        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = audioData.pitch ?? 1.0;
        source.loop = audioData.loop ?? false;

        const gainNode = this.context.createGain();
        const targetVolume = audioData.isMute ? 0 : (audioData.volume ?? 1.0);
        const fadeInDuration = audioData.fadeIn || 0;

        if (fadeInDuration > 0) {
            gainNode.gain.setValueAtTime(0, this.context.currentTime);
            gainNode.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + fadeInDuration);
        } else {
            gainNode.gain.value = targetVolume;
        }

        source.connect(gainNode);

        let finalNode = gainNode;
        let pannerNode = null;

        if (audioData.spatial && !audioData.persist) {
            pannerNode = this.context.createPanner();
            pannerNode.panningModel = 'HRTF';
            pannerNode.distanceModel = 'inverse';
            pannerNode.refDistance = audioData.refDistance ?? 100;
            pannerNode.maxDistance = audioData.maxDistance ?? 1000;
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
        this.activeNodes.set(nodeId, { entity, source, gainNode, pannerNode, targetVolume, audioData });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    /**
     * Stops currently playing audio for a specific entity
     * @param {Object|string} entityOrId 
     */
    stop(entityOrId) {
        const targetId = typeof entityOrId === 'string' ? entityOrId : entityOrId?.id;
        if (!targetId) return;

        const now = this.context.currentTime;

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            if (nodeData.entity?.id === targetId) {
                const { source, gainNode, audioData } = nodeData;
                const fadeOutDuration = audioData.fadeOut || 0;

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

    handleSceneTransition(newEntities) {
        const upcomingPersistentAssets = new Set();
        
        newEntities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && audioComp.persist && audioComp.autoplay && audioComp.assetId) {
                upcomingPersistentAssets.add(audioComp.assetId);
            }
        });

        const now = this.context.currentTime;

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { source, gainNode, audioData } = nodeData;

            if (audioData.persist) {
                if (upcomingPersistentAssets.has(audioData.assetId)) {
                    nodeData.keptAlive = true; 
                }
            } else {
                const fadeOutDuration = audioData.fadeOut || 0;
                
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
        world.entities.forEach(entity => {
            const audioComp = entity.components?.Audio;
            if (audioComp && audioComp.autoplay && audioComp.assetId) {
                let isAlreadyPlaying = false;

                for (const nodeData of this.activeNodes.values()) {
                    if (nodeData.audioData.assetId === audioComp.assetId && nodeData.keptAlive) {
                        isAlreadyPlaying = true;
                        nodeData.keptAlive = false; 
                        nodeData.entity = entity;   
                        break;
                    }
                }

                if (!isAlreadyPlaying) {
                    this.play(entity, audioComp);
                }
            }
        });
    }

    update() {
        if (!this.game.camera || this.context.state === 'suspended') return;

        const listener = this.context.listener;
        listener.positionX.value = this.game.camera.x;
        listener.positionY.value = this.game.camera.y;
        listener.positionZ.value = 300; 

        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            const { entity, pannerNode, audioData } = nodeData;

            if (audioData.persist || !entity || !entity.components?.Transform) {
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