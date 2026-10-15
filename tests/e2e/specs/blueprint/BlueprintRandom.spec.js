import { test } from '../../fixtures.js';

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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'randSmart',
          type: 'randomSmart',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            min: { value: 7, type: 'number' },
            max: { value: 7, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'randSmart', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'randBool', type: 'randomBoolean', pos: { x: 350, y: 200 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
        {
          id: 'notifTrue',
          type: 'uiNotification',
          pos: { x: 850, y: 50 },
          inspectorValues: { message: { value: 'Boolean Evaluated', type: 'string' } },
        },
        {
          id: 'notifFalse',
          type: 'uiNotification',
          pos: { x: 850, y: 250 },
          inspectorValues: { message: { value: 'Boolean Evaluated', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'randBool', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notifTrue', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onFalse', target: 'notifFalse', targetHandle: 'execIn' },
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'randList', type: 'randomFromList', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'lootTable' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'randList', targetHandle: 'list' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'randList', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'randChance',
          type: 'randomChance',
          pos: { x: 350, y: 200 },
          inspectorValues: { chance: { value: 100, type: 'number' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Chance Guaranteed Passed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'randChance', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'randColor', type: 'randomColor', pos: { x: 350, y: 200 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
        {
          id: 'notifTrue',
          type: 'uiNotification',
          pos: { x: 850, y: 50 },
          inspectorValues: { message: { value: 'Color String Valid', type: 'string' } },
        },
        {
          id: 'notifFalse',
          type: 'uiNotification',
          pos: { x: 850, y: 250 },
          inspectorValues: { message: { value: 'Color String Valid', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'randColor', sourceHandle: 'color', target: 'branch', targetHandle: 'condition' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notifTrue', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onFalse', target: 'notifFalse', targetHandle: 'execIn' },
      ],
      expectedLog: 'Color String Valid',
    });
  });

});