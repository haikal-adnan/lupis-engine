import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { 
  createScript, 
  createScriptNode, 
  createScriptEdge,
  createScriptPort 
} from '@/services/schema/scriptSchema';

export const useScriptStore = defineStore('script', {
  state: () => ({
    scripts: [],
    activeScript: null, 
    selectedNodeId: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    getScriptById: (state) => (id) => {
      return state.scripts.find(s => s._id === id);
    },
    componentScripts: (state) => {
      return state.scripts.filter(s => s.type === 'component');
    },
    logicScripts: (state) => {
      return state.scripts.filter(s => s.type === 'scene_logic');
    },
    selectedNode: (state) => {
      if (!state.activeScript || !state.selectedNodeId) return null;
      return state.activeScript.nodes.find(n => n._id === state.selectedNodeId);
    },
    
    /**
     * Mengecek apakah input handle tertentu pada node memiliki koneksi kabel (Edge).
     * Usage: store.isInputConnected(nodeId, handleId)
     */
    isInputConnected: (state) => (nodeId, handleId) => {
      if (!state.activeScript || !state.activeScript.edges) return false;
      
      return state.activeScript.edges.some(edge => 
        edge.target === nodeId && edge.targetHandle === handleId
      );
    }
  },

  actions: {
    async fetchScripts(projectId) {
      this.isLoading = true;
      this.error = null;
      try {
        console.log(`[Mock] Fetching scripts for project: ${projectId}`);
      } catch (err) {
        this.error = err.message;
      } finally {
        this.isLoading = false;
      }
    },

    async createScript(payload) {
      const newScript = createScript(payload);
      this.addScript(newScript);
      return newScript;
    },

    async updateScript(scriptId, updates) {
      const payload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.updateScriptInList(scriptId, payload);
    },

    async deleteScript(scriptId) {
      this.removeScript(scriptId);
    },

    initScripts(scriptList) {
      this.scripts = scriptList.map(s => createScript(s)); 
    },

    addScript(script) {
      this.scripts.push(JSON.parse(JSON.stringify(toRaw(script))));
    },

    removeScript(scriptId) {
      this.scripts = this.scripts.filter(s => s._id !== scriptId);
      if (this.activeScript && this.activeScript._id === scriptId) {
        this.activeScript = null;
        this.selectedNodeId = null;
      }
    },

    setActiveScript(scriptData) {
      this.activeScript = JSON.parse(JSON.stringify(toRaw(scriptData)));
      this.selectedNodeId = null; 
    },

    setSelectedNode(nodeId) {
      this.selectedNodeId = nodeId;
    },

    updateScriptInList(scriptId, updates) {
      const index = this.scripts.findIndex(s => s._id === scriptId);
      
      if (index !== -1) {
        const currentData = this.scripts[index];
        this.scripts[index] = { ...currentData, ...updates };
      }

      if (this.activeScript && this.activeScript._id === scriptId) {
         // Cek jika update bukan berasal dari self-update (seperti dragging node)
         // agar tidak merusak referensi reaktif jika tidak perlu
         const isSelfUpdate = updates.nodes === this.activeScript.nodes;
         if (!isSelfUpdate) {
             Object.assign(this.activeScript, updates);
         }
      }
    },

    // ------------------------------------------------------------------
    // Node Operations (Active Script)
    // ------------------------------------------------------------------

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      
      const newNode = createScriptNode(rawNodeData);
      
      this.activeScript.nodes.push(newNode);
      this.selectedNodeId = newNode._id;

      this.saveActiveScript(); 
    },

    updateNodeInActive(nodeId, updates) {
      if (!this.activeScript) return;
      
      // Cari node referensi reaktif
      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (!node) return;

      // Merge nested objects manual agar tidak menimpa seluruh object
      if (updates.data) {
        node.data = { ...node.data, ...updates.data };
        delete updates.data; 
      }

      if (updates.settings) {
        node.settings = { ...node.settings, ...updates.settings };
        delete updates.settings;
      }

      // Assign sisanya (position, inputs, outputs, dll)
      Object.assign(node, updates);

      this.saveActiveScript();
    },

    removeNodeFromActive(nodeId) {
      if (!this.activeScript) return;

      this.activeScript.nodes = this.activeScript.nodes.filter(n => n._id !== nodeId);
      // Hapus edges yang terhubung
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }

      this.saveActiveScript();
    },

    // ------------------------------------------------------------------
    // Port Operations
    // ------------------------------------------------------------------

    addNodePort(nodeId, type, portData) {
      if (!this.activeScript) return;
      
      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (!node) return;

      if (type === 'input' && !node.allowDynamicInputs) return;
      if (type === 'output' && !node.allowDynamicOutputs) return;

      const newPort = createScriptPort(portData);

      if (type === 'input') {
        if (node.inputs.some(p => p._id === newPort._id)) return;
        node.inputs.push(newPort);
      } else {
        if (node.outputs.some(p => p._id === newPort._id)) return;
        node.outputs.push(newPort);
      }

      this.saveActiveScript();
    },

    removeNodePort(nodeId, type, portId) {
      if (!this.activeScript) return;

      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (!node) return;

      if (type === 'input') {
        node.inputs = node.inputs.filter(p => p._id !== portId);
        // Hapus edges yang masuk ke port ini
        this.activeScript.edges = this.activeScript.edges.filter(e => 
          !(e.target === nodeId && e.targetHandle === portId)
        );
      } else {
        node.outputs = node.outputs.filter(p => p._id !== portId);
        // Hapus edges yang keluar dari port ini
        this.activeScript.edges = this.activeScript.edges.filter(e => 
          !(e.source === nodeId && e.sourceHandle === portId)
        );
      }

      this.saveActiveScript();
    },

    // ------------------------------------------------------------------
    // Edge Operations
    // ------------------------------------------------------------------

    addEdgeToActive(rawEdgeData) {
      if (!this.activeScript) return;
      if (rawEdgeData.source === rawEdgeData.target) return; // Prevent self-loop

      // Cek duplikat
      const exists = this.activeScript.edges.find(e => 
        e.source === rawEdgeData.source && 
        e.target === rawEdgeData.target &&
        e.sourceHandle === rawEdgeData.sourceHandle &&
        e.targetHandle === rawEdgeData.targetHandle
      );

      if (!exists) {
        const newEdge = createScriptEdge(rawEdgeData);
        this.activeScript.edges.push(newEdge);
        this.saveActiveScript();
      }
    },

    removeEdgeFromActive(edgeId) {
      if (!this.activeScript) return;
      this.activeScript.edges = this.activeScript.edges.filter(e => e._id !== edgeId);
      this.saveActiveScript();
    },

    // ------------------------------------------------------------------
    // Persistence
    // ------------------------------------------------------------------

    saveActiveScript() {
      if (!this.activeScript) return;
      try {
        const cleanScript = JSON.parse(JSON.stringify(toRaw(this.activeScript)));
        
        // Update list utama
        this.updateScriptInList(cleanScript._id, {
            nodes: cleanScript.nodes,
            edges: cleanScript.edges,
            exposedVariables: cleanScript.exposedVariables
        });

        // Di sini bisa tambahkan logic API Call ke Backend
        // await api.updateScript(cleanScript._id, cleanScript);
        
      } catch (err) {
        console.error("[ScriptStore] FAILED to save", err);
      }
    }
  }
});