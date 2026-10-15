import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Layer E2E',
    description: 'E2E runtime logic evaluation for Basic Layer nodes (get_layer, set_layer) in engine preview',
  },
});

test.describe('Blueprint Layer (game_layer_basic) E2E Testing', () => {

  // =========================================================================
  // 1. GET_LAYER NODE TESTS
  // =========================================================================
  test.describe('Get layer node', () => {

    test('Reads layer name property from target layer', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Layer - Read Name',
        entityName: 'LayerReaderEntity',
        scriptName: 'Script_GetLayer_Name',
        variables: [
          { name: 'targetLayer', type: 'string', value: 'World Layer' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getLayer', sourceHandle: 'name', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'World Layer',
      });
    });

    test('Reads default Z-Index property from target layer', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Layer - Read Default Z-Index',
        entityName: 'LayerReaderEntity',
        scriptName: 'Script_GetLayer_ZIndex',
        variables: [
          { name: 'targetLayer', type: 'string', value: 'World Layer' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Z-Index'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getLayer', sourceHandle: 'zIndex', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 0,
      });
    });

    test('Handles non-existent layer target safely (null target guard)', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Layer - Null Target Guard',
        entityName: 'LayerControlEntity',
        scriptName: 'Script_GetLayer_NullGuard',
        variables: [
          { name: 'invalidLayer', type: 'string', value: 'missing_layer_target_404' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Get Layer Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Get Layer Null Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. SET_LAYER NODE TESTS
  // =========================================================================
  test.describe('Set layer node', () => {

    test('Modifies Z-Index of target layer and verifies with get_layer', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Layer - Modify Z-Index',
        entityName: 'LayerModifierEntity',
        scriptName: 'Script_SetLayer_ZIndex',
        variables: [
          { name: 'targetLayer', type: 'string', value: 'World Layer' },
          { name: 'newZIndex', type: 'number', value: 7 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varZ', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'setLayer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Z-Index'],
          },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Z-Index'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varZ', varName: 'newZIndex' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setLayer', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setLayer', targetHandle: 'targetLayer' },
          { source: 'varZ', sourceHandle: 'value', target: 'setLayer', targetHandle: 'zIndex' },
          { source: 'setLayer', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'getLayer', sourceHandle: 'zIndex', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 7,
      });
    });

    test('Modifies Opacity percentage of target layer and verifies with get_layer', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Layer - Modify Opacity Percentage',
        entityName: 'LayerModifierEntity',
        scriptName: 'Script_SetLayer_Opacity',
        variables: [
          { name: 'targetLayer', type: 'string', value: 'World Layer' },
          { name: 'targetOpacity', type: 'number', value: 60 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varOpacity', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'setLayer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Opacity (%)'],
          },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Opacity (%)'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varOpacity', varName: 'targetOpacity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setLayer', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setLayer', targetHandle: 'targetLayer' },
          { source: 'varOpacity', sourceHandle: 'value', target: 'setLayer', targetHandle: 'opacity' },
          { source: 'setLayer', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'getLayer', sourceHandle: 'opacity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 60,
      });
    });

    test('Modifies Visible status of target layer to false and verifies via logic branch', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Layer - Modify Visibility False Branch',
        entityName: 'LayerModifierEntity',
        scriptName: 'Script_SetLayer_Visibility',
        variables: [
          { name: 'targetLayer', type: 'string', value: 'World Layer' },
          { name: 'hideLayer', type: 'boolean', value: false },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVisible', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'setLayer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Visible'],
          },
          { 
            id: 'getLayer', 
            type: 'getLayer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Visible'],
          },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { message: { value: 'Layer Hidden Confirmed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varVisible', varName: 'hideLayer' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setLayer', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setLayer', targetHandle: 'targetLayer' },
          { source: 'varVisible', sourceHandle: 'value', target: 'setLayer', targetHandle: 'visible' },
          { source: 'setLayer', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
          { source: 'getLayer', sourceHandle: 'visible', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onFalse', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Layer Hidden Confirmed',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target layer does not exist', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Layer - Non Existent Target Execution Out',
        entityName: 'LayerControlEntity',
        scriptName: 'Script_SetLayer_NullTarget',
        variables: [
          { name: 'invalidLayer', type: 'string', value: 'missing_layer_id_999' },
          { name: 'valZ', type: 'number', value: 10 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varZ', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'setLayer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Z-Index'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Layer Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidLayer' },
          { nodeId: 'varZ', varName: 'valZ' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setLayer', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setLayer', targetHandle: 'targetLayer' },
          { source: 'varZ', sourceHandle: 'value', target: 'setLayer', targetHandle: 'zIndex' },
          { source: 'setLayer', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

});