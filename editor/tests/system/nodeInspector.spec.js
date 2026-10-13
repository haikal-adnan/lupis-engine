import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { shallowMount, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';

import NodePanel from '@nodes/inspector/layouts/NodePanel.vue';
import CodePanel from '@nodes/graph/layouts/CodePanel.vue';

import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js';

// Mock composables & modul UI eksternal
vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({ showPop: vi.fn() })),
  usePrompt: vi.fn(() => ({ prompt: vi.fn() })),
  useTheme: vi.fn(() => ({ isDark: { value: true } }))
}));

describe('Node Inspector & Code Panel Integration Tests', () => {
  let pinia;
  let scriptStore;
  let projectStore;
  let workspaceStore;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockStoreRef = setupMockOPFS();

    projectStore = useProjectStore();
    scriptStore = useScriptStore();
    workspaceStore = useWorkspaceStore();

    const mockProject = await createMockEmptyProject({ projectName: 'Inspector Test Project' });
    projectStore.project = mockProject;

    const initialScript = {
      id: 'script_inspector_1',
      name: 'TestScript',
      type: 'component',
      localVariables: [
        { id: 'var_speed', name: 'moveSpeed', type: 'Number', defaultValue: 100, isExposed: true },
        { id: 'var_name', name: 'playerName', type: 'String', defaultValue: 'Hero', isExposed: true }
      ],
      nodes: [
        {
          id: 'node_math_1',
          type: 'math_add',
          name: 'Math Add',
          dynamicMode: 'sequential',
          dynamicData: null,
          settings: { headerTitle: 'Math Add', headerColor: '#00e676', description: 'Adds two numbers' },
          data: {
            values: { v0: 10, v1: 20 },
            code: `const val1 = inputs['Val 1'];\nconst val2 = inputs['Val 2'];\noutputs['Result'] = val1 + val2;\nreturn;`
          },
          inputs: [
            { id: 'v0', label: 'Val 1', dataType: 'number' },
            { id: 'v1', label: 'Val 2', dataType: 'number' }
          ],
          outputs: [
            { id: 'res', label: 'Result', dataType: 'number' }
          ]
        },
        {
          id: 'node_var_1',
          type: 'variable_get',
          name: 'Get moveSpeed',
          dynamicMode: 'none',
          dynamicData: null,
          settings: { headerTitle: 'Get moveSpeed', headerColor: '#00e676' },
          data: {
            variableId: 'var_speed',
            scope: 'Local',
            code: `outputs['out_0'] = context.getLocal('moveSpeed');\nreturn;`
          },
          inputs: [],
          outputs: [
            { id: 'out_0', label: 'moveSpeed', dataType: 'number' }
          ]
        }
      ],
      edges: []
    };

    scriptStore.initScripts([initialScript]);
    scriptStore.setActiveScript(initialScript);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Node Inspector Data & Parameter Binding', () => {
    it('renders selected node parameters and updates store values on user input', async () => {
      scriptStore.setSelectedNode('node_math_1');

      const wrapper = shallowMount(NodePanel);

      const activeNode = scriptStore.activeScript.nodes.find(n => n.id === 'node_math_1');
      activeNode.data.values.v0 = 50;
      scriptStore.saveActiveScript();

      await wrapper.vm.$nextTick();

      expect(scriptStore.activeScript.nodes[0].data.values.v0).toBe(50);
    });

    it('updates node header title and syncs across node settings in store', async () => {
      scriptStore.setSelectedNode('node_math_1');

      const wrapper = shallowMount(NodePanel);

      const activeNode = scriptStore.activeScript.nodes.find(n => n.id === 'node_math_1');
      activeNode.settings.headerTitle = 'Custom Math Adder';
      scriptStore.saveActiveScript();

      await wrapper.vm.$nextTick();

      expect(scriptStore.activeScript.nodes[0].settings.headerTitle).toBe('Custom Math Adder');
    });

    it('disables parameter controls and renders selection warning when multiple nodes are selected', async () => {
      scriptStore.setSelectedNodes(['node_math_1', 'node_var_1']);

      const wrapper = mount(NodePanel);
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('2 Nodes Selected');
      expect(wrapper.text()).toContain('Node settings nonaktif ketika lebih dari 1 node dipilih');
    });
  });

  describe('Variable Selection & Inspector Sync', () => {
    it('switches variable target on variable node and automatically updates node code & output ports', async () => {
      scriptStore.setSelectedNode('node_var_1');

      const wrapper = shallowMount(NodePanel);

      const activeNode = scriptStore.activeScript.nodes.find(n => n.id === 'node_var_1');
      const targetVar = scriptStore.activeScript.localVariables.find(v => v.id === 'var_name');

      activeNode.data.variableId = targetVar.id;
      activeNode.data.code = `outputs['out_0'] = context.getLocal('${targetVar.name}');\nreturn;`;
      activeNode.outputs[0].label = targetVar.name;
      activeNode.outputs[0].dataType = 'string';

      scriptStore.saveActiveScript();
      await wrapper.vm.$nextTick();

      const updatedNode = scriptStore.activeScript.nodes.find(n => n.id === 'node_var_1');
      expect(updatedNode.data.variableId).toBe('var_name');
      expect(updatedNode.data.code).toContain("context.getLocal('playerName')");
      expect(updatedNode.outputs[0].dataType).toBe('string');
    });
  });

  describe('Node Edge Inspector Integration', () => {
    it('displays modifier controls when an edge is selected and updates edge modifier data in store', async () => {
      const edge = {
        id: 'edge_test_1',
        source: 'node_var_1',
        sourceHandle: 'out_0',
        target: 'node_math_1',
        targetHandle: 'v0',
        modifier: { type: 'none', value: 0 }
      };
      scriptStore.activeScript.edges = [edge];
      scriptStore.setSelectedEdge('edge_test_1');

      const wrapper = shallowMount(NodePanel);

      scriptStore.updateEdgeModifier('edge_test_1', { type: 'add', value: 15 });
      await wrapper.vm.$nextTick();

      const updatedEdge = scriptStore.activeScript.edges.find(e => e.id === 'edge_test_1');
      expect(updatedEdge.modifier.type).toBe('add');
      expect(updatedEdge.modifier.value).toBe(15);
    });
  });

  describe('Code Panel & Editor Communication', () => {
    it('loads target node code when opening a code_editor tab in workspace', async () => {
      workspaceStore.openTab({
        id: 'code_node_math_1',
        name: 'Math Add',
        type: 'code_editor',
        nodeId: 'node_math_1'
      });

      const wrapper = mount(CodePanel);

      const textarea = wrapper.find('.code-textarea');
      expect(textarea.exists()).toBe(true);
      expect(textarea.element.value).toContain("inputs['Val 1']");
    });

    it('validates port references in code and highlights missing port issues real-time', async () => {
      workspaceStore.openTab({
        id: 'code_node_math_1',
        name: 'Math Add',
        type: 'code_editor',
        nodeId: 'node_math_1'
      });

      const wrapper = mount(CodePanel);

      const textarea = wrapper.find('.code-textarea');
      await textarea.setValue(`const x = inputs['UndefinedPort'];\nreturn;`);

      expect(wrapper.text()).toContain("Input 'UndefinedPort' is used in code, but is not defined");
    });

    it('automatically closes code_editor tab when the underlying node is deleted from canvas', async () => {
      workspaceStore.openTab({
        id: 'code_node_math_1',
        name: 'Math Add',
        type: 'code_editor',
        nodeId: 'node_math_1'
      });

      expect(workspaceStore.activeTab?.id).toBe('code_node_math_1');

      scriptStore.removeNodeFromActive('node_math_1');

      const wrapper = mount(CodePanel);
      await wrapper.vm.$nextTick();

      const tabList = workspaceStore.tabs || workspaceStore.openTabs || [];
      expect(tabList.find(t => t.id === 'code_node_math_1')).toBeUndefined();
    });
  });

  describe('Dynamic Port & Code Synchronization Integration', () => {
    it('syncs dynamic ports added via inspector with code panel validation', async () => {
      scriptStore.setSelectedNode('node_math_1');
      const activeNode = scriptStore.activeScript.nodes.find(n => n.id === 'node_math_1');
      activeNode.dynamicMode = 'sequential';
      activeNode.dynamicData = null;

      scriptStore.addNodePort('node_math_1', 'input', {
        id: 'v2',
        label: 'Val 3',
        dataType: 'number'
      });

      workspaceStore.openTab({
        id: 'code_node_math_1',
        name: 'Math Add',
        type: 'code_editor',
        nodeId: 'node_math_1'
      });

      const wrapper = mount(CodePanel);

      const textarea = wrapper.find('.code-textarea');
      await textarea.setValue(`const v1 = inputs['Val 1'];\nconst v2 = inputs['Val 2'];\nconst v3 = inputs['Val 3'];\noutputs['Result'] = v1 + v2 + v3;\nreturn;`);

      expect(wrapper.text()).toContain('Inputs: 3/3');
      expect(wrapper.text()).toContain('✓ No Issues');
    });
  });
});