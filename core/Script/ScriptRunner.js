import { applyModifiers } from './ValueModifier.js';
import { ScriptAssertionError } from './ContextSystem.js';

/**
 * ScriptRunner.js
 * Universal, type-agnostic node graph executor for Lupis Engine.
 * 
 * Rules:
 * 1. Operates purely on raw pre-processed values from Editor Gate 1.
 * 2. No port labels, no aliases, no proxies, no type guessing.
 * 3. O(1) flow and data lookup via pre-indexed adjacency maps.
 * 4. Runtime errors carry full context: scriptId, nodeId, node type.
 */
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

        // Edge adjacency maps for O(1) traversal
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
                sourcePortId: edge.sourceHandle
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
            const rawCode = node.code !== undefined ? node.code : (node.data ? node.data.code : undefined);
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
                console.error(`[ScriptRunner] Syntax error di node '${meta.node}' (script: '${this.scriptId}'):`, err);
            }
        });
    }

    getContextMetadata(node) {
        const sceneName = this.game?.sceneSystem?.getCurrentSceneName?.() || 
                          this.game?.world?.currentSceneName || 
                          this.game?.world?.currentScene?.name || 
                          this.game?.sceneSystem?.getCurrentSceneId?.() || 
                          'Scene';
        const entityScriptId = this.owner 
            ? (this.owner.scriptId || this.owner.name || this.owner.id || 'Entity') 
            : 'Global';
        const scriptName = this.data?.name || 
                           this.game?.world?.scripts?.[this.scriptId]?.name || 
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
            prefix: `[${sceneName}] [${entityScriptId}] [${scriptName}] [${nodeName}]`
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

    getVariable(key) {
        if (!key) return null;
        if (this.localVariables.has(key) || this.nameToIdMap.has(key)) {
            return this.getLocalVariable(key);
        }
        if (this.game && this.game.variables) {
            return this.game.variables.getGlobal(key);
        }
        return null;
    }

    start() {
        if (!this._isScriptActive()) return;

        this.nodeMap.forEach(node => {
            const role = node.role || (node.inputs?.some(i => i.dataType === 'execution') ? 'action' : (node.outputs?.some(o => o.dataType === 'execution') ? 'event' : 'pure'));
            if (role === 'event') {
                this._executeNodeLogic(node, null);
            }
        });
    }

    update(dt) {
        if (!this._isScriptActive()) return;

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

    getAllInputValues(node) {
        const rawInputs = {};
        const inputsList = node.inputs || [];

        for (let i = 0; i < inputsList.length; i++) {
            const port = inputsList[i];
            if (port.dataType === 'execution') continue;

            const portId = port.id;
            let val = undefined;

            // Compiled payload format
            if (port.source) {
                if (port.source.kind === 'edge') {
                    const edgeInfo = this.dataIndex.get(`${node.id}:${portId}`);
                    if (edgeInfo) {
                        const sourceNode = this.nodeMap.get(edgeInfo.sourceNodeId);
                        val = this._getNodeOutputValue(sourceNode, edgeInfo.sourcePortId);
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
                // Fallback for standard/uncompiled node graph
                const edgeInfo = this.dataIndex.get(`${node.id}:${portId}`);
                if (edgeInfo) {
                    const sourceNode = this.nodeMap.get(edgeInfo.sourceNodeId);
                    val = this._getNodeOutputValue(sourceNode, edgeInfo.sourcePortId);
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

    executeFlow(sourceNodeId, sourcePortName) {
        if (!this._isScriptActive()) return;

        const targets = this.flowIndex.get(`${sourceNodeId}:${sourcePortName}`);
        if (!targets || targets.length === 0) return;

        for (let i = 0; i < targets.length; i++) {
            const { targetNodeId, targetPortId } = targets[i];
            const targetNode = this.nodeMap.get(targetNodeId);
            if (targetNode) {
                this._executeNodeLogic(targetNode, targetPortId);
            }
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
            const context = this.game.contextSystem.createExecutionContext(this, node);

            compiledFn(inputs, outputs, context, node);

            // Trigger connected execution output flows
            const outputsList = node.outputs || [];
            for (let i = 0; i < outputsList.length; i++) {
                const port = outputsList[i];
                if (port.dataType === 'execution' && outputs[port.id] === true) {
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
                if (typeof compiledFn === 'function') {
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