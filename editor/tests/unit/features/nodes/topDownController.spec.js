import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import ColliderSystem from '@core/System/ColliderSystem.js';
import PhysicsSystem from '@core/System/PhysicsSystem.js';
import { BlueprintTopDown } from '@nodes/library/blueprints/BlueprintTopDown.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('topDownController Blueprint & Runtime Tests', () => {
  const ctrlDef = BlueprintTopDown.items.find(i => i.type === 'topDownController');

  it('is registered with correct metadata in BlueprintTopDown and BlueprintHelperTool', () => {
    expect(ctrlDef).toBeDefined();
    expect(ctrlDef.label).toBe('Top-Down Controller');
    expect(ctrlDef.defaultData.settings.category).toBe('Helper & Tool');

    const inHelperTool = BlueprintHelperTool.items.find(i => i.type === 'topDownController');
    expect(inHelperTool).toBeDefined();

    const inputIds = ctrlDef.defaultData.inputs.map(i => i.id);
    expect(inputIds).toContain('keyUp');
    expect(inputIds).toContain('keyDown');
    expect(inputIds).toContain('keyLeft');
    expect(inputIds).toContain('keyRight');
    expect(inputIds).toContain('keySprint');
    expect(inputIds).toContain('normalizeDiagonal');
    expect(inputIds).toContain('faceMouse');
    expect(inputIds).not.toContain('axisX');
    expect(inputIds).not.toContain('axisY');

    const outputIds = ctrlDef.defaultData.outputs.map(o => o.id);
    expect(outputIds).toContain('execOut');
    expect(outputIds).toContain('onMove');
    expect(outputIds).toContain('onStop');
    expect(outputIds).toContain('onSprint');
    expect(outputIds).toContain('isMoving');
    expect(outputIds).toContain('isSprinting');
    expect(outputIds).toContain('movementState');
    expect(outputIds).toContain('facingDirection');
    expect(outputIds).toContain('facingAngle');
    expect(outputIds).toContain('velocityX');
    expect(outputIds).toContain('velocityY');
  });

  function createTestEnvironment(customTargetProps = {}) {
    const targetEntity = {
      id: 'player_topdown',
      scriptId: 'player_topdown',
      components: {
        Transform: { x: 100, y: 100, width: 32, height: 32, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5, rotation: 0 },
        Physics: {
          enabled: true,
          gravityScale: 0,
          velocityX: 0,
          velocityY: 0,
          facingDirection: 'down'
        },
        ...customTargetProps
      }
    };

    const mockGame = {
      world: {
        settings: { physics: { gravity: 0 } },
        entities: [targetEntity],
        layersWorld: [{ _id: 'layer1', visible: true, active: true }],
        layersUI: []
      }
    };

    const colliderSystem = new ColliderSystem(mockGame);
    mockGame.colliderSystem = colliderSystem;
    const physicsSystem = new PhysicsSystem(mockGame);
    mockGame.physicsSystem = physicsSystem;
    const contextSystem = new ContextSystem(mockGame);
    mockGame.contextSystem = contextSystem;

    let downKeys = new Set();
    let mousePos = { x: 100, y: 100 };

    mockGame.input = {
      keyboard: {
        isDown: (k) => downKeys.has(String(k).toLowerCase()),
        isPressed: () => false,
        isReleased: () => false
      },
      mouse: {
        getPosition: () => mousePos
      }
    };

    const script = {
      id: 'test_topdown_script',
      nodes: [
        {
          id: 'node_td_ctrl_1',
          type: 'topDownController',
          inputs: ctrlDef.defaultData.inputs,
          outputs: ctrlDef.defaultData.outputs,
          data: {
            values: { ...ctrlDef.defaultData.data.values, targetEntity: 'player_topdown' },
            code: ctrlDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script);
    runner.owner = targetEntity;

    const flowSpy = vi.spyOn(runner, 'executeFlow');

    const setKey = (held = []) => {
      downKeys = new Set(held);
    };

    const runController = (inputOverrides = {}) => {
      Object.assign(script.nodes[0].data.values, inputOverrides);
      runner._executeNodeLogic(script.nodes[0], 'execIn');
      return runner.nodeOutputs.get('node_td_ctrl_1');
    };

    return { targetEntity, mockGame, setKey, setMousePos: (p) => { mousePos = p; }, runController, node: script.nodes[0], flowSpy };
  }

  it('remains idle when no keys are pressed', () => {
    const { runController, flowSpy } = createTestEnvironment();
    const result = runController();

    expect(flowSpy).toHaveBeenCalledWith('node_td_ctrl_1', 'execOut');
    expect(result.isMoving).toBe(false);
    expect(result.isSprinting).toBe(false);
    expect(result.movementState).toBe('idle');
    expect(result.velocityX).toBe(0);
    expect(result.velocityY).toBe(0);
  });

  it('moves right with correct velocity and facing direction when D is pressed', () => {
    const { setKey, runController, targetEntity, flowSpy } = createTestEnvironment();
    setKey(['d']);

    const result = runController();

    expect(flowSpy).toHaveBeenCalledWith('node_td_ctrl_1', 'onMove');
    expect(result.isMoving).toBe(true);
    expect(result.movementState).toBe('walk');
    expect(result.facingDirection).toBe('right');
    expect(result.facingAngle).toBe(0);
    expect(result.velocityX).toBe(200);
    expect(result.velocityY).toBe(0);
    expect(targetEntity.components.Physics.velocityX).toBe(200);
  });

  it('moves up with correct velocity and facing direction when W is pressed', () => {
    const { setKey, runController } = createTestEnvironment();
    setKey(['w']);

    const result = runController();

    expect(result.isMoving).toBe(true);
    expect(result.movementState).toBe('walk');
    expect(result.facingDirection).toBe('up');
    expect(result.facingAngle).toBe(270);
    expect(result.velocityX).toBe(0);
    expect(result.velocityY).toBe(-200);
  });

  it('normalizes diagonal speed by default when W and D are pressed', () => {
    const { setKey, runController } = createTestEnvironment();
    setKey(['w', 'd']);

    const result = runController({ normalizeDiagonal: true });

    expect(result.isMoving).toBe(true);
    const expectedComp = 200 * (1 / Math.SQRT2);
    expect(result.velocityX).toBeCloseTo(expectedComp, 2);
    expect(result.velocityY).toBeCloseTo(-expectedComp, 2);

    const speedMagnitude = Math.hypot(result.velocityX, result.velocityY);
    expect(speedMagnitude).toBeCloseTo(200, 2);
  });

  it('does not normalize diagonal speed when normalizeDiagonal is false', () => {
    const { setKey, runController } = createTestEnvironment();
    setKey(['w', 'd']);

    const result = runController({ normalizeDiagonal: false });

    expect(result.velocityX).toBe(200);
    expect(result.velocityY).toBe(-200);
    const speedMagnitude = Math.hypot(result.velocityX, result.velocityY);
    expect(speedMagnitude).toBeCloseTo(282.84, 1);
  });

  it('multiplies speed and sets run state when sprint key is held', () => {
    const { setKey, runController, flowSpy } = createTestEnvironment();
    setKey(['d', 'shift']);

    const result = runController({ speed: 200, sprintMultiplier: 1.5 });

    expect(result.isMoving).toBe(true);
    expect(result.isSprinting).toBe(true);
    expect(result.movementState).toBe('run');
    expect(result.velocityX).toBe(300);
    expect(flowSpy).toHaveBeenCalledWith('node_td_ctrl_1', 'onSprint');
  });

  it('triggers onStop when stopping after moving', () => {
    const { setKey, runController, flowSpy } = createTestEnvironment();
    setKey(['d']);
    runController();

    setKey([]);
    const stopResult = runController();

    expect(stopResult.isMoving).toBe(false);
    expect(flowSpy).toHaveBeenCalledWith('node_td_ctrl_1', 'onStop');
  });
});
