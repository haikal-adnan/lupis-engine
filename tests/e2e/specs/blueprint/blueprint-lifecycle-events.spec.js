import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Lifecycle & Events E2E',
    description: 'E2E runtime logic evaluation for Game Lifecycle, Events, Signals, Scenes, and System transitions in engine preview',
  },
});

test.describe('Blueprint Lifecycle, Events & Scene Management E2E Testing', () => {

  // Helper to initialize scenes with World Layers
  async function setupFourScenes(hierarchyCrud, controls, popup) {
    await controls.clickSelectAction('hierarchy-scene-options-button', 'Rename Scene');
    await popup.fillPromptAndSubmit('Rename Scene', 'Scene_Alpha', 'OK');

    for (const sceneName of ['Scene_Beta', 'Scene_Gamma', 'Scene_Delta']) {
      await hierarchyCrud.scene.create(sceneName);
      await hierarchyCrud.layer.create('World', 'World Layer');
    }

    await hierarchyCrud.scene.switch('Scene_Alpha');
  }

  // 1. GAME START LIFECYCLE
  test('executes logic flow on game start event', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Lifecycle - On Game Start',
      entityName: 'StartTrackerEntity',
      scriptName: 'Script_OnGameStart',
      nodes: [
        { id: 'startNode', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Game Started Successfully', type: 'string' } },
        },
      ],
      connections: [
        { source: 'startNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Game Started Successfully',
    });
  });

  // 2. ON TICK VARIABLE ACCUMULATOR
  test('accumulates counter variable on tick event until condition is met', async ({
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

  // 3. EVENTS & SIGNALS (EMIT & LISTEN FULL CYCLE)
  test('emits custom signal and executes listener flow on signal received', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'On Signal - Match and Trigger Flow',
      entityName: 'SignalBridgeEntity',
      scriptName: 'Script_Signal_FullCycle',
      variables: [
        { name: 'sigChannel', type: 'string', value: 'PlayerDied' },
      ],
      nodes: [
        { id: 'varSigReceiver', type: 'variableGet', pos: { x: 100, y: 150 } },
        { id: 'onSignalNode', type: 'eventOnSignal', pos: { x: 350, y: 150 } },
        {
          id: 'notifReceiver',
          type: 'uiNotification',
          pos: { x: 650, y: 150 },
          inspectorValues: { message: { value: 'Signal PlayerDied Received', type: 'string' } },
        },
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 350 } },
        { id: 'varSigEmitter', type: 'variableGet', pos: { x: 100, y: 450 } },
        { id: 'emitNode', type: 'actionEmitSignal', pos: { x: 350, y: 350 } },
      ],
      variableBindings: [
        { nodeId: 'varSigReceiver', varName: 'sigChannel' },
        { nodeId: 'varSigEmitter', varName: 'sigChannel' },
      ],
      connections: [
        { source: 'varSigReceiver', sourceHandle: 'value', target: 'onSignalNode', targetHandle: 'signalName' },
        { source: 'onSignalNode', sourceHandle: 'execOut', target: 'notifReceiver', targetHandle: 'execIn' },
        { source: 'start', sourceHandle: 'execOut', target: 'emitNode', targetHandle: 'execIn' },
        { source: 'varSigEmitter', sourceHandle: 'value', target: 'emitNode', targetHandle: 'signalName' },
      ],
      expectedLog: 'Signal PlayerDied Received',
    });
  });

  // 4. SCENE START & READ SCENE NAME
  test('triggers on scene start and reads current scene name', async ({
    blueprintRunner,
    hierarchyCrud,
    controls,
    popup,
  }) => {
    await setupFourScenes(hierarchyCrud, controls, popup);

    await blueprintRunner.runTest({
      testName: 'On Scene Start - Capture Scene Name',
      entityName: 'SceneManagerEntity',
      scriptName: 'Script_OnSceneStart',
      nodes: [
        { id: 'onStart', type: 'eventSceneStart', pos: { x: 100, y: 100 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 450, y: 100 } },
      ],
      connections: [
        { source: 'onStart', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'onStart', sourceHandle: 'sceneName', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Scene_Alpha',
    });
  });

  // 5. CHANGE SCENE TO TARGET SCENE
  test('transitions to valid target scene via change scene node', async ({
    blueprintRunner,
    hierarchyCrud,
    controls,
    popup,
  }) => {
    await setupFourScenes(hierarchyCrud, controls, popup);

    await blueprintRunner.runTest({
      testName: 'Change Scene - Valid Target Scene',
      entityName: 'SceneChangerEntity',
      scriptName: 'Script_ChangeScene_Success',
      variables: [
        { name: 'targetScene', type: 'string', value: 'Scene_Beta' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varScene', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'changeScene', type: 'changeScene', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Transition Out Executed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varScene', varName: 'targetScene' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'changeScene', targetHandle: 'execIn' },
        { source: 'varScene', sourceHandle: 'value', target: 'changeScene', targetHandle: 'sceneName' },
        { source: 'changeScene', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Transition Out Executed',
    });
  });

  // 6. FADE SCREEN TRANSITION & SYSTEM INTERFACE
  test('triggers screen fade transition and outputs notification message', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Fade Screen Out Test',
      entityName: 'TransitionEntity_FadeScreen',
      scriptName: 'Script_FadeScreen',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'fadeNode',
          type: 'actionFadeScreen',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            mode: { value: 'Fade Out', type: 'select' },
            duration: { value: 100, type: 'number' },
            color: { value: '#000000', type: 'string' },
          },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Fade Out Triggered', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'fadeNode', targetHandle: 'execIn' },
        { source: 'fadeNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Fade Out Triggered',
    });
  });

});
