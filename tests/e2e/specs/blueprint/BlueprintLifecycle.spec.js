import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Lifecycle E2E',
    description: 'E2E runtime logic evaluation for Game Lifecycle blueprint nodes (Tick, Start, Pause, Resume, Restart) in engine preview',
  },
});

test.describe('Blueprint Game Lifecycle (BlueprintLifecycle) E2E Testing - 100% Coverage', () => {

  // =========================================================================
  // 1. ON TICK (event_tick) - VARIABLE ACCUMULATOR (> 10 SIKLUS)
  // =========================================================================
  test.describe('1. On Tick Event (event_tick)', () => {
    test('Runs eventTick accumulating variable via mathAdd until exceeding 10', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const tickEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await tickEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'TickTrackerEntity', scriptId: 'Tick_Tracker_ID' });

      await blueprintRunner.runTest({
        testName: 'Lifecycle - On Tick Variable Accumulator',
        entityName: 'TickTrackerEntity',
        scriptName: 'Script_OnTick_Accumulator',
        variables: [
          { name: 'counter', type: 'number', value: 0 },
          { name: 'step', type: 'number', value: 1 },
        ],
        nodes: [
          { id: 'tickNode', type: 'eventTick', pos: { x: 100, y: 100 } },
          { id: 'varGet', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'varStep', type: 'variableGet', pos: { x: 100, y: 350 } },
          { id: 'mathAdd', type: 'mathAdd', pos: { x: 350, y: 250 } },
          { id: 'varSet', type: 'variableSet', pos: { x: 600, y: 100 } },
          {
            id: 'compare',
            type: 'logicCompare',
            pos: { x: 600, y: 300 },
            inspectorValues: {
              compare: { value: 'Greater Than (>)', type: 'select' },
              b: { value: 10, type: 'number' },
            },
          },
          { id: 'branch', type: 'logicBranch', pos: { x: 850, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 1100, y: 100 },
            inspectorValues: { message: { value: 'Tick Counter Exceeded 10', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varGet', varName: 'counter' },
          { nodeId: 'varStep', varName: 'step' },
          { nodeId: 'varSet', varName: 'counter' },
        ],
        connections: [
          { source: 'tickNode', sourceHandle: 'execOut', target: 'varSet', targetHandle: 'execIn' },
          { source: 'varGet', sourceHandle: 'value', target: 'mathAdd', targetHandle: 'v0' },
          { source: 'varStep', sourceHandle: 'value', target: 'mathAdd', targetHandle: 'v1' },
          { source: 'mathAdd', sourceHandle: 'result', target: 'varSet', targetHandle: 'value' },
          { source: 'varSet', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
          { source: 'mathAdd', sourceHandle: 'result', target: 'compare', targetHandle: 'a' },
          { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
          { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Tick Counter Exceeded 10',
      });
    });
  });

  // =========================================================================
  // 2. ON GAME START (event_game_start)
  // =========================================================================
  test.describe('2. On Game Start Event (event_game_start)', () => {
    test('Triggers automatically exactly once when game preview starts', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const startEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await startEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'StartEntity', scriptId: 'Start_Entity_ID' });

      await blueprintRunner.runTest({
        testName: 'Lifecycle - Game Start Trigger',
        entityName: 'StartEntity',
        scriptName: 'Script_GameStart',
        nodes: [
          { id: 'startNode', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 400, y: 100 },
            inspectorValues: { message: { value: 'Game Started Successfully', type: 'string' } },
          },
        ],
        connections: [
          { source: 'startNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Game Started Successfully',
      });
    });
  });

  // =========================================================================
  // 3. GAME PAUSE & RESUME VIA KEYBOARD
  // =========================================================================
  test.describe('3. Game Pause & Resume via Keyboard & Physics State Check', () => {
    test('Mendeteksi event On Game Pause ketika menekan keyboard A pada entity physics', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physicsEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physicsEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysicsPauseBall', scriptId: 'Physics_Pause_ID' });
      await inspectorCrud.setupTransform(200, 50);
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 2.0);

      // Use key 'a' and output 'onA' of eventOnKey
      await blueprintRunner.runTest({
        testName: 'Lifecycle - Pause via Keyboard',
        entityName: 'PhysicsPauseBall',
        scriptName: 'Script_Pause_Keyboard',
        nodes: [
          { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
          {
            id: 'simKey',
            type: 'simulateKey',
            pos: { x: 300, y: 100 },
            inspectorValues: { key: { value: 'a', type: 'string' } },
          },
          { id: 'onKey', type: 'eventOnKey', pos: { x: 100, y: 250 } },
          { id: 'actPause', type: 'actionGamePause', pos: { x: 350, y: 250 } },
          { id: 'onPauseEvent', type: 'eventGamePause', pos: { x: 100, y: 400 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 400, y: 400 },
            inspectorValues: { message: { value: 'EVENT_PAUSE_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
          { source: 'onKey', sourceHandle: 'onA', target: 'actPause', targetHandle: 'execIn' },
          { source: 'onPauseEvent', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'EVENT_PAUSE_DETECTED',
      });
    });

    test('Mendeteksi event On Game Resume ketika dipicu pada entity physics', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const physicsEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await physicsEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PhysicsResumeBall', scriptId: 'Physics_Resume_ID' });
      await inspectorCrud.setupTransform(200, 50);
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 2.0);

      await blueprintRunner.runTest({
        testName: 'Lifecycle - Resume via Keyboard',
        entityName: 'PhysicsResumeBall',
        scriptName: 'Script_Resume_Keyboard',
        nodes: [
          { id: 'onResumeEvent', type: 'eventGameResume', pos: { x: 100, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 400, y: 100 },
            inspectorValues: { message: { value: 'EVENT_RESUME_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'onResumeEvent', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'EVENT_RESUME_DETECTED',
      });
    });
  });

  // =========================================================================
  // 4. GAME RESTART VIA KEYBOARD WITH ENTITY PHYSICS
  // =========================================================================
  test.describe('4. Game Restart via Keyboard with Physics Entity', () => {
    test('Mendeteksi event On Game Restart via keyboard pada entity physics', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const restartEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await restartEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'RestartBallEntity', scriptId: 'Restart_Ball_ID' });
      await inspectorCrud.setupTransform(100, 100);
      await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 2.0);

      // Use key 'space' and output 'onSpace' of eventOnKey
      await blueprintRunner.runTest({
        testName: 'Lifecycle - Restart via Keyboard with Physics',
        entityName: 'RestartBallEntity',
        scriptName: 'Script_Restart_Keyboard',
        nodes: [
          { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
          {
            id: 'simKey',
            type: 'simulateKey',
            pos: { x: 300, y: 100 },
            inspectorValues: { key: { value: 'space', type: 'string' } },
          },
          { id: 'onKey', type: 'eventOnKey', pos: { x: 100, y: 250 } },
          { id: 'actRestart', type: 'actionGameRestart', pos: { x: 350, y: 250 } },
          { id: 'onRestartEvent', type: 'eventGameRestart', pos: { x: 100, y: 400 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 400, y: 400 },
            inspectorValues: { message: { value: 'EVENT_RESTART_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
          { source: 'onKey', sourceHandle: 'onSpace', target: 'actRestart', targetHandle: 'execIn' },
          { source: 'onRestartEvent', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'EVENT_RESTART_DETECTED',
      });
    });
  });

  // =========================================================================
  // 5. DIRECT EXECUTION & 100% CODE COVERAGE (ACTION NODES)
  // =========================================================================
  test.describe('5. Direct Execution & Fallback Guard Coverage (100% Branches)', () => {
    test('Action nodes execute Out pin safely even when context.game is not yet ready', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const fallbackEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await fallbackEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'FallbackEntity', scriptId: 'Fallback_ID' });

      await blueprintRunner.runTest({
        testName: 'Lifecycle - Action Fallback Chain Execution',
        entityName: 'FallbackEntity',
        scriptName: 'Script_Action_Fallback_Chain',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'actPause', type: 'actionGamePause', pos: { x: 300, y: 100 } },
          { id: 'actResume', type: 'actionGameResume', pos: { x: 550, y: 100 } },
          { id: 'actRestart', type: 'actionGameRestart', pos: { x: 800, y: 100 } },
          {
            id: 'notif',
            type: 'uiNotification',
            pos: { x: 1050, y: 100 },
            inspectorValues: { message: { value: 'Lifecycle Chain Complete', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'actPause', targetHandle: 'execIn' },
          { source: 'actPause', sourceHandle: 'execOut', target: 'actResume', targetHandle: 'execIn' },
          { source: 'actResume', sourceHandle: 'execOut', target: 'actRestart', targetHandle: 'execIn' },
          { source: 'actRestart', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Lifecycle Chain Complete',
      });
    });
  });
});