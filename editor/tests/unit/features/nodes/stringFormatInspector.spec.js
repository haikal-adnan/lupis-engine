import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import StringFormatInspector from '@/features/nodes/inspector/layouts/custom/StringFormatInspector.vue';
import { useScriptStore } from '@/features/scripts/useScriptStore.js';
import { useDynamicPortManager } from '@/features/nodes/inspector/composables/useDynamicPortManager.js';

describe('StringFormatInspector & String Format Port Management', () => {
  let scriptStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    scriptStore = useScriptStore();
    scriptStore.activeScript = {
      id: 'script_test',
      nodes: [],
      edges: []
    };
  });

  it('preserves the format input port when mounted and auto-heals corrupted node missing format port', () => {
    const corruptedNode = {
      id: 'node_sf_1',
      type: 'stringFormat',
      inputs: [
        { id: 'v0', dataType: 'any', defaultValue: '' },
        { id: 'v1', dataType: 'any', defaultValue: '' }
      ],
      outputs: [
        { id: 'result', dataType: 'string' }
      ],
      data: {
        formats: ['Score: {v0} / {v1}'],
        values: { v0: 10, v1: 20 },
        code: ''
      }
    };

    scriptStore.activeScript.nodes = [corruptedNode];
    scriptStore.selectedNodeId = corruptedNode.id;

    mount(StringFormatInspector, {
      props: { node: corruptedNode }
    });

    const healedNode = scriptStore.activeScript.nodes[0];
    const formatPort = healedNode.inputs.find(p => p.id === 'format');
    expect(formatPort).toBeDefined();
    expect(formatPort.dataType).toBe('string');
    expect(formatPort.defaultValue).toBe('Score: {v0} / {v1}');
    expect(healedNode.inputs.some(p => p.id === 'v0')).toBe(true);
    expect(healedNode.inputs.some(p => p.id === 'v1')).toBe(true);
  });

  it('keeps format input port and preserves connected edges when changing format template (mengganti format)', async () => {
    const node = {
      id: 'node_sf_change',
      type: 'stringFormat',
      inputs: [
        { id: 'format', dataType: 'string', defaultValue: 'Score: {v0} / {v1}' },
        { id: 'v0', dataType: 'any', defaultValue: '' },
        { id: 'v1', dataType: 'any', defaultValue: '' }
      ],
      outputs: [
        { id: 'result', dataType: 'string' }
      ],
      data: {
        formats: ['Score: {v0} / {v1}'],
        values: { format: 'Score: {v0} / {v1}', v0: '100', v1: '200' },
        code: ''
      }
    };

    scriptStore.activeScript.nodes = [node];
    scriptStore.activeScript.edges = [
      { id: 'e1', source: 'srcNode', sourceHandle: 'outStr', target: 'node_sf_change', targetHandle: 'format' },
      { id: 'e2', source: 'node_sf_change', sourceHandle: 'result', target: 'dstNode', targetHandle: 'inStr' }
    ];

    const wrapper = mount(StringFormatInspector, {
      props: { node }
    });

    // Find the format template text input and update it
    const input = wrapper.find('[data-testid="node-inspector-port-text-input"] input');
    expect(input.exists()).toBe(true);

    // User updates the format template string and blurs to commit
    await input.setValue('Hero: {name} | HP: {hp}');
    await input.trigger('blur');

    const updatedNode = scriptStore.activeScript.nodes[0];

    // Format port MUST STILL EXIST and NOT be deleted
    const formatPort = updatedNode.inputs.find(p => p.id === 'format');
    expect(formatPort).toBeDefined();
    expect(formatPort.dataType).toBe('string');

    // Detected variables should be name and hp
    expect(updatedNode.inputs.some(p => p.id === 'name')).toBe(true);
    expect(updatedNode.inputs.some(p => p.id === 'hp')).toBe(true);

    // Edges connected to format and result MUST be preserved
    expect(scriptStore.activeScript.edges).toHaveLength(2);
    expect(scriptStore.activeScript.edges[0].targetHandle).toBe('format');
    expect(scriptStore.activeScript.edges[1].sourceHandle).toBe('result');
  });

  it('creates format0 and format1 ports and remaps edges when adding format template (menambahkan format)', async () => {
    const node = {
      id: 'node_sf_add',
      type: 'stringFormat',
      inputs: [
        { id: 'format', dataType: 'string', defaultValue: 'Player: {name}' },
        { id: 'name', dataType: 'any', defaultValue: '' }
      ],
      outputs: [
        { id: 'result', dataType: 'string' }
      ],
      data: {
        formats: ['Player: {name}'],
        values: { format: 'Player: {name}' },
        code: ''
      }
    };

    scriptStore.activeScript.nodes = [node];
    scriptStore.activeScript.edges = [
      { id: 'e1', source: 'srcNode', sourceHandle: 'outStr', target: 'node_sf_add', targetHandle: 'format' },
      { id: 'e2', source: 'node_sf_add', sourceHandle: 'result', target: 'dstNode', targetHandle: 'inStr' }
    ];

    const wrapper = mount(StringFormatInspector, {
      props: { node }
    });

    // Click "Add Format Template" button
    const addBtn = wrapper.find('button.group');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');

    const updatedNode = scriptStore.activeScript.nodes[0];

    // Multi-format node should have format0 and format1
    expect(updatedNode.inputs.some(p => p.id === 'format0')).toBe(true);
    expect(updatedNode.inputs.some(p => p.id === 'format1')).toBe(true);

    // Outputs should be result0 and result1
    expect(updatedNode.outputs.some(p => p.id === 'result0')).toBe(true);
    expect(updatedNode.outputs.some(p => p.id === 'result1')).toBe(true);

    // Edge connected to format should be migrated to format0, and result to result0
    expect(scriptStore.activeScript.edges).toHaveLength(2);
    expect(scriptStore.activeScript.edges[0].targetHandle).toBe('format0');
    expect(scriptStore.activeScript.edges[1].sourceHandle).toBe('result0');
  });

  it('remaps format0 back to format when removing down to 1 template', async () => {
    const node = {
      id: 'node_sf_remove',
      type: 'stringFormat',
      inputs: [
        { id: 'format0', dataType: 'string', defaultValue: 'Player: {name}' },
        { id: 'format1', dataType: 'string', defaultValue: 'HP: {hp}' },
        { id: 'name', dataType: 'any' },
        { id: 'hp', dataType: 'any' }
      ],
      outputs: [
        { id: 'result0', dataType: 'string' },
        { id: 'result1', dataType: 'string' }
      ],
      data: {
        formats: ['Player: {name}', 'HP: {hp}'],
        values: { format0: 'Player: {name}', format1: 'HP: {hp}' },
        code: ''
      }
    };

    scriptStore.activeScript.nodes = [node];
    scriptStore.activeScript.edges = [
      { id: 'e1', source: 'srcNode', sourceHandle: 'outStr', target: 'node_sf_remove', targetHandle: 'format0' },
      { id: 'e2', source: 'node_sf_remove', sourceHandle: 'result0', target: 'dstNode', targetHandle: 'inStr' }
    ];

    const wrapper = mount(StringFormatInspector, {
      props: { node }
    });

    // Find remove buttons
    const removeButtons = wrapper.findAll('button[title="Remove Format Template"]');
    expect(removeButtons.length).toBeGreaterThan(0);

    // Remove the second template (index 1)
    await removeButtons[1].trigger('click');

    const updatedNode = scriptStore.activeScript.nodes[0];

    // Single format port should be 'format' and output 'result'
    expect(updatedNode.inputs.some(p => p.id === 'format')).toBe(true);
    expect(updatedNode.outputs.some(p => p.id === 'result')).toBe(true);

    // Edges migrated back from format0 -> format and result0 -> result
    expect(scriptStore.activeScript.edges).toHaveLength(2);
    expect(scriptStore.activeScript.edges[0].targetHandle).toBe('format');
    expect(scriptStore.activeScript.edges[1].sourceHandle).toBe('result');
  });

  it('executes generated code with dynamic wire input on format port or fallback template', () => {
    const node = {
      id: 'node_sf_exec',
      type: 'stringFormat',
      inputs: [
        { id: 'format', dataType: 'string', defaultValue: 'Score: {v0} / {v1}' },
        { id: 'v0', dataType: 'any' },
        { id: 'v1', dataType: 'any' }
      ],
      outputs: [
        { id: 'result', dataType: 'string' }
      ],
      data: {
        formats: ['Score: {v0} / {v1}'],
        values: { format: 'Score: {v0} / {v1}' },
        code: ''
      }
    };

    scriptStore.activeScript.nodes = [node];

    mount(StringFormatInspector, {
      props: { node }
    });

    const updatedNode = scriptStore.activeScript.nodes[0];
    const code = updatedNode.data.code;
    expect(code).toBeDefined();

    // Compile node function
    const fn = new Function('inputs', 'outputs', code);

    // Test 1: Fallback template when inputs.format is omitted
    const out1 = {};
    fn({ v0: 85, v1: 100 }, out1);
    expect(out1.result).toBe('Score: 85 / 100');

    // Test 2: Wire dynamically feeds inputs.format
    const out2 = {};
    fn({ format: 'Level: {v0} - XP: {v1}', v0: 5, v1: 1200 }, out2);
    expect(out2.result).toBe('Level: 5 - XP: 1200');

    // Test 3: Supports numeric placeholders like {0} and {1}
    const out3 = {};
    fn({ format: 'Item: {0} x{1}', v0: 'Potion', v1: 3 }, out3);
    expect(out3.result).toBe('Item: Potion x3');
  });

  it('protects format port from accidental deletion in useDynamicPortManager', () => {
    const { canDeleteInputPort } = useDynamicPortManager();

    const nodeSingle = { type: 'stringFormat', dynamicMode: 'sequential' };
    expect(canDeleteInputPort(nodeSingle, 'format')).toBe(false);

    const nodeMulti = { type: 'stringFormat', dynamicMode: 'sequential' };
    expect(canDeleteInputPort(nodeMulti, 'format0')).toBe(false);
    expect(canDeleteInputPort(nodeMulti, 'format1')).toBe(false);

    // Variable inputs (e.g. v0) can be deleted if in sequential mode
    expect(canDeleteInputPort(nodeSingle, 'v0')).toBe(true);
  });
});
