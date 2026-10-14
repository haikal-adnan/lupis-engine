import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Loop Operations E2E',
    description: 'E2E evaluation for control loop nodes (For Loop, For Each, While Loop) in engine preview',
  },
});

test.describe('Blueprint Loop Operations E2E Testing', () => {

  // 1. FOR LOOP (logic_loop)
  test('For loop - Executes iteration range and outputs final index on completed', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'For Loop Range Test',
      entityName: 'LoopEntity_ForLoop',
      scriptName: 'Script_ForLoop',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'forLoop',
          type: 'logic_loop',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            start: { value: 1, type: 'number' },
            end: { value: 3, type: 'number' },
            step: { value: 1, type: 'number' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'forLoop', targetHandle: 'exec_in' },
        { source: 'forLoop', sourceHandle: 'completed', target: 'notif', targetHandle: 'exec_in' },
        { source: 'forLoop', sourceHandle: 'index', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 3,
    });
  });

  // 2. FOR EACH (logic_for_each)
  test('For each - Iterates list items and outputs current element to loop body', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'For Each Item Test',
      entityName: 'LoopEntity_ForEach',
      scriptName: 'Script_ForEach',
      variables: [
        {
          name: 'items',
          type: 'list',
          rawJson: ['Potion'],
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'forEach', type: 'logic_for_each', pos: { x: 350, y: 100 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'items' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'forEach', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'forEach', targetHandle: 'list' },
        { source: 'forEach', sourceHandle: 'loop_body', target: 'notif', targetHandle: 'exec_in' },
        { source: 'forEach', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Potion',
    });
  });

  // 3. WHILE LOOP (logic_while)
  test('While loop - Completes execution when condition is false', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'While Loop False Exit Test',
      entityName: 'LoopEntity_While',
      scriptName: 'Script_While',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'whileLoop',
          type: 'logic_while',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            condition: { value: false, type: 'boolean' },
          },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'While Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'whileLoop', targetHandle: 'exec_in' },
        { source: 'whileLoop', sourceHandle: 'completed', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'While Completed',
    });
  });

});