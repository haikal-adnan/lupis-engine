// lokasi: src/editor/scripts/stores/useScriptStore.js

import { defineStore } from 'pinia';
import { toRaw } from 'vue';
import { 
  scriptSchema, 
  createScriptNode, 
  createScriptEdge,
  createScriptPort 
} from '@scripts/scripts.js';
import { useNodeBlueprint } from '@nodes/nodes.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { useOPFSActions } from '@opfs/opfs.js';

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
        scriptId: s.scriptId,
        type: s.type || 'component',
        folderId: s.folderId || null,
        originalData: s
      }));
    },
    getScriptById: (state) => (id) => state.scripts.find(s => s.id === id),
    componentScripts: (state) => state.scripts.filter(s => s.type === 'component'),
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
      if (!state.activeScript?.edges) return false;
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

    async _getScriptDirectories() {
      const workspaceStore = useWorkspaceStore();
      const opfs = useOPFSActions();
      
      const projectId = String(workspaceStore.activeProjectId);
      const projectsRootDir = await opfs.getProjectsRootDirectory();

      const scriptsDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/scripts`);
      const workspacesDir = await opfs.resolveDirectoryPath(projectsRootDir, `${projectId}/workspaces`);

      return { scriptsDir, workspacesDir };
    },

    async syncScriptsMetaToOPFS() {
      const workspaceStore = useWorkspaceStore();
      const opfs = useOPFSActions();
      const { workspacesDir } = await this._getScriptDirectories();

      const projectId = workspaceStore.activeProjectId;
      const scriptMetas = this.scripts.map(s => ({
        id: s.id,
        projectId,
        folderId: s.folderId,
        scriptId: s.scriptId,
        type: s.type
      }));

      await opfs.writeFileToHandle(workspacesDir, 'scripts.json', JSON.stringify(scriptMetas, null, 2));
    },

    async saveScriptToOPFS(script) {
      const opfs = useOPFSActions();
      const { scriptsDir } = await this._getScriptDirectories();

      const cleanScript = JSON.parse(JSON.stringify(toRaw(script)));
      delete cleanScript.projectId;
      delete cleanScript.folderId;

      await opfs.writeFileToHandle(scriptsDir, `${script.id}.json`, JSON.stringify(cleanScript, null, 2));
      await this.syncScriptsMetaToOPFS();
    },

    async syncAllScriptsToOPFS() {
      if (this.activeScript) {
        this.saveActiveScript();
      }
      for (const script of this.scripts) {
        await this.saveScriptToOPFS(script);
      }
    },

    initScripts(scriptList) {
      this.scripts = Array.isArray(scriptList)
        ? scriptList.map(s => scriptSchema(s))
        : [];
    },

    async addScript(script) {
      const clean = scriptSchema(toRaw(script));
      this.scripts.push(clean);
      await this.saveScriptToOPFS(clean);
    },

    async moveScript(scriptId, targetFolderId) {
      const script = this.scripts.find(s => s.id === scriptId);
      if (script) {
        script.folderId = targetFolderId || null;
        await this.syncScriptsMetaToOPFS();
        return true;
      }
      return false;
    },

    updateScriptInList(scriptId, updates) {
      const index = this.scripts.findIndex(s => s.id === scriptId);
      if (index !== -1) {
        this.scripts[index] = { ...this.scripts[index], ...updates };
      }

      if (this.activeScript?.id === scriptId) {
        const isSelfUpdate = updates.nodes === this.activeScript.nodes;
        if (!isSelfUpdate) {
          Object.assign(this.activeScript, updates);
        }
      }
    },

    async removeScript(scriptId) {
      const script = this.getScriptById(scriptId);
      if (!script) return;

      const opfs = useOPFSActions();
      const { scriptsDir } = await this._getScriptDirectories();

      await opfs.removeFileFromHandle(scriptsDir, `${scriptId}.json`);

      this.scripts = this.scripts.filter(s => s.id !== scriptId);
      if (this.activeScript?.id === scriptId) {
        this.activeScript = null;
        this.selectedNodeId = null;
        this.selectedNodeIds = [];
        this.selectedEdgeId = null;
      }
      await this.syncScriptsMetaToOPFS();
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

    spawnNodeByType(type, customLabel, position = { x: 300, y: 200 }, extraData = {}) {
      if (!this.activeScript) return null;

      const { getNodeBlueprint } = useNodeBlueprint();
      const blueprint = getNodeBlueprint(type);

      if (!blueprint) {
        throw new Error(`[ScriptStore] Blueprint type "${type}" not found in catalog!`);
      }

      const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const defaultData = blueprint.defaultData || {};

      const newNode = createScriptNode({
        id,
        type: blueprint.type || type,
        role: defaultData.role || blueprint.role,
        dynamicMode: blueprint.dynamicMode || 'none',
        position,
        settings: {
          headerTitle: customLabel || blueprint.label || 'Node',
          headerColor: defaultData.settings?.headerColor || '#3b82f6',
          ...defaultData.settings
        },
        inputs: defaultData.inputs,
        outputs: defaultData.outputs,
        data: {
          ...(defaultData.data ? JSON.parse(JSON.stringify(defaultData.data)) : {}),
          ...extraData
        }
      });

      this.addNodeToActive(newNode);
      return id;
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

      const { getNodeBlueprint } = useNodeBlueprint();
      const blueprintItem = getNodeBlueprint(node.type);
      const effectiveMode = (node.dynamicMode && node.dynamicMode !== 'none')
        ? node.dynamicMode
        : (blueprintItem?.dynamicMode || 'none');

      const isDynamicInput = effectiveMode === 'sequential' || effectiveMode === 'inputProperty' || effectiveMode === 'switch' || effectiveMode === 'keyboard' || node.type === 'logicSwitch' || node.type === 'eventOnKey' || node.type === 'eventAdvancedKey';
      const isDynamicOutput = effectiveMode === 'outputProperty' || effectiveMode === 'switch' || effectiveMode === 'keyboard' || node.type === 'logicSwitch' || node.type === 'eventOnKey' || node.type === 'eventAdvancedKey';

      if (type === 'input' && !isDynamicInput) return;
      if (type === 'output' && !isDynamicOutput) return;

      if (!node.dynamicMode || node.dynamicMode === 'none') {
        node.dynamicMode = effectiveMode;
      }

      const newPort = createScriptPort(portData);

      if (type === 'input') {
        if (node.inputs.some(p => p.id === newPort.id)) return;
        node.inputs.push(newPort);

        if (effectiveMode === 'sequential') {
          const { syncDynamicInputsAndCode } = useNodeBlueprint();
          if (typeof syncDynamicInputsAndCode === 'function') {
            syncDynamicInputsAndCode(node);
          }
        }
      } else {
        if (node.outputs.some(p => p.id === newPort.id)) return;
        const defaultIndex = node.outputs.findIndex(p => p.id === 'onDefault');
        if (defaultIndex !== -1) {
          node.outputs.splice(defaultIndex, 0, newPort);
        } else {
          node.outputs.push(newPort);
        }
      }
      
      this.saveActiveScript();
    },

    removeNodePort(nodeId, type, portId) {
      if (!this.activeScript) return;
      const node = this.activeScript.nodes.find(n => n.id === nodeId);
      if (!node) return;

      const { getNodeBlueprint } = useNodeBlueprint();
      const blueprintItem = getNodeBlueprint(node.type);
      const effectiveMode = (node.dynamicMode && node.dynamicMode !== 'none')
        ? node.dynamicMode
        : (blueprintItem?.dynamicMode || 'none');

      const isDynamicInput = effectiveMode === 'sequential' || effectiveMode === 'inputProperty' || effectiveMode === 'switch' || effectiveMode === 'keyboard' || node.type === 'logicSwitch' || node.type === 'eventOnKey' || node.type === 'eventAdvancedKey';
      const isDynamicOutput = effectiveMode === 'outputProperty' || effectiveMode === 'switch' || effectiveMode === 'keyboard' || node.type === 'logicSwitch' || node.type === 'eventOnKey' || node.type === 'eventAdvancedKey';

      if (type === 'input' && !isDynamicInput) return;
      if (type === 'output' && !isDynamicOutput) return;

      if (type === 'input') {
        node.inputs = node.inputs.filter(p => p.id !== portId);
        this.activeScript.edges = this.activeScript.edges.filter(e => 
          !(e.target === nodeId && e.targetHandle === portId)
        );

        if (effectiveMode === 'sequential') {
          const { syncDynamicInputsAndCode } = useNodeBlueprint();
          if (typeof syncDynamicInputsAndCode === 'function') {
            syncDynamicInputsAndCode(node);
          }
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
      const projectStore = useProjectStore();
      
      const cleanScript = JSON.parse(JSON.stringify(toRaw(this.activeScript)));
      this.updateScriptInList(cleanScript.id, {
        nodes: cleanScript.nodes,
        edges: cleanScript.edges,
        localVariables: cleanScript.localVariables
      });

      projectStore.markAsDirty();
    }
  }
});