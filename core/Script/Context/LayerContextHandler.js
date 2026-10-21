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
      freezeInput: (layerId, active = true, type = 'all') => {
        return layerSystem ? layerSystem.freezeInput(layerId, active, type, runner.owner) : false;
      },
      isInputFrozen: (layerId, type = 'all') => {
        return layerSystem ? layerSystem.isInputFrozen(layerId, type, runner.owner) : false;
      },
      destroy: (layerId, destroyEntities = true) => {
        return layerSystem ? layerSystem.destroyLayer(layerId, destroyEntities, runner.owner) : false;
      }
    };
  }
}
