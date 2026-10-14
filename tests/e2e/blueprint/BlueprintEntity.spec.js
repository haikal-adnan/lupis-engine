import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Entity E2E',
    description: 'E2E runtime logic evaluation for Entity Management nodes (spawn, destroy, destroy_with_parent, clone, get_children, get_parent) in engine preview',
  },
});

test.describe('Blueprint Entity Management (game_entity) E2E Testing', () => {

  // =========================================================================
  // 1. SPAWN PREFAB NODE (entity_spawn)
  // =========================================================================
  test.describe('Spawn Prefab Node', () => {

    test('Spawns prefab entity and triggers execution out', async ({ 
      blueprintRunner, 
      prefabCrud 
    }) => {
      // Buat prefab kosong dengan nama bawaan engine ('New_Prefab')
      await prefabCrud.createEmptyPrefab('New_Prefab', 'world');

      await blueprintRunner.runTest({
        testName: 'Spawn Prefab - Success Execution',
        entityName: 'SpawnerEntity',
        scriptName: 'Script_SpawnPrefab_Success',
        variables: [
          { name: 'prefabName', type: 'string', value: 'New_Prefab' },
          { name: 'posX', type: 'number', value: 100 },
          { name: 'posY', type: 'number', value: 200 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varPrefab', type: 'variable_get', pos: { x: 100, y: 220 } },
          { id: 'varX', type: 'variable_get', pos: { x: 100, y: 320 } },
          { id: 'varY', type: 'variable_get', pos: { x: 100, y: 420 } },
          { id: 'spawnNode', type: 'entity_spawn', pos: { x: 380, y: 150 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 680, y: 100 },
            inspectorValues: { in_msg: { value: 'Spawn Executed Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varPrefab', varName: 'prefabName' },
          { nodeId: 'varX', varName: 'posX' },
          { nodeId: 'varY', varName: 'posY' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'spawnNode', targetHandle: 'exec_in' },
          { source: 'varPrefab', sourceHandle: 'out_0', target: 'spawnNode', targetHandle: 'prefab' },
          { source: 'varX', sourceHandle: 'out_0', target: 'spawnNode', targetHandle: 'pos_x' },
          { source: 'varY', sourceHandle: 'out_0', target: 'spawnNode', targetHandle: 'pos_y' },
          { source: 'spawnNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Spawn Executed Successfully',
      });
    });

    test('Handles non-existent prefab safely without crashing preview', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Spawn Prefab - Missing Prefab Guard',
        entityName: 'SpawnerEntity',
        scriptName: 'Script_SpawnPrefab_Missing',
        variables: [
          { name: 'missingPrefab', type: 'string', value: 'Non_Existent_Prefab_404' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varPrefab', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'spawnNode', type: 'entity_spawn', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Missing Prefab Safe Executed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varPrefab', varName: 'missingPrefab' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'spawnNode', targetHandle: 'exec_in' },
          { source: 'varPrefab', sourceHandle: 'out_0', target: 'spawnNode', targetHandle: 'prefab' },
          { source: 'spawnNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Missing Prefab Safe Executed',
      });
    });
  });

  // =========================================================================
  // 2. DESTROY ENTITY NODE (entity_destroy)
  // =========================================================================
  test.describe('Destroy Entity Node', () => {

    test('Destroys target external entity safely and triggers execution out', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      // Buat entitas target yang akan dihancurkan agar script runner tidak terputus
      const worldLayer = hierarchy.nodeByName('World Layer');
      const victim = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await victim.click();
      await inspectorCrud.configureObjectMetaData({ name: 'TargetVictim', scriptId: 'Victim_Entity_ID' });

      await blueprintRunner.runTest({
        testName: 'Destroy Entity - Target External Entity',
        entityName: 'ExecutionRunner',
        scriptName: 'Script_Destroy_External',
        variables: [
          { name: 'targetEntity', type: 'string', value: 'Victim_Entity_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'destroyNode', type: 'entity_destroy', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Entity Destroyed Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'destroyNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'destroyNode', targetHandle: 'entity' },
          { source: 'destroyNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Entity Destroyed Successfully',
      });
    });

    test('Handles non-existent target entity safely (null guard)', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Destroy Entity - Null Target Guard',
        entityName: 'ControllerEntity',
        scriptName: 'Script_Destroy_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'unknown_entity_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'destroyNode', type: 'entity_destroy', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Safe Destroy Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'destroyNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'destroyNode', targetHandle: 'entity' },
          { source: 'destroyNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Safe Destroy Guard Passed',
      });
    });
  });

  // =========================================================================
  // 3. DESTROY WITH PARENT NODE (entity_destroy_with_parent)
  // =========================================================================
  test.describe('Destroy With Parent Node', () => {

    test('Destroys parent entity when child entity is targeted', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      
      const parentNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await parentNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'GroupParent', scriptId: 'Group_Parent_ID' });

      const childNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await childNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'GroupChild', scriptId: 'Group_Child_ID' });

      await hierarchyCrud.entity.reparent(childNode, parentNode);

      // Entitas runner terpisah agar tidak ikut terhapus saat Parent dihapus
      await blueprintRunner.runTest({
        testName: 'Destroy With Parent - Parent Target Cascade',
        entityName: 'ExecutionRunner',
        scriptName: 'Script_DestroyWithParent_Runner',
        variables: [
          { name: 'targetChild', type: 'string', value: 'Group_Child_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'destroyWithParent', type: 'entity_destroy_with_parent', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Parent Cascade Destroyed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetChild' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'destroyWithParent', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'destroyWithParent', targetHandle: 'entity' },
          { source: 'destroyWithParent', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Parent Cascade Destroyed',
      });
    });

    test('Destroys lone target entity safely when target entity has no parent', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const loneTarget = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await loneTarget.click();
      await inspectorCrud.configureObjectMetaData({ name: 'LoneVictim', scriptId: 'Lone_Victim_ID' });

      await blueprintRunner.runTest({
        testName: 'Destroy With Parent - Fallback Single Entity',
        entityName: 'ExecutionRunner',
        scriptName: 'Script_DestroyWithParent_NoParent',
        variables: [
          { name: 'targetEntity', type: 'string', value: 'Lone_Victim_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'destroyWithParent', type: 'entity_destroy_with_parent', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Fallback Destroy Executed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'destroyWithParent', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'destroyWithParent', targetHandle: 'entity' },
          { source: 'destroyWithParent', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Fallback Destroy Executed',
      });
    });
  });

  // =========================================================================
  // 4. CLONE ENTITY NODE (entity_clone)
  // =========================================================================
  test.describe('Clone Entity Node', () => {

    test('Clones target external entity safely and triggers execution out', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      // Buat entitas target eksternal tanpa script untuk menghindari loop cloning tak terbatas
      const worldLayer = hierarchy.nodeByName('World Layer');
      const source = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await source.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SourceEntity', scriptId: 'Source_Entity_ID' });

      await blueprintRunner.runTest({
        testName: 'Clone Entity - Target External Entity',
        entityName: 'ExecutionRunner',
        scriptName: 'Script_Clone_External',
        variables: [
          { name: 'sourceEntity', type: 'string', value: 'Source_Entity_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varSource', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'cloneNode', type: 'entity_clone', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Clone Executed Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varSource', varName: 'sourceEntity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'cloneNode', targetHandle: 'exec_in' },
          { source: 'varSource', sourceHandle: 'out_0', target: 'cloneNode', targetHandle: 'entity' },
          { source: 'cloneNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Clone Executed Successfully',
      });
    });

    test('Handles non-existent source entity safely (null guard)', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Clone Entity - Null Source Guard',
        entityName: 'OriginalEntity',
        scriptName: 'Script_Clone_NullSource',
        variables: [
          { name: 'invalidSource', type: 'string', value: 'missing_source_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varSource', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'cloneNode', type: 'entity_clone', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Clone Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varSource', varName: 'invalidSource' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'cloneNode', targetHandle: 'exec_in' },
          { source: 'varSource', sourceHandle: 'out_0', target: 'cloneNode', targetHandle: 'entity' },
          { source: 'cloneNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Clone Null Guard Passed',
      });
    });
  });

  // =========================================================================
  // 5. GET ENTITY CHILDREN NODE (entity_get_children)
  // =========================================================================
  test.describe('Get Entity Children Node', () => {

    test('Retrieves specific child ID by index from parent entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      const parentNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await parentNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'RootContainer', scriptId: 'Root_Container_ID' });

      const childNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await childNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SubItem_0', scriptId: 'Child_SubItem_0_ID' });

      await hierarchyCrud.entity.reparent(childNode, parentNode);

      await blueprintRunner.runTest({
        testName: 'Get Children - Specific Index Child ID',
        entityName: 'RootContainer',
        scriptName: 'Script_GetChildren_SpecificIndex',
        variables: [
          { name: 'parentTarget', type: 'string', value: 'self' },
          { name: 'childIdx', type: 'number', value: 0 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varParent', type: 'variable_get', pos: { x: 100, y: 220 } },
          { id: 'varIndex', type: 'variable_get', pos: { x: 100, y: 320 } },
          { id: 'getChildrenNode', type: 'entity_get_children', pos: { x: 380, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 680, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varParent', varName: 'parentTarget' },
          { nodeId: 'varIndex', varName: 'childIdx' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'getChildrenNode', targetHandle: 'exec_in' },
          { source: 'varParent', sourceHandle: 'out_0', target: 'getChildrenNode', targetHandle: 'parent' },
          { source: 'varIndex', sourceHandle: 'out_0', target: 'getChildrenNode', targetHandle: 'index' },
          { source: 'getChildrenNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getChildrenNode', sourceHandle: 'child_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Child_SubItem_0_ID',
      });
    });

    test('Handles entity without children safely and triggers execution out', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Children - Empty Children Guard',
        entityName: 'EmptyParentEntity',
        scriptName: 'Script_GetChildren_Empty',
        variables: [
          { name: 'parentTarget', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varParent', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getChildrenNode', type: 'entity_get_children', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Empty Children Handled', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varParent', varName: 'parentTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'getChildrenNode', targetHandle: 'exec_in' },
          { source: 'varParent', sourceHandle: 'out_0', target: 'getChildrenNode', targetHandle: 'parent' },
          { source: 'getChildrenNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Empty Children Handled',
      });
    });
  });

  // =========================================================================
  // 6. GET ENTITY PARENT NODE (entity_get_parent)
  // =========================================================================
  test.describe('Get Entity Parent Node', () => {

    test('Retrieves parent script ID from child entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      const parentNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await parentNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'HeaderParent', scriptId: 'Parent_Header_ID' });

      const childNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await childNode.click();
      await inspectorCrud.configureObjectMetaData({ name: 'LeafChild', scriptId: 'Child_Leaf_ID' });

      await hierarchyCrud.entity.reparent(childNode, parentNode);

      await blueprintRunner.runTest({
        testName: 'Get Parent - Valid Parent ID Match',
        entityName: 'LeafChild',
        scriptName: 'Script_GetParent_Valid',
        variables: [
          { name: 'childTarget', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varChild', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getParentNode', type: 'entity_get_parent', pos: { x: 350, y: 150 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varChild', varName: 'childTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'getParentNode', targetHandle: 'exec_in' },
          { source: 'varChild', sourceHandle: 'out_0', target: 'getParentNode', targetHandle: 'entity' },
          { source: 'getParentNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getParentNode', sourceHandle: 'parent_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Parent_Header_ID',
      });
    });

    test('Handles entity without parent safely and triggers execution out', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Parent - No Parent Safe Executed',
        entityName: 'RootLevelEntity',
        scriptName: 'Script_GetParent_RootEntity',
        variables: [
          { name: 'targetEntity', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getParentNode', type: 'entity_get_parent', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'No Parent Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntity' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'getParentNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getParentNode', targetHandle: 'entity' },
          { source: 'getParentNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'No Parent Guard Passed',
      });
    });
  });

});