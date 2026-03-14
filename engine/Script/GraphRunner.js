import { NodeRegistry } from './NodeRegistry.js';

export default class GraphRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game;
        this.data = scriptData;
        this.owner = ownerEntity;

        this.currentDt = 0;
        this.nodeMap = new Map();
        
        if (this.data.nodes) {
            this.data.nodes.forEach(node => this.nodeMap.set(node._id, node));
        }
        
        this.edges = this.data.edges || [];
        this.localVariables = new Map();

        this._holdNodes = [];
        this._dragNodes = [];
        this._tickNodes = [];
        
        // [DITAMBAHKAN] Array untuk menyimpan referensi event agar bisa dihapus
        this._registeredEvents = []; 

        this._lastPointer = { x: 0, y: 0 };
        this._keyStates = {};

        this._initVariables();
        this._setupEventListeners();
    }

    _isScriptActive() {
        if (!this.owner) return true;
        
        if (this.owner.components?.ScriptController) {
            const scriptInstance = this.owner.components.ScriptController.data
                .find(s => s.assetId === this.data._id);
            
            if (scriptInstance && scriptInstance.active === false) {
                return false;
            }
        }
        return true;
    }

    _initVariables() {
        // [DIPERBARUI] Pastikan localVariables bersih sebelum diinisialisasi ulang
        this.localVariables.clear();
        const source = this.data.variables || this.data.exposedVariables || [];
        source.forEach(v => {
            this.localVariables.set(v._id, v.defaultValue);
        });
    }

    // [DITAMBAHKAN] Method untuk mereset variabel lokal
    resetLocalVariables() {
        this._initVariables();
    }

    start() {
        if (!this._isScriptActive()) return;
        if (!this.data.nodes) return;

        this.data.nodes
            .filter(n => n.type === 'event_game_start' || n.type === 'event_scene_start')
            .forEach(node => {
                this.executeFlow(node._id, 'out'); 
            });
    }

    _setupEventListeners() {
        if (!this.data.nodes) return;
        
        this._tickNodes = [];
        this._holdNodes = [];
        this._dragNodes = [];

        // [DITAMBAHKAN] Fungsi bantu untuk membungkus event.on agar tercatat
        const registerEvent = (eventName, callback) => {
            this.game.events.on(eventName, callback);
            this._registeredEvents.push({ eventName, callback });
        };

        this.data.nodes.forEach(node => {

            if (node.type === 'event_any_key') {
                registerEvent('input:keydown', (k) => {
                    if (!this._isScriptActive()) return;
                    node._tempData = { key_string: String(k).toLowerCase() };
                    this.executeFlow(node._id, 'out_exec');
                });
            }

            // --- EVENT: KEY DOWN ---
            else if (node.type === 'event_simple_key') {
                const keyTarget = node.data?.key?.toLowerCase();
                registerEvent('input:keydown', (k) => {
                    if (!this._isScriptActive()) return;
                    if (k === keyTarget) this.executeFlow(node._id, 'sk_main');
                });
            } 
            // --- EVENT: KEY UP ---
            else if (node.type === 'event_simple_key_up') {
                const keyTarget = node.data?.key?.toLowerCase();
                registerEvent('input:keyup', (k) => {
                    if (!this._isScriptActive()) return;
                    if (k === keyTarget) this.executeFlow(node._id, 'sk_up_main');
                });
            }
            // --- EVENT: POINTER CLICK ---
            else if (node.type === 'event_pointer_click') {
                const config = Array.isArray(node.data) ? node.data[0] : node.data;
                const btnTarget = config?.button || 'left';
                registerEvent('input:pointerdown', (e) => {
                    if (!this._isScriptActive()) return;
                    if (e.button === btnTarget) {
                        node._tempData = { pos_x: e.x, pos_y: e.y };
                        this.executeFlow(node._id, config._id || 'ptr_click_main');
                    }
                });
            } 
            // --- EVENT: ADVANCED KEY (HOLD LOGIC) ---
            else if (node.type === 'event_advanced_key') {
                const mappings = node.data?.mappings || [];
                mappings.forEach(map => {
                    const outputId = `out_${map._id}`;
                    const keyTarget = map.key.toLowerCase();
                    
                    if (map.trigger === 'press') {
                        registerEvent('input:keydown', (k) => {
                            if (k === keyTarget && this._isScriptActive()) this.executeFlow(node._id, outputId);
                        });
                    } else if (map.trigger === 'release') {
                        registerEvent('input:keyup', (k) => {
                            if (k === keyTarget && this._isScriptActive()) this.executeFlow(node._id, outputId);
                        });
                    } else if (map.trigger === 'hold') {
                        this._holdNodes.push({ 
                            node, map, outputId, keyTarget,
                            currentHoldTime: 0, hasFiredOnce: false 
                        });
                    }
                });
            }
            else if (node.type === 'event_pointer_drag') {
                this._dragNodes.push(node);
            } 
            else if (node.type === 'event_tick') {
                this._tickNodes.push(node);
            }
        });
    }

    // [DITAMBAHKAN] Method krusial untuk mencegah memory leak saat scene berganti!
    destroy() {
        // Cabut semua event listener yang nempel di game.events
        this._registeredEvents.forEach(({ eventName, callback }) => {
            if (this.game.events.off) {
                this.game.events.off(eventName, callback);
            }
        });
        this._registeredEvents = [];
        
        // Bersihkan state nodes & variables
        this.localVariables.clear();
        this._holdNodes = [];
        this._dragNodes = [];
        this._tickNodes = [];
        this.nodeMap.clear();
    }

    update(dt) {
        if (!this._isScriptActive()) return;
        this.currentDt = dt;
        
        if (this.owner && this.owner.components && this.owner.components.Transform) {
            const t = this.owner.components.Transform;
            t.prevX = t.x;
            t.prevY = t.y;
        }

        this._tickNodes.forEach(node => {
            node._tempData = { dt: dt };
            this.executeFlow(node._id, 'out');
        });

        this._holdNodes.forEach(item => {
            if (this.game.input.keyboard.isDown(item.keyTarget)) {
                item.currentHoldTime += (dt * 1000); 

                if (item.currentHoldTime >= item.map.threshold) {
                    
                    if (item.map.repeat) {
                        this.executeFlow(item.node._id, item.outputId);
                        item.currentHoldTime = 0; 
                    } else if (!item.hasFiredOnce) {
                        this.executeFlow(item.node._id, item.outputId);
                        item.hasFiredOnce = true;
                    }
                    
                }
            } else {
                item.currentHoldTime = 0;
                item.hasFiredOnce = false;
            }
        });

        if (this._dragNodes.length > 0) {
            const pointer = this.game.input.getPointer();
            
            if (pointer.down) {
                const dx = pointer.x - this._lastPointer.x;
                const dy = pointer.y - this._lastPointer.y;
                
                this._dragNodes.forEach(node => {
                    node._tempData = { 
                        delta_x: dx, 
                        delta_y: dy, 
                        pos_x: pointer.x, 
                        pos_y: pointer.y 
                    };
                    this.executeFlow(node._id, 'drag_active');
                });
            }
            this._lastPointer = { x: pointer.x, y: pointer.y };
        }
    }

    executeFlow(sourceNodeId, sourcePortName) {
        const edge = this.edges.find(e =>
            e.source === sourceNodeId && e.sourceHandle === sourcePortName
        );

        if (!edge) return;

        const targetNode = this.nodeMap.get(edge.target);
        if (targetNode) {
            this._executeNodeLogic(targetNode);
        }
    }

    _executeNodeLogic(node) {
        try {
            const processor = NodeRegistry[node.type] || NodeRegistry['default'];
            
            if (processor && typeof processor.execute === 'function') {
                processor.execute(this, node);
            } else {
                this.executeFlow(node._id, 'out');
            }
        } catch (err) {
            console.error(`[GraphRunner] Error at node '${node.type}' (${node.label}):`, err);
        }
    }

    getInputValue(node, inputKey) {
        const edge = this.edges.find(e => e.target === node._id && e.targetHandle === inputKey);
        
        if (edge) {
            const sourceNode = this.nodeMap.get(edge.source);
            return this._getNodeOutputValue(sourceNode, edge.sourceHandle);
        }

        if (node.data?.values && node.data.values[inputKey] !== undefined) {
            return node.data.values[inputKey];
        }

        if (node.data && node.data[inputKey] !== undefined) {
            return node.data[inputKey];
        }

        if (node.inputs) {
            const inputDef = node.inputs.find(i => i._id === inputKey);
            if (inputDef && inputDef.value !== undefined) {
                return inputDef.value;
            }
        }

        return null;
    }

    _getNodeOutputValue(node, outputKey) {
        if (node._tempData && outputKey in node._tempData) {
            return node._tempData[outputKey];
        }

        const processor = NodeRegistry[node.type];
        if (processor && typeof processor.getOutput === 'function') {
            return processor.getOutput(this, node, outputKey);
        }

        return node.data?.[outputKey] ?? null;
    }

    resolveEntity(targetScriptId) {
        if (!targetScriptId || typeof targetScriptId !== 'string') {
            return this.owner;
        }

        const foundEntity = this.game.world.entities.find(
            e => e.scriptId === targetScriptId
        );
        
        return foundEntity || null;
    }

    resolveLayer(targetScriptId) {
        if (!targetScriptId || typeof targetScriptId !== 'string') {
            if (this.owner && this.owner.layerId && this.game.world.allLayers) {
                return this.game.world.allLayers.find(
                    l => l._id === this.owner.layerId || l.scriptId === this.owner.layerId
                ) || null;
            }
            return null;
        }

        if (!this.game.world.allLayers) return null;

        const foundLayer = this.game.world.allLayers.find(
            l => l.scriptId === targetScriptId
        );
        
        return foundLayer || null;
    }

    getVariableValue(varId, scope = 'Local') {
        if (scope === 'Global') {
            if (this.game.variables) {
                return this.game.variables.getGlobal(varId);
            }
            console.warn('[GraphRunner] VariableManager not found on Game instance.');
            return null;
        } else {
            return this.localVariables.get(varId);
        }
    }

    setVariableValue(varId, value, scope = 'Local') {
        if (scope === 'Global') {
            if (this.game.variables) {
                this.game.variables.setGlobal(varId, value);
            } else {
                console.warn('[GraphRunner] Cannot set global var: VariableManager missing.');
            }
        } else {
            this.localVariables.set(varId, value);
        }
    }
}