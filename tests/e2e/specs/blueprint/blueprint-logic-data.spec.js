import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Logic & Data E2E',
    description: 'E2E runtime logic evaluation for Math, Logic, Comparison, Strings, Collections, and Loops in engine preview',
  },
});

test.describe('Blueprint Logic, Math & Data Management E2E Testing', () => {

  // 1. ARITHMETIC WITH DYNAMIC PORTS
  test('evaluates math addition across multiple sequential dynamic inputs', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Math Add - Sequential Dynamic Inputs (15 + 25 + 10)',
      entityName: 'MathAddEntity',
      scriptName: 'Script_MathAdd',
      variables: [
        { name: 'val1', type: 'number', value: 15 },
        { name: 'val2', type: 'number', value: 25 },
        { name: 'val3', type: 'number', value: 10 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'var1', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'var2', type: 'variableGet', pos: { x: 100, y: 300 } },
        { id: 'var3', type: 'variableGet', pos: { x: 100, y: 400 } },
        {
          id: 'addNode',
          type: 'mathAdd',
          pos: { x: 350, y: 250 },
          dynamicInputs: [true],
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'var1', varName: 'val1' },
        { nodeId: 'var2', varName: 'val2' },
        { nodeId: 'var3', varName: 'val3' },
      ],
      connections: [
        { source: 'var1', sourceHandle: 'value', target: 'addNode', targetHandle: 'v0' },
        { source: 'var2', sourceHandle: 'value', target: 'addNode', targetHandle: 'v1' },
        { source: 'var3', sourceHandle: 'value', target: 'addNode', targetHandle: 'v2' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'addNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 50,
    });
  });

  // 2. VECTOR 2D MATH CALCULATION
  test('calculates 2D Euclidean distance using coordinate inputs', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Math Distance 2D - Pythagorean (0,0) to (3,4) = 5',
      entityName: 'MathDistEntity',
      scriptName: 'Script_MathDistance',
      variables: [
        { name: 'x1', type: 'number', value: 0 },
        { name: 'y1', type: 'number', value: 0 },
        { name: 'x2', type: 'number', value: 3 },
        { name: 'y2', type: 'number', value: 4 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varX1', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varY1', type: 'variableGet', pos: { x: 100, y: 280 } },
        { id: 'varX2', type: 'variableGet', pos: { x: 100, y: 360 } },
        { id: 'varY2', type: 'variableGet', pos: { x: 100, y: 440 } },
        { id: 'distNode', type: 'mathDistance2d', pos: { x: 380, y: 250 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varX1', varName: 'x1' },
        { nodeId: 'varY1', varName: 'y1' },
        { nodeId: 'varX2', varName: 'x2' },
        { nodeId: 'varY2', varName: 'y2' },
      ],
      connections: [
        { source: 'varX1', sourceHandle: 'value', target: 'distNode', targetHandle: 'x1' },
        { source: 'varY1', sourceHandle: 'value', target: 'distNode', targetHandle: 'y1' },
        { source: 'varX2', sourceHandle: 'value', target: 'distNode', targetHandle: 'x2' },
        { source: 'varY2', sourceHandle: 'value', target: 'distNode', targetHandle: 'y2' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'distNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 5,
    });
  });

  // 3. LOGIC COMPARISON & BRANCHING
  test('evaluates equality comparison and routes execution via true branch', async ({ blueprintRunner }) => {
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

  // 4. STRING FORMATTING & INTERPOLATION
  test('interpolates variable values into template format string', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'String Format Test',
      entityName: 'StringEntity_Format',
      scriptName: 'Script_StringFormat',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'formatNode',
          type: 'stringFormat',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            v0: { value: 85, type: 'number' },
            v1: { value: 100, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'formatNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Score: 85 / 100',
    });
  });

  // 5. LIST COLLECTION MANIPULATION
  test('retrieves collection item by index from list variable', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'List Get Test',
      entityName: 'ListEntity_Get',
      scriptName: 'Script_ListGet',
      variables: [{ name: 'fruitList', type: 'list', rawJson: ['Apple', 'Banana', 'Cherry'] }],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'listGet',
          type: 'listGet',
          pos: { x: 350, y: 200 },
          inspectorValues: { index: { value: 1, type: 'number' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'fruitList' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'listGet', targetHandle: 'list' },
        { source: 'listGet', sourceHandle: 'item', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Banana',
    });
  });

  // 6. MAP KEY-VALUE STORAGE
  test('retrieves mapped property value by string key', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Map Get Test',
      entityName: 'MapEntity_Get',
      scriptName: 'Script_MapGet',
      variables: [
        {
          name: 'playerStats',
          type: 'map',
          rawJson: { hp: 100 },
        },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'getVar', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'mapGet',
          type: 'mapGet',
          pos: { x: 350, y: 200 },
          inspectorValues: { key: { value: 'hp', type: 'string' } },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [{ nodeId: 'getVar', varName: 'playerStats' }],
      connections: [
        { source: 'getVar', sourceHandle: 'value', target: 'mapGet', targetHandle: 'map' },
        { source: 'mapGet', sourceHandle: 'value', target: 'notif', targetHandle: 'message' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 100,
    });
  });

  // 7. CONTROL LOOP RANGE ITERATION
  test('executes for loop range and outputs final index on completed', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'For Loop Range Test',
      entityName: 'LoopEntity_ForLoop',
      scriptName: 'Script_ForLoop',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'forLoop',
          type: 'logicLoop',
          pos: { x: 350, y: 100 },
          inspectorValues: {
            start: { value: 1, type: 'number' },
            end: { value: 3, type: 'number' },
            step: { value: 1, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'forLoop', targetHandle: 'execIn' },
        { source: 'forLoop', sourceHandle: 'completed', target: 'notif', targetHandle: 'execIn' },
        { source: 'forLoop', sourceHandle: 'index', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 3,
    });
  });

  // 8. RANGE INCLUSIVE CHECK
  test('evaluates in range inclusive boundary and outputs true boolean', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'In Range Test',
      entityName: 'RangeEntity_InRange',
      scriptName: 'Script_InRange',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'rangeNode',
          type: 'mathInRange',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            value: { value: 10, type: 'number' },
            min: { value: 0, type: 'number' },
            max: { value: 10, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'rangeNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: true,
    });
  });

  // 9. CLAMP LIMIT VALUE
  test('clamps number between specified min and max bounds', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Clamp Value Test',
      entityName: 'ClampEntity_Clamp',
      scriptName: 'Script_Clamp',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'clampNode',
          type: 'mathClamp',
          pos: { x: 350, y: 200 },
          inspectorValues: {
            value: { value: 150, type: 'number' },
            min: { value: 0, type: 'number' },
            max: { value: 100, type: 'number' },
          },
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'clampNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 100,
    });
  });

});
