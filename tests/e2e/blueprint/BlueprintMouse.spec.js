import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Mouse E2E',
    description: 'E2E runtime logic evaluation for Mouse Events nodes (event_pointer_click, event_pointer_drag, mouse_entity_interact) in engine preview',
  },
});

test.describe('Blueprint Mouse Events (mouse_events) E2E Testing', () => {

  // =========================================================================
  // 1. MOUSE ENTITY INTERACT NODE TESTS
  // =========================================================================
  test.describe('Entity Mouse Event Node', () => {

    test('Executes Out pin and evaluates is_hovering as false when pointer is away', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const interactEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await interactEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'InteractEntity', scriptId: 'Interact_Entity_ID' });
      await inspectorCrud.setupTransform(600, 600);

      await blueprintRunner.runTest({
        testName: 'Mouse Interact - Away From Pointer False Branch',
        entityName: 'InteractEntity',
        scriptName: 'Script_MouseInteract_Away',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'interactNode', type: 'mouse_entity_interact', pos: { x: 350, y: 100 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 850, y: 100 },
            inspectorValues: { in_msg: { value: 'Not Hovering Confirmed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'interactNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'interactNode', targetHandle: 'target_in' },
          { source: 'interactNode', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'interactNode', sourceHandle: 'is_hovering', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Not Hovering Confirmed',
      });
    });

    test('Handles non-existent target entity safely (null target guard)', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Mouse Interact - Null Target Guard',
        entityName: 'ControlEntity_MouseNull',
        scriptName: 'Script_MouseInteract_NullGuard',
        variables: [
          { name: 'invalidTarget', type: 'string', value: 'missing_mouse_target_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'interactNode', type: 'mouse_entity_interact', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Mouse Interact Null Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'invalidTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'interactNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'interactNode', targetHandle: 'target_in' },
          { source: 'interactNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Mouse Interact Null Safe Out',
      });
    });

    test('Handles entity without Transform component safely', async ({ 
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const plainEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await plainEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'PlainEntity_NoTransform', scriptId: 'Plain_No_T_ID' });

      await blueprintRunner.runTest({
        testName: 'Mouse Interact - Missing Transform Guard',
        entityName: 'PlainEntity_NoTransform',
        scriptName: 'Script_MouseInteract_MissingTransform',
        variables: [
          { name: 'targetId', type: 'string', value: 'self' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'interactNode', type: 'mouse_entity_interact', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Missing Transform Safe Out', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'interactNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'interactNode', targetHandle: 'target_in' },
          { source: 'interactNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Missing Transform Safe Out',
      });
    });
  });

  // =========================================================================
  // 2. GLOBAL POINTER CLICK NODE TESTS
  // =========================================================================
  test.describe('Global Mouse Click Node', () => {

    test('Triggers execution flow when screen is clicked via mouse action', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Global Click - Left Click Triggered',
        entityName: 'ClickReceiverEntity',
        scriptName: 'Script_PointerClick_Test',
        nodes: [
          { id: 'clickNode', type: 'event_pointer_click', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Global Mouse Clicked', type: 'string' } },
          },
        ],
        connections: [
          { source: 'clickNode', sourceHandle: 'ptr_click_main', target: 'notif', targetHandle: 'exec_in' },
        ],
        action: async (previewPopup) => {
          const canvas = previewPopup.locator('canvas');
          await canvas.click({ position: { x: 200, y: 200 } });
        },
        expectedLog: 'Global Mouse Clicked',
      });
    });
  });

  // =========================================================================
  // 3. GLOBAL POINTER DRAG NODE TESTS
  // =========================================================================
  test.describe('Global Mouse Drag Node', () => {

    test('Triggers execution flow continuously when mouse is dragged', async ({ 
      blueprintRunner,
    }) => {
      await blueprintRunner.runTest({
        testName: 'Global Drag - Drag Movement Triggered',
        entityName: 'DragReceiverEntity',
        scriptName: 'Script_PointerDrag_Test',
        nodes: [
          { id: 'dragNode', type: 'event_pointer_drag', pos: { x: 100, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 450, y: 100 },
            inspectorValues: { in_msg: { value: 'Global Drag Active', type: 'string' } },
          },
        ],
        connections: [
          { source: 'dragNode', sourceHandle: 'drag_active', target: 'notif', targetHandle: 'exec_in' },
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
        expectedLog: 'Global Drag Active',
      });
    });
  });

});