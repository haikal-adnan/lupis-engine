import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Transition Operations E2E',
    description: 'E2E evaluation for screen transition nodes (Fade Screen) in engine preview',
  },
});

test.describe('Blueprint Transition Operations E2E Testing', () => {

  // FADE SCREEN (action_fade_screen)
  test('Fade screen - Triggers Out execution pin when initiated', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Fade Screen Out Test',
      entityName: 'TransitionEntity_FadeScreen',
      scriptName: 'Script_FadeScreen',
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        {
          id: 'fadeNode',
          type: 'action_fade_screen',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            type: { value: 'Fade Out', type: 'select' },
            duration: { value: 100, type: 'number' },
            color: { value: '#000000', type: 'string' },
          },
        },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Fade Out Triggered', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'fadeNode', targetHandle: 'exec_in' },
        { source: 'fadeNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Fade Out Triggered',
    });
  });

});