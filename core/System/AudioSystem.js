export default class AudioSystem {
    constructor(game) {
        this.game = game;
        
        const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
        if (AudioContextClass) {
            this.context = new AudioContextClass();
        } else {
            this.context = this._createFallbackContext();
        }
        
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        this.backgroundGain = this.context.createGain();
        this.backgroundGain.connect(this.masterGain);

        this.sfxGain = this.context.createGain();
        this.sfxGain.connect(this.masterGain);

        this.voiceGain = this.context.createGain();
        this.voiceGain.connect(this.masterGain);

        this.buses = {
            master: { gain: this.masterGain, volume: 100, isMute: false },
            background: { gain: this.backgroundGain, volume: 100, isMute: false },
            sfx: { gain: this.sfxGain, volume: 100, isMute: false },
            voice: { gain: this.voiceGain, volume: 100, isMute: false }
        };

        this.activeNodes = new Map();
        this.pendingAutoplayAudio = [];
        this.isUnlocked = this.context.state === 'running';

        this._canvas = null;
        this._unlockHandler = null;
    }

    _createFallbackContext() {
        const createDummyGain = () => {
            const gainObj = {
                value: 1.0,
                setValueAtTime(val) { this.value = val; },
                linearRampToValueAtTime(val) { this.value = val; }
            };
            return {
                gain: gainObj,
                connect() {}
            };
        };

        return {
            state: 'running',
            currentTime: 0,
            destination: {},
            createGain: createDummyGain,
            createBufferSource: () => ({
                buffer: null,
                playbackRate: { value: 1.0 },
                loop: false,
                connect() {},
                start() {},
                stop() {}
            }),
            createPanner: () => ({
                panningModel: 'HRTF',
                distanceModel: 'inverse',
                refDistance: 100,
                maxDistance: 1000,
                rolloffFactor: 1,
                positionX: { value: 0 },
                positionY: { value: 0 },
                positionZ: { value: 0 },
                connect() {}
            }),
            listener: {
                positionX: { value: 0 },
                positionY: { value: 0 },
                positionZ: { value: 0 }
            },
            resume: async () => {}
        };
    }

    getBusGainNode(type) {
        if (type === 'background') return this.backgroundGain;
        if (type === 'voice') return this.voiceGain;
        if (type === 'master') return this.masterGain;
        return this.sfxGain;
    }

    setVolume(type, volume) {
        const bus = this.buses[type];
        if (!bus) {
            console.warn(`[AudioSystem] Unknown audio bus '${type}'`);
            return;
        }
        const safeVol = Math.max(0, Math.min(100, Number(volume)));
        bus.volume = safeVol;
        if (!bus.isMute) {
            bus.gain.gain.value = safeVol / 100;
        }
    }

    getVolume(type) {
        const bus = this.buses[type];
        return bus ? bus.volume : 100;
    }

    setMute(type, isMute) {
        const bus = this.buses[type];
        if (!bus) return;
        bus.isMute = Boolean(isMute);
        bus.gain.gain.value = bus.isMute ? 0 : (bus.volume / 100);
    }

    isMuted(type) {
        const bus = this.buses[type];
        return bus ? bus.isMute : false;
    }

    setMasterVolume(val) { this.setVolume('master', val); }
    getMasterVolume() { return this.getVolume('master'); }

    setBackgroundVolume(val) { this.setVolume('background', val); }
    getBackgroundVolume() { return this.getVolume('background'); }

    setSfxVolume(val) { this.setVolume('sfx', val); }
    getSfxVolume() { return this.getVolume('sfx'); }

    setVoiceVolume(val) { this.setVolume('voice', val); }
    getVoiceVolume() { return this.getVolume('voice'); }

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

    // Plays audio based on entity Audio component data or explicit override configuration
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
        const rawVol = audioData.volume ?? 100;
        const safeVol = Math.max(0, Math.min(100, Number(rawVol)));
        const targetVolume = audioData.isMute ? 0 : (safeVol / 100);
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

        const rawType = audioData.audioType || audioData.type || 'sfx';
        const channelType = (rawType === 'background' || rawType === 'voice') ? rawType : 'sfx';
        const targetBus = this.buses[channelType] || this.buses.sfx;

        finalNode.connect(targetBus.gain);
        source.start();

        const nodeId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('audio_' + Math.random().toString(36).slice(2));
        this.activeNodes.set(nodeId, { entity, source, gainNode, pannerNode, targetVolume, audioData, channel: channelType });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    // Plays a sound asset directly without an entity binding
    playSound(assetIdOrBuffer, options = {}) {
        if (!assetIdOrBuffer) return null;
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }

        let audioBuffer = null;
        if (typeof assetIdOrBuffer === 'string') {
            audioBuffer = this.game.world?.audios?.[assetIdOrBuffer];
        } else if (typeof assetIdOrBuffer === 'object') {
            audioBuffer = assetIdOrBuffer;
        }
        if (!audioBuffer) return null;

        const source = this.context.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = options.pitch ?? 1.0;
        source.loop = options.loop ?? false;

        const gainNode = this.context.createGain();
        const rawVol = options.volume ?? 100;
        const safeVol = Math.max(0, Math.min(100, Number(rawVol)));
        const targetVolume = options.isMute ? 0 : (safeVol / 100);
        gainNode.gain.value = targetVolume;
        source.connect(gainNode);

        const rawType = options.audioType || options.type || 'sfx';
        const channelType = (rawType === 'background' || rawType === 'voice') ? rawType : 'sfx';
        const targetBus = this.buses[channelType] || this.buses.sfx;

        gainNode.connect(targetBus.gain);
        source.start();

        const nodeId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('audio_' + Math.random().toString(36).slice(2));
        this.activeNodes.set(nodeId, { entity: null, source, gainNode, targetVolume, audioData: options, channel: channelType });

        source.onended = () => this.activeNodes.delete(nodeId);
        return nodeId;
    }

    // Stops all active audio nodes across all channels
    stopAll() {
        for (const [nodeId, nodeData] of this.activeNodes.entries()) {
            try { nodeData.source.stop(); } catch(e) {}
            this.activeNodes.delete(nodeId);
        }
    }

    // Stops active audio playback for a specific entity
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
