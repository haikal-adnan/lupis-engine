// lokasi: tests/e2e/blueprint/BlueprintMath.spec.js
import { test } from '../fixtures.js';

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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'var1', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'var2', type: 'variable_get', pos: { x: 100, y: 300 } },
          { id: 'var3', type: 'variable_get', pos: { x: 100, y: 400 } },
          { 
            id: 'addNode', 
            type: 'math_add', 
            pos: { x: 350, y: 250 },
            dynamicInputs: [true], // Menambahkan port sekuensial v2 (Val 3)
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'var1', varName: 'val1' },
          { nodeId: 'var2', varName: 'val2' },
          { nodeId: 'var3', varName: 'val3' },
        ],
        connections: [
          { source: 'var1', sourceHandle: 'out_0', target: 'addNode', targetHandle: 'v0' },
          { source: 'var2', sourceHandle: 'out_0', target: 'addNode', targetHandle: 'v1' },
          { source: 'var3', sourceHandle: 'out_0', target: 'addNode', targetHandle: 'v2' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'addNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varA', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'varB', type: 'variable_get', pos: { x: 100, y: 350 } },
          { id: 'subNode', type: 'math_subtract', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varA', varName: 'a' },
          { nodeId: 'varB', varName: 'b' },
        ],
        connections: [
          { source: 'varA', sourceHandle: 'out_0', target: 'subNode', targetHandle: 'v0' },
          { source: 'varB', sourceHandle: 'out_0', target: 'subNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'subNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { 
            id: 'mulNode', 
            type: 'math_multiply', 
            pos: { x: 350, y: 200 },
            inspectorValues: {
              v0: { value: 6, type: 'number' },
              v1: { value: 7, type: 'number' },
            },
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'mulNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'var2', type: 'variable_get', pos: { x: 100, y: 350 } },
          { id: 'divNode', type: 'math_divide', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'var1', varName: 'dividend' },
          { nodeId: 'var2', varName: 'divisor' },
        ],
        connections: [
          { source: 'var1', sourceHandle: 'out_0', target: 'divNode', targetHandle: 'v0' },
          { source: 'var2', sourceHandle: 'out_0', target: 'divNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'divNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'var1', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'var2', type: 'variable_get', pos: { x: 100, y: 350 } },
          { id: 'divNode', type: 'math_divide', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'var1', varName: 'dividend' },
          { nodeId: 'var2', varName: 'zeroDivisor' },
        ],
        connections: [
          { source: 'var1', sourceHandle: 'out_0', target: 'divNode', targetHandle: 'v0' },
          { source: 'var2', sourceHandle: 'out_0', target: 'divNode', targetHandle: 'v1' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'divNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varA', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'negNode', type: 'math_negate', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varA', varName: 'posVal' },
        ],
        connections: [
          { source: 'varA', sourceHandle: 'out_0', target: 'negNode', targetHandle: 'a' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'negNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'roundNode', type: 'math_round', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varVal', varName: 'floatVal' },
        ],
        connections: [
          { source: 'varVal', sourceHandle: 'out_0', target: 'roundNode', targetHandle: 'val' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'roundNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varVal', type: 'variable_get', pos: { x: 100, y: 250 } },
          { 
            id: 'roundNode', 
            type: 'math_round', 
            pos: { x: 350, y: 250 },
            topLevelData: {
              method: { value: 'ceil', type: 'text' },
            },
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varVal', varName: 'floatVal' },
        ],
        connections: [
          { source: 'varVal', sourceHandle: 'out_0', target: 'roundNode', targetHandle: 'val' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'roundNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varX1', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varY1', type: 'variable_get', pos: { x: 100, y: 280 } },
          { id: 'varX2', type: 'variable_get', pos: { x: 100, y: 360 } },
          { id: 'varY2', type: 'variable_get', pos: { x: 100, y: 440 } },
          { id: 'distNode', type: 'math_distance_2d', pos: { x: 380, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 680, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varX1', varName: 'x1' },
          { nodeId: 'varY1', varName: 'y1' },
          { nodeId: 'varX2', varName: 'x2' },
          { nodeId: 'varY2', varName: 'y2' },
        ],
        connections: [
          { source: 'varX1', sourceHandle: 'out_0', target: 'distNode', targetHandle: 'x1' },
          { source: 'varY1', sourceHandle: 'out_0', target: 'distNode', targetHandle: 'y1' },
          { source: 'varX2', sourceHandle: 'out_0', target: 'distNode', targetHandle: 'x2' },
          { source: 'varY2', sourceHandle: 'out_0', target: 'distNode', targetHandle: 'y2' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'distNode', sourceHandle: 'res', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varFX', type: 'variable_get', pos: { x: 100, y: 200 } },
          { id: 'varFY', type: 'variable_get', pos: { x: 100, y: 280 } },
          { id: 'varTX', type: 'variable_get', pos: { x: 100, y: 360 } },
          { id: 'varTY', type: 'variable_get', pos: { x: 100, y: 440 } },
          { id: 'dirNode', type: 'math_direction_2d', pos: { x: 380, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 680, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varFX', varName: 'fromX' },
          { nodeId: 'varFY', varName: 'fromY' },
          { nodeId: 'varTX', varName: 'toX' },
          { nodeId: 'varTY', varName: 'toY' },
        ],
        connections: [
          { source: 'varFX', sourceHandle: 'out_0', target: 'dirNode', targetHandle: 'from_x' },
          { source: 'varFY', sourceHandle: 'out_0', target: 'dirNode', targetHandle: 'from_y' },
          { source: 'varTX', sourceHandle: 'out_0', target: 'dirNode', targetHandle: 'to_x' },
          { source: 'varTY', sourceHandle: 'out_0', target: 'dirNode', targetHandle: 'to_y' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'dirNode', sourceHandle: 'angle', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { 
            id: 'dirNode', 
            type: 'math_direction_2d', 
            pos: { x: 380, y: 200 },
            inspectorValues: {
              from_x: { value: 0, type: 'number' },
              from_y: { value: 0, type: 'number' },
              to_x: { value: 25, type: 'number' },
              to_y: { value: 0, type: 'number' },
            },
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 680, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'dirNode', sourceHandle: 'dir_x', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { 
            id: 'dirNode', 
            type: 'math_direction_2d', 
            pos: { x: 380, y: 200 },
            inspectorValues: {
              from_x: { value: 5, type: 'number' },
              from_y: { value: 5, type: 'number' },
              to_x: { value: 5, type: 'number' },
              to_y: { value: 5, type: 'number' },
            },
          },
          { id: 'notif', type: 'ui_notification', pos: { x: 680, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'dirNode', sourceHandle: 'dir_y', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 0,
      });
    });
  });
});