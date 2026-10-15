import { test } from '../../fixtures.js';

test.describe('Game Preview & Blueprint Execution E2E Testing', () => {
  test('creates a string variable, selects it in the Get Variable node, and connects it to the Notification message', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Variable to Notification Test',
      entityName: 'VariableTestEntity',
      scriptName: 'VariableTestScript',
      variables: [{ name: 'greetingMessage', type: 'string', value: 'Hello World' }],
      nodes: [
        { id: 'startNode', type: 'eventGameStart', pos: { x: 100, y: 200 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 350 } },
        { id: 'notifNode', type: 'uiNotification', pos: { x: 450, y: 200 } },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'greetingMessage' }],
      connections: [
        { source: 'startNode', sourceHandle: 'execOut', target: 'notifNode', targetHandle: 'execIn' },
        { source: 'varNode', sourceHandle: 'value', target: 'notifNode', targetHandle: 'message' },
      ],
      expectedLog: 'Hello World',
    });
  });
});