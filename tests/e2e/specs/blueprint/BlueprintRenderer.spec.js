import { test } from '../../fixtures.js';

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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setSprite', 
            type: 'setSprite', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Source Width'],
          },
          { 
            id: 'getSprite', 
            type: 'getSprite', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Source Width'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setSprite', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setSprite', targetHandle: 'targetEntity' },
          { source: 'varWidth', sourceHandle: 'value', target: 'setSprite', targetHandle: 'sourceWidth' },
          { source: 'setSprite', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getSprite', targetHandle: 'targetEntity' },
          { source: 'getSprite', sourceHandle: 'sourceWidth', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 250,
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist in setSprite', async ({ 
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setSprite', 
            type: 'setSprite', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Source Width'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Sprite Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setSprite', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setSprite', targetHandle: 'targetEntity' },
          { source: 'varVal', sourceHandle: 'value', target: 'setSprite', targetHandle: 'sourceWidth' },
          { source: 'setSprite', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varContent', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setText', 
            type: 'setText', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Content'],
          },
          { 
            id: 'getText', 
            type: 'getText', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Content'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varContent', varName: 'newContent' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setText', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setText', targetHandle: 'targetEntity' },
          { source: 'varContent', sourceHandle: 'value', target: 'setText', targetHandle: 'value' },
          { source: 'setText', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getText', targetHandle: 'targetEntity' },
          { source: 'getText', sourceHandle: 'value', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Lupis Engine Rocks',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist in setText', async ({ 
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setText', 
            type: 'setText', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Content'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Text Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valText' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setText', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setText', targetHandle: 'targetEntity' },
          { source: 'varVal', sourceHandle: 'value', target: 'setText', targetHandle: 'value' },
          { source: 'setText', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setShape', 
            type: 'setShape', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width'],
          },
          { 
            id: 'getShape', 
            type: 'getShape', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Width'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setShape', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setShape', targetHandle: 'targetEntity' },
          { source: 'varWidth', sourceHandle: 'value', target: 'setShape', targetHandle: 'width' },
          { source: 'setShape', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getShape', targetHandle: 'targetEntity' },
          { source: 'getShape', sourceHandle: 'width', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 180,
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist in setShape', async ({ 
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setShape', 
            type: 'setShape', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Shape Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setShape', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setShape', targetHandle: 'targetEntity' },
          { source: 'varVal', sourceHandle: 'value', target: 'setShape', targetHandle: 'width' },
          { source: 'setShape', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varWidth', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setTilemap', 
            type: 'setTilemap', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Map Width (Grid)'],
          },
          { 
            id: 'getTilemap', 
            type: 'getTilemap', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Map Width (Grid)'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varWidth', varName: 'newWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTilemap', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTilemap', targetHandle: 'targetEntity' },
          { source: 'varWidth', sourceHandle: 'value', target: 'setTilemap', targetHandle: 'width' },
          { source: 'setTilemap', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getTilemap', targetHandle: 'targetEntity' },
          { source: 'getTilemap', sourceHandle: 'width', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 32,
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist in setTilemap', async ({ 
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setTilemap', 
            type: 'setTilemap', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Map Width (Grid)'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Tilemap Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVal', varName: 'valWidth' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTilemap', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTilemap', targetHandle: 'targetEntity' },
          { source: 'varVal', sourceHandle: 'value', target: 'setTilemap', targetHandle: 'width' },
          { source: 'setTilemap', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
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
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'batchNode', type: 'batchSet', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Batch Set Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'batchNode', targetHandle: 'execIn' },
          { source: 'batchNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Batch Set Executed',
      });
    });
  });

});