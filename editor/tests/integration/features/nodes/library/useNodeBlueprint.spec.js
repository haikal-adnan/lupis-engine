import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Boxes } from 'lucide-vue-next';

import { 
  ALL_BLUEPRINTS,
  BlueprintBoolean,
  BlueprintTransform,
  BlueprintKeyboard
} from '@nodes/library/blueprints/index.js';
import ContextSystem, { ScriptAssertionError } from '@core/Script/ContextSystem.js';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import { CONTEXT_NAMESPACES } from '@core/Script/contract/index.js';

vi.mock('@nodes/nodes.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn()
    }))
  };
});

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  }))
}));

import { useNodeBlueprint } from '@nodes/library/composables/useNodeBlueprint.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';
import { 
  setupMockOPFS, 
  createMockEmptyProject 
} from '@tests/tests.js';

const allBlueprints = ALL_BLUEPRINTS;

const mockCategoryTemplate = {
  id: 'categoryTemplate',
  label: 'Category Name',
  color: '#3B82F6',
  icon: Boxes,

  items: [
    {
      type: 'eventExampleNode',
      label: 'On Custom Event',
      description: 'Dicuplik/dijalankan saat event tertentu dipicu.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'On Custom Event',
          headerColor: '#3B82F6',
          category: 'Category Name'
        },
        inputs: [],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'eventData', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: `const eventData = node._tempData.dataValue;\n\noutputs.eventData = eventData;\noutputs.execOut = true;\nreturn;`
        }
      }
    },
    {
      type: 'actionExampleNode',
      label: 'Do Something',
      description: 'Mengeksekusi aksi pada target entity atau sistem.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Do Something',
          headerColor: '#F59E0B',
          category: 'Category Name'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'targetEntity', dataType: 'string', color: '#FFB74D', defaultValue: 'self' },
          { id: 'amount', dataType: 'number', color: '#64B5F6', defaultValue: 100 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { targetEntity: 'self', amount: 100 },
          code: `const target = inputs.targetEntity;\nconst amount = Number(inputs.amount);\nconst entity = context.getEntity(target);\n\nentity.applyAmount(amount);\n\noutputs.result = true;\noutputs.execOut = true;\nreturn;`
        }
      }
    },
    {
      type: 'dynamicExampleNode',
      label: 'Dynamic Collection',
      description: 'Menerima port input dinamis yang dapat ditambah atau dikurangi.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: {
          headerTitle: 'Dynamic Collection',
          headerColor: '#00796B',
          category: 'Category Name'
        },
        inputs: [
          { id: 'v0', dataType: 'number', color: '#64B5F6' },
          { id: 'v1', dataType: 'number', color: '#64B5F6' }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: `const collection = Object.values(inputs);\noutputs.result = collection.reduce((acc, curr) => acc + curr, 0);\nreturn;`
        }
      }
    }
  ]
};

describe('useNodeBlueprint Integration', () => {
  let pinia;
  let scriptStore;
  let workspaceStore;
  let projectStore;
  let mockStoreRef;

  const PORT_ID_REGEX = /^[A-Za-z][A-Za-z0-9]{0,31}$/;

  // Kamus pemetaan ID tidak baku ke ID baku yang dilarang
  const FORBIDDEN_PORT_ALIASES = {
    in: 'execIn',
    exec_in: 'execIn',
    execute_in: 'execIn',
    out: 'execOut',
    exec_out: 'execOut',
    execute_out: 'execOut',
    target: 'targetEntity',
    target_entity: 'targetEntity',
    target_in: 'targetEntity',
    targetId: 'targetEntity',
    target_id: 'targetEntity',
    in_source: 'source',
    source_entity: 'sourceEntity',
    in_msg: 'message',
    dt: 'deltaTime',
    delta: 'deltaTime',
    delta_time: 'deltaTime',
    val: 'value',
    res: 'result',
    out_result: 'result',
    val_amount: 'amount',
    value_amount: 'amount'
  };

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);

    mockStoreRef = setupMockOPFS();

    projectStore = useProjectStore();
    scriptStore = useScriptStore();
    workspaceStore = useWorkspaceStore();

    const mockProject = await createMockEmptyProject({ projectName: 'Blueprint Integration Project' });
    projectStore.project = mockProject;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear();
    }
  });

  describe('Comprehensive Registered Blueprints Audit', () => {
    it('verifies all 29 registered blueprint modules exist and have valid structure', () => {
      expect(allBlueprints).toHaveLength(29);

      allBlueprints.forEach((blueprint) => {
        expect(blueprint).toBeDefined();
        expect(blueprint.id).toBeDefined();
        expect(blueprint.label).toBeDefined();
        expect(Array.isArray(blueprint.items)).toBe(true);

        blueprint.items.forEach((item) => {
          expect(item.type).toBeDefined();
          expect(item.label).toBeDefined();
          expect(item.defaultData).toBeDefined();
          expect(Array.isArray(item.defaultData.inputs)).toBe(true);
          expect(Array.isArray(item.defaultData.outputs)).toBe(true);

          if (item.defaultData.data?.code) {
            const rawCode = item.defaultData.data.code;
            const cleanCode = rawCode.trim();

            expect(rawCode.includes('//'), `Node '${item.type}' di '${blueprint.label}' mengandung komentar single-line`).toBe(false);
            expect(rawCode.includes('/*'), `Node '${item.type}' di '${blueprint.label}' mengandung komentar multi-line`).toBe(false);
            expect(cleanCode.length > 0, `Node '${item.type}' di '${blueprint.label}' code tidak boleh kosong`).toBe(true);

            const hasReturnEnd = cleanCode.endsWith('return;') || cleanCode.endsWith('return');
            expect(hasReturnEnd, `Node '${item.type}' di '${blueprint.label}' tidak diakhiri return`).toBe(true);
          }
        });
      });
    });

    it('verifies that all ports have no label property and only use id', () => {
      allBlueprints.forEach((blueprint) => {
        blueprint.items.forEach((item) => {
          const allPorts = [
            ...(item.defaultData.inputs || []),
            ...(item.defaultData.outputs || [])
          ];

          allPorts.forEach((port) => {
            expect(
              port.label,
              `Port '${port.id}' pada node '${item.type}' (${blueprint.label}) masih memiliki properti label. Label port harus dihapus.`
            ).toBeUndefined();
            expect(port.id).toBeDefined();
          });
        });
      });
    });

    it('ensures no null, undefined, optional chaining, or fallback checks exist in code logic', () => {
      const forbiddenNullCheck = /(===|!==|==|!=)\s*(null|undefined)|typeof\s+[a-zA-Z0-9_.]+\s*(===|!==)\s*['"]undefined['"]/;

      allBlueprints.forEach((blueprint) => {
        blueprint.items.forEach((item) => {
          const code = item.defaultData.data?.code;
          if (!code) return;

          expect(code.includes('??'), `Node '${item.type}' di '${blueprint.label}' masih menggunakan nullish coalescing (??)`).toBe(false);
          expect(code.includes('?.'), `Node '${item.type}' di '${blueprint.label}' masih menggunakan optional chaining (?.)`).toBe(false);
          expect(forbiddenNullCheck.test(code), `Node '${item.type}' di '${blueprint.label}' masih melakukan pengecekan null/undefined eksplisit`).toBe(false);
        });
      });
    });

    it('enforces T-001 port ID alphanumeric regex across all 29 blueprints', () => {
      allBlueprints.forEach((blueprint) => {
        blueprint.items.forEach((item) => {
          const allPorts = [
            ...(item.defaultData.inputs || []),
            ...(item.defaultData.outputs || [])
          ];

          allPorts.forEach((port) => {
            const isValidId = PORT_ID_REGEX.test(port.id);
            expect(
              isValidId,
              `Port ID '${port.id}' pada node '${item.type}' (${blueprint.label}) melanggar aturan T-001`
            ).toBe(true);

            expect(port.id).not.toContain(' ');
            expect(port.id).not.toContain('_');
            expect(port.id).not.toContain('-');
            expect(port.id).not.toContain('.');
          });
        });
      });
    });

    it('enforces standard canonical port naming dictionary across all 29 blueprints', () => {
      allBlueprints.forEach((blueprint) => {
        blueprint.items.forEach((item) => {
          const allPorts = [
            ...(item.defaultData.inputs || []),
            ...(item.defaultData.outputs || [])
          ];

          allPorts.forEach((port) => {
            const forbiddenMatch = FORBIDDEN_PORT_ALIASES[port.id];
            expect(
              forbiddenMatch,
              `Port ID '${port.id}' pada node '${item.type}' (${blueprint.label}) tidak baku. Gunakan ID kanonikal '${forbiddenMatch}'.`
            ).toBeUndefined();
          });
        });
      });
    });

    it('enforces T-403 single ID assignment and direct inputs access without labels', () => {
      allBlueprints.forEach((blueprint) => {
        blueprint.items.forEach((item) => {
          const code = item.defaultData.data?.code;
          if (!code) return;

          const hasLabelFallback = /inputs\s*\[\s*['"][^'"]+['"]\s*\]\s*\?\?\s*inputs/g.test(code);
          expect(hasLabelFallback, `Node '${item.type}' di '${blueprint.label}' masih menggunakan pola fallback label`).toBe(false);
        });
      });
    });

    it('validates mock category template compliance with standard canonical port dictionary', () => {
      expect(mockCategoryTemplate.id).toBe('categoryTemplate');
      expect(mockCategoryTemplate.items).toHaveLength(3);

      mockCategoryTemplate.items.forEach((item) => {
        const cleanCode = item.defaultData.data.code.trim();
        expect(cleanCode.endsWith('return;') || cleanCode.endsWith('return')).toBe(true);
        expect(cleanCode.includes('??')).toBe(false);
        expect(cleanCode.includes('?.')).toBe(false);

        const allPorts = [
          ...(item.defaultData.inputs || []),
          ...(item.defaultData.outputs || [])
        ];

        allPorts.forEach((port) => {
          expect(port.label).toBeUndefined();
          expect(PORT_ID_REGEX.test(port.id)).toBe(true);
          expect(FORBIDDEN_PORT_ALIASES[port.id]).toBeUndefined();
        });
      });
    });
  });

  describe('Blueprint Registry & Group Initialization', () => {
    it('initializes and sorts node groups alphabetically by label', () => {
      const { nodeGroups } = useNodeBlueprint();

      const labels = nodeGroups.map(g => g.label);
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));

      expect(nodeGroups.length).toBe(29);
      expect(labels).toEqual(sortedLabels);
    });

    it('retrieves correct node blueprint definition by type from registered groups', () => {
      const { getNodeBlueprint } = useNodeBlueprint();
      const sampleItem = BlueprintBoolean.items[0];

      const blueprint = getNodeBlueprint(sampleItem.type);

      expect(blueprint).not.toBeNull();
      expect(blueprint?.type).toBe(sampleItem.type);
      expect(blueprint?.label).toBe(sampleItem.label);
    });

    it('[Bad Path] returns null when node type is unknown', () => {
      const { getNodeBlueprint } = useNodeBlueprint();
      const blueprint = getNodeBlueprint('unknown_node_type_x');
      expect(blueprint).toBeNull();
    });
  });

  describe('Search & Filtering Integration', () => {
    it('filters node items across groups based on active search query', () => {
      const { searchQuery, filteredGroups } = useNodeBlueprint();
      const sampleNode = BlueprintTransform.items[0];

      searchQuery.value = sampleNode.label;

      expect(filteredGroups.value.length).toBeGreaterThan(0);
      const matchedItems = filteredGroups.value.flatMap(g => g.items);
      const targetItem = matchedItems.find(i => i.label === sampleNode.label);

      expect(targetItem).toBeDefined();
      expect(targetItem?.type).toBe(sampleNode.type);
    });

    it('[Bad Path] returns empty groups array when search query finds no matches', () => {
      const { searchQuery, filteredGroups } = useNodeBlueprint();
      searchQuery.value = 'NonExistentQuery_999';
      expect(filteredGroups.value).toHaveLength(0);
    });
  });

  describe('Drag Event Handling', () => {
    it('attaches node payload to dataTransfer during drag start', () => {
      const { onDragNode } = useNodeBlueprint();
      const targetItem = BlueprintKeyboard.items[0];
      const setDataMock = vi.fn();
      const mockEvent = {
        dataTransfer: {
          setData: setDataMock,
          effectAllowed: ''
        }
      };

      onDragNode(mockEvent, targetItem);

      expect(setDataMock).toHaveBeenCalledWith('application/node-template', JSON.stringify(targetItem));
      expect(mockEvent.dataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('Dynamic Inputs & Code Synchronization', () => {
    it('synchronizes sequential ports (v0, v1, ...) without labels and direct code logic', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();
      const dynamicNode = {
        type: 'dynamicExampleNode',
        dynamicMode: 'sequential',
        inputs: [
          { id: 'v0', dataType: 'number' },
          { id: 'v1', dataType: 'number' },
          { id: 'v2', dataType: 'number' }
        ],
        data: {
          values: { v0: 10, v1: 25 },
          code: `outputs.result = Object.values(inputs).reduce((acc, curr) => acc + curr, 0);\nreturn;`
        }
      };

      syncDynamicInputsAndCode(dynamicNode);

      expect(dynamicNode.inputs).toHaveLength(3);
      expect(dynamicNode.inputs[0]).toMatchObject({ id: 'v0', dataType: 'number' });
      expect(dynamicNode.inputs[1]).toMatchObject({ id: 'v1', dataType: 'number' });
      expect(dynamicNode.inputs[2]).toMatchObject({ id: 'v2', dataType: 'number' });

      dynamicNode.inputs.forEach((port) => {
        expect(port.label).toBeUndefined();
      });

      expect(dynamicNode.data.values).toEqual({
        v0: 10,
        v1: 25,
        v2: 0
      });

      expect(dynamicNode.data.code.includes('??')).toBe(false);
      expect(dynamicNode.data.code.includes('?.')).toBe(false);
      expect(dynamicNode.data.code).toContain('outputs.result =');
    });

    it('retains canonical execIn port while reindexing sequential data ports', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();
      const mixedNode = {
        type: 'dynamicExampleNode',
        dynamicMode: 'sequential',
        inputs: [
          { id: 'execIn', dataType: 'execution' },
          { id: 'customValue', dataType: 'string' }
        ],
        data: {
          values: {},
          code: ''
        }
      };

      syncDynamicInputsAndCode(mixedNode);

      expect(mixedNode.inputs[0]).toMatchObject({ id: 'execIn', dataType: 'execution' });
      expect(mixedNode.inputs[0].label).toBeUndefined();

      expect(mixedNode.inputs[1]).toMatchObject({ id: 'v0', dataType: 'string' });
      expect(mixedNode.inputs[1].label).toBeUndefined();

      expect(mixedNode.data.values).toEqual({ v0: '' });
    });

    it('[Bad Path] handles null or malformed node payload without throwing errors', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint();

      expect(() => syncDynamicInputsAndCode(null)).not.toThrow();
      expect(() => syncDynamicInputsAndCode({})).not.toThrow();
      expect(() => syncDynamicInputsAndCode({ inputs: 'not_an_array' })).not.toThrow();
    });
  });

  describe('Context System Contract & Zero-Leak Assertion Halting', () => {
    it('verifies CONTEXT_NAMESPACES contract contains assert and console', () => {
      expect(CONTEXT_NAMESPACES).toContain('assert');
      expect(CONTEXT_NAMESPACES).toContain('console');
      expect(CONTEXT_NAMESPACES).toContain('entity');
      expect(CONTEXT_NAMESPACES).toContain('layer');
    });

    it('verifies context.console (log, warn, error) event emission with multi-arguments', () => {
      const emittedEvents = [];
      const mockGame = {
        deltaTime: 0.016,
        events: {
          emit: (name, payload) => emittedEvents.push({ name, payload })
        }
      };
      const contextSystem = new ContextSystem(mockGame);
      const mockRunner = { owner: { id: 'ent_1' }, getNodeState: vi.fn(() => ({})) };
      const mockNode = { id: 'node_test_log', type: 'testNode' };
      const context = contextSystem.createExecutionContext(mockRunner, mockNode);

      context.console.log('Player health:', 100, { state: 'alive' });
      context.console.warn('Low stamina warning');
      context.console.error('Failed to load asset', 404);

      expect(emittedEvents).toHaveLength(3);
      expect(emittedEvents[0]).toMatchObject({
        name: 'console:log',
        payload: {
          type: 'log',
          source: 'Script',
          message: '[Scene] [ent_1] [Script] [testNode] Player health: 100 {"state":"alive"}'
        }
      });
      expect(emittedEvents[1]).toMatchObject({
        name: 'console:warn',
        payload: {
          type: 'warn',
          source: 'Script',
          message: '[Scene] [ent_1] [Script] [testNode] Low stamina warning'
        }
      });
      expect(emittedEvents[2]).toMatchObject({
        name: 'console:error',
        payload: {
          type: 'error',
          source: 'Script',
          message: '[Scene] [ent_1] [Script] [testNode] Failed to load asset 404'
        }
      });
    });

    it('verifies context.assert contract validation methods and error throwing', () => {
      const emittedErrors = [];
      const mockGame = {
        deltaTime: 0.016,
        events: {
          emit: (name, payload) => {
            if (name === 'console:error') emittedErrors.push(payload);
          }
        }
      };
      const contextSystem = new ContextSystem(mockGame);
      const mockRunner = { owner: { id: 'ent_1' }, getNodeState: vi.fn(() => ({})) };
      const mockNode = { id: 'node_assert_test', type: 'assertNode' };
      const context = contextSystem.createExecutionContext(mockRunner, mockNode);

      // isTrue & isFalse
      expect(context.assert.isTrue(true)).toBe(true);
      expect(() => context.assert.isTrue(false, 'Should be true')).toThrow(ScriptAssertionError);
      expect(context.assert.isFalse(false)).toBe(true);
      expect(() => context.assert.isFalse(true, 'Should be false')).toThrow(ScriptAssertionError);

      // exists
      expect(context.assert.exists('valid string')).toBe('valid string');
      expect(context.assert.exists(0)).toBe(0);
      expect(() => context.assert.exists(null, 'Entity is missing')).toThrow(ScriptAssertionError);
      expect(() => context.assert.exists(undefined, 'Property is undefined')).toThrow(ScriptAssertionError);

      // hasComponent
      const mockEntity = { components: { Transform: { x: 10, y: 20 } } };
      expect(context.assert.hasComponent(mockEntity, 'Transform')).toEqual({ x: 10, y: 20 });
      expect(() => context.assert.hasComponent(mockEntity, 'Collider2D')).toThrow(ScriptAssertionError);
      expect(() => context.assert.hasComponent(null, 'Transform')).toThrow(ScriptAssertionError);

      // isNumber
      expect(context.assert.isNumber(42)).toBe(42);
      expect(context.assert.isNumber('123.45')).toBe(123.45);
      expect(() => context.assert.isNumber('abc')).toThrow(ScriptAssertionError);
      expect(() => context.assert.isNumber(null)).toThrow(ScriptAssertionError);

      // isString
      expect(context.assert.isString('hello')).toBe('hello');
      expect(() => context.assert.isString(123)).toThrow(ScriptAssertionError);

      // isBoolean
      expect(context.assert.isBoolean(true)).toBe(true);
      expect(context.assert.isBoolean(false)).toBe(false);
      expect(() => context.assert.isBoolean('true')).toThrow(ScriptAssertionError);

      // isObject
      expect(context.assert.isObject({ a: 1 })).toEqual({ a: 1 });
      expect(() => context.assert.isObject([1, 2, 3])).toThrow(ScriptAssertionError);
      expect(() => context.assert.isObject(null)).toThrow(ScriptAssertionError);

      // isArray
      expect(context.assert.isArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(() => context.assert.isArray({ length: 3 })).toThrow(ScriptAssertionError);

      // inRange
      expect(context.assert.inRange(5, 0, 10)).toBe(5);
      expect(() => context.assert.inRange(15, 0, 10)).toThrow(ScriptAssertionError);
      expect(() => context.assert.inRange(-1, 0, 10)).toThrow(ScriptAssertionError);

      // fail
      expect(() => context.assert.fail('Manual failure triggered')).toThrow(ScriptAssertionError);

      expect(emittedErrors.length).toBeGreaterThan(0);
      emittedErrors.forEach(err => {
        expect(err.source).toBe('Assert');
        expect(err.message).toContain("node: 'assertNode'");
      });
    });

    it('guarantees execution halts at node on assertion failure and never runs downstream nodes', () => {
      const executedNodes = [];
      const emittedErrors = [];

      const mockGame = {
        deltaTime: 0.016,
        events: {
          emit: (name, payload) => {
            if (name === 'console:error') emittedErrors.push(payload);
          }
        },
        variables: {
          getGlobal: vi.fn()
        }
      };
      mockGame.contextSystem = new ContextSystem(mockGame);

      const scriptData = {
        id: 'script_test_flow',
        localVariables: [],
        nodes: [
          {
            id: 'node_start',
            type: 'startNode',
            inputs: [{ id: 'execIn', dataType: 'execution' }],
            outputs: [{ id: 'execOut', dataType: 'execution' }],
            data: {
              code: 'return;'
            }
          },
          {
            id: 'node_downstream',
            type: 'downstreamNode',
            inputs: [{ id: 'execIn', dataType: 'execution' }],
            outputs: [{ id: 'execOut', dataType: 'execution' }],
            data: {
              code: 'return;'
            }
          }
        ],
        edges: [
          {
            sourceNodeId: 'node_start',
            sourcePortId: 'execOut',
            targetNodeId: 'node_downstream',
            targetPortId: 'execIn'
          }
        ]
      };

      const ownerEntity = { id: 'ent_flow_tester' };
      const runner = new ScriptRunner(mockGame, scriptData, ownerEntity);

      runner._compiledFunctions.set('node_start', (inputs, outputs, context, node) => {
        executedNodes.push('node_start');
        context.assert.isTrue(false, 'Halt here immediately');
        outputs.execOut = true;
      });
      runner._compiledFunctions.set('node_downstream', (inputs, outputs, context, node) => {
        executedNodes.push('node_downstream');
        outputs.execOut = true;
      });

      expect(() => {
        runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
      }).not.toThrow();

      // node_start executed, but node_downstream was NOT executed due to assertion halt!
      expect(executedNodes).toEqual(['node_start']);
      expect(emittedErrors.length).toBe(1);
      expect(emittedErrors[0].message).toContain('Halt here immediately');
    });
  });
});