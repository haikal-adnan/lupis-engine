import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Collection Helper E2E',
    description: 'E2E evaluation for core collection helper nodes (Get from Path, Set by Path) in engine preview',
  },
});

test.describe('Blueprint Collection Helper E2E Testing', () => {

  // 1. GET FROM PATH
  test('Retrieves nested property value using get_from_path', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Get From Path Basic',
      entityName: 'HelperEntity_GetPath',
      scriptName: 'Script_GetPath',
      variables: [
        {
          name: 'playerData',
          type: 'map',
          rawJson: { stats: { hp: 100 } },
        },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'getNode',
          type: 'getFromPath',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            path: { value: 'stats.hp', type: 'string' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'playerData' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'getNode', targetHandle: 'collection' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'getNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 100,
    });
  });

  // 2. SET FROM PATH
  test('Updates nested property value using set_from_path', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Set From Path Basic',
      entityName: 'HelperEntity_SetPath',
      scriptName: 'Script_SetPath',
      variables: [
        {
          name: 'character',
          type: 'map',
          rawJson: { profile: { title: 'Novice' } },
        },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'setNode',
          type: 'setFromPath',
          pos: { x: 350, y: 150 },
          inspectorValues: {
            path: { value: 'profile.title', type: 'string' },
            value: { value: 'Champion', type: 'string' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'character' }],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'setNode', targetHandle: 'execIn' },
        { source: 'getVar', sourceHandle: 'value', target: 'setNode', targetHandle: 'collection' },
        { source: 'setNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'setNode', sourceHandle: 'valueOut', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Champion',
    });
  });

});