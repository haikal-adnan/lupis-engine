import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('volumeSliderManager Blueprint & Execution Tests', () => {
  const sliderNodeDef = BlueprintHelperTool.items.find(i => i.type === 'volumeSliderManager');

  it('is registered in BlueprintHelperTool with correct metadata', () => {
    expect(sliderNodeDef).toBeDefined();
    expect(sliderNodeDef.label).toBe('Volume Slider Manager');
    expect(sliderNodeDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(sliderNodeDef.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'config']);
  });

  function createMockGame() {
    const audioVolumes = {
      master: 100,
      background: 100,
      sfx: 100,
      voice: 100
    };

    const entities = [
      {
        id: 'VolumeBGMBar',
        scriptId: 'VolumeBGMBar',
        components: {
          UITransform: { x: -270, y: 0, width: 360, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 },
          SpriteRenderer: { sourceX: 0, sourceY: 0, sourceWidth: 360, sourceHeight: 20 }
        }
      },
      {
        id: 'VolumeBGMHandler',
        scriptId: 'VolumeBGMHandler',
        components: {
          UITransform: { x: -90, y: 0, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 }
        }
      },
      {
        id: 'VolumeMasterBar',
        scriptId: 'VolumeMasterBar',
        components: {
          UITransform: { x: -270, y: 50, width: 360, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 },
          ShapeRenderer: { width: 360, height: 20 }
        }
      },
      {
        id: 'VolumeMasterHandler',
        scriptId: 'VolumeMasterHandler',
        components: {
          UITransform: { x: -90, y: 50, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 }
        }
      }
    ];

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
      audioSystem: {
        getVolume: (bus) => audioVolumes[bus] ?? 100,
        setVolume: (bus, vol) => { audioVolumes[bus] = vol; }
      },
      input: {
        getPointer: vi.fn(() => ({ x: 0, y: 0, down: false })),
        mouse: { isDown: vi.fn(() => false) },
        isPointerOver: vi.fn(() => false)
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return { mockGame, audioVolumes, entities };
  }

  it('handles partial config with only background volume without errors', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    const scriptData = {
      id: 'test_script',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                background: {
                  volume: 75,
                  bar: 'VolumeBGMBar',
                  handler: 'VolumeBGMHandler'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(audioVolumes.background).toBe(75);

    const bgmBar = entities.find(e => e.id === 'VolumeBGMBar');
    expect(bgmBar.components.UITransform.width).toBe(270); // 360 * 0.75
    expect(bgmBar.components.SpriteRenderer.sourceWidth).toBe(270);

    const bgmKnob = entities.find(e => e.id === 'VolumeBGMHandler');
    // localLeft = -270 - 0.5 * 360 = -450. Knob = -450 + 0.75 * 360 = -180
    expect(bgmKnob.components.UITransform.x).toBe(-180);

    const outputs = runner.nodeOutputs.get('sliderNode');
    expect(outputs.backgroundVolume).toBe(75);
  });

  it('handles partial config with master, sfx, background (omitting vocal) and null entries safely', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    const scriptData = {
      id: 'test_script_multi',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                master: { volume: 50, bar: 'VolumeMasterBar', handler: 'VolumeMasterHandler' },
                vocal: null,
                sfx: { volume: 80, bar: 'NonExistentBar', handler: 'NonExistentHandler' },
                background: { volume: 30, bar: 'VolumeBGMBar', handler: null }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    expect(() => {
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    }).not.toThrow();

    expect(audioVolumes.master).toBe(50);
    expect(audioVolumes.background).toBe(30);

    const masterBar = entities.find(e => e.id === 'VolumeMasterBar');
    expect(masterBar.components.ShapeRenderer.width).toBe(180); // 360 * 0.5

    const bgmBar = entities.find(e => e.id === 'VolumeBGMBar');
    expect(bgmBar.components.SpriteRenderer.sourceWidth).toBe(108); // 360 * 0.3
  });

  it('runs smoothly when execIn is connected to onTick: no jitter, maintains user drag, and avoids reset', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    let pointerState = { x: 0, y: 0, down: false };
    mockGame.input.getPointer = vi.fn(() => pointerState);
    mockGame.input.mouse.isDown = vi.fn(() => pointerState.down);

    const scriptData = {
      id: 'test_script_ontick',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                background: {
                  volume: 100,
                  bar: 'VolumeBGMBar',
                  handler: 'VolumeBGMHandler'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Frame 1: Initialization on first tick
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.background).toBe(100);

    // Frame 2: Mouse down at midpoint (x=690, y=540) -> 50%
    pointerState = { x: 690, y: 540, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(audioVolumes.background).toBe(50);
    const bgmBar = entities.find(e => e.id === 'VolumeBGMBar');
    expect(bgmBar.components.UITransform.width).toBe(180);
    expect(bgmBar.components.SpriteRenderer.sourceWidth).toBe(180);

    const bgmKnob = entities.find(e => e.id === 'VolumeBGMHandler');
    // localLeft = -270 - 180 = -450. Knob at 50% = -450 + 180 = -270
    expect(bgmKnob.components.UITransform.x).toBe(-270);

    // Frame 3: Next tick while still holding at same spot - should not reset to 100 or jitter
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.background).toBe(50);
    expect(bgmBar.components.UITransform.width).toBe(180);

    // Frame 4: Dragging to 25% (x=510 + 0.25*360 = 600)
    pointerState = { x: 600, y: 540, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.background).toBe(25);
    expect(bgmBar.components.SpriteRenderer.sourceWidth).toBe(90);

    // Frame 5: Mouse released
    pointerState = { x: 600, y: 540, down: false };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.background).toBe(25);

    // Frame 6: Idle tick with mouse released - stays at 25%
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.background).toBe(25);
  });

  it('properly calculates child handler position without double-shifting when handler is parented to bar entity', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    const masterBar = entities.find(e => e.id === 'VolumeMasterBar');
    const masterHandler = entities.find(e => e.id === 'VolumeMasterHandler');
    masterHandler.parentId = 'VolumeMasterBar';
    masterHandler.components.UITransform.x = 180;

    let pointerState = { x: 0, y: 0, down: false };
    mockGame.input.getPointer = vi.fn(() => pointerState);
    mockGame.input.mouse.isDown = vi.fn(() => pointerState.down);

    const scriptData = {
      id: 'test_child_handler',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                master: {
                  volume: 100,
                  bar: 'VolumeMasterBar',
                  handler: 'VolumeMasterHandler'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Initial 100% volume
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(100);
    expect(masterBar.components.UITransform.width).toBe(360);
    expect(masterBar.components.UITransform.x).toBe(-270);
    expect(masterHandler.components.UITransform.x).toBe(180);

    // Drag to 50% volume (x = 690, y = 590)
    pointerState = { x: 690, y: 590, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(50);
    expect(masterBar.components.UITransform.width).toBe(180);
    expect(masterBar.components.UITransform.x).toBe(-360);
    // Counteracting parent shift (-90), child handler moves to 90 locally so it matches exactly 50%
    expect(masterHandler.components.UITransform.x).toBe(90);

    // Drag to 0% volume (x = 510, y = 590)
    pointerState = { x: 510, y: 590, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(0);
    expect(masterBar.components.UITransform.width).toBe(0);
    expect(masterBar.components.UITransform.x).toBe(-450);
    expect(masterHandler.components.UITransform.x).toBe(0);
  });

  it('updates indicator TextRenderer with "{value}%" on initialization and on pointer interaction', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    const masterIndicator = {
      id: 'VolumeMasterIndicator',
      scriptId: 'VolumeMasterIndicator',
      components: {
        UITransform: { x: -90, y: 80, width: 60, height: 20 },
        TextRenderer: { value: '0%' }
      }
    };
    entities.push(masterIndicator);

    let pointerState = { x: 0, y: 0, down: false };
    mockGame.input.getPointer = vi.fn(() => pointerState);
    mockGame.input.mouse.isDown = vi.fn(() => pointerState.down);

    const scriptData = {
      id: 'test_indicator',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                master: {
                  volume: 85,
                  bar: 'VolumeMasterBar',
                  handler: 'VolumeMasterHandler',
                  indicator: 'VolumeMasterIndicator'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);

    // Initial 85% volume sets text to "85%"
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(85);
    expect(masterIndicator.components.TextRenderer.value).toBe('85%');

    // Drag to 50% volume (x = 690, y = 590)
    pointerState = { x: 690, y: 590, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(50);
    expect(masterIndicator.components.TextRenderer.value).toBe('50%');

    // Drag to 0% volume (x = 510, y = 590)
    pointerState = { x: 510, y: 590, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(0);
    expect(masterIndicator.components.TextRenderer.value).toBe('0%');

    // Drag to 100% volume (x = 870, y = 590)
    pointerState = { x: 870, y: 590, down: true };
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    expect(audioVolumes.master).toBe(100);
    expect(masterIndicator.components.TextRenderer.value).toBe('100%');
  });

  it('handles optional indicator gracefully when omitted, null, or entity has no TextRenderer', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    entities.push({
      id: 'EmptyIndicatorEntity',
      scriptId: 'EmptyIndicatorEntity',
      components: {
        UITransform: { x: 0, y: 0 }
      }
    });

    const scriptData = {
      id: 'test_optional_indicator',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                master: {
                  volume: 70,
                  bar: 'VolumeMasterBar',
                  handler: 'VolumeMasterHandler'
                  // indicator omitted
                },
                background: {
                  volume: 40,
                  bar: 'VolumeBGMBar',
                  handler: 'VolumeBGMHandler',
                  indicator: null
                },
                sfx: {
                  volume: 60,
                  bar: 'VolumeMasterBar',
                  handler: 'VolumeMasterHandler',
                  indicator: 'NonExistentIndicator'
                },
                vocal: {
                  volume: 90,
                  bar: 'VolumeBGMBar',
                  handler: 'VolumeBGMHandler',
                  indicator: 'EmptyIndicatorEntity'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    expect(() => {
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    }).not.toThrow();

    expect(audioVolumes.master).toBe(70);
    expect(audioVolumes.background).toBe(40);
  });

  it('supports indicator TextRenderer located on a child entity', () => {
    const { mockGame, audioVolumes, entities } = createMockGame();

    const childTextEntity = {
      id: 'BGMIndicatorChildText',
      scriptId: 'BGMIndicatorChildText',
      parentId: 'BGMIndicatorContainer',
      components: {
        UITransform: { x: 0, y: 0 },
        TextRenderer: { value: 'Old Value' }
      }
    };

    const parentIndicatorContainer = {
      id: 'BGMIndicatorContainer',
      scriptId: 'BGMIndicatorContainer',
      children: ['BGMIndicatorChildText'],
      components: {
        UITransform: { x: 0, y: 100 }
      }
    };

    entities.push(parentIndicatorContainer, childTextEntity);

    const scriptData = {
      id: 'test_child_indicator',
      nodes: [
        {
          id: 'sliderNode',
          type: 'volumeSliderManager',
          inputs: sliderNodeDef.defaultData.inputs,
          outputs: sliderNodeDef.defaultData.outputs,
          data: {
            values: {
              config: {
                background: {
                  volume: 65,
                  bar: 'VolumeBGMBar',
                  handler: 'VolumeBGMHandler',
                  indicator: 'BGMIndicatorContainer'
                }
              }
            },
            code: sliderNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData);
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(audioVolumes.background).toBe(65);
    expect(childTextEntity.components.TextRenderer.value).toBe('65%');
  });
});

