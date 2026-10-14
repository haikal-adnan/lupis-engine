import { test } from '../fixtures.js';

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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'formatNode',
          type: 'string_format',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            score: { value: 85, type: 'number' },
            max: { value: 100, type: 'number' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'formatNode', sourceHandle: 'res_0', target: 'notif', targetHandle: 'in_msg' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'joinNode',
          type: 'string_join',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            separator: { value: ' - ', type: 'string' },
            v0: { value: 'Alpha', type: 'string' },
            v1: { value: 'Beta', type: 'string' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'joinNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'lenNode',
          type: 'string_length',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            str_in: { value: 'Lupis Engine', type: 'string' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'lenNode', sourceHandle: 'len_out', target: 'notif', targetHandle: 'in_msg' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'anyToStr', type: 'any_to_string', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'scoreValue' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'anyToStr', targetHandle: 'in_val' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'anyToStr', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: '999',
    });
  });

});