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

      console: {
        log: (msg, source = 'Script') => {
          this.game.events.emit('console:log', {
            type: 'log',
            time: Date.now(),
            message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg),
            source: source
          });
        },
        warn: (msg, source = 'Script') => {
          this.game.events.emit('console:warn', {
            type: 'warn',
            time: Date.now(),
            message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg),
            source: source
          });
        },
        error: (msg, source = 'Script') => {
          this.game.events.emit('console:error', {
            type: 'error',
            time: Date.now(),
            message: typeof msg === 'object' ? JSON.stringify(msg) : String(msg),
            source: source
          });
        }
      },

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
        const handler = () => {
          if (runner._isScriptActive()) callback();
        };

        if (this.game.hasStarted) {
          handler();
        } else {
          this.game.events.once('game:start', handler);
          runner._registeredEvents.push({ eventName: 'game:start', callback: handler });
        }
      },

      onSceneStart: (callback) => {
        const handler = (sceneName) => {
          if (runner._isScriptActive()) {
            callback(sceneName);
          }
        };

        this.game.events.once('scene:start', handler);
        runner._registeredEvents.push({ eventName: 'scene:start', callback: handler });
      },

      onGamePause: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:pause', handler);
        runner._registeredEvents.push({ eventName: 'game:pause', callback: handler });
      },

      onGameResume: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:resume', handler);
        runner._registeredEvents.push({ eventName: 'game:resume', callback: handler });
      },

      onGameRestart: (callback) => {
        const handler = () => {
          if (runner._isScriptActive()) {
            callback();
          }
        };

        this.game.events.on('game:restart', handler);
        runner._registeredEvents.push({ eventName: 'game:restart', callback: handler });
      },

      isPaused: () => this.game.isPaused,

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
        get: (layerId) => {
          if (this.game?.layerSystem && typeof this.game.layerSystem.getLayer === 'function') {
            return this.game.layerSystem.getLayer(layerId);
          }
          const allLayers = this.game?.world?.allLayers || [];
          if (!layerId || layerId === 'self') {
            const ownerLayerId = runner.owner?.layerId;
            return allLayers.find(l => l.id === ownerLayerId || l.scriptId === ownerLayerId) || allLayers[0] || null;
          }
          const search = String(layerId).trim().toLowerCase();
          return allLayers.find(l => 
            l.id === layerId || 
            l.scriptId === layerId || 
            (l.name && l.name.toLowerCase() === search)
          ) || null;
        }
      },

      getLocal: (key) => runner.getLocalVariable(key),
      setLocal: (key, val) => runner.setLocalVariable(key, val),
      getGlobal: (key) => this.game?.variables?.getGlobal(key),
      setGlobal: (key, val) => this.game?.variables?.setGlobal(key, val),

      getTempData: (key) => node._tempData?.[key] ?? null
    };
  }
}