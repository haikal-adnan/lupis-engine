import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Object Basic E2E',
    description: 'E2E runtime logic evaluation for Game Object nodes (get_object, set_object, find_closest_by_tag) in engine preview',
  },
});

test.describe('Blueprint Object Basic (Game Object) E2E Testing', () => {

  // =========================================================================
  // 1. GET_OBJECT NODE TESTS
  // =========================================================================
  test.describe('1. GET OBJECT NODE', () => {

    test('Reads properties from target entity (self)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Get Object - Valid Entity',
        entityName: 'PlayerEntity',
        scriptName: 'Script_GetObject_Valid',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          {
            id: 'getObject',
            type: 'get_object',
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getObject', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getObject', sourceHandle: 'name', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'PlayerEntity',
      });
    });

    test('Reads default tag property (untagged) from empty entity', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Get Object - Fallback Tag',
        entityName: 'EmptyEntity_NoTag',
        scriptName: 'Script_GetObject_Fallback',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          {
            id: 'getObject',
            type: 'get_object',
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Tag Name'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getObject', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getObject', sourceHandle: 'tagName', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'untagged',
      });
    });

    test('Handles non-existent target entity safely (null entity guard)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Get Object - Non Existent Entity Guard',
        entityName: 'MainEntity',
        scriptName: 'Script_GetObject_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'non_existent_entity_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getObject', type: 'get_object', pos: { x: 350, y: 200 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Safe Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getObject', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Safe Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. SET_OBJECT NODE TESTS
  // =========================================================================
  test.describe('2. SET OBJECT NODE', () => {

    test('Modifies valid target entity properties (Name and Tag)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Object - Modify All Properties',
        entityName: 'ControlEntity',
        scriptName: 'Script_SetObject_Success',
        variables: [
          { name: 'targetEntityId', type: 'string', value: 'self' },
          { name: 'newName', type: 'string', value: 'Updated Target A' },
          { name: 'newTag', type: 'string', value: 'Ally' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varName', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 400 } },
          {
            id: 'setObject',
            type: 'set_object',
            pos: { x: 400, y: 100 },
            dynamicInputs: ['Name', 'Tag'],
          },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 700, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Object Done', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
          { nodeId: 'varName', varName: 'newName' },
          { nodeId: 'varTag', varName: 'newTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setObject', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'target_in' },
          { source: 'varName', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'name' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'tag' },
          { source: 'setObject', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Object Done',
      });
    });

    test('Ignores empty string values without overwriting properties', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Object - Ignore Empty Values Coverage',
        entityName: 'ControlEntity',
        scriptName: 'Script_SetObject_IgnoreEmpty',
        variables: [
          { name: 'targetEntityId', type: 'string', value: 'self' },
          { name: 'emptyName', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varName', type: 'variable_get', pos: { x: 100, y: 300 } },
          {
            id: 'setObject',
            type: 'set_object',
            pos: { x: 400, y: 100 },
            dynamicInputs: ['Name'],
          },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 700, y: 100 },
            inspectorValues: { in_msg: { value: 'Execution Out Triggered', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
          { nodeId: 'varName', varName: 'emptyName' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setObject', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'target_in' },
          { source: 'varName', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'name' },
          { source: 'setObject', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Execution Out Triggered',
      });
    });

    test('Non-existent target entity executes Out pin safely', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Object - Non Existent Target Execution Out',
        entityName: 'ControlEntity',
        scriptName: 'Script_SetObject_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'setObject', type: 'set_object', pos: { x: 400, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 700, y: 100 },
            inspectorValues: { in_msg: { value: 'Out Executed Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setObject', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setObject', targetHandle: 'target_in' },
          { source: 'setObject', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Out Executed Successfully',
      });
    });
  });

  // =========================================================================
  // 3. FIND_CLOSEST_BY_TAG NODE TESTS
  // =========================================================================
  test.describe('3. FIND CLOSEST BY TAG NODE', () => {

    test('Finds closest active entity among multiple entities with matching tag', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Entity Far (X: 500, Y: 500) -> Tag: Enemy
      const entFar = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entFar.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Enemy_Far', scriptId: 'Enemy_Far_ID', tag: 'Enemy' });
      await inspectorCrud.setupTransform(500, 500);

      // 2. Entity Closest (X: 30, Y: 40) -> Tag: Enemy
      const entClose = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entClose.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Enemy_Closest', scriptId: 'Enemy_Closest_ID', tag: 'Enemy' });
      await inspectorCrud.setupTransform(30, 40);

      // 3. Ally Entity (X: 5, Y: 5) -> Tag: Ally
      const entAlly = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entAlly.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Ally_Entity', scriptId: 'Ally_ID', tag: 'Ally' });
      await inspectorCrud.setupTransform(5, 5);

      await blueprintRunner.runTest({
        testName: 'Find Closest - Multiple Entities Happy Path',
        entityName: 'Player_Searcher',
        scriptName: 'Script_FindClosest_Multiple',
        variables: [
          { name: 'tagEnemy', type: 'string', value: 'Enemy' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'find_closest_by_tag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
          { source: 'findNode', sourceHandle: 'target_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Enemy_Closest_ID',
      });
    });

    test('Returns Found = false and triggers False Branch when tag is not found', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      const entAlly = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entAlly.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Ally_Guard', scriptId: 'Ally_Guard_ID', tag: 'Ally' });
      await inspectorCrud.setupTransform(10, 10);

      await blueprintRunner.runTest({
        testName: 'Find Closest - Bad Path Tag Not Found',
        entityName: 'Player_Searcher',
        scriptName: 'Script_FindClosest_NotFoundTag',
        variables: [
          { name: 'searchTag', type: 'string', value: 'Boss' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'find_closest_by_tag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 850, y: 100 },
            inspectorValues: { in_msg: { value: 'Target Tag Not Found', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'searchTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Target Tag Not Found',
      });
    });

    test('Ignores inactive target entities even if closer in distance', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Inactive Close Entity (X: 10, Y: 10) -> Active: false
      const entInactive = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entInactive.click();
      await inspectorCrud.configureObjectMetaData({ 
        name: 'Enemy_Inactive_Close', 
        scriptId: 'Enemy_Inactive_ID', 
        tag: 'Enemy',
        active: false 
      });
      await inspectorCrud.setupTransform(10, 10);

      // 2. Active Far Entity (X: 200, Y: 200) -> Active: true
      const entActive = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entActive.click();
      await inspectorCrud.configureObjectMetaData({ 
        name: 'Enemy_Active_Far', 
        scriptId: 'Enemy_Active_ID', 
        tag: 'Enemy',
        active: true 
      });
      await inspectorCrud.setupTransform(200, 200);

      await blueprintRunner.runTest({
        testName: 'Find Closest - Bad Path Inactive Skipped',
        entityName: 'Player_Searcher',
        scriptName: 'Script_FindClosest_SkipInactive',
        variables: [
          { name: 'tagEnemy', type: 'string', value: 'Enemy' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'find_closest_by_tag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
          { source: 'findNode', sourceHandle: 'target_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Enemy_Active_ID',
      });
    });

    test('Calculates distance accurately relative to From X and From Y inputs', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Entity North (X: 0, Y: 100)
      const entNorth = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entNorth.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Enemy_North', scriptId: 'Enemy_North_ID', tag: 'Enemy' });
      await inspectorCrud.setupTransform(0, 100);

      // 2. Entity South (X: 0, Y: -100)
      const entSouth = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await entSouth.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Enemy_South', scriptId: 'Enemy_South_ID', tag: 'Enemy' });
      await inspectorCrud.setupTransform(0, -100);

      await blueprintRunner.runTest({
        testName: 'Find Closest - Custom Origin Point',
        entityName: 'Player_Searcher',
        scriptName: 'Script_FindClosest_CustomOrigin',
        variables: [
          { name: 'tagEnemy', type: 'string', value: 'Enemy' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 250 } },
          {
            id: 'findNode',
            type: 'find_closest_by_tag',
            pos: { x: 350, y: 200 },
            inspectorValues: {
              from_x: { value: 0, type: 'number' },
              from_y: { value: -80, type: 'number' },
            },
          },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
          { source: 'findNode', sourceHandle: 'target_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Enemy_South_ID',
      });
    });
  });
});