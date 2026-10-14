import { test } from '../../fixtures.js';

test.describe('Game Preview & Blueprint Execution E2E Testing', () => {
  test('creates a string variable, selects it in a Get Variable node and connects it to Notification in_msg', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Variable to Notification Test',
      entityName: 'VariableTestEntity',
      scriptName: 'VariableTestScript',
      variables: [{ name: 'greetingMessage', type: 'string', value: 'Hello World' }],
      nodes: [
        { id: 'startNode', type: 'event_game_start', pos: { x: 100, y: 200 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 350 } },
        { id: 'notifNode', type: 'ui_notification', pos: { x: 450, y: 200 } },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'greetingMessage' }],
      connections: [
        { source: 'startNode', sourceHandle: 'out', target: 'notifNode', targetHandle: 'exec_in' },
        { source: 'varNode', sourceHandle: 'out_0', target: 'notifNode', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Hello World',
    });
  });
});