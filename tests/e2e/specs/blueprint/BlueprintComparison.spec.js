import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Logic Comparison E2E',
    description: 'E2E runtime logic evaluation for comparison, branch, and switch nodes in engine preview',
  },
});

test.describe('Blueprint Logic & Comparison Expanded E2E Testing', () => {
  test('Compare - Equal (10 == 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Equal Test',
      entityName: 'CompareEntity_Equal',
      scriptName: 'Script_Equal',
      variables: [
        { name: 'valA', type: 'number', value: 10 },
        { name: 'valB', type: 'number', value: 10 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variableGet', pos: { x: 100, y: 400 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 300 },
          inspectorValues: { compare: { value: 'Equal (==)', type: 'select' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'valA' },
        { nodeId: 'var2', varName: 'valB' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'var2', sourceHandle: 'value', target: 'compare', targetHandle: 'b' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Equal Success',
    });
  });

  test('Compare - Not Equal (10 != 5) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Not Equal Test',
      entityName: 'CompareEntity_NotEqual',
      scriptName: 'Script_NotEqual',
      variables: [
        { name: 'valA', type: 'number', value: 10 },
        { name: 'valB', type: 'number', value: 5 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variableGet', pos: { x: 100, y: 400 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 300 },
          inspectorValues: { compare: { value: 'Not Equal (!=)', type: 'select' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Not Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'valA' },
        { nodeId: 'var2', varName: 'valB' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'var2', sourceHandle: 'value', target: 'compare', targetHandle: 'b' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Not Equal Success',
    });
  });

  test('Compare - Greater Than (15 > 8) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Greater Than Test',
      entityName: 'CompareEntity_Greater',
      scriptName: 'Script_Greater',
      variables: [{ name: 'score', type: 'number', value: 15 }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Greater Than (>)', type: 'select' },
            b: { value: 8, type: 'number' },
          },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Greater Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'score' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Greater Success',
    });
  });

  test('Compare - Less Than (3 < 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Less Than Test',
      entityName: 'CompareEntity_Less',
      scriptName: 'Script_Less',
      variables: [{ name: 'val', type: 'number', value: 3 }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than (<)', type: 'select' },
            b: { value: 10, type: 'number' },
          },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Less Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Less Success',
    });
  });

  test('Compare - Greater Than or Equal (10 >= 10) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Greater Equal Test',
      entityName: 'CompareEntity_GreaterEqual',
      scriptName: 'Script_GreaterEqual',
      variables: [{ name: 'val', type: 'number', value: 10 }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Greater Than or Equal (>=)', type: 'select' },
            b: { value: 10, type: 'number' },
          },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Greater Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Greater Equal Success',
    });
  });

  test('Compare - Less Than or Equal (5 <= 5) -> True', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Compare Less Equal Test',
      entityName: 'CompareEntity_LessEqual',
      scriptName: 'Script_LessEqual',
      variables: [{ name: 'val', type: 'number', value: 5 }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than or Equal (<=)', type: 'select' },
            b: { value: 5, type: 'number' },
          },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Less Equal Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'val' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Less Equal Success',
    });
  });

  test('Branch - False path execution (10 < 2 -> False)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Branch False Path Test',
      entityName: 'BranchEntity_FalsePath',
      scriptName: 'Script_FalsePath',
      variables: [{ name: 'hp', type: 'number', value: 10 }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'compare',
          type: 'logicCompare',
          pos: { x: 350, y: 250 },
          inspectorValues: {
            compare: { value: 'Less Than (<)', type: 'select' },
            b: { value: 2, type: 'number' },
          },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'False Branch Executed', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'hp' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'compare', targetHandle: 'a' },
        { source: 'compare', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onFalse', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'False Branch Executed',
    });
  });

  test('Switch - Match case string ("right")', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Switch Match Case Test',
      entityName: 'SwitchEntity_Match',
      scriptName: 'Script_SwitchMatch',
      variables: [{ name: 'dir', type: 'string', value: 'right' }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'switch', type: 'logicSwitch', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Switch Match Case Right', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'dir' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'switch', targetHandle: 'value' },
        { source: 'start', sourceHandle: 'execOut', target: 'switch', targetHandle: 'execIn' },
        { source: 'switch', sourceHandle: 'onCase0', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Switch Match Case Right',
    });
  });

  test('Switch - Default fallback path', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Switch Default Path Test',
      entityName: 'SwitchEntity_Default',
      scriptName: 'Script_SwitchDefault',
      variables: [{ name: 'dir', type: 'string', value: 'unknown_direction' }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'switch', type: 'logicSwitch', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Switch Default Triggered', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'dir' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'switch', targetHandle: 'value' },
        { source: 'start', sourceHandle: 'execOut', target: 'switch', targetHandle: 'execIn' },
        { source: 'switch', sourceHandle: 'onDefault', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Switch Default Triggered',
    });
  });
});