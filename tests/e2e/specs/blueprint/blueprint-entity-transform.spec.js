import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Entity & Transform E2E',
    description: 'E2E runtime logic evaluation for Entity lifecycle, Transform properties, and Layer management in engine preview',
  },
});

test.describe('Blueprint Entity, Transform & Layer Management E2E Testing', () => {

  // 1. SPAWN PREFAB ENTITY
  test('spawns prefab entity into world layer and triggers execution out', async ({
    blueprintRunner,
    prefabCrud,
  }) => {
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varPrefab', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'varX', type: 'variableGet', pos: { x: 100, y: 320 } },
        { id: 'varY', type: 'variableGet', pos: { x: 100, y: 420 } },
        { id: 'spawnNode', type: 'entitySpawn', pos: { x: 380, y: 150 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 680, y: 100 },
          inspectorValues: { message: { value: 'Spawn Executed Successfully', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varPrefab', varName: 'prefabName' },
        { nodeId: 'varX', varName: 'posX' },
        { nodeId: 'varY', varName: 'posY' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'spawnNode', targetHandle: 'execIn' },
        { source: 'varPrefab', sourceHandle: 'value', target: 'spawnNode', targetHandle: 'prefabName' },
        { source: 'varX', sourceHandle: 'value', target: 'spawnNode', targetHandle: 'x' },
        { source: 'varY', sourceHandle: 'value', target: 'spawnNode', targetHandle: 'y' },
        { source: 'spawnNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Spawn Executed Successfully',
    });
  });

  // 2. DESTROY TARGET ENTITY
  test('destroys target external entity safely and continues flow', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const victimNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await victimNode.click();
    await inspectorCrud.configureObjectMetaData({ name: 'VictimEntity', scriptId: 'Victim_Entity_ID' });

    await blueprintRunner.runTest({
      testName: 'Destroy Entity - Target Success',
      entityName: 'ExecutionEntity',
      scriptName: 'Script_Destroy_Execution',
      variables: [
        { name: 'targetVictim', type: 'string', value: 'Victim_Entity_ID' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'destroyNode', type: 'entityDestroy', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Entity Destroyed Safely', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetVictim' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'destroyNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'destroyNode', targetHandle: 'targetEntity' },
        { source: 'destroyNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Entity Destroyed Safely',
    });
  });

  // 3. CLONE EXTERNAL ENTITY
  test('clones target external entity and triggers execution out', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const sourceEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await sourceEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'CloneTemplate', scriptId: 'Clone_Template_ID' });

    await blueprintRunner.runTest({
      testName: 'Clone Entity - Success Execution',
      entityName: 'ExecutionRunner',
      scriptName: 'Script_Clone_Runner',
      variables: [
        { name: 'templateTarget', type: 'string', value: 'Clone_Template_ID' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'cloneNode', type: 'entityClone', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Clone Executed Successfully', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'templateTarget' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'cloneNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'cloneNode', targetHandle: 'targetEntity' },
        { source: 'cloneNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Clone Executed Successfully',
    });
  });

  // 4. GET TRANSFORM PROPERTIES
  test('reads basic transform position properties on world entity', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
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

  // 5. SET TRANSFORM PROPERTIES
  test('modifies coordinates of world entity using set transform node', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const worldEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await worldEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'TargetEntity_SetTransform', scriptId: 'Set_Transform_ID' });
    await inspectorCrud.setupTransform(100, 100);

    await blueprintRunner.runTest({
      testName: 'Set Transform - World Entity Position',
      entityName: 'TargetEntity_SetTransform',
      scriptName: 'Script_SetTransform_World',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'newX', type: 'number', value: 350 },
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
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'setTransform', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'setTransform', targetHandle: 'targetEntity' },
        { source: 'varX', sourceHandle: 'value', target: 'setTransform', targetHandle: 'x' },
        { source: 'setTransform', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'getTransform', targetHandle: 'targetEntity' },
        { source: 'getTransform', sourceHandle: 'x', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 350,
    });
  });

  // 6. LAYER PROPERTIES & Z-INDEX
  test('modifies z-index of target layer and verifies updated state', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Set Layer - Modify Z-Index',
      entityName: 'LayerModifierEntity',
      scriptName: 'Script_SetLayer_ZIndex',
      variables: [
        { name: 'targetLayer', type: 'string', value: 'World Layer' },
        { name: 'newZIndex', type: 'number', value: 7 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varZ', type: 'variableGet', pos: { x: 100, y: 300 } },
        {
          id: 'setLayer',
          type: 'setLayer',
          pos: { x: 350, y: 100 },
          dynamicInputs: ['Z-Index'],
        },
        {
          id: 'getLayer',
          type: 'getLayer',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Z-Index'],
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetLayer' },
        { nodeId: 'varZ', varName: 'newZIndex' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'setLayer', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'setLayer', targetHandle: 'targetLayer' },
        { source: 'varZ', sourceHandle: 'value', target: 'setLayer', targetHandle: 'zIndex' },
        { source: 'setLayer', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'getLayer', targetHandle: 'targetLayer' },
        { source: 'getLayer', sourceHandle: 'zIndex', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 7,
    });
  });

});
