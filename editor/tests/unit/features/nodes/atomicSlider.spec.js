import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('Atomic Slider Blueprint & Execution Tests', () => {
  const sliderDef = BlueprintHelperTool.items.find(i => i.type === 'atomicSlider');

  it('is registered in BlueprintHelperTool with correct metadata', () => {
    expect(sliderDef).toBeDefined();
    expect(sliderDef.label).toBe('Atomic Slider');
    expect(sliderDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(sliderDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn', 'barEntity', 'handlerEntity', 'value', 'min', 'max', 'step', 'isInteractive', 'reverse'
    ]);
    const reverseInput = sliderDef.defaultData.inputs.find(i => i.id === 'reverse');
    expect(reverseInput).toBeDefined();
    expect(reverseInput.dataType).toBe('boolean');
    expect(sliderDef.defaultData.data.values.reverse).toBe(false);
    expect(sliderDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut', 'onChanged', 'value', 'normalized'
    ]);
  });

  function createMockGame(entities) {
    let pointerState = { x: 0, y: 0, down: false };
    const mockGame = {
      deltaTime: 0.016,
      camera: { x: 0, y: 0, scale: 1 },
      canvas: { width: 1920, height: 1080 },
      world: {
        entities,
        settings: { ui: { width: 1920, height: 1080 } }
      },
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        once: vi.fn()
      },
      input: {
        getPointer: vi.fn(() => pointerState),
        mouse: {
          isDown: vi.fn(() => pointerState.down),
          isPressed: vi.fn(() => false)
        },
        isPointerOver: vi.fn(() => false)
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return { mockGame, setPointer: (p) => { pointerState = p; } };
  }

  it('handles arbitrary max value (e.g. 0 to 160) and computes value and normalized output', () => {
    const bar = {
      id: 'Bar160',
      scriptId: 'Bar160',
      components: {
        UITransform: { x: 100, y: 100, width: 320, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
        ShapeRenderer: { width: 320, height: 20 }
      }
    };

    const handler = {
      id: 'Handler160',
      scriptId: 'Handler160',
      components: {
        UITransform: { x: 0, y: 100, width: 24, height: 24, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar, handler]);

    const scriptData = {
      id: 'test_atomic_slider_160',
      nodes: [
        {
          id: 'sliderNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'Bar160',
              handlerEntity: 'Handler160',
              value: 160,
              min: 0,
              max: 160,
              step: 1,
              isInteractive: true
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Initial tick at 160 (full)
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    let outputs = runner.nodeOutputs.get('sliderNode');
    expect(outputs.value).toBe(160);
    expect(outputs.normalized).toBe(1);
    expect(bar.components.UITransform.width).toBe(320);

    const executeFlowSpy = vi.spyOn(runner, 'executeFlow');

    // Drag to midpoint: bar starts at x=100, width=320, midpoint = 100 + 160 = 260
    setPointer({ x: 260, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('sliderNode');
    expect(outputs.value).toBe(80);
    expect(outputs.normalized).toBe(0.5);
    expect(executeFlowSpy).toHaveBeenCalledWith('sliderNode', 'onChanged');
    expect(bar.components.UITransform.width).toBe(160);
    expect(handler.components.UITransform.x).toBe(100 + 160); // localLeft + (0.5 * 320)

    // Drag to quarter (25% = 40): x = 100 + 80 = 180
    setPointer({ x: 180, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('sliderNode');
    expect(outputs.value).toBe(40);
    expect(outputs.normalized).toBe(0.25);
    expect(bar.components.UITransform.width).toBe(80);

    // Release mouse
    setPointer({ x: 180, y: 105, down: false });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('sliderNode');
    expect(outputs.value).toBe(40);
  });

  it('properly calculates child handler position without 1.5x over-travel when handler is parented to bar entity', () => {
    // Bar centered on screen (pivot 0.5, width 360, x = -270)
    const bar = {
      id: 'BarParent',
      scriptId: 'BarParent',
      components: {
        UITransform: { x: -270, y: 0, width: 360, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 },
        SpriteRenderer: { sourceX: 0, sourceY: 0, sourceWidth: 360, sourceHeight: 20 }
      }
    };

    // Handler is child of bar
    const handler = {
      id: 'HandlerChild',
      scriptId: 'HandlerChild',
      parentId: 'BarParent',
      components: {
        UITransform: { x: 180, y: 0, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar, handler]);

    const scriptData = {
      id: 'test_atomic_child_handler',
      nodes: [
        {
          id: 'sliderChildNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'BarParent',
              handlerEntity: 'HandlerChild',
              value: 160,
              min: 0,
              max: 160,
              step: 1,
              isInteractive: true
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Initial 160/160 (100% max)
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    let outputs = runner.nodeOutputs.get('sliderChildNode');
    expect(outputs.value).toBe(160);
    expect(outputs.normalized).toBe(1);
    expect(bar.components.UITransform.width).toBe(360);
    expect(bar.components.UITransform.x).toBe(-270);
    expect(handler.components.UITransform.x).toBe(180);

    // Drag to 50% midpoint (value = 80): Screen X = (-270 + 960) = 690, Y = 540
    setPointer({ x: 690, y: 540, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('sliderChildNode');
    expect(outputs.value).toBe(80);
    expect(outputs.normalized).toBe(0.5);
    expect(bar.components.UITransform.width).toBe(180);
    expect(bar.components.UITransform.x).toBe(-360);
    // Counteracting parent bar shift, child handler remains perfectly at 90 locally (midpoint)
    expect(handler.components.UITransform.x).toBe(90);

    // Drag to 0% minimum (value = 0): Screen X = 690 - 180 = 510, Y = 540
    setPointer({ x: 510, y: 540, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('sliderChildNode');
    expect(outputs.value).toBe(0);
    expect(outputs.normalized).toBe(0);
    expect(bar.components.UITransform.width).toBe(0);
    expect(bar.components.UITransform.x).toBe(-450);
    // Under 0%, child handler is at 0 (origin of shifted bar), exactly matching left edge without 1.5x overshoot
    expect(handler.components.UITransform.x).toBe(0);
  });

  it('snaps to custom step interval (e.g. step: 20)', () => {
    const bar = {
      id: 'StepBar',
      scriptId: 'StepBar',
      components: {
        UITransform: { x: 0, y: 0, width: 200, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
        ShapeRenderer: { width: 200, height: 20 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar]);

    const scriptData = {
      id: 'test_step_slider',
      nodes: [
        {
          id: 'stepNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'StepBar',
              handlerEntity: '',
              value: 0,
              min: 0,
              max: 100,
              step: 20,
              isInteractive: true
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    // Click at x=35 (35/200 = 17.5% -> should snap to 20)
    setPointer({ x: 35, y: 10, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    let outputs = runner.nodeOutputs.get('stepNode');
    expect(outputs.value).toBe(20);

    // Click at x=75 (75/200 = 37.5% -> should snap to 40)
    setPointer({ x: 75, y: 10, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('stepNode');
    expect(outputs.value).toBe(40);
  });

  it('supports read-only progress bar mode when isInteractive is false', () => {
    const bar = {
      id: 'HPBar',
      scriptId: 'HPBar',
      components: {
        UITransform: { x: 0, y: 0, width: 200, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
        ShapeRenderer: { width: 200, height: 20 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar]);

    const scriptData = {
      id: 'test_hp_bar',
      nodes: [
        {
          id: 'hpNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'HPBar',
              handlerEntity: '',
              value: 120,
              min: 0,
              max: 160,
              step: 1,
              isInteractive: false // Read-only progress bar
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    let outputs = runner.nodeOutputs.get('hpNode');
    expect(outputs.value).toBe(120);
    expect(outputs.normalized).toBe(0.75); // 120 / 160
    expect(bar.components.UITransform.width).toBe(150); // 200 * 0.75

    // Clicking does not change value because isInteractive is false
    setPointer({ x: 50, y: 10, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('hpNode');
    expect(outputs.value).toBe(120);
    expect(outputs.onChanged).toBe(false);
  });

  it('reverses direction when reverse: true so sliding to the right goes from 100 to 0', () => {
    const bar = {
      id: 'RevBar100',
      scriptId: 'RevBar100',
      components: {
        UITransform: { x: 100, y: 100, width: 320, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
        ShapeRenderer: { width: 320, height: 20 }
      }
    };

    const handler = {
      id: 'RevHandler100',
      scriptId: 'RevHandler100',
      components: {
        UITransform: { x: 0, y: 100, width: 24, height: 24, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar, handler]);

    const scriptData = {
      id: 'test_reverse_slider',
      nodes: [
        {
          id: 'reverseSliderNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'RevBar100',
              handlerEntity: 'RevHandler100',
              value: 100,
              min: 0,
              max: 100,
              step: 1,
              isInteractive: true,
              reverse: true
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Initial tick at 100 (value=100 in reverse mode is at the LEFT edge, width=0, handler at left)
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    let outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(100);
    expect(outputs.normalized).toBe(1);
    expect(bar.components.UITransform.width).toBe(0);
    expect(handler.components.UITransform.x).toBe(100); // Left edge

    const executeFlowSpy = vi.spyOn(runner, 'executeFlow');

    // Drag to midpoint: x = 100 + 160 = 260 -> should yield value 50 (50/100)
    setPointer({ x: 260, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(50);
    expect(outputs.normalized).toBe(0.5);
    expect(executeFlowSpy).toHaveBeenCalledWith('reverseSliderNode', 'onChanged');
    expect(bar.components.UITransform.width).toBe(160); // 50/100 of 320
    expect(bar.components.UITransform.x).toBe(100);
    expect(handler.components.UITransform.x).toBe(260); // Midpoint (50/100)

    // User's specific scenario: value 40 -> both handler and bar at 60/100 (x = 292, width = 192)
    setPointer({ x: 292, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(40);
    expect(outputs.normalized).toBe(0.4);
    expect(bar.components.UITransform.width).toBe(192); // 60/100 of 320
    expect(bar.components.UITransform.x).toBe(100);
    expect(handler.components.UITransform.x).toBe(292); // 60/100 from left

    // Drag to 75% from left: x = 100 + (0.75 * 320) = 340 -> should yield value 25 (75/100)
    setPointer({ x: 340, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(25);
    expect(outputs.normalized).toBe(0.25);
    expect(bar.components.UITransform.width).toBe(240); // 75/100 of 320
    expect(bar.components.UITransform.x).toBe(100);
    expect(handler.components.UITransform.x).toBe(340);

    // Drag all the way to the right: x = 420 -> should yield value 0 (100/100)
    setPointer({ x: 420, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(0);
    expect(outputs.normalized).toBe(0);
    expect(bar.components.UITransform.width).toBe(320); // 100/100 of 320
    expect(bar.components.UITransform.x).toBe(100);
    expect(handler.components.UITransform.x).toBe(420); // Right edge

    // Drag all the way to the left: x = 100 -> should yield value 100 (0/100)
    setPointer({ x: 100, y: 105, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('reverseSliderNode');
    expect(outputs.value).toBe(100);
    expect(outputs.normalized).toBe(1);
    expect(bar.components.UITransform.width).toBe(0);
    expect(bar.components.UITransform.x).toBe(100);
    expect(handler.components.UITransform.x).toBe(100);
  });

  it('supports child handler with reverse: true without offset error', () => {
    const bar = {
      id: 'RevBarChild',
      scriptId: 'RevBarChild',
      components: {
        UITransform: { x: -270, y: 0, width: 360, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 },
        SpriteRenderer: { sourceX: 0, sourceY: 0, sourceWidth: 360, sourceHeight: 20 }
      }
    };

    const handler = {
      id: 'RevHandlerChild',
      scriptId: 'RevHandlerChild',
      parentId: 'RevBarChild',
      components: {
        UITransform: { x: 0, y: 0, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 }
      }
    };

    const { mockGame, setPointer } = createMockGame([bar, handler]);

    const scriptData = {
      id: 'test_reverse_child',
      nodes: [
        {
          id: 'revChildNode',
          type: 'atomicSlider',
          inputs: sliderDef.defaultData.inputs,
          outputs: sliderDef.defaultData.outputs,
          data: {
            values: {
              barEntity: 'RevBarChild',
              handlerEntity: 'RevHandlerChild',
              value: 0,
              min: 0,
              max: 160,
              step: 1,
              isInteractive: true,
              reverse: true
            },
            code: sliderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    let outputs = runner.nodeOutputs.get('revChildNode');
    expect(outputs.value).toBe(0);
    expect(outputs.normalized).toBe(0);
    expect(bar.components.UITransform.width).toBe(360); // value 0 in reverse is right edge (full width)

    // Click at screenLeft (value should become 160)
    // screenLeft = -270 + 960 - (0.5 * 360) = 690 - 180 = 510
    setPointer({ x: 510, y: 540, down: true });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    outputs = runner.nodeOutputs.get('revChildNode');
    expect(outputs.value).toBe(160);
    expect(outputs.normalized).toBe(1);
    expect(bar.components.UITransform.width).toBe(0); // value 160 in reverse is left edge (width 0)
    expect(bar.components.SpriteRenderer.sourceX).toBe(0);
    expect(bar.components.SpriteRenderer.sourceWidth).toBe(0);
  });
});
