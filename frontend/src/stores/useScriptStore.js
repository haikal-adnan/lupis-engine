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
    // BARU: High Level / Async Actions (CRUD)
    // =========================================

    async fetchScripts(projectId) {
      this.isLoading = true;
      this.error = null;
      try {
        console.log(`[Mock] Fetching scripts for project: ${projectId}`);
        // Simulasi load data
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
      // Deep copy untuk safety editing
      this.activeScript = JSON.parse(JSON.stringify(scriptData));
      this.selectedNodeId = null; 
    },

    setSelectedNode(nodeId) {
      this.selectedNodeId = nodeId;
    },

    updateScriptInList(scriptId, updates) {
      const index = this.scripts.findIndex(s => s._id === scriptId);
      if (index !== -1) {
        // Update di list utama
        this.scripts[index] = { ...this.scripts[index], ...updates };
      }

      // Sinkronisasi jika script yang diupdate sedang aktif
      // (Agar UI tidak flickering/reset jika update datang dari luar)
      if (this.activeScript && this.activeScript._id === scriptId) {
         Object.assign(this.activeScript, updates);
      }
    },

    // --- PERBAIKAN UTAMA ADA DI BAWAH SINI ---

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      
      const newNode = createScriptNode(rawNodeData);
      this.activeScript.nodes.push(newNode);
      
      this.selectedNodeId = newNode._id;

      // FIX: Trigger Save agar EngineBridge mendeteksi perubahan
      this.saveActiveScript(); 
    },

    updateNodeInActive(nodeId, updates) {
      if (!this.activeScript) return;
      
      const node = this.activeScript.nodes.find(n => n._id === nodeId);
      if (!node) return;

      if (updates.data) {
        node.data = { ...node.data, ...updates.data };
        delete updates.data; 
      }

      if (updates.settings) {
        node.settings = { ...node.settings, ...updates.settings };
        delete updates.settings;
      }

      Object.assign(node, updates);

      // FIX: Trigger Save
      // (Catatan: Untuk posisi x,y saat drag, sebaiknya gunakan debounce di komponen UI,
      // jangan panggil ini setiap pixel geser)
      this.saveActiveScript();
    },

    removeNodeFromActive(nodeId) {
      if (!this.activeScript) return;

      this.activeScript.nodes = this.activeScript.nodes.filter(n => n._id !== nodeId);
      
      // Hapus edge yang terhubung
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }

      // FIX: Trigger Save
      this.saveActiveScript();
    },

    addEdgeToActive(rawEdgeData) {
      if (!this.activeScript) return;

      if (rawEdgeData.source === rawEdgeData.target) return;

      const exists = this.activeScript.edges.find(e => 
        e.source === rawEdgeData.source && 
        e.target === rawEdgeData.target &&
        e.sourceHandle === rawEdgeData.sourceHandle &&
        e.targetHandle === rawEdgeData.targetHandle
      );

      if (!exists) {
        const newEdge = createScriptEdge(rawEdgeData);
        this.activeScript.edges.push(newEdge);
        
        // FIX: Trigger Save
        this.saveActiveScript();
      }
    },

    removeEdgeFromActive(edgeId) {
      if (!this.activeScript) return;
      this.activeScript.edges = this.activeScript.edges.filter(e => e._id !== edgeId);

      // FIX: Trigger Save
      this.saveActiveScript();
    },

    // Action ini yang ditangkap oleh useEditorToEngine
    saveActiveScript() {
      if (!this.activeScript) return;
      
      // Update data di list utama (source of truth)
      this.updateScriptInList(this.activeScript._id, {
        nodes: this.activeScript.nodes,
        edges: this.activeScript.edges,
        exposedVariables: this.activeScript.exposedVariables
      });
      
      console.log("[ScriptStore] Auto-saved active script changes.");
    }
  }
});