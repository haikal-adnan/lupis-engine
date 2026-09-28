export default class ContextSystem {
    constructor(game) {
        this.game = game;
    }

    createExecutionContext(runner, node) {
        return {
            owner: runner.owner,
            game: this.game,
            camera: this.game.camera,
            dt: this.game.deltaTime,
            node: node,

            onTick: (callback) => {
                if (!runner._customTickListeners) {
                    runner._customTickListeners = new Map();
                }
                runner._customTickListeners.set(node.id, callback);
            },

            triggerFlow: (portName) => {
                runner.executeFlow(node.id, portName);
            },

            onGameStart: (callback) => {
                this.game.events.once('game:start', () => {
                    if (runner._isScriptActive()) callback();
                });
            },

            onSceneStart: (callback) => {
                const handler = (sceneName) => {
                    if (runner._isScriptActive()) {
                        console.log(sceneName)
                        
                        callback(sceneName);
                    }
                };

                this.game.events.once('scene:start', handler);
                runner._registeredEvents.push({ eventName: 'scene:start', callback: handler });
            },

            entity: {
                destroy: (entity) => this.game.entitySystem.destroyEntity(entity),
                clone: (entity) => this.game.entitySystem.cloneEntity(entity),
                get: (targetId) => this.game.entitySystem.getEntity(targetId, runner.owner)
            },

            scene: {
                load: (sceneName) => this.game.sceneSystem.queueLoadScene(sceneName),
                restart: () => this.game.sceneSystem.restartScene(),
                getCurrentName: () => this.game.sceneSystem.getCurrentSceneName(),
                getCurrentId: () => this.game.sceneSystem.getCurrentSceneId(),
                getCurrentData: () => this.game.sceneSystem.getCurrentScene(),
                getAllScenes: () => this.game.sceneSystem.getAvailableScenes()
            },

            prefab: {
                spawn: (...args) => this.game.prefabSystem.spawnPrefab(...args)
            },

            layer: {
                get: (layerId) => this.game.layerSystem.getLayer(layerId)
            },

            getLocal: (key) => runner.getLocalVariable(key),
            setLocal: (key, val) => runner.setLocalVariable(key, val),
            getGlobal: (key) => this.game?.variables?.getGlobal(key),
            setGlobal: (key, val) => this.game?.variables?.setGlobal(key, val),

            getTempData: (key) => node._tempData?.[key] ?? null
        };
    }
}