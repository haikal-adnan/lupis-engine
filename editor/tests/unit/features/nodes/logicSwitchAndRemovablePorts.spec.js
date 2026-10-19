import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Mock composables before importing dynamic port manager
const mockPrompt = vi.fn().mockResolvedValue('jump');
const mockShowPop = vi.fn();

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt })
}));

import { useDynamicPortManager } from '@nodes/nodes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { BlueprintFlow } from '@nodes/library/blueprints/BlueprintFlow.js';
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js';

describe('logicSwitch and Port Deletion Validation', () => {
  let pinia;
  let mockStoreRef;
  const switchBlueprint = BlueprintFlow.items.find(i => i.type === 'logicSwitch');

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockPrompt.mockReset().mockResolvedValue('jump');
    mockShowPop.mockReset();

    mockStoreRef = setupMockOPFS();
    await createMockEmptyProject({ projectName: 'Switch Test Project' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Blueprint Definition', () => {
    it('has dynamicMode switch and case inputs in defaultData', () => {
      expect(switchBlueprint).toBeDefined();
      expect(switchBlueprint.dynamicMode).toBe('switch');
      expect(switchBlueprint.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'value', 'case0', 'case1']);
      expect(switchBlueprint.defaultData.outputs.map(o => o.id)).toEqual(['onCase0', 'onCase1', 'onDefault']);
      expect(switchBlueprint.defaultData.data.values).toHaveProperty('case0', 'right');
      expect(switchBlueprint.defaultData.data.values).toHaveProperty('case1', 'left');
    });

    it('matches dynamic case input in code execution', () => {
      const codeStr = switchBlueprint.defaultData.data.code;
      const fn = new Function('inputs', 'outputs', 'context', 'node', codeStr + '\nreturn outputs;');

      // Test case0 match ('right')
      const out1 = {};
      fn({ value: 'right', case0: 'right', case1: 'left' }, out1, {}, {});
      expect(out1.onCase0).toBe(true);
      expect(out1.onCase1).toBeUndefined();
      expect(out1.onDefault).toBeUndefined();

      // Test case1 match ('left')
      const out2 = {};
      fn({ value: 'left', case0: 'right', case1: 'left' }, out2, {}, {});
      expect(out2.onCase1).toBe(true);
      expect(out2.onCase0).toBeUndefined();
      expect(out2.onDefault).toBeUndefined();

      // Test default fallback
      const out3 = {};
      fn({ value: 'up', case0: 'right', case1: 'left' }, out3, {}, {});
      expect(out3.onDefault).toBe(true);
      expect(out3.onCase0).toBeUndefined();
      expect(out3.onCase1).toBeUndefined();

      // Test numeric loose equality ('10' == 10)
      const out4 = {};
      fn({ value: '10', case0: 10, case1: 20 }, out4, {}, {});
      expect(out4.onCase0).toBe(true);
    });
  });

  describe('Port Removability Logic (canDeleteInputPort & canDeleteOutputPort)', () => {
    let manager;
    beforeEach(() => {
      manager = useDynamicPortManager();
    });

    it('returns false for fixed node with dynamicMode: none (e.g. uiNotification or logicCompare)', () => {
      const fixedNode = {
        id: 'node_fixed',
        type: 'logicCompare',
        dynamicMode: 'none',
        inputs: [
          { id: 'a', dataType: 'number' },
          { id: 'b', dataType: 'number' },
          { id: 'compare', dataType: 'string' }
        ]
      };

      expect(manager.canDeleteInputPort(fixedNode, 'a')).toBe(false);
      expect(manager.canDeleteInputPort(fixedNode, 'b')).toBe(false);
      expect(manager.canDeleteInputPort(fixedNode, 'compare')).toBe(false);
      expect(manager.canDeleteInputPort(fixedNode, 'execIn')).toBe(false);
    });

    it('returns false for protected ports in any node', () => {
      const seqNode = { id: 'node_seq', type: 'mathAdd', dynamicMode: 'sequential' };
      expect(manager.canDeleteInputPort(seqNode, 'execIn')).toBe(false);
      expect(manager.canDeleteInputPort(seqNode, 'targetEntity')).toBe(false);
      expect(manager.canDeleteOutputPort(seqNode, 'execOut')).toBe(false);
    });

    it('correctly validates logicSwitch inputs: value is not deletable, cases are deletable', () => {
      const switchNode = {
        id: 'node_switch',
        type: 'logicSwitch',
        dynamicMode: 'switch',
        inputs: [
          { id: 'execIn', dataType: 'execution' },
          { id: 'value', dataType: 'string' },
          { id: 'case0', dataType: 'string' },
          { id: 'case1', dataType: 'string' }
        ],
        outputs: [
          { id: 'onCase0', dataType: 'execution' },
          { id: 'onCase1', dataType: 'execution' },
          { id: 'onDefault', dataType: 'execution' }
        ]
      };

      // Inputs
      expect(manager.canDeleteInputPort(switchNode, 'execIn')).toBe(false);
      expect(manager.canDeleteInputPort(switchNode, 'value')).toBe(false);
      expect(manager.canDeleteInputPort(switchNode, 'case0')).toBe(true);
      expect(manager.canDeleteInputPort(switchNode, 'case1')).toBe(true);

      // Outputs
      expect(manager.canDeleteOutputPort(switchNode, 'onDefault')).toBe(false);
      expect(manager.canDeleteOutputPort(switchNode, 'onCase0')).toBe(true);
      expect(manager.canDeleteOutputPort(switchNode, 'onCase1')).toBe(true);
    });

    it('returns true for sequential inputs in sequential mode', () => {
      const seqNode = {
        id: 'node_math',
        type: 'mathAdd',
        dynamicMode: 'sequential',
        inputs: [{ id: 'v0' }, { id: 'v1' }, { id: 'v2' }]
      };
      expect(manager.canDeleteInputPort(seqNode, 'v0')).toBe(true);
      expect(manager.canDeleteInputPort(seqNode, 'v2')).toBe(true);
    });
  });

  describe('Switch Case Add and Paired Removal', () => {
    it('adds case input and output port, maintains onDefault at bottom, and updates values', async () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_sw',
        nodes: [{
          id: 'sw_node',
          type: 'logicSwitch',
          dynamicMode: 'switch',
          inputs: [
            { id: 'execIn', dataType: 'execution' },
            { id: 'value', dataType: 'string' },
            { id: 'case0', dataType: 'string', defaultValue: 'right' },
            { id: 'case1', dataType: 'string', defaultValue: 'left' }
          ],
          outputs: [
            { id: 'onCase0', dataType: 'execution' },
            { id: 'onCase1', dataType: 'execution' },
            { id: 'onDefault', dataType: 'execution' }
          ],
          data: {
            values: { value: '', case0: 'right', case1: 'left' },
            cases: ['right', 'left']
          }
        }],
        edges: []
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      // Add a new case
      await manager.addDynamicPort(node, 'input');

      // Verify no prompt was shown
      expect(mockPrompt).not.toHaveBeenCalled();

      const updatedNode = scriptStore.activeScript.nodes[0];
      // Input case2 should be added
      expect(updatedNode.inputs.map(p => p.id)).toEqual(['execIn', 'value', 'case0', 'case1', 'case2']);
      expect(updatedNode.data.values.case2).toBe('');
      // Output onCase2 should be added before onDefault
      expect(updatedNode.outputs.map(p => p.id)).toEqual(['onCase0', 'onCase1', 'onCase2', 'onDefault']);
      // Cases array should be updated
      expect(updatedNode.data.cases).toEqual(['right', 'left', '']);
    });

    it('paired deletion: removing input case0 also removes onCase0 and updates node.data.cases via dynamicPortManager', () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_sw_del',
        nodes: [{
          id: 'sw_node',
          type: 'logicSwitch',
          dynamicMode: 'switch',
          inputs: [
            { id: 'execIn', dataType: 'execution' },
            { id: 'value', dataType: 'string' },
            { id: 'case0', dataType: 'string', defaultValue: 'right' },
            { id: 'case1', dataType: 'string', defaultValue: 'left' }
          ],
          outputs: [
            { id: 'onCase0', dataType: 'execution' },
            { id: 'onCase1', dataType: 'execution' },
            { id: 'onDefault', dataType: 'execution' }
          ],
          data: {
            values: { value: '', case0: 'right', case1: 'left' },
            cases: ['right', 'left']
          }
        }],
        edges: [
          { id: 'e1', source: 'sw_node', sourceHandle: 'onCase0', target: 'other', targetHandle: 'in' },
          { id: 'e2', source: 'src', sourceHandle: 'out', target: 'sw_node', targetHandle: 'case0' }
        ]
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      // Remove input case0
      manager.removeDynamicPort(node, 'case0', 'input');

      const updatedNode = scriptStore.activeScript.nodes[0];
      // Verify case0 removed from inputs
      expect(updatedNode.inputs.map(p => p.id)).toEqual(['execIn', 'value', 'case1']);
      // Verify paired onCase0 removed from outputs
      expect(updatedNode.outputs.map(p => p.id)).toEqual(['onCase1', 'onDefault']);
      // Verify connected edges removed
      expect(scriptStore.activeScript.edges).toHaveLength(0);
      // Verify node.data.values cleaned
      expect(updatedNode.data.values.case0).toBeUndefined();
      // Verify node.data.cases synced
      expect(updatedNode.data.cases).toEqual(['left']);
    });

    it('paired deletion: removing output onCase1 also removes input case1 and updates node.data.cases', () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_sw_del_out',
        nodes: [{
          id: 'sw_node',
          type: 'logicSwitch',
          dynamicMode: 'switch',
          inputs: [
            { id: 'execIn', dataType: 'execution' },
            { id: 'value', dataType: 'string' },
            { id: 'case0', dataType: 'string', defaultValue: 'right' },
            { id: 'case1', dataType: 'string', defaultValue: 'left' }
          ],
          outputs: [
            { id: 'onCase0', dataType: 'execution' },
            { id: 'onCase1', dataType: 'execution' },
            { id: 'onDefault', dataType: 'execution' }
          ],
          data: {
            values: { value: '', case0: 'right', case1: 'left' },
            cases: ['right', 'left']
          }
        }],
        edges: []
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      // Remove output onCase1
      manager.removeDynamicPort(node, 'onCase1', 'output');

      const updatedNode = scriptStore.activeScript.nodes[0];
      // Verify onCase1 removed from outputs
      expect(updatedNode.outputs.map(p => p.id)).toEqual(['onCase0', 'onDefault']);
      // Verify paired case1 removed from inputs
      expect(updatedNode.inputs.map(p => p.id)).toEqual(['execIn', 'value', 'case0']);
      // Verify node.data.values cleaned
      expect(updatedNode.data.values.case1).toBeUndefined();
      // Verify node.data.cases synced
      expect(updatedNode.data.cases).toEqual(['right']);
    });

    it('scriptStore removeNodePort does not mutate node.data directly', () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_pure_store',
        nodes: [{
          id: 'sw_node',
          type: 'logicSwitch',
          dynamicMode: 'switch',
          inputs: [
            { id: 'execIn', dataType: 'execution' },
            { id: 'value', dataType: 'string' },
            { id: 'case0', dataType: 'string' }
          ],
          outputs: [
            { id: 'onCase0', dataType: 'execution' },
            { id: 'onDefault', dataType: 'execution' }
          ],
          data: {
            values: { value: '', case0: 'right' }
          }
        }],
        edges: []
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      // Call pure scriptStore.removeNodePort
      scriptStore.removeNodePort('sw_node', 'input', 'case0');

      const updated = scriptStore.activeScript.nodes[0];
      expect(updated.inputs.map(p => p.id)).toEqual(['execIn', 'value']);
      // scriptStore itself does NOT touch node.data.values:
      expect(updated.data.values.case0).toBe('right');
    });
  });

  describe('Keyboard (eventOnKey) Dynamic Behavior', () => {
    it('correctly validates eventOnKey ports: action is protected, keys are deletable', () => {
      const manager = useDynamicPortManager();
      const keyNode = {
        id: 'node_key',
        type: 'eventOnKey',
        dynamicMode: 'keyboard',
        inputs: [
          { id: 'action', dataType: 'string' },
          { id: 'key0', dataType: 'string' },
          { id: 'key1', dataType: 'string' }
        ],
        outputs: [
          { id: 'onKey0', dataType: 'execution' },
          { id: 'onKey1', dataType: 'execution' }
        ]
      };

      expect(manager.canDeleteInputPort(keyNode, 'action')).toBe(false);
      expect(manager.canDeleteInputPort(keyNode, 'key0')).toBe(true);
      expect(manager.canDeleteInputPort(keyNode, 'key1')).toBe(true);

      expect(manager.canDeleteOutputPort(keyNode, 'onKey0')).toBe(true);
      expect(manager.canDeleteOutputPort(keyNode, 'onKey1')).toBe(true);
    });

    it('adds dynamic key port with empty input and paired execution output', async () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_kbd_add',
        nodes: [{
          id: 'kbd_node',
          type: 'eventOnKey',
          dynamicMode: 'keyboard',
          inputs: [
            { id: 'action', dataType: 'string' },
            { id: 'key0', dataType: 'string', defaultValue: 'a' },
            { id: 'key1', dataType: 'string', defaultValue: 'space' }
          ],
          outputs: [
            { id: 'onKey0', dataType: 'execution' },
            { id: 'onKey1', dataType: 'execution' }
          ],
          data: {
            values: { action: 'pressed', key0: 'a', key1: 'space' }
          }
        }],
        edges: []
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      await manager.addDynamicPort(node, 'input');

      const updated = scriptStore.activeScript.nodes[0];
      expect(updated.inputs.map(p => p.id)).toEqual(['action', 'key0', 'key1', 'key2']);
      expect(updated.outputs.map(p => p.id)).toEqual(['onKey0', 'onKey1', 'onKey2']);
      expect(updated.data.values.key2).toBe('');
    });

    it('paired deletion: removing key0 also removes onKey0 and cleans values', () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_kbd_del',
        nodes: [{
          id: 'kbd_node',
          type: 'eventOnKey',
          dynamicMode: 'keyboard',
          inputs: [
            { id: 'action', dataType: 'string' },
            { id: 'key0', dataType: 'string', defaultValue: 'a' },
            { id: 'key1', dataType: 'string', defaultValue: 'space' }
          ],
          outputs: [
            { id: 'onKey0', dataType: 'execution' },
            { id: 'onKey1', dataType: 'execution' }
          ],
          data: {
            values: { action: 'pressed', key0: 'a', key1: 'space' }
          }
        }],
        edges: [
          { id: 'e1', source: 'kbd_node', sourceHandle: 'onKey0', target: 'n2', targetHandle: 'in' },
          { id: 'e2', source: 'n0', sourceHandle: 'out', target: 'kbd_node', targetHandle: 'key0' }
        ]
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      manager.removeDynamicPort(node, 'key0', 'input');

      const updated = scriptStore.activeScript.nodes[0];
      expect(updated.inputs.map(p => p.id)).toEqual(['action', 'key1']);
      expect(updated.outputs.map(p => p.id)).toEqual(['onKey1']);
      expect(updated.data.values.key0).toBeUndefined();
      expect(scriptStore.activeScript.edges).toHaveLength(0);
    });

    it('paired deletion: removing onKey1 also removes key1 and cleans values', () => {
      const scriptStore = useScriptStore();
      const mockScript = {
        id: 'script_kbd_del_out',
        nodes: [{
          id: 'kbd_node',
          type: 'eventOnKey',
          dynamicMode: 'keyboard',
          inputs: [
            { id: 'action', dataType: 'string' },
            { id: 'key0', dataType: 'string', defaultValue: 'a' },
            { id: 'key1', dataType: 'string', defaultValue: 'space' }
          ],
          outputs: [
            { id: 'onKey0', dataType: 'execution' },
            { id: 'onKey1', dataType: 'execution' }
          ],
          data: {
            values: { action: 'pressed', key0: 'a', key1: 'space' }
          }
        }],
        edges: []
      };
      scriptStore.initScripts([mockScript]);
      scriptStore.setActiveScript(mockScript);

      const manager = useDynamicPortManager();
      const node = scriptStore.activeScript.nodes[0];

      manager.removeDynamicPort(node, 'onKey1', 'output');

      const updated = scriptStore.activeScript.nodes[0];
      expect(updated.outputs.map(p => p.id)).toEqual(['onKey0']);
      expect(updated.inputs.map(p => p.id)).toEqual(['action', 'key0']);
      expect(updated.data.values.key1).toBeUndefined();
    });
  });
});
