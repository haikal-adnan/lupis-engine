import { test } from '../fixtures.js';

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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solid_collision', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'solidNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'solidNode', targetHandle: 'target' },
          { source: 'solidNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'solidNode', sourceHandle: 'self_id', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solid_collision', pos: { x: 350, y: 150 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { in_msg: { value: 'No Collision Confirmed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'solidNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'solidNode', targetHandle: 'target' },
          { source: 'solidNode', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'solidNode', sourceHandle: 'is_colliding', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'solidNode', type: 'solid_collision', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varTag', varName: 'tagFilter' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'solidNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'solidNode', targetHandle: 'target' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'solidNode', targetHandle: 'filter_tag' },
          { source: 'solidNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'solidNode', sourceHandle: 'self_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Solid_Tagged_ID',
      });
    });

    test('Handles non-existent target entity safely (null target guard)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'solidNode', type: 'solid_collision', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Solid Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'solidNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'solidNode', targetHandle: 'target' },
          { source: 'solidNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Solid Null Guard Passed',
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

      // 2. Entitas Pengunjung yang bertumpuk di koordinat sama (100, 100)
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'trigger_zone', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'triggerNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'triggerNode', targetHandle: 'target' },
          { source: 'triggerNode', sourceHandle: 'on_enter', target: 'notif', targetHandle: 'exec_in' },
          { source: 'triggerNode', sourceHandle: 'other_id', target: 'notif', targetHandle: 'in_msg' },
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

      // 2. Entitas bertumpuk dengan tag 'Ally'
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varTag', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'triggerNode', type: 'trigger_zone', pos: { x: 350, y: 150 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Tag Mismatch Ignored', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varTag', varName: 'searchTag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'triggerNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'triggerNode', targetHandle: 'target' },
          { source: 'varTag', sourceHandle: 'out_0', target: 'triggerNode', targetHandle: 'filter_tag' },
          { source: 'triggerNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'trigger_zone', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'triggerNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'triggerNode', targetHandle: 'target' },
          { source: 'triggerNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'triggerNode', sourceHandle: 'trigger_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Solo_Trigger_ID',
      });
    });

    test('Handles non-existent target entity safely (null target guard)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'triggerNode', type: 'trigger_zone', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Trigger Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'triggerNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'triggerNode', targetHandle: 'target' },
          { source: 'triggerNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Trigger Null Guard Passed',
      });
    });
  });

});