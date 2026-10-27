import { applyModifiers } from './ValueModifier.js';
import { ScriptAssertionError } from './ContextSystem.js';
import LupisPackageHelper from '../Util/LupisPackageHelper.js';
import { formatScriptPrefix } from '../Util/ScriptContextUtils.js';

// Visual script graph executor managing flow propagation, data resolution, and node lifecycles
export default class ScriptRunner {
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
