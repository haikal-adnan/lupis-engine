import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Physics E2E',
    description: 'E2E runtime logic evaluation for Physics System nodes (getPhysics, setPhysics, setFaceDirection, moveAndSlide) in engine preview',
  },
});

test.describe('Blueprint Physics System E2E Testing', () => {

  // =========================================================================
  // 1. GET_PHYSICS NODE TESTS
  // =========================================================================
  test.describe('Get physics node', () => {

    test('Reads initial physics properties (Mass) from target entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysEntity_Mass', scriptId: 'Phys_Entity_Mass_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 3.5, 1.0);

      await blueprintRunner.runTest({
        testName: 'Get Physics - Read Mass',
        entityName: 'PhysEntity_Mass',
        scriptName: 'Script_GetPhysics_Mass',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Mass'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getPhysics', sourceHandle: 'mass', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 3.5,
      });
    });

    test('Reads default facing direction property (right) from physics entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysEntity_Facing', scriptId: 'Phys_Entity_Facing_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Get Physics - Read Default Facing Direction',
        entityName: 'PhysEntity_Facing',
        scriptName: 'Script_GetPhysics_Facing',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Facing Direction'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getPhysics', sourceHandle: 'facingDirection', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'right',
      });
    });

    test('Handles non-existent target entity safely (null target guard)', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Get Physics - Null Target Guard',
        entityName: 'ControlEntity_NullTarget',
        scriptName: 'Script_GetPhysics_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'non_existent_physics_id' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Mass'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Get Physics Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Get Physics Null Guard Passed',
      });
    });

    test('Handles entity without physics component safely', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const plainEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await plainEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PlainEntity_NoPhys', scriptId: 'Plain_No_Phys_ID' });

      await blueprintRunner.runTest({
        testName: 'Get Physics - Missing Physics Component Guard',
        entityName: 'PlainEntity_NoPhys',
        scriptName: 'Script_GetPhysics_MissingComp',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 350, y: 200 },
            dynamicOutputs: ['Mass'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Missing Component Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Missing Component Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. SET_PHYSICS NODE TESTS
  // =========================================================================
  test.describe('Set physics node', () => {

    test('Modifies physics properties (Mass and Drag) on valid target entity', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysEntity_Modifier', scriptId: 'Phys_Modifier_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Set Physics - Modify Mass and Drag',
        entityName: 'PhysEntity_Modifier',
        scriptName: 'Script_SetPhysics_MassDrag',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'newMass', type: 'number', value: 8 },
          { name: 'newDrag', type: 'number', value: 2 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varMass', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varDrag', type: 'variableGet', pos: { x: 100, y: 400 } },
          { 
            id: 'setPhysics', 
            type: 'setPhysics', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Mass', 'Drag'],
          },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Mass'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varMass', varName: 'newMass' },
          { nodeId: 'varDrag', varName: 'newDrag' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
          { source: 'varMass', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'mass' },
          { source: 'varDrag', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'drag' },
          { source: 'setPhysics', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'mass', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 8,
      });
    });

    test('Modifies velocity coordinates (Velocity X and Velocity Y)', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysEntity_Velocity', scriptId: 'Phys_Velocity_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Set Physics - Modify Velocity Coordinates',
        entityName: 'PhysEntity_Velocity',
        scriptName: 'Script_SetPhysics_Vel',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'velX', type: 'number', value: 120 },
          { name: 'velY', type: 'number', value: -75 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVelX', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varVelY', type: 'variableGet', pos: { x: 100, y: 400 } },
          { 
            id: 'setPhysics', 
            type: 'setPhysics', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Velocity X', 'Velocity Y'],
          },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Velocity X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varVelX', varName: 'velX' },
          { nodeId: 'varVelY', varName: 'velY' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
          { source: 'varVelX', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'velocityX' },
          { source: 'varVelY', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'velocityY' },
          { source: 'setPhysics', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'velocityX', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 120,
      });
    });

    test('Ignores empty string inputs without overwriting original properties', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysEntity_Safe', scriptId: 'Phys_Safe_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 5.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Set Physics - Ignore Empty String Inputs',
        entityName: 'PhysEntity_Safe',
        scriptName: 'Script_SetPhysics_IgnoreEmpty',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'emptyMass', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varEmpty', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setPhysics', 
            type: 'setPhysics', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Mass'],
          },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Mass'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varEmpty', varName: 'emptyMass' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
          { source: 'varEmpty', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'mass' },
          { source: 'setPhysics', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'mass', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 5,
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Physics - Non Existent Target Execution Out',
        entityName: 'ControlEntity_SetNull',
        scriptName: 'Script_SetPhysics_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_phys_target_id' },
          { name: 'valMass', type: 'number', value: 99 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varMass', type: 'variableGet', pos: { x: 100, y: 300 } },
          { 
            id: 'setPhysics', 
            type: 'setPhysics', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Mass'],
          },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Set Physics Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varMass', varName: 'valMass' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
          { source: 'varMass', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'mass' },
          { source: 'setPhysics', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

  // =========================================================================
  // 3. SET_FACE_DIRECTION NODE TESTS
  // =========================================================================
  test.describe('Set face direction node', () => {

    test('Updates facing direction to left using horizontal mode', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Facer_Horizontal', scriptId: 'Facer_H_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Set Face Direction - Horizontal Left',
        entityName: 'Facer_Horizontal',
        scriptName: 'Script_SetFace_Horizontal',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'axisX', type: 'number', value: -1 },
          { name: 'axisY', type: 'number', value: 0 },
          { name: 'modeStr', type: 'string', value: 'horizontal' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varAxisX', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varAxisY', type: 'variableGet', pos: { x: 100, y: 400 } },
          { id: 'varMode', type: 'variableGet', pos: { x: 100, y: 500 } },
          { id: 'setFace', type: 'setFaceDirection', pos: { x: 350, y: 100 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Facing Direction'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varAxisX', varName: 'axisX' },
          { nodeId: 'varAxisY', varName: 'axisY' },
          { nodeId: 'varMode', varName: 'modeStr' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setFace', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setFace', targetHandle: 'targetEntity' },
          { source: 'varAxisX', sourceHandle: 'value', target: 'setFace', targetHandle: 'axisX' },
          { source: 'varAxisY', sourceHandle: 'value', target: 'setFace', targetHandle: 'axisY' },
          { source: 'varMode', sourceHandle: 'value', target: 'setFace', targetHandle: 'mode' },
          { source: 'setFace', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'facingDirection', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'left',
      });
    });

    test('Updates facing direction to down-right using 8-direction mode', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'Facer_8Way', scriptId: 'Facer_8Way_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Set Face Direction - 8-Way Down-Right',
        entityName: 'Facer_8Way',
        scriptName: 'Script_SetFace_8Way',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'axisX', type: 'number', value: 1 },
          { name: 'axisY', type: 'number', value: 1 },
          { name: 'modeStr', type: 'string', value: '8-way' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varAxisX', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varAxisY', type: 'variableGet', pos: { x: 100, y: 400 } },
          { id: 'varMode', type: 'variableGet', pos: { x: 100, y: 500 } },
          { id: 'setFace', type: 'setFaceDirection', pos: { x: 350, y: 100 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Facing Direction'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varAxisX', varName: 'axisX' },
          { nodeId: 'varAxisY', varName: 'axisY' },
          { nodeId: 'varMode', varName: 'modeStr' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setFace', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setFace', targetHandle: 'targetEntity' },
          { source: 'varAxisX', sourceHandle: 'value', target: 'setFace', targetHandle: 'axisX' },
          { source: 'varAxisY', sourceHandle: 'value', target: 'setFace', targetHandle: 'axisY' },
          { source: 'varMode', sourceHandle: 'value', target: 'setFace', targetHandle: 'mode' },
          { source: 'setFace', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'facingDirection', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'down-right',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Set Face Direction - Null Target Guard',
        entityName: 'ControlEntity_FaceNull',
        scriptName: 'Script_SetFace_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_face_target_id' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'setFace', type: 'setFaceDirection', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Face Direction Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setFace', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setFace', targetHandle: 'targetEntity' },
          { source: 'setFace', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

  // =========================================================================
  // 4. MOVE_AND_SLIDE NODE TESTS
  // =========================================================================
  test.describe('Move and slide node', () => {

    test('Applies velocity to physics entity and triggers execution Out pin', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'SliderEntity', scriptId: 'Slider_Entity_ID' });
      // Use gravityScale 0 so velY is not affected by default gravity
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 0);

      await blueprintRunner.runTest({
        testName: 'Move and Slide - Velocity Execution',
        entityName: 'SliderEntity',
        scriptName: 'Script_MoveSlide_Success',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'vx', type: 'number', value: 200 },
          { name: 'vy', type: 'number', value: 150 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVx', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varVy', type: 'variableGet', pos: { x: 100, y: 400 } },
          { id: 'moveSlide', type: 'moveAndSlide', pos: { x: 350, y: 100 } },
          { 
            id: 'getPhysics', 
            type: 'getPhysics', 
            pos: { x: 600, y: 250 },
            dynamicOutputs: ['Velocity X'],
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varVx', varName: 'vx' },
          { nodeId: 'varVy', varName: 'vy' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'moveSlide', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'targetEntity' },
          { source: 'varVx', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'velocityX' },
          { source: 'varVy', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'velocityY' },
          { source: 'moveSlide', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
          { source: 'getPhysics', sourceHandle: 'velocityX', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 200,
      });
    });

    test('Handles frozen physics entity safely without interrupting flow', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy 
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'FrozenEntity', scriptId: 'Frozen_Entity_ID' });
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

      await blueprintRunner.runTest({
        testName: 'Move and Slide - Frozen Entity Early Return',
        entityName: 'FrozenEntity',
        scriptName: 'Script_MoveSlide_Frozen',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
          { name: 'freezeVal', type: 'boolean', value: true },
          { name: 'vx', type: 'number', value: 300 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varFreeze', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'varVx', type: 'variableGet', pos: { x: 100, y: 400 } },
          { 
            id: 'setPhysics', 
            type: 'setPhysics', 
            pos: { x: 350, y: 100 },
            dynamicInputs: ['Is Frozen'],
          },
          { id: 'moveSlide', type: 'moveAndSlide', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { message: { value: 'Frozen Move Slide Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
          { nodeId: 'varFreeze', varName: 'freezeVal' },
          { nodeId: 'varVx', varName: 'vx' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
          { source: 'varFreeze', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'isFrozen' },
          { source: 'setPhysics', sourceHandle: 'execOut', target: 'moveSlide', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'targetEntity' },
          { source: 'varVx', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'velocityX' },
          { source: 'moveSlide', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Frozen Move Slide Passed',
      });
    });

    test('[Bad Path] Halts flow and asserts error when target entity does not exist', async ({ 
      blueprintRunner 
    }) => {
      await blueprintRunner.runTest({
        testName: 'Move and Slide - Null Target Guard',
        entityName: 'ControlEntity_SlideNull',
        scriptName: 'Script_MoveSlide_NullTarget',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_slide_target_id' },
          { name: 'vx', type: 'number', value: 100 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varVx', type: 'variableGet', pos: { x: 100, y: 300 } },
          { id: 'moveSlide', type: 'moveAndSlide', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Move Slide Null Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
          { nodeId: 'varVx', varName: 'vx' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'moveSlide', targetHandle: 'execIn' },
          { source: 'varTarget', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'targetEntity' },
          { source: 'varVx', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'velocityX' },
          { source: 'moveSlide', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Assertion failed: value does not exist (null or undefined)',
        expectedSource: 'Assert',
      });
    });
  });

});