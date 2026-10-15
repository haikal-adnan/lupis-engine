import { test } from '../../fixtures.js';

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