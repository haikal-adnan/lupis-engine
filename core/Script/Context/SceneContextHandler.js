export class SceneContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade() {
    const sceneSystem = this.game?.sceneSystem;

    return {
      load: (sceneName) => sceneSystem?.queueLoadScene(sceneName),
      restart: () => sceneSystem?.restartScene(),
      getCurrentName: () => sceneSystem?.getCurrentSceneName(),
      getCurrentId: () => sceneSystem?.getCurrentSceneId(),
      getCurrentData: () => sceneSystem?.getCurrentScene(),
      getAllScenes: () => sceneSystem?.getAvailableScenes(),
      injectLayer: (sceneName, layerName, inheritState = true, targetLayer = '') => {
        const inherit = inheritState !== false && inheritState !== 'false';
        return sceneSystem ? sceneSystem.injectLayer(sceneName, layerName, inherit, targetLayer) : { success: false, isFirstLoad: false };
      }
    };
  }
}
