import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Pointer E2E',
    description: 'E2E runtime logic evaluation for Pointer and Touch nodes (eventPointerTap, eventPointerSwipe) in engine preview',
  },
});

test.describe('Blueprint Pointer and Touch Events E2E Testing', () => {

  test('Triggers execution flow when screen is tapped or clicked', async ({ 
    blueprintRunner,
  }) => {
    await blueprintRunner.runTest({
      testName: 'Pointer Tap Event Triggered',
      entityName: 'PointerTapEntity',
      scriptName: 'Script_PointerTap_Test',
      nodes: [
        { id: 'tapNode', type: 'eventPointerTap', pos: { x: 100, y: 100 } },
        { 
          id: 'notif', 
          type: 'uiNotification', 
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Pointer Tap Confirmed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tapNode', sourceHandle: 'onClick', target: 'notif', targetHandle: 'execIn' },
      ],
      action: async (previewPopup) => {
        const canvas = previewPopup.locator('canvas');
        await canvas.click({ position: { x: 200, y: 200 } });
      },
      expectedLog: 'Pointer Tap Confirmed',
    });
  });

  test('Triggers execution flow when pointer is swiped or dragged across screen', async ({ 
    blueprintRunner,
  }) => {
    await blueprintRunner.runTest({
      testName: 'Pointer Swipe Event Triggered',
      entityName: 'PointerSwipeEntity',
      scriptName: 'Script_PointerSwipe_Test',
      nodes: [
        { id: 'swipeNode', type: 'eventPointerSwipe', pos: { x: 100, y: 100 } },
        { 
          id: 'notif', 
          type: 'uiNotification', 
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Pointer Swipe Confirmed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'swipeNode', sourceHandle: 'onDrag', target: 'notif', targetHandle: 'execIn' },
      ],
      action: async (previewPopup) => {
        const canvas = previewPopup.locator('canvas');
        const box = await canvas.boundingBox();
        if (box) {
          await previewPopup.mouse.move(box.x + 100, box.y + 100);
          await previewPopup.mouse.down();
          await previewPopup.mouse.move(box.x + 250, box.y + 250, { steps: 5 });
          await previewPopup.mouse.up();
        }
      },
      expectedLog: 'Pointer Swipe Confirmed',
    });
  });

});