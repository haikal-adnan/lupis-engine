import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { applyModifier, applyModifiers } from '@core/Script/ValueModifier.js';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { normalizeScript } from '@scripts/compile/normalizeScript.js';
import { compileScript } from '@scripts/compile/compileScript.js';
import { useScriptHistory } from '@historys/historys.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { setupMockScriptEnvironment, setupMockOPFS } from '@tests/tests.js';
import { BlueprintSystem } from '@nodes/library/blueprints/BlueprintSystem.js';

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateEntity: vi.fn(),
    updateComponentProp: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));

vi.mock('@nodes/nodes.js', () => ({
  useNodeBlueprint: () => ({
    syncDynamicInputsAndCode: vi.fn()
  })
}));

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    getProjectsRootDirectory: vi.fn().mockResolvedValue({}),
    resolveDirectoryPath: vi.fn().mockResolvedValue({}),
    writeFileToHandle: vi.fn().mockResolvedValue(true),
    removeFileFromHandle: vi.fn().mockResolvedValue(true)
  })
}));

describe('Edge Modifier & Notification System Integration', () => {
  describe('ValueModifier Unit Operations', () => {
    it('correctly handles numeric modifiers', () => {
      expect(applyModifier(10, { type: 'add', value: 5 })).toBe(15);
      expect(applyModifier('10', { type: 'add', value: 5 })).toBe(15);
      expect(applyModifier(10, { type: 'subtract', value: 3 })).toBe(7);
      expect(applyModifier(10, { type: 'multiply', value: 4 })).toBe(40);
      expect(applyModifier(20, { type: 'divide', value: 4 })).toBe(5);
      expect(applyModifier(10, { type: 'divide', value: 0 })).toBe(0);
      expect(applyModifier(10, { type: 'invert' })).toBe(-10);
      expect(applyModifier(-15, { type: 'abs' })).toBe(15);
    });

    it('correctly handles string modifiers', () => {
      expect(applyModifier('hello', { type: 'append', value: ' world' })).toBe('hello world');
      expect(applyModifier('world', { type: 'prepend', value: 'hello ' })).toBe('hello world');
      expect(applyModifier('lupis', { type: 'uppercase' })).toBe('LUPIS');
      expect(applyModifier('LUPIS', { type: 'lowercase' })).toBe('lupis');
      expect(applyModifier('  spaced  ', { type: 'trim' })).toBe('spaced');
    });

    it('correctly handles boolean modifiers', () => {
      expect(applyModifier(true, { type: 'not' })).toBe(false);
      expect(applyModifier(false, { type: 'not' })).toBe(true);
    });

    it('applies modifier chains through applyModifiers', () => {
      const modifiers = [
        { type: 'add', value: 10 },
        { type: 'multiply', value: 2 }
      ];
      expect(applyModifiers(5, modifiers)).toBe(30);
    });
  });

  describe('Script Compilation and Normalization with Edge Modifiers', () => {
    it('preserves edge modifier in normalizeScript', () => {
      const rawScript = {
        id: 'script_test',
        nodes: [],
        edges: [
          {
            id: 'edge_1',
            source: 'node_a',
            sourceHandle: 'out',
            target: 'node_b',
            targetHandle: 'in',
            modifier: { type: 'add', value: 5 }
          }
        ]
      };

      const normalized = normalizeScript(rawScript);
      expect(normalized.edges[0].modifier).toEqual({ type: 'add', value: 5 });
    });

    it('compiles edge modifier into port.source in compileScript', () => {
      const rawScript = {
        id: 'script_test',
        nodes: [
          {
            id: 'node_a',
            type: 'numberNode',
            outputs: [{ id: 'out', dataType: 'number' }],
            data: { code: 'outputs.out = 10;' }
          },
          {
            id: 'node_b',
            type: 'receiverNode',
            inputs: [{ id: 'in', dataType: 'number' }],
            data: { code: 'return;' }
          }
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'node_a',
            sourceHandle: 'out',
            target: 'node_b',
            targetHandle: 'in',
            modifier: { type: 'multiply', value: 3 }
          }
        ]
      };

      const compiled = compileScript(rawScript, { force: true });
      const targetNode = compiled.nodes.find(n => n.id === 'node_b');
      expect(targetNode.inputs[0].source).toEqual({
        kind: 'edge',
        modifier: { type: 'multiply', value: 3 }
      });
    });
  });

  describe('ScriptRunner Edge Modifier Runtime Execution', () => {
    let mockGame;

    beforeEach(() => {
      mockGame = {
        events: {
          emit: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn()
        },
        sceneSystem: {
          getCurrentSceneScriptId: vi.fn(() => 'TestScene')
        },
        world: {
          entities: [],
          scripts: {}
        }
      };
      mockGame.contextSystem = new ContextSystem(mockGame);
    });

    it('applies edge modifier when evaluating pure node data wires', () => {
      const scriptData = {
        id: 'script_edge_runtime',
        nodes: [
          {
            id: 'node_source',
            type: 'provider',
            role: 'pure',
            outputs: [{ id: 'valOut', dataType: 'number' }],
            data: {
              code: 'outputs.valOut = 20; return;'
            }
          },
          {
            id: 'node_target',
            type: 'consumer',
            role: 'action',
            inputs: [
              { id: 'execIn', dataType: 'execution' },
              { id: 'valIn', dataType: 'number' }
            ],
            outputs: [
              { id: 'result', dataType: 'number' }
            ],
            data: {
              code: 'outputs.result = inputs.valIn; return;'
            }
          }
        ],
        edges: [
          {
            id: 'edge_data',
            source: 'node_source',
            sourceHandle: 'valOut',
            target: 'node_target',
            targetHandle: 'valIn',
            modifier: { type: 'add', value: 15 }
          }
        ]
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      const targetNode = runner.nodeMap.get('node_target');
      const inputs = runner.getAllInputValues(targetNode);

      // Raw value from provider is 20, with edge modifier add 15, inputs.valIn must be 35
      expect(inputs.valIn).toBe(35);
    });

    it('applies string edge modifiers at runtime (e.g. uppercase & append)', () => {
      const scriptData = {
        id: 'script_str_edge',
        nodes: [
          {
            id: 'node_str_source',
            type: 'provider',
            role: 'pure',
            outputs: [{ id: 'textOut', dataType: 'string' }],
            data: {
              code: 'outputs.textOut = "lupis engine"; return;'
            }
          },
          {
            id: 'node_str_target',
            type: 'consumer',
            role: 'action',
            inputs: [
              { id: 'execIn', dataType: 'execution' },
              { id: 'textIn', dataType: 'string' }
            ],
            data: {
              code: 'return;'
            }
          }
        ],
        edges: [
          {
            id: 'edge_str',
            source: 'node_str_source',
            sourceHandle: 'textOut',
            target: 'node_str_target',
            targetHandle: 'textIn',
            modifier: { type: 'uppercase' }
          }
        ]
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      const targetNode = runner.nodeMap.get('node_str_target');
      const inputs = runner.getAllInputValues(targetNode);

      expect(inputs.textIn).toBe('LUPIS ENGINE');
    });

    it('applies edge modifier on compiled script payload format', () => {
      const scriptData = {
        id: 'script_compiled_edge',
        nodes: [
          {
            id: 'node_src',
            type: 'numSrc',
            role: 'pure',
            outputs: [{ id: 'num', dataType: 'number' }],
            data: { code: 'outputs.num = 50; return;' }
          },
          {
            id: 'node_tgt',
            type: 'numTgt',
            role: 'action',
            inputs: [
              {
                id: 'num',
                dataType: 'number',
                source: {
                  kind: 'edge',
                  modifier: { type: 'divide', value: 2 }
                }
              }
            ],
            data: { code: 'return;' }
          }
        ],
        edges: [
          {
            id: 'edge_div',
            source: 'node_src',
            sourceHandle: 'num',
            target: 'node_tgt',
            targetHandle: 'num',
            modifier: { type: 'divide', value: 2 }
          }
        ]
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      const targetNode = runner.nodeMap.get('node_tgt');
      const inputs = runner.getAllInputValues(targetNode);

      expect(inputs.num).toBe(25);
    });
  });

  describe('History Undo/Redo for Edge Modifiers', () => {
    let pinia;
    let scriptStore;
    let scriptHistory;
    let workspaceStore;

    beforeEach(async () => {
      setupMockOPFS();
      pinia = createPinia();
      setActivePinia(pinia);

      scriptStore = useScriptStore();
      workspaceStore = useWorkspaceStore();

      const env = await setupMockScriptEnvironment({
        scriptName: 'ScriptModTest',
        nodes: [
          { id: 'node_1', type: 'provider', position: { x: 0, y: 0 }, inputs: [], outputs: [{ id: 'out' }] },
          { id: 'node_2', type: 'consumer', position: { x: 100, y: 100 }, inputs: [{ id: 'in' }], outputs: [] }
        ],
        edges: [
          {
            id: 'edge_test_1',
            source: 'node_1',
            sourceHandle: 'out',
            target: 'node_2',
            targetHandle: 'in',
            modifier: { type: 'none' }
          }
        ]
      });

      const activeScript = env.script;
      scriptStore.setActiveScript(activeScript);
      workspaceStore.tabs = [{ id: 'tab_script_mod', type: 'script', scriptId: activeScript.id }];
      scriptHistory = useScriptHistory();
    });

    it('records edge modifier change and restores old/new modifier on undo/redo', () => {
      const oldModifier = { type: 'none' };
      const newModifier = { type: 'add', value: 10 };

      // Record modifier change
      scriptHistory.recordEdgeModifierChange('edge_test_1', oldModifier, newModifier);
      scriptStore.updateEdgeModifier('edge_test_1', newModifier);

      let edge = scriptStore.activeScript.edges.find(e => e.id === 'edge_test_1');
      expect(edge.modifier).toEqual(newModifier);

      // Undo
      scriptHistory.undo();
      edge = scriptStore.activeScript.edges.find(e => e.id === 'edge_test_1');
      expect(edge.modifier).toEqual(oldModifier);

      // Redo
      scriptHistory.redo();
      edge = scriptStore.activeScript.edges.find(e => e.id === 'edge_test_1');
      expect(edge.modifier).toEqual(newModifier);
    });
  });

  describe('uiNotification Node Definition', () => {
    it('accepts dataType any for message input instead of string', () => {
      const uiNotificationDef = BlueprintSystem.items.find(item => item.type === 'uiNotification');
      expect(uiNotificationDef).toBeDefined();

      const messageInput = uiNotificationDef.defaultData.inputs.find(inp => inp.id === 'message');
      expect(messageInput).toBeDefined();
      expect(messageInput.dataType).toBe('any');
      expect(messageInput.color).toBe('#B0BEC5');
    });
  });
});
