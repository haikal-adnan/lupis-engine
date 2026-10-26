import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { 
  getCustomInspectorForNode, 
  isNodeManagedByCustomInspector,
  isUserCustomNode,
  isCustomInspectorNode,
  isSystemNode,
  KeyboardMapperInspector,
  BatchSetInspector,
  StringFormatInspector,
  MathChainInspector,
  CustomScriptInspector,
  useNodeLogic
} from '@nodes/nodes.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { PORT_ID_REGEX } from '@nodes/nodes.js';

describe('Custom Inspectors & Custom Script Management', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('3-Tier Node Classification Logic', () => {
    it('correctly classifies Tier 1: node system (standard system blueprints)', () => {
      const mathAddNode = { id: 'node_add', type: 'mathAdd' };
      const moveNode = { id: 'node_move', type: 'moveAndSlide' };

      expect(isSystemNode(mathAddNode)).toBe(true);
      expect(isUserCustomNode(mathAddNode)).toBe(false);
      expect(isCustomInspectorNode(mathAddNode)).toBe(false);
      expect(getCustomInspectorForNode(mathAddNode)).toBeNull();

      expect(isSystemNode(moveNode)).toBe(true);
      expect(isUserCustomNode(moveNode)).toBe(false);
      expect(isCustomInspectorNode(moveNode)).toBe(false);
      expect(getCustomInspectorForNode(moveNode)).toBeNull();
    });

    it('correctly classifies Tier 2: custom node inspector (system blueprints with custom data UI)', () => {
      const mathChainNode = { id: 'node_mc', type: 'mathChain' };
      const strFormatNode = { id: 'node_sf', type: 'stringFormat' };
      const batchSetNode = { id: 'node_bs', type: 'batchSet' };
      const keyNode = { id: 'node_key', type: 'eventOnKey' };

      // They are system nodes with specialized data inspectors
      expect(isSystemNode(mathChainNode)).toBe(true);
      expect(isUserCustomNode(mathChainNode)).toBe(false);
      expect(isCustomInspectorNode(mathChainNode)).toBe(true);
      expect(getCustomInspectorForNode(mathChainNode)).toBe(MathChainInspector);

      expect(isSystemNode(strFormatNode)).toBe(true);
      expect(isUserCustomNode(strFormatNode)).toBe(false);
      expect(isCustomInspectorNode(strFormatNode)).toBe(true);
      expect(getCustomInspectorForNode(strFormatNode)).toBe(StringFormatInspector);

      expect(isSystemNode(batchSetNode)).toBe(true);
      expect(isUserCustomNode(batchSetNode)).toBe(false);
      expect(isCustomInspectorNode(batchSetNode)).toBe(true);
      expect(getCustomInspectorForNode(batchSetNode)).toBe(BatchSetInspector);

      expect(isSystemNode(keyNode)).toBe(true);
      expect(isUserCustomNode(keyNode)).toBe(false);
      expect(isCustomInspectorNode(keyNode)).toBe(true);
      expect(getCustomInspectorForNode(keyNode)).toBe(KeyboardMapperInspector);
    });

    it('correctly classifies Tier 3: custom node user (converted from any system or inspector node)', () => {
      // Converted from standard system node (e.g. mathAdd)
      const userFromMathAdd = { 
        id: 'node_user_1', 
        type: 'mathAdd', 
        isCustomScript: true, 
        originalType: 'mathAdd' 
      };
      expect(isUserCustomNode(userFromMathAdd)).toBe(true);
      expect(isSystemNode(userFromMathAdd)).toBe(false);
      expect(isCustomInspectorNode(userFromMathAdd)).toBe(false);
      expect(getCustomInspectorForNode(userFromMathAdd)).toBe(CustomScriptInspector);

      // Converted from custom inspector node (e.g. mathChain)
      const userFromMathChain = { 
        id: 'node_user_2', 
        type: 'mathChain', 
        isCustomScript: true, 
        originalType: 'mathChain' 
      };
      expect(isUserCustomNode(userFromMathChain)).toBe(true);
      expect(isSystemNode(userFromMathChain)).toBe(false);
      expect(isCustomInspectorNode(userFromMathChain)).toBe(false);
      expect(getCustomInspectorForNode(userFromMathChain)).toBe(CustomScriptInspector);

      // Native customScript type
      const nativeCustom = { id: 'node_user_3', type: 'customScript' };
      expect(isUserCustomNode(nativeCustom)).toBe(true);
      expect(isSystemNode(nativeCustom)).toBe(false);
      expect(isCustomInspectorNode(nativeCustom)).toBe(false);

      // User blueprint library node (custom_...)
      const userBpNode = { id: 'node_user_4', type: 'custom_damageMultiplier' };
      expect(isUserCustomNode(userBpNode)).toBe(true);
      expect(isSystemNode(userBpNode)).toBe(false);
      expect(isCustomInspectorNode(userBpNode)).toBe(false);
    });
  });

  describe('Inspector Dispatcher (getCustomInspectorForNode)', () => {
    it('dispatches KeyboardMapperInspector for keyboard nodes when managed', () => {
      const node = { id: 'node_1', type: 'eventOnKey' };
      expect(getCustomInspectorForNode(node)).toBe(KeyboardMapperInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(true);
    });

    it('dispatches BatchSetInspector for batchSet node when managed', () => {
      const node = { id: 'node_2', type: 'batchSet' };
      expect(getCustomInspectorForNode(node)).toBe(BatchSetInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(true);
    });

    it('dispatches StringFormatInspector for stringFormat node when managed', () => {
      const node = { id: 'node_3', type: 'stringFormat' };
      expect(getCustomInspectorForNode(node)).toBe(StringFormatInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(true);
    });

    it('dispatches MathChainInspector for mathChain node when managed', () => {
      const node = { id: 'node_4', type: 'mathChain' };
      expect(getCustomInspectorForNode(node)).toBe(MathChainInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(true);
    });

    it('returns null (generic inspector) for standard primitive nodes', () => {
      const node = { id: 'node_5', type: 'moveAndSlide' };
      expect(getCustomInspectorForNode(node)).toBeNull();
      expect(isNodeManagedByCustomInspector(node)).toBe(false);
    });

    it('switches to CustomScriptInspector when a managed node is unlocked (isCustomScript = true)', () => {
      const node = { 
        id: 'node_6', 
        type: 'mathChain', 
        isCustomScript: true, 
        originalType: 'mathChain' 
      };
      expect(getCustomInspectorForNode(node)).toBe(CustomScriptInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(false);
    });

    it('dispatches CustomScriptInspector for node of type customScript', () => {
      const node = { id: 'node_7', type: 'customScript' };
      expect(getCustomInspectorForNode(node)).toBe(CustomScriptInspector);
      expect(isNodeManagedByCustomInspector(node)).toBe(false);
    });
  });

  describe('Port ID Validation (T-001 Regex Contract)', () => {
    it('validates canonical camelCase port IDs', () => {
      expect(PORT_ID_REGEX.test('targetEntity')).toBe(true);
      expect(PORT_ID_REGEX.test('speed')).toBe(true);
      expect(PORT_ID_REGEX.test('onKey0')).toBe(true);
      expect(PORT_ID_REGEX.test('value1')).toBe(true);
    });

    it('rejects forbidden port ID formats (spaces, hyphens, underscores, starting numbers)', () => {
      expect(PORT_ID_REGEX.test('target_entity')).toBe(false);
      expect(PORT_ID_REGEX.test('speed-val')).toBe(false);
      expect(PORT_ID_REGEX.test('1speed')).toBe(false);
      expect(PORT_ID_REGEX.test('my port')).toBe(false);
      expect(PORT_ID_REGEX.test('')).toBe(false);
    });
  });

  describe('Project Library & Custom Blueprint Storage', () => {
    it('stores custom blueprint in activeProject.customBlueprints', () => {
      const projectStore = useProjectStore();
      projectStore.project = {
        id: 'proj_1',
        name: 'Test Project',
        customBlueprints: []
      };

      const customNode = {
        id: 'custom_node_1',
        type: 'customScript',
        label: 'Damage Multiplier',
        role: 'action',
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'baseDamage', dataType: 'number', color: '#64B5F6', defaultValue: 10 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'finalDamage', dataType: 'number', color: '#64B5F6' }
        ],
        settings: {
          headerTitle: 'Damage Multiplier',
          category: 'Combat',
          headerColor: '#EF4444'
        },
        data: {
          code: 'outputs.finalDamage = inputs.baseDamage * 2;\noutputs.execOut = true;\nreturn;'
        }
      };

      const bp = {
        type: `custom_${customNode.id}`,
        label: customNode.settings.headerTitle,
        role: customNode.role,
        defaultData: {
          settings: customNode.settings,
          inputs: customNode.inputs,
          outputs: customNode.outputs,
          data: customNode.data
        }
      };

      projectStore.activeProject.customBlueprints.push(bp);

      expect(projectStore.activeProject.customBlueprints.length).toBe(1);
      expect(projectStore.activeProject.customBlueprints[0].label).toBe('Damage Multiplier');
      expect(projectStore.activeProject.customBlueprints[0].defaultData.inputs.length).toBe(2);
    });
  });

  describe('System Node Port Immutability vs Custom Node Port Configuration', () => {
    it('locks port renaming on system nodes', () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_1',
        nodes: [
          {
            id: 'sys_node_1',
            type: 'mathAdd',
            inputs: [{ id: 'a', label: 'A', dataType: 'number' }]
          }
        ],
        edges: []
      };
      scriptStore.selectedNodeId = 'sys_node_1';

      const { updatePortLabel } = useNodeLogic();
      updatePortLabel('a', 'input', 'newA');

      expect(scriptStore.activeScript.nodes[0].inputs[0].id).toBe('a');
      expect(scriptStore.activeScript.nodes[0].inputs[0].label).toBe('A');
    });

    it('allows port renaming on custom nodes and remaps connected edges', () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_2',
        nodes: [
          {
            id: 'custom_node_1',
            type: 'customScript',
            inputs: [{ id: 'input1', label: 'input1', dataType: 'number' }],
            outputs: [],
            data: { values: { input1: 42 } }
          }
        ],
        edges: [
          { id: 'edge_1', source: 'other_node', sourceHandle: 'out', target: 'custom_node_1', targetHandle: 'input1' }
        ]
      };
      scriptStore.selectedNodeId = 'custom_node_1';

      const { updatePortLabel } = useNodeLogic();
      updatePortLabel('input1', 'input', 'multiplier');

      const updatedNode = scriptStore.activeScript.nodes[0];
      expect(updatedNode.inputs[0].id).toBe('multiplier');
      expect(updatedNode.inputs[0].label).toBe('multiplier');
      expect(updatedNode.data.values.multiplier).toBe(42);
      expect(updatedNode.data.values.input1).toBeUndefined();
      expect(scriptStore.activeScript.edges[0].targetHandle).toBe('multiplier');
    });

    it('allows changing port data type (number, string, boolean) on custom nodes', () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_3',
        nodes: [
          {
            id: 'custom_node_2',
            type: 'customScript',
            inputs: [{ id: 'val', label: 'val', dataType: 'number', color: '#64B5F6' }],
            outputs: [],
            data: { values: { val: 10 } }
          }
        ],
        edges: []
      };
      scriptStore.selectedNodeId = 'custom_node_2';

      const { updatePortDataType } = useNodeLogic();

      // Switch to string
      updatePortDataType('val', 'input', 'string');
      let node = scriptStore.activeScript.nodes[0];
      expect(node.inputs[0].dataType).toBe('string');
      expect(node.inputs[0].color).toBe('#F48FB1');
      expect(node.data.values.val).toBe('');

      // Switch to boolean
      updatePortDataType('val', 'input', 'boolean');
      node = scriptStore.activeScript.nodes[0];
      expect(node.inputs[0].dataType).toBe('boolean');
      expect(node.inputs[0].color).toBe('#E57373');
      expect(node.data.values.val).toBe(false);

      // Switch back to number
      updatePortDataType('val', 'input', 'number');
      node = scriptStore.activeScript.nodes[0];
      expect(node.inputs[0].dataType).toBe('number');
      expect(node.inputs[0].color).toBe('#64B5F6');
      expect(node.data.values.val).toBe(0);
    });

    it('prevents changing port data type on system nodes', () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_4',
        nodes: [
          {
            id: 'sys_node_2',
            type: 'mathAdd',
            inputs: [{ id: 'a', label: 'A', dataType: 'number', color: '#64B5F6' }]
          }
        ],
        edges: []
      };
      scriptStore.selectedNodeId = 'sys_node_2';

      const { updatePortDataType } = useNodeLogic();
      updatePortDataType('a', 'input', 'string');

      expect(scriptStore.activeScript.nodes[0].inputs[0].dataType).toBe('number');
    });

    it('reorders ports using movePort (up/down) on custom nodes and protects execution port', () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_5',
        nodes: [
          {
            id: 'custom_node_3',
            type: 'customScript',
            inputs: [
              { id: 'execIn', dataType: 'execution' },
              { id: 'p1', label: 'p1', dataType: 'number' },
              { id: 'p2', label: 'p2', dataType: 'string' },
              { id: 'p3', label: 'p3', dataType: 'boolean' }
            ],
            outputs: []
          }
        ],
        edges: []
      };
      scriptStore.selectedNodeId = 'custom_node_3';

      const { movePort } = useNodeLogic();

      // Move p3 up -> should swap p3 with p2
      movePort('p3', 'input', 'up');
      let inputs = scriptStore.activeScript.nodes[0].inputs;
      expect(inputs.map(p => p.id)).toEqual(['execIn', 'p1', 'p3', 'p2']);

      // Move p3 down -> should swap p3 with p2 back
      movePort('p3', 'input', 'down');
      inputs = scriptStore.activeScript.nodes[0].inputs;
      expect(inputs.map(p => p.id)).toEqual(['execIn', 'p1', 'p2', 'p3']);

      // Attempt to move p1 up -> should be blocked from swapping with execIn
      movePort('p1', 'input', 'up');
      inputs = scriptStore.activeScript.nodes[0].inputs;
      expect(inputs.map(p => p.id)).toEqual(['execIn', 'p1', 'p2', 'p3']);
    });

    it('preserves existing custom script code when adding ports and does not reset code data', async () => {
      const scriptStore = useScriptStore();
      const customCode = 'const mySpecialVar = 100;\noutputs.result = mySpecialVar * 2;\nreturn;';
      scriptStore.activeScript = {
        id: 'script_6',
        nodes: [
          {
            id: 'custom_node_code_preserve',
            type: 'customScript',
            inputs: [],
            outputs: [],
            data: {
              code: customCode
            }
          }
        ],
        edges: []
      };
      scriptStore.selectedNodeId = 'custom_node_code_preserve';

      const { handleAddPort } = useNodeLogic();

      // Add dynamic input
      await handleAddPort('input');

      // Custom code MUST stay completely intact and not be reset
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(customCode);

      // Add dynamic output
      await handleAddPort('output');
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(customCode);
    });
  });

  describe('Custom Blueprint Category & Canvas / Recent Quick Add', () => {
    it('always places Custom blueprint category at index 0 of libraryGroups even when empty', async () => {
      const projectStore = useProjectStore();
      projectStore.project = {
        id: 'proj_empty',
        name: 'Empty Project',
        customBlueprints: []
      };

      const { useNodeBlueprint } = await import('@nodes/nodes.js');
      const { libraryGroups } = useNodeBlueprint();

      expect(libraryGroups.value).toBeDefined();
      expect(libraryGroups.value.length).toBeGreaterThan(1);
      expect(libraryGroups.value[0].id).toBe('custom');
      expect(libraryGroups.value[0].label).toBe('Custom');
      expect(libraryGroups.value[0].items).toEqual([]);
    });

    it('displays saved custom blueprints inside Custom category at index 0', async () => {
      const projectStore = useProjectStore();
      const customBp = {
        type: 'custom_healthBar',
        label: 'Health Bar UI',
        role: 'action',
        defaultData: {
          settings: { headerTitle: 'Health Bar UI', headerColor: '#8B5CF6', category: 'Custom' },
          inputs: [],
          outputs: [],
          data: { values: {}, code: 'return;' }
        }
      };

      projectStore.project = {
        id: 'proj_custom',
        name: 'Custom Project',
        customBlueprints: [customBp]
      };

      const { useNodeBlueprint } = await import('@nodes/nodes.js');
      const { libraryGroups } = useNodeBlueprint();

      expect(libraryGroups.value[0].id).toBe('custom');
      expect(libraryGroups.value[0].items.length).toBe(1);
      expect(libraryGroups.value[0].items[0].label).toBe('Health Bar UI');
    });

    it('opens canvas background context menu with Add Custom Node and spawns template node on graph', async () => {
      const scriptStore = useScriptStore();
      scriptStore.activeScript = {
        id: 'script_ctx',
        nodes: [],
        edges: []
      };

      const { useNodeMenu } = await import('@nodes/nodes.js');
      const { contextMenu, openBackgroundMenu } = useNodeMenu();

      const mockEvent = { clientX: 250, clientY: 180 };
      const graphPos = { x: 300, y: 220 };

      openBackgroundMenu(mockEvent, graphPos);

      expect(contextMenu.value.visible).toBe(true);
      expect(contextMenu.value.x).toBe(250);
      expect(contextMenu.value.y).toBe(180);
      expect(contextMenu.value.items.length).toBe(1);
      expect(contextMenu.value.items[0].label).toBe('Add Custom Node');

      // Execute Add Custom Node action
      contextMenu.value.items[0].action();

      expect(scriptStore.activeScript.nodes.length).toBe(1);
      const spawnedNode = scriptStore.activeScript.nodes[0];
      expect(spawnedNode.type).toBe('customScript');
      expect(spawnedNode.isCustomScript).toBe(true);
      expect(spawnedNode.position).toEqual({ x: 300, y: 220 });
      expect(spawnedNode.inputs.some(p => p.id === 'execIn')).toBe(true);
      expect(spawnedNode.outputs.some(p => p.id === 'execOut')).toBe(true);
      expect(scriptStore.selectedNodeId).toBe(spawnedNode.id);
    });

    it('creates standalone custom node template via createCustomNodeInstance without saving to library', async () => {
      const { createCustomNodeInstance } = await import('@nodes/nodes.js');
      const nodeInstance = createCustomNodeInstance({ x: 120, y: 240 });

      expect(nodeInstance.id).toBeDefined();
      expect(nodeInstance.type).toBe('customScript');
      expect(nodeInstance.isCustomScript).toBe(true);
      expect(nodeInstance.position).toEqual({ x: 120, y: 240 });
      expect(nodeInstance.settings.headerTitle).toBe('Custom Node');
      expect(nodeInstance.settings.category).toBe('Custom');
      expect(nodeInstance.data.code).toBe('return;');
    });

    it('prompts user for blueprint name using atomic prompt and allows identical/duplicate names safely', async () => {
      const { saveCustomBlueprintToLibrary } = await import('@nodes/nodes.js');
      const projectStore = useProjectStore();
      projectStore.project = {
        id: 'proj_save_test',
        name: 'Save Test',
        customBlueprints: []
      };

      const customNodeA = {
        id: 'node_alpha',
        type: 'customScript',
        role: 'action',
        settings: { headerTitle: 'My Custom Action' },
        inputs: [],
        outputs: [],
        data: { values: {}, code: 'return;' }
      };

      const customNodeB = {
        id: 'node_beta',
        type: 'customScript',
        role: 'action',
        settings: { headerTitle: 'Another Action' },
        inputs: [],
        outputs: [],
        data: { values: {}, code: 'return;' }
      };

      let promptMock = async () => 'Super Logic';
      let popPayload = null;
      const showPop = (payload) => { popPayload = payload; };

      // Save first node with name "Super Logic"
      const resA = await saveCustomBlueprintToLibrary(customNodeA, projectStore, { prompt: promptMock, showPop });
      expect(resA).toBe(true);
      expect(projectStore.activeProject.customBlueprints.length).toBe(1);
      expect(projectStore.activeProject.customBlueprints[0].label).toBe('Super Logic');
      expect(projectStore.activeProject.customBlueprints[0].type).toBe('custom_node_alpha');
      expect(popPayload).toEqual({
        title: 'Custom Blueprint Saved',
        message: 'Custom blueprint "Super Logic" has been successfully saved to the project library.',
        type: 'success'
      });

      // Save second node ALSO with the duplicate name "Super Logic" -> completely allowed because blueprint ID is unique!
      const resB = await saveCustomBlueprintToLibrary(customNodeB, projectStore, { prompt: promptMock, showPop });
      expect(resB).toBe(true);
      expect(projectStore.activeProject.customBlueprints.length).toBe(2);
      expect(projectStore.activeProject.customBlueprints[1].label).toBe('Super Logic');
      expect(projectStore.activeProject.customBlueprints[1].type).toBe('custom_node_beta');
    });

    it('aborts saving custom blueprint when user cancels prompt', async () => {
      const { saveCustomBlueprintToLibrary } = await import('@nodes/nodes.js');
      const projectStore = useProjectStore();
      projectStore.project = {
        id: 'proj_cancel_test',
        name: 'Cancel Test',
        customBlueprints: []
      };

      const customNode = {
        id: 'node_to_cancel',
        type: 'customScript',
        role: 'action',
        settings: { headerTitle: 'Unsaved Action' },
        inputs: [],
        outputs: [],
        data: { values: {}, code: 'return;' }
      };

      const promptCancelMock = async () => null; // User clicked Cancel
      let popCalled = false;
      const showPop = () => { popCalled = true; };

      const res = await saveCustomBlueprintToLibrary(customNode, projectStore, { prompt: promptCancelMock, showPop });
      expect(res).toBe(false);
      expect(projectStore.activeProject.customBlueprints.length).toBe(0);
      expect(popCalled).toBe(false);
    });

    it('shows Save as Blueprint in context menu for custom nodes', async () => {
      const { useNodeMenu } = await import('@nodes/nodes.js');
      const scriptStore = useScriptStore();
      const customNode = {
        id: 'custom_node_menu',
        type: 'customScript',
        isCustomScript: true,
        label: 'My Custom Script',
        settings: { headerTitle: 'My Custom Script' }
      };

      scriptStore.activeScript = {
        id: 'script_menu_test',
        nodes: [customNode],
        edges: []
      };

      const { contextMenu, openMenu } = useNodeMenu();
      openMenu({ clientX: 100, clientY: 200 }, customNode);

      expect(contextMenu.value.visible).toBe(true);
      const saveItem = contextMenu.value.items.find(i => i.label === 'Save as Blueprint');
      expect(saveItem).toBeDefined();
    });
  });
});
