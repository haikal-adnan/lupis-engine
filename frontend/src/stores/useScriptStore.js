import { defineStore } from 'pinia';
import { toRaw } from 'vue';
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
        // API Call implementation
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
      this.scripts.push(structuredClone(toRaw(script)));
    },

    removeScript(scriptId) {
      this.scripts = this.scripts.filter(s => s._id !== scriptId);
      if (this.activeScript && this.activeScript._id === scriptId) {
        this.activeScript = null;
        this.selectedNodeId = null;
      }
    },

    setActiveScript(scriptData) {
      this.activeScript = structuredClone(toRaw(scriptData));
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
         const isSelfUpdate = updates.nodes === this.activeScript.nodes;
         if (!isSelfUpdate) {
             Object.assign(this.activeScript, updates);
         }
      }
    },

    // =========================================
    // NODE & EDGE MANIPULATION (Graph Editor)
    // =========================================

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      
      const newNode = createScriptNode(rawNodeData);
      
      this.activeScript.nodes.push(newNode);
      this.selectedNodeId = newNode._id;

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

      this.saveActiveScript();
    },

    removeNodeFromActive(nodeId) {
      if (!this.activeScript) return;

      this.activeScript.nodes = this.activeScript.nodes.filter(n => n._id !== nodeId);
      
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      );
      
      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null;
      }

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
      
      try {
        const cleanScript = structuredClone(toRaw(this.activeScript));

        this.updateScriptInList(cleanScript._id, {
            nodes: cleanScript.nodes,
            edges: cleanScript.edges,
            exposedVariables: cleanScript.exposedVariables
        });

        console.log("[ScriptStore] Saved clean data using structuredClone.");
      } catch (err) {
        console.error("[ScriptStore] FAILED to sanitize active script!", err);
      }
    }
  }
});