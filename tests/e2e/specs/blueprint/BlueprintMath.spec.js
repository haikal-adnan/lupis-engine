// lokasi: tests/e2e/blueprint/BlueprintMath.spec.js
import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Math E2E',
    description: 'E2E runtime logic evaluation for Math operations (Add, Subtract, Multiply, Divide, Negate, Round, Distance 2D, Direction 2D) in engine preview',
  },
});

test.describe('Blueprint Math (math) E2E Testing', () => {

  // =========================================================================
  // BASIC ARITHMETIC & SEQUENTIAL DYNAMIC INPUTS
  // =========================================================================
  test.describe('Arithmetic nodes (add, subtract, multiply, divide)', () => {

    test('Evaluates math_add with two default inputs and dynamic third input', async ({ blueprintRunner }) => {
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
            dynamicInputs: [true], // Menambahkan port sekuensial v2 (Val 3)
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

    test('Evaluates math_subtract across two numbers (100 - 35)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Subtract - Basic Subtraction',
        entityName: 'MathSubEntity',
        scriptName: 'Script_MathSubtract',
        variables: [
          { name: 'a', type: 'number', value: 100 },
          { name: 'b', type: 'number', value: 35 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varA', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'varB', type: 'variableGet', pos: { x: 100, y: 350 } },
          { id: 'subNode', type: 'mathSubtract', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varA', varName: 'a' },
          { nodeId: 'varB', varName: 'b' },
        ],
        connections: [
          { source: 'varA', sourceHandle: 'value', target: 'subNode', targetHandle: 'v0' },
          { source: 'varB', sourceHandle: 'value', target: 'subNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'subNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 65,
      });
    });

    test('Evaluates math_multiply with direct inspector values (6 * 7)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Multiply - Direct Port Values',
        entityName: 'MathMulEntity',
        scriptName: 'Script_MathMultiply',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { 
            id: 'mulNode', 
            type: 'mathMultiply', 
            pos: { x: 350, y: 200 },
            inspectorValues: {
              v0: { value: 6, type: 'number' },
              v1: { value: 7, type: 'number' },
            },
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'mulNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 42,
      });
    });

    test('Evaluates math_divide normally (144 / 12)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Divide - Standard Division',
        entityName: 'MathDivEntity',
        scriptName: 'Script_MathDivide',
        variables: [
          { name: 'dividend', type: 'number', value: 144 },
          { name: 'divisor', type: 'number', value: 12 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'var2', type: 'variableGet', pos: { x: 100, y: 350 } },
          { id: 'divNode', type: 'mathDivide', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'var1', varName: 'dividend' },
          { nodeId: 'var2', varName: 'divisor' },
        ],
        connections: [
          { source: 'var1', sourceHandle: 'value', target: 'divNode', targetHandle: 'v0' },
          { source: 'var2', sourceHandle: 'value', target: 'divNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'divNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 12,
      });
    });

    test('Handles math_divide division by zero safely (returns 0)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Divide - Division by Zero Guard',
        entityName: 'MathDivZeroEntity',
        scriptName: 'Script_MathDivideZero',
        variables: [
          { name: 'dividend', type: 'number', value: 50 },
          { name: 'zeroDivisor', type: 'number', value: 0 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'var1', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'var2', type: 'variableGet', pos: { x: 100, y: 350 } },
          { id: 'divNode', type: 'mathDivide', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'var1', varName: 'dividend' },
          { nodeId: 'var2', varName: 'zeroDivisor' },
        ],
        connections: [
          { source: 'var1', sourceHandle: 'value', target: 'divNode', targetHandle: 'v0' },
          { source: 'var2', sourceHandle: 'value', target: 'divNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'divNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 0,
      });
    });
  });

  // =========================================================================
  // UNARY & ROUNDING NODES (NEGATE & ROUND)
  // =========================================================================
  test.describe('Unary and rounding nodes', () => {

    test('Evaluates math_negate to invert positive number to negative', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Negate - Invert Value',
        entityName: 'MathNegateEntity',
        scriptName: 'Script_MathNegate',
        variables: [
          { name: 'posVal', type: 'number', value: 85 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varA', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'negNode', type: 'mathNegate', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varA', varName: 'posVal' },
        ],
        connections: [
          { source: 'varA', sourceHandle: 'value', target: 'negNode', targetHandle: 'a' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'negNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: -85,
      });
    });

    test('Evaluates math_round with default method (floor)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Round - Default Floor (4.8 -> 4)',
        entityName: 'MathFloorEntity',
        scriptName: 'Script_MathFloor',
        variables: [
          { name: 'floatVal', type: 'number', value: 4.8 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'roundNode', type: 'mathRound', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varVal', varName: 'floatVal' },
        ],
        connections: [
          { source: 'varVal', sourceHandle: 'value', target: 'roundNode', targetHandle: 'value' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'roundNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 4,
      });
    });

    test('Evaluates math_round with ceil method configured via topLevelData', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Round - Ceil Method (4.2 -> 5)',
        entityName: 'MathCeilEntity',
        scriptName: 'Script_MathCeil',
        variables: [
          { name: 'floatVal', type: 'number', value: 4.2 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varVal', type: 'variableGet', pos: { x: 100, y: 250 } },
          { 
            id: 'roundNode', 
            type: 'mathRound', 
            pos: { x: 350, y: 250 },
            topLevelData: {
              method: { value: 'ceil', type: 'text' },
            },
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varVal', varName: 'floatVal' },
        ],
        connections: [
          { source: 'varVal', sourceHandle: 'value', target: 'roundNode', targetHandle: 'value' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'roundNode', sourceHandle: 'result', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 5,
      });
    });
  });

  // =========================================================================
  // 2D VECTOR MATH NODES (DISTANCE 2D & DIRECTION 2D)
  // =========================================================================
  test.describe('2D vector math nodes', () => {

    test('Evaluates math_distance_2d using 3-4-5 right triangle coordinates', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Distance 2D - (0,0) to (3,4) = 5',
        entityName: 'MathDistEntity',
        scriptName: 'Script_MathDistance2D',
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

    test('Evaluates math_direction_2d angle output pointing straight up (90 degrees)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Direction 2D - Angle (0,0) to (0,10) = 90 Deg',
        entityName: 'MathDirAngleEntity',
        scriptName: 'Script_MathDirectionAngle',
        variables: [
          { name: 'fromX', type: 'number', value: 0 },
          { name: 'fromY', type: 'number', value: 0 },
          { name: 'toX', type: 'number', value: 0 },
          { name: 'toY', type: 'number', value: 10 },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varFX', type: 'variableGet', pos: { x: 100, y: 200 } },
          { id: 'varFY', type: 'variableGet', pos: { x: 100, y: 280 } },
          { id: 'varTX', type: 'variableGet', pos: { x: 100, y: 360 } },
          { id: 'varTY', type: 'variableGet', pos: { x: 100, y: 440 } },
          { id: 'dirNode', type: 'mathDirection2d', pos: { x: 380, y: 250 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varFX', varName: 'fromX' },
          { nodeId: 'varFY', varName: 'fromY' },
          { nodeId: 'varTX', varName: 'toX' },
          { nodeId: 'varTY', varName: 'toY' },
        ],
        connections: [
          { source: 'varFX', sourceHandle: 'value', target: 'dirNode', targetHandle: 'fromX' },
          { source: 'varFY', sourceHandle: 'value', target: 'dirNode', targetHandle: 'fromY' },
          { source: 'varTX', sourceHandle: 'value', target: 'dirNode', targetHandle: 'toX' },
          { source: 'varTY', sourceHandle: 'value', target: 'dirNode', targetHandle: 'toY' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'dirNode', sourceHandle: 'angle', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 90,
      });
    });

    test('Evaluates math_direction_2d normalized Dir X output pointing right (1)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Direction 2D - Normalized Dir X (0,0) to (25,0) = 1',
        entityName: 'MathDirXEntity',
        scriptName: 'Script_MathDirectionX',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { 
            id: 'dirNode', 
            type: 'mathDirection2d', 
            pos: { x: 380, y: 200 },
            inspectorValues: {
              fromX: { value: 0, type: 'number' },
              fromY: { value: 0, type: 'number' },
              toX: { value: 25, type: 'number' },
              toY: { value: 0, type: 'number' },
            },
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'dirNode', sourceHandle: 'directionX', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 1,
      });
    });

    test('Handles math_direction_2d zero-distance safely (returns 0 for Dir X/Y)', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Math Direction 2D - Same Point Guard (5,5) to (5,5) = 0',
        entityName: 'MathDirZeroEntity',
        scriptName: 'Script_MathDirectionZero',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { 
            id: 'dirNode', 
            type: 'mathDirection2d', 
            pos: { x: 380, y: 200 },
            inspectorValues: {
              fromX: { value: 5, type: 'number' },
              fromY: { value: 5, type: 'number' },
              toX: { value: 5, type: 'number' },
              toY: { value: 5, type: 'number' },
            },
          },
          { id: 'notif', type: 'uiNotification', pos: { x: 680, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'dirNode', sourceHandle: 'directionY', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 0,
      });
    });
  });
});