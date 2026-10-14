import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Pointer E2E',
    description: 'E2E runtime logic evaluation for Pointer & Touch nodes (event_pointer_click, event_pointer_drag) in engine preview',
  },
});

test.describe('Blueprint Pointer & Touch (pointer_events) E2E Testing', () => {

  // =========================================================================
  // 1. ON CLICK / TAP NODE TESTS (event_pointer_click)
  // =========================================================================
  test.describe('On Click / Tap Node', () => {

    test('Triggers execution flow when canvas is clicked or tapped', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Pointer Click - Trigger Flow On Click',
        entityName: 'PointerClickEntity',
        scriptName: 'Script_PointerClick_Test',
        nodes: [
          { id: 'pointerClick', type: 'event_pointer_click', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Pointer Clicked Successfully', type: 'string' } },
          },
        ],
        connections: [
          { source: 'pointerClick', sourceHandle: 'ptr_click_main', target: 'notif', targetHandle: 'exec_in' },
        ],
        action: async (previewPopup) => {
          const canvas = previewPopup.locator('canvas');
          await canvas.click({ position: { x: 150, y: 150 } });
        },
        expectedLog: 'Pointer Clicked Successfully',
      });
    });

    test('Captures tap input at offset coordinates and triggers notification', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Pointer Click - Offset Tap Location',
        entityName: 'PointerTapEntity',
        scriptName: 'Script_PointerTap_Offset',
        nodes: [
          { id: 'pointerClick', type: 'event_pointer_click', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Offset Tap Received', type: 'string' } },
          },
        ],
        connections: [
          { source: 'pointerClick', sourceHandle: 'ptr_click_main', target: 'notif', targetHandle: 'exec_in' },
        ],
        action: async (previewPopup) => {
          const canvas = previewPopup.locator('canvas');
          await canvas.click({ position: { x: 320, y: 240 } });
        },
        expectedLog: 'Offset Tap Received',
      });
    });
  });

  // =========================================================================
  // 2. DRAG / SWIPE NODE TESTS (event_pointer_drag)
  // =========================================================================
  test.describe('Drag / Swipe Node', () => {

    test('Triggers execution flow when pointer is dragged across canvas', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Pointer Drag - Dragging Flow Triggered',
        entityName: 'PointerDragEntity',
        scriptName: 'Script_PointerDrag_Test',
        nodes: [
          { id: 'pointerDrag', type: 'event_pointer_drag', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Pointer Dragging Active', type: 'string' } },
          },
        ],
        connections: [
          { source: 'pointerDrag', sourceHandle: 'drag_active', target: 'notif', targetHandle: 'exec_in' },
        ],
        action: async (previewPopup) => {
          const canvas = previewPopup.locator('canvas');
          const box = await canvas.boundingBox();
          if (box) {
            await previewPopup.mouse.move(box.x + 100, box.y + 100);
            await previewPopup.mouse.down();
            await previewPopup.mouse.move(box.x + 220, box.y + 220, { steps: 5 });
            await previewPopup.mouse.up();
          }
        },
        expectedLog: 'Pointer Dragging Active',
      });
    });

    test('Handles horizontal swipe gesture movement across canvas', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Pointer Drag - Horizontal Swipe',
        entityName: 'PointerSwipeEntity',
        scriptName: 'Script_PointerSwipe_Horizontal',
        nodes: [
          { id: 'pointerDrag', type: 'event_pointer_drag', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Horizontal Swipe Completed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'pointerDrag', sourceHandle: 'drag_active', target: 'notif', targetHandle: 'exec_in' },
        ],
        action: async (previewPopup) => {
          const canvas = previewPopup.locator('canvas');
          const box = await canvas.boundingBox();
          if (box) {
            await previewPopup.mouse.move(box.x + 50, box.y + 150);
            await previewPopup.mouse.down();
            await previewPopup.mouse.move(box.x + 280, box.y + 150, { steps: 6 });
            await previewPopup.mouse.up();
          }
        },
        expectedLog: 'Horizontal Swipe Completed',
      });
    });
  });

});