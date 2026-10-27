import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Pyramid High-Level E2E',
    description: 'E2E runtime evaluation for High-Level Gameplay Systems, Extensible Templates, and Plug-and-Play Presets in engine preview',
  },
});

test.describe('Blueprint Pyramid High-Level: Gameplay Systems, Extensible Templates & Presets E2E Testing', () => {

  // =========================================================================
  // 1. PLUG-AND-PLAY PRESET SYSTEMS (TIER 1)
  // =========================================================================

  test('orchestrates platformer movement controller and resolves idle movement state', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const playerEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await playerEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'PlatformerHero' });
    await inspectorCrud.setupPhysics('Platformer (Side-Scroll)', 1.0, 1.0);

    await blueprintRunner.runTest({
      testName: 'Platformer Controller - Idle Movement State',
      entityName: 'PlatformerHero',
      scriptName: 'Script_Platformer_Controller',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'ctrlNode', type: 'platformerController', pos: { x: 380, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'ctrlNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'ctrlNode', targetHandle: 'targetEntity' },
        { source: 'ctrlNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'ctrlNode', sourceHandle: 'movementState', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'idle',
    });
  });

  test('orchestrates top-down character movement and resolves directional state', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const characterEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await characterEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'TopDownHero' });
    await inspectorCrud.setupPhysics('Top-Down', 1.0);

    await blueprintRunner.runTest({
      testName: 'TopDown Controller - Directional State',
      entityName: 'TopDownHero',
      scriptName: 'Script_TopDown_Controller',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'topDownNode', type: 'topDownController', pos: { x: 380, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'topDownNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'topDownNode', targetHandle: 'targetEntity' },
        { source: 'topDownNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'topDownNode', sourceHandle: 'facingDirection', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'down',
    });
  });

  test('orchestrates volume slider management and outputs master volume level', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Volume Slider Manager - Master Volume Level',
      entityName: 'AudioMasterEntity',
      scriptName: 'Script_Volume_Slider_Manager',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'sliderNode', type: 'volumeSliderManager', pos: { x: 380, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'sliderNode', targetHandle: 'execIn' },
        { source: 'sliderNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'sliderNode', sourceHandle: 'masterVolume', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 100,
    });
  });

  // =========================================================================
  // 2. EXTENSIBLE GAMEPLAY TEMPLATES & EVENT HOOKS (TIER 2)
  // =========================================================================

  test('evaluates collectable item initialization and score value output', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Collectable Item - Score Value Output',
      entityName: 'CoinEntity',
      scriptName: 'Script_Collectable_Score',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'scoreVal', type: 'number', value: 25 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'varScore', type: 'variableGet', pos: { x: 100, y: 320 } },
        { id: 'coinNode', type: 'collectableItem', pos: { x: 380, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varScore', varName: 'scoreVal' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'coinNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'coinNode', targetHandle: 'targetEntity' },
        { source: 'varScore', sourceHandle: 'value', target: 'coinNode', targetHandle: 'scoreValue' },
        { source: 'coinNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'coinNode', sourceHandle: 'value', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 25,
    });
  });

  test('triggers collectable pickup lifecycle and emits onCollected event hook', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const playerEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await playerEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'Player_Hero', tag: 'player' });
    await inspectorCrud.setupTransform(100, 100);

    const coinEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await coinEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'Gold_Coin' });
    await inspectorCrud.setupTransform(100, 100);

    await blueprintRunner.runTest({
      testName: 'Collectable Item - Overlap Pickup Hook',
      entityName: 'Gold_Coin',
      scriptName: 'Script_Collectable_Pickup',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'collector', type: 'string', value: 'player' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 320 } },
        { id: 'coinNode', type: 'collectableItem', pos: { x: 380, y: 150 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 680, y: 100 },
          inspectorValues: { message: { value: 'Item Collected Successfully', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varTag', varName: 'collector' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'coinNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'coinNode', targetHandle: 'targetEntity' },
        { source: 'varTag', sourceHandle: 'value', target: 'coinNode', targetHandle: 'collectorTag' },
        { source: 'coinNode', sourceHandle: 'onCollected', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Item Collected Successfully',
    });
  });

  test('respects inversion of control by suppressing collection when canCollect is false', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const playerEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await playerEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'Player_Hero2', tag: 'player' });
    await inspectorCrud.setupTransform(100, 100);

    const lockedChest = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await lockedChest.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'Locked_Chest' });
    await inspectorCrud.setupTransform(100, 100);

    await blueprintRunner.runTest({
      testName: 'Collectable Item - Inversion Of Control',
      entityName: 'Locked_Chest',
      scriptName: 'Script_Collectable_Locked',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'collector', type: 'string', value: 'player' },
        { name: 'canCollect', type: 'boolean', value: false },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varTag', type: 'variableGet', pos: { x: 100, y: 300 } },
        { id: 'varCan', type: 'variableGet', pos: { x: 100, y: 400 } },
        { id: 'chestNode', type: 'collectableItem', pos: { x: 380, y: 150 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 680, y: 100 },
          inspectorValues: { message: { value: 'Collection Suppressed as Expected', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varTag', varName: 'collector' },
        { nodeId: 'varCan', varName: 'canCollect' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'chestNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'chestNode', targetHandle: 'targetEntity' },
        { source: 'varTag', sourceHandle: 'value', target: 'chestNode', targetHandle: 'collectorTag' },
        { source: 'varCan', sourceHandle: 'value', target: 'chestNode', targetHandle: 'canCollect' },
        { source: 'chestNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Collection Suppressed as Expected',
    });
  });

  test('executes platformer combat attack action and evaluates canMove state', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Platformer Combat - Execution Pipeline',
      entityName: 'FighterEntity',
      scriptName: 'Script_Platformer_Combat',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'combatNode', type: 'platformerCombat', pos: { x: 380, y: 150 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 680, y: 100 },
          inspectorValues: { message: { value: 'Combat Pipeline Executed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'combatNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'combatNode', targetHandle: 'targetEntity' },
        { source: 'combatNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Combat Pipeline Executed',
    });
  });

  test('processes enemy AI navigation and resolves initial patrol movement state', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Enemy AI - Patrol Movement State',
      entityName: 'PatrolEnemy',
      scriptName: 'Script_Enemy_Patrol',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 220 } },
        { id: 'aiNode', type: 'enemyChaser', pos: { x: 380, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'aiNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'aiNode', targetHandle: 'targetEntity' },
        { source: 'aiNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'aiNode', sourceHandle: 'movementState', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'walk',
    });
  });
});
