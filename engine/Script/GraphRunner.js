import { NodeRegistry } from './NodeRegistry.js';

export default class GraphRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game;
        this.data = scriptData;
        this.owner = ownerEntity;
        this.currentDt;
        this.nodeMap = new Map();
        if (this.data.nodes) {
            this.data.nodes.forEach(node => this.nodeMap.set(node._id, node));
        }
        this.edges = this.data.edges || [];
        this.localVariables = new Map();
        this._holdNodes = [];
        this._dragNodes = [];
        this._tickNodes = []; // [ADDED] Simpan referensi tick nodes agar cepat
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
            if (scriptInstance && scriptInstance.isActive === false) {
                return false;
            }
        }
        return true;
    }

    _initVariables() {
        const source = this.data.variables || this.data.exposedVariables || [];
        source.forEach(v => {
            this.localVariables.set(v._id, v.defaultValue);
        });
    }

    start() {
        if (!this._isScriptActive()) return;
        if (!this.data.nodes) return;
        this.data.nodes
            .filter(n => n.type === 'event_game_start')
            .forEach(node => {
                this.executeFlow(node._id, 'out');
            });
    }

    _setupEventListeners() {
        if (!this.data.nodes) return;
        
        // Reset list
        this._tickNodes = [];
        this._holdNodes = [];
        this._dragNodes = [];

        this.data.nodes.forEach(node => {
            if (node.type === 'event_simple_key') {
                const keyTarget = node.data?.key?.toLowerCase();
                this.game.events.on('input:keydown', (k) => {
                    if (!this._isScriptActive()) return;
                    if (k === keyTarget) this.executeFlow(node._id, 'sk_main');
                });
            } else if (node.type === 'event_pointer_click') {
                const config = Array.isArray(node.data) ? node.data[0] : node.data;
                const btnTarget = config?.button || 'left';
                this.game.events.on('input:pointerdown', (e) => {
                    if (!this._isScriptActive()) return;
                    if (e.button === btnTarget) {
                        node._tempData = { pos_x: e.x, pos_y: e.y };
                        this.executeFlow(node._id, config._id || 'ptr_click_main');
                    }
                });
            } else if (node.type === 'event_advanced_key') {
                const mappings = node.data?.mappings || [];
                mappings.forEach(map => {
                    const outputId = `out_${map._id}`;
                    const keyTarget = map.key.toLowerCase();
                    if (map.trigger === 'press') {
                        this.game.events.on('input:keydown', (k) => {
                            if (!this._isScriptActive()) return;
                            if (k === keyTarget) this.executeFlow(node._id, outputId);
                        });
                    } else if (map.trigger === 'release') {
                        this.game.events.on('input:keyup', (k) => {
                            if (!this._isScriptActive()) return;
                            if (k === keyTarget) this.executeFlow(node._id, outputId);
                        });
                    } else if (map.trigger === 'hold') {
                        this._holdNodes.push({ node, map, outputId });
                    }
                });
            } else if (node.type === 'event_pointer_drag') {
                this._dragNodes.push(node);
            } 
            // [ADDED] Optimasi: Kumpulkan node tick saat inisialisasi
            else if (node.type === 'event_tick') {
                this._tickNodes.push(node);
            }
        });
    }

    update(dt) {
        if (!this._isScriptActive()) return;
        this.currentDt = dt;
        
        // Simpan posisi sebelumnya untuk physics interpolation (opsional)
        if (this.owner && this.owner.components && this.owner.components.Transform) {
            const t = this.owner.components.Transform;
            t.prevX = t.x;
            t.prevY = t.y;
        }

        // [UPDATED] Gunakan list yang sudah di-cache agar lebih cepat daripada filter setiap frame
        this._tickNodes.forEach(node => {
            // Set data dt agar bisa diambil oleh output 'dt'
            node._tempData = { dt: dt };
            this.executeFlow(node._id, 'out');
        });

        this._holdNodes.forEach(item => {
            if (this.game.input.keyboard.isDown(item.map.key)) {
                this.executeFlow(item.node._id, item.outputId);
            }
        });

        if (this._dragNodes.length > 0) {
            const pointer = this.game.input.getPointer();
            if (pointer.down) {
                const dx = pointer.x - this._lastPointer.x;
                const dy = pointer.y - this._lastPointer.y;
                this._dragNodes.forEach(node => {
                    node._tempData = { delta_x: dx, delta_y: dy, pos_x: pointer.x, pos_y: pointer.y };
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
            console.error(`[GraphRunner] Error at node '${node.type}':`, err);
        }
    }

    getInputValue(node, inputKey) {
        const edge = this.edges.find(e => e.target === node._id && e.targetHandle === inputKey);
        if (edge) {
            const sourceNode = this.nodeMap.get(edge.source);
            return this._getNodeOutputValue(sourceNode, edge.sourceHandle);
        }
        return node.data?.[inputKey];
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

    resolveEntity(targetId) {
        if (targetId && typeof targetId === 'string' && targetId.trim() !== '') {
            return this.game.world.entities.find(e => e.id === targetId || e._id === targetId) || null;
        }
        return this.owner;
    }

    setVariable(varId, value) {
        if (this.localVariables.has(varId)) {
            this.localVariables.set(varId, value);
        }
    }

    getVariable(varId) {
        return this.localVariables.get(varId) || null;
    }
}