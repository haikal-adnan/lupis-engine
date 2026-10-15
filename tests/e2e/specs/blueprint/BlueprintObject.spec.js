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
  test.describe('Get Object Node', () => {

    test('Reads properties from target entity (self)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Get Object - Valid Entity',
        entityName: 'PlayerEntity',
        scriptName: 'Script_GetObject_Valid',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          {
            id: 'getObject',
            type: 'getObject',
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Name'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getObject', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getObject', sourceHandle: 'name', target: 'notif', targetHandle: 'message' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          {
            id: 'getObject',
            type: 'getObject',
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Tag Name'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getObject', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getObject', sourceHandle: 'tagName', target: 'notif', targetHandle: 'message' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'getObject', type: 'getObject', pos: { x: 350, y: 200 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Safe Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getObject', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Safe Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. SET_OBJECT NODE TESTS
  // =========================================================================
  test.describe('Set Object Node', () => {

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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varName', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 400 } },
          {
            id: 'setObject',
            type: 'setObject',
            pos: { x: 400, y: 100 },
            dynamicInputs: ['Name', 'Tag'],
          },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 700, y: 100 },
            inspectorValues: { message: { value: 'Set Object Done', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
          { nodeId: 'varName', varName: 'newName' },
          { nodeId: 'varTag', varName: 'newTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setObject', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setObject', targetHandle: 'targetEntity' },
          { source: 'varName', sourceHandle: 'value', target: 'setObject', targetHandle: 'name' },
          { source: 'varTag', sourceHandle: 'value', target: 'setObject', targetHandle: 'tag' },
          { source: 'setObject', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varName', type: 'variableGet', pos: { x: 100, y: 300 } },
          {
            id: 'setObject',
            type: 'setObject',
            pos: { x: 400, y: 100 },
            dynamicInputs: ['Name'],
          },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 700, y: 100 },
            inspectorValues: { message: { value: 'Execution Out Triggered', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
          { nodeId: 'varName', varName: 'emptyName' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setObject', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setObject', targetHandle: 'targetEntity' },
          { source: 'varName', sourceHandle: 'value', target: 'setObject', targetHandle: 'name' },
          { source: 'setObject', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Execution Out Triggered',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Object - Non Existent Target Execution Out',
        entityName: 'ControlEntity',
        scriptName: 'Script_SetObject_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_id' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'setObject', type: 'setObject', pos: { x: 400, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 700, y: 100 },
            inspectorValues: { message: { value: 'Out Executed Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setObject', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setObject', targetHandle: 'targetEntity' },
          { source: 'setObject', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Target entity must exist',
        expectedSource: 'Assert',
      });
    });
  });

  // =========================================================================
  // 3. FIND_CLOSEST_BY_TAG NODE TESTS
  // =========================================================================
  test.describe('Find Closest by tag node', () => {

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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'findClosestByTag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'varTag', sourceHandle: 'value', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
          { source: 'findNode', sourceHandle: 'targetEntity', target: 'notif', targetHandle: 'message' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'findClosestByTag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 850, y: 100 },
            inspectorValues: { message: { value: 'Target Tag Not Found', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'searchTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'varTag', sourceHandle: 'value', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onFalse', target: 'notif', targetHandle: 'execIn' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'findNode', type: 'findClosestByTag', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'varTag', sourceHandle: 'value', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
          { source: 'findNode', sourceHandle: 'targetEntity', target: 'notif', targetHandle: 'message' },
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 250 } },
          {
            id: 'findNode',
            type: 'findClosestByTag',
            pos: { x: 350, y: 200 },
            inspectorValues: {
              fromX: { value: 0, type: 'number' },
              fromY: { value: -80, type: 'number' },
            },
          },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTag', varName: 'tagEnemy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'varTag', sourceHandle: 'value', target: 'findNode', targetHandle: 'tag' },
          { source: 'findNode', sourceHandle: 'found', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
          { source: 'findNode', sourceHandle: 'targetEntity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Enemy_South_ID',
      });
    });
  });
});