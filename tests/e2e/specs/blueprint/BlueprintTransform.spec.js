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
  // 1. GET TRANSFORM NODE TESTS
  // =========================================================================
  test.describe('1. GET TRANSFORM NODE', () => {

    test('Reads basic Transform properties on World Entity (Position, Rotation, Scale)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'getTransform', 
            type: 'get_transform', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 150,
      });
    });

    test('Reads UITransform properties on UI Entity (Fallback chain: UITransform || Transform)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'getTransform', 
            type: 'get_transform', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Pivot X'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getTransform', sourceHandle: 'pivotX', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getTransform', type: 'get_transform', pos: { x: 350, y: 200 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Get Transform Guard Passed', type: 'string' } }
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Get Transform Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. SET TRANSFORM NODE TESTS
  // =========================================================================
  test.describe('2. SET TRANSFORM NODE', () => {

    test('Modifies coordinates of World Entity (Position X and Y)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varX', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'varY', type: 'variable_get', pos: { x: 100, y: 400 } },
          { 
            id: 'setTransform', 
            type: 'set_transform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X', 'Position Y'],
          },
          { 
            id: 'getTransform', 
            type: 'get_transform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varX', varName: 'newX' },
          { nodeId: 'varY', varName: 'newY' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'target_in' },
          { source: 'varX', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'x' },
          { source: 'varY', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'y' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 300,
      });
    });

    test('Modifies dimensions of UI Entity (Width and Height)', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varW', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'varH', type: 'variable_get', pos: { x: 100, y: 400 } },
          { 
            id: 'setTransform', 
            type: 'set_transform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Width', 'Height'],
          },
          { 
            id: 'getTransform', 
            type: 'get_transform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Width'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varW', varName: 'newWidth' },
          { nodeId: 'varH', varName: 'newHeight' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'target_in' },
          { source: 'varW', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'width' },
          { source: 'varH', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'height' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'getTransform', sourceHandle: 'width', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varEmpty', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setTransform', 
            type: 'set_transform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X'],
          },
          { 
            id: 'getTransform', 
            type: 'get_transform', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Position X'],
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varEmpty', varName: 'emptyStr' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'target_in' },
          { source: 'varEmpty', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'x' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getTransform', targetHandle: 'target_in' },
          { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 100,
      });
    });

    test('Non-existent target entity executes Out pin safely', async ({ 
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varX', type: 'variable_get', pos: { x: 100, y: 300 } },
          { 
            id: 'setTransform', 
            type: 'set_transform', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Position X'],
          },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Set Transform Null Target Safe Executed', type: 'string' } }
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varX', varName: 'valX' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'target_in' },
          { source: 'varX', sourceHandle: 'out_0', target: 'setTransform', targetHandle: 'x' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Set Transform Null Target Safe Executed',
      });
    });
  });
});