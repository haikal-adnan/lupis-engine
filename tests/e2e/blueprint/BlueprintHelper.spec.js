import { test } from '../fixtures.js';

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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'mergeNode', type: 'logic_flow_merge', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Merge Flow Executed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'mergeNode', targetHandle: 'in_0' },
        { source: 'mergeNode', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'delayNode',
          type: 'logic_delay',
          pos: { x: 350, y: 100 },
          inspectorValues: { duration: { value: 0, type: 'number' } },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Delay Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'delayNode', targetHandle: 'exec_in' },
        { source: 'delayNode', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'cdNode',
          type: 'logic_cooldown',
          pos: { x: 350, y: 100 },
          inspectorValues: { duration: { value: 100, type: 'number' } },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Cooldown Ready Fired', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'cdNode', targetHandle: 'exec_in' },
        { source: 'cdNode', sourceHandle: 'ready', target: 'notif', targetHandle: 'exec_in' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'tweenNode',
          type: 'logic_tween_value',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            startValue: { value: 0, type: 'number' },
            endValue: { value: 100, type: 'number' },
            duration: { value: 0, type: 'number' },
          },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Tween Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'tweenNode', targetHandle: 'exec_in' },
        { source: 'tweenNode', sourceHandle: 'on_complete', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Tween Completed',
    });
  });

  // 5. TYPEWRITER (logic_typewriter) - Disesuaikan dengan explicit target variable
  // 5. TYPEWRITER (logic_typewriter)
  test('Typewriter - Emits completion execution path', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Typewriter Complete Test',
      entityName: 'HelperEntity_Typewriter',
      scriptName: 'Script_Typewriter',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'typewriterNode',
          type: 'logic_typewriter',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            speed: { value: 1, type: 'number' },
            target_in: { value: 'self', type: 'string' },
          },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Typewriter Completed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'typewriterNode', targetHandle: 'exec_in' },
        { source: 'typewriterNode', sourceHandle: 'on_complete', target: 'notif', targetHandle: 'exec_in' },
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
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'buttonScaleNode',
          type: 'ui_button_scale_effect',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            target_in: { value: 'self', type: 'string' },
            use_raycast: { value: false, type: 'boolean' },
          },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Button Scale Executed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'buttonScaleNode', targetHandle: 'exec_in' },
        { source: 'buttonScaleNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Button Scale Executed',
    });
  });

});