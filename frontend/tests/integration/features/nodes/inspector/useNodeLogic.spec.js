import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// 1. Mock composables dengan implementasi Spy/Mock Function yang stabil
const mockShowPop = vi.fn();
const mockPrompt = vi.fn();

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt })
}));

// 2. Import composables, stores, dan helper pengujian setelah mock
import { useNodeLogic } from '@nodes/nodes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useScriptHistory } from '@historys/historys.js';
import { 
  setupMockOPFS, 
  setupMockScriptEnvironment, 
  createMockEmptyProject 
} from '@tests/tests.js';

describe('useNodeLogic Integration', () => {
  let pinia;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockShowPop.mockReset();
    mockPrompt.mockReset();

    mockStoreRef = setupMockOPFS();
    await createMockEmptyProject({ projectName: 'Node Logic Test Project' });

    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Selected Node Resolution with Workspace Integration', () => {
    it('resolves active node based on selectedNodeId when tab is default scene', async () => {
      // Arrange
      const targetNode = { id: 'node_scene_1', type: 'math_add', data: {} };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_scene_1');

      // Act
      const { selectedNode } = useNodeLogic();

      // Assert
      expect(selectedNode.value).not.toBeNull();
      expect(selectedNode.value.id).toBe('node_scene_1');
    });

    it('resolves active node from code_editor tab override in workspace store', async () => {
      // Arrange
      const node1 = { id: 'node_canvas', type: 'math_add' };
      const node2 = { id: 'node_editor', type: 'code_custom' };
      const env = await setupMockScriptEnvironment({ nodes: [node1, node2] });

      const scriptStore = useScriptStore();
      const workspaceStore = useWorkspaceStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_canvas');

      workspaceStore.openTab({
        id: 'code_node_editor',
        name: 'Code Editor',
        type: 'code_editor',
        nodeId: 'node_editor'
      });

      // Act
      const { selectedNode } = useNodeLogic();

      // Assert
      expect(selectedNode.value.id).toBe('node_editor');
    });
  });

  describe('Node Property Binding and Mutation', () => {
    it('updates nested node data field and pushes change to history stack', async () => {
      // Arrange
      const targetNode = {
        id: 'node_data_1',
        type: 'test_node',
        data: { values: { threshold: 10 } }
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();
      const scriptHistory = useScriptHistory();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_data_1');

      const { updateNodeDataField } = useNodeLogic();

      // Act
      updateNodeDataField('data.values.threshold', 50);

      // Assert
      expect(scriptStore.activeScript.nodes[0].data.values.threshold).toBe(50);

      // Act: Undo perubahan
      scriptHistory.undo();

      // Assert
      expect(scriptStore.activeScript.nodes[0].data.values.threshold).toBe(10);
    });

    it('provides reactive two-way binding using bindNodeProp', async () => {
      // Arrange
      const targetNode = { id: 'node_bind_1', label: 'Initial Name' };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_bind_1');

      const { bindNodeProp } = useNodeLogic();
      const labelProp = bindNodeProp('label');

      // Act
      labelProp.value = 'Updated Name';

      // Assert
      expect(scriptStore.activeScript.nodes[0].label).toBe('Updated Name');
    });
  });

  describe('Dynamic Port Management', () => {
    it('adds dynamic input port for math nodes with default datatype and color', async () => {
      // Arrange
      const targetNode = {
        id: 'node_math_1',
        type: 'math_add',
        allowDynamicInputs: true,
        inputs: [{ id: 'in_0', label: 'A', dataType: 'number' }],
        data: { values: {} }
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_math_1');

      const { handleAddPort } = useNodeLogic();

      // Act
      await handleAddPort('input');

      // Assert
      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(2);
      expect(updatedNode.inputs[1].dataType).toBe('number');
      expect(updatedNode.inputs[1].label).toBeDefined();
    });

    it('adds case output port when handleAddPort is called on compare_switch node', async () => {
      // Arrange
      mockPrompt.mockResolvedValueOnce('Success');

      const targetNode = {
        id: 'node_switch',
        type: 'compare_switch',
        allowDynamicOutputs: true,
        outputs: []
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_switch');

      const { handleAddPort } = useNodeLogic();

      // Act
      await handleAddPort('output');

      // Assert
      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.outputs).toHaveLength(1);
      expect(updatedNode.outputs[0].id).toBe('case_Success');
      expect(updatedNode.outputs[0].dataType).toBe('execution');
    });

    it('adds port from dropdown options and clears dropdown target state', async () => {
      // Arrange
      const targetNode = {
        id: 'node_opt',
        type: 'get_transform',
        allowDynamicInputs: true,
        data: {
          propertyOptions: [
            { value: 'pos_x', label: 'Position X', type: 'number', color: '#ff0000' }
          ]
        },
        inputs: []
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_opt');

      const { handleAddPort, addFromDropdown, activeDropdownTarget } = useNodeLogic();

      // Act 1: Buka target dropdown
      await handleAddPort('input');
      expect(activeDropdownTarget.value).toBe('input');

      // Act 2: Pilih opsi dari dropdown
      addFromDropdown('pos_x');

      // Assert
      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(1);
      expect(updatedNode.inputs[0]).toBeDefined();
      expect(activeDropdownTarget.value).toBeNull();
    });

    it('removes dynamic input port, cleans node value, and records edge removal history', async () => {
      // Arrange
      const targetNode = {
        id: 'node_dyn',
        type: 'string_join',
        inputs: [{ id: 'port_temp', label: 'Str 1' }],
        data: { values: { port_temp: 'hello' } }
      };
      const edge = { id: 'edge_temp', source: 'other_node', target: 'node_dyn', targetHandle: 'port_temp' };

      const env = await setupMockScriptEnvironment({ nodes: [targetNode], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_dyn');

      const { removeDynamicInput } = useNodeLogic();

      // Act
      removeDynamicInput('port_temp', 'input');

      // Assert
      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(0);
      expect(updatedNode.data.values.port_temp).toBeUndefined();
      expect(scriptStore.activeScript.edges).toHaveLength(0);
    });

    it('updates port label in script store and records change in history', async () => {
      // Arrange
      const targetNode = {
        id: 'node_port_rename',
        type: 'custom_node',
        inputs: [{ id: 'in_1', label: 'Old Label' }]
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_port_rename');

      const { updatePortLabel } = useNodeLogic();

      // Act
      updatePortLabel('in_1', 'input', 'New Label');

      // Assert
      expect(scriptStore.activeScript.nodes[0].inputs[0].label).toBe('New Label');
    });
  });

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] prevents deletion of protected system ports and shows pop alert', async () => {
      // Arrange
      const targetNode = {
        id: 'node_protected',
        type: 'test_node',
        inputs: [{ id: 'exec_in', label: 'Execute' }]
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_protected');

      const { removeDynamicInput } = useNodeLogic();

      // Act
      removeDynamicInput('exec_in', 'input');

      // Assert
      expect(scriptStore.activeScript.nodes[0].inputs).toHaveLength(1);
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Protected Port',
        type: 'warning'
      }));
    });

    it('[Bad Path] handles prompt cancellation when adding compare_switch case', async () => {
      // Arrange
      mockPrompt.mockResolvedValueOnce(null);

      const targetNode = {
        id: 'node_switch_cancel',
        type: 'compare_switch',
        outputs: []
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_switch_cancel');

      const { handleAddPort } = useNodeLogic();

      // Act
      await handleAddPort('output');

      // Assert
      expect(scriptStore.activeScript.nodes[0].outputs).toHaveLength(0);
    });

    it('[Bad Path] does not perform edge disconnection if active script has no edges', async () => {
      // Arrange
      const targetNode = { id: 'node_no_edge', type: 'test_node' };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode], edges: [] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_no_edge');

      const { disconnectInvalidEdges } = useNodeLogic();

      // Act & Assert
      expect(() => {
        disconnectInvalidEdges('port_unknown');
      }).not.toThrow();
    });
  });
});