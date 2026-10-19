import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { 
  useNodeOverride, 
  overrideNodeFromBlueprint, 
  resetNodeToDefault, 
  overrideAllScriptNodes 
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

    it('proceeds with override and shows success popup when confirmed', async () => {
      const node = {
        id: 'node_1',
        type: 'eventGameStart',
        position: { x: 0, y: 0 },
        data: { code: 'custom code' }
      };
      await setupMockScriptEnvironment({ scriptId: 'script_confirm_test_2', nodes: [node] });
      scriptStore.setActiveScript(scriptStore.getScriptById('script_confirm_test_2'));

      const { confirm, handleConfirm } = useConfirm();
      const { popState } = usePopAlert();
      const { triggerOverrideAllNodes } = useNodeOverride();

      // Trigger action and simulate clicking 'Confirm' in dialog
      const actionPromise = triggerOverrideAllNodes();
      handleConfirm();
      const result = await actionPromise;

      expect(result).toBe(true);
      // Node code has been reset to blueprint
      expect(scriptStore.activeScript.nodes[0].data.code).toContain('context.onGameStart');
      // Success toast was displayed
      expect(popState.value.isOpen).toBe(true);
      expect(popState.value.type).toBe('success');
      expect(popState.value.title).toBe('Nodes Overridden');
    });
  });
});
