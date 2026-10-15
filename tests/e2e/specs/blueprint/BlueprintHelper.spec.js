import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Flow Helper E2E',
    description: 'E2E evaluation for Flow Helper nodes (Merge Flow, Delay, Cooldown, Tween Value, Typewriter, Button Scale Effect) in engine preview',
  },
});

test.describe('Blueprint Flow Helper E2E Testing', () => {

  // 1. MERGE FLOW (logic_flow_merge)
  test('Merge flow - Merges execution input into single output', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Merge Flow Test',
      entityName: 'HelperEntity_MergeFlow',
      scriptName: 'Script_MergeFlow',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'mergeNode', type: 'logicFlowMerge', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Merge Flow Executed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'mergeNode', targetHandle: 'v0' },
        { source: 'mergeNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Merge Flow Executed',
    });
  });

  // 2. DELAY (logic_delay)
  test('Delay - Completes execution after duration', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Delay Completed Test',
      entityName: 'HelperEntity_Delay',
      scriptName: 'Script_Delay',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'delayNode',
          type: 'logicDelay',
          pos: { x: 350, y: 100 },
          inspectorValues: { duration: { value: 0, type: 'number' } },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Delay Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'delayNode', targetHandle: 'execIn' },
        { source: 'delayNode', sourceHandle: 'completed', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Delay Completed',
    });
  });

  // 3. COOLDOWN (logic_cooldown)
  test('Cooldown - Triggers ready output on initial invocation', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Cooldown Initial Fire Test',
      entityName: 'HelperEntity_Cooldown',
      scriptName: 'Script_Cooldown',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'cdNode',
          type: 'logicCooldown',
          pos: { x: 350, y: 100 },
          inspectorValues: { duration: { value: 100, type: 'number' } },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Cooldown Ready Fired', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'cdNode', targetHandle: 'execIn' },
        { source: 'cdNode', sourceHandle: 'onReady', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Cooldown Ready Fired',
    });
  });

  // 4. TWEEN VALUE (logic_tween_value)
  test('Tween value - Emits completion signal when progress reaches end', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Tween Value Complete Test',
      entityName: 'HelperEntity_Tween',
      scriptName: 'Script_Tween',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'tweenNode',
          type: 'logicTweenValue',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            startValue: { value: 0, type: 'number' },
            endValue: { value: 100, type: 'number' },
            duration: { value: 0, type: 'number' },
          },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Tween Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'tweenNode', targetHandle: 'execIn' },
        { source: 'tweenNode', sourceHandle: 'onComplete', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Tween Completed',
    });
  });

  // 5. TYPEWRITER (logic_typewriter)
  test('Typewriter - Emits completion execution path', async ({ 
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const textEntity = await hierarchyCrud.entity.create(worldLayer, 'text');
    await textEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'HelperEntity_Typewriter', scriptId: 'HelperEntity_Typewriter' });

    await blueprintRunner.runTest({
      testName: 'Typewriter Complete Test',
      entityName: 'HelperEntity_Typewriter',
      scriptName: 'Script_Typewriter',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'typewriterNode',
          type: 'logicTypewriter',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            speed: { value: 1, type: 'number' },
            targetEntity: { value: 'self', type: 'string' },
          },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Typewriter Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'typewriterNode', targetHandle: 'execIn' },
        { source: 'typewriterNode', sourceHandle: 'onComplete', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Typewriter Completed',
    });
  });

  // 6. BUTTON SCALE EFFECT (ui_button_scale_effect)
  test('Button scale effect - Executes Out pin on update tick', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Button Scale Effect Out Test',
      entityName: 'HelperEntity_ButtonScale',
      scriptName: 'Script_ButtonScale',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'buttonScaleNode',
          type: 'uiButtonScaleEffect',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            targetEntity: { value: 'self', type: 'string' },
            useRaycast: { value: false, type: 'boolean' },
          },
        },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Button Scale Executed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'buttonScaleNode', targetHandle: 'execIn' },
        { source: 'buttonScaleNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Button Scale Executed',
    });
  });

});