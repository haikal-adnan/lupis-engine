import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { 
  scriptSchema, 
  createScriptNode, 
  createScriptEdge,
  createScriptPort 
} from '@scripts/scripts.js';
import { useNodeBlueprint } from '@nodes/nodes.js';

const { syncDynamicInputsAndCode } = useNodeBlueprint();

export const useScriptStore = defineStore('script', {
  state: () => ({
    scripts: [],
    activeScript: null, 
    selectedNodeId: null, 
    selectedNodeIds: [],  
    selectedEdgeId: null,
    isLoading: false,
    camera: { x: 0, y: 0, scale: 1 }, 
  }),

  getters: {
    getAllScripts: (state) => {
      return state.scripts.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type || 'component',
        folderId: s.folderId || null,
        originalData: s
      }));
    },
    getScriptById: (state) => (id) => {
      return state.scripts.find(s => s.id === id);
    },
    componentScripts: (state) => {
      return state.scripts.filter(s => s.type === 'component');
    },
    selectedNode: (state) => {
      if (!state.activeScript) return null;
      if (state.selectedNodeIds.length === 1) {
        return state.activeScript.nodes.find(n => n.id === state.selectedNodeIds[0]);
      }
      if (state.selectedNodeIds.length === 0 && state.selectedNodeId) {
        return state.activeScript.nodes.find(n => n.id === state.selectedNodeId);
      }
      return null;
    },
    selectedNodes: (state) => {
      if (!state.activeScript) return [];
      return state.activeScript.nodes.filter(n => state.selectedNodeIds.includes(n.id));
    },
    selectedEdge: (state) => {
      if (!state.activeScript || !state.selectedEdgeId) return null;
      return state.activeScript.edges.find(e => e.id === state.selectedEdgeId);
    },
    isInputConnected: (state) => (nodeId, handleId) => {
      if (!state.activeScript || !state.activeScript.edges) return false;
      return state.activeScript.edges.some(edge => 
        edge.target === nodeId && edge.targetHandle === handleId
      );
    }
  },

  actions: {
    updateCamera(updates) {
      this.camera = { ...this.camera, ...updates };
    },
    
    resetCamera() {
      this.camera = { x: 0, y: 0, scale: 1 };
    },

    async fetchScripts(projectId) {
      this.isLoading = true;
      try {
        console.log(`[Script Store] Fetching scripts for project: ${projectId}`);
      } catch (err) {
        console.log(`[Script Store] Failed to fetch scripts:`, err);
      } finally {
        this.isLoading = false;
      }
    },

    initScripts(scriptList) {
      this.scripts = Array.isArray(scriptList)
        ? scriptList.map(s => scriptSchema(s))
        : [];
    },

    addScript(script) {
      const clean = scriptSchema(toRaw(script));
      this.scripts.push(clean);
    },

    async moveScript(scriptId, targetFolderId) {
      const script = this.scripts.find(s => s.id === scriptId);
      if (script) {
        script.folderId = targetFolderId || null;
        return true;
      }
      return false;
    },

    updateScriptInList(scriptId, updates) {
      const index = this.scripts.findIndex(s => s.id === scriptId);
      if (index !== -1) {
        this.scripts[index] = { ...this.scripts[index], ...updates };
      }

      if (this.activeScript && this.activeScript.id === scriptId) {
        const isSelfUpdate = updates.nodes === this.activeScript.nodes;
        if (!isSelfUpdate) {
          Object.assign(this.activeScript, updates);
        }
      }
    },

    removeScript(scriptId) {
      this.scripts = this.scripts.filter(s => s.id !== scriptId);
      if (this.activeScript && this.activeScript.id === scriptId) {
        this.activeScript = null;
        this.selectedNodeId = null;
        this.selectedNodeIds = [];
        this.selectedEdgeId = null;
      }
    },

    setActiveScript(scriptData) {
      this.activeScript = JSON.parse(JSON.stringify(toRaw(scriptData)));
      this.selectedNodeId = null; 
      this.selectedNodeIds = [];
      this.selectedEdgeId = null;
      this.resetCamera(); 
    },

    setSelectedNodes(nodeIds = []) {
      const ids = Array.isArray(nodeIds) ? nodeIds : (nodeIds ? [nodeIds] : []);
      this.selectedNodeIds = ids;
      this.selectedNodeId = ids.length === 1 ? ids[0] : null;
      if (ids.length > 0) {
        this.selectedEdgeId = null;
      }
    },

    toggleNodeSelection(nodeId) {
      const idx = this.selectedNodeIds.indexOf(nodeId);
      if (idx === -1) {
        this.selectedNodeIds.push(nodeId);
      } else {
        this.selectedNodeIds.splice(idx, 1);
      }
      this.selectedNodeId = this.selectedNodeIds.length === 1 ? this.selectedNodeIds[0] : null;
      if (this.selectedNodeIds.length > 0) {
        this.selectedEdgeId = null;
      }
    },

    setSelectedNode(nodeId) {
      this.setSelectedNodes(nodeId ? [nodeId] : []);
    },

    setSelectedEdge(edgeId) {
      this.selectedEdgeId = edgeId;
      if (edgeId) {
        this.selectedNodeId = null; 
        this.selectedNodeIds = [];
      }
    },

    updateEdgeModifier(edgeId, modifierData) {
      if (!this.activeScript) return;
      const edge = this.activeScript.edges.find(e => e.id === edgeId);
      if (edge) {
        edge.modifier = { ...edge.modifier, ...modifierData };
        this.saveActiveScript();
      }
    },

    addNodeToActive(rawNodeData) {
      if (!this.activeScript) return;
      const newNode = createScriptNode(rawNodeData);
      this.activeScript.nodes.push(newNode);
      this.setSelectedNode(newNode.id);
      this.saveActiveScript(); 
    },

    updateNodeInActive(nodeId, updates) {
      if (!this.activeScript) return;
      const node = this.activeScript.nodes.find(n => n.id === nodeId);
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
      const idsToRemove = Array.isArray(nodeId) ? nodeId : [nodeId];

      this.activeScript.nodes = this.activeScript.nodes.filter(n => !idsToRemove.includes(n.id));
      this.activeScript.edges = this.activeScript.edges.filter(edge => 
        !idsToRemove.includes(edge.source) && !idsToRemove.includes(edge.target)
      );
      this.selectedNodeIds = this.selectedNodeIds.filter(id => !idsToRemove.includes(id));
      if (idsToRemove.includes(this.selectedNodeId)) {
        this.selectedNodeId = null;
      }
      this.saveActiveScript();
    },

    addNodePort(nodeId, type, portData) {
      if (!this.activeScript) return;
      const node = this.activeScript.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (type === 'input' && !node.allowDynamicInputs) return;
      if (type === 'output' && !node.allowDynamicOutputs) return;

      const newPort = createScriptPort(portData);

      if (type === 'input') {
        if (node.inputs.some(p => p.id === newPort.id)) return;
        node.inputs.push(newPort);

        // Reset label port & kode secara sinkron
        if (node.allowDynamicInputs) {
          syncDynamicInputsAndCode(node);
        }
      } else {
        if (node.outputs.some(p => p.id === newPort.id)) return;
        node.outputs.push(newPort);
      }
      
      this.saveActiveScript();
    },

    removeNodePort(nodeId, type, portId) {
      if (!this.activeScript) return;
      const node = this.activeScript.nodes.find(n => n.id === nodeId);
      if (!node) return;

      if (type === 'input') {
        node.inputs = node.inputs.filter(p => p.id !== portId);
        this.activeScript.edges = this.activeScript.edges.filter(e => 
          !(e.target === nodeId && e.targetHandle === portId)
        );

        // Reset dan re-index label port & kode secara sinkron setelah ada port yang dihapus
        if (node.allowDynamicInputs) {
          syncDynamicInputsAndCode(node);
        }
      } else {
        node.outputs = node.outputs.filter(p => p.id !== portId);
        this.activeScript.edges = this.activeScript.edges.filter(e => 
          !(e.source === nodeId && e.sourceHandle === portId)
        );
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
      this.activeScript.edges = this.activeScript.edges.filter(e => e.id !== edgeId);
      if (this.selectedEdgeId === edgeId) {
        this.selectedEdgeId = null;
      }
      this.saveActiveScript();
    },

    removeEdge(edgeId) {
      if (!this.activeScript) return;
      const initialLength = this.activeScript.edges.length;
      this.activeScript.edges = this.activeScript.edges.filter(edge => edge.id !== edgeId);
      if (this.activeScript.edges.length < initialLength) {
        if (this.selectedEdgeId === edgeId) {
          this.selectedEdgeId = null;
        }
        this.saveActiveScript();
      }
    },

    saveActiveScript() {
      if (!this.activeScript) return;
      try {
        const cleanScript = JSON.parse(JSON.stringify(toRaw(this.activeScript)));
        this.updateScriptInList(cleanScript.id, {
          nodes: cleanScript.nodes,
          edges: cleanScript.edges,
          localVariables: cleanScript.localVariables
        });
      } catch (err) {
        console.error("[ScriptStore] FAILED to save active script", err);
      }
    }
  }
});