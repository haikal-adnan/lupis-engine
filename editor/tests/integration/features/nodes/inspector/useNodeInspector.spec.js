import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// 1. Mock dependencies eksternal & composable terkait untuk memutus circular dependency
vi.mock('@nodes/nodes.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn(),
      nodeGroups: []
    })),
    useVariableConfig: vi.fn(() => ({
      getVarColor: vi.fn(() => '#64B5F6')
    }))
  };
});

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({ showPop: vi.fn() })),
  usePrompt: vi.fn(() => ({ prompt: vi.fn() }))
}));

// 2. Import composables dan modul yang diuji setelah mock
import { useNodeInspector } from '@nodes/nodes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { 
  setupMockOPFS, 
  setupMockScriptEnvironment, 
  createMockEmptyProject 
} from '@tests/tests.js';

describe('useNodeInspector Integration', () => {
  let pinia;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    // Setup mock environment (OPFS & Project)
    mockStoreRef = setupMockOPFS();
    await createMockEmptyProject({ projectName: 'Inspector Integration Test' });

    // Stub window confirmation dialog
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Node Selection and Property Resolution', () => {
    it('resolves explicit node passed via props over active store selection', async () => {
      // Arrange
      const explicitNode = { id: 'explicit_node', type: 'math_add', data: { values: { a: 10 } } };
      await setupMockScriptEnvironment();

      // Act
      const { node } = useNodeInspector({ node: explicitNode });

      // Assert
      expect(node.value).toEqual(explicitNode);
      expect(node.value.id).toBe('explicit_node');
    });

    it('resolves selected node dynamically from active script store', async () => {
      // Arrange
      const targetNode = { id: 'store_node_1', type: 'logic_and', data: { values: {} } };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('store_node_1');

      // Act
      const { node } = useNodeInspector();

      // Assert
      expect(node.value).not.toBeNull();
      expect(node.value.id).toBe('store_node_1');
    });

    it('retrieves nested node data fields, modes, and modifiers accurately', async () => {
      // Arrange
      const nodeData = {
        id: 'node_complex',
        type: 'custom_type',
        data: {
          values: { health: 100 },
          valueModes: { health: 'variable' },
          variableBindings: { health: 'var_hp_id' },
          variableModifiers: { health: { type: 'add', value: 20 } }
        }
      };
      const env = await setupMockScriptEnvironment({ nodes: [nodeData] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_complex');

      const inspector = useNodeInspector();

      // Act & Assert
      expect(inspector.getValue('health')).toBe(100);
      expect(inspector.getMode('health')).toBe('variable');
      expect(inspector.getVariableBinding('health')).toBe('var_hp_id');
      expect(inspector.getVariableModifier('health')).toEqual({ type: 'add', value: 20 });
    });
  });

  describe('Data Mutation and History Synchronization', () => {
    it('updates node field values and allows undoing via script history', async () => {
      // Arrange
      const nodeData = {
        id: 'node_math',
        type: 'math_add',
        data: { values: { input_a: 5 } }
      };
      const env = await setupMockScriptEnvironment({ nodes: [nodeData] });
      const scriptStore = useScriptStore();
      const scriptHistory = useScriptHistory();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_math');

      const inspector = useNodeInspector();

      // Act: Update nilai
      inspector.updateNodeValue('input_a', 42);

      // Assert: Perubahan masuk ke store
      expect(inspector.getValue('input_a')).toBe(42);

      // Act: Undo transaksi
      scriptHistory.undo();

      // Assert: Nilai kembali ke kondisi semula
      expect(scriptStore.activeScript.nodes[0].data.values.input_a).toBe(5);
    });

    it('toggles value mode between input and variable seamlessly', async () => {
      // Arrange
      const nodeData = {
        id: 'node_toggle',
        type: 'test_node',
        data: { valueModes: { speed: 'input' } }
      };
      const env = await setupMockScriptEnvironment({ nodes: [nodeData] });
      const scriptStore = useScriptStore();
      const scriptHistory = useScriptHistory();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_toggle');

      const inspector = useNodeInspector();

      // Act 1: Toggle dari 'input' ke 'variable'
      inspector.toggleMode('speed');

      // Assert 1
      expect(inspector.getMode('speed')).toBe('variable');

      // Act 2: Undo
      scriptHistory.undo();

      // Assert 2
      expect(inspector.getMode('speed')).toBe('input');
    });

    it('binds property to a two-way computed getter and setter', async () => {
      // Arrange
      const nodeData = {
        id: 'node_bind',
        type: 'test_node',
        label: 'Old Label'
      };
      const env = await setupMockScriptEnvironment({ nodes: [nodeData] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_bind');

      const inspector = useNodeInspector();
      const labelRef = inspector.bindNodeProp('label');

      // Act
      labelRef.value = 'New Label';

      // Assert
      expect(scriptStore.activeScript.nodes[0].label).toBe('New Label');
    });

    it('[Bad Path] blocks updateNodeValue when the specified input port is connected', async () => {
      // Arrange
      const nodeA = { id: 'node_a', inputs: [], outputs: [{ id: 'out_1' }] };
      const nodeB = { id: 'node_b', inputs: [{ id: 'in_1' }], data: { values: { in_1: 'original' } } };
      const edge = { id: 'edge_1', source: 'node_a', sourceHandle: 'out_1', target: 'node_b', targetHandle: 'in_1' };

      const env = await setupMockScriptEnvironment({ nodes: [nodeA, nodeB], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_b');

      const inspector = useNodeInspector();

      // Act: Mencoba mengubah nilai port yang terhubung dengan edge
      inspector.updateNodeValue('in_1', 'blocked_value');

      // Assert: Nilai tidak berubah karena terhalang koneksi edge
      expect(inspector.getValue('in_1')).toBe('original');
    });
  });

  describe('Edge Disconnection and Type Validation', () => {
    it('removes connected edge when new data type is mismatched', async () => {
      // Arrange
      const nodeA = { id: 'node_a', outputs: [{ id: 'port_a', dataType: 'number' }] };
      const nodeB = { id: 'node_b', inputs: [{ id: 'port_b', dataType: 'number' }] };
      const edge = { id: 'edge_ab', source: 'node_a', sourceHandle: 'port_a', target: 'node_b', targetHandle: 'port_b' };

      const env = await setupMockScriptEnvironment({ nodes: [nodeA, nodeB], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_b');

      const inspector = useNodeInspector();

      // Act: Putuskan edge jika tipe data diubah menjadi 'string' (mismatch)
      inspector.disconnectInvalidEdges('port_b', 'string');

      // Assert: Edge dihapus dari store
      expect(scriptStore.activeScript.edges).toHaveLength(0);
    });

    it('keeps connected edge when new data type matches or is set to any', async () => {
      // Arrange
      const nodeA = { id: 'node_a', outputs: [{ id: 'port_a', dataType: 'boolean' }] };
      const nodeB = { id: 'node_b', inputs: [{ id: 'port_b', dataType: 'boolean' }] };
      const edge = { id: 'edge_ab', source: 'node_a', sourceHandle: 'port_a', target: 'node_b', targetHandle: 'port_b' };

      const env = await setupMockScriptEnvironment({ nodes: [nodeA, nodeB], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_b');

      const inspector = useNodeInspector();

      // Act: Disconnect dengan tipe data yang cocok
      inspector.disconnectInvalidEdges('port_b', 'boolean');

      // Assert: Edge tetap ada
      expect(scriptStore.activeScript.edges).toHaveLength(1);
    });
  });

  describe('Node Deletion and Cleanup', () => {
    it('deletes selected node along with connected edges and clears selection', async () => {
      // Arrange
      const nodeA = { id: 'node_a', inputs: [], outputs: [] };
      const nodeB = { id: 'node_b', inputs: [], outputs: [] };
      const edge = { id: 'edge_1', source: 'node_a', target: 'node_b' };

      const env = await setupMockScriptEnvironment({ nodes: [nodeA, nodeB], edges: [edge] });
      const scriptStore = useScriptStore();
      const scriptHistory = useScriptHistory();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_a');

      const inspector = useNodeInspector();

      // Act
      inspector.deleteSelectedNode();

      // Assert: Node dan edge terhubung dihapus
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_a')).toBeUndefined();
      expect(scriptStore.activeScript.edges).toHaveLength(0);
      expect(scriptStore.selectedNodeId).toBeNull();

      // Act: Undo penghapusan
      scriptHistory.undo();

      // Assert: Node dan edge kembali terpulihkan
      expect(scriptStore.activeScript.nodes).toHaveLength(2);
      expect(scriptStore.activeScript.edges).toHaveLength(1);
    });

    it('[Bad Path] retains node when user cancels deletion in confirm dialog', async () => {
      // Arrange: Stub confirm untuk mengembalikan false
      vi.stubGlobal('confirm', vi.fn(() => false));

      const nodeA = { id: 'node_a', inputs: [], outputs: [] };
      const env = await setupMockScriptEnvironment({ nodes: [nodeA] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_a');

      const inspector = useNodeInspector();

      // Act
      inspector.deleteSelectedNode();

      // Assert: Node tidak jadi dihapus
      expect(scriptStore.activeScript.nodes).toHaveLength(1);
      expect(scriptStore.selectedNodeId).toBe('node_a');
    });
  });

  describe('isErrorNotSet & Variable Input Synchronization', () => {
    it('returns false for variable-bound input even if direct value is empty string or undefined', async () => {
      const nodeWithVar = {
        id: 'node_var_test',
        type: 'actionSetGameState',
        inputs: [{ id: 'action', dataType: 'string' }],
        data: {
          values: { action: '' },
          valueModes: { action: 'variable' },
          variableBindings: { action: 'var_state_id' }
        }
      };

      const env = await setupMockScriptEnvironment({ nodes: [nodeWithVar] });
      const scriptStore = useScriptStore();
      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_var_test');

      const inspector = useNodeInspector();

      expect(inspector.getMode('action')).toBe('variable');
      expect(inspector.getVariableBinding('action')).toBe('var_state_id');
      expect(inspector.isErrorNotSet('action', '')).toBe(false);
      expect(inspector.isErrorNotSet('action')).toBe(false);
    });

    it('returns true when in variable mode but variable binding is empty or null', async () => {
      const nodeUnboundVar = {
        id: 'node_unbound_test',
        type: 'actionSetGameState',
        inputs: [{ id: 'action', dataType: 'string' }],
        data: {
          values: { action: '' },
          valueModes: { action: 'variable' },
          variableBindings: { action: null }
        }
      };

      const env = await setupMockScriptEnvironment({ nodes: [nodeUnboundVar] });
      const scriptStore = useScriptStore();
      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_unbound_test');

      const inspector = useNodeInspector();

      expect(inspector.getMode('action')).toBe('variable');
      expect(inspector.isErrorNotSet('action')).toBe(true);
      expect(inspector.isErrorNotSet('action', '')).toBe(true);
    });

    it('infers mode as variable if variableBindings exists even when valueModes is omitted', async () => {
      const nodeOmittedMode = {
        id: 'node_omitted_mode',
        type: 'actionSetGameState',
        inputs: [{ id: 'speed', dataType: 'number' }],
        data: {
          values: { speed: 0 },
          variableBindings: { speed: 'var_speed_1' }
        }
      };

      const env = await setupMockScriptEnvironment({ nodes: [nodeOmittedMode] });
      const scriptStore = useScriptStore();
      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_omitted_mode');

      const inspector = useNodeInspector();

      expect(inspector.getMode('speed')).toBe('variable');
      expect(inspector.isErrorNotSet('speed', 0)).toBe(false);
    });

    it('checks direct value in input mode properly', async () => {
      const nodeDirect = {
        id: 'node_direct',
        type: 'actionSetGameState',
        inputs: [{ id: 'msg', dataType: 'string' }],
        data: {
          values: { msg: '' },
          valueModes: { msg: 'input' }
        }
      };

      const env = await setupMockScriptEnvironment({ nodes: [nodeDirect] });
      const scriptStore = useScriptStore();
      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_direct');

      const inspector = useNodeInspector();

      expect(inspector.getMode('msg')).toBe('input');
      expect(inspector.isErrorNotSet('msg', '')).toBe(true);
      expect(inspector.isErrorNotSet('msg', 'hello')).toBe(false);
    });

    it('always returns false for targetEntity and targetLayer defaults', async () => {
      const nodeTarget = {
        id: 'node_target',
        type: 'someType',
        inputs: [{ id: 'targetEntity', dataType: 'string' }],
        data: { values: { targetEntity: '' } }
      };

      const env = await setupMockScriptEnvironment({ nodes: [nodeTarget] });
      const scriptStore = useScriptStore();
      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_target');

      const inspector = useNodeInspector();

      expect(inspector.isErrorNotSet('targetEntity', '')).toBe(false);
      expect(inspector.isErrorNotSet('targetLayer', '')).toBe(false);
    });
  });
});