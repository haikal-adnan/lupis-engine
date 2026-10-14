import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Collection Helper E2E',
    description: 'E2E evaluation for core collection helper nodes (Get, Set, Clone, Is Empty) in engine preview',
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'getNode',
          type: 'get_from_path',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            path_in: { value: 'stats.hp', type: 'string' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'playerData' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'getNode', targetHandle: 'collection' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'getNode', sourceHandle: 'result', target: 'notif', targetHandle: 'in_msg' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'setNode',
          type: 'set_from_path',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            path_in: { value: 'profile.title', type: 'string' },
            value: { value: 'Champion', type: 'string' },
          },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'character' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'setNode', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'setNode', targetHandle: 'collection' },
        { source: 'setNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'setNode', sourceHandle: 'value_out', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Champion',
    });
  });

  // 3. CLONE COLLECTION
  test('Clones collection preserving element count using clone_collection', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Clone Collection Basic',
      entityName: 'HelperEntity_Clone',
      scriptName: 'Script_Clone',
      variables: [
        {
          name: 'inventory',
          type: 'list',
          rawJson: ['Sword', 'Shield', 'Potion'],
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'cloneNode', type: 'clone_collection', pos: { x: 350, y: 200 } },
        { id: 'lenNode', type: 'list_length', pos: { x: 600, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'inventory' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'cloneNode', targetHandle: 'collection' },
        { source: 'cloneNode', sourceHandle: 'cloned', target: 'lenNode', targetHandle: 'list' },
        { source: 'lenNode', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 3,
    });
  });

  // 4. IS COLLECTION EMPTY
  test('Identifies empty collection using is_collection_empty', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Is Empty Basic',
      entityName: 'HelperEntity_IsEmpty',
      scriptName: 'Script_IsEmpty',
      variables: [
        {
          name: 'emptyList',
          type: 'list',
          rawJson: [],
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'emptyNode', type: 'is_collection_empty', pos: { x: 350, y: 200 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 850, y: 100 },
          inspectorValues: { in_msg: { value: 'Collection Is Empty', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'emptyList' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'emptyNode', targetHandle: 'collection' },
        { source: 'emptyNode', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Collection Is Empty',
    });
  });

});