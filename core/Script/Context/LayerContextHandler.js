// Subsystem handler providing display layer management, input freezing, and runtime layer reset
export class LayerContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner }) {
    const layerSystem = this.game?.layerSystem;

    return {
      get: (layerId) => {
        return layerSystem ? layerSystem.getLayer(layerId, runner.owner) : null;
      },

      // Freezes or unfreezes user input on a specific layer
      freezeInput: (layerId, active = true, type = 'all') => {
        return layerSystem ? layerSystem.freezeInput(layerId, active, type, runner.owner) : false;
      },

      isInputFrozen: (layerId, type = 'all') => {
        return layerSystem ? layerSystem.isInputFrozen(layerId, type, runner.owner) : false;
      },

      destroy: (layerId, destroyEntities = true) => {
        return layerSystem ? layerSystem.destroyLayer(layerId, destroyEntities, runner.owner) : false;
      },

      // Resets a layer back to its original scene template definition
      reset: (sceneName = 'self', layerName = null) => {
        return this.game?.sceneSystem ? Boolean(this.game.sceneSystem.resetLayer(sceneName, layerName || runner?.owner?.layerId)) : false;
      }
    };
  }
}
