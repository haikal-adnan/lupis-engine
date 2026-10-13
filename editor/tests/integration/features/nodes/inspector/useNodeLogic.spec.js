import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// 1. Mock composables UI
const mockShowPop = vi.fn();
const mockPrompt = vi.fn();

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt })
}));

// 2. Import composables, store, dan testing helpers
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
      const targetNode = { id: 'node_scene_1', type: 'math_add', data: {} };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_scene_1');

      const { selectedNode } = useNodeLogic();

      expect(selectedNode.value).not.toBeNull();
      expect(selectedNode.value.id).toBe('node_scene_1');
    });

    it('resolves active node from code_editor tab override in workspace store', async () => {
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

      const { selectedNode } = useNodeLogic();

      expect(selectedNode.value.id).toBe('node_editor');
    });
  });

  describe('Node Property Binding and Mutation', () => {
    it('updates nested node data field and pushes change to history stack', async () => {
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

      updateNodeDataField('data.values.threshold', 50);

      expect(scriptStore.activeScript.nodes[0].data.values.threshold).toBe(50);

      scriptHistory.undo();

      expect(scriptStore.activeScript.nodes[0].data.values.threshold).toBe(10);
    });

    it('provides reactive two-way binding using bindNodeProp', async () => {
      const targetNode = { id: 'node_bind_1', label: 'Initial Name' };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_bind_1');

      const { bindNodeProp } = useNodeLogic();
      const labelProp = bindNodeProp('label');

      labelProp.value = 'Updated Name';

      expect(scriptStore.activeScript.nodes[0].label).toBe('Updated Name');
    });

    it('updates node structure payload including inputs, outputs, and data', async () => {
      const targetNode = { id: 'node_struct_1', inputs: [], outputs: [], data: {} };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_struct_1');

      const { updateNodeStructure } = useNodeLogic();

      updateNodeStructure({
        inputs: [{ id: 'in_new', label: 'In' }],
        data: { customVal: 42 }
      });

      const updated = scriptStore.activeScript.nodes[0];
      expect(updated.inputs).toHaveLength(1);
      expect(updated.data.customVal).toBe(42);
    });
  });

  describe('Dynamic Port Management & Manager Delegation', () => {
    it('adds dynamic input port sequentially for math nodes and initializes default value', async () => {
      const targetNode = {
        id: 'node_math_1',
        type: 'math_add',
        dynamicMode: 'sequential',
        inputs: [{ id: 'in_0', label: 'A', dataType: 'number' }],
        data: { values: {} }
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_math_1');

      const { handleAddPort, effectiveDynamicMode } = useNodeLogic();

      expect(effectiveDynamicMode.value).toBe('sequential');

      await handleAddPort('input');

      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(2);
      expect(updatedNode.inputs[1].id).toBe('v1');
      expect(updatedNode.inputs[1].dataType).toBe('number');
      expect(updatedNode.inputs[1].color).toBe('#64B5F6');
    });

    it('manages property options and toggles dropdown target state in inputProperty mode', async () => {
      const targetNode = {
        id: 'node_opt',
        type: 'get_transform',
        dynamicMode: 'inputProperty',
        data: {
          propertyOptions: [
            { value: 'pos_x', label: 'Position X', type: 'number', color: '#ff0000' },
            { value: 'pos_y', label: 'Position Y', type: 'number', color: '#00ff00' }
          ],
          values: {}
        },
        inputs: []
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_opt');

      const { handleAddPort, addFromDropdown, activeDropdownTarget, availableOptions } = useNodeLogic();

      expect(availableOptions.value).toHaveLength(2);

      await handleAddPort('input');
      expect(activeDropdownTarget.value).toBe('input');

      await addFromDropdown('pos_x');

      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(1);
      expect(updatedNode.inputs[0].id).toBe('pos_x');
      expect(updatedNode.inputs[0].label).toBe('Position X');

      expect(availableOptions.value).toHaveLength(1);
      expect(availableOptions.value[0].value).toBe('pos_y');
      expect(activeDropdownTarget.value).toBeNull();
    });

    it('removes dynamic input port, cleans node value, and records edge removal history', async () => {
      const targetNode = {
        id: 'node_dyn',
        type: 'string_join',
        dynamicMode: 'sequential',
        inputs: [{ id: 'port_temp', label: 'Str 1' }],
        data: { values: { port_temp: 'hello' } }
      };
      const edge = { id: 'edge_temp', source: 'other_node', target: 'node_dyn', targetHandle: 'port_temp' };

      const env = await setupMockScriptEnvironment({ nodes: [targetNode], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_dyn');

      const { removeDynamicInput } = useNodeLogic();

      removeDynamicInput('port_temp', 'input');

      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs).toHaveLength(0);
      expect(updatedNode.data.values.port_temp).toBeUndefined();
      expect(scriptStore.activeScript.edges).toHaveLength(0);
    });

    it('updates port label in script store and records change in history', async () => {
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

      updatePortLabel('in_1', 'input', 'New Label');

      expect(scriptStore.activeScript.nodes[0].inputs[0].label).toBe('New Label');
    });
  });

  describe('Node Deletion & Edge Verification', () => {
    it('deletes selected node along with connected edges upon confirmation', async () => {
      const nodeA = { id: 'node_a', type: 'test_node' };
      const nodeB = { id: 'node_b', type: 'test_node' };
      const edge = { id: 'edge_ab', source: 'node_a', target: 'node_b' };

      const env = await setupMockScriptEnvironment({ nodes: [nodeA, nodeB], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_a');

      const { deleteSelectedNode } = useNodeLogic();

      deleteSelectedNode();

      expect(scriptStore.activeScript.nodes).toHaveLength(1);
      expect(scriptStore.activeScript.nodes[0].id).toBe('node_b');
      expect(scriptStore.activeScript.edges).toHaveLength(0);
      expect(scriptStore.selectedNodeId).toBeNull();
    });

    it('checks whether an input port is currently connected via isInputConnected', async () => {
      const targetNode = { id: 'node_target', type: 'test_node' };
      const edge = { id: 'edge_1', source: 'node_src', target: 'node_target', targetHandle: 'in_val' };

      const env = await setupMockScriptEnvironment({ nodes: [targetNode], edges: [edge] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_target');

      const { isInputConnected } = useNodeLogic();

      expect(isInputConnected('in_val')).toBe(true);
      expect(isInputConnected('in_other')).toBe(false);
    });
  });

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] prevents deletion of protected system ports and shows pop alert', async () => {
      const targetNode = {
        id: 'node_protected',
        type: 'test_node',
        dynamicMode: 'sequential',
        inputs: [{ id: 'exec_in', label: 'Execute' }]
      };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_protected');

      const { removeDynamicInput } = useNodeLogic();

      removeDynamicInput('exec_in', 'input');

      expect(scriptStore.activeScript.nodes[0].inputs).toHaveLength(1);
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Protected Port',
        type: 'warning'
      }));
    });

    it('[Bad Path] does not perform edge disconnection if active script has no edges', async () => {
      const targetNode = { id: 'node_no_edge', type: 'test_node' };
      const env = await setupMockScriptEnvironment({ nodes: [targetNode], edges: [] });
      const scriptStore = useScriptStore();

      scriptStore.setActiveScript(env.script);
      scriptStore.setSelectedNode('node_no_edge');

      const { disconnectInvalidEdges } = useNodeLogic();

      expect(() => {
        disconnectInvalidEdges('port_unknown');
      }).not.toThrow();
    });
  });
});