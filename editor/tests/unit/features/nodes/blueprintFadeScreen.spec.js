import { describe, it, expect, vi } from 'vitest';
import { findBlueprintByType, ALL_BLUEPRINTS } from '../../../../src/features/nodes/library/blueprints/index.js';
import { BlueprintRenderer } from '../../../../src/features/nodes/library/blueprints/BlueprintRenderer.js';
import { validateCodePanelContract } from '../../../../src/features/nodes/contract/codePanelContract.js';
import TransitionSystem from '../../../../../core/System/TransitionSystem.js';

describe('Blueprint Fade Screen (actionFadeScreen) - Seconds & Decimals', () => {
  it('is registered with duration in seconds (defaultValue: 1.0)', () => {
    const node = findBlueprintByType('actionFadeScreen');
    expect(node).toBeDefined();
    expect(node.type).toBe('actionFadeScreen');
    expect(node.defaultData.settings.category).toBe('Rendering & Camera');

    const durationInput = node.defaultData.inputs.find(i => i.id === 'duration');
    expect(durationInput).toBeDefined();
    expect(durationInput.defaultValue).toBe(1.0);
    expect(node.defaultData.data.values.duration).toBe(1.0);
  });

  it('complies strictly with code panel contract guidelines', () => {
    const node = findBlueprintByType('actionFadeScreen');
    const result = validateCodePanelContract(node.defaultData.data?.code, {
      node: node.defaultData,
      blueprint: BlueprintRenderer
    });
    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('executes and forwards duration in seconds to context.transition.fade', () => {
    const node = findBlueprintByType('actionFadeScreen');
    const fn = new Function('inputs', 'outputs', 'context', 'node', node.defaultData.data.code);

    let fadeArgs = null;
    let flowTriggered = null;

    const mockContext = {
      transition: {
        fade: vi.fn((mode, duration, color, onComplete) => {
          fadeArgs = { mode, duration, color, onComplete };
        })
      },
      triggerFlow: vi.fn((port) => {
        flowTriggered = port;
      })
    };

    const outputs = {};
    fn({ mode: 'fade_out', duration: 1.5, color: '#FF0000' }, outputs, mockContext, node.defaultData);

    expect(outputs.execOut).toBe(true);
    expect(mockContext.transition.fade).toHaveBeenCalled();
    expect(fadeArgs.mode).toBe('fade_out');
    expect(fadeArgs.duration).toBe(1.5);
    expect(fadeArgs.color).toBe('#FF0000');

    // Simulate completion
    expect(outputs.onComplete).toBeUndefined();
    fadeArgs.onComplete();
    expect(outputs.onComplete).toBe(true);
    expect(flowTriggered).toBe('onComplete');
  });

  it('defaults to 1.0 second when duration is not provided or invalid', () => {
    const node = findBlueprintByType('actionFadeScreen');
    const fn = new Function('inputs', 'outputs', 'context', 'node', node.defaultData.data.code);

    let fadeDuration = null;
    const mockContext = {
      transition: {
        fade: vi.fn((mode, duration, color, onComplete) => {
          fadeDuration = duration;
        })
      },
      triggerFlow: vi.fn()
    };

    fn({ mode: 'fade_in', duration: 'invalid' }, {}, mockContext, node.defaultData);
    expect(fadeDuration).toBe(1.0);
  });

  it('operates directly in seconds with TransitionSystem', () => {
    const mockGame = {
      canvas: { width: 800, height: 600 }
    };
    const ts = new TransitionSystem(mockGame);

    let completed = false;
    ts.fadeOut(0.5, '#000000', () => {
      completed = true;
    });

    expect(ts.active).toBe(true);
    expect(ts.duration).toBe(0.5);
    expect(ts.state).toBe('fade_out');

    // Tick 0.1s x 2 = 0.2s
    ts.update(0.1);
    ts.update(0.1);
    expect(ts.timer).toBeCloseTo(0.2, 4);
    expect(completed).toBe(false);
    expect(ts.alpha).toBeGreaterThan(0.2);

    // Tick 0.1s x 3 = 0.3s (total 0.5s)
    ts.update(0.1);
    ts.update(0.1);
    ts.update(0.1);
    expect(ts.timer).toBeCloseTo(0.5, 4);
    expect(completed).toBe(true);
    expect(ts.state).toBe('none');
    expect(ts.alpha).toBe(1.0);
  });

  it('supports decimal duration for fadeIn and completes properly', () => {
    const mockGame = {};
    const ts = new TransitionSystem(mockGame);

    let completed = false;
    ts.fadeIn(0.2, '#000000', () => {
      completed = true;
    });

    expect(ts.duration).toBe(0.2);
    expect(ts.state).toBe('fade_in');
    expect(ts.alpha).toBe(1.0);

    // Update with 0.1s dt
    ts.update(0.1);
    expect(completed).toBe(false);
    expect(ts.alpha).toBeLessThan(1.0);

    // Update with another 0.1s dt (total 0.2s)
    ts.update(0.1);
    expect(completed).toBe(true);
    expect(ts.state).toBe('none');
    expect(ts.active).toBe(false);
    expect(ts.alpha).toBe(0.0);
  });
});
