import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint System Interface E2E',
    description: 'E2E runtime logic evaluation for System Interface blueprint nodes in engine preview',
  },
});

test.describe('Blueprint System Interface E2E Testing', () => {
  test('Displays notification message on tick execution event', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'System Notification OnTick',
      entityName: 'NotificationEntity',
      scriptName: 'Script_Notification_Tick',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 400, y: 100 },
          inspectorValues: {
            message: { value: 'System notification triggered via on tick', type: 'string' },
          },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'System notification triggered via on tick',
      expectedSource: 'Notification',
    });
  });

  test('Evaluates debug notification automatically on tick loop', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'System Debug Notification Tick',
      entityName: 'DebugNotificationEntity',
      scriptName: 'Script_Debug_Notification',
      nodes: [
        {
          id: 'debugNotif',
          type: 'debugNotification',
          pos: { x: 100, y: 100 },
          inspectorValues: {
            data: { value: 'Debug tick notification active', type: 'string' },
          },
        },
      ],
      connections: [],
      expectedLog: 'Debug tick notification active',
      expectedSource: 'Debug',
    });
  });
});