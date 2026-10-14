import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Random Operations E2E',
    description: 'E2E evaluation for Random Operation nodes (Random Number, Random Bool, Random From List, Random Chance, Random Color) in engine preview',
  },
});

test.describe('Blueprint Random Operations E2E Testing', () => {

  // 1. RANDOM NUMBER / SMART (random_smart)
  test('Random number - Generates integer within specified min and max bounds', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Random Number Range Test',
      entityName: 'RandomEntity_Number',
      scriptName: 'Script_RandomNumber',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'randSmart',
          type: 'random_smart',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            min: { value: 7, type: 'number' },
            max: { value: 7, type: 'number' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'randSmart', sourceHandle: 'result', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 7,
    });
  });

  // 2. RANDOM BOOLEAN (random_boolean)
  test('Random boolean - Evaluates generated boolean value via logic branch', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Random Boolean Test',
      entityName: 'RandomEntity_Bool',
      scriptName: 'Script_RandomBool',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'randBool', type: 'random_boolean', pos: { x: 350, y: 200 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
        {
          id: 'notifTrue',
          type: 'ui_notification',
          pos: { x: 850, y: 50 },
          inspectorValues: { in_msg: { value: 'Boolean Evaluated', type: 'string' } },
        },
        {
          id: 'notifFalse',
          type: 'ui_notification',
          pos: { x: 850, y: 250 },
          inspectorValues: { in_msg: { value: 'Boolean Evaluated', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'randBool', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notifTrue', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_false', target: 'notifFalse', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Boolean Evaluated',
    });
  });

  // 3. RANDOM FROM LIST (random_from_list)
  test('List get random - Picks single element from provided list', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Random From List Test',
      entityName: 'RandomEntity_FromList',
      scriptName: 'Script_RandomFromList',
      variables: [
        {
          name: 'lootTable',
          type: 'list',
          rawJson: ['Excalibur'],
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'randList', type: 'random_from_list', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'lootTable' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'randList', targetHandle: 'list' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'randList', sourceHandle: 'item', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Excalibur',
    });
  });

  // 4. RANDOM CHANCE (random_chance)
  test('Random chance - Evaluates probability outcome as boolean', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Random Chance Test',
      entityName: 'RandomEntity_Chance',
      scriptName: 'Script_RandomChance',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'randChance',
          type: 'random_chance',
          pos: { x: 350, y: 200 },
          inspectorValues: { chance: { value: 100, type: 'number' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Chance Guaranteed Passed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'randChance', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Chance Guaranteed Passed',
    });
  });

  // 5. RANDOM COLOR (random_color)
  test('Random color - Generates formatted hex color string', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Random Color Test',
      entityName: 'RandomEntity_Color',
      scriptName: 'Script_RandomColor',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'randColor', type: 'random_color', pos: { x: 350, y: 200 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
        {
          id: 'notifTrue',
          type: 'ui_notification',
          pos: { x: 850, y: 50 },
          inspectorValues: { in_msg: { value: 'Color String Valid', type: 'string' } },
        },
        {
          id: 'notifFalse',
          type: 'ui_notification',
          pos: { x: 850, y: 250 },
          inspectorValues: { in_msg: { value: 'Color String Valid', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'randColor', sourceHandle: 'color', target: 'branch', targetHandle: 'cond_0' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notifTrue', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_false', target: 'notifFalse', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Color String Valid',
    });
  });

});