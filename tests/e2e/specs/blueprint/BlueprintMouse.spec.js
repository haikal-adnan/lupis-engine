import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Mouse E2E',
    description: 'E2E runtime logic evaluation for Mouse Events nodes (eventPointerClick, eventPointerDrag, mouseEntityInteract) in engine preview',
  },
});

test.describe('Blueprint Mouse Events E2E Testing', () => {

  test('Triggers execution flow when screen is clicked via mouse action', async ({ 
    blueprintRunner,
  }) => {
    await blueprintRunner.runTest({
      testName: 'Global Mouse Click Triggered',
      entityName: 'MouseClickEntity',
      scriptName: 'Script_MouseClick_Test',
      nodes: [
        { id: 'clickNode', type: 'eventPointerClick', pos: { x: 100, y: 100 } },
        { 
          id: 'notif', 
          type: 'uiNotification', 
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Global Mouse Clicked', type: 'string' } },
        },
      ],
      connections: [
        { source: 'clickNode', sourceHandle: 'onClick', target: 'notif', targetHandle: 'execIn' },
      ],
      action: async (previewPopup) => {
        const canvas = previewPopup.locator('canvas');
        await canvas.click({ position: { x: 200, y: 200 } });
      },
      expectedLog: 'Global Mouse Clicked',
    });
  });

  test('Triggers execution flow continuously when mouse is dragged', async ({ 
    blueprintRunner,
  }) => {
    await blueprintRunner.runTest({
      testName: 'Global Mouse Drag Triggered',
      entityName: 'MouseDragEntity',
      scriptName: 'Script_MouseDrag_Test',
      nodes: [
        { id: 'dragNode', type: 'eventPointerDrag', pos: { x: 100, y: 100 } },
        { 
          id: 'notif', 
          type: 'uiNotification', 
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Global Mouse Dragged', type: 'string' } },
        },
      ],
      connections: [
        { source: 'dragNode', sourceHandle: 'onDrag', target: 'notif', targetHandle: 'execIn' },
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
      expectedLog: 'Global Mouse Dragged',
    });
  });

  test('Evaluates mouse entity interaction safely on game start', async ({ 
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const interactEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await interactEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'InteractEntity', scriptId: 'Interact_Entity_ID' });

    await blueprintRunner.runTest({
      testName: 'Mouse Entity Interaction Test',
      entityName: 'InteractEntity',
      scriptName: 'Script_MouseInteract_Simple',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'interactNode', type: 'mouseEntityInteract', pos: { x: 350, y: 100 } },
        { 
          id: 'notif', 
          type: 'uiNotification', 
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Mouse Entity Interaction Confirmed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'interactNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'interactNode', targetHandle: 'targetEntity' },
        { source: 'interactNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Mouse Entity Interaction Confirmed',
    });
  });

});