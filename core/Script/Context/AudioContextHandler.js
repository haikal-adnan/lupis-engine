// Subsystem handler providing audio playback, spatial audio dispatch, and mixer channel control
export class AudioContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner }) {
    const audioSystem = this.game?.audioSystem;
    const entitySystem = this.game?.entitySystem;

    return {
      // Plays audio attached to an entity or as a global one-shot sound
      play: (targetEntityOrAssetId, options = {}) => {
        if (!audioSystem) return null;
        if (!targetEntityOrAssetId || targetEntityOrAssetId === 'self') {
          const ent = runner.owner;
          if (ent && ent.components?.Audio) {
            return audioSystem.play(ent, options);
          }
        }
        if (typeof targetEntityOrAssetId === 'object' && targetEntityOrAssetId !== null) {
          if (targetEntityOrAssetId.components?.Audio) {
            return audioSystem.play(targetEntityOrAssetId, options);
          }
        }
        if (typeof targetEntityOrAssetId === 'string') {
          const ent = entitySystem?.getEntity(targetEntityOrAssetId, runner.owner);
          if (ent && ent.components?.Audio) {
            return audioSystem.play(ent, options);
          }
        }
        return audioSystem.playSound(targetEntityOrAssetId, options);
      },

      stop: (targetEntityOrId) => {
        if (!audioSystem) return;
        if (!targetEntityOrId || targetEntityOrId === 'self') {
          return audioSystem.stop(runner.owner?.id);
        }
        if (typeof targetEntityOrId === 'object' && targetEntityOrId !== null) {
          return audioSystem.stop(targetEntityOrId.id);
        }
        if (typeof targetEntityOrId === 'string') {
          const ent = entitySystem?.getEntity(targetEntityOrId, runner.owner);
          if (ent) {
            return audioSystem.stop(ent.id);
          }
        }
        return audioSystem.stop(targetEntityOrId);
      },

      stopAll: () => audioSystem?.stopAll(),

      setVolume: (type, volume) => audioSystem?.setVolume(type, volume),
      getVolume: (type) => audioSystem?.getVolume(type),

      setMasterVolume: (volume) => audioSystem?.setMasterVolume(volume),
      getMasterVolume: () => audioSystem?.getMasterVolume(),

      setBackgroundVolume: (volume) => audioSystem?.setBackgroundVolume(volume),
      getBackgroundVolume: () => audioSystem?.getBackgroundVolume(),

      setSfxVolume: (volume) => audioSystem?.setSfxVolume(volume),
      getSfxVolume: () => audioSystem?.getSfxVolume(),

      setVoiceVolume: (volume) => audioSystem?.setVoiceVolume(volume),
      getVoiceVolume: () => audioSystem?.getVoiceVolume(),

      setMute: (type, isMute) => audioSystem?.setMute(type, isMute),
      isMuted: (type) => audioSystem?.isMuted(type)
    };
  }
}
