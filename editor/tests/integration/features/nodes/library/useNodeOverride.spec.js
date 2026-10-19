import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { 
  useNodeOverride, 
  overrideNodeFromBlueprint, 
  resetNodeToDefault, 
  overrideAllScriptNodes,
  overrideAllProjectNodes 
} from '@nodes/library/composables/useNodeOverride.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { 
  setupMockOPFS, 
  createMockEmptyProject, 
  setupMockScriptEnvironment 
} from '@tests/tests.js';

describe('useNodeOverride & Blueprint Sync Mechanism', () => {
  let pinia;
  let scriptStore;
  let projectStore;
  let mockStoreRef;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockStoreRef = setupMockOPFS();
    projectStore = useProjectStore();
    scriptStore = useScriptStore();

    const mockProject = await createMockEmptyProject({ projectName: 'Override Test Project' });
    projectStore.project = mockProject;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('overrideNodeFromBlueprint', () => {
    it('overrides node while preserving matching input values and keeping valid ports connected', async () => {
      // Arrange: A node that was customized (e.g., custom code, custom input value)
      const testNode = {
        id: 'node_test_1',
        type: 'actionSetGameState',
        position: { x: 100, y: 100 },
        settings: {
          headerTitle: 'Set Game State',
          headerColor: '#9C27B0'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'action', dataType: 'string', color: '#F48FB1', defaultValue: 'pause' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            action: 'restart' // user had selected 'restart'
          },
          code: '/* modified custom code */ outputs.execOut = true;'
        }
      };

      const edgeIn = { id: 'edge_1', source: 'node_0', sourceHandle: 'execOut', target: 'node_test_1', targetHandle: 'execIn' };
      const edgeOut = { id: 'edge_2', source: 'node_test_1', sourceHandle: 'execOut', target: 'node_2', targetHandle: 'execIn' };

      const script = {
        id: 'script_1',
        nodes: [testNode],
        edges: [edgeIn, edgeOut]
      };

      // Act
      const result = overrideNodeFromBlueprint(testNode, script);

      // Assert
      expect(result.success).toBe(true);
      // Value 'restart' should be preserved
      expect(testNode.data.values.action).toBe('restart');
      // Code should be reset to blueprint's template code
      expect(testNode.data.code).toContain('context.lifecycle.pause()');
      expect(testNode.data.code).not.toContain('/* modified custom code */');
      // Ports matching name & dataType should stay connected
      expect(script.edges).toHaveLength(2);
      expect(script.edges.find(e => e.id === 'edge_1')).toBeDefined();
      expect(script.edges.find(e => e.id === 'edge_2')).toBeDefined();
    });

    it('populates default values for new inputs and disconnects edges for removed or type-changed ports', async () => {
      // Arrange: Node with an outdated port (wrong dataType) and an obsolete port that no longer exists in blueprint
      const testNode = {
        id: 'node_test_2',
        type: 'changeScreen', // blueprint has inputs: execIn (execution), mode (string, defaultValue: 'window')
        position: { x: 50, y: 50 },
        settings: { headerTitle: 'Change Screen' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'mode', dataType: 'number', color: '#64B5F6' }, // TYPE CHANGED: in blueprint it is 'string'
          { id: 'oldRemovedPort', dataType: 'string', color: '#FFF' } // REMOVED in blueprint
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            mode: 42,
            oldRemovedPort: 'obsolete'
          },
          code: 'old code'
        }
      };

      // Edge connected to valid execIn
      const edgeValid = { id: 'edge_valid', source: 'prev_node', sourceHandle: 'out', target: 'node_test_2', targetHandle: 'execIn' };
      // Edge connected to 'mode' whose type changed from number to string
      const edgeTypeChanged = { id: 'edge_type_changed', source: 'var_node', sourceHandle: 'val', target: 'node_test_2', targetHandle: 'mode' };
      // Edge connected to removed port
      const edgeRemoved = { id: 'edge_removed', source: 'other_node', sourceHandle: 'val', target: 'node_test_2', targetHandle: 'oldRemovedPort' };

      const script = {
        id: 'script_screen',
        nodes: [testNode],
        edges: [edgeValid, edgeTypeChanged, edgeRemoved]
      };

      // Act
      const result = overrideNodeFromBlueprint(testNode, script);

      // Assert
      expect(result.success).toBe(true);
      // 'mode' is now string dataType from blueprint template
      const modePort = testNode.inputs.find(p => p.id === 'mode');
      expect(modePort.dataType).toBe('string');
      // Since type changed, value resets to blueprint template default ('window')
      expect(testNode.data.values.mode).toBe('window');
      // oldRemovedPort should not be present in inputs
      expect(testNode.inputs.find(p => p.id === 'oldRemovedPort')).toBeUndefined();

      // Edges: valid execIn edge is kept; type changed and removed port edges are severed
      expect(script.edges).toHaveLength(1);
      expect(script.edges[0].id).toBe('edge_valid');
      expect(script.edges.find(e => e.id === 'edge_type_changed')).toBeUndefined();
      expect(script.edges.find(e => e.id === 'edge_removed')).toBeUndefined();
    });

    it('returns success: false when blueprint does not exist', () => {
      const unknownNode = { id: 'n_unk', type: 'nonExistentType_123' };
      const script = { nodes: [unknownNode], edges: [] };
      const result = overrideNodeFromBlueprint(unknownNode, script);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('blueprint_not_found');
    });
  });

  describe('resetNodeToDefault', () => {
    it('resets all node properties to blueprint template defaults and severs all connected edges', () => {
      // Arrange
      const node = {
        id: 'node_reset_me',
        type: 'eventSceneStart',
        position: { x: 320, y: 440 },
        settings: { headerTitle: 'Custom Name', headerColor: '#000000' },
        inputs: [{ id: 'customIn', dataType: 'string' }],
        outputs: [{ id: 'execOut', dataType: 'execution' }],
        data: {
          values: { customIn: 'hello' },
          code: '/* user custom script */'
        }
      };

      const connectedEdge1 = { id: 'e1', source: 'node_reset_me', sourceHandle: 'execOut', target: 'other_node', targetHandle: 'execIn' };
      const connectedEdge2 = { id: 'e2', source: 'prev_node', sourceHandle: 'out', target: 'node_reset_me', targetHandle: 'customIn' };
      const unrelatedEdge = { id: 'e3', source: 'node_a', sourceHandle: 'out', target: 'node_b', targetHandle: 'in' };

      const script = {
        nodes: [node],
        edges: [connectedEdge1, connectedEdge2, unrelatedEdge]
      };

      // Act
      const result = resetNodeToDefault(node, script);

      // Assert
      expect(result.success).toBe(true);
      // ID and position are kept
      expect(node.id).toBe('node_reset_me');
      expect(node.position).toEqual({ x: 320, y: 440 });

      // Settings and ports reset to blueprint
      expect(node.settings.headerTitle).toBe('On Scene Start');
      expect(node.settings.headerColor).toBe('#059669');
      expect(node.inputs).toHaveLength(0);
      expect(node.outputs).toHaveLength(2); // execOut and sceneName
      expect(node.data.code).toContain('context.onSceneStart');

      // Connected edges are severed, unrelated edge remains
      expect(script.edges).toHaveLength(1);
      expect(script.edges[0].id).toBe('e3');
    });
  });

  describe('overrideAllScriptNodes', () => {
    it('overrides all nodes in active script and returns count', async () => {
      const nodeA = {
        id: 'node_a',
        type: 'eventGameStart',
        position: { x: 0, y: 0 },
        data: { code: 'custom code A' }
      };
      const nodeB = {
        id: 'node_b',
        type: 'eventGamePause',
        position: { x: 100, y: 0 },
        data: { code: 'custom code B' }
      };

      const script = {
        id: 'script_batch',
        nodes: [nodeA, nodeB],
        edges: []
      };

      const { success, count } = overrideAllScriptNodes(script);

      expect(success).toBe(true);
      expect(count).toBe(2);
      expect(nodeA.data.code).toContain('context.onGameStart');
      expect(nodeB.data.code).toContain('context.onGamePause');
    });
  });

  describe('overrideAllProjectNodes', () => {
    it('overrides all nodes across multiple scripts and returns correct statistics', () => {
      const script1 = {
        id: 's_1',
        nodes: [
          { id: 'n1', type: 'eventGameStart', position: { x: 0, y: 0 }, data: { code: 'old code 1' } }
        ],
        edges: []
      };
      const script2 = {
        id: 's_2',
        nodes: [
          { id: 'n2', type: 'eventGamePause', position: { x: 0, y: 0 }, data: { code: 'old code 2' } },
          { id: 'n3', type: 'eventGameResume', position: { x: 10, y: 0 }, data: { code: 'old code 3' } }
        ],
        edges: []
      };
      const scriptEmpty = {
        id: 's_3',
        nodes: [],
        edges: []
      };

      const result = overrideAllProjectNodes([script1, script2, scriptEmpty]);

      expect(result.success).toBe(true);
      expect(result.totalOverriddenNodes).toBe(3);
      expect(result.affectedScriptsCount).toBe(2);
      expect(script1.nodes[0].data.code).toContain('context.onGameStart');
      expect(script2.nodes[0].data.code).toContain('context.onGamePause');
      expect(script2.nodes[1].data.code).toContain('context.onGameResume');
    });

    it('handles empty or non-array inputs safely', () => {
      expect(overrideAllProjectNodes([])).toEqual({ success: false, totalOverriddenNodes: 0, affectedScriptsCount: 0 });
      expect(overrideAllProjectNodes(null)).toEqual({ success: false, totalOverriddenNodes: 0, affectedScriptsCount: 0 });
    });
  });

  describe('triggerOverrideAllNodes with Confirmation & Pop Alerts', () => {
    it('aborts when user cancels the confirmation dialog', async () => {
      const node = {
        id: 'node_1',
        type: 'eventGameStart',
        position: { x: 0, y: 0 },
        data: { code: 'custom code' }
      };
      await setupMockScriptEnvironment({ scriptId: 'script_confirm_test', nodes: [node] });
      scriptStore.setActiveScript(scriptStore.getScriptById('script_confirm_test'));

      const { confirm, handleCancel } = useConfirm();
      const { triggerOverrideAllNodes } = useNodeOverride();

      // Trigger action and simulate clicking 'Cancel' in dialog
      const actionPromise = triggerOverrideAllNodes();
      handleCancel();
      const result = await actionPromise;

      expect(result).toBe(false);
      // Node was NOT overridden
      expect(scriptStore.activeScript.nodes[0].data.code).toBe('custom code');
    });

    it('proceeds with override and shows success popup when confirmed with active script', async () => {
      const node = {
        id: 'node_1',
        type: 'eventGameStart',
        position: { x: 0, y: 0 },
        data: { code: 'custom code' }
      };
      await setupMockScriptEnvironment({ scriptId: 'script_confirm_test_2', nodes: [node] });
      scriptStore.setActiveScript(scriptStore.getScriptById('script_confirm_test_2'));

      const { confirm, handleConfirm, state: confirmState } = useConfirm();
      const { popState } = usePopAlert();
      const { triggerOverrideAllNodes } = useNodeOverride();

      // Trigger action and inspect English dialog options
      const actionPromise = triggerOverrideAllNodes();
      expect(confirmState.value.isOpen).toBe(true);
      expect(confirmState.value.title).toBe('Override Project Nodes');
      expect(confirmState.value.confirmText).toBe('Override');
      expect(confirmState.value.cancelText).toBe('Cancel');

      handleConfirm();
      const result = await actionPromise;

      expect(result).toBe(true);
      // Node code has been reset to blueprint
      expect(scriptStore.activeScript.nodes[0].data.code).toContain('context.onGameStart');
      // Success toast was displayed in English
      expect(popState.value.isOpen).toBe(true);
      expect(popState.value.type).toBe('success');
      expect(popState.value.title).toBe('Nodes Overridden');
      expect(popState.value.message).toContain('Successfully overridden');
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('works directly WITHOUT opening canvas (activeScript is null) across all project scripts', async () => {
      const nodeA = {
        id: 'node_headless_1',
        type: 'eventGameStart',
        position: { x: 0, y: 0 },
        data: { code: 'headless code A' }
      };
      const nodeB = {
        id: 'node_headless_2',
        type: 'eventGamePause',
        position: { x: 10, y: 10 },
        data: { code: 'headless code B' }
      };

      const scriptA = {
        id: 'script_headless_a',
        scriptId: 'HeadlessScriptA',
        nodes: [nodeA],
        edges: []
      };
      const scriptB = {
        id: 'script_headless_b',
        scriptId: 'HeadlessScriptB',
        nodes: [nodeB],
        edges: []
      };

      scriptStore.initScripts([scriptA, scriptB]);
      // Explicitly ensure NO canvas is open
      scriptStore.activeScript = null;
      expect(scriptStore.activeScript).toBeNull();

      const { handleConfirm, state: confirmState } = useConfirm();
      const { popState } = usePopAlert();
      const { triggerOverrideAllNodes } = useNodeOverride();

      const actionPromise = triggerOverrideAllNodes();
      expect(confirmState.value.isOpen).toBe(true);
      expect(confirmState.value.title).toBe('Override Project Nodes');
      expect(confirmState.value.message).toContain('2 script(s)');

      handleConfirm();
      const result = await actionPromise;

      expect(result).toBe(true);
      expect(scriptStore.activeScript).toBeNull();

      // Both scripts in the project must be overridden
      const updatedScriptA = scriptStore.getScriptById('script_headless_a');
      const updatedScriptB = scriptStore.getScriptById('script_headless_b');
      expect(updatedScriptA.nodes[0].data.code).toContain('context.onGameStart');
      expect(updatedScriptB.nodes[0].data.code).toContain('context.onGamePause');

      expect(popState.value.isOpen).toBe(true);
      expect(popState.value.type).toBe('success');
      expect(popState.value.title).toBe('Nodes Overridden');
      expect(popState.value.message).toContain('Successfully overridden 2 node(s) across 2 script(s)');
      expect(projectStore.syncStatus).toBe('dirty');
    });

    it('shows English info popup when no scripts exist in project', async () => {
      scriptStore.initScripts([]);
      scriptStore.activeScript = null;

      const { popState } = usePopAlert();
      const { triggerOverrideAllNodes } = useNodeOverride();

      const result = await triggerOverrideAllNodes();

      expect(result).toBe(false);
      expect(popState.value.isOpen).toBe(true);
      expect(popState.value.type).toBe('info');
      expect(popState.value.title).toBe('Override Nodes');
      expect(popState.value.message).toBe('No scripts found in the current project.');
    });

    it('shows English info popup when scripts exist but have no nodes', async () => {
      scriptStore.initScripts([
        { id: 'script_empty_1', nodes: [], edges: [] },
        { id: 'script_empty_2', nodes: [], edges: [] }
      ]);
      scriptStore.activeScript = null;

      const { popState } = usePopAlert();
      const { triggerOverrideAllNodes } = useNodeOverride();

      const result = await triggerOverrideAllNodes();

      expect(result).toBe(false);
      expect(popState.value.isOpen).toBe(true);
      expect(popState.value.type).toBe('info');
      expect(popState.value.title).toBe('Override Nodes');
      expect(popState.value.message).toBe('No nodes found in any script of the current project.');
    });
  });

  describe('Variable Nodes, Modifiers, and Dynamic Ports Preservation', () => {
    it('preserves variable nodes, variableId, scope, ports, code, and connected edges', async () => {
      const mockVariable = {
        id: 'var_player_health',
        name: 'playerHealth',
        type: 'Number',
        defaultValue: 100
      };

      const varGetNode = {
        id: 'node_get_health',
        type: 'variableGet',
        position: { x: 0, y: 0 },
        settings: { headerTitle: 'Get playerHealth', headerColor: '#64B5F6', category: 'Variable' },
        inputs: [],
        outputs: [
          { id: 'value', label: 'playerHealth', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          scope: 'Local',
          variableId: 'var_player_health',
          variableName: 'playerHealth',
          code: "outputs.value = context.getLocal('playerHealth');\nreturn;"
        }
      };

      const consumerNode = {
        id: 'node_math_add',
        type: 'mathAdd',
        position: { x: 200, y: 0 },
        settings: { headerTitle: 'Add' },
        inputs: [
          { id: 'a', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'b', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { a: 0, b: 10 }
        }
      };

      const connectionEdge = {
        id: 'edge_health_to_add',
        source: 'node_get_health',
        sourceHandle: 'value',
        target: 'node_math_add',
        targetHandle: 'a',
        modifier: { type: 'multiply', value: 2 }
      };

      const script = {
        id: 'script_with_var',
        localVariables: [mockVariable],
        nodes: [varGetNode, consumerNode],
        edges: [connectionEdge]
      };

      // Act
      const result = overrideAllScriptNodes(script);

      // Assert
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);

      // Variable node code and ports must not be wiped
      expect(varGetNode.data.variableId).toBe('var_player_health');
      expect(varGetNode.data.variableName).toBe('playerHealth');
      expect(varGetNode.data.code).toContain("context.getLocal('playerHealth')");
      expect(varGetNode.outputs[0].dataType).toBe('number');
      expect(varGetNode.outputs[0].id).toBe('value');

      // The connection edge must remain connected
      expect(script.edges).toHaveLength(1);
      expect(script.edges[0].id).toBe('edge_health_to_add');
      // Edge modifier must be preserved
      expect(script.edges[0].modifier).toEqual({ type: 'multiply', value: 2 });
    });

    it('preserves node input variableModifiers, variableBindings, and valueModes', async () => {
      const nodeWithModifiers = {
        id: 'node_speed_setter',
        type: 'actionSetGameState',
        position: { x: 100, y: 100 },
        settings: { headerTitle: 'Set Game State' },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'action', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { action: 'custom' },
          valueModes: { action: 'variable' },
          variableBindings: { action: 'var_state_id' },
          variableModifiers: {
            action: { type: 'none', value: 0, format: 'state_{value}' }
          }
        }
      };

      const script = {
        id: 'script_mod_test',
        nodes: [nodeWithModifiers],
        edges: []
      };

      const result = overrideNodeFromBlueprint(nodeWithModifiers, script);

      expect(result.success).toBe(true);
      expect(nodeWithModifiers.data.valueModes.action).toBe('variable');
      expect(nodeWithModifiers.data.variableBindings.action).toBe('var_state_id');
      expect(nodeWithModifiers.data.variableModifiers.action).toEqual({
        type: 'none',
        value: 0,
        format: 'state_{value}'
      });
    });

    it('preserves dynamic ports on nodes supporting dynamicMode', async () => {
      const dynamicMathNode = {
        id: 'node_dynamic_math',
        type: 'mathAdd',
        dynamicMode: 'sequential',
        position: { x: 0, y: 0 },
        settings: { headerTitle: 'Add' },
        inputs: [
          { id: 'a', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'b', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'v2', dataType: 'number', color: '#64B5F6', defaultValue: 5 } // Dynamically added port
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { a: 1, b: 2, v2: 5 }
        }
      };

      const dynamicEdge = {
        id: 'edge_to_v2',
        source: 'other_node',
        sourceHandle: 'out',
        target: 'node_dynamic_math',
        targetHandle: 'v2'
      };

      const script = {
        id: 'script_dyn',
        nodes: [dynamicMathNode],
        edges: [dynamicEdge]
      };

      const result = overrideNodeFromBlueprint(dynamicMathNode, script);

      expect(result.success).toBe(true);
      // Dynamic port v2 must be preserved
      expect(dynamicMathNode.inputs.find(p => p.id === 'v2')).toBeDefined();
      expect(dynamicMathNode.data.values.v2).toBe(5);
      // Connection to dynamic port must not be severed
      expect(script.edges).toHaveLength(1);
      expect(script.edges[0].targetHandle).toBe('v2');
    });

    it('preserves connections when port data types are compatible across casing or type synonyms', async () => {
      const nodeA = {
        id: 'node_src',
        type: 'actionSetGameState',
        position: { x: 0, y: 0 },
        inputs: [{ id: 'execIn', dataType: 'execution' }],
        outputs: [{ id: 'execOut', dataType: 'execution' }]
      };

      const nodeB = {
        id: 'node_dest',
        type: 'actionSetGameState',
        position: { x: 200, y: 0 },
        // Suppose targetHandle had uppercase / synonym
        inputs: [
          { id: 'execIn', dataType: 'Execution' },
          { id: 'action', dataType: 'String' }
        ],
        outputs: [{ id: 'execOut', dataType: 'execution' }]
      };

      const edgeExec = {
        id: 'edge_exec',
        source: 'node_src',
        sourceHandle: 'execOut',
        target: 'node_dest',
        targetHandle: 'execIn'
      };

      const script = {
        id: 'script_case',
        nodes: [nodeA, nodeB],
        edges: [edgeExec]
      };

      const result = overrideAllScriptNodes(script);

      expect(result.success).toBe(true);
      expect(script.edges).toHaveLength(1);
      expect(script.edges[0].id).toBe('edge_exec');
    });
  });
});
