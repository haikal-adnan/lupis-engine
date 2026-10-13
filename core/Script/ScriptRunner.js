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
                // Gunakan argumen terpisah agar aman dari konflik tanda kutip/backtick
                const fn = new Function('inputs', 'outputs', 'context', 'node', String(rawCode) + '\nreturn outputs;');
                this._compiledFunctions.set(nodeId, fn);
            } catch (err) {
                const headerTitle = node.settings ? node.settings.headerTitle : undefined;
                console.error(`[ScriptRunner] Syntax error di node '${headerTitle || nodeId}':`, err);
            }
        });
    }

    // Mendukung pencarian via ID maupun Name
    getLocalVariable(key) {
        if (!key) return null;
        const id = this.localVariables.has(key) ? key : this.nameToIdMap.get(key);
        if (!id) {
            console.warn(`[ScriptRunner] Variabel '${key}' tidak terdaftar pada schema Script.`);
            return null;
        }

        const val = this.localVariables.get(id);
        return (val !== undefined && val !== null) ? val : null;
    }

    setLocalVariable(key, value) {
        if (!key) return;
        const id = this.localVariables.has(key) ? key : this.nameToIdMap.get(key);
        if (!id) {
            console.error(`[Runtime Error] Dilarang membuat variabel baru '${key}' saat runtime. Buat variabel melalui Editor!`);
            return;
        }

        this.localVariables.set(id, value);
    }

    // Resolusi umum: Cek Local terlebih dahulu, lalu Global
    getVariable(key) {
        if (!key) return null;

        if (this.localVariables.has(key) || this.nameToIdMap.has(key)) {
            return this.getLocalVariable(key);
        }

        if (this.game && this.game.variables) {
            const varMgr = this.game.variables;
            if (varMgr.hasGlobal(key) || varMgr.globals?.has(key)) {
                return varMgr.getGlobal(key);
            }
        }

        return null;
    }

    // Penerapan modifier operasi matematika, boolean, koleksi, dan template string
    _applyVariableModifier(rawVal, modifier) {
        if (!modifier) return rawVal;

        let val = rawVal;
        const modType = modifier.type;
        const modValue = modifier.value;

        if (modType && modType !== 'none') {
            switch (modType) {
                case 'add':
                    val = (Number(val) || 0) + (Number(modValue) || 0);
                    break;
                case 'subtract':
                    val = (Number(val) || 0) - (Number(modValue) || 0);
                    break;
                case 'multiply':
                    val = (Number(val) || 0) * (Number(modValue) || 0);
                    break;
                case 'divide': {
                    const divisor = Number(modValue) || 0;
                    val = divisor !== 0 ? (Number(val) || 0) / divisor : 0;
                    break;
                }
                case 'invert':
                    val = -(Number(val) || 0);
                    break;
                case 'abs':
                    val = Math.abs(Number(val) || 0);
                    break;
                case 'not':
                    val = !val;
                    break;
                case 'at_index':
                    val = Array.isArray(val) ? val[Number(modValue) || 0] : null;
                    break;
                case 'first':
                    val = Array.isArray(val) ? val[0] : null;
                    break;
                case 'last':
                    val = Array.isArray(val) && val.length > 0 ? val[val.length - 1] : null;
                    break;
                case 'random':
                    val = Array.isArray(val) && val.length > 0 
                        ? val[Math.floor(Math.random() * val.length)] 
                        : null;
                    break;
                case 'count':
                    val = Array.isArray(val) ? val.length : 0;
                    break;
            }
        }

        // Format template teks: "Hey : {value}"
        const format = modifier.format || modifier.customText;
        if (format && typeof format === 'string') {
            const strVal = String(val ?? '');
            val = format
                .replace(/\{value\.upper\}/g, strVal.toUpperCase())
                .replace(/\{value\.lower\}/g, strVal.toLowerCase())
                .replace(/\{value\}/g, strVal);
        }

        return val;
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
        if (!node.inputs) return {};

        const rawValues = {};
        const aliasMap = new Map();

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

            // 1. Cek Mode Variabel jika tidak ada kabel
            if (val === undefined) {
                const portId = port.id;
                const portLabel = port.label;

                const valueModes = node.data?.valueModes;
                const mode = (valueModes && (valueModes[portId] || valueModes[portLabel])) || 'input';

                if (mode === 'variable') {
                    const varBindings = node.data?.variableBindings;
                    const boundVar = varBindings && (varBindings[portId] || varBindings[portLabel]);

                    if (boundVar) {
                        const rawVarVal = this.getVariable(boundVar);
                        const varModifiers = node.data?.variableModifiers;
                        const modifier = varModifiers && (varModifiers[portId] || varModifiers[portLabel]);
                        val = this._applyVariableModifier(rawVarVal, modifier);
                    }
                }
            }

            // 2. Fallback ke Direct Input Values
            if (val === undefined) {
                const values = node.data ? node.data.values : undefined;
                if (values) {
                    val = values[port.id] !== undefined ? values[port.id] : values[port.label];
                }
                if (val === undefined || val === null) {
                    val = port.defaultValue;
                }
            }

            const canonicalKey = port.id || port.label;
            rawValues[canonicalKey] = val;

            if (port.id) {
                aliasMap.set(port.id, canonicalKey);
                aliasMap.set(port.id.toLowerCase(), canonicalKey);
            }
            if (port.label) {
                aliasMap.set(port.label, canonicalKey);
                aliasMap.set(port.label.toLowerCase(), canonicalKey);
            }
        });

        return new Proxy(rawValues, {
            get(target, prop) {
                if (typeof prop === 'string') {
                    if (prop in target) return target[prop];
                    const mappedKey = aliasMap.get(prop) || aliasMap.get(prop.toLowerCase());
                    if (mappedKey && mappedKey in target) {
                        return target[mappedKey];
                    }
                }
                return target[prop];
            },
            has(target, prop) {
                if (typeof prop === 'string') {
                    if (prop in target) return true;
                    const mappedKey = aliasMap.get(prop) || aliasMap.get(prop.toLowerCase());
                    return Boolean(mappedKey && mappedKey in target);
                }
                return prop in target;
            },
            set(target, prop, value) {
                if (typeof prop === 'string') {
                    const mappedKey = aliasMap.get(prop) || aliasMap.get(prop.toLowerCase());
                    if (mappedKey) {
                        target[mappedKey] = value;
                        return true;
                    }
                }
                target[prop] = value;
                return true;
            }
        });
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

                node._tempData = node._tempData || {};
                Object.assign(node._tempData, outputs);
                
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