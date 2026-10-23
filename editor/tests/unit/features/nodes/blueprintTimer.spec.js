import { describe, it, expect, vi } from 'vitest';
import { findBlueprintByType, ALL_BLUEPRINTS } from '../../../../src/features/nodes/library/blueprints/index.js';
import { BlueprintFlow } from '../../../../src/features/nodes/library/blueprints/BlueprintFlow.js';
import { validateCodePanelContract } from '../../../../src/features/nodes/contract/codePanelContract.js';

describe('BlueprintTimer (logicTimer) Specification (Seconds & Decimals)', () => {
  function createTestEnvironment(inputs = {}, initialState = {}) {
    const outputs = {};
    const flowTriggers = [];
    let tickListener = null;

    const context = {
      state: { ...initialState },
      dt: 0.016,
      deltaTime: 0.016,
      currentInputPort: 'execIn',
      triggerFlow: vi.fn((portId) => {
        outputs[portId] = true;
        flowTriggers.push(portId);
      }),
      onTick: vi.fn((cb) => {
        tickListener = cb;
      }),
      assert: {
        exists: vi.fn((v) => v),
        isNumber: vi.fn((v) => typeof v === 'number')
      },
      console: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    };

    const nodeDef = findBlueprintByType('logicTimer');
    const fn = new Function('inputs', 'outputs', 'context', 'node', nodeDef.defaultData.data.code);

    const execute = (overrideInputs = null) => {
      fn(overrideInputs || inputs, outputs, context, nodeDef.defaultData);
    };

    const tick = (deltaSeconds) => {
      if (tickListener) {
        tickListener(deltaSeconds);
      }
    };

    return {
      nodeDef,
      outputs,
      context,
      flowTriggers,
      execute,
      tick
    };
  }

  describe('1. Registration, Metadata & Contract Conformance', () => {
    it('is registered in BlueprintFlow and findable by type', () => {
      const node = findBlueprintByType('logicTimer');
      expect(node).toBeDefined();
      expect(node.type).toBe('logicTimer');
      expect(node.label).toBe('Timer');
      expect(node.defaultData.settings.category).toBe('Flow & Logic');
      expect(BlueprintFlow.items.some(i => i.type === 'logicTimer')).toBe(true);
    });

    it('has all canonical input and output ports without label properties and duration in seconds', () => {
      const node = findBlueprintByType('logicTimer');
      const inputIds = node.defaultData.inputs.map(p => p.id);
      const outputIds = node.defaultData.outputs.map(p => p.id);

      expect(inputIds).toEqual(['execIn', 'duration', 'isLooping', 'reset']);
      expect(outputIds).toEqual(['onUpdate', 'onComplete', 'elapsedTime', 'remainingTime', 'progress', 'isActive']);

      const durationInput = node.defaultData.inputs.find(p => p.id === 'duration');
      expect(durationInput.defaultValue).toBe(1);

      [...node.defaultData.inputs, ...node.defaultData.outputs].forEach(port => {
        expect(port.label).toBeUndefined();
        expect(port.id).toBeDefined();
        expect(port.dataType).toBeDefined();
        expect(port.color).toBeDefined();
      });
    });

    it('passes codePanelContract validation with 0 issues', () => {
      const node = findBlueprintByType('logicTimer');
      const nodeInstance = {
        id: 'timer_test_1',
        type: node.type,
        inputs: node.defaultData.inputs,
        outputs: node.defaultData.outputs,
        data: node.defaultData.data
      };

      const result = validateCodePanelContract(nodeInstance);
      expect(result.isValid).toBe(true);
      expect(result.issues).toEqual([]);
    });
  });

  describe('2. Single-shot Timer Execution & Tick Updates in Seconds', () => {
    it('initializes output values in seconds and starts timer on execute', () => {
      const env = createTestEnvironment({ duration: 1.5, isLooping: false, reset: false });
      env.execute();

      expect(env.outputs.elapsedTime).toBe(0);
      expect(env.outputs.remainingTime).toBe(1.5);
      expect(env.outputs.progress).toBe(0);
      expect(env.outputs.isActive).toBe(true);
      expect(env.outputs.onUpdate).toBe(false);
      expect(env.outputs.onComplete).toBe(false);
      expect(env.context.onTick).toHaveBeenCalled();
    });

    it('updates elapsed time, remaining time, and progress on each tick using seconds and decimals', () => {
      const env = createTestEnvironment({ duration: 1.0, isLooping: false, reset: false });
      env.execute();

      // Tick 0.25s
      env.tick(0.25);
      expect(env.outputs.elapsedTime).toBeCloseTo(0.25, 4);
      expect(env.outputs.remainingTime).toBeCloseTo(0.75, 4);
      expect(env.outputs.progress).toBeCloseTo(0.25, 4);
      expect(env.outputs.isActive).toBe(true);
      expect(env.outputs.onUpdate).toBe(true);
      expect(env.flowTriggers).toContain('onUpdate');
      expect(env.outputs.onComplete).toBe(false);

      // Tick 0.5s -> total 0.75s
      env.tick(0.5);
      expect(env.outputs.elapsedTime).toBeCloseTo(0.75, 4);
      expect(env.outputs.remainingTime).toBeCloseTo(0.25, 4);
      expect(env.outputs.progress).toBeCloseTo(0.75, 4);
    });

    it('triggers onComplete, clamps values, and deactivates timer when duration is reached', () => {
      const env = createTestEnvironment({ duration: 1.0, isLooping: false, reset: false });
      env.execute();

      // Tick 1.2s (1.2s >= 1.0s duration)
      env.tick(1.2);
      expect(env.outputs.elapsedTime).toBe(1.0);
      expect(env.outputs.remainingTime).toBe(0);
      expect(env.outputs.progress).toBe(1);
      expect(env.outputs.isActive).toBe(false);
      expect(env.outputs.onComplete).toBe(true);
      expect(env.flowTriggers).toContain('onComplete');

      // Subsequent tick should do nothing because isActive is false
      env.outputs.onUpdate = false;
      env.outputs.onComplete = false;
      env.tick(0.5);
      expect(env.outputs.onUpdate).toBe(false);
      expect(env.outputs.onComplete).toBe(false);
    });
  });

  describe('3. Looping Timer Execution in Seconds', () => {
    it('wraps elapsed time in seconds and stays active when isLooping is true', () => {
      const env = createTestEnvironment({ duration: 1.0, isLooping: true, reset: false });
      env.execute();

      // Tick 1.2s -> completes first loop and wraps to ~0.2s
      env.tick(1.2);
      expect(env.outputs.onComplete).toBe(true);
      expect(env.outputs.isActive).toBe(true);
      expect(env.context.state.elapsedTime).toBeCloseTo(0.2, 4);

      // Next tick 0.3s -> total 0.5s in second loop
      env.tick(0.3);
      expect(env.outputs.elapsedTime).toBeCloseTo(0.5, 4);
      expect(env.outputs.remainingTime).toBeCloseTo(0.5, 4);
      expect(env.outputs.progress).toBeCloseTo(0.5, 4);
      expect(env.outputs.isActive).toBe(true);
    });
  });

  describe('4. Zero/Negative Duration & Reset Handling', () => {
    it('immediately finishes when duration is zero or negative', () => {
      const env = createTestEnvironment({ duration: 0, isLooping: false, reset: false });
      env.execute();

      expect(env.outputs.elapsedTime).toBe(0);
      expect(env.outputs.remainingTime).toBe(0);
      expect(env.outputs.progress).toBe(1);
      expect(env.outputs.isActive).toBe(false);
      expect(env.outputs.onComplete).toBe(true);
      expect(env.flowTriggers).toContain('onComplete');
    });

    it('stops and clears timer when reset input is true', () => {
      const env = createTestEnvironment({ duration: 2.5, isLooping: false, reset: false });
      env.execute();

      env.tick(0.75); // elapsed 0.75s
      expect(env.outputs.elapsedTime).toBeCloseTo(0.75, 4);
      expect(env.outputs.isActive).toBe(true);

      // Trigger with reset: true
      env.execute({ duration: 2.5, isLooping: false, reset: true });
      expect(env.outputs.isActive).toBe(false);
      expect(env.outputs.elapsedTime).toBe(0);
      expect(env.outputs.remainingTime).toBe(2.5);
      expect(env.outputs.progress).toBe(0);
      expect(env.context.state.isActive).toBe(false);
      expect(env.context.state.elapsedTime).toBe(0);
    });

    it('handles decimal durations cleanly (e.g. 0.5s)', () => {
      const env = createTestEnvironment({ duration: 0.5, isLooping: false, reset: false });
      env.execute();

      env.tick(0.25);
      expect(env.outputs.elapsedTime).toBeCloseTo(0.25, 4);
      expect(env.outputs.remainingTime).toBeCloseTo(0.25, 4);
      expect(env.outputs.progress).toBeCloseTo(0.5, 4);
      expect(env.outputs.isActive).toBe(true);
      expect(env.outputs.onComplete).toBe(false);

      env.tick(0.25);
      expect(env.outputs.elapsedTime).toBe(0.5);
      expect(env.outputs.remainingTime).toBe(0);
      expect(env.outputs.progress).toBe(1);
      expect(env.outputs.isActive).toBe(false);
      expect(env.outputs.onComplete).toBe(true);
    });
  });
});
