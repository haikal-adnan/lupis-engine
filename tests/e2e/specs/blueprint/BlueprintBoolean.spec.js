import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Boolean Logic E2E',
    description: 'E2E runtime logic evaluation for Boolean operations (AND, OR, NOT) in engine preview',
  },
});

test.describe('Blueprint Boolean Logic E2E Testing', () => {
  test('Evaluates logicAnd with two boolean variables (true AND true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean AND Test',
      entityName: 'BoolEntity1',
      scriptName: 'AndScript',
      variables: [
        { name: 'isPlayerAlive', type: 'boolean', value: true },
        { name: 'hasKey', type: 'boolean', value: true },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variableGet', pos: { x: 100, y: 400 } },
        { id: 'andNode', type: 'logicAnd', pos: { x: 350, y: 300 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'AND Logic Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'isPlayerAlive' },
        { nodeId: 'var2', varName: 'hasKey' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'value', target: 'andNode', targetHandle: 'v0' },
        { source: 'var2', sourceHandle: 'value', target: 'andNode', targetHandle: 'v1' },
        { source: 'andNode', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'AND Logic Success',
    });
  });

  test('Evaluates logicOr with two boolean variables (false OR true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean OR Test',
      entityName: 'BoolEntity2',
      scriptName: 'OrScript',
      variables: [
        { name: 'isVip', type: 'boolean', value: false },
        { name: 'hasPass', type: 'boolean', value: true },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'var2', type: 'variableGet', pos: { x: 100, y: 400 } },
        { id: 'orNode', type: 'logicOr', pos: { x: 350, y: 300 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'OR Logic Success', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'isVip' },
        { nodeId: 'var2', varName: 'hasPass' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'value', target: 'orNode', targetHandle: 'v0' },
        { source: 'var2', sourceHandle: 'value', target: 'orNode', targetHandle: 'v1' },
        { source: 'orNode', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'OR Logic Success',
    });
  });

  test('Evaluates logicNot with inverted boolean value (!false = true)', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Boolean NOT Test',
      entityName: 'BoolEntity3',
      scriptName: 'NotScript',
      variables: [{ name: 'isGamePaused', type: 'boolean', value: false }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varNode', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'notNode', type: 'logicNot', pos: { x: 350, y: 250 } },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'NOT Logic Success', type: 'string' } },
        },
      ],
      variableBindings: [{ nodeId: 'varNode', varName: 'isGamePaused' }],
      connections: [
        { source: 'varNode', sourceHandle: 'value', target: 'notNode', targetHandle: 'value' },
        { source: 'notNode', sourceHandle: 'result', target: 'branch', targetHandle: 'condition' },
        { source: 'start', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'NOT Logic Success',
    });
  });
});