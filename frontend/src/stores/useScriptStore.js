import { defineStore } from 'pinia';
import { 
  createScript, 
  createScriptNode, 
  createScriptEdge 
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
    }
  },

  actions: {
    // =========================================
    // HIGH LEVEL / ASYNC ACTIONS (CRUD Projects)
    // =========================================

    async fetchScripts(projectId) {
      this.isLoading = true;
      this.error = null;
      try {
        console.log(`[Mock] Fetching scripts for project: ${projectId}`);
        // TODO: Ganti dengan API Call real
        // const res = await api.getScripts(projectId)
        // this.initScripts(res.data)
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

    // =========================================
    // STATE MUTATION & EDITOR LOGIC
    // =========================================

    initScripts(scriptList) {
      this.scripts = scriptList.map(s => createScript(s)); 
    },

    addScript(script) {
      this.scripts.push(script);
    },

    removeScript(scriptId) {
      this.scripts = this.scripts.filter(s => s._id !== scriptId);
      if (this.activeScript && this.activeScript._id === scriptId) {
        this.activeScript = null;
        this.selectedNodeId = null;
      }
    },

    setActiveScript(scriptData) {
      // Deep copy untuk safety editing agar tidak memutasi list langsung sebelum save
      this.activeScript = JSON.parse(JSON.stringify(scriptData));
      this.selectedNodeId = null; 
    },

    setSelectedNode(nodeId) {
      this.selectedNodeId = nodeId;
    },

    updateScriptInList(scriptId, updates) {
      const index = this.scripts.findIndex(s => s._id === scriptId);
      if (index !== -1) {
        // Update di list utama (Source of Truth)
        this.scripts[index] = { ...this.scripts[index], ...updates };
      }

      // Sinkronisasi jika script yang diupdate sedang dibuka di editor
      if (this.activeScript && this.activeScript._id === scriptId) {
         Object.assign(this.activeScript, updates);
      }
    },

    // =========================================
    // NODE & EDGE MANIPULATION (Graph Editor)
    // =========================================

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      
      // Menggunakan schema factory untuk memastikan struktur data valid
      const newNode = createScriptNode(rawNodeData);
      
      this.activeScript.nodes.push(newNode);
      
      // Auto-select node yang baru dibuat/didupilkat
      this.selectedNodeId = newNode._id;

      this.saveActiveScript(); 
    },

    updateNodeInActive(nodeId, updates) {
      if (!this.activeScript) return;
      
      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (!node) return;

      // Merge deep objects (data & settings) agar tidak menimpa field lain
      if (updates.data) {
        node.data = { ...node.data, ...updates.data };
        delete updates.data; 
      }

      if (updates.settings) {
        node.settings = { ...node.settings, ...updates.settings };
        delete updates.settings;
      }

      Object.assign(node, updates);

      // Trigger save (Debounce sebaiknya dilakukan di UI untuk event drag)
      this.saveActiveScript();
    },

    removeNodeFromActive(nodeId) {
      if (!this.activeScript) return;

      // 1. Hapus Node
      this.activeScript.nodes = this.activeScript.nodes.filter(n => n._id !== nodeId);
      
      // 2. CLEANUP: Hapus semua edge yang terhubung ke node ini
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      
      // 3. Reset seleksi jika node yang dihapus sedang aktif
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }

      this.saveActiveScript();
    },

    addEdgeToActive(rawEdgeData) {
      if (!this.activeScript) return;

      // Mencegah koneksi ke diri sendiri
      if (rawEdgeData.source === rawEdgeData.target) return;

      // Mencegah duplikasi edge yang sama persis
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

    // =========================================
    // AUTO SAVE LOGIC
    // =========================================
    
    saveActiveScript() {
      if (!this.activeScript) return;
      
      // Update data di list utama agar sinkron
      this.updateScriptInList(this.activeScript._id, {
        nodes: this.activeScript.nodes,
        edges: this.activeScript.edges,
        exposedVariables: this.activeScript.exposedVariables
      });
      
      console.log("[ScriptStore] Auto-saved active script changes.");
      
      // Disini bisa ditambahkan trigger ke backend API jika perlu (autosave ke server)
    }
  }
});