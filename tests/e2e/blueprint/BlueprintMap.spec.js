import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Map Operations E2E',
    description: 'E2E evaluation for verified Map manipulation nodes in engine preview',
  },
});

test.describe('Blueprint Map Operations E2E Testing', () => {

  // 1. MAP GET (map_get)
  test('Map get - Retrieves value by key', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Get Test',
      entityName: 'MapEntity_Get',
      scriptName: 'Script_MapGet',
      variables: [
        {
          name: 'playerStats',
          type: 'map',
          rawJson: { hp: 100 },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'mapGet',
          type: 'map_get',
          pos: { x: 350, y: 200 },
          inspectorValues: { key: { value: 'hp', type: 'string' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'playerStats' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapGet', targetHandle: 'map' },
        { source: 'mapGet', sourceHandle: 'value', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 100,
    });
  });

  // 2. MAP SET (map_set)
  test('Map set - Adds or updates key-value pair', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Set Test',
      entityName: 'MapEntity_Set',
      scriptName: 'Script_MapSet',
      variables: [
        {
          name: 'profile',
          type: 'map',
          rawJson: { role: 'Warrior' },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'mapSet',
          type: 'map_set',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            key: { value: 'status', type: 'string' },
            value: { value: 'Active', type: 'string' },
          },
        },
        {
          id: 'mapGet',
          type: 'map_get',
          pos: { x: 600, y: 250 },
          inspectorValues: { key: { value: 'status', type: 'string' } },
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'profile' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'mapSet', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapSet', targetHandle: 'map' },
        { source: 'mapSet', sourceHandle: 'map_out', target: 'mapGet', targetHandle: 'map' },
        { source: 'mapSet', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'mapGet', sourceHandle: 'value', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'Active',
    });
  });

  // 3. MAP REMOVE (map_remove)
  test('Map remove - Removes key and value from map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Remove Test',
      entityName: 'MapEntity_Remove',
      scriptName: 'Script_MapRemove',
      variables: [
        {
          name: 'inventory',
          type: 'map',
          rawJson: { potion: 5, trash: 1 },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'mapRemove',
          type: 'map_remove',
          pos: { x: 350, y: 100 },
          inspectorValues: { key: { value: 'trash', type: 'string' } },
        },
        { id: 'mapSize', type: 'map_size', pos: { x: 600, y: 250 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'inventory' }],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'mapRemove', targetHandle: 'exec_in' },
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapRemove', targetHandle: 'map' },
        { source: 'mapRemove', sourceHandle: 'map_out', target: 'mapSize', targetHandle: 'map' },
        { source: 'mapSize', sourceHandle: 'size', target: 'notif', targetHandle: 'in_msg' },
        { source: 'mapRemove', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 1,
    });
  });

  // 4. MAP HAS (map_has)
  test('Map has - Checks whether key exists in map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Has Test',
      entityName: 'MapEntity_Has',
      scriptName: 'Script_MapHas',
      variables: [
        {
          name: 'heroData',
          type: 'map',
          rawJson: { sword: true },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'mapHas',
          type: 'map_has',
          pos: { x: 350, y: 200 },
          inspectorValues: { key: { value: 'sword', type: 'string' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Key Exists', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'heroData' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapHas', targetHandle: 'map' },
        { source: 'mapHas', sourceHandle: 'result', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Key Exists',
    });
  });

  // 5. MAP MERGE (map_merge)
  test('Map merge - Combines two maps into a single new map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Merge Test',
      entityName: 'MapEntity_Merge',
      scriptName: 'Script_MapMerge',
      variables: [
        { name: 'mapA', type: 'map', rawJson: { x: 10 } },
        { name: 'mapB', type: 'map', rawJson: { y: 20 } },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVarA', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'getVarB', type: 'variable_get', pos: { x: 100, y: 400 } },
        { id: 'mapMerge', type: 'map_merge', pos: { x: 350, y: 300 } },
        { id: 'mapSize', type: 'map_size', pos: { x: 600, y: 300 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'getVarA', varName: 'mapA' },
        { nodeId: 'getVarB', varName: 'mapB' },
      ],
      connections: [
        { source: 'getVarA', sourceHandle: 'out_0', target: 'mapMerge', targetHandle: 'map_a' },
        { source: 'getVarB', sourceHandle: 'out_0', target: 'mapMerge', targetHandle: 'map_b' },
        { source: 'mapMerge', sourceHandle: 'result_map', target: 'mapSize', targetHandle: 'map' },
        { source: 'mapSize', sourceHandle: 'size', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 2,
    });
  });

  // 6. MAP KEYS (map_keys)
  test('Map keys - Extracts key list from map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Keys Test',
      entityName: 'MapEntity_Keys',
      scriptName: 'Script_MapKeys',
      variables: [
        {
          name: 'attributes',
          type: 'map',
          rawJson: { fire: 1, water: 2, earth: 3 },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'mapKeys', type: 'map_keys', pos: { x: 350, y: 200 } },
        { id: 'listLen', type: 'list_length', pos: { x: 600, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'attributes' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapKeys', targetHandle: 'map' },
        { source: 'mapKeys', sourceHandle: 'keys_list', target: 'listLen', targetHandle: 'list' },
        { source: 'listLen', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 3,
    });
  });

  // 7. MAP VALUES (map_values)
  test('Map values - Extracts value list from map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Values Test',
      entityName: 'MapEntity_Values',
      scriptName: 'Script_MapValues',
      variables: [
        {
          name: 'loot',
          type: 'map',
          rawJson: { gold: 100, silver: 50 },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'mapValues', type: 'map_values', pos: { x: 350, y: 200 } },
        { id: 'listLen', type: 'list_length', pos: { x: 600, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'loot' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapValues', targetHandle: 'map' },
        { source: 'mapValues', sourceHandle: 'values_list', target: 'listLen', targetHandle: 'list' },
        { source: 'listLen', sourceHandle: 'length', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 2,
    });
  });

  // 8. MAP SIZE (map_size)
  test('Map size - Counts total key-value pairs in map', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Size Test',
      entityName: 'MapEntity_Size',
      scriptName: 'Script_MapSize',
      variables: [
        {
          name: 'inventory',
          type: 'map',
          rawJson: { potion: 1, sword: 1, shield: 1, helmet: 1 },
        },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'mapSize', type: 'map_size', pos: { x: 350, y: 200 } },
        { id: 'notif', type: 'ui_notification', pos: { x: 600, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'inventory' }],
      connections: [
        { source: 'getVar', sourceHandle: 'out_0', target: 'mapSize', targetHandle: 'map' },
        { source: 'mapSize', sourceHandle: 'size', target: 'notif', targetHandle: 'in_msg' },
        { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 4,
    });
  });

});