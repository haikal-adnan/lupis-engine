import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useScriptHistory } from '@historys/historys.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { setupMockScriptEnvironment, setupMockOPFS } from '@tests/tests.js';

// Mock dependencies external di luar batas pengujian integrasi
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateEntity: vi.fn(),
    updateComponentProp: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));

vi.mock('@nodes/nodes.js', () => ({
  useNodeBlueprint: () => ({
    syncDynamicInputsAndCode: vi.fn()
  })
}));

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    getProjectsRootDirectory: vi.fn().mockResolvedValue({}),
    resolveDirectoryPath: vi.fn().mockResolvedValue({}),
    writeFileToHandle: vi.fn().mockResolvedValue(true),
    removeFileFromHandle: vi.fn().mockResolvedValue(true)
  })
}));

describe('useScriptHistory Integration', () => {
  let scriptStore;
  let workspaceStore;
  let scriptHistory;
  let activeScript;

  beforeEach(async () => {
    // Inisialisasi OPFS Mock pada global navigator.storage
    setupMockOPFS();

    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia());

    scriptStore = useScriptStore();
    workspaceStore = useWorkspaceStore();

    // Setup environment script mock
    const env = await setupMockScriptEnvironment({
      scriptName: 'Test Visual Script',
      nodes: [
        { id: 'node_start', type: 'start', label: 'Start', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
        { id: 'node_log', type: 'action', label: 'Log', position: { x: 100, y: 100 }, inputs: [{ id: 'in_1', label: 'In' }], outputs: [{ id: 'out_1', label: 'Out' }] }
      ],
      edges: [
        { id: 'edge_1', source: 'node_start', target: 'node_log', sourceHandle: 'exec', targetHandle: 'in_1' }
      ]
    });

    activeScript = env.script;
    scriptStore.setActiveScript(activeScript);

    // Setup tab di workspaceStore agar useHistory dapat menentukan key yang valid (`tab_${id}`)
    workspaceStore.tabs = [{ id: 'tab_script_1', type: 'script', scriptId: activeScript.id }];

    scriptHistory = useScriptHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Node Manipulations Recording and Undo/Redo Integration', () => {
    it('records node movement and restores node position on undo, then reapplies on redo', () => {
      // Arrange
      const nodeToMove = scriptStore.activeScript.nodes.find(n => n.id === 'node_log');
      const oldPos = { x: 100, y: 100 };
      const newPos = { x: 300, y: 400 };

      const movedNodes = [{ id: 'node_log', oldPos, newPos }];

      // Act
      nodeToMove.position = newPos;
      scriptStore.saveActiveScript();
      scriptHistory.recordMoveNodes(movedNodes);

      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_log').position).toEqual({ x: 300, y: 400 });

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_log').position).toEqual({ x: 100, y: 100 });
      expect(scriptStore.selectedNodeId).toBe('node_log');

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_log').position).toEqual({ x: 300, y: 400 });
    });

    it('records node addition and removes it on undo, then restores on redo', () => {
      // Arrange
      const newRawNode = { id: 'node_new', type: 'variable', label: 'VarNode', position: { x: 50, y: 50 } };

      // Act
      scriptStore.addNodeToActive(newRawNode);
      scriptHistory.recordAddNode(newRawNode);

      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_new')).toBe(true);

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_new')).toBe(false);

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_new')).toBe(true);
      expect(scriptStore.selectedNodeId).toBe('node_new');
    });

    it('records node removal along with connected edges and restores them on undo', () => {
      // Arrange
      const nodeToRemove = scriptStore.activeScript.nodes.find(n => n.id === 'node_log');
      const connectedEdges = scriptStore.activeScript.edges.filter(e => e.target === 'node_log' || e.source === 'node_log');

      // Act
      scriptHistory.recordRemoveNodes([nodeToRemove], connectedEdges);
      scriptStore.removeNodeFromActive('node_log');

      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_log')).toBe(false);
      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_1')).toBe(false);

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_log')).toBe(true);
      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_1')).toBe(true);

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.nodes.some(n => n.id === 'node_log')).toBe(false);
      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_1')).toBe(false);
    });

    it('records node data property changes and reverts node state on undo', () => {
      // Arrange
      const nodeId = 'node_log';
      const oldLabel = 'Log';
      const newLabel = 'Log Message';

      // Act
      scriptHistory.recordNodeDataChange(nodeId, 'label', oldLabel, newLabel);
      scriptStore.updateNodeInActive(nodeId, { label: newLabel });

      expect(scriptStore.activeScript.nodes.find(n => n.id === nodeId).label).toBe('Log Message');

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === nodeId).label).toBe('Log');

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === nodeId).label).toBe('Log Message');
    });
  });

  describe('Edge and Port Manipulations Recording and Undo/Redo Integration', () => {
    it('records edge creation and removes edge on undo, then reconnects on redo', () => {
      // Arrange
      const newEdge = { id: 'edge_new', source: 'node_start', target: 'node_log', sourceHandle: 'out_2', targetHandle: 'in_2' };

      // Act
      scriptStore.addEdgeToActive(newEdge);
      scriptHistory.recordAddEdge(newEdge);

      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_new')).toBe(true);

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_new')).toBe(false);

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.edges.some(e => e.id === 'edge_new')).toBe(true);
      expect(scriptStore.selectedEdgeId).toBe('edge_new');
    });

    it('records port addition on a node and removes port on undo', () => {
      // Arrange
      const nodeId = 'node_log';
      const node = scriptStore.activeScript.nodes.find(n => n.id === nodeId);
      node.allowDynamicInputs = true;

      const newPort = {
        id: 'in_dynamic_1',
        name: 'in_dynamic_1',
        label: 'Value B',
        type: 'input',
        dataType: 'number'
      };

      // Act: Tambahkan port langsung ke node inputs untuk mempertahankan referensi ID objek
      node.inputs.push(newPort);
      scriptStore.saveActiveScript();
      scriptHistory.recordPortChange(nodeId, 'ADD', newPort, 'input', []);

      expect(node.inputs.some(p => p.id === 'in_dynamic_1')).toBe(true);

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === nodeId).inputs.some(p => p.id === 'in_dynamic_1')).toBe(false);

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.nodes.find(n => n.id === nodeId).inputs.some(p => p.id === 'in_dynamic_1')).toBe(true);
    });
  });

  describe('Local Variables Management Integration', () => {
    it('records local variables changes and syncs scriptStore state on undo/redo', () => {
      // Arrange
      const oldVars = [{ id: 'v1', name: 'speed', defaultValue: 10 }];
      const newVars = [{ id: 'v1', name: 'speed', defaultValue: 10 }, { id: 'v2', name: 'health', defaultValue: 100 }];

      // Act
      scriptHistory.recordLocalVariableChange(oldVars, newVars);
      scriptStore.activeScript.localVariables = newVars;
      scriptStore.saveActiveScript();

      expect(scriptStore.activeScript.localVariables).toHaveLength(2);

      // Assert Undo
      scriptHistory.undo();
      expect(scriptStore.activeScript.localVariables).toHaveLength(1);
      expect(scriptStore.activeScript.localVariables[0].name).toBe('speed');

      // Assert Redo
      scriptHistory.redo();
      expect(scriptStore.activeScript.localVariables).toHaveLength(2);
      expect(scriptStore.activeScript.localVariables[1].name).toBe('health');
    });
  });

  describe('Edge Cases and Inactive Script Handling', () => {
    it('[Bad Path] ignores history recording when no active script is set in scriptStore', () => {
      // Arrange
      scriptStore.activeScript = null;
      const rawNode = { id: 'node_orphan', label: 'Orphan' };

      // Act
      scriptHistory.recordAddNode(rawNode);

      // Assert: Set active script back and verify undo performs no operation
      scriptStore.setActiveScript(activeScript);
      const initialNodesCount = activeScript.nodes.length;

      scriptHistory.undo();
      expect(scriptStore.activeScript.nodes.length).toBe(initialNodesCount);
    });

    it('[Bad Path] ignores node data change recording when old and new values are identical', () => {
      // Arrange
      const currentValue = 'Start';

      // Act
      scriptHistory.recordNodeDataChange('node_start', 'label', currentValue, currentValue);

      // Assert: Undo shouldn't modify store state
      const initialLabel = scriptStore.activeScript.nodes.find(n => n.id === 'node_start').label;
      scriptHistory.undo();
      const afterUndoLabel = scriptStore.activeScript.nodes.find(n => n.id === 'node_start').label;

      expect(initialLabel).toBe(afterUndoLabel);
    });
  });
});