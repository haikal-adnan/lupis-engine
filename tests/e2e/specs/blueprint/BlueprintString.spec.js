import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint String Operations E2E',
    description: 'E2E evaluation for String Utils nodes (Format String, Join Strings, String Length, Any To String) in engine preview',
  },
});

test.describe('Blueprint String Operations E2E Testing', () => {

  // 1. FORMAT STRING (string_format)
  test('String format - Interpolates variable values into template format', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Format Test',
      entityName: 'StringEntity_Format',
      scriptName: 'Script_StringFormat',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'formatNode',
          type: 'stringFormat',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            v0: { value: 85, type: 'number' },
            v1: { value: 100, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'formatNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Score: 85 / 100',
    });
  });

  // 2. JOIN STRINGS (string_join)
  test('String join - Concatenates multiple strings using separator', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Join Test',
      entityName: 'StringEntity_Join',
      scriptName: 'Script_StringJoin',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'joinNode',
          type: 'stringJoin',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            separator: { value: ' - ', type: 'string' },
            v0: { value: 'Alpha', type: 'string' },
            v1: { value: 'Beta', type: 'string' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'joinNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Alpha - Beta',
    });
  });

  // 3. STRING LENGTH (string_length)
  test('String length - Measures total character count of string', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Length Test',
      entityName: 'StringEntity_Length',
      scriptName: 'Script_StringLength',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'lenNode',
          type: 'stringLength',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            value: { value: 'Lupis Engine', type: 'string' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 12,
    });
  });

  // 4. ANY TO STRING (any_to_string)
  test('Any to string - Converts numeric input to string representation', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Any To String Test',
      entityName: 'StringEntity_AnyToStr',
      scriptName: 'Script_AnyToStr',
      variables: [
        { name: 'scoreValue', type: 'number', value: 999 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'anyToStr', type: 'anyToString', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'scoreValue' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'anyToStr', targetHandle: 'value' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'anyToStr', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: '999',
    });
  });

});