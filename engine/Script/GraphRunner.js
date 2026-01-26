import { NodeRegistry } from './NodeRegistry'

export default class GraphRunner {
    constructor(game, scriptData, ownerEntity = null) {
        this.game = game
        this.data = scriptData
        this.owner = ownerEntity // Entity tempat script ini menempel

        // 1. Map Nodes agar akses cepat
        this.nodeMap = new Map()
        if (this.data.nodes) {
            this.data.nodes.forEach(node => this.nodeMap.set(node._id, node))
        }

        // 2. Simpan Edges (Kabel)
        this.edges = this.data.edges || []

        // 3. Inisialisasi Variable Lokal
        this.localVariables = new Map()
        this._initVariables()

        // 4. Input State (untuk trigger events)
        this._keyStates = {}
        this._tempLoopIndex = 0 // Helper untuk loop
    }

    _initVariables() {
        const source = this.data.variables || this.data.exposedVariables || []
        source.forEach(v => {
            // Priority: Default Value dari graph
            this.localVariables.set(v._id, v.defaultValue)
        })
    }

    /**
     * Dipanggil setiap frame oleh Game Loop utama
     */
    update(dt) {
        if (!this.data.nodes) return
        
        // Scan Event Nodes (Trigger Awal)
        for (const node of this.data.nodes) {
            if (node.type === 'event_key_press') {
                this._processKeyPress(node)
            }
            else if (node.type === 'event_on_interact') {
                // Implementasi logika interaksi (misal diklik mouse) disini
                // atau dipanggil dari luar via public method triggerEvent()
            }
        }
    }

    /**
     * Menjalankan aliran dari satu node ke node berikutnya
     */
    executeFlow(sourceNodeId, sourcePortName) {
        // Cari kabel yang keluar dari port ini
        const edge = this.edges.find(e => 
            e.source === sourceNodeId && 
            e.sourceHandle === sourcePortName
        )
        if (!edge) return // Ujung jalan (Dead end)

        const targetNode = this.nodeMap.get(edge.target)
        if (targetNode) {
            this._executeNodeLogic(targetNode)
        }
    }

    /**
     * Mencari logika node di Registry dan menjalankannya
     */
    _executeNodeLogic(node) {
        try {
            const processor = NodeRegistry[node.type] || NodeRegistry['default']
            
            // Cek apakah node ini punya logika 'execute'
            if (processor && typeof processor.execute === 'function') {
                processor.execute(this, node) 
            } else {
                // Jika node data (seperti Math Add) masuk ke jalur eksekusi,
                // biasanya kita hanya pass-through atau log warning.
                // Disini kita pass-through (lanjut ke 'out') jika ada.
                this.executeFlow(node._id, 'out')
            }
        } catch (err) {
            console.error(`[GraphRunner] Error at node '${node.type}':`, err)
        }
    }

    /**
     * Mengambil data input. Jika ada kabel, ambil dari node sebelumnya.
     * Jika tidak, ambil dari data manual (input field).
     */
    getInputValue(node, inputKey) {
        const edge = this.edges.find(e => 
            e.target === node._id && 
            e.targetHandle === inputKey
        )

        if (edge) {
            const sourceNode = this.nodeMap.get(edge.source)
            // Rekursif: minta output value dari node sumber
            return this._getNodeOutputValue(sourceNode, edge.sourceHandle)
        }
        
        // Fallback ke nilai manual yang diketik user
        return node.data?.[inputKey]
    }

    _getNodeOutputValue(node, outputKey) {
        const processor = NodeRegistry[node.type]
        
        if (processor && typeof processor.getOutput === 'function') {
            return processor.getOutput(this, node, outputKey)
        }
        return null
    }

    // --- HELPER FUNCTIONS (API untuk Modules) ---

    resolveEntity(targetId) {
        // Jika ID valid string dan tidak kosong, cari di world
        if (targetId && typeof targetId === 'string' && targetId.trim() !== '') {
            // Asumsi game.world.entities adalah array
            const found = this.game.world.entities.find(e => e.id === targetId || e._id === targetId)
            if (found) return found
            
            // console.warn(`Entity '${targetId}' not found.`)
            return null
        }
        // Jika kosong, kembalikan pemilik script (Self)
        return this.owner
    }

    setVariable(varId, value) {
        if (this.localVariables.has(varId)) {
            this.localVariables.set(varId, value)
        } else {
            // Opsional: Set ke Global Variables game jika ada
             console.log(`Set Global Var ${varId} to ${value}`)
        }
    }

    getVariable(varId) {
        if (this.localVariables.has(varId)) {
            return this.localVariables.get(varId)
        }
        return null // Atau default value 0
    }

    // --- EVENT HANDLERS ---

    _processKeyPress(node) {
        const key = node.data?.key || 'Space'
        // Asumsi engine input system: isDown(key)
        const isDown = this.game.input?.keyboard?.isDown(key) || false
        const wasDown = this._keyStates[key] || false

        // Trigger hanya pada frame pertama ditekan (Just Pressed)
        if (isDown && !wasDown) {
            this.executeFlow(node._id, 'out')
        }
        this._keyStates[key] = isDown
    }
}