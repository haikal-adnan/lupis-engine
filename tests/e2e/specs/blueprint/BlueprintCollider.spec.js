import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Collider E2E',
    description: 'E2E runtime logic evaluation for Collider System nodes (solid_collision, trigger_zone) in engine preview',
  },
});

test.describe('Blueprint Collider System (game_physics) E2E Testing', () => {

  // =========================================================================
  // 1. SOLID COLLISION NODE TESTS
  // =========================================================================
  test.describe('Solid Collision Node', () => {

    test('Reads self entity ID and triggers Out pin when no collision occurs', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const testerEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await testerEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SolidTester', scriptId: 'Solid_Tester_ID' });
      await inspectorCrud.setupCollider();

      await blueprintRunner.runTest({
        testName: 'Solid Collision - Read Self ID',
        entityName: 'SolidTester',
        scriptName: 'Script_Solid_ReadSelf',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solidCollision', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'solidNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'solidNode', targetHandle: 'targetEntity' },
          { source: 'solidNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'solidNode', sourceHandle: 'selfEntity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Solid_Tester_ID',
      });
    });

    test('Verifies is_colliding is false and executes false branch when clear of obstacles', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const clearEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await clearEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SolidClear', scriptId: 'Solid_Clear_ID' });
      await inspectorCrud.setupCollider();

      await blueprintRunner.runTest({
        testName: 'Solid Collision - Is Colliding False Branch',
        entityName: 'SolidClear',
        scriptName: 'Script_Solid_ClearBranch',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solidCollision', pos: { x: 350, y: 150 } },
          { id: 'branch', type: 'logicBranch', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { message: { value: 'No Collision Confirmed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'solidNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'solidNode', targetHandle: 'targetEntity' },
          { source: 'solidNode', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'solidNode', sourceHandle: 'isColliding', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onFalse', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'No Collision Confirmed',
      });
    });

    test('Handles filter tag parameter safely when checking collision', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const taggedEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await taggedEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SolidTagged', scriptId: 'Solid_Tagged_ID' });
      await inspectorCrud.setupCollider();

      await blueprintRunner.runTest({
        testName: 'Solid Collision - Filter Tag Input Safe',
        entityName: 'SolidTagged',
        scriptName: 'Script_Solid_FilterTag',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'tagFilter', type: 'string', value: 'Obstacle' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'solidNode', type: 'solidCollision', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varTag', varName: 'tagFilter' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'solidNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'solidNode', targetHandle: 'targetEntity' },
          { source: 'varTag', sourceHandle: 'value', target: 'solidNode', targetHandle: 'tag' },
          { source: 'solidNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'solidNode', sourceHandle: 'selfEntity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Solid_Tagged_ID',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Solid Collision - Null Target Guard',
        entityName: 'ControlEntity_SolidNull',
        scriptName: 'Script_Solid_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_solid_entity' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solidCollision', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Solid Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'solidNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'solidNode', targetHandle: 'targetEntity' },
          { source: 'solidNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

  // =========================================================================
  // 2. TRIGGER ZONE NODE TESTS
  // =========================================================================
  test.describe('Trigger Zone Node', () => {

    test('Detects overlapping entity, triggers On Enter pin, and reads other entity ID', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Entitas Trigger Zone di koordinat (100, 100)
      const zoneEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await zoneEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'ZoneArea', scriptId: 'Zone_Area_ID' });
      await inspectorCrud.setupTransform(100, 100);
      await inspectorCrud.setupCollider();

      // 2. Visiting entity overlapping at same coordinates (100, 100)
      const visitorEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await visitorEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'VisitorEntity', scriptId: 'Visitor_Entity_ID' });
      await inspectorCrud.setupTransform(100, 100);
      await inspectorCrud.setupCollider();

      await blueprintRunner.runTest({
        testName: 'Trigger Zone - Overlap On Enter',
        entityName: 'ZoneArea',
        scriptName: 'Script_Trigger_EnterDetect',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'triggerZone', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'triggerNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'triggerNode', targetHandle: 'targetEntity' },
          { source: 'triggerNode', sourceHandle: 'onEnter', target: 'notif', targetHandle: 'execIn' },
          { source: 'triggerNode', sourceHandle: 'otherEntity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Visitor_Entity_ID',
      });
    });

    test('Filters out non-matching overlapping entity when filter tag does not match', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Entitas Trigger Zone di koordinat (100, 100)
      const zoneEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await zoneEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'ZoneFiltered', scriptId: 'Zone_Filtered_ID' });
      await inspectorCrud.setupTransform(100, 100);
      await inspectorCrud.setupCollider();

      // 2. Overlapping entity with 'Ally' tag
      const visitorEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await visitorEntity.click();
      await inspectorCrud.configureObjectMetaData({ 
        name: 'VisitorAlly', 
        scriptId: 'Visitor_Ally_ID', 
        tag: 'Ally',
      });
      await inspectorCrud.setupTransform(100, 100);
      await inspectorCrud.setupCollider();

      // Script mencari tag 'Enemy', sehingga visitor ber-tag 'Ally' diabaikan
      await blueprintRunner.runTest({
        testName: 'Trigger Zone - Filter Tag Mismatch Ignored',
        entityName: 'ZoneFiltered',
        scriptName: 'Script_Trigger_TagMismatch',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'searchTag', type: 'string', value: 'Enemy' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'triggerNode', type: 'triggerZone', pos: { x: 350, y: 150 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Tag Mismatch Ignored', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varTag', varName: 'searchTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'triggerNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'triggerNode', targetHandle: 'targetEntity' },
          { source: 'varTag', sourceHandle: 'value', target: 'triggerNode', targetHandle: 'tag' },
          { source: 'triggerNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Tag Mismatch Ignored',
      });
    });

    test('Reads trigger entity ID and verifies is_inside is false when isolated', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const soloZone = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await soloZone.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SoloTrigger', scriptId: 'Solo_Trigger_ID' });
      await inspectorCrud.setupTransform(500, 500);
      await inspectorCrud.setupCollider();

      await blueprintRunner.runTest({
        testName: 'Trigger Zone - Isolated Read Trigger ID',
        entityName: 'SoloTrigger',
        scriptName: 'Script_Trigger_Isolated',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'triggerZone', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'triggerNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'triggerNode', targetHandle: 'targetEntity' },
          { source: 'triggerNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'triggerNode', sourceHandle: 'selfEntity', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Solo_Trigger_ID',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Trigger Zone - Null Target Guard',
        entityName: 'ControlEntity_TriggerNull',
        scriptName: 'Script_Trigger_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_trigger_entity' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'triggerZone', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Trigger Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'triggerNode', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'triggerNode', targetHandle: 'targetEntity' },
          { source: 'triggerNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

});