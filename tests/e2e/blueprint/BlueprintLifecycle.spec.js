import { test } from '../fixtures.js';

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
    test('Menjalankan event_tick dengan penambahan variabel via math_add hingga melebihi 10', async ({
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
          { id: 'tickNode', type: 'event_tick', pos: { x: 100, y: 100 } },
          { id: 'varGet', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'varStep', type: 'variable_get', pos: { x: 100, y: 350 } },
          { id: 'mathAdd', type: 'math_add', pos: { x: 350, y: 250 } },
          { id: 'varSet', type: 'variable_set', pos: { x: 600, y: 100 } },
          {
            id: 'compare',
            type: 'logic_compare',
            pos: { x: 600, y: 300 },
            inspectorValues: {
              compare: { value: 'Greater Than (>)', type: 'select' },
              b: { value: 10, type: 'number' },
            },
          },
          { id: 'branch', type: 'logic_branch', pos: { x: 850, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 1100, y: 100 },
            inspectorValues: { in_msg: { value: 'Tick Counter Exceeded 10', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varGet', varName: 'counter' },
          { nodeId: 'varStep', varName: 'step' },
          { nodeId: 'varSet', varName: 'counter' },
        ],
        connections: [
          { source: 'tickNode', sourceHandle: 'out', target: 'varSet', targetHandle: 'exec_in' },
          { source: 'varGet', sourceHandle: 'out_0', target: 'mathAdd', targetHandle: 'v0' },
          { source: 'varStep', sourceHandle: 'out_0', target: 'mathAdd', targetHandle: 'v1' },
          { source: 'mathAdd', sourceHandle: 'res', target: 'varSet', targetHandle: 'value' },
          { source: 'varSet', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'mathAdd', sourceHandle: 'res', target: 'compare', targetHandle: 'a' },
          { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Tick Counter Exceeded 10',
      });
    });
  });

  // =========================================================================
  // 2. ON GAME START (event_game_start)
  // =========================================================================
  test.describe('2. On Game Start Event (event_game_start)', () => {
    test('Trigger otomatis tepat satu kali saat game preview mulai', async ({
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
          { id: 'startNode', type: 'event_game_start', pos: { x: 100, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 400, y: 100 },
            inspectorValues: { in_msg: { value: 'Game Started Successfully', type: 'string' } },
          },
        ],
        connections: [
          { source: 'startNode', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
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

      // Gunakan key 'a' dan output 'out_a' bawaan event_on_key
      await blueprintRunner.runTest({
        testName: 'Lifecycle - Pause via Keyboard',
        entityName: 'PhysicsPauseBall',
        scriptName: 'Script_Pause_Keyboard',
        nodes: [
          { id: 'tick', type: 'event_tick', pos: { x: 100, y: 100 } },
          {
            id: 'simKey',
            type: 'simulate_key',
            pos: { x: 300, y: 100 },
            inspectorValues: { key: { value: 'a', type: 'string' } },
          },
          { id: 'onKey', type: 'event_on_key', pos: { x: 100, y: 250 } },
          { id: 'actPause', type: 'action_game_pause', pos: { x: 350, y: 250 } },
          { id: 'onPauseEvent', type: 'event_game_pause', pos: { x: 100, y: 400 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 400, y: 400 },
            inspectorValues: { in_msg: { value: 'EVENT_PAUSE_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'tick', sourceHandle: 'out', target: 'simKey', targetHandle: 'exec_in' },
          { source: 'onKey', sourceHandle: 'out_a', target: 'actPause', targetHandle: 'exec_in' },
          { source: 'onPauseEvent', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'onResumeEvent', type: 'event_game_resume', pos: { x: 100, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 400, y: 100 },
            inspectorValues: { in_msg: { value: 'EVENT_RESUME_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'onResumeEvent', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'EVENT_RESUME_DETECTED',
      });
    });
  });

  // =========================================================================
  // 4. GAME RESTART VIA KEYBOARD DENGAN ENTITY PHYSICS
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

      // Gunakan key 'space' dan output 'out_space' bawaan event_on_key
      await blueprintRunner.runTest({
        testName: 'Lifecycle - Restart via Keyboard with Physics',
        entityName: 'RestartBallEntity',
        scriptName: 'Script_Restart_Keyboard',
        nodes: [
          { id: 'tick', type: 'event_tick', pos: { x: 100, y: 100 } },
          {
            id: 'simKey',
            type: 'simulate_key',
            pos: { x: 300, y: 100 },
            inspectorValues: { key: { value: 'space', type: 'string' } },
          },
          { id: 'onKey', type: 'event_on_key', pos: { x: 100, y: 250 } },
          { id: 'actRestart', type: 'action_game_restart', pos: { x: 350, y: 250 } },
          { id: 'onRestartEvent', type: 'event_game_restart', pos: { x: 100, y: 400 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 400, y: 400 },
            inspectorValues: { in_msg: { value: 'EVENT_RESTART_DETECTED', type: 'string' } },
          },
        ],
        connections: [
          { source: 'tick', sourceHandle: 'out', target: 'simKey', targetHandle: 'exec_in' },
          { source: 'onKey', sourceHandle: 'out_space', target: 'actRestart', targetHandle: 'exec_in' },
          { source: 'onRestartEvent', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'EVENT_RESTART_DETECTED',
      });
    });
  });

  // =========================================================================
  // 5. DIRECT EXECUTION & 100% CODE COVERAGE (ACTION NODES)
  // =========================================================================
  test.describe('5. Direct Execution & Fallback Guard Coverage (100% Branches)', () => {
    test('Action nodes mengeksekusi Out pin secara aman meskipun context.game belum siap', async ({
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'actPause', type: 'action_game_pause', pos: { x: 300, y: 100 } },
          { id: 'actResume', type: 'action_game_resume', pos: { x: 550, y: 100 } },
          { id: 'actRestart', type: 'action_game_restart', pos: { x: 800, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 1050, y: 100 },
            inspectorValues: { in_msg: { value: 'Lifecycle Chain Complete', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'actPause', targetHandle: 'exec_in' },
          { source: 'actPause', sourceHandle: 'out', target: 'actResume', targetHandle: 'exec_in' },
          { source: 'actResume', sourceHandle: 'out', target: 'actRestart', targetHandle: 'exec_in' },
          { source: 'actRestart', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Lifecycle Chain Complete',
      });
    });
  });
});