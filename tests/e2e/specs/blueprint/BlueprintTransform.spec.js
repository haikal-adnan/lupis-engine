// lokasi: tests/e2e/blueprint/BlueprintTransform.spec.js
import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Transform E2E',
    description: 'E2E runtime logic evaluation for Transform operations (Get Transform, Set Transform, World & UI entities) in engine preview',
  },
});

test.describe('Blueprint Transform (game_transform) E2E Testing', () => {

  // =========================================================================
  // GET TRANSFORM NODE TESTS
  // =========================================================================
  test.describe('Get transform node', () => {

    test('Reads basic transform properties on world entity (Position, Rotation, Scale)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const worldEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await worldEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'WorldEntity_Transform', scriptId: 'World_Entity_ID' });
      await inspectorCrud.setupTransform(150, 250);

      await blueprintRunner.runTest({
        testName: 'Get Transform - World Entity Position',
        entityName: 'WorldEntity_Transform',
        scriptName: 'Script_GetTransform_World',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getTransform', 
            type: 'getTransform', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 150,
      });
    });

    test('Reads UI transform properties on UI entity (Fallback chain: UITransform || Transform)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      popup 
    }) => {
      await hierarchy.addLayerToSection(popup, 'User Interface', 'UI Layer');
      const uiLayer = hierarchy.nodeByName('UI Layer');
      const uiEntity = await hierarchyCrud.entity.create(uiLayer, 'ui_empty');
      await uiEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'UIEntity_Transform', scriptId: 'UI_Entity_ID' });

      await blueprintRunner.runTest({
        testName: 'Get Transform - UI Entity Properties',
        entityName: 'UIEntity_Transform',
        scriptName: 'Script_GetTransform_UI',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getTransform', 
            type: 'getTransform', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Pivot X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getTransform', sourceHandle: 'pivotX', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 0.5,
      });
    });

    test('Handles non-existent target entity safely (null target guard)', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Transform - Null Target Guard',
        entityName: 'MainEntity',
        scriptName: 'Script_GetTransform_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_entity_id' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'getTransform', type: 'getTransform', pos: { x: 350, y: 200 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Get Transform Guard Passed', type: 'string' } }
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Get Transform Guard Passed',
      });
    });
  });

  // =========================================================================
  // SET TRANSFORM NODE TESTS
  // =========================================================================
  test.describe('Set transform node', () => {

    test('Modifies coordinates of world entity (Position X and Y)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const worldEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await worldEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'MoverEntity', scriptId: 'Mover_Entity_ID' });
      await inspectorCrud.setupTransform(0, 0);

      await blueprintRunner.runTest({
        testName: 'Set Transform - Modify World Transform',
        entityName: 'MoverEntity',
        scriptName: 'Script_SetTransform_World',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newX', type: 'number', value: 300 },
          { name: 'newY', type: 'number', value: 450 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varX', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varY', type: 'variableGet', pos: { x: 100, y: 400 } },
          { 
            id: 'setTransform', 
            type: 'setTransform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X', 'Position Y'],
          },
          { 
            id: 'getTransform', 
            type: 'getTransform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varX', varName: 'newX' },
          { nodeId: 'varY', varName: 'newY' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTransform', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTransform', targetHandle: 'targetEntity' },
          { source: 'varX', sourceHandle: 'value', target: 'setTransform', targetHandle: 'x' },
          { source: 'varY', sourceHandle: 'value', target: 'setTransform', targetHandle: 'y' },
          { source: 'setTransform', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 300,
      });
    });

    test('Modifies dimensions of UI entity (Width and Height)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      popup 
    }) => {
      await hierarchy.addLayerToSection(popup, 'User Interface', 'UI Layer');
      const uiLayer = hierarchy.nodeByName('UI Layer');
      const uiEntity = await hierarchyCrud.entity.create(uiLayer, 'ui_empty');
      await uiEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'UIBoxEntity', scriptId: 'UIBox_Entity_ID' });

      await blueprintRunner.runTest({
        testName: 'Set Transform - Modify UI Transform',
        entityName: 'UIBoxEntity',
        scriptName: 'Script_SetTransform_UI',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newWidth', type: 'number', value: 800 },
          { name: 'newHeight', type: 'number', value: 600 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varW', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varH', type: 'variableGet', pos: { x: 100, y: 400 } },
          { 
            id: 'setTransform', 
            type: 'setTransform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width', 'Height'],
          },
          { 
            id: 'getTransform', 
            type: 'getTransform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Width'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varW', varName: 'newWidth' },
          { nodeId: 'varH', varName: 'newHeight' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTransform', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTransform', targetHandle: 'targetEntity' },
          { source: 'varW', sourceHandle: 'value', target: 'setTransform', targetHandle: 'width' },
          { source: 'varH', sourceHandle: 'value', target: 'setTransform', targetHandle: 'height' },
          { source: 'setTransform', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'getTransform', sourceHandle: 'width', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 800,
      });
    });

    test('Ignores empty string and undefined inputs without overwriting original values', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const worldEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await worldEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SafeEntity', scriptId: 'Safe_Entity_ID' });
      await inspectorCrud.setupTransform(100, 200);

      await blueprintRunner.runTest({
        testName: 'Set Transform - Ignore Invalid Inputs Guard',
        entityName: 'SafeEntity',
        scriptName: 'Script_SetTransform_IgnoreInvalid',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'emptyStr', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varEmpty', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setTransform', 
            type: 'setTransform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X'],
          },
          { 
            id: 'getTransform', 
            type: 'getTransform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varEmpty', varName: 'emptyStr' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTransform', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTransform', targetHandle: 'targetEntity' },
          { source: 'varEmpty', sourceHandle: 'value', target: 'setTransform', targetHandle: 'x' },
          { source: 'setTransform', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 100,
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Transform - Non Existent Target Execution Out',
        entityName: 'ControlEntity',
        scriptName: 'Script_SetTransform_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'non_existent_id' },
          { name: 'valX', type: 'number', value: 999 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varX', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setTransform', 
            type: 'setTransform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Transform Null Target Safe Executed', type: 'string' } }
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varX', varName: 'valX' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setTransform', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setTransform', targetHandle: 'targetEntity' },
          { source: 'varX', sourceHandle: 'value', target: 'setTransform', targetHandle: 'x' },
          { source: 'setTransform', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });
});