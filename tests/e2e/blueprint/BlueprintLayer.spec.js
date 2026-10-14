import { test } from '../fixtures.js';

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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getLayer', sourceHandle: 'name', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Z-Index'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getLayer', sourceHandle: 'zIndex', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Get Layer Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidLayer' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varZ', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'set_layer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Z-Index'],
          },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Z-Index'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varZ', varName: 'newZIndex' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setLayer', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'target_in' },
          { source: 'varZ', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'zIndex' },
          { source: 'setLayer', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'getLayer', sourceHandle: 'zIndex', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varOpacity', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'set_layer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Opacity (%)'],
          },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Opacity (%)'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varOpacity', varName: 'targetOpacity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setLayer', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'target_in' },
          { source: 'varOpacity', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'opacity' },
          { source: 'setLayer', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'getLayer', sourceHandle: 'opacity', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varVisible', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'set_layer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Visible'],
          },
          { 
            id: 'getLayer', 
            type: 'get_layer', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Visible'],
          },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { in_msg: { value: 'Layer Hidden Confirmed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetLayer' },
          { nodeId: 'varVisible', varName: 'hideLayer' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setLayer', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'target_in' },
          { source: 'varVisible', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'visible' },
          { source: 'setLayer', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getLayer', targetHandle: 'target_in' },
          { source: 'getLayer', sourceHandle: 'visible', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Layer Hidden Confirmed',
      });
    });

    test('Non-existent target layer executes Out pin safely', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varZ', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setLayer', 
            type: 'set_layer', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Z-Index'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Layer Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidLayer' },
          { nodeId: 'varZ', varName: 'valZ' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setLayer', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'target_in' },
          { source: 'varZ', sourceHandle: 'out_0', target: 'setLayer', targetHandle: 'zIndex' },
          { source: 'setLayer', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Layer Null Safe Out',
      });
    });
  });

});