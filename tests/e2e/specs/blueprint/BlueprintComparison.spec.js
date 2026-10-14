import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Logic Comparison E2E',
    description: 'E2E runtime logic evaluation for comparison, branch, and switch nodes in engine preview',
  },
});

test.describe('Blueprint Logic & Comparison Expanded E2E Testing', () => {
  test('COMPARE - Equal (10 == 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Equal Test',
      entityName: 'CompareEntity_Equal',
      scriptName: 'Script_Equal',
      variables: [
        { name: 'valA', type: 'number', value: 10 },
        { name: 'valB', type: 'number', value: 10 },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variable_get', pos: { x: 100, y: 400 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 300 },
          inspectorValues: { compare: { value: 'Equal (==)', type: 'select' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'valA' },
        { nodeId: 'var2', varName: 'valB' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'var2', sourceHandle: 'out_0', target: 'compare', targetHandle: 'b' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Equal Success',
    });
  });

  test('COMPARE - Not Equal (10 != 5) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Not Equal Test',
      entityName: 'CompareEntity_NotEqual',
      scriptName: 'Script_NotEqual',
      variables: [
        { name: 'valA', type: 'number', value: 10 },
        { name: 'valB', type: 'number', value: 5 },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variable_get', pos: { x: 100, y: 400 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 300 },
          inspectorValues: { compare: { value: 'Not Equal (!=)', type: 'select' } },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Not Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'valA' },
        { nodeId: 'var2', varName: 'valB' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'var2', sourceHandle: 'out_0', target: 'compare', targetHandle: 'b' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Not Equal Success',
    });
  });

  test('COMPARE - Greater Than (15 > 8) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Greater Than Test',
      entityName: 'CompareEntity_Greater',
      scriptName: 'Script_Greater',
      variables: [{ name: 'score', type: 'number', value: 15 }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Greater Than (>)', type: 'select' },
            b: { value: 8, type: 'number' },
          },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Greater Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'score' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Greater Success',
    });
  });

  test('COMPARE - Less Than (3 < 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Less Than Test',
      entityName: 'CompareEntity_Less',
      scriptName: 'Script_Less',
      variables: [{ name: 'val', type: 'number', value: 3 }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than (<)', type: 'select' },
            b: { value: 10, type: 'number' },
          },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Less Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Less Success',
    });
  });

  test('COMPARE - Greater Than or Equal (10 >= 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Greater Equal Test',
      entityName: 'CompareEntity_GreaterEqual',
      scriptName: 'Script_GreaterEqual',
      variables: [{ name: 'val', type: 'number', value: 10 }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Greater Than or Equal (>=)', type: 'select' },
            b: { value: 10, type: 'number' },
          },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Greater Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Greater Equal Success',
    });
  });

  test('COMPARE - Less Than or Equal (5 <= 5) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Less Equal Test',
      entityName: 'CompareEntity_LessEqual',
      scriptName: 'Script_LessEqual',
      variables: [{ name: 'val', type: 'number', value: 5 }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than or Equal (<=)', type: 'select' },
            b: { value: 5, type: 'number' },
          },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'Less Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Less Equal Success',
    });
  });

  test('BRANCH - False Path Execution (10 < 2 -> False)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Branch False Path Test',
      entityName: 'BranchEntity_FalsePath',
      scriptName: 'Script_FalsePath',
      variables: [{ name: 'hp', type: 'number', value: 10 }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logic_compare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than (<)', type: 'select' },
            b: { value: 2, type: 'number' },
          },
        },
        { id: 'branch', type: 'logic_branch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 800, y: 100 },
          inspectorValues: { in_msg: { value: 'False Branch Executed', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'hp' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'res', target: 'branch', targetHandle: 'cond_0' },
        { source: 'start', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
        { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'False Branch Executed',
    });
  });

  test('SWITCH - Match Case String ("right")', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Switch Match Case Test',
      entityName: 'SwitchEntity_Match',
      scriptName: 'Script_SwitchMatch',
      variables: [{ name: 'dir', type: 'string', value: 'right' }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'switch', type: 'logic_switch', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Switch Match Case Right', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'dir' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'switch', targetHandle: 'value' },
        { source: 'start', sourceHandle: 'exec_out', target: 'switch', targetHandle: 'exec_in' },
        { source: 'switch', sourceHandle: 'out_case_0', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Switch Match Case Right',
    });
  });

  test('SWITCH - Default Fallback Path', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Switch Default Path Test',
      entityName: 'SwitchEntity_Default',
      scriptName: 'Script_SwitchDefault',
      variables: [{ name: 'dir', type: 'string', value: 'unknown_direction' }],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variable_get', pos: { x: 100, y: 250 } },
        { id: 'switch', type: 'logic_switch', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Switch Default Triggered', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'dir' }],
      connections: [
        { source: 'varNode', sourceHandle: 'out_0', target: 'switch', targetHandle: 'value' },
        { source: 'start', sourceHandle: 'exec_out', target: 'switch', targetHandle: 'exec_in' },
        { source: 'switch', sourceHandle: 'out_default', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Switch Default Triggered',
    });
  });
});