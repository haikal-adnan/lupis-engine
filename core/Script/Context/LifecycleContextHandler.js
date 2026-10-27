// Subsystem handler providing game lifecycle hooks, global signal event bus, and flow control
export class LifecycleContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createLifecycleFacade() {
    const game = this.game;

    return {
      pause: () => game?.pauseGame(),
      resume: () => game?.resumeGame(),
      restart: () => game?.restartGame(),
      quit: () => game?.quitGame(),
      isPaused: () => Boolean(game?.isPaused),
      changeScreen: (mode) => game?.changeScreen(mode),
      setScreenMode: (mode) => game?.changeScreen(mode)
    };
  }

  // Cross-entity signal bus facade with auto-unsubscription on script destroy
  createSignalFacade({ runner }) {
    const game = this.game;

    return {
      emit: (signalName, data) => {
        game?.events?.emit(signalName, data);
      },

      on: (signalName, callback) => {
        game?.events?.on(signalName, callback);
        runner._registeredEvents.push({ eventName: signalName, callback });
      }
    };
  }

  onTick({ runner, node }, callback) {
    if (!runner._customTickListeners) {
      runner._customTickListeners = new Map();
    }
    runner._customTickListeners.set(node.id, callback);
  }

  // Manually activates an execution output pin on this node
  triggerFlow({ runner, node }, portName) {
    const nodeOutputs = runner.nodeOutputs.get(node.id);
    if (nodeOutputs && nodeOutputs[portName] === true) {
      nodeOutputs[portName] = false;
    }
    runner.executeFlow(node.id, portName);
  }

  onGameStart({ runner }, callback) {
    const handler = () => {
      if (runner._isScriptActive()) callback();
    };

    if (this.game?.hasStarted) {
      handler();
    } else {
      this.game?.events?.once('game:start', handler);
      runner._registeredEvents.push({ eventName: 'game:start', callback: handler });
    }
  }

  onSceneStart({ runner }, callback) {
    const handler = (sceneName) => {
      if (runner._isScriptActive()) {
        callback(sceneName);
      }
    };

    this.game?.events?.once('scene:start', handler);
    runner._registeredEvents.push({ eventName: 'scene:start', callback: handler });
  }

  onGamePause({ runner }, callback) {
    const handler = () => {
      if (runner._isScriptActive()) callback();
    };
    this.game?.events?.on('game:pause', handler);
    runner._registeredEvents.push({ eventName: 'game:pause', callback: handler });
  }

  onGameResume({ runner }, callback) {
    const handler = () => {
      if (runner._isScriptActive()) callback();
    };
    this.game?.events?.on('game:resume', handler);
    runner._registeredEvents.push({ eventName: 'game:resume', callback: handler });
  }

  onGameRestart({ runner }, callback) {
    const handler = () => {
      if (runner._isScriptActive()) callback();
    };
    this.game?.events?.on('game:restart', handler);
    runner._registeredEvents.push({ eventName: 'game:restart', callback: handler });
  }

  onGameQuit({ runner }, callback) {
    const handler = () => {
      if (runner._isScriptActive()) callback();
    };
    this.game?.events?.on('game:quit', handler);
    runner._registeredEvents.push({ eventName: 'game:quit', callback: handler });
  }

  onQuit({ runner }, callback) {
    this.onGameQuit({ runner }, callback);
  }
}
