export default class GraphRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game;
        this.data = scriptData; 
        this.owner = ownerEntity;
        
        // Gabungkan variable
        this.variablesSource = this.data.variables || this.data.exposedVariables || [];

        // Cache Nodes
        this.nodeMap = new Map();
        if (this.data.nodes) {
            this.data.nodes.forEach(node => this.nodeMap.set(node._id, node));
        }

        // Cache Edges
        this.edges = this.data.edges || [];

        // Init Local Variables
        this.localVariables = new Map();
        this._initLocalVariables();

        this._keyStates = {};
    }

    _initLocalVariables() {
        this.variablesSource.forEach(v => {
            this.localVariables.set(v._id, v.defaultValue);
            // DEBUG: Cek nilai awal
            // console.log(`[Init Var] ${v.name}: ${v.defaultValue}`);
        });
    }

    update(dt) {
        if (!this.data.nodes) return;
        for (const node of this.data.nodes) {
            if (node.type === 'event_key_press') {
                this._processKeyPress(node);
            }
        }
    }

    // --- HELPER ---
    _resolveEntity(targetId) {
        if (targetId && typeof targetId === 'string' && targetId.trim() !== '') {
            const found = this.game.world.entities.find(e => e.id === targetId || e._id === targetId);
            if (!found) {
                console.warn(`[GraphRunner] Target Entity '${targetId}' not found.`);
                return null;
            }
            return found;
        }
        return this.owner;
    }

    // --- EVENT ---
    _processKeyPress(node) {
        const key = node.data?.key || 'Space'; 
        const isDown = this.game.input?.keyboard?.isDown(key) || false;
        const wasDown = this._keyStates[key] || false;

        if (isDown && !wasDown) {
            this._executeFlow(node._id, 'out');
        }
        this._keyStates[key] = isDown;
    }

    // --- FLOW ---
    _executeFlow(sourceNodeId, sourcePortName) {
        const edge = this.edges.find(e => 
            e.source === sourceNodeId && 
            e.sourceHandle === sourcePortName
        );
        if (!edge) return; 

        const targetNode = this.nodeMap.get(edge.target);
        if (targetNode) {
            try {
                this._executeNode(targetNode);
            } catch (err) {
                console.error(`[GraphRunner] Error node ${targetNode.type}:`, err);
            }
        }
    }

    _executeNode(node) {
        switch (node.type) {
            case 'ui_notification': this._nodeUiNotification(node); break;
            case 'variable_set': this._nodeVariableSet(node); break;
            case 'set_transform': this._nodeSetTransform(node); break;
            case 'math_add': case 'math_multiply': case 'math_random': case 'format_string': break;
            default: break;
        }
        this._executeFlow(node._id, 'out');
    }

    // --- INPUT RESOLVER ---
    _getInputValue(node, inputKey) {
        const edge = this.edges.find(e => 
            e.target === node._id && 
            e.targetHandle === inputKey // Pastikan handle match string '0', '1', dst
        );

        if (edge) {
            const sourceNode = this.nodeMap.get(edge.source);
            return this._getNodeOutputValue(sourceNode, edge.sourceHandle);
        }
        return node.data?.[inputKey];
    }

    // --- OUTPUT RESOLVER ---
    _getNodeOutputValue(node, outputKey) {
        switch (node.type) {
            case 'variable_get': return this._nodeVariableGet(node);
            case 'get_transform': return this._nodeGetTransform(node, outputKey);
            case 'set_transform': return this._nodeGetTransform(node, outputKey); // Pass-through
            case 'math_add': return this._nodeMathAdd(node, outputKey);
            case 'math_multiply': return this._nodeMathMultiply(node, outputKey);
            case 'math_random': return this._nodeMathRandom(node, outputKey);
            case 'format_string': return this._nodeFormatString(node, outputKey);
            default: return null;
        }
    }

    // --- IMPLEMENTATIONS ---

    _nodeUiNotification(node) {
        const message = this._getInputValue(node, 'msg');
        console.log(`%c 🔔 [GAME] ${message} `, 'background: #222; color: #E040FB; font-weight: bold; border-left: 3px solid #E040FB; padding: 4px;');
    }

    _nodeVariableGet(node) {
        const varId = node.data?.variableId;
        
        if (this.localVariables.has(varId)) {
            const val = this.localVariables.get(varId);
            // DEBUG KHUSUS: Uncomment baris bawah ini untuk melihat siapa yang baca variabel
            // console.log(`[Var Get] ID: ${varId}, Value: ${val}`);
            return val;
        }
        if (this.game.variables && this.game.variables.hasGlobal(varId)) {
            return this.game.variables.getGlobal(varId);
        }
        return 0;
    }

    _nodeVariableSet(node) {
        const varId = node.data?.variableId;
        const newValue = this._getInputValue(node, 'val');
        if (varId) this.localVariables.set(varId, newValue);
    }

    _nodeSetTransform(node) {
        const targetId = this._getInputValue(node, 'target');
        const entity = this._resolveEntity(targetId);
        if (!entity || !entity.components || !entity.components.Transform) return;

        const t = entity.components.Transform;
        
        // Input Values
        const x = this._getInputValue(node, 'x');
        const y = this._getInputValue(node, 'y');
        const rot = this._getInputValue(node, 'rotation');
        const w = this._getInputValue(node, 'width');
        const h = this._getInputValue(node, 'height');
        const px = this._getInputValue(node, 'pivotX');
        const py = this._getInputValue(node, 'pivotY');

        if (x !== undefined && x !== null) t.x = Number(x);
        if (y !== undefined && y !== null) t.y = Number(y);
        if (rot !== undefined && rot !== null) t.rotation = Number(rot);
        if (w !== undefined && w !== null) t.width = Number(w);
        if (h !== undefined && h !== null) t.height = Number(h);
        if (px !== undefined && px !== null) t.pivotX = Number(px);
        if (py !== undefined && py !== null) t.pivotY = Number(py);
    }

    _nodeGetTransform(node, outputKey) {
        const targetId = this._getInputValue(node, 'target');
        const entity = this._resolveEntity(targetId);
        if (!entity || !entity.components || !entity.components.Transform) return 0;
        const t = entity.components.Transform;

        switch (outputKey) {
            case 'x': return t.x;
            case 'y': return t.y;
            case 'rotation': return t.rotation || 0;
            case 'width': return t.width || 0;
            case 'height': return t.height || 0;
            case 'pivotX': return t.pivotX !== undefined ? t.pivotX : 0.5;
            case 'pivotY': return t.pivotY !== undefined ? t.pivotY : 0.5;
            default: return 0;
        }
    }

    _nodeMathAdd(node, outputKey) {
        if (outputKey === 'res') {
            const a = Number(this._getInputValue(node, 'a')) || 0;
            const b = Number(this._getInputValue(node, 'b')) || 0;
            return a + b;
        }
        return 0;
    }

    _nodeMathMultiply(node, outputKey) {
        if (outputKey === 'res') {
            const a = Number(this._getInputValue(node, 'a')) || 0;
            const b = Number(this._getInputValue(node, 'b')) || 0;
            return a * b;
        }
        return 0;
    }

    _nodeMathRandom(node, outputKey) {
        if (outputKey === 'res') {
            const min = Number(this._getInputValue(node, 'min')) || 0;
            const max = Number(this._getInputValue(node, 'max')) || 1;
            return Math.random() * (max - min) + min;
        }
        return 0;
    }

    _nodeFormatString(node, outputKey) {
        // Ambil template dari data node, misal: "Pos: {0}, {1} | Size: {3}x{4}"
        let formatStr = node.data?.format || "";
        
        // Loop 0-9 untuk mencari input dynamic
        for (let i = 0; i < 10; i++) {
            const val = this._getInputValue(node, String(i));
            
            if (val !== undefined && val !== null) {
                // Formatting angka agar rapi (max 2 desimal)
                let displayVal = val;
                if (typeof val === 'number' && !Number.isInteger(val)) {
                    displayVal = val.toFixed(2);
                }
                
                // Replace placeholder {0}, {1} dst dengan value
                formatStr = formatStr.replace(new RegExp(`\\{${i}\\}`, 'g'), displayVal);
            }
        }
        return formatStr;
    }
}