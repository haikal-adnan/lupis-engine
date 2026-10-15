import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Keyboard Events E2E',
    description: 'E2E runtime logic evaluation for Keyboard events, key simulation, state checks, and 2D axis calculation in engine preview',
  },
});

test.describe('Blueprint Keyboard Events E2E Testing', () => {
  test('Evaluates event_on_key triggering via simulate_key', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Keyboard OnKey & Simulate Test',
      entityName: 'KeyboardEntity1',
      scriptName: 'OnKeyScript',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulateKey',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'a', type: 'string' } },
        },
        { id: 'onKey', type: 'eventOnKey', pos: { x: 100, y: 300 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 450, y: 300 },
          inspectorValues: { message: { value: 'Tombol A Ditekan', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
        { source: 'onKey', sourceHandle: 'onA', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Tombol A Ditekan',
    });
  });

  test('Evaluates get_key_state with Branch condition and Notification', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Get Key State Test',
      entityName: 'KeyboardEntity2',
      scriptName: 'GetKeyStateScript',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulateKey',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        {
          id: 'getKeyState',
          type: 'getKeyState',
          pos: { x: 300, y: 300 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Space Key Active', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
        { source: 'simKey', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'getKeyState', sourceHandle: 'isDown', target: 'branch', targetHandle: 'condition' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Space Key Active',
    });
  });

  test('Evaluates calculate_axis_2d direction with Branch and Notification', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Calculate Axis 2D Test',
      entityName: 'KeyboardEntity3',
      scriptName: 'CalcAxisScript',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulateKey',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'd', type: 'string' } },
        },
        { id: 'axis', type: 'calculateAxis2d', pos: { x: 500, y: 100 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 750, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 1000, y: 100 },
          inspectorValues: { message: { value: 'Sumbu X Bergerak Kanan', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
        { source: 'simKey', sourceHandle: 'execOut', target: 'axis', targetHandle: 'execIn' },
        { source: 'axis', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'axis', sourceHandle: 'axisX', target: 'branch', targetHandle: 'condition' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Sumbu X Bergerak Kanan',
    });
  });
});