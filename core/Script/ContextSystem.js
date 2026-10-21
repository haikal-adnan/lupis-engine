import { ScriptAssertionError, getScriptContextMetadata, formatNotificationMessage } from "../Util/ScriptContextUtils.js";
import { ConsoleContextHandler } from "./Context/ConsoleContextHandler.js";
import { AssertContextHandler } from "./Context/AssertContextHandler.js";
import { EntityContextHandler } from "./Context/EntityContextHandler.js";
import { LayerContextHandler } from "./Context/LayerContextHandler.js";
import { InputContextHandler } from "./Context/InputContextHandler.js";
import { AudioContextHandler } from "./Context/AudioContextHandler.js";
import { CameraContextHandler } from "./Context/CameraContextHandler.js";
import { SceneContextHandler } from "./Context/SceneContextHandler.js";
import { AssetContextHandler } from "./Context/AssetContextHandler.js";
import { UIContextHandler } from "./Context/UIContextHandler.js";
import { LifecycleContextHandler } from "./Context/LifecycleContextHandler.js";
import { ToolkitContextHandler } from "../Toolkit/ToolkitContextHandler.js";

export { ScriptAssertionError, getScriptContextMetadata, formatNotificationMessage };

/**
 * ContextSystem (Engine Gate 2 / Subsystem Facade)
 * Strict runtime gateway for script nodes.
 *
 * Rules:
 * 1. Node code NEVER accesses `context.game`.
 * 2. Missing resources (Entity, Layer, Global Variable) THROW explicit errors with context.
 * 3. All access is cleanly segmented into domain facades.
 */
export default class ContextSystem {
  constructor(game) {
    this.game = game;

    // Subsystem Facade Handlers (mirip SyncComponent)
    this.consoleHandler = new ConsoleContextHandler(this);
    this.assertHandler = new AssertContextHandler(this);
    this.entityHandler = new EntityContextHandler(this);
    this.layerHandler = new LayerContextHandler(this);
    this.inputHandler = new InputContextHandler(this);
    this.audioHandler = new AudioContextHandler(this);
    this.cameraHandler = new CameraContextHandler(this);
    this.sceneHandler = new SceneContextHandler(this);
    this.assetHandler = new AssetContextHandler(this);
    this.uiHandler = new UIContextHandler(this);
    this.lifecycleHandler = new LifecycleContextHandler(this);
    this.toolkitHandler = new ToolkitContextHandler(this);
  }

  createExecutionContext(runner, node) {
    const game = this.game;
    const nodeState = typeof runner.getNodeState === 'function' 
      ? runner.getNodeState(node.id) 
      : (node._state = node._state || {});

    const nodeMeta = getScriptContextMetadata(this.game, runner, node);
    const nodeName = nodeMeta.node;

    const failAssert = (msg) => {
      const formatted = `${nodeMeta.prefix} [Assert Error] ${msg} (node: '${nodeName}')`;
      this.game.events?.emit('console:error', {
        type: 'error',
        time: Date.now(),
        message: formatted,
        source: 'Assert',
        context: {
          scene: nodeMeta.scene,
          entityScriptId: nodeMeta.entityScriptId,
          script: nodeMeta.script,
          node: nodeName
        }
      });
      throw new ScriptAssertionError(formatted, node?.id, node?.type, nodeName);
    };

    const contextParams = { runner, node, nodeMeta, nodeName, failAssert };

    const execContext = {
      game: this.game,
      owner: runner.owner,
      node: node,
      get dt() { return game.deltaTime; },
      get deltaTime() { return game.deltaTime; },
      state: nodeState,

      console: this.consoleHandler.createFacade(contextParams),
      assert: this.assertHandler.createFacade(contextParams),
      entity: this.entityHandler.createFacade(contextParams),
      prefab: {
        spawn: (...args) => this.game.prefabSystem?.spawnPrefab(...args)
      },
      layer: this.layerHandler.createFacade(contextParams),
      collider: {
        checkSolid: (entity) => this.game.colliderSystem?.checkSolid(entity),
        checkOverlap: (entity, filterTag) => this.game.colliderSystem?.checkOverlap(entity, filterTag),
        moveAndSlide: (entity, moveX, moveY) => this.game.colliderSystem?.moveAndSlide(entity, moveX, moveY),
        getShape: (entity, scriptId) => this.game.colliderSystem?.getColliderShape(entity, scriptId),
        setShapeEnabled: (entity, scriptId, enabled) => this.game.colliderSystem?.setColliderEnabled(entity, scriptId, enabled),
        checkHitbox: (attacker, hitboxIdentifier, filterTag, targetTypes) => this.game.colliderSystem?.checkHitbox(attacker, hitboxIdentifier, filterTag, targetTypes),
        getBounds: (entity) => this.game.colliderSystem?.getBounds(entity)
      },
      input: this.inputHandler.createFacade(contextParams),
      ui: this.uiHandler.createFacade(contextParams),
      toolkit: this.toolkitHandler.createFacade(contextParams),
      notify: (message, source = 'Notification', type = 'log') => this.consoleHandler.notify(contextParams, message, source, type),
      signal: this.lifecycleHandler.createSignalFacade(contextParams),
      lifecycle: this.lifecycleHandler.createLifecycleFacade(contextParams),
      audio: this.audioHandler.createFacade(contextParams),
      transition: {
        fade: (mode, duration, color, onComplete) => {
          const ts = this.game.transitionSystem;
          if (!ts) return;
          if (mode === 'fade_out') {
            ts.fadeOut(duration, color, onComplete);
          } else if (mode === 'fade_in') {
            ts.fadeIn(duration, color, onComplete);
          } else if (mode === 'fade') {
            const half = duration / 2;
            ts.fadeOut(half, color, () => {
              ts.fadeIn(half, color, onComplete);
            });
          }
        }
      },
      camera: this.cameraHandler.createFacade(contextParams),
      asset: this.assetHandler.createFacade(contextParams),
      scene: this.sceneHandler.createFacade(contextParams),

      // Execution flow & lifecycle helpers
      onTick: (callback) => this.lifecycleHandler.onTick(contextParams, callback),
      triggerFlow: (portName) => this.lifecycleHandler.triggerFlow(contextParams, portName),
      onGameStart: (callback) => this.lifecycleHandler.onGameStart(contextParams, callback),
      onSceneStart: (callback) => this.lifecycleHandler.onSceneStart(contextParams, callback),
      onGamePause: (callback) => this.lifecycleHandler.onGamePause(contextParams, callback),
      onGameResume: (callback) => this.lifecycleHandler.onGameResume(contextParams, callback),
      onGameRestart: (callback) => this.lifecycleHandler.onGameRestart(contextParams, callback),
      onGameQuit: (callback) => this.lifecycleHandler.onGameQuit(contextParams, callback),
      onQuit: (callback) => this.lifecycleHandler.onQuit(contextParams, callback),
      isPaused: () => Boolean(this.game?.isPaused),

      // Variables
      getLocal: (key) => runner.getLocalVariable(key),
      setLocal: (key, val) => runner.setLocalVariable(key, val),
      getGlobal: (key) => {
        const val = this.game.variables?.getGlobal(key);
        if (val === undefined) {
          throw new Error(`[ContextSystem] Global variable '${key}' not found in registry (node: '${nodeName}')`);
        }
        return val;
      },
      setGlobal: (key, val) => {
        this.game.variables?.setGlobal(key, val);
      },
      getVariable: (key) => runner.getVariable(key),
      hasVariable: (key) => runner.hasVariable(key)
    };

    contextParams.context = execContext;
    return execContext;
  }
}
