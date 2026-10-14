import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Renderer E2E',
    description: 'E2E runtime logic evaluation for Renderer nodes (Sprite, Text, Shape, Tilemap, Batch Set) in engine preview',
  },
});

test.describe('Blueprint Renderer (game_renderer) E2E Testing', () => {

  // =========================================================================
  // 1. SPRITE RENDERER TESTS (get_sprite, set_sprite)
  // =========================================================================
  test.describe('Sprite Renderer Nodes', () => {

    test('Modifies and reads sprite source dimensions (Source Width)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
      await spriteEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SpriteTester', scriptId: 'Sprite_Tester_ID' });

      await blueprintRunner.runTest({
        testName: 'Sprite - Modify and Read Source Width',
        entityName: 'SpriteTester',
        scriptName: 'Script_Sprite_Dimensions',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newWidth', type: 'number', value: 250 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setSprite', 
            type: 'set_sprite', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Source Width'],
          },
          { 
            id: 'getSprite', 
            type: 'get_sprite', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Source Width'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setSprite', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setSprite', targetHandle: 'target' },
          { source: 'varWidth', sourceHandle: 'out_0', target: 'setSprite', targetHandle: 'sourceWidth' },
          { source: 'setSprite', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getSprite', targetHandle: 'target' },
          { source: 'getSprite', sourceHandle: 'sourceWidth', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 250,
      });
    });

    test('Handles non-existent target entity safely in set_sprite (null guard)', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Sprite - Null Target Guard',
        entityName: 'ControlEntity_SpriteNull',
        scriptName: 'Script_SetSprite_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_sprite_entity' },
          { name: 'valWidth', type: 'number', value: 128 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setSprite', 
            type: 'set_sprite', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Source Width'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Sprite Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setSprite', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setSprite', targetHandle: 'target' },
          { source: 'varVal', sourceHandle: 'out_0', target: 'setSprite', targetHandle: 'sourceWidth' },
          { source: 'setSprite', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Sprite Null Safe Out',
      });
    });
  });

  // =========================================================================
  // 2. TEXT RENDERER TESTS (get_text, set_text)
  // =========================================================================
  test.describe('Text Renderer Nodes', () => {

    test('Modifies and reads text content string on Text Entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const textEntity = await hierarchyCrud.entity.create(worldLayer, 'text');
      await textEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'TextTester', scriptId: 'Text_Tester_ID' });

      await blueprintRunner.runTest({
        testName: 'Text - Modify and Read Content',
        entityName: 'TextTester',
        scriptName: 'Script_Text_Content',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newContent', type: 'string', value: 'Lupis Engine Rocks' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varContent', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setText', 
            type: 'set_text', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Content'],
          },
          { 
            id: 'getText', 
            type: 'get_text', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Content'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varContent', varName: 'newContent' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setText', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setText', targetHandle: 'target' },
          { source: 'varContent', sourceHandle: 'out_0', target: 'setText', targetHandle: 'value' },
          { source: 'setText', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getText', targetHandle: 'target' },
          { source: 'getText', sourceHandle: 'value', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Lupis Engine Rocks',
      });
    });

    test('Handles non-existent target entity safely in set_text (null guard)', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Text - Null Target Guard',
        entityName: 'ControlEntity_TextNull',
        scriptName: 'Script_SetText_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_text_entity' },
          { name: 'valText', type: 'string', value: 'Fallback' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setText', 
            type: 'set_text', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Content'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Text Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valText' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setText', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setText', targetHandle: 'target' },
          { source: 'varVal', sourceHandle: 'out_0', target: 'setText', targetHandle: 'value' },
          { source: 'setText', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Text Null Safe Out',
      });
    });
  });

  // =========================================================================
  // 3. SHAPE RENDERER TESTS (get_shape, set_shape)
  // =========================================================================
  test.describe('Shape Renderer Nodes', () => {

    test('Modifies and reads shape dimension (Width) on Shape Entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const shapeEntity = await hierarchyCrud.entity.create(worldLayer, 'shape');
      await shapeEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'ShapeTester', scriptId: 'Shape_Tester_ID' });

      await blueprintRunner.runTest({
        testName: 'Shape - Modify and Read Width',
        entityName: 'ShapeTester',
        scriptName: 'Script_Shape_Width',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newWidth', type: 'number', value: 180 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setShape', 
            type: 'set_shape', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width'],
          },
          { 
            id: 'getShape', 
            type: 'get_shape', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Width'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setShape', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setShape', targetHandle: 'target' },
          { source: 'varWidth', sourceHandle: 'out_0', target: 'setShape', targetHandle: 'width' },
          { source: 'setShape', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getShape', targetHandle: 'target' },
          { source: 'getShape', sourceHandle: 'width', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 180,
      });
    });

    test('Handles non-existent target entity safely in set_shape (null guard)', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Shape - Null Target Guard',
        entityName: 'ControlEntity_ShapeNull',
        scriptName: 'Script_SetShape_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_shape_entity' },
          { name: 'valWidth', type: 'number', value: 90 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setShape', 
            type: 'set_shape', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Shape Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setShape', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setShape', targetHandle: 'target' },
          { source: 'varVal', sourceHandle: 'out_0', target: 'setShape', targetHandle: 'width' },
          { source: 'setShape', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Shape Null Safe Out',
      });
    });
  });

  // =========================================================================
  // 4. TILEMAP RENDERER TESTS (get_tilemap, set_tilemap)
  // =========================================================================
  test.describe('Tilemap Renderer Nodes', () => {

    test('Modifies and reads grid dimensions (Map Width) on Tilemap Entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const tilemapEntity = await hierarchyCrud.entity.create(worldLayer, 'tilemap');
      await tilemapEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'TilemapTester', scriptId: 'Tilemap_Tester_ID' });

      await blueprintRunner.runTest({
        testName: 'Tilemap - Modify and Read Map Width',
        entityName: 'TilemapTester',
        scriptName: 'Script_Tilemap_Width',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newWidth', type: 'number', value: 32 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setTilemap', 
            type: 'set_tilemap', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Map Width (Grid)'],
          },
          { 
            id: 'getTilemap', 
            type: 'get_tilemap', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Map Width (Grid)'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTilemap', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTilemap', targetHandle: 'target' },
          { source: 'varWidth', sourceHandle: 'out_0', target: 'setTilemap', targetHandle: 'width' },
          { source: 'setTilemap', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTilemap', targetHandle: 'target' },
          { source: 'getTilemap', sourceHandle: 'width', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 32,
      });
    });

    test('Handles non-existent target entity safely in set_tilemap (null guard)', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Tilemap - Null Target Guard',
        entityName: 'ControlEntity_TilemapNull',
        scriptName: 'Script_SetTilemap_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_tilemap_entity' },
          { name: 'valWidth', type: 'number', value: 16 },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setTilemap', 
            type: 'set_tilemap', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Map Width (Grid)'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Tilemap Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTilemap', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTilemap', targetHandle: 'target' },
          { source: 'varVal', sourceHandle: 'out_0', target: 'setTilemap', targetHandle: 'width' },
          { source: 'setTilemap', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Tilemap Null Safe Out',
      });
    });
  });

  // =========================================================================
  // 5. BATCH SET PROPERTIES TESTS (batch_set)
  // =========================================================================
  test.describe('Batch Set Properties Node', () => {

    test('Executes Out pin safely with default empty steps configuration', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Batch Set - Safe Out Execution',
        entityName: 'BatchTesterEntity',
        scriptName: 'Script_BatchSet_SafeOut',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'batchNode', type: 'batch_set', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Batch Set Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'batchNode', targetHandle: 'exec_in' },
          { source: 'batchNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Batch Set Executed',
      });
    });
  });

});