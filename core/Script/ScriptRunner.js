// ScriptRunner.js
export default class ScriptRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game;
        this.data = scriptData;
        this.owner = ownerEntity;

        this.nodeMap = new Map();
        if (this.data.nodes) {
            this.data.nodes.forEach(node => this.nodeMap.set(node.id, node));
        }
        
        this.edges = this.data.edges || [];
        this.localVariables = new Map();
        this.nameToIdMap = new Map();

        this._compiledFunctions = new Map();
        this._registeredEvents = []; 
        this._customTickListeners = new Map();

        this._initVariables();
        this._compileAllNodes();
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
            const rawCode = node.data ? node.data.code : undefined;
            if (!rawCode || typeof rawCode !== 'string') return;

            try {
                const factory = new Function(`
                    return function execute(inputs, outputs, context, node) {
                        ${rawCode}
                        return outputs;
                    }
                `);

                this._compiledFunctions.set(nodeId, factory());
            } catch (err) {
                const headerTitle = node.settings ? node.settings.headerTitle : undefined;
                console.error(`[ScriptRunner] Syntax error di node '${headerTitle || nodeId}':`, err);
            }
        });
    }

    getLocalVariable(varName) {
        const id = this.nameToIdMap.get(varName);
        if (!id) {
            console.warn(`[ScriptRunner] Variabel '${varName}' tidak terdaftar pada schema Script.`);
            return null;
        }

        const val = this.localVariables.get(id);
        return (val !== undefined && val !== null) ? val : null;
    }

    setLocalVariable(varName, value) {
        const id = this.nameToIdMap.get(varName);
        if (!id) {
            console.error(`[Runtime Error] Dilarang membuat variabel baru '${varName}' saat runtime. Buat variabel melalui Editor!`);
            return;
        }

        this.localVariables.set(id, value);
    }

    start() {
        if (!this._isScriptActive()) return;
        if (!this.data.nodes) return;

        this.data.nodes.forEach(node => {
            const hasExecInput = node.inputs ? node.inputs.some(i => i.dataType === 'execution') : false;
            if (!hasExecInput) {
                this._executeNodeLogic(node, null);
            }
        });
    }

    update(dt) {
        if (!this._isScriptActive()) return;

        if (this._customTickListeners) {
            this._customTickListeners.forEach((callback) => {
                callback(dt);
            });
        }
    }

    // =========================================================================
    // RESOLVER PORT & ALIAS (Engine Level Handling)
    // =========================================================================
    _resolvePortValue(dictionary, node, key) {
        if (!dictionary || !key) return undefined;
        
        if (dictionary[key] !== undefined) return dictionary[key];

        if (node && node.outputs) {
            const port = node.outputs.find(p => p.id === key || p.label === key);
            if (port) {
                if (dictionary[port.id] !== undefined) return dictionary[port.id];
                if (dictionary[port.label] !== undefined) return dictionary[port.label];
            }
        }

        const lowerKey = String(key).toLowerCase();
        for (const dictKey of Object.keys(dictionary)) {
            if (dictKey.toLowerCase() === lowerKey) return dictionary[dictKey];
        }

        return undefined;
    }

    getAllInputValues(node) {
        const inputs = {};
        if (!node.inputs) return inputs;

        node.inputs.forEach(port => {
            if (port.dataType === 'execution') return;

            const edge = this.edges.find(e => 
                e.target === node.id && 
                (e.targetHandle === port.id || e.targetHandle === port.label)
            );
            
            let val = undefined;
            if (edge) {
                const sourceNode = this.nodeMap.get(edge.source);
                val = this._getNodeOutputValue(sourceNode, edge.sourceHandle);
            }

            if (val === undefined) {
                const values = node.data ? node.data.values : undefined;
                if (values) {
                    val = values[port.id] !== undefined ? values[port.id] : values[port.label];
                }
                if (val === undefined || val === null) {
                    val = port.defaultValue;
                }
            }

            // Mendaftarkan seluruh alias key ke objek inputs
            if (port.id) inputs[port.id] = val;
            if (port.label) inputs[port.label] = val;
            if (port.id) inputs[port.id.toLowerCase()] = val;
            if (port.label) inputs[port.label.toLowerCase()] = val;
        });

        return inputs;
    }

    executeFlow(sourceNodeId, sourcePortName) {
        if (!this._isScriptActive()) return;

        const sourceNode = this.nodeMap.get(sourceNodeId);

        const connectedEdges = this.edges.filter(e => {
            if (e.source !== sourceNodeId) return false;
            if (e.sourceHandle === sourcePortName) return true;

            if (sourceNode && sourceNode.outputs) {
                const matchedPort = sourceNode.outputs.find(
                    p => p.id === sourcePortName || p.label === sourcePortName
                );
                if (matchedPort) {
                    return e.sourceHandle === matchedPort.id || e.sourceHandle === matchedPort.label;
                }
            }
            return false;
        });

        if (connectedEdges.length === 0) return;

        connectedEdges.forEach(edge => {
            const targetNode = this.nodeMap.get(edge.target);
            if (targetNode) {
                this._executeNodeLogic(targetNode, edge.targetHandle);
            }
        });
    }

    _executeNodeLogic(node, inputKey) {
        try {
            const compiledFn = this._compiledFunctions.get(node.id);

            if (typeof compiledFn === 'function') {
                const inputs = this.getAllInputValues(node);
                const outputs = {};
                const context = this.game.contextSystem.createExecutionContext(this, node);

                compiledFn(inputs, outputs, context, node);

                // Normalisasi output ke ID & Label
                if (node.outputs && Array.isArray(node.outputs)) {
                    node.outputs.forEach(port => {
                        const val = this._resolvePortValue(outputs, node, port.id) ?? 
                                    this._resolvePortValue(outputs, node, port.label);
                        
                        if (val !== undefined) {
                            outputs[port.id] = val;
                            outputs[port.label] = val;
                        }
                    });
                }

                node._tempData = node._tempData || {};
                Object.assign(node._tempData, outputs);

                const executedPortIds = new Set();
                if (node.outputs && Array.isArray(node.outputs)) {
                    node.outputs.forEach(port => {
                        if (port.dataType !== 'execution') return;

                        const isTriggered = outputs[port.id] === true || outputs[port.label] === true;
                        if (isTriggered && !executedPortIds.has(port.id)) {
                            executedPortIds.add(port.id);
                            this.executeFlow(node.id, port.id);
                        }
                    });
                }
            } else {
                this.executeFlow(node.id, 'exec_out');
            }
        } catch (err) {
            const headerTitle = node.settings ? node.settings.headerTitle : undefined;
            console.error(`[ScriptRunner] Runtime error pada node '${headerTitle || node.id}':`, err);
        }
    }

    _getNodeOutputValue(node, outputKey) {
        if (!node) return null;

        const hasExecutionInput = node.inputs ? node.inputs.some(i => i.dataType === 'execution') : false;

        if (!hasExecutionInput) {
            const compiledFn = this._compiledFunctions.get(node.id);
            if (typeof compiledFn === 'function') {
                const inputs = this.getAllInputValues(node);
                const outputs = {};
                const context = this.game.contextSystem.createExecutionContext(this, node);

                compiledFn(inputs, outputs, context, node);
                
                const val = this._resolvePortValue(outputs, node, outputKey);
                if (val !== undefined) return val;
            }
        }

        if (node._tempData) {
            const val = this._resolvePortValue(node._tempData, node, outputKey);
            if (val !== undefined) return val;
        }

        const values = node.data ? node.data.values : undefined;
        return (values && values[outputKey] !== undefined) ? values[outputKey] : null;
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
    }
}