import { test } from '../fixtures.js';

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
        { id: 'tick', type: 'event_tick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulate_key',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'a', type: 'string' } },
        },
        { id: 'onKey', type: 'event_on_key', pos: { x: 100, y: 300 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 450, y: 300 },
          inspectorValues: { in_msg: { value: 'Tombol A Ditekan', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'out', target: 'simKey', targetHandle: 'exec_in' },
        { source: 'onKey', sourceHandle: 'out_a', target: 'notif', targetHandle: 'exec_in' },
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
        { id: 'tick', type: 'event_tick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulate_key',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        {
          id: 'getKeyState',
          type: 'get_key_state',
          pos: { x: 300, y: 300 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Tombol Space Aktif', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'out', target: 'simKey', targetHandle: 'exec_in' },
        { source: 'simKey', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'getKeyState', sourceHandle: 'isDown', target: 'branch', targetHandle: 'cond_0' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Tombol Space Aktif',
    });
  });

  test('Evaluates calculate_axis_2d direction with Branch and Notification', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Calculate Axis 2D Test',
      entityName: 'KeyboardEntity3',
      scriptName: 'CalcAxisScript',
      nodes: [
        { id: 'tick', type: 'event_tick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulate_key',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'd', type: 'string' } },
        },
        { id: 'axis', type: 'calculate_axis_2d', pos: { x: 500, y: 100 } },
        { id: 'branch', type: 'logic_branch', pos: { x: 750, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 1000, y: 100 },
          inspectorValues: { in_msg: { value: 'Sumbu X Bergerak Kanan', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'out', target: 'simKey', targetHandle: 'exec_in' },
        { source: 'simKey', sourceHandle: 'exec_out', target: 'axis', targetHandle: 'exec_tick' },
        { source: 'axis', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'axis', sourceHandle: 'axis_x', target: 'branch', targetHandle: 'cond_0' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Sumbu X Bergerak Kanan',
    });
  });
});