(function() {
const __reg = globalThis.__LUPIS_REGISTRY__ = globalThis.__LUPIS_REGISTRY__ || { m: {}, c: {} };
// === Module: Script/ContextSystem.js ===
__reg.m["Script/ContextSystem.js"] = function(__require, __exports, __module) {
const { ScriptAssertionError, getScriptContextMetadata, formatNotificationMessage } = __require("Util/ScriptContextUtils.js");
const { ConsoleContextHandler } = __require("Script/Context/ConsoleContextHandler.js");
const { AssertContextHandler } = __require("Script/Context/AssertContextHandler.js");
const { EntityContextHandler } = __require("Script/Context/EntityContextHandler.js");
const { LayerContextHandler } = __require("Script/Context/LayerContextHandler.js");
const { InputContextHandler } = __require("Script/Context/InputContextHandler.js");
const { AudioContextHandler } = __require("Script/Context/AudioContextHandler.js");
const { CameraContextHandler } = __require("Script/Context/CameraContextHandler.js");
const { SceneContextHandler } = __require("Script/Context/SceneContextHandler.js");
const { AssetContextHandler } = __require("Script/Context/AssetContextHandler.js");
const { UIContextHandler } = __require("Script/Context/UIContextHandler.js");
const { LifecycleContextHandler } = __require("Script/Context/LifecycleContextHandler.js");
const { ToolkitContextHandler } = __require("Toolkit/ToolkitContextHandler.js");



// Primary runtime gateway and subsystem facade for visual script nodes
class ContextSystem {
  constructor(game) {
    this.game = game;

    // Subsystem facade handlers
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

  // Constructs sandboxed execution context for a specific node during a tick
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
          const dur = (duration !== undefined && !isNaN(Number(duration))) ? Math.max(0.0001, Number(duration)) : 1.0;
          if (mode === 'fade_out') {
            ts.fadeOut(dur, color, onComplete);
          } else if (mode === 'fade_in') {
            ts.fadeIn(dur, color, onComplete);
          } else if (mode === 'fade') {
            const half = dur / 2;
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

      // Scoped variable access
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

__exports.ScriptAssertionError = ScriptAssertionError;
__exports.getScriptContextMetadata = getScriptContextMetadata;
__exports.formatNotificationMessage = formatNotificationMessage;
__exports.default = ContextSystem;
};
// === Module: Script/EventManager.js ===
__reg.m["Script/EventManager.js"] = function(__require, __exports, __module) {
// Central publish-subscribe signal bus for engine systems and gameplay events
class EventManager {
    constructor() {
        this.listeners = new Map();
        this.globalDefinitions = null;
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    once(eventName, callback) {
        const wrapper = (...args) => {
            this.off(eventName, wrapper);
            callback(...args);
        };
        this.on(eventName, wrapper);
    }

    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    // Dispatches an event to subscribed listeners with error boundaries
    emit(eventName, ...args) {
        if (!this.listeners.has(eventName)) return;

        const callbacks = [...this.listeners.get(eventName)];
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (err) {
                console.error(`[EventManager] Error executing '${eventName}':`, err);
            }
        });
    }

    registerGlobalDefinitions(eventsArray) {
        this.globalDefinitions = eventsArray; 
    }
    
    clearAll() {
        this.listeners.clear();
    }
}

__exports.default = EventManager;
};
// === Module: Script/ScriptRunner.js ===
__reg.m["Script/ScriptRunner.js"] = function(__require, __exports, __module) {
const { applyModifiers } = __require("Script/ValueModifier.js");
const { ScriptAssertionError } = __require("Script/ContextSystem.js");
const __imp_0 = __require("Util/LupisPackageHelper.js"); const LupisPackageHelper = __imp_0.default !== undefined ? __imp_0.default : __imp_0;
const { formatScriptPrefix } = __require("Util/ScriptContextUtils.js");

// Visual script graph executor managing flow propagation, data resolution, and node lifecycles
class ScriptRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game;
        this.data = scriptData || {};
        this.owner = ownerEntity;
        this.scriptId = this.data.id || 'anonymous_script';

        this.nodeMap = new Map();
        if (Array.isArray(this.data.nodes)) {
            this.data.nodes.forEach(node => this.nodeMap.set(node.id, node));
        }

        this.edges = Array.isArray(this.data.edges) ? this.data.edges : [];
        this.localVariables = new Map();
        this.nameToIdMap = new Map();

        // Flow and data adjacency indices for O(1) traversal
        this.flowIndex = new Map();
        this.dataIndex = new Map();

        this._compiledFunctions = new Map();
        this._registeredEvents = [];
        this._customTickListeners = new Map();
        this._nodeStates = new Map();
        this.nodeOutputs = new Map();

        this._buildAdjacencyIndices();
        this._initVariables();
        this._compileAllNodes();
    }

    _buildAdjacencyIndices() {
        this.flowIndex.clear();
        this.dataIndex.clear();

        this.edges.forEach(edge => {
            const flowKey = `${edge.source}:${edge.sourceHandle}`;
            if (!this.flowIndex.has(flowKey)) {
                this.flowIndex.set(flowKey, []);
            }
            this.flowIndex.get(flowKey).push({
                targetNodeId: edge.target,
                targetPortId: edge.targetHandle
            });

            const dataKey = `${edge.target}:${edge.targetHandle}`;
            this.dataIndex.set(dataKey, {
                sourceNodeId: edge.source,
                sourcePortId: edge.sourceHandle,
                modifier: edge.modifier || null
            });
        });
    }

    getNodeState(nodeId) {
        if (!this._nodeStates.has(nodeId)) {
            this._nodeStates.set(nodeId, {});
        }
        return this._nodeStates.get(nodeId);
    }

    _isScriptActive() {
        if (this.owner && this.owner._isDestroyed) return false;
        if (!this.owner) return true;

        if (this.owner.components && this.owner.components.ScriptController) {
            const scriptData = this.owner.components.ScriptController.data;
            const scriptInstance = scriptData ? scriptData.find(s => s.assetId === this.data.id) : undefined;
            if (scriptInstance && scriptInstance.active === false) {
                return false;
            }
        }
        return true;
    }

    _initVariables() {
        this.localVariables.clear();
        this.nameToIdMap.clear();

        const source = this.data.variables || this.data.localVariables || [];
        source.forEach(v => {
            if (!v.name || !v.id) return;

            let val = v.defaultValue;
            if (Array.isArray(val)) {
                val = [...val];
            } else if (val !== null && typeof val === 'object') {
                val = { ...val };
            }

            this.nameToIdMap.set(v.name, v.id);
            this.localVariables.set(v.id, val);
        });
    }

    _compileAllNodes() {
        this._compiledFunctions.clear();

        this.nodeMap.forEach((node, nodeId) => {
            let rawCode = node.code !== undefined ? node.code : (node.data ? node.data.code : undefined);
            if (rawCode === undefined) {
                const encodedCode = node._c !== undefined ? node._c : (node.data ? node.data._c : undefined);
                if (typeof encodedCode === 'string' && encodedCode.length > 0) {
                    rawCode = LupisPackageHelper.decodeObfuscatedCode(encodedCode);
                }
            }
            if (!rawCode || typeof rawCode !== 'string') return;

            try {
                const fn = new Function('inputs', 'outputs', 'context', 'node', rawCode + '\nreturn outputs;');
                this._compiledFunctions.set(nodeId, fn);
            } catch (err) {
                const meta = this.getContextMetadata(node);
                const errMsg = err?.message || String(err);
                const formattedMessage = `${meta.prefix} Syntax error: ${errMsg}`;

                if (this.game && this.game.events) {
                    this.game.events.emit('console:error', {
                        type: 'error',
                        time: Date.now(),
                        message: formattedMessage,
                        source: 'ScriptRunner',
                        context: {
                            scene: meta.scene,
                            entityScriptId: meta.entityScriptId,
                            script: meta.script,
                            node: meta.node
                        }
                    });
                }
                console.error(`[ScriptRunner] Syntax error in node '${meta.node}' (script: '${this.scriptId}'):`, err);
            }
        });
    }

    // Resolves diagnostic breadcrumb metadata for logging
    getContextMetadata(node) {
        const sceneName = this.game?.sceneSystem?.getCurrentSceneScriptId?.() || 
                          this.game?.sceneSystem?.getCurrentSceneName?.() || 
                          this.game?.world?.currentSceneScriptId || 
                          this.game?.world?.currentScene?.scriptId || 
                          this.game?.sceneSystem?.getCurrentSceneId?.() || 
                          'Scene';
        const entityScriptId = this.owner 
            ? (this.owner.scriptId || this.owner.id || 'Entity') 
            : 'Global';
        const scriptName = this.data?.scriptId || 
                           this.game?.world?.scripts?.[this.scriptId]?.scriptId || 
                           this.data?.title || 
                           this.scriptId || 
                           'Script';
        const nodeName = node ? (
            node.settings?.headerTitle || 
            node.data?.settings?.headerTitle || 
            node.title || 
            node.name ||
            node.label || 
            node.type || 
            node.id || 
            'Node'
        ) : 'Node';

        return {
            scene: sceneName,
            entityScriptId: String(entityScriptId),
            script: scriptName,
            node: nodeName,
            prefix: formatScriptPrefix(entityScriptId, scriptName)
        };
    }

    getLocalVariable(key) {
        if (!key) {
            throw new Error(`[ScriptRunner] Local variable key cannot be empty (script: '${this.scriptId}').`);
        }
        const id = this.localVariables.has(key) ? key : this.nameToIdMap.get(key);
        if (!id || !this.localVariables.has(id)) {
            throw new Error(`[ScriptRunner] Local variable '${key}' is not registered in script schema (script: '${this.scriptId}').`);
        }
        return this.localVariables.get(id);
    }

    setLocalVariable(key, value) {
        if (!key) {
            throw new Error(`[ScriptRunner] Local variable key cannot be empty (script: '${this.scriptId}').`);
        }
        const id = this.localVariables.has(key) ? key : this.nameToIdMap.get(key);
        if (!id || !this.localVariables.has(id)) {
            throw new Error(`[ScriptRunner] Local variable '${key}' is not registered in script schema (script: '${this.scriptId}').`);
        }
        this.localVariables.set(id, value);
    }

    hasLocalVariable(key) {
        if (!key) return false;
        return this.localVariables.has(key) || this.nameToIdMap.has(key);
    }

    hasVariable(key) {
        if (!key) return false;
        if (this.hasLocalVariable(key)) return true;
        if (this.game && this.game.variables && typeof this.game.variables.hasGlobal === 'function') {
            return this.game.variables.hasGlobal(key);
        }
        return false;
    }

    getVariable(key) {
        if (!key) return null;
        if (this.hasLocalVariable(key)) {
            return this.getLocalVariable(key);
        }
        if (this.game && this.game.variables && typeof this.game.variables.hasGlobal === 'function') {
            if (this.game.variables.hasGlobal(key)) {
                return this.game.variables.getGlobal(key);
            }
        }
        return null;
    }

    // Evaluates all root event entry-point nodes
    start() {
        if (!this._isScriptActive()) return;

        this._flowDepth = 0;
        this._flowStepsInFrame = 0;

        this.nodeMap.forEach(node => {
            const role = node.role || (node.inputs?.some(i => i.dataType === 'execution') ? 'action' : (node.outputs?.some(o => o.dataType === 'execution') ? 'event' : 'pure'));
            if (role === 'event') {
                this._executeNodeLogic(node, null);
            }
        });
    }

    // Executes frame-dependent tick listeners registered via context.onTick
    update(dt) {
        if (!this._isScriptActive()) return;

        this._flowDepth = 0;
        this._flowStepsInFrame = 0;

        if (this._customTickListeners) {
            this._customTickListeners.forEach((callback, nodeId) => {
                try {
                    callback(dt);
                } catch (err) {
                    if (err instanceof ScriptAssertionError || err?.name === 'ScriptAssertionError') {
                        return;
                    }
                    const node = this.nodeMap.get(nodeId);
                    const meta = this.getContextMetadata(node || { id: nodeId });
                    const errMsg = err?.message || String(err);
                    const formattedMessage = `${meta.prefix} ${errMsg}`;

                    if (this.game && this.game.events) {
                        this.game.events.emit('console:error', {
                            type: 'error',
                            time: Date.now(),
                            message: formattedMessage,
                            source: 'ScriptRunner',
                            context: {
                                scene: meta.scene,
                                entityScriptId: meta.entityScriptId,
                                script: meta.script,
                                node: meta.node
                            }
                        });
                    }
                    console.error(`[ScriptRunner Update Error] Node '${meta.node}' (script: '${this.scriptId}'):`, err);
                }
            });
        }
    }

    // Resolves current input port values from wires, bound variables, or defaults
    getAllInputValues(node) {
        const rawInputs = {};
        const inputsList = node.inputs || [];

        for (let i = 0; i < inputsList.length; i++) {
            const port = inputsList[i];
            if (port.dataType === 'execution') continue;

            const portId = port.id;
            let val = undefined;

            if (port.source) {
                if (port.source.kind === 'edge') {
                    const edgeInfo = this.dataIndex.get(`${node.id}:${portId}`);
                    if (edgeInfo) {
                        const sourceNode = this.nodeMap.get(edgeInfo.sourceNodeId);
                        val = this._getNodeOutputValue(sourceNode, edgeInfo.sourcePortId);
                        const modifier = port.source.modifier || port.source.modifiers || edgeInfo.modifier;
                        if (modifier) {
                            val = applyModifiers(val, modifier);
                        }
                    }
                } else if (port.source.kind === 'literal') {
                    val = port.source.value;
                } else if (port.source.kind === 'variable') {
                    const rawVar = port.source.scope === 'global'
                        ? this.game.variables.getGlobal(port.source.variableId)
                        : this.getLocalVariable(port.source.variableId);
                    val = applyModifiers(rawVar, port.source.modifiers);
                }
            } else {
                const edgeInfo = this.dataIndex.get(`${node.id}:${portId}`);
                if (edgeInfo) {
                    const sourceNode = this.nodeMap.get(edgeInfo.sourceNodeId);
                    val = this._getNodeOutputValue(sourceNode, edgeInfo.sourcePortId);
                    if (edgeInfo.modifier) {
                        val = applyModifiers(val, edgeInfo.modifier);
                    }
                }

                if (val === undefined) {
                    const valueModes = node.data?.valueModes;
                    const mode = valueModes?.[portId] || 'input';

                    if (mode === 'variable') {
                        const boundVar = node.data?.variableBindings?.[portId];
                        if (boundVar) {
                            const rawVar = this.getVariable(boundVar);
                            const modifier = node.data?.variableModifiers?.[portId];
                            val = applyModifiers(rawVar, modifier);
                        }
                    }
                }

                if (val === undefined) {
                    const values = node.data?.values;
                    if (values && values[portId] !== undefined) {
                        val = values[portId];
                    } else if (port.defaultValue !== undefined) {
                        val = port.defaultValue;
                    }
                }
            }

            rawInputs[portId] = val;
        }

        return rawInputs;
    }

    // Propagates execution flow to downstream nodes with cycle and step limits
    executeFlow(sourceNodeId, sourcePortName) {
        if (!this._isScriptActive()) return;

        if (typeof this._flowDepth !== 'number') this._flowDepth = 0;
        if (typeof this._flowStepsInFrame !== 'number') this._flowStepsInFrame = 0;

        const MAX_FLOW_DEPTH = 100;
        const MAX_FLOW_STEPS_PER_FRAME = 1000;

        if (this._flowDepth >= MAX_FLOW_DEPTH || this._flowStepsInFrame >= MAX_FLOW_STEPS_PER_FRAME) {
            const sourceNode = this.nodeMap.get(sourceNodeId);
            const meta = this.getContextMetadata(sourceNode || { id: sourceNodeId });
            const errorMsg = `Infinite loop or excessive execution detected at node '${meta.node}' (source port: '${sourcePortName}'). Recursion depth: ${this._flowDepth}, Steps: ${this._flowStepsInFrame}. Flow halted to prevent game freeze.`;

            if (this.game && this.game.events) {
                this.game.events.emit('console:error', {
                    type: 'error',
                    time: Date.now(),
                    message: `${meta.prefix} [Loop Protection] ${errorMsg}`,
                    source: 'ScriptRunner',
                    context: {
                        scene: meta.scene,
                        entityScriptId: meta.entityScriptId,
                        script: meta.script,
                        node: meta.node
                    }
                });
            }
            console.error(`[ScriptRunner Loop Protection] ${errorMsg}`);
            return;
        }

        const targets = this.flowIndex.get(`${sourceNodeId}:${sourcePortName}`);
        if (!targets || targets.length === 0) return;

        this._flowDepth++;
        this._flowStepsInFrame++;
        try {
            for (let i = 0; i < targets.length; i++) {
                const { targetNodeId, targetPortId } = targets[i];
                const targetNode = this.nodeMap.get(targetNodeId);
                if (targetNode) {
                    this._executeNodeLogic(targetNode, targetPortId);
                }
            }
        } finally {
            this._flowDepth--;
        }
    }

    _executeNodeLogic(node, inputPortId) {
        try {
            const compiledFn = this._compiledFunctions.get(node.id);
            if (typeof compiledFn !== 'function') {
                return;
            }

            const inputs = this.getAllInputValues(node);
            let outputs = this.nodeOutputs.get(node.id);
            if (!outputs) {
                outputs = {};
                this.nodeOutputs.set(node.id, outputs);
            }

            // Reset execution outputs before run
            const outputsList = node.outputs || [];
            for (let i = 0; i < outputsList.length; i++) {
                const port = outputsList[i];
                if (port.dataType === 'execution') {
                    outputs[port.id] = false;
                }
            }

            const context = this.game.contextSystem.createExecutionContext(this, node);

            compiledFn(inputs, outputs, context, node);

            for (let i = 0; i < outputsList.length; i++) {
                const port = outputsList[i];
                if (port.dataType === 'execution' && outputs[port.id] === true) {
                    outputs[port.id] = false;
                    this.executeFlow(node.id, port.id);
                }
            }
        } catch (err) {
            if (err instanceof ScriptAssertionError || err?.name === 'ScriptAssertionError') {
                return;
            }
            const meta = this.getContextMetadata(node);
            const errMsg = err?.message || String(err);
            const formattedMessage = `${meta.prefix} ${errMsg}`;

            if (this.game && this.game.events) {
                this.game.events.emit('console:error', {
                    type: 'error',
                    time: Date.now(),
                    message: formattedMessage,
                    source: 'ScriptRunner',
                    context: {
                        scene: meta.scene,
                        entityScriptId: meta.entityScriptId,
                        script: meta.script,
                        node: meta.node
                    }
                });
            }

            console.error(`[ScriptRunner Runtime Error] Node '${meta.node}' (script: '${this.scriptId}'):`, err);
            throw err;
        }
    }

    // Resolves output values; pure nodes evaluate lazily with cycle detection
    _getNodeOutputValue(sourceNode, outputPortId) {
        if (!sourceNode) return null;

        const role = sourceNode.role || (sourceNode.inputs?.some(i => i.dataType === 'execution') ? 'action' : (sourceNode.outputs?.some(o => o.dataType === 'execution') ? 'event' : 'pure'));

        if (role === 'pure') {
            if (!this._evaluatingPureNodes) this._evaluatingPureNodes = new Set();
            if (this._evaluatingPureNodes.has(sourceNode.id)) {
                throw new Error(`Cycle detected in pure blueprint node evaluation: node '${sourceNode.id}'`);
            }
            this._evaluatingPureNodes.add(sourceNode.id);
            try {
                const compiledFn = this._compiledFunctions.get(sourceNode.id);
                if (typeof compiledFn !== 'function') {
                    return null;
                }
                const inputs = this.getAllInputValues(sourceNode);
                const outputs = {};
                const context = this.game?.contextSystem ? this.game.contextSystem.createExecutionContext(this, sourceNode) : {};
                try {
                    compiledFn(inputs, outputs, context, sourceNode);
                    this.nodeOutputs.set(sourceNode.id, { ...outputs });
                    if (outputs[outputPortId] !== undefined) {
                        return outputs[outputPortId];
                    }
                } catch (err) {
                    if (err instanceof ScriptAssertionError || err?.name === 'ScriptAssertionError') {
                        return null;
                    }
                    const meta = this.getContextMetadata(sourceNode);
                    const errMsg = err?.message || String(err);
                    const formattedMessage = `${meta.prefix} ${errMsg}`;

                    if (this.game && this.game.events) {
                        this.game.events.emit('console:error', {
                            type: 'error',
                            time: Date.now(),
                            message: formattedMessage,
                            source: 'ScriptRunner',
                            context: {
                                scene: meta.scene,
                                entityScriptId: meta.entityScriptId,
                                script: meta.script,
                                node: meta.node
                            }
                        });
                    }
                    throw err;
                }
            } finally {
                this._evaluatingPureNodes.delete(sourceNode.id);
            }
        }

        const cached = this.nodeOutputs.get(sourceNode.id);
        if (cached && cached[outputPortId] !== undefined) {
            return cached[outputPortId];
        }

        const values = sourceNode.data?.values;
        return (values && values[outputPortId] !== undefined) ? values[outputPortId] : null;
    }

    destroy() {
        this._registeredEvents.forEach(({ eventName, callback }) => {
            if (this.game && this.game.events) {
                this.game.events.off(eventName, callback);
            }
        });
        this._registeredEvents = [];
        if (this._customTickListeners) {
            this._customTickListeners.clear();
        }
        this._compiledFunctions.clear();
        this.localVariables.clear();
        this.nameToIdMap.clear();
        this.nodeMap.clear();
        this.flowIndex.clear();
        this.dataIndex.clear();
        this._nodeStates.clear();
        this.nodeOutputs.clear();
    }
}

__exports.default = ScriptRunner;
};
// === Module: Script/ScriptSystem.js ===
__reg.m["Script/ScriptSystem.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("Script/ScriptRunner.js"); const ScriptRunner = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

// Coordinates lifecycle, frame updates, and teardown of active script runner instances
class ScriptSystem {
    constructor(game) {
        this.game = game;
        this.runners = [];
    }

    add(scriptData, ownerEntity = null) {
        const runner = new ScriptRunner(this.game, scriptData, ownerEntity);
        this.runners.push(runner);
        return runner;
    }

    startAll() {
        console.log(`[ScriptSystem] Starting ${this.runners.length} scripts...`);
        this.runners.forEach(runner => runner.start());
    }

    // Updates active runners; UI and runInPause scripts execute during game pause
    update(dt) {
        const isPaused = this.game.isPaused;
        const uiLayerIds = new Set((this.game.world.layersUI || []).map(l => l.id));

        this.runners.forEach(runner => {
            const isUIEntity = runner.owner && (
                uiLayerIds.has(runner.owner.layerId) || 
                (typeof runner.owner.hasTag === 'function' ? runner.owner.hasTag('ui') : runner.owner.tag === 'ui')
            );

            if (!isPaused || isUIEntity || runner.runInPause) {
                runner.update(dt);
            }
        });
    }

    removeEntityScripts(entity) {
        if (!entity) return;

        this.runners = this.runners.filter(runner => {
            if (runner.owner === entity || (entity.id && runner.owner?.id === entity.id)) {
                if (typeof runner.destroy === 'function') {
                    runner.destroy();
                }
                return false;
            }
            return true;
        });
    }
    
    clear() {
        this.runners.forEach(runner => {
            if (typeof runner.destroy === 'function') {
                runner.destroy();
            }
        });
        this.runners = [];
        console.log("[ScriptSystem] Cleared all script runners.");
    }
}

__exports.default = ScriptSystem;
};
// === Module: Script/ValueModifier.js ===
__reg.m["Script/ValueModifier.js"] = function(__require, __exports, __module) {
// Transforms an input value via arithmetic, string, logic, array, or template formatters
function applyModifier(rawVal, modifier) {
  if (!modifier) return rawVal;

  let val = rawVal;
  const modType = modifier.type;
  const modValue = modifier.value;

  if (modType && modType !== 'none') {
    switch (modType) {
      case 'add': {
        const numVal = Number(val);
        const numMod = Number(modValue);
        if (!isNaN(numVal) && !isNaN(numMod)) {
          val = numVal + numMod;
        } else {
          val = String(val ?? '') + String(modValue ?? '');
        }
        break;
      }
      case 'subtract':
        val = Number(val) - Number(modValue);
        break;
      case 'multiply':
        val = Number(val) * Number(modValue);
        break;
      case 'divide':
        val = Number(modValue) !== 0 ? Number(val) / Number(modValue) : 0;
        break;
      case 'invert':
        val = -Number(val);
        break;
      case 'abs':
        val = Math.abs(Number(val));
        break;
      case 'not':
        val = !val;
        break;
      case 'append':
        val = String(val ?? '') + String(modValue ?? '');
        break;
      case 'prepend':
        val = String(modValue ?? '') + String(val ?? '');
        break;
      case 'uppercase':
        val = String(val ?? '').toUpperCase();
        break;
      case 'lowercase':
        val = String(val ?? '').toLowerCase();
        break;
      case 'trim':
        val = String(val ?? '').trim();
        break;
      case 'at_index':
        val = val != null ? val[modValue] : undefined;
        break;
      case 'first':
        val = val != null ? val[0] : undefined;
        break;
      case 'last':
        val = val != null ? val[val.length - 1] : undefined;
        break;
      case 'random':
        val = (val != null && val.length > 0) ? val[Math.floor(Math.random() * val.length)] : undefined;
        break;
      case 'count':
        val = val != null ? val.length : 0;
        break;
      default:
        break;
    }
  }

  const format = modifier.format || modifier.customText;
  if (format && typeof format === 'string') {
    const strVal = String(val);
    val = format
      .replace(/\{value\.upper\}/g, strVal.toUpperCase())
      .replace(/\{value\.lower\}/g, strVal.toLowerCase())
      .replace(/\{value\}/g, strVal);
  }

  return val;
}

// Sequentially applies an array or single modifier to an input value
function applyModifiers(rawVal, modifiers) {
  if (!modifiers) return rawVal;
  if (Array.isArray(modifiers)) {
    return modifiers.reduce((acc, mod) => applyModifier(acc, mod), rawVal);
  }
  return applyModifier(rawVal, modifiers);
}

__exports.default = {
  applyModifier,
  applyModifiers
};

__exports.applyModifier = applyModifier;
__exports.applyModifiers = applyModifiers;
};
// === Module: Script/VariableManager.js ===
__reg.m["Script/VariableManager.js"] = function(__require, __exports, __module) {
// Manages project-wide global variables across scenes and caches script variable schemas
class VariableManager {
    constructor() {
        this.globals = new Map();
        this.nameToIdMap = new Map();
        this.scriptSchemas = new Map();
        this._initialGlobalsBackup = [];
    }

    initGlobals(globalVarsArray = []) {
        this._initialGlobalsBackup = Array.isArray(globalVarsArray)
            ? JSON.parse(JSON.stringify(globalVarsArray))
            : [];
        this.resetGlobals();
    }

    resetGlobals() {
        this.globals.clear();
        this.nameToIdMap.clear();

        if (Array.isArray(this._initialGlobalsBackup)) {
            this._initialGlobalsBackup.forEach(v => {
                if (!v.name || !v.id) return;

                let val = v.defaultValue;
                if (val !== null && typeof val === 'object') {
                    val = JSON.parse(JSON.stringify(val));
                }

                this.nameToIdMap.set(v.name, v.id);
                this.globals.set(v.id, val);
            });
        }
    }

    getGlobal(varNameOrId) {
        if (!varNameOrId) {
            throw new Error('[VariableManager] Global variable identifier cannot be empty.');
        }
        const id = this.globals.has(varNameOrId) ? varNameOrId : this.nameToIdMap.get(varNameOrId);
        if (!id || !this.globals.has(id)) {
            throw new Error(`[VariableManager] Global variable '${varNameOrId}' is not registered in Global Schema.`);
        }

        return this.globals.get(id);
    }

    setGlobal(varNameOrId, value) {
        if (!varNameOrId) {
            throw new Error('[VariableManager] Global variable identifier cannot be empty.');
        }
        const id = this.globals.has(varNameOrId) ? varNameOrId : this.nameToIdMap.get(varNameOrId);
        if (!id || !this.globals.has(id)) {
            throw new Error(`[VariableManager] Global variable '${varNameOrId}' is not registered in Global Schema.`);
        }

        this.globals.set(id, value);
    }

    hasGlobal(varNameOrId) {
        if (!varNameOrId) return false;
        return this.globals.has(varNameOrId) || this.nameToIdMap.has(varNameOrId);
    }

    registerScriptSchema(scriptId, variablesArray = []) {
        const schema = new Map();
        (variablesArray || []).forEach(v => {
            if (v.name && v.id) {
                schema.set(v.name, {
                    id: v.id,
                    type: v.type,
                    defaultValue: v.defaultValue
                });
            }
        });
        
        this.scriptSchemas.set(scriptId, schema);
    }

    getScriptSchema(scriptId) {
        return this.scriptSchemas.get(scriptId);
    }
}

__exports.default = VariableManager;
};
// === Module: Script/Context/AssertContextHandler.js ===
__reg.m["Script/Context/AssertContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing contract assertions and fail-fast invariant checks for script nodes
class AssertContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ failAssert }) {
    return {
      isTrue: (condition, message = 'Assertion failed: expected value to be true') => {
        if (!condition) failAssert(message);
        return true;
      },

      isFalse: (condition, message = 'Assertion failed: expected value to be false') => {
        if (condition) failAssert(message);
        return true;
      },

      exists: (value, message = 'Assertion failed: value does not exist (null or undefined)') => {
        if (value === null || value === undefined) failAssert(message);
        return value;
      },

      hasComponent: (entity, componentName, message) => {
        if (!entity || !entity.components || !entity.components[componentName]) {
          const fallbackMsg = `Assertion failed: entity does not have component '${componentName}'`;
          failAssert(message || fallbackMsg);
        }
        return entity.components[componentName];
      },

      isNumber: (value, message = 'Assertion failed: expected value to be a valid number') => {
        const num = Number(value);
        if (value === '' || value === null || value === undefined || Number.isNaN(num)) {
          failAssert(message);
        }
        return num;
      },

      isString: (value, message = 'Assertion failed: expected value to be a string') => {
        if (typeof value !== 'string') failAssert(message);
        return value;
      },

      isBoolean: (value, message = 'Assertion failed: expected value to be a boolean') => {
        if (typeof value !== 'boolean') failAssert(message);
        return value;
      },

      isObject: (value, message = 'Assertion failed: expected value to be an object') => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) failAssert(message);
        return value;
      },

      isArray: (value, message = 'Assertion failed: expected value to be an array') => {
        if (!Array.isArray(value)) failAssert(message);
        return value;
      },

      inRange: (value, min, max, message) => {
        const num = Number(value);
        if (Number.isNaN(num) || num < min || num > max) {
          const fallbackMsg = `Assertion failed: expected ${value} to be between ${min} and ${max}`;
          failAssert(message || fallbackMsg);
        }
        return num;
      },

      fail: (message = 'Assertion failed') => {
        failAssert(message);
      }
    };
  }
}

__exports.AssertContextHandler = AssertContextHandler;
};
// === Module: Script/Context/AssetContextHandler.js ===
__reg.m["Script/Context/AssetContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing asset resolution and identifier lookup for script nodes
class AssetContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  // Searches asset registry by UUID, scriptId, or slugified name
  getAsset(idOrScriptId) {
    if (!idOrScriptId) return null;
    const world = this.game?.world;
    if (world && typeof world.getAsset === 'function') {
      return world.getAsset(idOrScriptId);
    }
    const search = String(idOrScriptId).trim();
    const searchLower = search.toLowerCase();
    const searchSlug = searchLower.replace(/\s+/g, '_');
    if (world?.assetMap?.[search]) return world.assetMap[search];
    const list = world?.assetList || [];
    return list.find(a => 
      a.id === search || 
      (a.scriptId && (a.scriptId.toLowerCase() === searchLower || a.scriptId.toLowerCase() === searchSlug))
    ) || null;
  }

  // Resolves a human-readable scriptId or reference into its canonical asset UUID
  resolveId(idOrScriptId) {
    if (!idOrScriptId) return null;
    const world = this.game?.world;
    if (world && typeof world.resolveAssetId === 'function') {
      return world.resolveAssetId(idOrScriptId);
    }
    const found = world?.assetMap?.[idOrScriptId];
    if (found && found.id) return found.id;
    const matched = this.getAsset(idOrScriptId);
    return matched ? matched.id : idOrScriptId;
  }

  createFacade() {
    return {
      get: (idOrScriptId) => this.getAsset(idOrScriptId),
      resolveId: (idOrScriptId) => this.resolveId(idOrScriptId)
    };
  }
}

__exports.AssetContextHandler = AssetContextHandler;
};
// === Module: Script/Context/AudioContextHandler.js ===
__reg.m["Script/Context/AudioContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing audio playback, spatial audio dispatch, and mixer channel control
class AudioContextHandler {
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

__exports.AudioContextHandler = AudioContextHandler;
};
// === Module: Script/Context/CameraContextHandler.js ===
__reg.m["Script/Context/CameraContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing viewport camera manipulation, tracking, zoom, and coordinate snapping
class CameraContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade() {
    const game = this.game;
    const camera = game?.camera;

    return {
      // Smoothly follows a target entity with lerp and offset
      follow: (targetEntity, speed, offset = { x: 0, y: 0 }) => {
        const effectiveSpeed = (typeof speed === 'number' && !isNaN(speed)) ? speed : (camera?.defaultLerp ?? camera?.lerp ?? 0.1);
        camera?.setTarget(targetEntity, effectiveSpeed, offset);
      },

      stopFollow: () => {
        camera?.clearTarget();
      },

      setTarget: (targetEntity, speed, offset = { x: 0, y: 0 }) => {
        const effectiveSpeed = (typeof speed === 'number' && !isNaN(speed)) ? speed : (camera?.defaultLerp ?? camera?.lerp ?? 0.1);
        camera?.setTarget(targetEntity, effectiveSpeed, offset);
      },

      clearTarget: () => {
        camera?.clearTarget();
      },

      snapTo(x, y) {
        camera?.snapTo(x, y);
      },

      setTransform: (x, y, scale, speed) => {
        camera?.snapTo(x, y);
        if (scale !== undefined && typeof scale === 'number' && !isNaN(scale) && scale > 0 && camera) camera.scale = scale;
        if (speed !== undefined && typeof speed === 'number' && !isNaN(speed) && camera) {
          camera.lerp = speed;
          camera.defaultLerp = speed;
        }
      },

      getInfo: () => ({
        x: camera?.x || 0,
        y: camera?.y || 0,
        scale: camera?.scale ?? 1,
        smoothSpeed: camera?.lerp ?? 0.1,
        targetEntity: camera?.target?.scriptId || '',
        hasTarget: Boolean(camera?.target)
      }),

      get x() { return camera?.x; },
      set x(val) { if (camera && typeof val === 'number' && !isNaN(val)) camera.x = val; },

      get y() { return camera?.y; },
      set y(val) { if (camera && typeof val === 'number' && !isNaN(val)) camera.y = val; },

      get scale() { return camera?.scale; },
      set scale(val) { if (camera && typeof val === 'number' && !isNaN(val) && val > 0) camera.scale = val; },

      get lerp() { return camera?.lerp; },
      set lerp(val) { if (camera && typeof val === 'number' && !isNaN(val)) { camera.lerp = val; camera.defaultLerp = val; } },

      get target() { return camera?.target; }
    };
  }
}

__exports.CameraContextHandler = CameraContextHandler;
};
// === Module: Script/Context/ConsoleContextHandler.js ===
__reg.m["Script/Context/ConsoleContextHandler.js"] = function(__require, __exports, __module) {
const { formatNotificationMessage } = __require("Util/ScriptContextUtils.js");

// Subsystem handler providing diagnostic logging and notifications for script nodes
class ConsoleContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  _emitLog(meta, level, args) {
    const rawMessage = args.map(a => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a))).join(' ');
    const message = `${meta.prefix} ${rawMessage}`;
    const eventName = `console:${level}`;
    this.game?.events?.emit(eventName, {
      type: level,
      time: Date.now(),
      message,
      source: 'Script',
      context: {
        scene: meta.scene,
        entityScriptId: meta.entityScriptId,
        script: meta.script,
        node: meta.node
      }
    });
  }

  notify({ nodeMeta }, message, source = 'Notification', type = 'log') {
    const rawMessage = formatNotificationMessage(message);
    const formattedMessage = `${nodeMeta.prefix} ${rawMessage}`;
    const eventType = type === 'error' ? 'console:error' : (type === 'warn' ? 'console:warn' : 'console:log');

    this.game?.events?.emit(eventType, {
      type: type || 'log',
      time: Date.now(),
      message: formattedMessage,
      source: source || 'Notification',
      context: {
        scene: nodeMeta.scene,
        entityScriptId: nodeMeta.entityScriptId,
        script: nodeMeta.script,
        node: nodeMeta.node
      }
    });
  }

  createFacade({ nodeMeta }) {
    return {
      log: (...args) => this._emitLog(nodeMeta, 'log', args),
      warn: (...args) => this._emitLog(nodeMeta, 'warn', args),
      error: (...args) => this._emitLog(nodeMeta, 'error', args)
    };
  }
}

__exports.ConsoleContextHandler = ConsoleContextHandler;
};
// === Module: Script/Context/EntityContextHandler.js ===
__reg.m["Script/Context/EntityContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing entity queries, hierarchy traversal, tag filtering, and lifecycle operations
class EntityContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner, node, nodeName }) {
    const entitySystem = this.game?.entitySystem;
    const world = this.game?.world;

    return {
      // Resolves an entity by reference, UUID, scriptId, or 'self'
      get: (targetId) => {
        if (!targetId || targetId === 'self') {
          if (!runner.owner) {
            throw new Error(`[ContextSystem] Owner entity does not exist for 'self' target (node: '${nodeName}', type: '${node?.type || 'unknown'}')`);
          }
          return runner.owner;
        }
        if (typeof targetId === 'object' && targetId !== null) {
          return targetId;
        }
        if (entitySystem && typeof entitySystem.getEntity === 'function') {
          return entitySystem.getEntity(targetId, runner.owner);
        }
        const searchKey = String(targetId).trim();
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          e.id === searchKey || 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
      },

      destroy: (entity) => {
        if (!entity) return;
        let targetEntity = entity;
        if (typeof entity === 'string') {
          if (entity === 'self') {
            targetEntity = runner.owner;
          } else if (entitySystem && typeof entitySystem.getEntity === 'function') {
            targetEntity = entitySystem.getEntity(entity, runner.owner);
          } else {
            const searchKey = String(entity).trim();
            const searchLower = searchKey.toLowerCase();
            const searchSlug = searchLower.replace(/\s+/g, '_');
            const entities = world?.entities || [];
            targetEntity = entities.find(e => 
              e.id === searchKey || 
              (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
            ) || null;
          }
        }
        if (!targetEntity) return;
        if (entitySystem && typeof entitySystem.destroyEntity === 'function') {
          entitySystem.destroyEntity(targetEntity);
        }
      },

      destroyByTag: (tag) => {
        if (!tag) return 0;
        if (entitySystem && typeof entitySystem.destroyEntitiesByTag === 'function') {
          return entitySystem.destroyEntitiesByTag(tag);
        }
        if (entitySystem && typeof entitySystem.destroyByTag === 'function') {
          return entitySystem.destroyByTag(tag);
        }
        const targetTag = String(tag).trim().toLowerCase();
        const entities = world?.entities || [];
        const matches = entities.filter(e => {
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          return String(e.tag || '').trim().toLowerCase() === targetTag;
        });
        let count = 0;
        for (const ent of matches) {
          if (!ent._isDestroyed && entitySystem && typeof entitySystem.destroyEntity === 'function') {
            entitySystem.destroyEntity(ent);
            count++;
          }
        }
        return count;
      },

      clone: (entity) => {
        return entitySystem && typeof entitySystem.cloneEntity === 'function' ? entitySystem.cloneEntity(entity) : null;
      },

      getParent: (entity) => {
        if (entitySystem && typeof entitySystem.getParent === 'function') {
          return entitySystem.getParent(entity);
        }
        if (!entity || !entity.parentId) return null;
        const entities = world?.entities || [];
        return entities.find(e => e.id === entity.parentId) || null;
      },

      getChildren: (entity) => {
        if (entitySystem && typeof entitySystem.getChildren === 'function') {
          return entitySystem.getChildren(entity);
        }
        if (!entity) return [];
        const entities = world?.entities || [];
        return entities.filter(e => e.parentId === entity.id);
      },

      getChildByName: (entity, childName) => {
        if (!entity || !childName) return null;
        const entities = world?.entities || [];
        let parentEnt = entity;
        if (typeof entity === 'string') {
          parentEnt = (entitySystem && typeof entitySystem.getEntity === 'function')
            ? entitySystem.getEntity(entity, runner.owner)
            : entities.find(e => e.id === entity || e.scriptId === entity);
        }
        if (!parentEnt) return null;
        const children = (entitySystem && typeof entitySystem.getChildren === 'function')
          ? entitySystem.getChildren(parentEnt)
          : entities.filter(e => e.parentId === parentEnt.id);
        const search = String(childName).trim().toLowerCase();
        return children.find(c => {
          const sId = String(c.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        }) || null;
      },

      getRoot: (entity) => {
        if (entitySystem && typeof entitySystem.getRoot === 'function') {
          return entitySystem.getRoot(entity);
        }
        if (!entity) return null;
        let current = entity;
        const entities = world?.entities || [];
        while (current && current.parentId) {
          const parent = entities.find(e => e.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
        return current;
      },

      // Finds the nearest entity matching a tag using squared distance
      findClosestByTag: (tag, fromXOrEntity, optFromY) => {
        if (entitySystem && typeof entitySystem.findClosestByTag === 'function') {
          return entitySystem.findClosestByTag(tag, fromXOrEntity, optFromY);
        }
        const entities = world?.entities || [];
        let originX = 0;
        let originY = 0;
        let excludeId = null;

        if (typeof fromXOrEntity === 'object' && fromXOrEntity !== null) {
          excludeId = fromXOrEntity.id;
          const t = fromXOrEntity.components?.Transform || fromXOrEntity.components?.UITransform;
          originX = t ? (t.x || 0) : 0;
          originY = t ? (t.y || 0) : 0;
        } else {
          originX = Number(fromXOrEntity) || 0;
          originY = Number(optFromY) || 0;
        }

        let closest = null;
        let minDistanceSq = Infinity;

        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return null;

        for (const other of entities) {
          if (other.active === false || other._isDestroyed) continue;
          if (excludeId && other.id === excludeId) continue;
          const match = typeof other.hasTag === 'function'
            ? other.hasTag(targetTag)
            : (Array.isArray(other.tags)
                ? other.tags.some(t => String(t).trim().toLowerCase() === targetTag)
                : String(other.tag || other.components?.Tags?.value || '').trim().toLowerCase() === targetTag);
          if (match) {
            const t = other.components?.Transform || other.components?.UITransform;
            const ox = t ? (t.x || 0) : 0;
            const oy = t ? (t.y || 0) : 0;
            const dx = ox - originX;
            const dy = oy - originY;
            const distSq = dx * dx + dy * dy;
            if (distSq < minDistanceSq) {
              minDistanceSq = distSq;
              closest = other;
            }
          }
        }
        return closest;
      },

      getAll: () => {
        const entities = world?.entities || [];
        return entities.filter(e => !e._isDestroyed && e.active !== false);
      },

      getAllByTag: (tag) => {
        if (entitySystem && typeof entitySystem.getAllByTag === 'function') {
          return entitySystem.getAllByTag(tag);
        }
        const targetTag = String(tag || '').trim().toLowerCase();
        if (!targetTag) return [];
        const entities = world?.entities || [];
        return entities.filter(e => {
          if (e.active === false || e._isDestroyed) return false;
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          const otherTag = e.tag || e.components?.Tags?.value;
          return String(otherTag || '').trim().toLowerCase() === targetTag;
        });
      },

      countByTag: (tag) => {
        if (!tag) return 0;
        if (entitySystem && typeof entitySystem.getAllByTag === 'function') {
          return entitySystem.getAllByTag(tag).length;
        }
        const targetTag = String(tag).trim().toLowerCase();
        const entities = world?.entities || [];
        return entities.filter(e => {
          if (e.active === false || e._isDestroyed) return false;
          if (typeof e.hasTag === 'function') return e.hasTag(targetTag);
          if (Array.isArray(e.tags)) return e.tags.some(t => String(t).trim().toLowerCase() === targetTag);
          const otherTag = e.tag || e.components?.Tags?.value;
          return String(otherTag || '').trim().toLowerCase() === targetTag;
        }).length;
      },

      findByName: (name) => {
        if (entitySystem && typeof entitySystem.findByName === 'function') {
          return entitySystem.findByName(name);
        }
        const searchLower = String(name).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug)) || 
          e.id === name
        ) || null;
      },

      findByScriptId: (scriptId) => {
        if (entitySystem && typeof entitySystem.findByScriptId === 'function') {
          return entitySystem.findByScriptId(scriptId);
        }
        const searchLower = String(scriptId).trim().toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');
        const entities = world?.entities || [];
        return entities.find(e => 
          (e.scriptId && (e.scriptId.toLowerCase() === searchLower || e.scriptId.toLowerCase() === searchSlug))
        ) || null;
      }
    };
  }
}

__exports.EntityContextHandler = EntityContextHandler;
};
// === Module: Script/Context/InputContextHandler.js ===
__reg.m["Script/Context/InputContextHandler.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("System/PointerRaycast.js"); const PointerRaycast = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

// Subsystem handler unifying hardware input modalities and pointer raycasting for script nodes
class InputContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade({ runner }) {
    const game = this.game;

    return {
      getPointer: (targetEntity = null) => {
        return game.input ? game.input.getPointer(targetEntity || runner.owner) : null;
      },

      get pointer() {
        return this.getPointer();
      },

      getMouse: (targetEntity = null) => {
        return game.input ? (typeof game.input.getMouse === 'function' ? game.input.getMouse(targetEntity || runner.owner) : game.input.mouse) : null;
      },

      get mouse() {
        return this.getMouse();
      },

      keyboard: {
        isDown: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isDown(key, runner.owner) : false;
        },

        isPressed: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isPressed(key, runner.owner) : false;
        },

        isReleased: (key) => {
          return game.input?.keyboard ? game.input.keyboard.isReleased(key, runner.owner) : false;
        },

        get raw() {
          return game.input?.keyboard || null;
        }
      },

      raycast: {
        getTopEntity: () => (game.pointerRaycast ? game.pointerRaycast.getTopEntityUnderPointer(game) : PointerRaycast.getTopEntityUnderPointer(game)),
        getGlobalTransform: (entity) => PointerRaycast._getGlobalTransform(entity, game.world)
      },

      isPointerOver: (entity, useRaycast = true) => {
        const raycast = game.pointerRaycast || PointerRaycast;
        return raycast && typeof raycast.isPointerOver === 'function'
          ? raycast.isPointerOver(game, entity, useRaycast)
          : false;
      }
    };
  }
}

__exports.InputContextHandler = InputContextHandler;
};
// === Module: Script/Context/LayerContextHandler.js ===
__reg.m["Script/Context/LayerContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing display layer management, input freezing, and runtime layer reset
class LayerContextHandler {
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

__exports.LayerContextHandler = LayerContextHandler;
};
// === Module: Script/Context/LifecycleContextHandler.js ===
__reg.m["Script/Context/LifecycleContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing game lifecycle hooks, global signal event bus, and flow control
class LifecycleContextHandler {
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

__exports.LifecycleContextHandler = LifecycleContextHandler;
};
// === Module: Script/Context/SceneContextHandler.js ===
__reg.m["Script/Context/SceneContextHandler.js"] = function(__require, __exports, __module) {
// Subsystem handler providing scene transitions, queries, layer injection, and reload operations
class SceneContextHandler {
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

      // Injects a layer and entities from a source scene into the active scene
      injectLayer: (sceneName, layerName = null, inheritState = true, targetLayer = 'self', targetScene = 'self') => {
        const inherit = inheritState !== false && inheritState !== 'false';
        return sceneSystem ? sceneSystem.injectLayer(sceneName, layerName, inherit, targetLayer, targetScene) : { success: false, isFirstLoad: false };
      },

      resetLayer: (sceneName = 'self', layerName = null) => {
        return sceneSystem ? Boolean(sceneSystem.resetLayer(sceneName, layerName)) : false;
      }
    };
  }
}

__exports.SceneContextHandler = SceneContextHandler;
};
// === Module: Script/Context/UIContextHandler.js ===
__reg.m["Script/Context/UIContextHandler.js"] = function(__require, __exports, __module) {
const __imp_0 = __require("System/PointerRaycast.js"); const PointerRaycast = __imp_0.default !== undefined ? __imp_0.default : __imp_0;

// Subsystem handler providing UI transforms, hit testing, widgets, and layout management
class UIContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  // Evaluates whether a UI entity is active, visible, and unblocked by input freeze
  isEntityInteractable(entity, context = null) {
    if (!entity || entity._isDestroyed) return false;
    const game = this.game || context?.game;
    const world = game?.world || context?.runner?.world;

    if (world && typeof PointerRaycast._isEntityAndParentsActive === 'function') {
      if (!PointerRaycast._isEntityAndParentsActive(entity, world)) return false;
    } else {
      if (entity.active === false || entity.visible === false) return false;
    }

    if (game?.layerSystem && typeof game.layerSystem.isEntityInputFrozen === 'function') {
      if (game.layerSystem.isEntityInputFrozen(entity, 'pointer')) return false;
    }

    if (world && typeof PointerRaycast._findEntityLayer === 'function') {
      const layer = PointerRaycast._findEntityLayer(world, entity);
      if (layer) {
        if (layer.active === false || layer.visible === false) return false;
        if (game?.layerSystem && typeof game.layerSystem.isInputFrozen === 'function') {
          if (game.layerSystem.isInputFrozen(layer.id, 'pointer', entity)) return false;
        } else if (layer.freezeInput && (layer.freezeInputType === 'all' || layer.freezeInputType === 'pointer')) {
          return false;
        }
      }
    }

    return true;
  }

  // Computes cumulative global pixel coordinates for a UI entity
  getGlobalTransform(entity, context) {
    if (!entity) return { x: 0, y: 0 };
    const game = this.game;
    const uiWidth = (game.world && game.world.settings && game.world.settings.ui && game.world.settings.ui.width) || 1920;
    const uiHeight = (game.world && game.world.settings && game.world.settings.ui && game.world.settings.ui.height) || 1080;

    let cur = entity;
    let gx = 0;
    let gy = 0;
    while (cur) {
      const t = cur.components && (cur.components.UITransform || cur.components.Transform);
      if (t) {
        gx += (typeof t.x === 'number' ? t.x : 0);
        gy += (typeof t.y === 'number' ? t.y : 0);
      }
      if (cur.parentId && context && context.entity && typeof context.entity.get === 'function') {
        cur = context.entity.get(cur.parentId);
      } else if (cur.parentId && game.world && game.world.entities) {
        cur = game.world.entities.find(e => e.id === cur.parentId || e.scriptId === cur.parentId) || null;
      } else {
        if (t) {
          const aX = typeof t.anchorX === 'number' ? t.anchorX : 0.5;
          const aY = typeof t.anchorY === 'number' ? t.anchorY : 0.5;
          gx += (uiWidth * aX);
          gy += (uiHeight * aY);
        }
        break;
      }
    }
    return { x: gx, y: gy };
  }

  // Tests whether the pointer cursor is hovering inside an entity's UI bounding box
  isPointerOver(entity, padX = 0, padY = 0, context = null) {
    if (!entity) return false;
    if (!this.isEntityInteractable(entity, context)) return false;
    const game = this.game || context?.game;
    const input = (context && context.input) || (game && game.input);

    if (input && typeof input.isPointerOver === 'function') {
      try {
        if (input.isPointerOver(entity, true) || input.isPointerOver(entity, false)) return true;
        return false;
      } catch (err) {}
    }

    const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(entity) || input.getPointer()) : null;
    if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

    const t = entity.components && (entity.components.UITransform || entity.components.Transform);
    if (!t) return false;

    const px = pointer.x;
    const py = pointer.y;
    const w = t.width || 40;
    const h = t.height || 40;
    const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
    const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
    const gt = this.getGlobalTransform(entity, context);
    const left = gt.x - (pX * w);
    const right = left + w;
    const top = gt.y - (pY * h);
    const bottom = top + h;

    return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
  }

  // Normalizes an audio bus name into canonical mixer channel keys
  resolveAudioBus(key) {
    const k = String(key || '').toLowerCase().trim();
    if (k === 'vocal' || k === 'voice') return 'voice';
    if (k === 'background' || k === 'bgm') return 'background';
    if (k === 'master') return 'master';
    if (k === 'sfx') return 'sfx';
    return k;
  }

  // Updates visual components of a UI slider widget based on volume value
  updateSliderVisual(s, volume, context) {
    if (!s || !s.tBar) return;

    const rawVol = Number(volume);
    const clampedVol = Math.max(0, Math.min(100, isNaN(rawVol) ? 0 : rawVol));
    s.currentVolume = clampedVol;
    const f = clampedVol / 100;

    const w = Math.max(0, s.baseW * f);
    s.tBar.width = w;
    s.tBar.x = s.baseX - (s.pivotX * s.baseW * (1 - f));

    if (s.shape) {
      s.shape.width = w;
    }
    if (s.sprite) {
      s.sprite.sourceX = s.baseSX;
      s.sprite.sourceWidth = Math.max(0, s.baseSW * f);
    }

    if (s.tHandler) {
      if (s.isChild) {
        s.tHandler.x = (s.baseX - (s.pivotX * s.baseW) + (f * s.baseW)) - s.tBar.x;
      } else {
        const localLeft = s.baseX - (s.pivotX * s.baseW);
        s.tHandler.x = localLeft + (f * s.baseW);
      }
    }

    let indicatorComp = s.indicatorTextComp;
    if (!indicatorComp && context && context.entity && typeof context.entity.get === 'function') {
      if (!s.indicatorEntity && s.indicatorName) {
        s.indicatorEntity = context.entity.get(s.indicatorName);
      }
      if (s.indicatorEntity) {
        if (s.indicatorEntity.components && s.indicatorEntity.components.TextRenderer) {
          indicatorComp = s.indicatorEntity.components.TextRenderer;
          s.indicatorTextComp = indicatorComp;
        } else if (s.indicatorEntity.children && Array.isArray(s.indicatorEntity.children)) {
          for (const childId of s.indicatorEntity.children) {
            const childEnt = context.entity.get(childId);
            if (childEnt && childEnt.components && childEnt.components.TextRenderer) {
              indicatorComp = childEnt.components.TextRenderer;
              s.indicatorTextComp = indicatorComp;
              break;
            }
          }
        }
      }
    }

    if (indicatorComp) {
      const rounded = Math.round(clampedVol);
      const template = (typeof s.format === 'string' && s.format) ? s.format : '{value}%';
      indicatorComp.value = template.replace('{value}', rounded);
    }
  }

  // Tests whether the pointer cursor is over the active bounding area of a slider track or knob
  isPointerOverSlider(s, px, py, context) {
    if (!s || !s.barEntity || !s.tBar) return false;

    if (!this.isEntityInteractable(s.barEntity, context) || (s.handlerEntity && !this.isEntityInteractable(s.handlerEntity, context))) {
      return false;
    }

    const input = (context && context.input) || (this.game && this.game.input);
    if (input && typeof input.isPointerOver === 'function') {
      try {
        if (handlerInteractable && s.handlerEntity && (input.isPointerOver(s.handlerEntity, true) || input.isPointerOver(s.handlerEntity, false))) {
          return true;
        }
        if (barInteractable && s.barEntity && (input.isPointerOver(s.barEntity, true) || input.isPointerOver(s.barEntity, false))) {
          return true;
        }
        return false;
      } catch (err) {}
    }

    const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(s.barEntity) || input.getPointer(s.handlerEntity) || input.getPointer()) : null;
    if (!pointer) return false;

    const left = s.screenLeft;
    const right = s.screenRight;
    const top = s.screenTop;
    const bottom = s.screenBottom;

    const padX = 20;
    const padY = Math.max(25, s.baseH);

    return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
  }

  // Processes multi-bus audio volume slider control set (master, voice, sfx, background)
  processVolumeSliders(stateOrParams, configOrCtx, inputsMaybe, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !inputsMaybe);
    const inputs = isDirect ? stateOrParams : (inputsMaybe || {});
    const context = isDirect ? configOrCtx : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const configInput = isDirect ? (inputs && inputs.config ? inputs.config : false) : configOrCtx;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const updateSliderVisual = (s, v) => this.updateSliderVisual(s, v, context);
    const isPointerOverSlider = (s, px, py) => this.isPointerOverSlider(s, px, py, context);

    let config = inputs.config;
    if (!config && configInput) {
      config = configInput;
    }
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = false;
      }
    }

    const defaultConfig = {
      master: { bar: 'VolumeMasterBar', handler: 'VolumeMasterHandler', indicator: 'VolumeMasterIndicator' },
      vocal: { bar: 'VolumeVocalBar', handler: 'VolumeVocalHandler', indicator: 'VolumeVocalIndicator' },
      sfx: { bar: 'VolumeSFXBar', handler: 'VolumeSFXHandler', indicator: 'VolumeSFXIndicator' },
      background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler', indicator: 'VolumeBGMIndicator' }
    };

    let sliderMap = defaultConfig;
    if (config && typeof config === 'object') {
      sliderMap = config;
    }

    if (!state.sliders) {
      state.sliders = {};
    }

    if (!state.isInitialized || state.activeConfig !== config) {
      state.isInitialized = true;
      state.activeConfig = config;

      for (const existingKey of Object.keys(state.sliders)) {
        if (!sliderMap[existingKey]) {
          delete state.sliders[existingKey];
        }
      }

      for (const [key, item] of Object.entries(sliderMap)) {
        if (!item || typeof item !== 'object') continue;
        if (!item.bar || typeof item.bar !== 'string') continue;

        const barName = item.bar.trim();
        if (!barName) continue;

        let barEntity = false;
        if (context && context.entity && typeof context.entity.get === 'function') {
          barEntity = context.entity.get(barName);
        }
        if (!barEntity) {
          if (context && context.console && typeof context.console.warn === 'function') {
            context.console.warn('[VolumeSlider] Bar entity not found: ' + barName);
          }
          continue;
        }

        const tBar = barEntity.components && (barEntity.components.UITransform || barEntity.components.Transform);
        if (!tBar) continue;

        let handlerEntity = false;
        if (item.handler && typeof item.handler === 'string') {
          const handlerName = item.handler.trim();
          if (handlerName && context && context.entity && typeof context.entity.get === 'function') {
            handlerEntity = context.entity.get(handlerName);
          }
        }

        let indicatorEntity = false;
        let indicatorTextComp = false;
        let indicatorName = '';
        if (item.indicator && typeof item.indicator === 'string') {
          indicatorName = item.indicator.trim();
          if (indicatorName && context && context.entity && typeof context.entity.get === 'function') {
            indicatorEntity = context.entity.get(indicatorName);
          }
          if (indicatorEntity) {
            if (indicatorEntity.components && indicatorEntity.components.TextRenderer) {
              indicatorTextComp = indicatorEntity.components.TextRenderer;
            } else if (indicatorEntity.children && Array.isArray(indicatorEntity.children) && context && context.entity && typeof context.entity.get === 'function') {
              for (const childId of indicatorEntity.children) {
                const childEnt = context.entity.get(childId);
                if (childEnt && childEnt.components && childEnt.components.TextRenderer) {
                  indicatorTextComp = childEnt.components.TextRenderer;
                  break;
                }
              }
            }
          }
        }

        const tHandler = handlerEntity && handlerEntity.components ? (handlerEntity.components.UITransform || handlerEntity.components.Transform) : false;
        const sprite = barEntity.components ? barEntity.components.SpriteRenderer : false;
        const shape = barEntity.components ? barEntity.components.ShapeRenderer : false;
        const audioBus = this.resolveAudioBus(key);

        const isChild = Boolean(
          handlerEntity && barEntity && handlerEntity.parentId &&
          (handlerEntity.parentId === barEntity.id || handlerEntity.parentId === barEntity.scriptId)
        );
        const baseW = typeof tBar._baseWidth === 'number' ? tBar._baseWidth : (tBar.width || 100);
        const baseH = typeof tBar._baseHeight === 'number' ? tBar._baseHeight : (tBar.height || 100);
        const baseX = typeof tBar._baseX === 'number' ? tBar._baseX : (typeof tBar.x === 'number' ? tBar.x : 0);
        const baseY = typeof tBar._baseY === 'number' ? tBar._baseY : (typeof tBar.y === 'number' ? tBar.y : 0);
        tBar._baseWidth = baseW;
        tBar._baseHeight = baseH;
        tBar._baseX = baseX;
        tBar._baseY = baseY;

        const pivotX = typeof tBar.pivotX === 'number' ? tBar.pivotX : 0.5;
        const pivotY = typeof tBar.pivotY === 'number' ? tBar.pivotY : 0.5;
        const anchorX = typeof tBar.anchorX === 'number' ? tBar.anchorX : 0.5;
        const anchorY = typeof tBar.anchorY === 'number' ? tBar.anchorY : 0.5;

        let baseSX = 0;
        let baseSY = 0;
        let baseSW = baseW;
        let baseSH = baseH;

        if (sprite) {
          baseSX = typeof sprite._baseSourceX === 'number' ? sprite._baseSourceX : (typeof sprite.sourceX === 'number' ? sprite.sourceX : 0);
          baseSY = typeof sprite._baseSourceY === 'number' ? sprite._baseSourceY : (typeof sprite.sourceY === 'number' ? sprite.sourceY : 0);
          baseSW = typeof sprite._baseSourceWidth === 'number' ? sprite._baseSourceWidth : (sprite.sourceWidth || baseW);
          baseSH = typeof sprite._baseSourceHeight === 'number' ? sprite._baseSourceHeight : (sprite.sourceHeight || baseH);
          sprite._baseSourceX = baseSX;
          sprite._baseSourceY = baseSY;
          sprite._baseSourceWidth = baseSW;
          sprite._baseSourceHeight = baseSH;
        }

        if (shape) {
          const baseShapeW = typeof shape._baseWidth === 'number' ? shape._baseWidth : (shape.width || baseW);
          const baseShapeH = typeof shape._baseHeight === 'number' ? shape._baseHeight : (shape.height || baseH);
          shape._baseWidth = baseShapeW;
          shape._baseHeight = baseShapeH;
        }

        const prevBarX = tBar.x;
        tBar.x = baseX;
        const barGT = this.getGlobalTransform(barEntity, context);
        tBar.x = prevBarX;

        const screenLeft = barGT.x - (pivotX * baseW);
        const screenRight = screenLeft + baseW;
        const screenTop = barGT.y - (pivotY * baseH);
        const screenBottom = screenTop + baseH;

        state.sliders[key] = {
          key,
          barEntity,
          handlerEntity,
          indicatorEntity,
          indicatorTextComp,
          indicatorName,
          format: (typeof item.format === 'string') ? item.format : '{value}%',
          tBar,
          tHandler,
          sprite,
          shape,
          audioBus,
          isChild,
          baseW,
          baseH,
          baseX,
          baseY,
          pivotX,
          pivotY,
          anchorX,
          anchorY,
          baseSX,
          baseSY,
          baseSW,
          baseSH,
          screenLeft,
          screenRight,
          screenTop,
          screenBottom,
          currentVolume: 100
        };

        const s = state.sliders[key];
        let vol = false;
        let hasAudioVol = false;

        if (context && context.audio && typeof context.audio.getVolume === 'function') {
          const existingVol = context.audio.getVolume(audioBus);
          if (typeof existingVol === 'number' && !isNaN(existingVol)) {
            vol = existingVol;
            hasAudioVol = true;
          }
        }

        if (vol === false) {
          if (typeof item.volume === 'number' && !isNaN(item.volume)) {
            vol = item.volume;
          } else if (typeof item.volume === 'string' && item.volume.trim() && !isNaN(Number(item.volume))) {
            vol = Number(item.volume);
          } else {
            vol = 100;
          }
          if (context && context.audio && typeof context.audio.setVolume === 'function' && !hasAudioVol) {
            context.audio.setVolume(audioBus, vol);
          }
        }

        updateSliderVisual(s, vol);
        if (!hasAudioVol && context && context.audio && typeof context.audio.setVolume === 'function') {
          context.audio.setVolume(audioBus, vol);
        }

        outputs[key + 'Volume'] = vol;
        outputs.currentVolume = vol;
      }
    }

    const syncExternal = () => {
      if (!context || !context.audio || typeof context.audio.getVolume !== 'function') return;
      if (!state.sliders) return;

      for (const [key, s] of Object.entries(state.sliders)) {
        if (!s || !s.tBar) continue;
        if (state.activeDraggingKey === key) continue;

        const rawBusVol = context.audio.getVolume(s.audioBus);
        if (typeof rawBusVol !== 'number' || isNaN(rawBusVol)) continue;
        const busVol = Math.max(0, Math.min(100, Math.round(rawBusVol)));

        if (busVol !== s.currentVolume) {
          updateSliderVisual(s, busVol);
          outputs[key + 'Volume'] = busVol;
          outputs.currentVolume = busVol;
          outputs.changedChannel = key;
        }
      }
    };

    const processPointer = () => {
      const input = (context && context.input) || (this.game && this.game.input);

      if (state.activeDraggingKey) {
        const activeS = state.sliders ? state.sliders[state.activeDraggingKey] : null;
        if (!activeS || (!this.isEntityInteractable(activeS.barEntity, context) && (!activeS.handlerEntity || !this.isEntityInteractable(activeS.handlerEntity, context)))) {
          state.activeDraggingKey = false;
        }
      }

      const activeS = state.activeDraggingKey && state.sliders ? state.sliders[state.activeDraggingKey] : null;
      const targetEntity = activeS ? (activeS.barEntity || activeS.handlerEntity) : null;
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(targetEntity) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(targetEntity) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

      if (!isDown) {
        state.activeDraggingKey = false;
        return;
      }

      if (!pointer) return;
      const px = pointer.x;
      const py = pointer.y;
      if (typeof px !== 'number' || typeof py !== 'number') return;

      if (!state.activeDraggingKey) {
        for (const [key, s] of Object.entries(state.sliders)) {
          if (s && isPointerOverSlider(s, px, py)) {
            state.activeDraggingKey = key;
            break;
          }
        }
      }

      if (state.activeDraggingKey) {
        const s = state.sliders ? state.sliders[state.activeDraggingKey] : false;
        if (!s || !s.barEntity || !s.tBar || (!this.isEntityInteractable(s.barEntity, context) && (!s.handlerEntity || !this.isEntityInteractable(s.handlerEntity, context)))) {
          state.activeDraggingKey = false;
          return;
        }

        const left = s.screenLeft;
        const right = s.screenRight;

        const clampedX = Math.min(Math.max(px, left), right);
        const fill = s.baseW > 0 ? ((clampedX - left) / s.baseW) : 0;
        const newVolume = Math.round(fill * 100);

        if (newVolume !== s.currentVolume) {
          updateSliderVisual(s, newVolume);

          if (context.audio && typeof context.audio.setVolume === 'function') {
            context.audio.setVolume(s.audioBus, newVolume);
          }

          outputs.changedChannel = s.key;
          outputs.currentVolume = newVolume;
          outputs[s.key + 'Volume'] = newVolume;
          outputs.onChanged = true;
          if (typeof context.triggerFlow === 'function') {
            context.triggerFlow('onChanged');
          }
        }
      }
    };

    syncExternal();
    processPointer();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      state.activeDraggingKey = false;

      context.onTick(() => {
        syncExternal();
        processPointer();
      });
    }

    outputs.execOut = true;
    const result = {
      execOut: true,
      onChanged: Boolean(outputs.onChanged),
      changedChannel: outputs.changedChannel || '',
      currentVolume: typeof outputs.currentVolume === 'number' ? outputs.currentVolume : 0,
      masterVolume: typeof outputs.masterVolume === 'number' ? outputs.masterVolume : 100,
      vocalVolume: typeof outputs.vocalVolume === 'number' ? outputs.vocalVolume : 100,
      sfxVolume: typeof outputs.sfxVolume === 'number' ? outputs.sfxVolume : 100,
      backgroundVolume: typeof outputs.backgroundVolume === 'number' ? outputs.backgroundVolume : 100
    };
    Object.assign(outputs, result);
    return result;
  }

  // Processes a single generic UI slider widget
  processAtomicSlider(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
    const barName = typeof inputs.barEntity === 'string' ? inputs.barEntity.trim() : '';
    const handlerName = typeof inputs.handlerEntity === 'string' ? inputs.handlerEntity.trim() : '';

    let barEnt = false;
    if (barName && context && context.entity && typeof context.entity.get === 'function') {
      barEnt = context.entity.get(barName);
    }

    let handlerEnt = false;
    if (handlerName && context && context.entity && typeof context.entity.get === 'function') {
      handlerEnt = context.entity.get(handlerName);
    }

    if (!barEnt) {
      if (barName && context && context.console && typeof context.console.warn === 'function') {
        context.console.warn('[AtomicSlider] Bar entity not found: ' + barName);
      }
      outputs.execOut = true;
      return;
    }

    const tBar = barEnt.components && (barEnt.components.UITransform || barEnt.components.Transform);
    if (!tBar) {
      outputs.execOut = true;
      return;
    }

    const minVal = typeof inputs.min === 'number' ? inputs.min : 0;
    const rawMax = typeof inputs.max === 'number' ? inputs.max : 100;
    const maxVal = rawMax > minVal ? rawMax : (minVal + 1);
    const stepVal = typeof inputs.step === 'number' && inputs.step > 0 ? inputs.step : 0;
    const isInteractive = inputs.isInteractive !== false;
    const isReverse = inputs.reverse === true || inputs.reverse === 'true';

    function snapValue(val) {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      if (stepVal > 0) {
        const steps = Math.round((clamped - minVal) / stepVal);
        const snapped = minVal + (steps * stepVal);
        return Math.max(minVal, Math.min(maxVal, Number(snapped.toFixed(6))));
      }
      return clamped;
    }

    const self = this;

    if (!state.isInitialized) {
      state.isInitialized = true;
      state.isDragging = false;
      state.lastReverse = isReverse;

      const sprite = barEnt.components ? barEnt.components.SpriteRenderer : false;
      const shape = barEnt.components ? barEnt.components.ShapeRenderer : false;

      const isChild = Boolean(
        handlerEnt && barEnt && handlerEnt.parentId &&
        (handlerEnt.parentId === barEnt.id || handlerEnt.parentId === barEnt.scriptId)
      );

      const baseW = typeof tBar._baseWidth === 'number' ? tBar._baseWidth : (tBar.width || 100);
      const baseH = typeof tBar._baseHeight === 'number' ? tBar._baseHeight : (tBar.height || 100);
      const baseX = typeof tBar._baseX === 'number' ? tBar._baseX : (typeof tBar.x === 'number' ? tBar.x : 0);
      const baseY = typeof tBar._baseY === 'number' ? tBar._baseY : (typeof tBar.y === 'number' ? tBar.y : 0);
      tBar._baseWidth = baseW;
      tBar._baseHeight = baseH;
      tBar._baseX = baseX;
      tBar._baseY = baseY;

      const pivotX = typeof tBar.pivotX === 'number' ? tBar.pivotX : 0.5;
      const pivotY = typeof tBar.pivotY === 'number' ? tBar.pivotY : 0.5;

      let baseSX = 0;
      let baseSY = 0;
      let baseSW = baseW;
      let baseSH = baseH;

      if (sprite) {
        baseSX = typeof sprite._baseSourceX === 'number' ? sprite._baseSourceX : (typeof sprite.sourceX === 'number' ? sprite.sourceX : 0);
        baseSY = typeof sprite._baseSourceY === 'number' ? sprite._baseSourceY : (typeof sprite.sourceY === 'number' ? sprite.sourceY : 0);
        baseSW = typeof sprite._baseSourceWidth === 'number' ? sprite._baseSourceWidth : (sprite.sourceWidth || baseW);
        baseSH = typeof sprite._baseSourceHeight === 'number' ? sprite._baseSourceHeight : (sprite.sourceHeight || baseH);
        sprite._baseSourceX = baseSX;
        sprite._baseSourceY = baseSY;
        sprite._baseSourceWidth = baseSW;
        sprite._baseSourceHeight = baseSH;
      }

      if (shape) {
        const baseShapeW = typeof shape._baseWidth === 'number' ? shape._baseWidth : (shape.width || baseW);
        const baseShapeH = typeof shape._baseHeight === 'number' ? shape._baseHeight : (shape.height || baseH);
        shape._baseWidth = baseShapeW;
        shape._baseHeight = baseShapeH;
      }

      const prevBarX = tBar.x;
      tBar.x = baseX;
      const barGT = self.getGlobalTransform(barEnt, context);
      tBar.x = prevBarX;

      const screenLeft = barGT.x - (pivotX * baseW);
      const screenRight = screenLeft + baseW;
      const screenTop = barGT.y - (pivotY * baseH);
      const screenBottom = screenTop + baseH;

      state.baseW = baseW;
      state.baseH = baseH;
      state.baseX = baseX;
      state.baseY = baseY;
      state.pivotX = pivotX;
      state.pivotY = pivotY;
      state.baseSX = baseSX;
      state.baseSY = baseSY;
      state.baseSW = baseSW;
      state.baseSH = baseSH;
      state.screenLeft = screenLeft;
      state.screenRight = screenRight;
      state.screenTop = screenTop;
      state.screenBottom = screenBottom;
      state.isChild = isChild;

      const initialVal = typeof barEnt._atomicValue === 'number' ? barEnt._atomicValue : (typeof inputs.value === 'number' ? inputs.value : maxVal);
      state.value = snapValue(initialVal);
      barEnt._atomicValue = state.value;
      state.lastInputValue = inputs.value;
    }

    if (typeof inputs.value === 'number' && inputs.value !== state.lastInputValue && !state.isDragging) {
      state.lastInputValue = inputs.value;
      state.value = snapValue(inputs.value);
      barEnt._atomicValue = state.value;
    }

    function updateVisual(val) {
      const f = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
      const fVisual = isReverse ? (1 - f) : f;
      const baseW = state.baseW;
      const pivotX = state.pivotX;
      const baseX = state.baseX;
      const w = Math.max(0, baseW * fVisual);

      tBar.width = w;
      tBar.x = baseX - (pivotX * baseW * (1 - fVisual));

      if (barEnt.components && barEnt.components.ShapeRenderer) {
        barEnt.components.ShapeRenderer.width = w;
      }
      if (barEnt.components && barEnt.components.SpriteRenderer) {
        barEnt.components.SpriteRenderer.sourceX = state.baseSX;
        barEnt.components.SpriteRenderer.sourceWidth = Math.max(0, state.baseSW * fVisual);
      }

      const tHandler = handlerEnt && handlerEnt.components ? (handlerEnt.components.UITransform || handlerEnt.components.Transform) : false;
      if (tHandler) {
        if (state.isChild) {
          tHandler.x = (baseX - (pivotX * baseW) + (fVisual * baseW)) - tBar.x;
        } else {
          const localLeft = baseX - (pivotX * baseW);
          tHandler.x = localLeft + (fVisual * baseW);
        }
      }
    }

    if (state.lastReverse !== isReverse) {
      state.lastReverse = isReverse;
      updateVisual(state.value);
    }

    function isPointerOverSlider(px, py) {
      if (!self.isEntityInteractable(barEnt, context) || (handlerEnt && !self.isEntityInteractable(handlerEnt, context))) {
        return false;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      if (input && typeof input.isPointerOver === 'function') {
        try {
          if (handlerInteractable && handlerEnt && (input.isPointerOver(handlerEnt, true) || input.isPointerOver(handlerEnt, false))) {
            return true;
          }
          if (barInteractable && barEnt && (input.isPointerOver(barEnt, true) || input.isPointerOver(barEnt, false))) {
            return true;
          }
          return false;
        } catch (err) {}
      }

      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(barEnt) || input.getPointer(handlerEnt) || input.getPointer()) : false;
      if (!pointer) return false;

      const left = state.screenLeft;
      const right = state.screenRight;
      const top = state.screenTop;
      const bottom = state.screenBottom;

      const padX = 20;
      const padY = Math.max(25, state.baseH);

      return (px >= left - padX && px <= right + padX && py >= top - padY && py <= bottom + padY);
    }

    function processPointer() {
      if (!isInteractive) return;

      if (!self.isEntityInteractable(barEnt, context) || (handlerEnt && !self.isEntityInteractable(handlerEnt, context))) {
        state.isDragging = false;
        return;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(barEnt) || input.getPointer(handlerEnt) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(barEnt) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);

      if (!isDown) {
        state.isDragging = false;
        return;
      }

      if (!pointer) {
        state.isDragging = false;
        return;
      }
      const px = pointer.x;
      const py = pointer.y;
      if (typeof px !== 'number' || typeof py !== 'number') return;

      if (!state.isDragging) {
        if (isPointerOverSlider(px, py)) {
          state.isDragging = true;
        }
      }

      if (state.isDragging) {
        if (!self.isEntityInteractable(barEnt, context) && (!handlerEnt || !self.isEntityInteractable(handlerEnt, context))) {
          state.isDragging = false;
          return;
        }
        const left = state.screenLeft;
        const right = state.screenRight;
        const baseW = state.baseW;

        const clampedX = Math.min(Math.max(px, left), right);
        const fill = baseW > 0 ? ((clampedX - left) / baseW) : 0;
        const computedVal = isReverse
          ? (maxVal - (fill * (maxVal - minVal)))
          : (minVal + (fill * (maxVal - minVal)));
        const snappedVal = snapValue(computedVal);

        if (snappedVal !== state.value) {
          state.value = snappedVal;
          barEnt._atomicValue = snappedVal;
          updateVisual(snappedVal);

          const normalized = Math.max(0, Math.min(1, (snappedVal - minVal) / (maxVal - minVal)));
          outputs.value = snappedVal;
          outputs.normalized = Number(normalized.toFixed(4));
          outputs.onChanged = true;
          if (typeof context.triggerFlow === 'function') {
            context.triggerFlow('onChanged');
          }
        }
      }
    }

    updateVisual(state.value);
    processPointer();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      context.onTick(() => {
        processPointer();
      });
    }

    const norm = Math.max(0, Math.min(1, (state.value - minVal) / (maxVal - minVal)));
    outputs.value = state.value;
    outputs.normalized = Number(norm.toFixed(4));
    outputs.execOut = true;
    const result = {
      execOut: true,
      value: outputs.value,
      normalized: outputs.normalized,
      onChanged: Boolean(outputs.onChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  // Processes a toggle switch button widget supporting text labels or image sprite swaps
  processSwitchButton(stateOrParams, inputsOrContext, outputsMaybe, isImageMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 3 && typeof stateOrParams === 'object' && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const isImage = isDirect ? Boolean(outputsMaybe) : Boolean(isImageMaybe);
    const context = isDirect ? inputsOrContext : contextMaybe;
    const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
    const resolveEntity = (rawTarget, allowSelf = false) => {
      if (!rawTarget) {
        if (allowSelf) {
          if (context && context.entity && typeof context.entity.get === 'function') {
            try {
              const selfEnt = context.entity.get('self');
              if (selfEnt) return selfEnt;
            } catch (_) {}
          }
          if (context?.runner?.owner) return context.runner.owner;
          if (context?.owner) return context.owner;
        }
        return null;
      }

      if (typeof rawTarget === 'object') {
        return rawTarget;
      }

      if (typeof rawTarget !== 'string') return null;

      const targetStr = rawTarget.trim();
      if (!targetStr) {
        if (allowSelf) {
          if (context && context.entity && typeof context.entity.get === 'function') {
            try {
              const selfEnt = context.entity.get('self');
              if (selfEnt) return selfEnt;
            } catch (_) {}
          }
          if (context?.runner?.owner) return context.runner.owner;
          if (context?.owner) return context.owner;
        }
        return null;
      }

      if (targetStr.toLowerCase() === 'self') {
        if (context && context.entity && typeof context.entity.get === 'function') {
          try {
            const selfEnt = context.entity.get('self');
            if (selfEnt) return selfEnt;
          } catch (_) {}
        }
        if (context?.runner?.owner) return context.runner.owner;
        if (context?.owner) return context.owner;
      }

      if (context && context.entity && typeof context.entity.get === 'function') {
        try {
          const found = context.entity.get(targetStr);
          if (found) return found;
        } catch (_) {}
      }

      const entitySystem = (this.game && this.game.entitySystem) || (context?.game?.entitySystem);
      if (entitySystem && typeof entitySystem.getEntity === 'function') {
        try {
          const found = entitySystem.getEntity(targetStr, context?.runner?.owner || context?.owner);
          if (found) return found;
        } catch (_) {}
      }

      const world = (this.game && this.game.world) || (context?.game?.world);
      if (world) {
        if (world.scriptIdMap && typeof world.scriptIdMap.get === 'function') {
          const mapped = world.scriptIdMap.get(targetStr);
          if (mapped) return mapped;
        }

        const searchKey = targetStr;
        const searchLower = searchKey.toLowerCase();
        const searchSlug = searchLower.replace(/\s+/g, '_');

        const pool = [];
        if (Array.isArray(world.entities)) pool.push(...world.entities);
        const layers = world.allLayers || [];
        for (const l of layers) {
          if (Array.isArray(l.entities)) pool.push(...l.entities);
        }

        const owner = context?.runner?.owner || context?.owner;
        if (owner && Array.isArray(owner.children)) {
          for (const ch of owner.children) {
            if (ch && typeof ch === 'object') pool.push(ch);
          }
        }

        const found = pool.find(e => {
          if (!e) return false;
          if (e.id === searchKey || (e.id && String(e.id).toLowerCase() === searchLower)) return true;
          if (e.scriptId && (String(e.scriptId).toLowerCase() === searchLower || String(e.scriptId).toLowerCase() === searchSlug)) return true;
          if (e.name && (String(e.name).toLowerCase() === searchLower || String(e.name).toLowerCase() === searchSlug)) return true;
          return false;
        });

        if (found) return found;
      }

      return null;
    };

    const rawKnob = (inputs.knobEntity !== undefined && inputs.knobEntity !== '') ? inputs.knobEntity : inputs.targetEntity;
    const knobEnt = resolveEntity(rawKnob, true);
    const trackEnt = resolveEntity(inputs.trackEntity, false);
    const onTextEnt = resolveEntity(inputs.onTextEntity || inputs.textEntity, false);
    const offTextEnt = resolveEntity(inputs.offTextEntity, false);

    if (!knobEnt) {
      if (context && context.console && typeof context.console.warn === 'function') {
        const identifier = typeof rawKnob === 'string' ? rawKnob : (rawKnob?.scriptId || rawKnob?.id || '');
        if (identifier) {
          context.console.warn((isImage ? '[SwitchImage]' : '[SwitchShape]') + ' Knob entity not found: ' + identifier);
        }
      }
      const emptyRes = {
        execOut: true,
        isOn: Boolean(inputs.isOn),
        onOn: false,
        onOff: false
      };
      Object.assign(outputs, emptyRes);
      return emptyRes;
    }

    const self = this;

    function isPointerOverEntity(ent) {
      if (!ent) return false;
      if (!self.isEntityInteractable(ent, context)) return false;

      const input = (context && context.input) || (self.game && self.game.input);
      if (input && typeof input.isPointerOver === 'function') {
        try {
          if (input.isPointerOver(ent, true) || input.isPointerOver(ent, false)) {
            return true;
          }
          return false;
        } catch (err) {}
      }

      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(ent) || input.getPointer()) : false;
      if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;
      const t = ent.components && (ent.components.UITransform || ent.components.Transform);
      if (!t) return false;
      const px = pointer.x;
      const py = pointer.y;
      const w = t.width || 40;
      const h = t.height || 40;
      const pX = typeof t.pivotX === 'number' ? t.pivotX : 0.5;
      const pY = typeof t.pivotY === 'number' ? t.pivotY : 0.5;
      const gt = self.getGlobalTransform(ent, context);
      const left = gt.x - (pX * w);
      const right = left + w;
      const top = gt.y - (pY * h);
      const bottom = top + h;
      const pad = 10;
      return (px >= left - pad && px <= right + pad && py >= top - pad && py <= bottom + pad);
    }

    function applyShapeColor(ent, colorHex) {
      if (!ent || !ent.components || !ent.components.ShapeRenderer || !colorHex) return;
      const sh = ent.components.ShapeRenderer;
      sh.color = colorHex;
      if (Array.isArray(sh.elements)) {
        for (const el of sh.elements) {
          if (el) {
            el.color = colorHex;
            el.fill = colorHex;
          }
        }
      }
    }

    if (!state.isInitialized) {
      state.isInitialized = true;
      const initialIsOn = typeof knobEnt._switchIsOn === 'boolean'
        ? knobEnt._switchIsOn
        : (trackEnt && typeof trackEnt._switchIsOn === 'boolean' ? trackEnt._switchIsOn : Boolean(inputs.isOn));
      state.isOn = initialIsOn;
      state.lastInputIsOn = inputs.isOn;
      state.progress = state.isOn ? 1 : 0;
      state.wasDown = false;

      const tKnob = knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
      if (tKnob) {
        if (typeof tKnob._switchOffX === 'number' && typeof tKnob._switchOnX === 'number') {
          state.offX = tKnob._switchOffX;
          state.onX = tKnob._switchOnX;
        } else {
          const baseX = typeof tKnob._baseX === 'number' ? tKnob._baseX : (typeof tKnob.x === 'number' ? tKnob.x : 0);
          tKnob._baseX = baseX;
          const defaultSlideDist = typeof inputs.slideDist === 'number' ? inputs.slideDist : 40;
          let travelDist = defaultSlideDist;

          if (trackEnt) {
            const tTrack = trackEnt.components && (trackEnt.components.UITransform || trackEnt.components.Transform);
            if (tTrack && typeof tTrack.width === 'number' && typeof tKnob.width === 'number') {
              const isChild = Boolean(
                knobEnt.parentId &&
                (knobEnt.parentId === trackEnt.id || knobEnt.parentId === trackEnt.scriptId)
              );
              if (isChild) {
                const trackW = tTrack.width;
                const knobW = tKnob.width;
                const pad = Math.max(2, Math.round(((tTrack.height || 30) - (tKnob.height || 26)) / 2));
                const pTrackX = typeof tTrack.pivotX === 'number' ? tTrack.pivotX : 0.5;
                const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
                const childOffX = (-pTrackX * trackW) + (pKnobX * knobW) + pad;
                const childOnX = (-pTrackX * trackW) + trackW - ((1 - pKnobX) * knobW) - pad;
                state.offX = childOffX;
                state.onX = childOnX;
                travelDist = false;
              } else {
                const diff = tTrack.width - tKnob.width - 4;
                if (diff > 0) {
                  travelDist = diff;
                }
              }
            }
          }

          if (travelDist !== false) {
            if (Boolean(inputs.isOn)) {
              state.onX = baseX;
              state.offX = baseX - travelDist;
            } else {
              state.offX = baseX;
              state.onX = baseX + travelDist;
            }
          }

          tKnob._switchOffX = state.offX;
          tKnob._switchOnX = state.onX;
        }

        knobEnt._switchIsOn = state.isOn;
        if (trackEnt) {
          trackEnt._switchIsOn = state.isOn;
        }

        const prevKnobX = tKnob.x;
        tKnob.x = state.offX;
        const knobGT = self.getGlobalTransform(knobEnt, context);
        tKnob.x = prevKnobX;

        const knobW = tKnob.width || 40;
        const knobH = tKnob.height || 40;
        const pKnobX = typeof tKnob.pivotX === 'number' ? tKnob.pivotX : 0.5;
        const pKnobY = typeof tKnob.pivotY === 'number' ? tKnob.pivotY : 0.5;

        const top = knobGT.y - (pKnobY * knobH);
        const bottom = top + knobH;

        const minX = Math.min(state.offX, state.onX);
        const maxX = Math.max(state.offX, state.onX);
        const originShift = knobGT.x - state.offX;
        const left = originShift + minX - (pKnobX * knobW);
        const right = originShift + maxX - (pKnobX * knobW) + knobW;

        state.screenLeft = left;
        state.screenRight = right;
        state.screenTop = top;
        state.screenBottom = bottom;
      }
    }

    if (typeof inputs.isOn === 'boolean' && inputs.isOn !== state.lastInputIsOn) {
      state.lastInputIsOn = inputs.isOn;
      state.isOn = inputs.isOn;
      knobEnt._switchIsOn = inputs.isOn;
      if (trackEnt) {
        trackEnt._switchIsOn = inputs.isOn;
      }
    }

    function applyVisuals(progress) {
      const tKnob = knobEnt && knobEnt.components && (knobEnt.components.UITransform || knobEnt.components.Transform);
      if (tKnob && typeof state.offX === 'number' && typeof state.onX === 'number') {
        const smoothProgress = progress * progress * (3 - (2 * progress));
        tKnob.x = state.offX + ((state.onX - state.offX) * smoothProgress);
      }

      const isVisuallyOn = progress >= 0.5;

      if (!isImage) {
        const knobColor = isVisuallyOn ? (inputs.knobOnColor || '#FFFFFF') : (inputs.knobOffColor || '#E0E0E0');
        const trackColor = isVisuallyOn ? (inputs.trackOnColor || '#4CAF50') : (inputs.trackOffColor || '#757575');
        applyShapeColor(knobEnt, knobColor);
        if (trackEnt) {
          applyShapeColor(trackEnt, trackColor);
        }
      } else {
        const resolveAsset = (assetId) => {
          if (!assetId) return assetId;
          if (context && context.asset && typeof context.asset.resolveId === 'function') {
            const resolved = context.asset.resolveId(assetId);
            if (resolved) return resolved;
          }
          return assetId;
        };
        const knobImg = isVisuallyOn ? (inputs.knobOnImage || inputs.knobOffImage) : (inputs.knobOffImage || inputs.knobOnImage);
        const trackImg = isVisuallyOn ? (inputs.trackOnImage || inputs.trackOffImage) : (inputs.trackOffImage || inputs.trackOnImage);
        const finalKnobImg = resolveAsset(knobImg);
        const finalTrackImg = resolveAsset(trackImg);

        if (knobEnt && knobEnt.components && finalKnobImg) {
          const comp = knobEnt.components.SpriteRenderer || knobEnt.components.ImageRenderer;
          if (comp) comp.assetId = finalKnobImg;
        }
        if (trackEnt && trackEnt.components && finalTrackImg) {
          const comp = trackEnt.components.SpriteRenderer || trackEnt.components.ImageRenderer;
          if (comp) comp.assetId = finalTrackImg;
        }
      }

      if (onTextEnt && offTextEnt && onTextEnt !== offTextEnt) {
        if (onTextEnt.components && onTextEnt.components.TextRenderer) {
          const tx = onTextEnt.components.TextRenderer;
          if (inputs.onText) tx.value = inputs.onText;
          tx.color = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#757575');
          tx.opacity = isVisuallyOn ? 1 : 0.4;
        }
        if (offTextEnt && offTextEnt.components && offTextEnt.components.TextRenderer) {
          const tx = offTextEnt.components.TextRenderer;
          if (inputs.offText) tx.value = inputs.offText;
          tx.color = isVisuallyOn ? (inputs.offTextColor || '#757575') : (inputs.onTextColor || '#FFFFFF');
          tx.opacity = isVisuallyOn ? 0.4 : 1;
        }
      } else if (onTextEnt && onTextEnt.components && onTextEnt.components.TextRenderer) {
        const tx = onTextEnt.components.TextRenderer;
        const txt = isVisuallyOn ? (inputs.onText || 'ON') : (inputs.offText || 'OFF');
        const col = isVisuallyOn ? (inputs.onTextColor || '#FFFFFF') : (inputs.offTextColor || '#BDBDBD');
        if (txt) tx.value = txt;
        if (col) tx.color = col;
      }
    }

    applyVisuals(state.progress);

    function isPointerOverSwitch() {
      if (!self.isEntityInteractable(knobEnt, context) || (trackEnt && !self.isEntityInteractable(trackEnt, context))) {
        return false;
      }

      if (isPointerOverEntity(knobEnt)) return true;
      if (trackEnt && isPointerOverEntity(trackEnt)) return true;
      if (onTextEnt && isPointerOverEntity(onTextEnt)) return true;
      if (offTextEnt && isPointerOverEntity(offTextEnt)) return true;

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(knobEnt) || input.getPointer()) : false;
      if (!pointer || typeof pointer.x !== 'number' || typeof pointer.y !== 'number') return false;

      const px = pointer.x;
      const py = pointer.y;
      const padX = 10;
      const padY = 10;
      const sLeft = state.screenLeft;
      const sRight = state.screenRight;
      const sTop = state.screenTop;
      const sBottom = state.screenBottom;

      if (typeof sLeft === 'number' && typeof sRight === 'number' && typeof sTop === 'number' && typeof sBottom === 'number') {
        if (px >= sLeft - padX && px <= sRight + padX && py >= sTop - padY && py <= sBottom + padY) {
          return true;
        }
      }
      return false;
    }

    function updateStep() {
      if (!self.isEntityInteractable(knobEnt, context) || (trackEnt && !self.isEntityInteractable(trackEnt, context))) {
        state.wasDown = false;
        return;
      }

      const input = (context && context.input) || (self.game && self.game.input);
      const pointer = input && typeof input.getPointer === 'function' ? (input.getPointer(knobEnt) || input.getPointer()) : false;
      const mouse = input ? (typeof input.getMouse === 'function' ? (input.getMouse(knobEnt) || input.mouse) : input.mouse) : false;
      const mouseIsDown = Boolean(mouse && (
        (typeof mouse.isDown === 'function' && (mouse.isDown(0) || mouse.isDown('left'))) ||
        (typeof mouse.isPressed === 'function' && mouse.isPressed('left'))
      ));
      const isDown = Boolean((pointer && pointer.down) || mouseIsDown);
      const isJustPressed = Boolean(isDown && !state.wasDown);
      state.wasDown = isDown;

      if (isJustPressed) {
        let triggered = false;
        let nextState = !state.isOn;

        if (offTextEnt && onTextEnt && offTextEnt !== onTextEnt) {
          if (isPointerOverEntity(offTextEnt)) {
            if (state.isOn) {
              nextState = false;
              triggered = true;
            }
          } else if (isPointerOverEntity(onTextEnt)) {
            if (!state.isOn) {
              nextState = true;
              triggered = true;
            }
          }
        }

        if (!triggered) {
          if (isPointerOverSwitch()) {
            nextState = !state.isOn;
            triggered = true;
          }
        }

        if (triggered) {
          state.isOn = nextState;
          knobEnt._switchIsOn = nextState;
          if (trackEnt) {
            trackEnt._switchIsOn = nextState;
          }
          outputs.isOn = state.isOn;
          if (state.isOn) {
            outputs.onOn = true;
            outputs.onOff = false;
            if (typeof context.triggerFlow === 'function') {
              context.triggerFlow('onOn');
            }
          } else {
            outputs.onOff = true;
            outputs.onOn = false;
            if (typeof context.triggerFlow === 'function') {
              context.triggerFlow('onOff');
            }
          }
        }
      }

      const dt = (context && context.game && typeof context.game.deltaTime === 'number')
        ? context.game.deltaTime
        : ((context && typeof context.dt === 'number') ? context.dt : 0.016);
      const duration = typeof inputs.duration === 'number' ? Math.max(0, inputs.duration) : 0.15;
      const targetProgress = state.isOn ? 1 : 0;

      if (duration <= 0) {
        if (state.progress !== targetProgress) {
          state.progress = targetProgress;
          applyVisuals(targetProgress);
        }
      } else if (state.progress !== targetProgress) {
        const step = dt / duration;
        if (state.progress < targetProgress) {
          state.progress = Math.min(targetProgress, state.progress + step);
        } else {
          state.progress = Math.max(targetProgress, state.progress - step);
        }
        applyVisuals(state.progress);
      }
    }

    updateStep();

    if (!state.hasTickListener && typeof context.onTick === 'function') {
      state.hasTickListener = true;
      context.onTick(() => {
        updateStep();
      });
    }

    outputs.isOn = state.isOn;
    outputs.execOut = true;
    const result = {
      execOut: true,
      isOn: outputs.isOn,
      onOn: Boolean(outputs.onOn),
      onOff: Boolean(outputs.onOff)
    };
    Object.assign(outputs, result);
    return result;
  }

  // Spawns and arranges UI prefab instances into a 2D grid matrix layout
  processGridSpawner(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const prefabName = typeof inputs.prefabName === 'string' ? inputs.prefabName.trim() : '';
    const rawTotal = typeof inputs.totalCount === 'number' ? inputs.totalCount : Number(inputs.totalCount);
    const totalCount = (!isNaN(rawTotal) && rawTotal >= 0) ? Math.floor(rawTotal) : 0;
    const rawCols = typeof inputs.columns === 'number' ? inputs.columns : Number(inputs.columns);
    const columns = (!isNaN(rawCols) && rawCols > 0) ? Math.floor(rawCols) : 5;
    const spacingX = typeof inputs.spacingX === 'number' ? inputs.spacingX : (Number(inputs.spacingX) || 0);
    const spacingY = typeof inputs.spacingY === 'number' ? inputs.spacingY : (Number(inputs.spacingY) || 0);
    const startX = typeof inputs.startX === 'number' ? inputs.startX : (Number(inputs.startX) || 0);
    const startY = typeof inputs.startY === 'number' ? inputs.startY : (Number(inputs.startY) || 0);
    const parentEntityName = typeof inputs.parentEntity === 'string' ? inputs.parentEntity.trim() : '';
    const layerId = typeof inputs.layerId === 'string' ? inputs.layerId.trim() : '';
    const dataList = Array.isArray(inputs.dataList) ? inputs.dataList : [];

    let parentEnt = null;
    if (parentEntityName && context && context.entity && typeof context.entity.get === 'function') {
      parentEnt = context.entity.get(parentEntityName);
    }

    const spawnedEntities = [];
    let lastSpawnedId = '';
    let lastIndex = 0;
    let lastRow = 0;
    let lastCol = 0;
    let lastData = null;

    if (!prefabName) {
      if (context && context.console && typeof context.console.warn === 'function') {
        context.console.warn('[UIGridSpawner] Prefab name is empty.');
      }
      const emptyResult = {
        execOut: true,
        onSpawnItem: false,
        spawnedEntity: '',
        itemIndex: 0,
        rowIndex: 0,
        colIndex: 0,
        itemData: null,
        spawnedEntities: []
      };
      Object.assign(outputs, emptyResult);
      return emptyResult;
    }

    for (let i = 0; i < totalCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      const posX = startX + (col * spacingX);
      const posY = startY + (row * spacingY);

      const itemData = i < dataList.length ? dataList[i] : null;

      let spawned = null;
      if (context && context.prefab && typeof context.prefab.spawn === 'function') {
        spawned = context.prefab.spawn(prefabName, posX, posY, layerId);
      }

      if (spawned) {
        if (parentEnt) {
          if (typeof parentEnt.addChild === 'function') {
            parentEnt.addChild(spawned);
          } else {
            spawned.parentId = parentEnt.id;
            if (Array.isArray(parentEnt.children) && !parentEnt.children.some(c => c.id === spawned.id)) {
              parentEnt.children.push(spawned);
            }
          }
        }

        const spawnedId = spawned.scriptId || spawned.id || '';
        spawnedEntities.push(spawnedId);

        lastSpawnedId = spawnedId;
        lastIndex = i;
        lastRow = row;
        lastCol = col;
        lastData = itemData;

        outputs.spawnedEntity = spawnedId;
        outputs.itemIndex = i;
        outputs.rowIndex = row;
        outputs.colIndex = col;
        outputs.itemData = itemData;
        outputs.onSpawnItem = true;

        if (context && typeof context.triggerFlow === 'function') {
          context.triggerFlow('onSpawnItem');
        }
      }
    }

    outputs.execOut = true;
    outputs.onSpawnItem = false;
    outputs.spawnedEntity = lastSpawnedId;
    outputs.itemIndex = lastIndex;
    outputs.rowIndex = lastRow;
    outputs.colIndex = lastCol;
    outputs.itemData = lastData;
    outputs.spawnedEntities = spawnedEntities;

    const result = {
      execOut: true,
      onSpawnItem: false,
      spawnedEntity: lastSpawnedId,
      itemIndex: lastIndex,
      rowIndex: lastRow,
      colIndex: lastCol,
      itemData: lastData,
      spawnedEntities
    };
    return result;
  }

  // Binds runtime dynamic data properties to target components across an entity and its children
  processPrefabBinder(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
    const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
    const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
    const context = isDirect ? inputsOrContext : contextMaybe;
    const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

    const rawTarget = inputs.targetEntity !== undefined ? inputs.targetEntity : 'self';
    const targetEntityName = (typeof rawTarget === 'string') 
      ? rawTarget.trim() 
      : (rawTarget?.scriptId || rawTarget?.id || 'self');

    let root = null;
    if (context && context.entity && typeof context.entity.get === 'function') {
      root = context.entity.get(targetEntityName);
    } else if (this.game && this.game.world && Array.isArray(this.game.world.entities)) {
      root = this.game.world.entities.find(e => e.id === targetEntityName || e.scriptId === targetEntityName) || null;
    }

    if (!root) {
      const emptyRes = { execOut: true, targetEntity: '', boundCount: 0 };
      Object.assign(outputs, emptyRes);
      return emptyRes;
    }

    const data = inputs.data !== undefined ? inputs.data : null;
    const itemIndex = typeof inputs.itemIndex === 'number' ? inputs.itemIndex : (Number(inputs.itemIndex) || 0);

    let bindings = inputs.bindings;
    if (typeof bindings === 'string') {
      try { bindings = JSON.parse(bindings); } catch (_) { bindings = []; }
    }
    const rules = Array.isArray(bindings) 
      ? bindings 
      : (bindings && typeof bindings === 'object' ? Object.values(bindings) : []);

    const resolvePath = (obj, path) => {
      if (!path || path === '.' || path === 'this' || path === 'self') return obj;
      if (obj === null || obj === undefined) return undefined;
      if (typeof obj !== 'object') return obj;
      const parts = String(path).split(/[.\[\]]+/).filter(Boolean);
      let cur = obj;
      for (const p of parts) {
        if (cur === null || cur === undefined) return undefined;
        if (cur instanceof Map) {
          if (cur.has(p)) {
            cur = cur.get(p);
          } else if (/^\d+$/.test(p) && cur.has(Number(p))) {
            cur = cur.get(Number(p));
          } else {
            cur = undefined;
          }
        } else if (Array.isArray(cur)) {
          const idx = Number(p);
          cur = (Number.isInteger(idx) && idx >= 0 && idx < cur.length) ? cur[idx] : cur[p];
        } else {
          cur = cur[p];
        }
      }
      return cur;
    };

    const resolveScopedVariable = (expression) => {
      if (!expression || typeof expression !== 'string') return { found: false };
      const trimmed = expression.trim();
      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      if (!scopeMatch) return { found: false };

      const scope = scopeMatch[1].toLowerCase();
      const varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      const subPath = scopeMatch[2] ? (scopeMatch[3] || '').replace(/^[:.]/, '').trim() : '';

      if (!varName) return { found: false };

      try {
        let rootVal = undefined;
        if (scope === 'local' && context && typeof context.getLocal === 'function') {
          rootVal = context.getLocal(varName);
        } else if (scope === 'global' && context && typeof context.getGlobal === 'function') {
          rootVal = context.getGlobal(varName);
        }
        if (rootVal === undefined && context && typeof context.getVariable === 'function') {
          rootVal = context.getVariable(varName);
        }

        if (rootVal !== undefined) {
          const finalVal = subPath ? resolvePath(rootVal, subPath) : rootVal;
          return { found: true, val: finalVal };
        }
      } catch (_) {
        return { found: false };
      }
      return { found: false };
    };

    const interpolatePath = (pathStr) => {
      if (typeof pathStr !== 'string') return pathStr;
      if (!pathStr.includes('{')) return pathStr;
      return pathStr.replace(/\{([^}]+)\}/g, (_, expr) => {
        const trimmed = expr.trim();
        if (trimmed === 'index') return String(itemIndex);
        if (trimmed === 'index + 1' || trimmed === 'index+1') return String(itemIndex + 1);

        const scoped = resolveScopedVariable(trimmed);
        if (scoped.found && scoped.val !== undefined && scoped.val !== null) {
          return String(scoped.val);
        }

        const val = resolvePath(data, trimmed);
        return val !== undefined && val !== null ? String(val) : '';
      });
    };

    const evaluateTemplate = (template, dataObj, idx) => {
      if (typeof template !== 'string') return String(template ?? '');
      return template.replace(/\{([^}]+)\}/g, (_, expr) => {
        const trimmed = expr.trim();
        if (trimmed === 'index') return String(idx);
        if (trimmed === 'index + 1' || trimmed === 'index+1') return String(idx + 1);

        const scoped = resolveScopedVariable(trimmed);
        if (scoped.found) {
          return scoped.val !== undefined && scoped.val !== null ? String(scoped.val) : '';
        }

        const val = resolvePath(dataObj, trimmed);
        return val !== undefined && val !== null ? String(val) : '';
      });
    };

    const findEntity = (rootEnt, name) => {
      if (!name || name === 'self' || name === rootEnt.scriptId || name === rootEnt.id) {
        return rootEnt;
      }
      if (context && context.entity && typeof context.entity.getChildByName === 'function') {
        const ch = context.entity.getChildByName(rootEnt, name);
        if (ch) return ch;
      }
      if (context && context.entity && typeof context.entity.getChildren === 'function') {
        const children = context.entity.getChildren(rootEnt) || [];
        const search = String(name).trim().toLowerCase();
        const ch = children.find(c => {
          const sId = String(c.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        });
        if (ch) return ch;
      }
      if (this.game && this.game.world && Array.isArray(this.game.world.entities)) {
        const search = String(name).trim().toLowerCase();
        const ch = this.game.world.entities.find(e => {
          if (e.parentId !== rootEnt.id && e.parentId !== rootEnt.scriptId) return false;
          const sId = String(e.scriptId || '').toLowerCase();
          return sId === search || sId.startsWith(search + '_');
        });
        if (ch) return ch;
      }
      return null;
    };

    const resolveAsset = (assetId) => {
      if (!assetId) return assetId;
      if (context && context.asset && typeof context.asset.resolveId === 'function') {
        const resolved = context.asset.resolveId(assetId);
        if (resolved) return resolved;
      }
      return assetId;
    };

    const inferComponent = (ent, prop) => {
      if (!ent || !prop) return null;
      const p = String(prop).toLowerCase();
      if (['active', 'visible', 'tag', 'tags', 'zindex', 'orderindex'].includes(p)) {
        return 'Entity';
      }
      if (!ent.components) return null;
      if (ent.components.TextRenderer && ['value', 'text', 'content', 'fontsize', 'align', 'alignline', 'autoline', 'maxline', 'linespacing', 'letterspacing', 'overflow', 'outlinewidth', 'outlinecolor', 'shadowenabled', 'shadowcolor'].includes(p)) {
        return 'TextRenderer';
      }
      if (ent.components.SpriteRenderer && ['assetid', 'filtermode', 'usesdf', 'sourcex', 'sourcey', 'sourcewidth', 'sourceheight'].includes(p)) {
        return 'SpriteRenderer';
      }
      if (ent.components.UITransform && ['anchorx', 'anchory', 'isratiolocked', 'isscalelocked'].includes(p)) {
        return 'UITransform';
      }
      if ((ent.components.UITransform || ent.components.Transform) && ['scale', 'scalex', 'scaley', 'size', 'width', 'height', 'x', 'y', 'pivotx', 'pivoty', 'flipx', 'flipy', 'rotation'].includes(p)) {
        return ent.components.UITransform ? 'UITransform' : 'Transform';
      }
      if (ent.components.Audio && ['audiotype', 'volume', 'ismute', 'pitch', 'loop', 'autoplay', 'spatial', 'fadein', 'fadeout', 'refdistance', 'maxdistance'].includes(p)) {
        return 'Audio';
      }
      if (ent.components.Physics && ['motionmode', 'gravityscale', 'isfrozen', 'drag', 'velocityx', 'velocityy', 'isgrounded', 'movementstate', 'facingdirection', 'aligntoslope', 'mass'].includes(p)) {
        return 'Physics';
      }
      if (ent.components.SpriteAnimator && ['currentclip', 'clip', 'isplaying'].includes(p)) {
        return 'SpriteAnimator';
      }
      if (ent.components.ShapeRenderer && ['isfilled', 'fillopacity', 'outlineopacity', 'elements'].includes(p)) {
        return 'ShapeRenderer';
      }
      if (ent.components.Tilemap && ['issolid'].includes(p)) {
        return 'Tilemap';
      }
      for (const [cName, cObj] of Object.entries(ent.components)) {
        if (cObj && typeof cObj === 'object' && prop in cObj) {
          return cName;
        }
      }
      return null;
    };

    let boundCount = 0;

    for (const rule of rules) {
      if (!rule || typeof rule !== 'object') continue;
      const targetName = rule.target || rule.child || 'self';
      const targetEnt = findEntity(root, targetName);
      if (!targetEnt) continue;

      const rawProp = rule.property || rule.prop || rule.field;
      const compName = rule.component || rule.comp || inferComponent(targetEnt, rawProp) || 'Entity';
      const prop = rawProp || (compName === 'TextRenderer' ? 'value' : (compName === 'SpriteRenderer' ? 'assetId' : ''));

      // Resolve raw value from data or global/local variable
      let val = undefined;
      const rawPath = rule.path !== undefined && rule.path !== null ? rule.path : rule.source;

      if (rule.template !== undefined && rule.template !== null && rule.template !== '') {
        val = evaluateTemplate(rule.template, data, itemIndex);
      } else if (rawPath !== undefined && rawPath !== null) {
        if (typeof rawPath === 'string') {
          const evaluatedPath = interpolatePath(rawPath);
          const scoped = resolveScopedVariable(evaluatedPath);
          if (scoped.found) {
            val = scoped.val;
          } else {
            val = resolvePath(data, evaluatedPath);
          }
        } else {
          val = resolvePath(data, rawPath);
        }
      } else if (rule.value !== undefined) {
        val = rule.value;
      } else {
        val = data;
      }

      // Mapping table / switch
      const mapping = rule.switch || rule.mapping || rule.map || rule.match;
      if (mapping && typeof mapping === 'object') {
        const strKey = String(val);
        if (strKey in mapping) {
          val = mapping[strKey];
        } else if (val in mapping) {
          val = mapping[val];
        } else if ('default' in mapping) {
          val = mapping['default'];
        }
      }

      if (val === undefined && rule.defaultValue !== undefined) {
        val = rule.defaultValue;
      }

      // Global Variable support
      const isGlobal = rule.global !== undefined || rule.scope === 'global' || compName === 'GlobalVariable';
      if (isGlobal) {
        const globalVarName = rule.global || rule.variable || rule.var || prop;
        if (globalVarName) {
          try {
            if (context && typeof context.setGlobal === 'function') {
              context.setGlobal(globalVarName, val);
            } else if (this.game?.variables?.setGlobal) {
              this.game.variables.setGlobal(globalVarName, val);
            } else if (context && typeof context.setVariable === 'function') {
              context.setVariable(globalVarName, val);
            }
            boundCount++;
          } catch (e) {
            if (context?.console?.warn) context.console.warn(`[UI Prefab Binder] Failed to set global variable '${globalVarName}':`, e);
          }
        }
        continue;
      }

      // Local Script Variable support (by scriptId, assetId, or first script)
      const isLocal = rule.local !== undefined || rule.variable !== undefined || rule.var !== undefined || rule.scope === 'local' || compName === 'LocalVariable' || compName === 'ScriptVariable' || compName === 'ScriptController' || compName === 'Variable';
      if (isLocal) {
        const localVarName = rule.local || rule.variable || rule.var || prop;
        const targetScriptFilter = rule.script || rule.scriptId || rule.assetId;

        if (targetEnt.components && targetEnt.components.ScriptController) {
          const sc = targetEnt.components.ScriptController;
          if (Array.isArray(sc.data) && sc.data.length > 0) {
            let matchedInstance = null;
            if (targetScriptFilter) {
              const filterStr = String(targetScriptFilter).trim().toLowerCase();
              matchedInstance = sc.data.find(inst => {
                if (String(inst.assetId || '').toLowerCase() === filterStr || String(inst.id || '').toLowerCase() === filterStr) return true;
                const scriptAsset = this.game?.world?.scripts?.[inst.assetId];
                if (scriptAsset) {
                  const sId = String(scriptAsset.scriptId || scriptAsset.name || '').toLowerCase();
                  if (sId === filterStr) return true;
                }
                return false;
              });
            }
            if (!matchedInstance) {
              matchedInstance = sc.data[0];
            }

            if (matchedInstance) {
              if (!matchedInstance.variables) matchedInstance.variables = {};
              if (localVarName === 'variables' && typeof val === 'object' && val !== null) {
                Object.assign(matchedInstance.variables, val);
              } else if (localVarName) {
                matchedInstance.variables[localVarName] = val;
              }
              if (localVarName === 'active') matchedInstance.active = Boolean(val);

              // Also sync with live runner if already running on entity
              if (this.game?.scriptSystem?.runners && localVarName && localVarName !== 'variables') {
                const liveRunner = this.game.scriptSystem.runners.find(r => 
                  (r.owner === targetEnt || r.owner?.id === targetEnt.id) &&
                  (!targetScriptFilter || String(r.data?.scriptId || r.data?.id || '').toLowerCase() === String(targetScriptFilter).toLowerCase() || r.data?.id === matchedInstance.assetId)
                );
                if (liveRunner && typeof liveRunner.setLocalVariable === 'function') {
                  liveRunner.setLocalVariable(localVarName, val);
                }
              }
              boundCount++;
            }
          }
        }
        continue;
      }

      // Apply to Entity top-level fields
      if (compName === 'Entity') {
        if (prop === 'active') targetEnt.active = Boolean(val);
        else if (prop === 'visible') targetEnt.visible = Boolean(val);
        else if (prop === 'tag') targetEnt.tag = String(val);
        else if (prop === 'tags') targetEnt.tags = Array.isArray(val) ? val : [String(val)];
        else if (prop === 'zIndex') targetEnt.zIndex = Number(val);
        else if (prop === 'orderIndex') targetEnt.orderIndex = Number(val);
        else if (prop === 'opacity') targetEnt.opacity = Number(val);
        else targetEnt[prop] = val;
        boundCount++;
        continue;
      }

      // Ensure component container
      if (!targetEnt.components) targetEnt.components = {};
      if (!targetEnt.components[compName]) targetEnt.components[compName] = {};
      const comp = targetEnt.components[compName];

      // Component schema property assignment
      switch (compName) {
        case 'SpriteRenderer':
          if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'sourceX') comp.sourceX = Number(val);
          else if (prop === 'sourceY') comp.sourceY = Number(val);
          else if (prop === 'sourceWidth') comp.sourceWidth = Number(val);
          else if (prop === 'sourceHeight') comp.sourceHeight = Number(val);
          else if (prop === 'filterMode') comp.filterMode = String(val);
          else if (prop === 'useSDF') comp.useSDF = Boolean(val);
          else comp[prop] = val;
          break;

        case 'TextRenderer':
          if (prop === 'value' || prop === 'text' || prop === 'content') comp.value = val !== undefined && val !== null ? String(val) : '';
          else if (prop === 'assetId' || prop === 'fontAsset') comp.assetId = resolveAsset(String(val));
          else if (prop === 'fontSize') comp.fontSize = Number(val);
          else if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'align') comp.align = String(val);
          else if (prop === 'alignLine' || prop === 'alignV' || prop === 'verticalAlign') comp.alignLine = String(val);
          else if (prop === 'maxLine') comp.maxLine = Math.max(1, Number(val));
          else if (prop === 'autoLine') comp.autoLine = Boolean(val);
          else if (prop === 'lineSpacing') comp.lineSpacing = Number(val);
          else if (prop === 'letterSpacing') comp.letterSpacing = Number(val);
          else if (prop === 'overflow') comp.overflow = String(val);
          else if (prop === 'outlineWidth') comp.outlineWidth = Number(val);
          else if (prop === 'outlineColor') comp.outlineColor = String(val);
          else if (prop === 'shadowEnabled') comp.shadowEnabled = Boolean(val);
          else if (prop === 'shadowColor') comp.shadowColor = String(val);
          else if (prop === 'shadowOpacity') comp.shadowOpacity = Number(val);
          else if (prop === 'shadowOffsetX') comp.shadowOffsetX = Number(val);
          else if (prop === 'shadowOffsetY') comp.shadowOffsetY = Number(val);
          else if (prop === 'shadowBlur') comp.shadowBlur = Number(val);
          else comp[prop] = val;
          break;

        case 'Transform':
        case 'UITransform': {
          const comps = [targetEnt.components.UITransform, targetEnt.components.Transform].filter(Boolean);
          for (const c of comps) {
            if (prop === 'x') c.x = Number(val);
            else if (prop === 'y') c.y = Number(val);
            else if (prop === 'rotation') c.rotation = Number(val);
            else if (prop === 'scaleX') c.scaleX = Number(val);
            else if (prop === 'scaleY') c.scaleY = Number(val);
            else if (prop === 'scale') { c.scaleX = Number(val); c.scaleY = Number(val); }
            else if (prop === 'pivotX') c.pivotX = Number(val);
            else if (prop === 'pivotY') c.pivotY = Number(val);
            else if (prop === 'flipX') c.flipX = Boolean(val);
            else if (prop === 'flipY') c.flipY = Boolean(val);
            else if (prop === 'width') c.width = Number(val);
            else if (prop === 'height') c.height = Number(val);
            else if (prop === 'size') { c.width = Number(val); c.height = Number(val); }
            else if (prop === 'isRatioLocked') c.isRatioLocked = Boolean(val);
            else if (prop === 'isScaleLocked') c.isScaleLocked = Boolean(val);
            else if (prop === 'anchorX') c.anchorX = Number(val);
            else if (prop === 'anchorY') c.anchorY = Number(val);
            else c[prop] = val;
          }
          break;
        }

        case 'Audio':
          if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'audioType') comp.audioType = String(val);
          else if (prop === 'volume') comp.volume = Number(val);
          else if (prop === 'pitch') comp.pitch = Number(val);
          else if (prop === 'isMute') comp.isMute = Boolean(val);
          else if (prop === 'loop') comp.loop = Boolean(val);
          else if (prop === 'autoplay') comp.autoplay = Boolean(val);
          else if (prop === 'spatial') comp.spatial = Boolean(val);
          else if (prop === 'persist') comp.persist = Boolean(val);
          else if (prop === 'fadeIn') comp.fadeIn = Number(val);
          else if (prop === 'fadeOut') comp.fadeOut = Number(val);
          else if (prop === 'refDistance') comp.refDistance = Number(val);
          else if (prop === 'maxDistance') comp.maxDistance = Number(val);
          else comp[prop] = val;
          break;

        case 'Collider':
          if (prop === 'data' && Array.isArray(val)) comp.data = val;
          else if (prop === 'enabled') {
            comp.enabled = Boolean(val);
            if (Array.isArray(comp.data)) comp.data.forEach(s => s.enabled = Boolean(val));
          } else {
            if (Array.isArray(comp.data) && comp.data.length > 0) {
              const shapeIdx = typeof rule.shapeIndex === 'number' ? rule.shapeIndex : 0;
              if (comp.data[shapeIdx]) comp.data[shapeIdx][prop] = val;
            }
            comp[prop] = val;
          }
          break;

        case 'Physics':
          if (prop === 'enabled') comp.enabled = Boolean(val);
          else if (prop === 'motionMode') comp.motionMode = String(val);
          else if (prop === 'gravityScale') comp.gravityScale = Number(val);
          else if (prop === 'drag') comp.drag = Number(val);
          else if (prop === 'isFrozen') comp.isFrozen = Boolean(val);
          else if (prop === 'velocityX') comp.velocityX = Number(val);
          else if (prop === 'velocityY') comp.velocityY = Number(val);
          else if (prop === 'isGrounded') comp.isGrounded = Boolean(val);
          else if (prop === 'movementState') comp.movementState = String(val);
          else if (prop === 'facingDirection') comp.facingDirection = String(val);
          else if (prop === 'alignToSlope') comp.alignToSlope = Boolean(val);
          else if (prop === 'slopeAdaptSpeed') comp.slopeAdaptSpeed = Number(val);
          else if (prop === 'maxSlopeAngle') comp.maxSlopeAngle = Number(val);
          else if (prop === 'keepColliderUpright') comp.keepColliderUpright = Boolean(val);
          else if (prop === 'type') comp.type = String(val);
          else if (prop === 'mass') comp.mass = Number(val);
          else comp[prop] = val;
          break;

        case 'SpriteAnimator':
          if (prop === 'currentClip' || prop === 'clip') comp.currentClip = String(val);
          else if (prop === 'active') comp.active = Boolean(val);
          else if (prop === 'isPlaying') comp.isPlaying = Boolean(val);
          else if (prop === 'clips' && Array.isArray(val)) comp.clips = val;
          else comp[prop] = val;
          break;

        case 'ShapeRenderer':
          if (prop === 'color') comp.color = String(val);
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'isFilled') comp.isFilled = Boolean(val);
          else if (prop === 'fillOpacity') comp.fillOpacity = Number(val);
          else if (prop === 'outlineWidth') comp.outlineWidth = Number(val);
          else if (prop === 'outlineColor') comp.outlineColor = String(val);
          else if (prop === 'outlineOpacity') comp.outlineOpacity = Number(val);
          else if (prop === 'type') comp.type = String(val);
          else if (prop === 'elements' && Array.isArray(val)) comp.elements = val;
          else if (prop === 'enablePolygonCollision') comp.enablePolygonCollision = Boolean(val);
          else if (prop === 'enableSegmentCollision') comp.enableSegmentCollision = Boolean(val);
          else if (prop === 'enableCircleCollision') comp.enableCircleCollision = Boolean(val);
          else comp[prop] = val;
          break;

        case 'Tilemap':
          if (prop === 'width') comp.width = Number(val);
          else if (prop === 'height') comp.height = Number(val);
          else if (prop === 'assetId') comp.assetId = resolveAsset(String(val));
          else if (prop === 'opacity') comp.opacity = Number(val);
          else if (prop === 'isSolid') comp.isSolid = Boolean(val);
          else if (prop === 'filterMode') comp.filterMode = String(val);
          else if (prop === 'data') comp.data = typeof val === 'object' && val !== null ? val : {};
          else comp[prop] = val;
          break;

        default:
          comp[prop] = val;
          break;
      }

      boundCount++;
    }

    const finalTargetId = root.scriptId || root.id || '';
    outputs.targetEntity = finalTargetId;
    outputs.boundCount = boundCount;
    outputs.execOut = true;

    return {
      execOut: true,
      targetEntity: finalTargetId,
      boundCount
    };
  }

  createFacade(contextParams) {
    const game = this.game;
    const getCtx = (ctx) => ctx || contextParams.context;

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
      },

      getGlobalTransform: (entity, ctx) => this.getGlobalTransform(entity, getCtx(ctx)),
      isEntityInteractable: (entity, ctx) => this.isEntityInteractable(entity, getCtx(ctx)),
      isPointerOver: (entity, padX, padY, ctx) => this.isPointerOver(entity, padX, padY, getCtx(ctx)),
      resolveAudioBus: (key) => this.resolveAudioBus(key),
      updateSliderVisual: (s, volume, ctx) => this.updateSliderVisual(s, volume, getCtx(ctx)),
      processVolumeSliders: (state, config, inputs, outputs, ctx) => this.processVolumeSliders(state, config, inputs, outputs, getCtx(ctx)),
      processAtomicSlider: (state, inputs, outputs, ctx) => this.processAtomicSlider(state, inputs, outputs, getCtx(ctx)),
      processSwitchButton: (state, inputs, outputs, isImage, ctx) => this.processSwitchButton(state, inputs, outputs, isImage, getCtx(ctx)),
      processGridSpawner: (state, inputs, outputs, ctx) => this.processGridSpawner(state, inputs, outputs, getCtx(ctx)),
      processPrefabBinder: (state, inputs, outputs, ctx) => this.processPrefabBinder(state, inputs, outputs, getCtx(ctx))
    };
  }
}

__exports.UIContextHandler = UIContextHandler;
};
// === Module: Script/contract/codePanelContract.js ===
__reg.m["Script/contract/codePanelContract.js"] = function(__require, __exports, __module) {
const { CONTEXT_NAMESPACES, CONTEXT_ASSERT_METHODS, CONTEXT_CONSOLE_METHODS, CONTEXT_ROOT_METHODS, CONTEXT_ROOT_PROPERTIES } = __require("Script/contract/contextContract.js");

const CODE_PANEL_PARAM_NAMES = Object.freeze([
  'inputs',
  'outputs',
  'context',
  'node'
]);

const VALID_CONTEXT_PROPERTIES = Object.freeze(new Set([
  ...CONTEXT_NAMESPACES,
  ...CONTEXT_ROOT_METHODS,
  ...CONTEXT_ROOT_PROPERTIES
]));

// Strips single-line and multi-line comments while preserving string literals
function stripComments(code) {
  if (typeof code !== 'string') return '';
  return code.replace(
    /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/.*/g,
    (match, quoted) => (quoted ? quoted : '')
  );
}

const stripStringsAndComments = stripComments;

// Extracts input port identifier names read in code
function extractUsedInputs(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\binputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...clean.matchAll(/\binputs\.([A-Za-z0-9_$]+)/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

// Extracts output port identifier names assigned or referenced in code
function extractUsedOutputs(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\boutputs\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1]),
    ...[...clean.matchAll(/\boutputs\.([A-Za-z0-9_$]+)\s*[+\-*/%&|^]?=/g)].map(m => m[1]),
    ...[...clean.matchAll(/\bcontext\.triggerFlow\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

// Extracts local variable keys referenced in code
function extractUsedLocalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const localGetMatches = [...clean.matchAll(/\bcontext\.getLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const localSetMatches = [...clean.matchAll(/\bcontext\.setLocal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...localGetMatches, ...localSetMatches])];
}

// Extracts global variable keys referenced in code
function extractUsedGlobalVariables(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const globalGetMatches = [...clean.matchAll(/\bcontext\.getGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const globalSetMatches = [...clean.matchAll(/\bcontext\.setGlobal\(\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  return [...new Set([...globalGetMatches, ...globalSetMatches])];
}

// Extracts all property accesses on context
function extractContextAccesses(code) {
  if (!code || typeof code !== 'string') return [];
  const clean = stripComments(code);
  const matches = [
    ...[...clean.matchAll(/\bcontext\.([A-Za-z0-9_$]+)/g)].map(m => m[1]),
    ...[...clean.matchAll(/\bcontext\[\s*['"]([^'"]+)['"]\s*\]/g)].map(m => m[1])
  ];
  return [...new Set(matches)];
}

// Validates a node's code against input/output ports, variables, and context API
function validateCodePanelContract(code, options = {}) {
  const targetNode = options.node || null;
  const localVariables = Array.isArray(options.localVariables) ? options.localVariables : [];
  const globalVariables = Array.isArray(options.globalVariables) ? options.globalVariables : [];

  if (!targetNode) {
    return {
      isValid: true,
      hasSyntaxError: false,
      syntaxError: null,
      issues: [],
      usedInputsCount: 0,
      usedOutputsCount: 0,
      usedVarsCount: 0,
      metadata: {
        usedInputKeys: [],
        usedOutputKeys: [],
        usedLocalVars: [],
        usedGlobalVars: [],
        unrecognizedContextProps: []
      }
    };
  }

  const codeStr = String(code || '');
  const issues = [];
  let hasSyntaxError = false;
  let syntaxError = null;

  // Basic syntax verification
  if (codeStr.trim().length > 0) {
    try {
      new Function('inputs', 'outputs', 'context', 'node', codeStr);
    } catch (err) {
      hasSyntaxError = true;
      syntaxError = err.message;
      issues.push(`Syntax error: ${err.message}`);
    }
  }

  // Ports validation
  const usedInputKeys = extractUsedInputs(codeStr);
  const usedOutputKeys = extractUsedOutputs(codeStr);

  const dynamicMode = targetNode.dynamicMode || targetNode.data?.dynamicMode || 'none';
  const propertyOptions = targetNode.data?.propertyOptions || targetNode.propertyOptions || [];
  const propertyOptionKeys = propertyOptions.map(p => p.value).filter(Boolean);

  const dynamicInputKeys = (dynamicMode === 'inputProperty' || (propertyOptions.length > 0 && dynamicMode !== 'outputProperty')) ? propertyOptionKeys : [];
  const dynamicOutputKeys = (dynamicMode === 'outputProperty' || (propertyOptions.length > 0 && dynamicMode !== 'inputProperty')) ? propertyOptionKeys : [];

  const allValidInputIdentifiers = [
    ...(targetNode.inputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []),
    ...dynamicInputKeys
  ];
  const allValidOutputIdentifiers = [
    ...(targetNode.outputs?.flatMap(p => [p.label, p.id]).filter(Boolean) || []),
    ...dynamicOutputKeys
  ];

  usedInputKeys.forEach(inputKey => {
    const isDynamicAllowed = 
      (dynamicMode === 'switch' && /^case\d+$/.test(inputKey)) ||
      (dynamicMode === 'keyboard' && /^key\d+$/.test(inputKey)) ||
      (dynamicMode === 'sequential' && /^v\d+$/.test(inputKey));

    if (!allValidInputIdentifiers.includes(inputKey) && !isDynamicAllowed) {
      issues.push(`Input '${inputKey}' is used in code, but is not defined in Node Input Ports.`);
    }
  });

  usedOutputKeys.forEach(outputKey => {
    const isDynamicAllowed = 
      (dynamicMode === 'switch' && /^onCase\d+$/.test(outputKey)) ||
      (dynamicMode === 'keyboard' && /^onKey\d+$/.test(outputKey)) ||
      (dynamicMode === 'sequential' && /^v\d+$/.test(outputKey));

    if (!allValidOutputIdentifiers.includes(outputKey) && !isDynamicAllowed) {
      issues.push(`Output '${outputKey}' is set in code, but is not defined in Node Output Ports.`);
    }
  });

  const dataInputPorts = (targetNode.inputs || []).filter(p => {
    const dType = String(p.dataType || '').toLowerCase();
    return dType !== 'execution';
  });

  const definedOutputPorts = targetNode.outputs || [];

  let matchedInputsCount = 0;
  dataInputPorts.forEach(port => {
    const isUsed = (port.label && usedInputKeys.includes(port.label)) || (port.id && usedInputKeys.includes(port.id));
    if (isUsed) {
      matchedInputsCount++;
    } else {
      issues.push(`Input Port '${port.label || port.id}' is defined on node, but never read in code.`);
    }
  });

  let matchedOutputsCount = 0;
  definedOutputPorts.forEach(port => {
    const isUsed = (port.label && usedOutputKeys.includes(port.label)) || (port.id && usedOutputKeys.includes(port.id));
    if (isUsed) {
      matchedOutputsCount++;
    } else {
      issues.push(`Output Port '${port.label || port.id}' is defined on node, but never set in code.`);
    }
  });

  // Variables validation
  const usedLocalVars = extractUsedLocalVariables(codeStr);
  const usedGlobalVars = extractUsedGlobalVariables(codeStr);

  const definedLocalVars = localVariables.flatMap(v => [v.name, v.id]).filter(Boolean);
  const definedGlobalVars = globalVariables.flatMap(v => [v.name, v.id]).filter(Boolean);

  usedLocalVars.forEach(varKey => {
    if (!definedLocalVars.includes(varKey)) {
      issues.push(`Local Variable '${varKey}' is referenced in code, but not defined in Script Variables.`);
    }
  });

  usedGlobalVars.forEach(varKey => {
    if (!definedGlobalVars.includes(varKey)) {
      issues.push(`Global Variable '${varKey}' is referenced in code, but not defined in Project Global Variables.`);
    }
  });

  // Context API conformance check
  const contextAccesses = extractContextAccesses(codeStr);
  const unrecognizedContextProps = [];
  contextAccesses.forEach(prop => {
    if (!VALID_CONTEXT_PROPERTIES.has(prop)) {
      unrecognizedContextProps.push(prop);
      issues.push(`Context property 'context.${prop}' is not defined in ContextSystem contract.`);
    }
  });

  return {
    isValid: issues.length === 0,
    hasSyntaxError,
    syntaxError,
    issues,
    usedInputsCount: matchedInputsCount,
    usedOutputsCount: matchedOutputsCount,
    usedVarsCount: usedLocalVars.length + usedGlobalVars.length,
    metadata: {
      usedInputKeys,
      usedOutputKeys,
      usedLocalVars,
      usedGlobalVars,
      unrecognizedContextProps
    }
  };
}

// Generates initial boilerplate code for a node based on its defined ports
function generateDefaultNodeCode(node) {
  if (!node) return '// Write your node logic here...\n';

  const inputs = (node.inputs || []).filter(p => p.dataType !== 'execution');
  const outputs = (node.outputs || []).filter(p => p.dataType !== 'execution');
  const hasExecOut = (node.outputs || []).some(p => p.dataType === 'execution');

  const lines = [];

  if (inputs.length > 0) {
    lines.push('// 1. Read input values');
    inputs.forEach(port => {
      const portKey = port.label || port.id;
      const varName = port.id || 'val';
      lines.push(`const ${varName} = inputs['${portKey}'];`);
    });
    lines.push('');
  }

  lines.push('// 2. Execute node computation');

  if (outputs.length > 0) {
    lines.push('// 3. Set output values');
    outputs.forEach(port => {
      const portKey = port.label || port.id;
      lines.push(`outputs['${portKey}'] = null;`);
    });
  }

  if (hasExecOut) {
    lines.push('');
    lines.push('// 4. Trigger execution flow');
    lines.push('outputs.execOut = true;');
  }

  return lines.join('\n') + '\n';
}

__exports.stripComments = stripComments;
__exports.extractUsedInputs = extractUsedInputs;
__exports.extractUsedOutputs = extractUsedOutputs;
__exports.extractUsedLocalVariables = extractUsedLocalVariables;
__exports.extractUsedGlobalVariables = extractUsedGlobalVariables;
__exports.extractContextAccesses = extractContextAccesses;
__exports.validateCodePanelContract = validateCodePanelContract;
__exports.generateDefaultNodeCode = generateDefaultNodeCode;
__exports.CODE_PANEL_PARAM_NAMES = CODE_PANEL_PARAM_NAMES;
__exports.VALID_CONTEXT_PROPERTIES = VALID_CONTEXT_PROPERTIES;
__exports.stripStringsAndComments = stripStringsAndComments;
};
// === Module: Script/contract/contextContract.js ===
__reg.m["Script/contract/contextContract.js"] = function(__require, __exports, __module) {
// Top-level domain namespaces accessible on context
const CONTEXT_NAMESPACES = Object.freeze([
  'entity',
  'layer',
  'prefab',
  'collider',
  'input',
  'ui',
  'signal',
  'lifecycle',
  'transition',
  'camera',
  'scene',
  'state',
  'console',
  'assert',
  'audio',
  'toolkit',
  'asset',
  'global',
  'local'
]);

// Validation methods exposed by context.assert
const CONTEXT_ASSERT_METHODS = Object.freeze([
  'isTrue',
  'isFalse',
  'exists',
  'hasComponent',
  'isNumber',
  'isString',
  'isBoolean',
  'isObject',
  'isArray',
  'inRange',
  'fail'
]);

// Diagnostic logging methods exposed by context.console
const CONTEXT_CONSOLE_METHODS = Object.freeze([
  'log',
  'warn',
  'error'
]);

// Execution flow control and variable access methods on root context
const CONTEXT_ROOT_METHODS = Object.freeze([
  'onTick',
  'triggerFlow',
  'onGameStart',
  'onSceneStart',
  'onGamePause',
  'onGameResume',
  'onGameRestart',
  'onGameQuit',
  'onQuit',
  'isPaused',
  'notify',
  'getLocal',
  'setLocal',
  'getGlobal',
  'setGlobal',
  'getVariable',
  'hasVariable'
]);

// Built-in properties provided directly on the root context object
const CONTEXT_ROOT_PROPERTIES = Object.freeze([
  'owner',
  'node',
  'dt',
  'deltaTime',
  'state'
]);

__exports.CONTEXT_NAMESPACES = CONTEXT_NAMESPACES;
__exports.CONTEXT_ASSERT_METHODS = CONTEXT_ASSERT_METHODS;
__exports.CONTEXT_CONSOLE_METHODS = CONTEXT_CONSOLE_METHODS;
__exports.CONTEXT_ROOT_METHODS = CONTEXT_ROOT_METHODS;
__exports.CONTEXT_ROOT_PROPERTIES = CONTEXT_ROOT_PROPERTIES;
};
// === Module: Script/contract/index.js ===
__reg.m["Script/contract/index.js"] = function(__require, __exports, __module) {
Object.assign(__exports, __require("Script/contract/contextContract.js"));
Object.assign(__exports, __require("Script/contract/payloadShape.js"));
Object.assign(__exports, __require("Script/contract/codePanelContract.js"));

};
// === Module: Script/contract/payloadShape.js ===
__reg.m["Script/contract/payloadShape.js"] = function(__require, __exports, __module) {
// Validates baseline structural integrity of a serialized visual script payload
function checkPayloadBasic(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('[PayloadContract] Payload must be an object.');
  }
  if (!payload.id) {
    throw new Error('[PayloadContract] Payload must specify an id.');
  }
  if (!Array.isArray(payload.nodes)) {
    throw new Error('[PayloadContract] Payload.nodes must be an array.');
  }
}

__exports.checkPayloadBasic = checkPayloadBasic;
};
// === Module: Toolkit/ToolkitContextHandler.js ===
__reg.m["Toolkit/ToolkitContextHandler.js"] = function(__require, __exports, __module) {
const { processDialogueRunner, processChoicePresenter } = __require("Toolkit/Dialogue/DialogueRunnerHelper.js");
const { processPlatformerController, processPlatformerAnimator } = __require("Toolkit/Platformer/PlatformerHelper.js");
const { processTopDownController, processTopDownAnimator } = __require("Toolkit/TopDown/TopDownHelper.js");
const { processPlatformerCombat, processEnemyCombat } = __require("Toolkit/Combat/CombatHelper.js");
const { processEnemyChaser } = __require("Toolkit/AI/AIHelper.js");
const { processCollectable, applyBobbing, checkOverlap, playAnimationAndDestroy, deactivateAndScheduleRespawn } = __require("Toolkit/Collectable/CollectableHelper.js");

// Subsystem handler providing high-level gameplay kits and controller facades for script nodes
class ToolkitContextHandler {
  constructor(contextSystem) {
    this.contextSystem = contextSystem;
    this.game = contextSystem.game;
  }

  createFacade(contextParams) {
    const getCtx = (ctx) => ctx || contextParams?.context;

    return {
      dialogue: {
        runDialogue: (state, inputs, outputs, ctx) => processDialogueRunner(state, inputs, outputs, getCtx(ctx)),
        presentChoices: (state, inputs, outputs, ctx) => processChoicePresenter(state, inputs, outputs, getCtx(ctx))
      },

      platformer: {
        processController: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processPlatformerController(args[0], getCtx(args[1]));
          }
          return processPlatformerController(args[0], args[1], args[2], getCtx(args[3]));
        },

        processAnimator: (state, inputs, outputs, ctx) => processPlatformerAnimator(state, inputs, outputs, getCtx(ctx), contextParams?.node)
      },

      topdown: {
        processController: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processTopDownController(args[0], getCtx(args[1]));
          }
          return processTopDownController(args[0], args[1], args[2], getCtx(args[3]));
        },

        processAnimator: (state, inputs, outputs, ctx) => processTopDownAnimator(state, inputs, outputs, getCtx(ctx), contextParams?.node)
      },

      combat: {
        processPlatformerCombat: (state, inputs, outputs, ctx) => processPlatformerCombat(state, inputs, outputs, getCtx(ctx), contextParams?.node),

        processEnemyCombat: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processEnemyCombat(args[0], getCtx(args[1]));
          }
          return processEnemyCombat(args[0], args[1], args[2], getCtx(args[3]), contextParams?.node);
        }
      },

      ai: {
        processChaser: (...args) => {
          if (args.length <= 2 || (args[2] === undefined && args[3] === undefined)) {
            return processEnemyChaser(args[0], getCtx(args[1]));
          }
          return processEnemyChaser(args[0], args[1], args[2], getCtx(args[3]));
        }
      },

      collectable: {
        processCollectable: (state, inputs, outputs, ctx) => processCollectable(state, inputs, outputs, getCtx(ctx), contextParams?.node),
        applyBobbing: (target, dt, speed, amp) => applyBobbing(target, dt, speed, amp),
        checkOverlap: (target, tag, dist, ctx) => checkOverlap(target, tag, dist, getCtx(ctx)),
        playAnimationAndDestroy: (target, clip, ctx) => playAnimationAndDestroy(target, clip, getCtx(ctx), contextParams?.node),
        deactivateAndScheduleRespawn: (target, clip, respawnTime, ctx) => deactivateAndScheduleRespawn(target, clip, respawnTime, getCtx(ctx), contextParams?.node)
      }
    };
  }
}

__exports.ToolkitContextHandler = ToolkitContextHandler;
};
// === Module: Toolkit/AI/AIHelper.js ===
__reg.m["Toolkit/AI/AIHelper.js"] = function(__require, __exports, __module) {
function processEnemyChaser(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? (stateOrParams || {}) : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._ai) {
    target._ai = {
      spawnX: transform ? transform.x : 0,
      patrolDir: 1,
      isChasing: false,
      inAttackRange: false,
      facing: 'right',
      targetId: null
    };
  }
  const ai = target._ai;

  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  if (isKnockedBack) {
    target._knockback.duration -= dt;
    if (phys) phys.movementState = 'hit';
    outputs.execOut = true;
    outputs.isChasing = Boolean(ai.isChasing);
    outputs.inAttackRange = Boolean(ai.inAttackRange);
    outputs.movementState = 'hit';
    outputs.distanceToTarget = -1;
    outputs.facingDirection = ai.facing || 'right';
    outputs.targetPlayer = ai.targetId || '';
    outputs.onTargetAcquired = false;
    outputs.onTargetLost = false;
    outputs.onInAttackRange = false;
    const result = {
      execOut: true,
      onTargetAcquired: false,
      onTargetLost: false,
      onInAttackRange: false,
      isChasing: Boolean(ai.isChasing),
      inAttackRange: Boolean(ai.inAttackRange),
      movementState: 'hit',
      distanceToTarget: -1,
      facingDirection: ai.facing || 'right',
      targetPlayer: ai.targetId || ''
    };
    Object.assign(outputs, result);
    return result;
  }

  const isCombatAttacking = Boolean(target._combat && target._combat.isAttacking);
  if (isCombatAttacking) {
    if (phys) {
      phys.velocityX = 0;
      phys.movementState = 'attack';
    }
    outputs.execOut = true;
    outputs.isChasing = Boolean(ai.isChasing);
    outputs.inAttackRange = true;
    outputs.movementState = 'attack';
    outputs.facingDirection = ai.facing || 'right';
    outputs.targetPlayer = ai.targetId || '';
    outputs.onTargetAcquired = false;
    outputs.onTargetLost = false;
    outputs.onInAttackRange = false;
    const result = {
      execOut: true,
      onTargetAcquired: false,
      onTargetLost: false,
      onInAttackRange: false,
      isChasing: Boolean(ai.isChasing),
      inAttackRange: true,
      movementState: 'attack',
      distanceToTarget: 0,
      facingDirection: ai.facing || 'right',
      targetPlayer: ai.targetId || ''
    };
    Object.assign(outputs, result);
    return result;
  }

  const playerTag = String(inputs.playerTag || 'player').trim();
  const detectRadius = typeof inputs.detectRadius === 'number' ? inputs.detectRadius : 250;
  const loseRadius = typeof inputs.loseRadius === 'number' ? inputs.loseRadius : 350;
  const stopRadius = typeof inputs.stopRadius === 'number' ? inputs.stopRadius : 45;
  const chaseSpeed = typeof inputs.chaseSpeed === 'number' ? inputs.chaseSpeed : 160;
  const patrolSpeed = typeof inputs.patrolSpeed === 'number' ? inputs.patrolSpeed : 70;
  const patrolDistance = typeof inputs.patrolDistance === 'number' ? inputs.patrolDistance : 100;
  const autoFlipX = inputs.autoFlipX !== false && inputs.autoFlipX !== 'false';

  let closestPlayer = null;
  let minDistance = Infinity;
  let playerDeltaX = 0;

  let players = [];
  if (context.entity && typeof context.entity.getAllByTag === 'function') {
    players = context.entity.getAllByTag(playerTag) || [];
    if (players.length === 0 && playerTag.toLowerCase() !== playerTag) {
      players = context.entity.getAllByTag(playerTag.toLowerCase()) || [];
    }
  }
  if (players.length === 0 && context.entity && typeof context.entity.get === 'function') {
    const byName = context.entity.get(playerTag) || context.entity.get(playerTag.toLowerCase());
    if (byName) players = [byName];
  }

  const selfX = transform ? transform.x : 0;
  const selfY = transform ? transform.y : 0;

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    if (!p || p.active === false || p.id === target.id) continue;
    const pT = p.components && (p.components.Transform || p.components.UITransform);
    if (!pT) continue;
    const dx = pT.x - selfX;
    const dy = pT.y - selfY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) {
      minDistance = dist;
      closestPlayer = p;
      playerDeltaX = dx;
    }
  }

  let wasChasing = ai.isChasing;
  let isChasing = false;
  let inAttackRange = false;
  let moveVelX = 0;
  let movementState = 'idle';

  if (closestPlayer) {
    ai.targetId = closestPlayer.id || closestPlayer.scriptId;
    const currentThreshold = wasChasing ? loseRadius : detectRadius;
    if (minDistance <= currentThreshold) {
      isChasing = true;
      if (minDistance <= stopRadius) {
        inAttackRange = true;
        moveVelX = 0;
        movementState = 'idle';
        ai.facing = playerDeltaX < 0 ? 'left' : 'right';
        outputs.onInAttackRange = true;
      } else {
        const dirX = playerDeltaX < 0 ? -1 : 1;
        ai.facing = dirX < 0 ? 'left' : 'right';
        moveVelX = dirX * chaseSpeed;
        movementState = 'run';
      }
    }
  }

  if (!isChasing) {
    ai.targetId = null;
    const leftLimit = ai.spawnX - patrolDistance;
    const rightLimit = ai.spawnX + patrolDistance;

    if (selfX <= leftLimit) {
      ai.patrolDir = 1;
    } else if (selfX >= rightLimit) {
      ai.patrolDir = -1;
    }

    ai.facing = ai.patrolDir < 0 ? 'left' : 'right';
    moveVelX = ai.patrolDir * patrolSpeed;
    movementState = 'walk';
  }

  if (!wasChasing && isChasing) {
    outputs.onTargetAcquired = true;
  } else if (wasChasing && !isChasing) {
    outputs.onTargetLost = true;
  }
  ai.isChasing = isChasing;
  ai.inAttackRange = inAttackRange;

  if (phys) {
    phys.velocityX = moveVelX;
    phys.facingDirection = ai.facing;
    phys.movementState = movementState;
    phys._isIntentionalMove = Math.abs(moveVelX) > 5;
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    context.collider.moveAndSlide(target, moveVelX * dt, 0);
  }

  if (transform && autoFlipX) {
    transform.flipX = (ai.facing === 'left');
  }

  outputs.execOut = true;
  outputs.isChasing = isChasing;
  outputs.inAttackRange = inAttackRange;
  outputs.movementState = movementState;
  outputs.distanceToTarget = closestPlayer ? Number(minDistance.toFixed(2)) : -1;
  outputs.facingDirection = ai.facing;
  outputs.targetPlayer = ai.targetId || '';
  const result = {
    execOut: true,
    onTargetAcquired: Boolean(outputs.onTargetAcquired),
    onTargetLost: Boolean(outputs.onTargetLost),
    onInAttackRange: Boolean(outputs.onInAttackRange),
    isChasing,
    inAttackRange,
    movementState,
    distanceToTarget: outputs.distanceToTarget,
    facingDirection: outputs.facingDirection,
    targetPlayer: outputs.targetPlayer
  };
  Object.assign(outputs, result);
  return result;
}

__exports.processEnemyChaser = processEnemyChaser;
};
// === Module: Toolkit/Collectable/CollectableHelper.js ===
__reg.m["Toolkit/Collectable/CollectableHelper.js"] = function(__require, __exports, __module) {
// Toolkit helper for collectables, pickups, and interactive items

function extractTargetClipName(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts[0] : '';
}

function findClip(rawClips, targetClipName) {
  if (!rawClips || !targetClipName) return null;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
  if (!clips.length) return null;

  const targetStr = extractTargetClipName(targetClipName);
  if (!targetStr) return null;
  const targetLower = targetStr.toLowerCase();

  // 1. Exact match (prefer non-category clip)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c || c.type === 'category') continue;
    if (c.scriptId === targetStr || c.id === targetStr || c.name === targetStr) {
      return c;
    }
  }

  // 2. Case-insensitive match (prefer non-category clip)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c || c.type === 'category') continue;
    if (
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) {
      return c;
    }
  }

  // 3. Fallback without category filter (for older or custom clip schemas)
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    if (!c) continue;
    if (c.scriptId === targetStr || c.id === targetStr || c.name === targetStr) {
      return c;
    }
    if (
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) {
      return c;
    }
  }

  return null;
}

function playClipSafe(animator, clipName, forceRestart = false) {
  if (!animator || !clipName) return 0.35;
  const rawClips = animator.clips;
  const targetClipName = extractTargetClipName(clipName);
  if (!targetClipName) return 0.35;

  const matchedClip = findClip(rawClips, targetClipName);
  const resolvedId = matchedClip ? matchedClip.id : targetClipName;

  if (resolvedId && (animator.currentClip !== resolvedId || forceRestart)) {
    animator.currentClip = resolvedId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (matchedClip) matchedClip.frameIndex = 0;
  } else if (animator.currentClip && !animator.isPlaying) {
    animator.isPlaying = true;
  }

  if (matchedClip && Array.isArray(matchedClip.frames) && matchedClip.fps) {
    const frameCount = matchedClip.frames.length;
    const fps = matchedClip.fps > 0 ? matchedClip.fps : 12;
    return frameCount / fps;
  }
  return 0.35;
}

// Applies smooth sinusoidal bobbing effect to entity Y transform
function applyBobbing(target, dt = 0.016, speed = 3.5, amplitude = 4) {
  if (!target || target.active === false || target._isDestroyed) return;
  const transform = target.components && (target.components.Transform || target.components.UITransform);
  if (!transform) return;

  if (!target._collectable) {
    target._collectable = {
      initialY: transform.y,
      bobTimer: Math.random() * Math.PI * 2,
      isCollected: false,
      state: 'idle',
      animTimer: 0,
      respawnTimer: 0,
      lastClip: ''
    };
  }

  const cState = target._collectable;
  cState.bobTimer += dt * speed;
  transform.y = cState.initialY + Math.sin(cState.bobTimer) * amplitude;
  target.isDirty = true;
}

// Checks overlap between target and active collectors matching collectorTag
function checkOverlap(target, collectorTag = 'player', pickupDistance = 32, context = null) {
  if (!target || target.active === false || target._isDestroyed) return null;

  // 1. Try native collider check if available
  if (context?.collider && typeof context.collider.checkOverlap === 'function' && target.components?.Collider) {
    const hit = context.collider.checkOverlap(target, collectorTag);
    if (hit) return hit;
  }

  // 2. Fallback: Transform distance check
  const tTrans = target.components && (target.components.Transform || target.components.UITransform);
  if (!tTrans) return null;

  const targetX = tTrans.x;
  const targetY = tTrans.y;

  let candidates = [];
  if (context?.entity && typeof context.entity.getAllByTag === 'function') {
    candidates = context.entity.getAllByTag(collectorTag) || [];
  }

  for (let i = 0; i < candidates.length; i++) {
    const other = candidates[i];
    if (!other || other.active === false || other.id === target.id) continue;
    const oTrans = other.components && (other.components.Transform || other.components.UITransform);
    if (!oTrans) continue;

    const dx = Math.abs(oTrans.x - targetX);
    const dy = Math.abs(oTrans.y - targetY);
    if (dx <= pickupDistance && dy <= pickupDistance) {
      return other;
    }
  }

  return null;
}

// Plays collect animation and cleans up entity via context.entity.destroy
function playAnimationAndDestroy(target, collectClip, context, node = null) {
  if (!target || target._isDestroyed) return;

  // Disable collider immediately to prevent duplicate pickup
  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false, lastClip: '' };
  }

  const clipInput = String(
    collectClip !== undefined ? collectClip :
    (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || ''
  ).trim();

  const targetClipName = extractTargetClipName(clipInput);
  const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;

  // Only defer destruction if a matching collection animation clip actually exists
  if (animator && matchedClip) {
    const duration = playClipSafe(animator, targetClipName, true);
    target._collectable.state = 'animating_destroy';
    target._collectable.animTimer = duration;
    target._collectable.lastClip = animator.currentClip || '';
  } else {
    // If no clip exists, destroy immediately
    target._collectable.state = 'destroyed';
    if (context?.entity && typeof context.entity.destroy === 'function') {
      context.entity.destroy(target);
    }
  }
}

// Deactivates entity after playing collection animation, with optional respawn scheduling
function deactivateAndScheduleRespawn(target, collectClip, respawnTime = 0, context = null, node = null) {
  if (!target || target._isDestroyed) return;

  if (target.components?.Collider) {
    target.components.Collider.active = false;
  }

  const animator = target.components && target.components.SpriteAnimator;
  if (!target._collectable) {
    target._collectable = { state: 'idle', animTimer: 0, respawnTimer: 0, isCollected: false, lastClip: '' };
  }

  target._collectable.respawnTimer = Number(respawnTime) || 0;

  const clipInput = String(
    collectClip !== undefined ? collectClip :
    (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || ''
  ).trim();

  const targetClipName = extractTargetClipName(clipInput);
  const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;

  // Only animate if a matching collection animation clip actually exists
  if (animator && matchedClip) {
    const duration = playClipSafe(animator, targetClipName, true);
    target._collectable.state = 'animating_deactivate';
    target._collectable.animTimer = duration;
    target._collectable.lastClip = animator.currentClip || '';
  } else {
    target.active = false;
    target.visible = false;
    target._collectable.state = 'despawned';
  }
}

// Main process pipeline for Collectable Item node
function processCollectable(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : (nodeMaybe || context?.node);

  const targetId = inputs.targetEntity || (node && node.data && node.data.values && node.data.values.targetEntity) || 'self';
  const target = context.entity ? context.entity.get(targetId) : null;
  const itemEntity = target ? (target.scriptId || target.id || '') : (targetId !== 'self' ? targetId : '');

  outputs.itemEntity = outputs.itemEntity || itemEntity;
  outputs.collectorEntity = outputs.collectorEntity || '';

  // Guard against missing or already destroyed entities (never return undefined!)
  if (!target || target._isDestroyed) {
    const fallbackVal = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
    outputs.execOut = true;
    outputs.isCollected = true;
    outputs.collectorEntity = outputs.collectorEntity || '';
    outputs.itemEntity = outputs.itemEntity || itemEntity;
    outputs.value = fallbackVal;
    outputs.currentClip = '';
    outputs.onCollected = false;
    outputs.onAnimationEnd = false;
    outputs.onRespawn = false;
    outputs.onClipChanged = false;
    const fallbackResult = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: fallbackVal,
      currentClip: '',
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, fallbackResult);
    return fallbackResult;
  }

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  const transform = target.components && (target.components.Transform || target.components.UITransform);
  const animator = target.components && target.components.SpriteAnimator;

  if (!target._collectable) {
    target._collectable = {
      initialY: transform ? transform.y : 0,
      bobTimer: Math.random() * Math.PI * 2,
      isCollected: false,
      state: 'idle',
      animTimer: 0,
      respawnTimer: 0,
      lastClip: ''
    };
  }

  const cState = target._collectable;

  const idleInput = String(
    inputs.idleClip !== undefined ? inputs.idleClip :
    (inputs.idleClips !== undefined ? inputs.idleClips :
    (node && node.data && node.data.values && (node.data.values.idleClip ?? node.data.values.idleClips)) || '')
  ).trim();

  const idleTargetName = extractTargetClipName(idleInput);

  let clipChanged = false;

  outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
  outputs.isCollected = Boolean(cState.isCollected);

  // --- Phase A: Handling Animating Destroy ---
  if (cState.state === 'animating_destroy') {
    cState.animTimer -= dt;
    const isAnimFinished = cState.animTimer <= 0 || (animator && !animator.isPlaying);
    if (isAnimFinished) {
      cState.state = 'destroyed';
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      if (context.entity && typeof context.entity.destroy === 'function') {
        context.entity.destroy(target);
      }
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: Boolean(outputs.onAnimationEnd),
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase B: Handling Animating Deactivate ---
  if (cState.state === 'animating_deactivate') {
    cState.animTimer -= dt;
    const isAnimFinished = cState.animTimer <= 0 || (animator && !animator.isPlaying);
    if (isAnimFinished) {
      outputs.onAnimationEnd = true;
      if (typeof context.triggerFlow === 'function') context.triggerFlow('onAnimationEnd');
      target.active = false;
      target.visible = false;
      cState.state = 'despawned';
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: true,
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: Boolean(outputs.onAnimationEnd),
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase C: Handling Despawned & Respawn Timer ---
  if (cState.state === 'despawned') {
    if (cState.respawnTimer > 0) {
      cState.respawnTimer -= dt;
      if (cState.respawnTimer <= 0) {
        cState.state = 'idle';
        cState.isCollected = false;
        target.active = true;
        target.visible = true;

        if (transform) {
          transform.y = cState.initialY;
          target.isDirty = true;
        }

        if (target.components?.Collider) {
          target.components.Collider.active = true;
        }

        // Restore idle animation clip immediately on respawn if configured
        if (animator && idleTargetName) {
          const rawClips = animator.clips;
          const matchedClip = findClip(rawClips, idleTargetName);
          const resolvedClipId = matchedClip ? matchedClip.id : idleTargetName;

          if (resolvedClipId) {
            animator.currentClip = resolvedClipId;
            animator._activeClipId = '';
            animator._elapsedTime = 0;
            animator.isPlaying = true;
            if (matchedClip) matchedClip.frameIndex = 0;
            clipChanged = true;
            cState.lastClip = resolvedClipId;
          }
        }

        outputs.isCollected = false;
        outputs.onRespawn = true;
        if (typeof context.triggerFlow === 'function') context.triggerFlow('onRespawn');
      }
    }
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: Boolean(cState.isCollected),
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: Boolean(outputs.onRespawn),
      onClipChanged: Boolean(clipChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  // If entity is inactive, stop processing idle mechanics
  if (target.active === false) {
    outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
    outputs.execOut = true;
    const result = {
      execOut: true,
      isCollected: Boolean(cState.isCollected),
      collectorEntity: outputs.collectorEntity || '',
      itemEntity: outputs.itemEntity || itemEntity,
      value: outputs.value,
      currentClip: outputs.currentClip,
      onCollected: false,
      onAnimationEnd: false,
      onRespawn: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  // --- Phase D: Idle Bobbing ---
  const autoBobbingVal = inputs.autoBobbing !== undefined 
    ? inputs.autoBobbing 
    : (node && node.data && node.data.values && node.data.values.autoBobbing !== undefined ? node.data.values.autoBobbing : true);

  if (cState.state === 'idle' && autoBobbingVal !== false && autoBobbingVal !== 'false') {
    applyBobbing(target, dt);
  }

  // --- Phase E: Idle Animation Synchronization (PlatformerHelper style) ---
  if (cState.state === 'idle' && animator && idleTargetName) {
    const rawClips = animator.clips;
    const matchedClip = findClip(rawClips, idleTargetName);
    const resolvedClipId = matchedClip ? matchedClip.id : idleTargetName;

    if (resolvedClipId && animator.currentClip !== resolvedClipId) {
      animator.currentClip = resolvedClipId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (matchedClip) matchedClip.frameIndex = 0;
      clipChanged = true;
    } else if (animator.currentClip && !animator.isPlaying) {
      animator.isPlaying = true;
    }
    cState.lastClip = animator.currentClip || resolvedClipId;
  }

  // --- Phase F: Collision & Interaction Detection ---
  const collectorTag = String(inputs.collectorTag || (node && node.data && node.data.values && node.data.values.collectorTag) || 'player').trim();
  const collector = checkOverlap(target, collectorTag, 32, context);

  const canCollectVal = inputs.canCollect !== undefined 
    ? inputs.canCollect 
    : (node && node.data && node.data.values && node.data.values.canCollect !== undefined ? node.data.values.canCollect : true);

  if (collector && canCollectVal !== false && canCollectVal !== 'false') {
    // Mode check: keyboard interact key
    const pickupMode = inputs.pickupMode || (node && node.data && node.data.values && node.data.values.pickupMode) || 'collision';
    if (pickupMode === 'interact_key') {
      const key = String(inputs.interactKey || (node && node.data && node.data.values && node.data.values.interactKey) || 'e').toLowerCase();
      const keyboard = context.input && context.input.keyboard;
      const isPressed = keyboard && (
        (typeof keyboard.isJustPressed === 'function' && keyboard.isJustPressed(key)) ||
        (typeof keyboard.isDown === 'function' && keyboard.isDown(key))
      );
      if (!isPressed) {
        outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
        outputs.execOut = true;
        const result = {
          execOut: true,
          isCollected: Boolean(cState.isCollected),
          collectorEntity: outputs.collectorEntity || '',
          itemEntity: outputs.itemEntity || itemEntity,
          value: outputs.value,
          currentClip: outputs.currentClip,
          onCollected: false,
          onAnimationEnd: false,
          onRespawn: false,
          onClipChanged: Boolean(clipChanged)
        };
        Object.assign(outputs, result);
        return result;
      }
    }

    // Trigger collection
    cState.isCollected = true;
    outputs.isCollected = true;
    outputs.collectorEntity = collector.scriptId || collector.id || '';
    outputs.itemEntity = itemEntity;
    outputs.value = typeof inputs.scoreValue === 'number' ? inputs.scoreValue : (node && node.data && node.data.values && typeof node.data.values.scoreValue === 'number' ? node.data.values.scoreValue : 1);
    outputs.onCollected = true;

    // Disable collider immediately to prevent multi-hit
    if (target.components?.Collider) {
      target.components.Collider.active = false;
    }

    // Play Audio SFX
    const sfx = inputs.sfxName || (node && node.data && node.data.values && node.data.values.sfxName);
    if (sfx && context.audio && typeof context.audio.play === 'function') {
      context.audio.play(sfx);
    }

    // Trigger execution output pin
    if (typeof context.triggerFlow === 'function') {
      context.triggerFlow('onCollected');
    }

    // Execute Despawn Action Strategy
    const action = String(inputs.despawnAction || (node && node.data && node.data.values && node.data.values.despawnAction) || 'destroy').toLowerCase();
    const collectClipName = inputs.collectClip !== undefined 
      ? inputs.collectClip 
      : (inputs.collectClips !== undefined 
        ? inputs.collectClips 
        : (node && node.data && node.data.values && (node.data.values.collectClip ?? node.data.values.collectClips)) || '');

    if (action === 'destroy') {
      playAnimationAndDestroy(target, collectClipName, context, node);
      if (target._collectable?.state === 'destroyed') {
        outputs.onAnimationEnd = true;
        if (typeof context.triggerFlow === 'function') {
          context.triggerFlow('onAnimationEnd');
        }
      }
    } else if (action === 'deactivate') {
      const respawnTime = typeof inputs.respawnTime === 'number' 
        ? inputs.respawnTime 
        : (node && node.data && node.data.values && typeof node.data.values.respawnTime === 'number' ? node.data.values.respawnTime : 0);
      deactivateAndScheduleRespawn(target, collectClipName, respawnTime, context, node);
      if (target._collectable?.state === 'despawned') {
        outputs.onAnimationEnd = true;
        if (typeof context.triggerFlow === 'function') {
          context.triggerFlow('onAnimationEnd');
        }
      }
    } else if (action === 'none') {
      const targetClipName = extractTargetClipName(collectClipName);
      const matchedClip = (animator && targetClipName) ? findClip(animator.clips, targetClipName) : null;
      if (matchedClip && animator) {
        playClipSafe(animator, targetClipName, true);
        cState.lastClip = animator.currentClip || '';
      }
    }
  }

  outputs.currentClip = animator ? (animator.currentClip || cState.lastClip || '') : '';
  if (clipChanged) {
    outputs.onClipChanged = true;
  }

  outputs.execOut = true;
  const result = {
    execOut: true,
    isCollected: Boolean(cState.isCollected),
    collectorEntity: outputs.collectorEntity || '',
    itemEntity: outputs.itemEntity || itemEntity,
    value: outputs.value,
    currentClip: outputs.currentClip,
    onCollected: Boolean(outputs.onCollected),
    onAnimationEnd: Boolean(outputs.onAnimationEnd),
    onRespawn: Boolean(outputs.onRespawn),
    onClipChanged: Boolean(outputs.onClipChanged)
  };
  Object.assign(outputs, result);
  return result;
}

__exports.findClip = findClip;
__exports.playClipSafe = playClipSafe;
__exports.applyBobbing = applyBobbing;
__exports.checkOverlap = checkOverlap;
__exports.playAnimationAndDestroy = playAnimationAndDestroy;
__exports.deactivateAndScheduleRespawn = deactivateAndScheduleRespawn;
__exports.processCollectable = processCollectable;
};
// === Module: Toolkit/Combat/CombatHelper.js ===
__reg.m["Toolkit/Combat/CombatHelper.js"] = function(__require, __exports, __module) {
function processPlatformerCombat(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = target.components && target.components.SpriteAnimator;
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const keyboard = context.input.keyboard;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._combat) {
    target._combat = {
      isAttacking: false,
      currentCombo: 0,
      comboTimer: 0,
      cooldownTimer: 0,
      bufferAttack: false,
      hasTriggeredHitboxActive: false,
      hitEntitiesThisAttack: [],
      currentAttackDef: null,
      activeClipId: '',
      lastFacing: 'right'
    };
  }
  const cState = target._combat;

  if (cState.cooldownTimer > 0) {
    cState.cooldownTimer -= dt;
    if (cState.cooldownTimer < 0) cState.cooldownTimer = 0;
  }

  let config = inputs.attacksConfig;
  if (!config && node && node.data && node.data.values && node.data.values.attacksConfig) {
    config = node.data.values.attacksConfig;
  }
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch (e) {
      config = null;
    }
  }

  const defaultAttacks = {
    ground: [
      {
        clip: 'attack1',
        startFrame: 1,
        endFrame: 3,
        hitbox: { offsetX: 32, offsetY: 0, width: 40, height: 32 },
        damage: 10,
        knockbackX: 150,
        knockbackY: -50,
        forwardStep: 20
      },
      {
        clip: 'attack2',
        startFrame: 2,
        endFrame: 4,
        hitbox: { offsetX: 36, offsetY: 0, width: 44, height: 32 },
        damage: 15,
        knockbackX: 250,
        knockbackY: -80,
        forwardStep: 30
      }
    ],
    air: [
      {
        clip: 'airAttack',
        startFrame: 1,
        endFrame: 4,
        hitbox: { offsetX: 25, offsetY: 5, width: 44, height: 44 },
        damage: 12,
        knockbackX: 120,
        knockbackY: 80,
        forwardStep: 0
      }
    ]
  };

  let groundList = defaultAttacks.ground;
  let airList = defaultAttacks.ground;

  if (config && typeof config === 'object') {
    if (Array.isArray(config)) {
      groundList = config.length > 0 ? config : defaultAttacks.ground;
      airList = groundList;
    } else if (config.ground || config.air) {
      groundList = Array.isArray(config.ground) && config.ground.length > 0 ? config.ground : defaultAttacks.ground;
      airList = Array.isArray(config.air) && config.air.length > 0 ? config.air : (groundList || defaultAttacks.air);
    } else if (config.clip || config.colliderScriptId || config.hitbox) {
      groundList = [config];
      airList = [config];
    }
  }

  let facing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (facing !== 'left' && facing !== 'right') {
    if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
      facing = phys.facingDirection;
    } else if (transform && typeof transform.flipX === 'boolean') {
      facing = transform.flipX ? 'left' : 'right';
    } else {
      facing = cState.lastFacing || 'right';
    }
  }
  cState.lastFacing = facing;

  let isGrounded = true;
  if (typeof inputs.isGrounded === 'boolean') {
    isGrounded = inputs.isGrounded;
  } else if (phys && typeof phys.isGrounded === 'boolean') {
    isGrounded = Boolean(phys.isGrounded);
  }

  const keyAttack = String(inputs.keyAttack || '').trim().toLowerCase();
  const isAttackPressed = Boolean(keyboard && typeof keyboard.isPressed === 'function' && keyAttack && keyboard.isPressed(keyAttack));
  const isTriggerActive = Boolean(inputs.triggerAttack === true || inputs.triggerAttack === 'true');
  const isAttackTriggered = isAttackPressed || isTriggerActive;

  const nodeValCooldown = node && node.data && node.data.values && node.data.values.attackCooldown;
  const attackCooldown = typeof inputs.attackCooldown === 'number' ? inputs.attackCooldown : (typeof nodeValCooldown === 'number' ? nodeValCooldown : 0);
  const comboBufferTime = typeof inputs.comboBufferTime === 'number' ? inputs.comboBufferTime : 0.35;
  const autoLockMovement = inputs.autoLockMovement !== false && inputs.autoLockMovement !== 'false';

  function findClip(clips, clipName) {
    if (!clips || !clipName) return null;
    const arr = Array.isArray(clips) ? clips : Object.values(clips);
    const targetLower = String(clipName).trim().toLowerCase();
    return arr.find(c =>
      c.id === clipName ||
      c.scriptId === clipName ||
      c.name === clipName ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) || null;
  }

  function triggerAttack(comboIdx) {
    const list = isGrounded ? groundList : airList;
    const attackDef = list[comboIdx % list.length];
    cState.isAttacking = true;
    cState.currentCombo = comboIdx;
    cState.comboTimer = comboBufferTime;
    cState.bufferAttack = false;
    cState.hasTriggeredHitboxActive = false;
    cState.hitEntitiesThisAttack = [];
    cState.currentAttackDef = attackDef;

    if (animator && attackDef && attackDef.clip) {
      const rawClips = animator.clips;
      const clipObj = findClip(rawClips, attackDef.clip);
      const resolvedId = clipObj ? clipObj.id : attackDef.clip;
      animator.currentClip = resolvedId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (clipObj) clipObj.frameIndex = 0;
      cState.activeClipId = resolvedId;
    }

    if (attackDef && attackDef.forwardStep && isGrounded && transform) {
      const step = attackDef.forwardStep * (facing === 'left' ? -1 : 1);
      if (context.collider && typeof context.collider.moveAndSlide === 'function') {
        context.collider.moveAndSlide(target, step, 0);
      } else {
        transform.x += step;
      }
    }

    outputs.onAttackStart = true;
  }

  const canStartAttack = !cState.isAttacking && (cState.cooldownTimer <= 0);

  if (!cState.isAttacking) {
    if (cState.comboTimer > 0) {
      cState.comboTimer -= dt;
      if (cState.comboTimer <= 0) {
        cState.currentCombo = 0;
      }
    }

    if (canStartAttack && isAttackTriggered) {
      const nextCombo = (cState.comboTimer > 0 && isGrounded && attackCooldown <= 0) ? (cState.currentCombo + 1) : 0;
      triggerAttack(nextCombo);
    }
  } else {
    if (isAttackTriggered) {
      cState.bufferAttack = true;
    }

    const attackDef = cState.currentAttackDef;
    const activeClipId = animator ? (animator.currentClip || cState.activeClipId) : cState.activeClipId;
    const rawClips = animator ? animator.clips : [];
    const clipObj = findClip(rawClips, activeClipId);

    const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
    const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
    const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

    let startFrame = 1;
    if (attackDef) {
      if (typeof attackDef.startFrame === 'number') startFrame = attackDef.startFrame;
      else if (attackDef.hitbox && typeof attackDef.hitbox.startFrame === 'number') startFrame = attackDef.hitbox.startFrame;
    }
    let endFrame = 1;
    if (attackDef) {
      if (typeof attackDef.endFrame === 'number') endFrame = attackDef.endFrame;
      else if (attackDef.hitbox && typeof attackDef.hitbox.endFrame === 'number') endFrame = attackDef.hitbox.endFrame;
      else endFrame = Math.max(startFrame, totalFrames - 1);
    }

    const isHitboxFrame = currentFrame >= startFrame && currentFrame <= endFrame;
    const colScriptId = attackDef ? (attackDef.colliderScriptId || attackDef.colliderId) : null;

    if (isHitboxFrame) {
      if (!cState.hasTriggeredHitboxActive) {
        outputs.onHitboxActive = true;
        cState.hasTriggeredHitboxActive = true;
      }

      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, true);
      }

      const targetTag = String(inputs.targetTag || 'enemy').trim();
      const sign = (facing === 'left') ? -1 : 1;
      let hitCandidates = [];

      if (colScriptId && context.collider && typeof context.collider.checkHitbox === 'function') {
        const hits = context.collider.checkHitbox(target, colScriptId, targetTag, ['hurtbox', 'solid', 'trigger']) || [];
        hitCandidates = hits.map(h => h.entity);
      } else {
        if (targetTag && context.entity && typeof context.entity.getAllByTag === 'function') {
          const candidates = context.entity.getAllByTag(targetTag);

          let hbW = 40;
          let hbH = 32;
          let hbOffX = 32;
          let hbOffY = 0;
          if (colScriptId && target.components && target.components.Collider && target.components.Collider.data) {
            const colShape = target.components.Collider.data.find(s => s.scriptId === colScriptId || s.id === colScriptId);
            if (colShape) {
              hbW = Number(colShape.width || 40);
              hbH = Number(colShape.height || 32);
              hbOffX = Number(colShape.offsetX || 0);
              hbOffY = Number(colShape.offsetY || 0);
            }
          } else {
            const hb = (attackDef && attackDef.hitbox) ? attackDef.hitbox : { offsetX: 32, offsetY: 0, width: 40, height: 32 };
            hbW = Number(hb.width || 40);
            hbH = Number(hb.height || 32);
            hbOffX = typeof hb.offsetX === 'number' ? hb.offsetX : 32;
            hbOffY = typeof hb.offsetY === 'number' ? hb.offsetY : 0;
          }

          const hbCenterX = (transform ? transform.x : 0) + (hbOffX * sign);
          const hbCenterY = (transform ? transform.y : 0) + hbOffY;
          const hbMinX = hbCenterX - (hbW * 0.5);
          const hbMaxX = hbCenterX + (hbW * 0.5);
          const hbMinY = hbCenterY - (hbH * 0.5);
          const hbMaxY = hbCenterY + (hbH * 0.5);

          for (let i = 0; i < candidates.length; i++) {
            const other = candidates[i];
            if (!other || other.active === false || other.id === target.id) continue;
            if (cState.hitEntitiesThisAttack.includes(other.id)) continue;

            let overlaps = false;
            const otherCollider = other.components && other.components.Collider;
            if (otherCollider && Array.isArray(otherCollider.data) && otherCollider.data.length > 0) {
              const otherT = other.components.Transform || { x: 0, y: 0, width: 32, height: 32 };
              for (const cB of otherCollider.data) {
                if (cB.enabled === false) continue;
                const bW = Number(cB.width || otherT.width || 32);
                const bH = Number(cB.height || otherT.height || 32);
                const bX = (otherT.x || 0) + Number(cB.offsetX || 0);
                const bY = (otherT.y || 0) + Number(cB.offsetY || 0);
                if (hbMinX < (bX + bW * 0.5) && hbMaxX > (bX - bW * 0.5) &&
                    hbMinY < (bY + bH * 0.5) && hbMaxY > (bY - bH * 0.5)) {
                  overlaps = true;
                  break;
                }
              }
            }

            if (!overlaps) {
              const oT = other.components && (other.components.Transform || other.components.UITransform);
              if (oT) {
                const oW = (oT.width || 32) * Math.abs(typeof oT.scaleX === 'number' ? oT.scaleX : 1);
                const oH = (oT.height || 32) * Math.abs(typeof oT.scaleY === 'number' ? oT.scaleY : 1);
                const oPivotX = typeof oT.pivotX === 'number' ? oT.pivotX : 0.5;
                const oPivotY = typeof oT.pivotY === 'number' ? oT.pivotY : 0.5;
                const oMinX = oT.x - (oW * oPivotX);
                const oMaxX = oMinX + oW;
                const oMinY = oT.y - (oH * oPivotY);
                const oMaxY = oMinY + oH;
                overlaps = (hbMinX < oMaxX && hbMaxX > oMinX && hbMinY < oMaxY && hbMaxY > oMinY);
              }
            }

            if (overlaps) {
              hitCandidates.push(other);
            }
          }
        }
      }

      for (let i = 0; i < hitCandidates.length; i++) {
        const other = hitCandidates[i];
        if (!other || cState.hitEntitiesThisAttack.includes(other.id)) continue;
        cState.hitEntitiesThisAttack.push(other.id);
        const dmg = Number(attackDef ? attackDef.damage : 10) || 10;
        
        if (other.components && other.components.Health) {
          const curHp = typeof other.components.Health.current === 'number' ? other.components.Health.current : 100;
          other.components.Health.current = Math.max(0, curHp - dmg);
        } else if (typeof other.hp === 'number') {
          other.hp = Math.max(0, other.hp - dmg);
        }

        let rawKbX = 150;
        if (attackDef) {
          if (typeof attackDef.knockbackX === 'number') rawKbX = attackDef.knockbackX;
          else if (attackDef.knockback && typeof attackDef.knockback.x === 'number') rawKbX = attackDef.knockback.x;
        }
        const kbX = rawKbX * sign;

        let kbY = -50;
        if (attackDef) {
          if (typeof attackDef.knockbackY === 'number') kbY = attackDef.knockbackY;
          else if (attackDef.knockback && typeof attackDef.knockback.y === 'number') kbY = attackDef.knockback.y;
        }

        other._knockback = {
          duration: 0.25,
          velocityX: kbX,
          velocityY: kbY
        };

        if (other.components && other.components.Physics) {
          other.components.Physics.velocityX = kbX;
          other.components.Physics.velocityY = kbY;
          other.components.Physics.isGrounded = false;
          other.components.Physics._isIntentionalMove = true;
        }

        if (other.components && other.components.Transform) {
          const nudgeX = (kbX > 0 ? 12 : -12);
          other.components.Transform.x += nudgeX;
          other.components.Transform.y -= 6;
        }

        outputs.onHit = true;
        outputs.hitTarget = other.id || other.scriptId || '';
        outputs.damage = dmg;
      }
    } else {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
    }

    if (isAnimFinished) {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
      if (cState.bufferAttack && isGrounded && attackCooldown <= 0) {
        triggerAttack(cState.currentCombo + 1);
      } else {
        cState.isAttacking = false;
        cState.comboTimer = comboBufferTime;
        if (attackCooldown > 0) {
          cState.cooldownTimer = attackCooldown;
        }
        outputs.onAttackEnd = true;
      }
    }
  }

  const canMove = !(autoLockMovement && cState.isAttacking && isGrounded);

  outputs.execOut = true;
  outputs.isAttacking = cState.isAttacking;
  outputs.canMove = canMove;
  outputs.isCoolingDown = cState.cooldownTimer > 0;
  outputs.cooldownRemaining = Math.max(0, cState.cooldownTimer || 0);
  outputs.currentCombo = cState.currentCombo;
  outputs.currentClip = animator ? (animator.currentClip || cState.activeClipId || '') : (cState.activeClipId || '');
  if (!outputs.damage) outputs.damage = cState.currentAttackDef ? (cState.currentAttackDef.damage || 0) : 0;
  if (!outputs.hitTarget) outputs.hitTarget = '';
  const result = {
    execOut: true,
    onAttackStart: Boolean(outputs.onAttackStart),
    onHitboxActive: Boolean(outputs.onHitboxActive),
    onHit: Boolean(outputs.onHit),
    onAttackEnd: Boolean(outputs.onAttackEnd),
    isAttacking: outputs.isAttacking,
    canMove: outputs.canMove,
    isCoolingDown: outputs.isCoolingDown,
    cooldownRemaining: outputs.cooldownRemaining,
    currentCombo: outputs.currentCombo,
    currentClip: outputs.currentClip,
    hitTarget: outputs.hitTarget,
    damage: outputs.damage
  };
  Object.assign(outputs, result);
  return result;
}

function processEnemyCombat(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = target.components && target.components.SpriteAnimator;
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!target._combat) {
    target._combat = {
      isAttacking: false,
      cooldownTimer: 0,
      hasTriggeredHitboxActive: false,
      hitEntitiesThisAttack: [],
      lastFacing: 'right',
      activeClipId: ''
    };
  }
  const cState = target._combat;

  if (cState.cooldownTimer > 0) {
    cState.cooldownTimer = Math.max(0, cState.cooldownTimer - dt);
  }

  let facing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (facing !== 'left' && facing !== 'right') {
    if (target._ai && target._ai.facing) {
      facing = target._ai.facing;
    } else if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
      facing = phys.facingDirection;
    } else if (transform && typeof transform.flipX === 'boolean') {
      facing = transform.flipX ? 'left' : 'right';
    } else {
      facing = cState.lastFacing || 'right';
    }
  }
  cState.lastFacing = facing;

  let hb = inputs.hitboxConfig;
  if (!hb && node && node.data && node.data.values && node.data.values.hitboxConfig) {
    hb = node.data.values.hitboxConfig;
  }
  if (typeof hb === 'string') {
    try { hb = JSON.parse(hb); } catch (e) { hb = null; }
  }
  const hitbox = (hb && typeof hb === 'object') ? hb : { offsetX: 30, offsetY: 0, width: 36, height: 32 };

  const attackClipName = String(inputs.attackClip || (node && node.data && node.data.values && node.data.values.attackClip) || 'attack').trim();
  const attackCooldown = typeof inputs.attackCooldown === 'number' ? inputs.attackCooldown : 1.5;
  const startFrame = typeof inputs.startFrame === 'number' ? inputs.startFrame : 1;
  const endFrame = typeof inputs.endFrame === 'number' ? inputs.endFrame : 3;
  const damage = typeof inputs.damage === 'number' ? inputs.damage : 10;
  const knockbackX = typeof inputs.knockbackX === 'number' ? inputs.knockbackX : 180;
  const knockbackY = typeof inputs.knockbackY === 'number' ? inputs.knockbackY : -60;
  const autoTriggerInRange = inputs.autoTriggerInRange !== false && inputs.autoTriggerInRange !== 'false';

  function findClip(clips, clipName) {
    if (!clips || !clipName) return null;
    const arr = Array.isArray(clips) ? clips : Object.values(clips);
    const targetLower = String(clipName).trim().toLowerCase();
    return arr.find(c =>
      c.id === clipName ||
      c.scriptId === clipName ||
      c.name === clipName ||
      String(c.id || '').toLowerCase() === targetLower ||
      String(c.scriptId || '').toLowerCase() === targetLower ||
      String(c.name || '').toLowerCase() === targetLower
    ) || null;
  }

  function startAttack() {
    cState.isAttacking = true;
    cState.hasTriggeredHitboxActive = false;
    cState.hitEntitiesThisAttack = [];

    if (animator && attackClipName) {
      const rawClips = animator.clips;
      const clipObj = findClip(rawClips, attackClipName);
      const resolvedId = clipObj ? clipObj.id : attackClipName;
      animator.currentClip = resolvedId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (clipObj) clipObj.frameIndex = 0;
      cState.activeClipId = resolvedId;
    }

    outputs.onAttackStart = true;
  }

  const canAttack = !cState.isAttacking && cState.cooldownTimer <= 0;
  const isExplicitTrigger = Boolean(inputs.triggerAttack === true);
  const isInRange = Boolean(target._ai && target._ai.inAttackRange);

  if (canAttack && (isExplicitTrigger || (autoTriggerInRange && isInRange))) {
    startAttack();
  }

  if (cState.isAttacking) {
    const activeClipId = animator ? (animator.currentClip || cState.activeClipId) : cState.activeClipId;
    const rawClips = animator ? animator.clips : [];
    const clipObj = findClip(rawClips, activeClipId);

    const currentFrame = (clipObj && typeof clipObj.frameIndex === 'number') ? clipObj.frameIndex : 0;
    const totalFrames = (clipObj && Array.isArray(clipObj.frames)) ? clipObj.frames.length : 1;
    const isAnimFinished = animator ? (!animator.isPlaying || currentFrame >= totalFrames - 1) : false;

    const isHitboxFrame = (currentFrame >= startFrame && currentFrame <= endFrame);
    const colScriptId = hitbox ? (hitbox.colliderScriptId || (node && node.data && node.data.values && node.data.values.colliderScriptId)) : null;

    if (isHitboxFrame) {
      if (!cState.hasTriggeredHitboxActive) {
        outputs.onHitboxActive = true;
        cState.hasTriggeredHitboxActive = true;
      }

      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, true);
      }

      const playerTag = String(inputs.playerTag || 'player').trim();
      const sign = (facing === 'left') ? -1 : 1;
      let hitCandidates = [];

      if (colScriptId && context.collider && typeof context.collider.checkHitbox === 'function') {
        const hits = context.collider.checkHitbox(target, colScriptId, playerTag, ['hurtbox', 'solid', 'trigger']) || [];
        hitCandidates = hits.map(h => h.entity);
      } else {
        let candidates = [];
        if (context.entity && typeof context.entity.getAllByTag === 'function') {
          candidates = context.entity.getAllByTag(playerTag) || [];
          if (candidates.length === 0 && playerTag.toLowerCase() !== playerTag) {
            candidates = context.entity.getAllByTag(playerTag.toLowerCase()) || [];
          }
        }
        if (candidates.length === 0 && context.entity && typeof context.entity.get === 'function') {
          const byName = context.entity.get(playerTag) || context.entity.get(playerTag.toLowerCase());
          if (byName) candidates = [byName];
        }

        if (candidates.length > 0) {
          let hbW = 36;
          let hbH = 32;
          let hbOffX = 30;
          let hbOffY = 0;
          if (colScriptId && target.components && target.components.Collider && target.components.Collider.data) {
            const colShape = target.components.Collider.data.find(s => s.scriptId === colScriptId || s.id === colScriptId);
            if (colShape) {
              hbW = Number(colShape.width || 36);
              hbH = Number(colShape.height || 32);
              hbOffX = Number(colShape.offsetX || 0);
              hbOffY = Number(colShape.offsetY || 0);
            }
          } else {
            hbW = Number(hitbox.width || 36);
            hbH = Number(hitbox.height || 32);
            hbOffX = typeof hitbox.offsetX === 'number' ? hitbox.offsetX : 30;
            hbOffY = typeof hitbox.offsetY === 'number' ? hitbox.offsetY : 0;
          }

          const hbCenterX = (transform ? transform.x : 0) + (hbOffX * sign);
          const hbCenterY = (transform ? transform.y : 0) + hbOffY;
          const hbMinX = hbCenterX - (hbW * 0.5);
          const hbMaxX = hbCenterX + (hbW * 0.5);
          const hbMinY = hbCenterY - (hbH * 0.5);
          const hbMaxY = hbCenterY + (hbH * 0.5);

          for (let i = 0; i < candidates.length; i++) {
            const player = candidates[i];
            if (!player || player.active === false || player.id === target.id) continue;
            if (cState.hitEntitiesThisAttack.includes(player.id)) continue;

            let overlaps = false;
            const playerCollider = player.components && player.components.Collider;
            if (playerCollider && Array.isArray(playerCollider.data) && playerCollider.data.length > 0) {
              const playerT = player.components.Transform || { x: 0, y: 0, width: 32, height: 32 };
              for (const cB of playerCollider.data) {
                if (cB.enabled === false) continue;
                const bW = Number(cB.width || playerT.width || 32);
                const bH = Number(cB.height || playerT.height || 32);
                const bX = (playerT.x || 0) + Number(cB.offsetX || 0);
                const bY = (playerT.y || 0) + Number(cB.offsetY || 0);
                if (hbMinX < (bX + bW * 0.5) && hbMaxX > (bX - bW * 0.5) &&
                    hbMinY < (bY + bH * 0.5) && hbMaxY > (bY - bH * 0.5)) {
                  overlaps = true;
                  break;
                }
              }
            }

            if (!overlaps) {
              const pT = player.components && (player.components.Transform || player.components.UITransform);
              if (pT) {
                const pW = (pT.width || 32) * Math.abs(typeof pT.scaleX === 'number' ? pT.scaleX : 1);
                const pH = (pT.height || 32) * Math.abs(typeof pT.scaleY === 'number' ? pT.scaleY : 1);
                const pPivotX = typeof pT.pivotX === 'number' ? pT.pivotX : 0.5;
                const pPivotY = typeof pT.pivotY === 'number' ? pT.pivotY : 0.5;
                const pMinX = pT.x - (pW * pPivotX);
                const pMaxX = pMinX + pW;
                const pMinY = pT.y - (pH * pPivotY);
                const pMaxY = pMinY + pH;
                overlaps = (hbMinX < pMaxX && hbMaxX > pMinX && hbMinY < pMaxY && hbMaxY > pMinY);
              }
            }

            if (overlaps) {
              hitCandidates.push(player);
            }
          }
        }
      }

      for (let i = 0; i < hitCandidates.length; i++) {
        const player = hitCandidates[i];
        if (!player || cState.hitEntitiesThisAttack.includes(player.id)) continue;
        cState.hitEntitiesThisAttack.push(player.id);
        
        if (player.components && player.components.Health) {
          const curHp = typeof player.components.Health.current === 'number' ? player.components.Health.current : 100;
          player.components.Health.current = Math.max(0, curHp - damage);
        } else if (typeof player.hp === 'number') {
          player.hp = Math.max(0, player.hp - damage);
        }

        const kbX = knockbackX * sign;
        const kbY = knockbackY;

        player._knockback = {
          duration: 0.25,
          velocityX: kbX,
          velocityY: kbY
        };

        if (player.components && player.components.Physics) {
          player.components.Physics.velocityX = kbX;
          player.components.Physics.velocityY = kbY;
          player.components.Physics.isGrounded = false;
          player.components.Physics._isIntentionalMove = true;
        }

        if (player.components && player.components.Transform) {
          const nudgeX = (kbX > 0 ? 12 : -12);
          player.components.Transform.x += nudgeX;
          player.components.Transform.y -= 6;
        }

        outputs.onHit = true;
        outputs.hitPlayer = player.id || player.scriptId || '';
        outputs.damageDealt = damage;
      }
    } else {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
    }

    if (isAnimFinished) {
      if (colScriptId && context.collider && typeof context.collider.setShapeEnabled === 'function') {
        context.collider.setShapeEnabled(target, colScriptId, false);
      }
      cState.isAttacking = false;
      if (attackCooldown > 0) {
        cState.cooldownTimer = attackCooldown;
      }
      outputs.onAttackEnd = true;
    }
  }

  outputs.execOut = true;
  outputs.isAttacking = cState.isAttacking;
  outputs.isCoolingDown = cState.cooldownTimer > 0;
  outputs.cooldownRemaining = Math.max(0, cState.cooldownTimer || 0);
  outputs.currentClip = animator ? (animator.currentClip || cState.activeClipId || '') : (cState.activeClipId || '');
  if (!outputs.damageDealt) outputs.damageDealt = 0;
  if (!outputs.hitPlayer) outputs.hitPlayer = '';
  const result = {
    execOut: true,
    onAttackStart: Boolean(outputs.onAttackStart),
    onHitboxActive: Boolean(outputs.onHitboxActive),
    onHit: Boolean(outputs.onHit),
    onAttackEnd: Boolean(outputs.onAttackEnd),
    isAttacking: outputs.isAttacking,
    isCoolingDown: outputs.isCoolingDown,
    cooldownRemaining: outputs.cooldownRemaining,
    currentClip: outputs.currentClip,
    damageDealt: outputs.damageDealt,
    hitPlayer: outputs.hitPlayer
  };
  Object.assign(outputs, result);
  return result;
}

__exports.processPlatformerCombat = processPlatformerCombat;
__exports.processEnemyCombat = processEnemyCombat;
};
// === Module: Toolkit/Dialogue/DialogueRunnerHelper.js ===
__reg.m["Toolkit/Dialogue/DialogueRunnerHelper.js"] = function(__require, __exports, __module) {
function processDialogueRunner(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  let dialogMap = inputs.dialogMap || inputs.dialogueMap;

  if (!dialogMap) {
    if (typeof context.hasVariable === 'function') {
      if (context.hasVariable('dialogueMap')) {
        dialogMap = context.getVariable('dialogueMap');
      } else if (context.hasVariable('dialogMap')) {
        dialogMap = context.getVariable('dialogMap');
      }
    }
  }

  let charMap = inputs.charMap || inputs.characterMap;
  if (!charMap) {
    if (typeof context.hasVariable === 'function') {
      if (context.hasVariable('characterMap')) {
        charMap = context.getVariable('characterMap');
      } else if (context.hasVariable('charMap')) {
        charMap = context.getVariable('charMap');
      }
    }
  }

  dialogMap = context.assert.exists(dialogMap, 'Dialog Map must be provided');

  let dialogId = inputs.dialogId;
  if (state.vnNextDialogId && (dialogId === state.vnLastDialogId || !dialogId)) {
    dialogId = state.vnNextDialogId;
  }
  if (!dialogId && dialogMap) {
    const keys = Object.keys(dialogMap);
    if (keys.length > 0) {
      dialogId = keys[0];
    }
  }
  state.vnLastDialogId = dialogId;

  const entry = dialogMap ? dialogMap[dialogId] : false;

  const makeResult = () => ({
    onNext: Boolean(outputs.onNext),
    onChoice: Boolean(outputs.onChoice),
    onEnd: Boolean(outputs.onEnd),
    nextDialogId: outputs.nextDialogId || '',
    choices: outputs.choices || []
  });

  if (!entry) {
    if (context.console && typeof context.console.warn === 'function') {
      context.console.warn("[Dialogue Runner] Dialog ID '" + (dialogId || '') + "' not found in Dialog Map.");
    }
    outputs.onEnd = true;
    context.triggerFlow('onEnd');
    return makeResult();
  }

  const now = Date.now();
  if (!state.vnLoopGuard) {
    state.vnLoopGuard = { lastTime: now, count: 0 };
  }
  const guard = state.vnLoopGuard;
  if (now - guard.lastTime < 150) {
    guard.count++;
    if (guard.count > 25) {
      if (context.console && typeof context.console.error === 'function') {
        context.console.error("[Dialogue Runner] Auto loop detected on dialog '" + dialogId + "' (" + guard.count + " iterations in <150ms). Execution aborted to prevent game freeze.");
      }
      outputs.onEnd = true;
      context.triggerFlow('onEnd');
      return makeResult();
    }
  } else {
    guard.lastTime = now;
    guard.count = 1;
  }

  const parseVars = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\{([^{}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      if (!trimmed || /^emit(?:Click)?\s*\(/i.test(trimmed)) return match;

      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      let scope = false;
      let varName = false;

      if (scopeMatch) {
        scope = scopeMatch[1].toLowerCase();
        varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      } else {
        varName = trimmed;
      }

      if (!varName) return match;

      const resolveVar = (sc, name) => {
        try {
          if (sc === 'local' && typeof context.getLocal === 'function') {
            return { found: true, val: context.getLocal(name) };
          }
          if (sc === 'global' && typeof context.getGlobal === 'function') {
            return { found: true, val: context.getGlobal(name) };
          }
        } catch (e) {
          return { found: false };
        }
        return { found: false };
      };

      let result = false;
      let hasResult = false;

      if (scope === 'local') {
        const res = resolveVar('local', varName);
        if (res.found) {
          result = res.val;
          hasResult = true;
        }
      } else if (scope === 'global') {
        const res = resolveVar('global', varName);
        if (res.found) {
          result = res.val;
          hasResult = true;
        }
      } else {
        if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
          try {
            result = context.getVariable(varName);
            hasResult = true;
          } catch (e) {}
        }
        if (!hasResult) {
          const resLocal = resolveVar('local', varName);
          if (resLocal.found) {
            result = resLocal.val;
            hasResult = true;
          }
        }
        if (!hasResult) {
          const resGlobal = resolveVar('global', varName);
          if (resGlobal.found) {
            result = resGlobal.val;
            hasResult = true;
          }
        }
      }

      if (hasResult) {
        return typeof result === 'object' && result ? JSON.stringify(result) : String(result);
      }
      return match;
    });
  };

  const splitArgs = (str) => {
    const args = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inQuote) {
        cur += c;
        if (c === quoteChar && str[i - 1] !== '\\') {
          inQuote = false;
        }
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        cur += c;
      } else if (c === '(' || c === '[' || c === '{') {
        depth++;
        cur += c;
      } else if (c === ')' || c === ']' || c === '}') {
        depth--;
        cur += c;
      } else if (c === ',' && depth === 0) {
        if (cur.trim()) args.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  const parseSignalArg = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return false;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      return { signal: trimmed, value: true };
    }
    const signal = trimmed.slice(0, colonIdx).trim();
    const valRaw = trimmed.slice(colonIdx + 1).trim();
    if (valRaw === '') {
      return { signal, value: true };
    }
    try {
      return { signal, value: JSON.parse(valRaw) };
    } catch (e) {
      return { signal, value: valRaw };
    }
  };

  const rawEntryText = parseVars(entry.text || '');

  let fullText = '';
  const emitCues = [];
  let lastIdx = 0;
  const emitRegex = /\{emit\s*\(([^)]*)\)\}/gi;
  let m;
  while ((m = emitRegex.exec(rawEntryText))) {
    fullText += rawEntryText.slice(lastIdx, m.index);
    const charIdx = fullText.length;
    const sigs = splitArgs(m[1]).map(parseSignalArg).filter(Boolean);
    if (sigs.length > 0) {
      emitCues.push({ index: charIdx, signals: sigs, triggered: false });
    }
    lastIdx = emitRegex.lastIndex;
  }
  fullText += rawEntryText.slice(lastIdx);

  const triggerPendingEmits = (currentIdx) => {
    const cues = state.vnEmitCues;
    if (!cues || !context.signal || typeof context.signal.emit !== 'function') return;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (!cue.triggered && currentIdx >= cue.index) {
        cue.triggered = true;
        for (let s = 0; s < cue.signals.length; s++) {
          context.signal.emit(cue.signals[s].signal, cue.signals[s].value);
        }
      }
    }
  };

  const textEntId = inputs.textEntity || 'dialogText';
  const textEnt = context.assert.exists(context.entity.get(textEntId), 'Dialogue Text entity must exist');
  let textComp = textEnt.components ? textEnt.components.TextRenderer : false;
  if (!textComp) {
    const children = context.entity.getChildren(textEnt);
    for (let c = 0; c < children.length; c++) {
      if (children[c].components && children[c].components.TextRenderer) {
        textComp = children[c].components.TextRenderer;
        break;
      }
    }
  }
  context.assert.exists(textComp, 'Dialogue entity or its children must have TextRenderer component');

  const spkEntId = inputs.speakerEntity || 'characterName';
  const nameEntId = inputs.nameEntity || 'nameBox';
  const spkEnt = spkEntId ? context.entity.get(spkEntId) : false;
  const nameEnt = nameEntId ? context.entity.get(nameEntId) : false;

  const clickEntId = inputs.clickEntity || inputs.clickArea;
  const clickEnt = (clickEntId && typeof clickEntId === 'object') ? clickEntId : (clickEntId ? context.entity.get(clickEntId) : false);
  if (clickEntId && !clickEnt) {
    if (context.console && typeof context.console.warn === 'function') {
      context.console.warn("[Dialogue Runner] clickEntity '" + clickEntId + "' not found.");
    }
  }

  const charData = charMap ? charMap[entry.speaker] : false;
  const rawSpeaker = charData && charData.displayName ? charData.displayName : (entry.speaker ? entry.speaker : '');
  const isNarrator = !entry.speaker || entry.speaker === 'narrator' || (charData && charData.displayName === '');

  if (isNarrator) {
    if (nameEnt) nameEnt.visible = false;
    if (spkEnt) spkEnt.visible = false;
  } else {
    if (nameEnt) nameEnt.visible = true;
    if (spkEnt) {
      spkEnt.visible = true;
      let spkComp = spkEnt.components ? spkEnt.components.TextRenderer : false;
      if (!spkComp) {
        const children = context.entity.getChildren(spkEnt);
        for (let c = 0; c < children.length; c++) {
          if (children[c].components && children[c].components.TextRenderer) {
            spkComp = children[c].components.TextRenderer;
            break;
          }
        }
      }
      if (spkComp) {
        spkComp.value = parseVars(rawSpeaker);
        if (charData && charData.nameColor) {
          spkComp.color = charData.nameColor;
        }
      }
    }
  }

  const portEntId = inputs.portraitEntity || 'spriteCharacter';
  let targetEnt = portEntId ? context.entity.get(portEntId) : false;
  if (targetEnt) {
    let portEnt = targetEnt;
    let imgComp = portEnt.components ? portEnt.components.SpriteRenderer : false;
    let animComp = portEnt.components ? portEnt.components.SpriteAnimator : false;

    if (!imgComp && !animComp) {
      const children = context.entity.getChildren(targetEnt);
      for (let c = 0; c < children.length; c++) {
        if (children[c].components && (children[c].components.SpriteRenderer || children[c].components.SpriteAnimator)) {
          portEnt = children[c];
          imgComp = portEnt.components.SpriteRenderer || false;
          animComp = portEnt.components.SpriteAnimator || false;
          break;
        }
      }
    }

    if (isNarrator) {
      portEnt.visible = false;
      if (targetEnt !== portEnt) targetEnt.visible = false;
    } else {
      let spriteVal = false;
      if (charData && charData.sprites) {
        const emo = entry.emotion;
        if (emo && charData.sprites[emo]) {
          spriteVal = charData.sprites[emo];
        } else {
          spriteVal = charData.sprites.neutral || charData.sprites.default || false;
        }
      }

      if (spriteVal) {
        let finalAssetId = spriteVal;
        if (context.asset && typeof context.asset.resolveId === 'function') {
          const resolved = context.asset.resolveId(spriteVal);
          if (resolved) {
            finalAssetId = resolved;
          }
        }
        if (imgComp) {
          imgComp.assetId = finalAssetId;
        }
        if (animComp && animComp.clips && Array.isArray(animComp.clips)) {
          const matchedClip = animComp.clips.find(c => 
            c.scriptId === spriteVal || 
            c.scriptId === entry.emotion || 
            c.id === spriteVal || 
            c.id === entry.emotion ||
            c.assetId === finalAssetId ||
            c.id === finalAssetId
          );
          if (matchedClip) {
            animComp.currentClip = matchedClip.id;
          }
        }
        portEnt.visible = true;
        if (targetEnt !== portEnt) targetEnt.visible = true;
      } else {
        portEnt.visible = false;
        if (targetEnt !== portEnt) targetEnt.visible = false;
      }
    }
  }

  const rawSpeed = Number(inputs.speed);
  const speed = isNaN(rawSpeed) ? 40 : Math.max(0, rawSpeed);

  state.vnTargetText = fullText;
  state.vnEmitCues = emitCues;
  state.vnTimer = 0;
  state.vnCompleted = false;

  const currentPointer = context.input ? context.input.getPointer() : false;
  state.vnWasDown = Boolean(currentPointer && currentPointer.down);

  if (speed === 0 || fullText.length === 0) {
    state.vnIndex = fullText.length;
    state.vnIsTyping = false;
    textComp.value = fullText;
    triggerPendingEmits(fullText.length);
    if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
      state.vnCompleted = true;
      outputs.choices = entry.choices;
      outputs.onChoice = true;
      context.triggerFlow('onChoice');
    }
  } else {
    state.vnIndex = 0;
    state.vnIsTyping = true;
    textComp.value = '';
    triggerPendingEmits(0);
  }

  context.onTick((tickDt) => {
    if (state.vnCompleted) return;

    const dtSec = (typeof tickDt === 'number' && tickDt > 0) ? tickDt : (context.dt || 0.016);
    const dt = dtSec * 1000;

    const pointer = context.input ? context.input.getPointer() : false;
    const isPointerDown = Boolean(pointer && pointer.down);
    const isNewPointerDown = isPointerDown && !state.vnWasDown;
    state.vnWasDown = isPointerDown;

    const kbd = context.input && context.input.keyboard;
    const isKeyAdvance = Boolean(
      kbd && (
        kbd.isPressed('Space') ||
        kbd.isPressed('Enter') ||
        kbd.isPressed('KeyZ')
      )
    );

    let isPointerClick = false;
    if (isNewPointerDown) {
      if (clickEnt) {
        if (clickEnt.active !== false && clickEnt.visible !== false) {
          if (context.input && typeof context.input.isPointerOver === 'function') {
            isPointerClick = Boolean(context.input.isPointerOver(clickEnt, true));
          }
        }
      } else if (!clickEntId) {
        isPointerClick = true;
      }
    }

    const isClick = isPointerClick || isKeyAdvance;

    if (state.vnIsTyping) {
      if (isClick) {
        state.vnIndex = state.vnTargetText.length;
        textComp.value = state.vnTargetText;
        state.vnIsTyping = false;
        triggerPendingEmits(state.vnTargetText.length);
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          state.vnCompleted = true;
          outputs.choices = entry.choices;
          outputs.onChoice = true;
          context.triggerFlow('onChoice');
        }
        return;
      }

      const charSpeed = Math.max(1, speed);
      state.vnTimer += dt;
      while (state.vnTimer >= charSpeed && state.vnIndex < state.vnTargetText.length) {
        state.vnTimer -= charSpeed;
        state.vnIndex++;
        triggerPendingEmits(state.vnIndex);
      }
      textComp.value = state.vnTargetText.slice(0, state.vnIndex);

      if (state.vnIndex >= state.vnTargetText.length) {
        state.vnIsTyping = false;
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          state.vnCompleted = true;
          outputs.choices = entry.choices;
          outputs.onChoice = true;
          context.triggerFlow('onChoice');
        }
      }
    } else {
      if (isClick) {
        if (entry.choices && Array.isArray(entry.choices) && entry.choices.length > 0) {
          return;
        }
        state.vnCompleted = true;
        if (entry.next) {
          state.vnNextDialogId = entry.next;
          outputs.nextDialogId = entry.next;
          outputs.onNext = true;
          context.triggerFlow('onNext');
        } else {
          state.vnNextDialogId = false;
          outputs.onEnd = true;
          context.triggerFlow('onEnd');
        }
      }
    }
  });
  const result = {
    onNext: Boolean(outputs.onNext),
    onChoice: Boolean(outputs.onChoice),
    onEnd: Boolean(outputs.onEnd),
    nextDialogId: outputs.nextDialogId || '',
    choices: outputs.choices || []
  };
  Object.assign(outputs, result);
  return result;
}

function processChoicePresenter(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const choices = inputs.choices;
  const buttons = inputs.buttonEntities || ['btnChoice1', 'btnChoice2', 'btnChoice3'];
  const textEntities = inputs.textEntities || ['btnChoice1Text', 'btnChoice2Text', 'btnChoice3Text'];

  context.assert.isArray(choices, 'Choices must be a valid array');
  context.assert.isArray(buttons, 'Button entities must be a valid array');

  const parseVars = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\{([^{}]+)\}/g, (match, expression) => {
      const trimmed = expression.trim();
      if (!trimmed || /^emit(?:Click)?\s*\(/i.test(trimmed)) return match;
      const scopeMatch = trimmed.match(/^(local|global)(?:[:.]|\(([^)]+)\))(.*)$/i);
      let scope = false;
      let varName = false;
      if (scopeMatch) {
        scope = scopeMatch[1].toLowerCase();
        varName = (scopeMatch[2] || scopeMatch[3] || '').replace(/^[:.]/, '').trim();
      } else {
        varName = trimmed;
      }
      if (!varName) return match;

      const resolveVar = (sc, name) => {
        try {
          if (sc === 'local' && typeof context.getLocal === 'function') {
            return { found: true, val: context.getLocal(name) };
          }
          if (sc === 'global' && typeof context.getGlobal === 'function') {
            return { found: true, val: context.getGlobal(name) };
          }
        } catch (e) {
          return { found: false };
        }
        return { found: false };
      };

      let result = false;
      let hasResult = false;
      if (scope === 'local') {
        const res = resolveVar('local', varName);
        if (res.found) { result = res.val; hasResult = true; }
      } else if (scope === 'global') {
        const res = resolveVar('global', varName);
        if (res.found) { result = res.val; hasResult = true; }
      } else {
        if (typeof context.hasVariable === 'function' && context.hasVariable(varName)) {
          try { result = context.getVariable(varName); hasResult = true; } catch (e) {}
        }
        if (!hasResult) {
          const resLocal = resolveVar('local', varName);
          if (resLocal.found) { result = resLocal.val; hasResult = true; }
        }
        if (!hasResult) {
          const resGlobal = resolveVar('global', varName);
          if (resGlobal.found) { result = resGlobal.val; hasResult = true; }
        }
      }
      return hasResult ? (typeof result === 'object' && result ? JSON.stringify(result) : String(result)) : match;
    });
  };

  const splitArgs = (str) => {
    const args = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (inQuote) {
        cur += c;
        if (c === quoteChar && str[i - 1] !== '\\') inQuote = false;
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
        cur += c;
      } else if (c === '(' || c === '[' || c === '{') {
        depth++; cur += c;
      } else if (c === ')' || c === ']' || c === '}') {
        depth--; cur += c;
      } else if (c === ',' && depth === 0) {
        if (cur.trim()) args.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    if (cur.trim()) args.push(cur.trim());
    return args;
  };

  const parseSignalArg = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return false;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) return { signal: trimmed, value: true };
    const signal = trimmed.slice(0, colonIdx).trim();
    const valRaw = trimmed.slice(colonIdx + 1).trim();
    if (valRaw === '') return { signal, value: true };
    try {
      return { signal, value: JSON.parse(valRaw) };
    } catch (e) {
      return { signal, value: valRaw };
    }
  };

  for (let i = 0; i < buttons.length; i++) {
    const btnEnt = context.entity.get(buttons[i]);
    const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
    if (!btnEnt) continue;

    if (i < choices.length) {
      btnEnt.visible = true;
      if (txtEnt) txtEnt.visible = true;

      let textComp = txtEnt && txtEnt.components ? txtEnt.components.TextRenderer : false;
      if (!textComp) {
        textComp = btnEnt.components ? btnEnt.components.TextRenderer : false;
        if (!textComp) {
          const children = context.entity.getChildren(btnEnt);
          for (let c = 0; c < children.length; c++) {
            if (children[c].components && children[c].components.TextRenderer) {
              textComp = children[c].components.TextRenderer;
              break;
            }
          }
        }
      }
      if (textComp) {
        const rawText = choices[i].text || '';
        const textWithoutEmit = rawText.replace(/\{emitClick\s*\([^)]*\)\}/gi, '').trim();
        textComp.value = parseVars(textWithoutEmit);
      }
    } else {
      btnEnt.visible = false;
      if (txtEnt) txtEnt.visible = false;
    }
  }

  state.choiceShowTime = Date.now();
  const initPointer = context.input ? context.input.getPointer() : false;
  state.choiceWasDown = Boolean(initPointer && initPointer.down);

  context.onTick(() => {
    const pointer = context.input ? context.input.getPointer() : false;
    const isPointerDown = pointer && pointer.down;

    const rawDelay = Number(inputs.activationDelay);
    const delay = isNaN(rawDelay) ? 0.25 : Math.max(0, rawDelay);
    const now = Date.now();

    if ((now - state.choiceShowTime) / 1000 < delay) {
      state.choiceWasDown = Boolean(isPointerDown);
      return;
    }

    const isClick = isPointerDown && !state.choiceWasDown;
    state.choiceWasDown = isPointerDown;

    if (!isClick) return;

    for (let i = 0; i < choices.length; i++) {
      if (i >= buttons.length) break;
      const btnEnt = context.entity.get(buttons[i]);
      if (!btnEnt || !btnEnt.visible) continue;
      const txtEnt = textEntities && textEntities[i] ? context.entity.get(textEntities[i]) : false;
      let isHovering = false;
      if (context.input && typeof context.input.isPointerOver === 'function') {
        isHovering = context.input.isPointerOver(btnEnt, true);
        if (!isHovering && txtEnt) {
          isHovering = context.input.isPointerOver(txtEnt, true);
        }
        if (!isHovering) {
          isHovering = context.input.isPointerOver(btnEnt, false);
        }
        if (!isHovering && txtEnt) {
          isHovering = context.input.isPointerOver(txtEnt, false);
        }
      }
      if (isHovering) {
        const selected = choices[i];

        for (let j = 0; j < buttons.length; j++) {
          const b = context.entity.get(buttons[j]);
          if (b) b.visible = false;
          if (textEntities && textEntities[j]) {
            const t = context.entity.get(textEntities[j]);
            if (t) t.visible = false;
          }
        }

        state.vnNextDialogId = selected.next;
        outputs.nextDialogId = selected.next;

        const rawText = selected.text || '';
        const emitMatches = [...rawText.matchAll(/\{emitClick\s*\(([^)]*)\)\}/gi)];
        for (let m = 0; m < emitMatches.length; m++) {
          const sigs = splitArgs(emitMatches[m][1]).map(parseSignalArg).filter(Boolean);
          for (let s = 0; s < sigs.length; s++) {
            context.signal.emit(sigs[s].signal, sigs[s].value);
          }
        }

        if (selected.signals && Array.isArray(selected.signals) && selected.signals.length > 0) {
          for (let s = 0; s < selected.signals.length; s++) {
            const sig = selected.signals[s];
            context.signal.emit(sig, true);
          }
        }

        outputs.execOut = true;
        context.triggerFlow('execOut');
        return;
      }
    }
  });
  const result = {
    execOut: Boolean(outputs.execOut),
    nextDialogId: outputs.nextDialogId || ''
  };
  Object.assign(outputs, result);
  return result;
}

__exports.processDialogueRunner = processDialogueRunner;
__exports.processChoicePresenter = processChoicePresenter;
};
// === Module: Toolkit/Platformer/PlatformerHelper.js ===
__reg.m["Toolkit/Platformer/PlatformerHelper.js"] = function(__require, __exports, __module) {
function isEntityOneWay(entity, oneWayTag) {
  if (!entity || !oneWayTag) return false;
  if (entity.components?.Tilemap?.isOneWay || entity.components?.Tilemap?.oneWay) return true;
  if (entity.components?.Collider?.isOneWay || entity.components?.Collider?.oneWay) return true;
  const tag = entity.tag || entity.components?.Tags?.value || entity.components?.Tilemap?.tag || '';
  if (!tag || typeof tag !== 'string') return false;
  const targets = oneWayTag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (targets.length === 0) return false;
  const tags = tag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  return targets.some(target => tags.includes(target));
}

function getBoxCorners(b) {
  if (b.vertices) return b.vertices;
  const cx = b.x, cy = b.y;
  const cos = Math.cos(b.rotation || 0), sin = Math.sin(b.rotation || 0);
  const left = -b.w * (b.pivotX ?? 0.5);
  const right = b.w * (1 - (b.pivotX ?? 0.5));
  const top = -b.h * (b.pivotY ?? 0.5);
  const bottom = b.h * (1 - (b.pivotY ?? 0.5));
  return [
    { x: cx + left*cos - top*sin, y: cy + left*sin + top*cos },
    { x: cx + right*cos - top*sin, y: cy + right*sin + top*cos },
    { x: cx + right*cos - bottom*sin, y: cy + right*sin + bottom*cos },
    { x: cx + left*cos - bottom*sin, y: cy + left*sin + bottom*cos }
  ];
}

function isStandingOnOneWayPlatform(target, oneWayTag, context) {
  if (!oneWayTag) return false;
  const phys = target.components && target.components.Physics;
  if (phys) {
    if (phys.isGroundedOnOneWay) return true;
    if (phys.groundEntity && isEntityOneWay(phys.groundEntity, oneWayTag)) return true;
  }
  const colliderSys = (context.game && context.game.colliderSystem) || context.colliderSystem;
  if (!colliderSys || typeof colliderSys.getBounds !== 'function') return false;
  const entities = context.game?.world?.entities || [];
  const boundsList = colliderSys.getBounds(target).filter(b => b.type === 'solid');
  if (boundsList.length === 0) return false;

  const getCorners = typeof colliderSys._getObbCorners === 'function' ? (b) => colliderSys._getObbCorners(b) : getBoxCorners;

  for (const bA of boundsList) {
    const corners = getCorners(bA);
    const bottomY = Math.max(...corners.map(c => c.y));
    const minX = Math.min(...corners.map(c => c.x));
    const maxX = Math.max(...corners.map(c => c.x));
    const sensor = {
      x: minX + 2,
      y: bottomY,
      w: Math.max(1, (maxX - minX) - 4),
      h: 6,
      rotation: 0,
      pivotX: 0,
      pivotY: 0
    };
    for (const other of entities) {
      if (other === target || other.active === false) continue;
      if (!isEntityOneWay(other, oneWayTag)) continue;
      if (other.components?.Tilemap && other.components.Tilemap.isSolid) {
        if (colliderSys._getTilemapHitBounds && colliderSys._getTilemapHitBounds(sensor, other)) return true;
      } else if (other.components?.Collider || other.components?.ShapeRenderer) {
        const oBounds = colliderSys.getBounds(other).filter(b => b.type === 'solid');
        for (const bB of oBounds) {
          if (colliderSys._obbIntersect && colliderSys._obbIntersect(sensor, bB)) return true;
        }
      }
    }
  }
  return false;
}

function processPlatformerController(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const keyboard = context.input.keyboard;

  const oneWayTag = String(inputs.oneWayTag !== undefined ? inputs.oneWayTag : 'platform').trim();
  target._oneWayTag = oneWayTag;
  if (phys) phys._oneWayTag = oneWayTag;

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;

  if (!context.game || !context.game.physicsSystem) {
    if (typeof target._dropThroughTimer === 'number' && target._dropThroughTimer > 0) {
      target._dropThroughTimer = Math.max(0, target._dropThroughTimer - dt);
    }
    if (phys && typeof phys._dropThroughTimer === 'number' && phys._dropThroughTimer > 0) {
      phys._dropThroughTimer = Math.max(0, phys._dropThroughTimer - dt);
    }
  }

  if (!state.platformer) {
    state.platformer = { wasGrounded: false };
  }
  const pState = state.platformer;

  const keyLeft = String(inputs.keyLeft || 'a').trim().toLowerCase();
  const keyRight = String(inputs.keyRight || 'd').trim().toLowerCase();
  const keyJump = String(inputs.keyJump || 'space').trim().toLowerCase();
  const keyDown = String(inputs.keyDown || 's').trim().toLowerCase();

  const speed = typeof inputs.speed === 'number' ? inputs.speed : 260;
  const jumpForce = typeof inputs.jumpForce === 'number' ? inputs.jumpForce : 520;
  const dropNudge = typeof inputs.dropNudge === 'number' ? inputs.dropNudge : 6;
  const combatState = target._combat;
  const isCombatAttacking = Boolean(combatState && combatState.isAttacking);

  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  if (isKnockedBack) {
    target._knockback.duration -= dt;
  }

  let moveDirX = 0;
  if (!isCombatAttacking && !isKnockedBack && keyboard) {
    if (keyboard.isDown(keyRight)) moveDirX += 1;
    if (keyboard.isDown(keyLeft)) moveDirX -= 1;
  }

  const isGrounded = Boolean(phys ? phys.isGrounded : true);
  const isDownPressed = keyboard ? keyboard.isDown(keyDown) : false;
  const isJumpTriggered = !isCombatAttacking && !isKnockedBack && keyboard && keyboard.isPressed(keyJump);
  const isDownTriggered = !isCombatAttacking && !isKnockedBack && keyboard && keyboard.isPressed(keyDown);

  let didDrop = false;
  let didJump = false;

  const onOneWay = isGrounded && isStandingOnOneWayPlatform(target, oneWayTag, context);
  const wantsDrop = (isDownPressed && isJumpTriggered) || (isDownTriggered && keyboard && keyboard.isDown(keyJump));

  if (onOneWay && wantsDrop) {
    const dropDuration = 0.25;
    target._dropThroughTimer = dropDuration;
    target._dropThroughEntity = phys ? phys.groundEntity : null;
    if (phys) {
      phys._dropThroughTimer = dropDuration;
      phys._dropThroughEntity = phys.groundEntity;
      phys.velocityY = Math.max(120, (phys.velocityY || 0) + 120);
      phys.isGrounded = false;
      phys.isGroundedOnOneWay = false;
      phys.groundEntity = null;
    }
    if (target.components && target.components.Transform) {
      target.components.Transform.y += dropNudge;
    }
    didDrop = true;
    outputs.onDrop = true;
  } else if (isGrounded && isJumpTriggered) {
    if (phys) {
      phys.velocityY = -Math.abs(jumpForce);
      phys.isGrounded = false;
      phys.isGroundedOnOneWay = false;
    }
    didJump = true;
    outputs.onJump = true;
  }

  if (phys) {
    if (!isKnockedBack) {
      phys.velocityX = moveDirX * speed;
      phys._isIntentionalMove = Math.abs(phys.velocityX) > 10;
    }
    if (moveDirX > 0) {
      phys.facingDirection = 'right';
      phys.customFacing = true;
    } else if (moveDirX < 0) {
      phys.facingDirection = 'left';
      phys.customFacing = true;
    }
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    const moveX = moveDirX * speed * dt;
    context.collider.moveAndSlide(target, moveX, 0);
  }

  if (!pState.wasGrounded && isGrounded && !didDrop && !didJump) {
    outputs.onLand = true;
  }
  pState.wasGrounded = isGrounded;

  outputs.isGrounded = isGrounded;
  outputs.isGroundedOnOneWay = Boolean(onOneWay);
  outputs.groundType = phys ? (phys.groundType || (onOneWay ? 'entity' : null)) : null;
  outputs.movementState = isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle'));
  outputs.facingDirection = phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right');
  outputs.velocityX = phys ? (phys.velocityX || 0) : (moveDirX * speed);
  outputs.velocityY = phys ? (phys.velocityY || 0) : 0;
  outputs.execOut = true;
  const result = {
    isGrounded,
    isGroundedOnOneWay: Boolean(onOneWay),
    groundType: phys ? (phys.groundType || (onOneWay ? 'entity' : null)) : null,
    movementState: isCombatAttacking ? 'attack' : (phys ? phys.movementState : (moveDirX !== 0 ? 'running' : 'idle')),
    facingDirection: phys ? (phys.facingDirection || 'right') : (moveDirX < 0 ? 'left' : 'right'),
    velocityX: phys ? (phys.velocityX || 0) : (moveDirX * speed),
    velocityY: phys ? (phys.velocityY || 0) : 0,
    onJump: didJump,
    onLand: Boolean(outputs.onLand),
    onDrop: didDrop,
    execOut: true
  };
  Object.assign(outputs, result);
  return result;
}

function processPlatformerAnimator(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;
  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = context.assert.hasComponent(target, 'SpriteAnimator');
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;

  if (!state.platformerAnim) {
    state.platformerAnim = {
      lastState: 'idle',
      lastFacing: 'right',
      lastClip: '',
      prevX: transform ? transform.x : 0,
      prevY: transform ? transform.y : 0
    };
  }
  const pState = state.platformerAnim;

  function parseClips(raw) {
    if (!raw || typeof raw !== 'string') return false;
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return false;
    if (parts.length === 1) {
      return { left: parts[0], right: parts[0], isSingle: true };
    }
    const p0 = parts[0].toLowerCase();
    const p1 = parts[1].toLowerCase();
    if (p0.includes('left') || p0.endsWith('_l') || p0.endsWith('-l')) {
      return { left: parts[0], right: parts[1], isSingle: false };
    }
    if (p1.includes('left') || p1.endsWith('_l') || p1.endsWith('-l')) {
      return { left: parts[1], right: parts[0], isSingle: false };
    }
    if (p0.includes('right') || p0.endsWith('_r') || p0.endsWith('-r')) {
      return { left: parts[1], right: parts[0], isSingle: false };
    }
    if (p1.includes('right') || p1.endsWith('_r') || p1.endsWith('-r')) {
      return { left: parts[0], right: parts[1], isSingle: false };
    }
    return { left: parts[0], right: parts[1], isSingle: false };
  }

  const idleInput = String(inputs.idleClips || (node && node.data && node.data.values && node.data.values.idleClips) || '');
  const walkInput = String(inputs.walkClips || (node && node.data && node.data.values && node.data.values.walkClips) || '');
  const runInput = String(inputs.runClips || (node && node.data && node.data.values && node.data.values.runClips) || '');
  const jumpInput = String(inputs.jumpClips || (node && node.data && node.data.values && node.data.values.jumpClips) || '');
  const fallInput = String(inputs.fallClips || (node && node.data && node.data.values && node.data.values.fallClips) || '');
  const hitInput = String(inputs.hitClips || (node && node.data && node.data.values && node.data.values.hitClips) || '');

  const idleCfg = parseClips(idleInput);
  const walkCfg = parseClips(walkInput);
  const runCfg = parseClips(runInput);
  const jumpCfg = parseClips(jumpInput);
  const fallCfg = parseClips(fallInput);
  const hitCfg = parseClips(hitInput);

  let facing = '';
  const inputFacing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (inputFacing === 'left' || inputFacing === 'right') {
    facing = inputFacing;
  } else if (phys && (phys.facingDirection === 'left' || phys.facingDirection === 'right')) {
    facing = phys.facingDirection;
  } else if (phys && typeof phys.velocityX === 'number' && Math.abs(phys.velocityX) > 5) {
    facing = phys.velocityX < 0 ? 'left' : 'right';
  } else if (transform && typeof transform.x === 'number') {
    const dx = transform.x - pState.prevX;
    if (dx < -0.2) facing = 'left';
    else if (dx > 0.2) facing = 'right';
  }

  if (!facing) {
    facing = pState.lastFacing || 'right';
  }
  pState.lastFacing = facing;

  let moveState = '';
  const inputState = String(inputs.movementState || '').trim().toLowerCase();
  if (inputState) {
    if (inputState === 'idle' || inputState === 'stand') moveState = 'idle';
    else if (inputState === 'walk' || inputState === 'walking' || inputState === 'patrol') moveState = 'walk';
    else if (inputState === 'running' || inputState === 'run' || inputState === 'moving') moveState = 'run';
    else if (inputState === 'jumping' || inputState === 'jump') moveState = 'jump';
    else if (inputState === 'falling' || inputState === 'fall') moveState = 'fall';
    else if (inputState === 'air' || inputState === 'inair') moveState = 'jump';
    else if (inputState === 'attack' || inputState === 'attacking') moveState = 'attack';
    else if (inputState === 'hit' || inputState === 'hurt' || inputState === 'damaged') moveState = 'hit';
    else moveState = inputState;
  }

  const isHitInput = Boolean(inputs.isHit === true || inputs.isHit === 'true');
  const isKnockedBack = Boolean(target._knockback && target._knockback.duration > 0);
  const isEntityHit = Boolean(target._isHit || (target._hit && target._hit.duration > 0));
  const isHitMoveState = (moveState === 'hit');
  let isHit = isHitInput || isKnockedBack || isEntityHit || isHitMoveState;

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  if (isKnockedBack && !target._ai && (!phys || phys._isIntentionalMove === undefined)) {
    target._knockback.duration -= dt;
  }

  if (!isHit && pState.lastState === 'hit' && hitCfg) {
    const currentClipId = animator.currentClip || pState.lastClip;
    const rawClips = animator.clips;
    const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);
    const activeClip = clips.find(c => c.id === currentClipId || c.scriptId === currentClipId || c.name === currentClipId);
    if (activeClip && activeClip.isLooping === false && animator.isPlaying) {
      const totalFrames = Array.isArray(activeClip.frames) ? activeClip.frames.length : 1;
      const currentFrame = typeof activeClip.frameIndex === 'number' ? activeClip.frameIndex : 0;
      if (currentFrame < totalFrames - 1) {
        isHit = true;
      }
    }
  }

  if (inputs.enabled === false) {
    outputs.execOut = true;
    return;
  }

  if (isHit && hitCfg) {
    const combatState = target._combat || state.platformerCombat;
    if (combatState) {
      combatState.isAttacking = false;
      combatState.bufferAttack = false;
    }

    let autoFlipX = true;
    if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
      autoFlipX = false;
    }
    const isSingle = Boolean(hitCfg.isSingle);
    const targetClipName = (facing === 'left') ? hitCfg.left : hitCfg.right;
    let shouldFlip = false;
    if (isSingle && autoFlipX) {
      shouldFlip = (facing === 'left');
    }
    if (transform) {
      transform.flipX = shouldFlip;
      pState.prevX = transform.x;
      pState.prevY = transform.y;
    }

    const rawClips = animator.clips;
    const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

    let matchedClip = false;
    if (targetClipName) {
      const targetLower = targetClipName.toLowerCase();
      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        if (c.scriptId === targetClipName || c.id === targetClipName || c.name === targetClipName) {
          matchedClip = c;
          break;
        }
        if (String(c.scriptId || '').toLowerCase() === targetLower ||
            String(c.id || '').toLowerCase() === targetLower ||
            String(c.name || '').toLowerCase() === targetLower) {
          matchedClip = c;
          break;
        }
      }
    }

    const resolvedClipId = matchedClip ? matchedClip.id : targetClipName;

    let clipChanged = false;
    if (resolvedClipId && animator.currentClip !== resolvedClipId) {
      animator.currentClip = resolvedClipId;
      animator._activeClipId = '';
      animator._elapsedTime = 0;
      animator.isPlaying = true;
      if (matchedClip) matchedClip.frameIndex = 0;
      clipChanged = true;
    } else if (animator.currentClip && !animator.isPlaying) {
      animator.isPlaying = true;
    }

    pState.lastState = 'hit';
    pState.lastClip = animator.currentClip || resolvedClipId;

    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || resolvedClipId || '';
    outputs.activeState = 'hit';
    outputs.facingDirection = facing;
    outputs.isFlipped = shouldFlip;

    if (clipChanged) {
      outputs.onClipChanged = true;
    }
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: 'hit',
      facingDirection: facing,
      isFlipped: shouldFlip,
      onClipChanged: Boolean(outputs.onClipChanged)
    };
    Object.assign(outputs, result);
    return result;
  }

  const combatState = target._combat || state.platformerCombat;
  const isCombatAttacking = Boolean(
    (combatState && combatState.isAttacking) ||
    moveState === 'attack' ||
    moveState === 'attacking'
  );

  if (isCombatAttacking) {
    let autoFlipX = true;
    if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
      autoFlipX = false;
    }
    let shouldFlip = false;
    if (autoFlipX) {
      shouldFlip = (facing === 'left');
    }
    if (transform) {
      transform.flipX = shouldFlip;
      pState.prevX = transform.x;
      pState.prevY = transform.y;
    }
    pState.lastState = 'attack';
    pState.lastClip = animator.currentClip || '';
    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || '';
    outputs.activeState = 'attack';
    outputs.facingDirection = facing;
    outputs.isFlipped = shouldFlip;
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: 'attack',
      facingDirection: facing,
      isFlipped: shouldFlip,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  if (!moveState) {
    if (phys) {
      const isGrounded = Boolean(phys.isGrounded);
      const vy = Number(phys.velocityY) || 0;
      const vx = Number(phys.velocityX) || 0;
      if (!isGrounded) {
        if (vy < -10) moveState = 'jump';
        else if (vy > 10) moveState = 'fall';
        else moveState = 'jump';
      } else {
        const speed = Math.abs(vx);
        if (speed > 10) {
          if (phys && phys.movementState === 'walk' && walkCfg) moveState = 'walk';
          else if (walkCfg && !runCfg) moveState = 'walk';
          else if (walkCfg && runCfg && speed < 100) moveState = 'walk';
          else moveState = 'run';
        } else {
          moveState = 'idle';
        }
      }
    } else if (transform) {
      const dy = (typeof transform.y === 'number') ? transform.y - pState.prevY : 0;
      const dx = (typeof transform.x === 'number') ? transform.x - pState.prevX : 0;
      if (dy < -0.5) moveState = 'jump';
      else if (dy > 0.5) moveState = 'fall';
      else if (Math.abs(dx) > 0.2) {
        if (walkCfg && !runCfg) moveState = 'walk';
        else moveState = 'run';
      } else {
        moveState = 'idle';
      }
    } else {
      moveState = pState.lastState || 'idle';
    }
  }

  let selectedCfg = false;
  let resolvedState = moveState;

  if (moveState === 'fall') {
    if (fallCfg) selectedCfg = fallCfg;
    else if (jumpCfg) { selectedCfg = jumpCfg; resolvedState = 'jump'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'jump') {
    if (jumpCfg) selectedCfg = jumpCfg;
    else if (fallCfg) { selectedCfg = fallCfg; resolvedState = 'fall'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'walk') {
    if (walkCfg) selectedCfg = walkCfg;
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'run') {
    if (runCfg) selectedCfg = runCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else {
    resolvedState = 'idle';
    if (idleCfg) selectedCfg = idleCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
  }

  if (!selectedCfg) {
    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || '';
    outputs.activeState = moveState;
    outputs.facingDirection = facing;
    outputs.isFlipped = false;
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: moveState,
      facingDirection: facing,
      isFlipped: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  let autoFlipX = true;
  if (inputs.autoFlipX === false || inputs.autoFlipX === 'false') {
    autoFlipX = false;
  }

  const isSingle = Boolean(selectedCfg.isSingle);
  const targetClipName = (facing === 'left') ? selectedCfg.left : selectedCfg.right;

  let shouldFlip = false;
  if (isSingle && autoFlipX) {
    shouldFlip = (facing === 'left');
  }

  if (transform) {
    transform.flipX = shouldFlip;
  }

  const rawClips = animator.clips;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

  let matchedClip = false;
  if (targetClipName) {
    const targetLower = targetClipName.toLowerCase();
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      if (c.scriptId === targetClipName || c.id === targetClipName || c.name === targetClipName) {
        matchedClip = c;
        break;
      }
      if (String(c.scriptId || '').toLowerCase() === targetLower ||
          String(c.id || '').toLowerCase() === targetLower ||
          String(c.name || '').toLowerCase() === targetLower) {
        matchedClip = c;
        break;
      }
    }
  }

  const resolvedClipId = matchedClip ? matchedClip.id : targetClipName;

  let clipChanged = false;
  if (resolvedClipId && animator.currentClip !== resolvedClipId) {
    animator.currentClip = resolvedClipId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (matchedClip) matchedClip.frameIndex = 0;
    clipChanged = true;
  } else if (animator.currentClip && !animator.isPlaying) {
    animator.isPlaying = true;
  }

  if (transform) {
    pState.prevX = transform.x;
    pState.prevY = transform.y;
  }
  pState.lastState = resolvedState;
  pState.lastClip = animator.currentClip || resolvedClipId;

  outputs.execOut = true;
  outputs.currentClip = animator.currentClip || resolvedClipId || '';
  outputs.activeState = resolvedState;
  outputs.facingDirection = facing;
  outputs.isFlipped = shouldFlip;

  if (clipChanged) {
    outputs.onClipChanged = true;
  }
  const result = {
    execOut: true,
    currentClip: outputs.currentClip,
    activeState: resolvedState,
    facingDirection: facing,
    isFlipped: shouldFlip,
    onClipChanged: Boolean(outputs.onClipChanged)
  };
  Object.assign(outputs, result);
  return result;
}

__exports.processPlatformerController = processPlatformerController;
__exports.processPlatformerAnimator = processPlatformerAnimator;
};
// === Module: Toolkit/TopDown/TopDownHelper.js ===
__reg.m["Toolkit/TopDown/TopDownHelper.js"] = function(__require, __exports, __module) {
function parseClips(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) {
    return { down: parts[0], up: parts[0], right: parts[0], left: parts[0], isSingle: true };
  }

  const map = {};
  const directions = ['down_right', 'down_left', 'up_right', 'up_left', 'down', 'up', 'right', 'left'];
  const unassigned = [];

  for (const part of parts) {
    const lower = part.toLowerCase();
    let matchedDir = null;
    for (const dir of directions) {
      if (lower.includes(dir)) {
        matchedDir = dir;
        break;
      }
    }
    if (matchedDir && !map[matchedDir]) {
      map[matchedDir] = part;
    } else {
      unassigned.push(part);
    }
  }

  if (unassigned.length > 0) {
    const defaultOrder = ['down', 'up', 'right', 'left'];
    let uIdx = 0;
    for (const d of defaultOrder) {
      if (!map[d] && uIdx < unassigned.length) {
        map[d] = unassigned[uIdx++];
      }
    }
  }

  if (map.right && !map.left) {
    map.left = map.right;
    map.canFlipLeft = true;
  }

  const fallback = map.down || map.right || map.up || map.left || parts[0];
  map.down = map.down || fallback;
  map.up = map.up || fallback;
  map.right = map.right || fallback;
  map.left = map.left || fallback;

  return map;
}

function processTopDownController(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe) {
  const isDirect = !outputsMaybe && (!contextMaybe || typeof contextMaybe !== 'object');
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};

  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;
  const keyboard = context.input && context.input.keyboard;

  if (!state.topDownController) {
    state.topDownController = {
      wasMoving: false,
      lastDirection: 'down',
      lastAngle: 90
    };
  }
  const cState = state.topDownController;

  const keyUp = String(inputs.keyUp !== undefined ? inputs.keyUp : 'w').toLowerCase();
  const keyDown = String(inputs.keyDown !== undefined ? inputs.keyDown : 's').toLowerCase();
  const keyLeft = String(inputs.keyLeft !== undefined ? inputs.keyLeft : 'a').toLowerCase();
  const keyRight = String(inputs.keyRight !== undefined ? inputs.keyRight : 'd').toLowerCase();
  const keySprint = String(inputs.keySprint !== undefined ? inputs.keySprint : 'shift').toLowerCase();

  let dirX = 0;
  let dirY = 0;
  if (keyboard) {
    if (keyboard.isDown(keyRight)) dirX += 1;
    if (keyboard.isDown(keyLeft))  dirX -= 1;
    if (keyboard.isDown(keyDown))  dirY += 1;
    if (keyboard.isDown(keyUp))    dirY -= 1;
  }

  const normalizeDiag = inputs.normalizeDiagonal !== false && inputs.normalizeDiagonal !== 'false';
  if (normalizeDiag && dirX !== 0 && dirY !== 0) {
    const invSqrt2 = 1 / Math.SQRT2;
    dirX *= invSqrt2;
    dirY *= invSqrt2;
  }

  const isSprinting = Boolean(keySprint && keyboard && keyboard.isDown(keySprint));
  const sprintMult = Number(inputs.sprintMultiplier) || 1.5;
  const speed = Number(inputs.speed !== undefined ? inputs.speed : 200);
  const currentSpeed = speed * (isSprinting ? sprintMult : 1.0);

  const velocityX = dirX * currentSpeed;
  const velocityY = dirY * currentSpeed;
  const isMoving = (dirX !== 0 || dirY !== 0);

  let facingAngle = cState.lastAngle !== undefined ? cState.lastAngle : 90;
  let facingDirection = cState.lastDirection || 'down';
  const faceMouse = Boolean(inputs.faceMouse === true || inputs.faceMouse === 'true');

  if (faceMouse && context.input && context.input.mouse) {
    const mousePos = typeof context.input.mouse.getPosition === 'function'
      ? context.input.mouse.getPosition()
      : (context.input.mouse.position || context.input.mouse);
    if (mousePos && transform) {
      const dx = mousePos.x - transform.x;
      const dy = mousePos.y - transform.y;
      if (dx !== 0 || dy !== 0) {
        const rad = Math.atan2(dy, dx);
        let deg = (rad * 180) / Math.PI;
        if (deg < 0) deg += 360;
        facingAngle = Math.round(deg);
      }
    }
  } else if (isMoving) {
    const rad = Math.atan2(dirY, dirX);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    facingAngle = Math.round(deg);
  }

  if (isMoving || faceMouse) {
    if (facingAngle >= 315 || facingAngle < 45) {
      facingDirection = 'right';
    } else if (facingAngle >= 45 && facingAngle < 135) {
      facingDirection = 'down';
    } else if (facingAngle >= 135 && facingAngle < 225) {
      facingDirection = 'left';
    } else {
      facingDirection = 'up';
    }
    cState.lastDirection = facingDirection;
    cState.lastAngle = facingAngle;
  }

  const dt = typeof context.dt === 'number' ? context.dt : 0.016;
  const moveState = isMoving ? (isSprinting ? 'run' : 'walk') : 'idle';

  if (phys) {
    phys.velocityX = velocityX;
    phys.velocityY = velocityY;
    phys.movementState = moveState;
    phys.facingDirection = facingDirection;
    phys._isIntentionalMove = isMoving;
  } else if (context.collider && typeof context.collider.moveAndSlide === 'function') {
    context.collider.moveAndSlide(target, velocityX * dt, velocityY * dt);
  } else if (transform) {
    transform.x += velocityX * dt;
    transform.y += velocityY * dt;
  }

  const onMove = isMoving;
  const onStop = Boolean(cState.wasMoving && !isMoving);
  const onSprint = Boolean(isSprinting && isMoving);
  cState.wasMoving = isMoving;

  const result = {
    isMoving,
    isSprinting,
    movementState: moveState,
    facingDirection,
    facingAngle,
    velocityX,
    velocityY,
    onMove,
    onStop,
    onSprint,
    execOut: true
  };
  Object.assign(outputs, result);
  return result;
}

function processTopDownAnimator(stateOrParams, inputsOrContext, outputsMaybe, contextMaybe, nodeMaybe) {
  const isDirect = (arguments.length <= 2 && typeof stateOrParams === 'object' && !outputsMaybe && !contextMaybe);
  const inputs = isDirect ? stateOrParams : (inputsOrContext || {});
  const context = isDirect ? inputsOrContext : contextMaybe;
  const state = isDirect ? (context && context.state ? context.state : {}) : (stateOrParams || {});
  const outputs = (!isDirect && outputsMaybe) ? outputsMaybe : {};
  const node = isDirect ? (inputs && inputs._node ? inputs._node : null) : nodeMaybe;

  const targetId = inputs.targetEntity || 'self';
  const target = context.assert.exists(context.entity.get(targetId));
  const animator = context.assert.hasComponent(target, 'SpriteAnimator');
  const phys = target.components && target.components.Physics;
  const transform = target.components && target.components.Transform;

  if (!state.topDownAnim) {
    state.topDownAnim = {
      lastState: 'idle',
      lastFacing: 'down',
      lastClip: '',
      prevX: transform ? transform.x : 0,
      prevY: transform ? transform.y : 0
    };
  }
  const aState = state.topDownAnim;

  const idleInput = String(inputs.idleClips || (node && node.data && node.data.values && node.data.values.idleClips) || '');
  const walkInput = String(inputs.walkClips || (node && node.data && node.data.values && node.data.values.walkClips) || '');
  const runInput = String(inputs.runClips || (node && node.data && node.data.values && node.data.values.runClips) || '');
  const hitInput = String(inputs.hitClips || (node && node.data && node.data.values && node.data.values.hitClips) || '');

  const idleCfg = parseClips(idleInput);
  const walkCfg = parseClips(walkInput);
  const runCfg = parseClips(runInput);
  const hitCfg = parseClips(hitInput);

  let facing = '';
  const inputFacing = String(inputs.facingDirection || '').trim().toLowerCase();
  if (['down', 'up', 'left', 'right', 'down_left', 'down_right', 'up_left', 'up_right'].includes(inputFacing)) {
    facing = inputFacing;
  } else if (phys && phys.facingDirection) {
    facing = String(phys.facingDirection).trim().toLowerCase();
  } else if (phys && (phys.velocityX !== 0 || phys.velocityY !== 0)) {
    const vx = Number(phys.velocityX) || 0;
    const vy = Number(phys.velocityY) || 0;
    const rad = Math.atan2(vy, vx);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    if (deg >= 315 || deg < 45) facing = 'right';
    else if (deg >= 45 && deg < 135) facing = 'down';
    else if (deg >= 135 && deg < 225) facing = 'left';
    else facing = 'up';
  } else if (transform) {
    const dx = transform.x - aState.prevX;
    const dy = transform.y - aState.prevY;
    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
      const rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI;
      if (deg < 0) deg += 360;
      if (deg >= 315 || deg < 45) facing = 'right';
      else if (deg >= 45 && deg < 135) facing = 'down';
      else if (deg >= 135 && deg < 225) facing = 'left';
      else facing = 'up';
    }
  }

  if (!facing) {
    facing = aState.lastFacing || 'down';
  }
  aState.lastFacing = facing;

  let moveState = '';
  const inputState = String(inputs.movementState || '').trim().toLowerCase();
  if (inputState) {
    if (inputState === 'idle' || inputState === 'stand') moveState = 'idle';
    else if (inputState === 'walk' || inputState === 'walking') moveState = 'walk';
    else if (inputState === 'running' || inputState === 'run' || inputState === 'sprint') moveState = 'run';
    else if (inputState === 'hit' || inputState === 'hurt' || inputState === 'damaged') moveState = 'hit';
    else moveState = inputState;
  } else if (phys) {
    const spd = Math.hypot(phys.velocityX || 0, phys.velocityY || 0);
    if (spd > 10) {
      if (phys.movementState === 'run' && runCfg) moveState = 'run';
      else if (walkCfg && !runCfg) moveState = 'walk';
      else if (walkCfg && runCfg && spd < 120) moveState = 'walk';
      else moveState = 'run';
    } else {
      moveState = 'idle';
    }
  } else {
    moveState = aState.lastState || 'idle';
  }

  const isHitInput = Boolean(inputs.isHit === true || inputs.isHit === 'true');
  const isHit = isHitInput || (moveState === 'hit');

  let selectedCfg = null;
  let resolvedState = moveState;

  if (isHit && hitCfg) {
    selectedCfg = hitCfg;
    resolvedState = 'hit';
  } else if (moveState === 'run') {
    if (runCfg) selectedCfg = runCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else if (moveState === 'walk') {
    if (walkCfg) selectedCfg = walkCfg;
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
    else if (idleCfg) { selectedCfg = idleCfg; resolvedState = 'idle'; }
  } else {
    resolvedState = 'idle';
    if (idleCfg) selectedCfg = idleCfg;
    else if (walkCfg) { selectedCfg = walkCfg; resolvedState = 'walk'; }
    else if (runCfg) { selectedCfg = runCfg; resolvedState = 'run'; }
  }

  if (!selectedCfg) {
    outputs.execOut = true;
    outputs.currentClip = animator.currentClip || '';
    outputs.activeState = moveState;
    outputs.facingDirection = facing;
    outputs.isFlipped = false;
    const result = {
      execOut: true,
      currentClip: outputs.currentClip,
      activeState: moveState,
      facingDirection: facing,
      isFlipped: false,
      onClipChanged: false
    };
    Object.assign(outputs, result);
    return result;
  }

  const directionMode = String(inputs.directionMode || '4way').toLowerCase();
  const autoFlipX = inputs.autoFlipX !== false && inputs.autoFlipX !== 'false';

  if (directionMode === 'rotation') {
    const angle = Number(inputs.facingAngle) || 0;
    if (transform) {
      transform.rotation = angle;
    }
  }

  let targetClipName = selectedCfg[facing] || selectedCfg.down || selectedCfg.right || '';
  let shouldFlip = false;

  if (facing === 'left' && autoFlipX) {
    if (selectedCfg.canFlipLeft || selectedCfg.left === selectedCfg.right || selectedCfg.isSingle) {
      shouldFlip = true;
      targetClipName = selectedCfg.right || selectedCfg.down || '';
    }
  }

  if (transform) {
    transform.flipX = shouldFlip;
    aState.prevX = transform.x;
    aState.prevY = transform.y;
  }

  const rawClips = animator.clips;
  const clips = Array.isArray(rawClips) ? rawClips : (rawClips && typeof rawClips === 'object' ? Object.values(rawClips) : []);

  let matchedClip = null;
  if (targetClipName) {
    const targetLower = targetClipName.toLowerCase();
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      if (c.scriptId === targetClipName || c.id === targetClipName || c.name === targetClipName) {
        matchedClip = c;
        break;
      }
      if (String(c.scriptId || '').toLowerCase() === targetLower ||
          String(c.id || '').toLowerCase() === targetLower ||
          String(c.name || '').toLowerCase() === targetLower) {
        matchedClip = c;
        break;
      }
    }
  }

  const resolvedClipId = matchedClip ? matchedClip.id : targetClipName;
  let clipChanged = false;

  if (resolvedClipId && animator.currentClip !== resolvedClipId) {
    animator.currentClip = resolvedClipId;
    animator._activeClipId = '';
    animator._elapsedTime = 0;
    animator.isPlaying = true;
    if (matchedClip) matchedClip.frameIndex = 0;
    clipChanged = true;
  } else if (animator.currentClip && !animator.isPlaying) {
    animator.isPlaying = true;
  }

  aState.lastState = resolvedState;
  aState.lastClip = animator.currentClip || resolvedClipId;

  const result = {
    execOut: true,
    currentClip: animator.currentClip || resolvedClipId || '',
    activeState: resolvedState,
    facingDirection: facing,
    isFlipped: shouldFlip,
    onClipChanged: clipChanged
  };
  Object.assign(outputs, result);
  return result;
}

__exports.processTopDownController = processTopDownController;
__exports.processTopDownAnimator = processTopDownAnimator;
};
})();
//# sourceMappingURL=lupis.vm.js.map
