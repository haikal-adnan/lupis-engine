import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Boolean Logic E2E',
    description: 'E2E runtime logic evaluation for Boolean operations (AND, OR, NOT) in engine preview',
  },
});

test.describe('Blueprint Boolean Logic E2E Testing', () => {
  test('Evaluates logic_and with two boolean variables (true AND true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean AND Test',
      entityName: 'BoolEntity1',
      scriptName: 'AndScript',
      variables: [
        { name: 'isPlayerAlive', type: 'boolean', value: true },
        { name: 'hasKey', type: 'boolean', value: true },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variable_get', pos: { x: 100, y: 400 } },
        { id: 'andNode', type: 'logic_and', pos: { x: 350, y: 300 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'AND logic passed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'isPlayerAlive' },
        { nodeId: 'var2', varName: 'hasKey' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'out_0', target: 'andNode', targetHandle: 'v0' },
        { source: 'var2', sourceHandle: 'out_0', target: 'andNode', targetHandle: 'v1' },
        { source: 'andNode', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'AND logic passed',
    });
  });

  test('Evaluates logic_or with two boolean variables (false OR true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean OR Test',
      entityName: 'BoolEntity2',
      scriptName: 'OrScript',
      variables: [
        { name: 'isVip', type: 'boolean', value: false },
        { name: 'hasPass', type: 'boolean', value: true },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variable_get', pos: { x: 100, y: 400 } },
        { id: 'orNode', type: 'logic_or', pos: { x: 350, y: 300 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'OR logic passed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'isVip' },
        { nodeId: 'var2', varName: 'hasPass' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'out_0', target: 'orNode', targetHandle: 'v0' },
        { source: 'var2', sourceHandle: 'out_0', target: 'orNode', targetHandle: 'v1' },
        { source: 'orNode', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'OR logic passed',
    });
  });

  test('Evaluates logic_not with inverted boolean value (!false = true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean NOT Test',
      entityName: 'BoolEntity3',
      scriptName: 'NotScript',
      variables: [{ name: 'isGamePaused', type: 'boolean', value: false }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'notNode', type: 'logic_not', pos: { x: 350, y: 250 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'NOT logic passed', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'isGamePaused' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'notNode', targetHandle: 'in_val' },
        { source: 'notNode', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'NOT logic passed',
    });
  });
});