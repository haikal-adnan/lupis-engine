export class UIContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade(contextParams) {
    const game = this.game;

    return {
      isUiLayer: (layerId) => {
        const uiLayerIds = new Set((game.world?.layersUI || []).map(l => l.id));
        return uiLayerIds.has(layerId);
      },
      dispatchEvent: (event) => {
        const canvas = game.renderer?.gl?.canvas || game.renderer?.canvas || game.canvas;
        if (canvas && typeof canvas.dispatchEvent === 'function') {
          canvas.dispatchEvent(event);
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(event);
        }
      },
      notify: (message, source = 'Notification', type = 'log') => {
        this.contextSystem.consoleHandler.notify(contextParams, message, source, type);
      }
    };
  }
}
