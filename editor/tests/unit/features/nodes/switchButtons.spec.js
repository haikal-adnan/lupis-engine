import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('Switch Buttons Blueprint & Execution Tests', () => {
  const shapeSwitchDef = BlueprintHelperTool.items.find(i => i.type === 'switchButtonShape');
  const imageSwitchDef = BlueprintHelperTool.items.find(i => i.type === 'switchButtonImage');

  it('both switch nodes are registered in BlueprintHelperTool with correct metadata', () => {
    expect(shapeSwitchDef).toBeDefined();
    expect(shapeSwitchDef.label).toBe('Switch Button Shape');
    expect(shapeSwitchDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(shapeSwitchDef.defaultData.inputs.map(i => i.id)).toContain('knobEntity');
    expect(shapeSwitchDef.defaultData.inputs.map(i => i.id)).toContain('trackEntity');
    expect(shapeSwitchDef.defaultData.outputs.map(o => o.id)).toEqual(['execOut', 'isOn', 'onOn', 'onOff']);

    expect(imageSwitchDef).toBeDefined();
    expect(imageSwitchDef.label).toBe('Switch Button Image');
    expect(imageSwitchDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(imageSwitchDef.defaultData.inputs.map(i => i.id)).toContain('knobOffImage');
    expect(imageSwitchDef.defaultData.inputs.map(i => i.id)).toContain('knobOnImage');
    expect(imageSwitchDef.defaultData.inputs.map(i => i.id)).toContain('trackOffImage');
    expect(imageSwitchDef.defaultData.inputs.map(i => i.id)).toContain('trackOnImage');
    expect(imageSwitchDef.defaultData.outputs.map(o => o.id)).toEqual(['execOut', 'isOn', 'onOn', 'onOff']);
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
        isPointerOver: vi.fn((ent) => {
          if (!ent) return false;
          const t = ent.components?.UITransform;
          if (!t) return false;
          return pointerState.x >= t.x && pointerState.x <= t.x + t.width &&
                 pointerState.y >= t.y && pointerState.y <= t.y + t.height;
        })
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return { mockGame, setPointer: (p) => { pointerState = p; } };
  }

  describe('switchButtonShape', () => {
    it('initializes shape switch with off colors, off text, and slides knob on click toggle', () => {
      const knob = {
        id: 'Knob1',
        scriptId: 'Knob1',
        components: {
          UITransform: { x: 10, y: 10, width: 30, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          ShapeRenderer: { color: '#000000', elements: [{ color: '#000000', fill: '#000000' }] }
        }
      };

      const track = {
        id: 'Track1',
        scriptId: 'Track1',
        components: {
          UITransform: { x: 0, y: 10, width: 80, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          ShapeRenderer: { color: '#000000', elements: [{ color: '#000000', fill: '#000000' }] }
        }
      };

      const label = {
        id: 'Label1',
        scriptId: 'Label1',
        components: {
          TextRenderer: { value: '', color: '#000000' }
        }
      };

      const { mockGame, setPointer } = createMockGame([knob, track, label]);

      const scriptData = {
        id: 'test_switch_shape',
        nodes: [
          {
            id: 'node_shape_switch',
            type: 'switchButtonShape',
            inputs: shapeSwitchDef.defaultData.inputs,
            outputs: shapeSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'Knob1',
                trackEntity: 'Track1',
                textEntity: 'Label1',
                isOn: false,
                duration: 0, // instantaneous for test
                slideDist: 40,
                knobOnColor: '#FFFFFF',
                knobOffColor: '#E0E0E0',
                trackOnColor: '#4CAF50',
                trackOffColor: '#757575',
                onText: 'ACTIVE',
                offText: 'INACTIVE',
                onTextColor: '#FFFFFF',
                offTextColor: '#BDBDBD'
              },
              code: shapeSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      const executeFlowSpy = vi.spyOn(runner, 'executeFlow');
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_shape_switch');
      expect(outputs.isOn).toBe(false);
      expect(knob.components.ShapeRenderer.color).toBe('#E0E0E0');
      expect(track.components.ShapeRenderer.color).toBe('#757575');
      expect(label.components.TextRenderer.value).toBe('INACTIVE');
      expect(knob.components.UITransform.x).toBe(10); // offX

      // Simulate Click on knob
      setPointer({ x: 20, y: 20, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(outputs.isOn).toBe(true);
      expect(executeFlowSpy).toHaveBeenCalledWith('node_shape_switch', 'onOn');
      expect(knob.components.ShapeRenderer.color).toBe('#FFFFFF');
      expect(track.components.ShapeRenderer.color).toBe('#4CAF50');
      expect(label.components.TextRenderer.value).toBe('ACTIVE');
      expect(knob.components.UITransform.x).toBeGreaterThan(10); // moved to onX
    });
  });

  describe('switchButtonImage', () => {
    it('supports 1, 2, 3, and 4 images mode and swaps assetId properly', () => {
      const knob = {
        id: 'KnobImg',
        scriptId: 'KnobImg',
        components: {
          UITransform: { x: 50, y: 50, width: 40, height: 40, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'initial_knob.png' }
        }
      };

      const track = {
        id: 'TrackImg',
        scriptId: 'TrackImg',
        components: {
          UITransform: { x: 40, y: 50, width: 100, height: 40, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'initial_track.png' }
        }
      };

      const { mockGame, setPointer } = createMockGame([knob, track]);

      const scriptData = {
        id: 'test_switch_image_4',
        nodes: [
          {
            id: 'node_img_switch',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'KnobImg',
                trackEntity: 'TrackImg',
                textEntity: '',
                isOn: false,
                duration: 0,
                slideDist: 40,
                knobOffImage: 'knob_off.png',
                knobOnImage: 'knob_on.png',
                trackOffImage: 'track_off.png',
                trackOnImage: 'track_on.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(knob.components.SpriteRenderer.assetId).toBe('knob_off.png');
      expect(track.components.SpriteRenderer.assetId).toBe('track_off.png');

      // Click to toggle ON
      setPointer({ x: 60, y: 60, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_img_switch');
      expect(outputs.isOn).toBe(true);
      expect(knob.components.SpriteRenderer.assetId).toBe('knob_on.png');
      expect(track.components.SpriteRenderer.assetId).toBe('track_on.png');

      // Release mouse
      setPointer({ x: 60, y: 60, down: false });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
      expect(outputs.isOn).toBe(true);

      // Click again to toggle OFF
      setPointer({ x: 60, y: 60, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
      expect(outputs.isOn).toBe(false);
      expect(knob.components.SpriteRenderer.assetId).toBe('knob_off.png');
      expect(track.components.SpriteRenderer.assetId).toBe('track_off.png');
    });

    it('works as in-place checkbox with 1 or 2 images and slideDist 0 without track', () => {
      const knob = {
        id: 'CheckboxKnob',
        scriptId: 'CheckboxKnob',
        components: {
          UITransform: { x: 100, y: 100, width: 32, height: 32, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'empty.png' }
        }
      };

      const { mockGame, setPointer } = createMockGame([knob]);

      const scriptData = {
        id: 'test_checkbox',
        nodes: [
          {
            id: 'node_checkbox',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'CheckboxKnob',
                trackEntity: '',
                textEntity: '',
                isOn: false,
                duration: 0,
                slideDist: 0, // in-place checkbox
                knobOffImage: 'checkbox_empty.png',
                knobOnImage: 'checkbox_checked.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(knob.components.SpriteRenderer.assetId).toBe('checkbox_empty.png');
      expect(knob.components.UITransform.x).toBe(100);

      // Click checkbox
      setPointer({ x: 110, y: 110, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(knob.components.SpriteRenderer.assetId).toBe('checkbox_checked.png');
      expect(knob.components.UITransform.x).toBe(100); // position remains stationary!
    });

    it('supports dual text entities (onTextEntity and offTextEntity) with highlight and dim states', () => {
      const knob = {
        id: 'KnobDual',
        scriptId: 'KnobDual',
        components: {
          UITransform: { x: 50, y: 10, width: 30, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'knob.png' }
        }
      };
      const textOff = {
        id: 'TextOffEnt',
        scriptId: 'TextOffEnt',
        components: {
          UITransform: { x: 10, y: 10, width: 30, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          TextRenderer: { value: 'OFF', color: '#000000', opacity: 1 }
        }
      };
      const textOn = {
        id: 'TextOnEnt',
        scriptId: 'TextOnEnt',
        components: {
          UITransform: { x: 100, y: 10, width: 30, height: 20, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          TextRenderer: { value: 'ON', color: '#000000', opacity: 1 }
        }
      };

      const { mockGame, setPointer } = createMockGame([knob, textOff, textOn]);

      const scriptData = {
        id: 'test_dual_text',
        nodes: [
          {
            id: 'node_dual',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'KnobDual',
                onTextEntity: 'TextOnEnt',
                offTextEntity: 'TextOffEnt',
                isOn: false,
                duration: 0,
                slideDist: 40,
                knobOffImage: 'knob.png',
                onText: 'ON',
                offText: 'OFF',
                onTextColor: '#FFFFFF',
                offTextColor: '#757575'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // OFF state: textOff highlighted (#FFFFFF, opacity 1), textOn dimmed (#757575, opacity 0.4)
      expect(textOff.components.TextRenderer.color).toBe('#FFFFFF');
      expect(textOff.components.TextRenderer.opacity).toBe(1);
      expect(textOn.components.TextRenderer.color).toBe('#757575');
      expect(textOn.components.TextRenderer.opacity).toBe(0.4);

      // Click on textOn specifically -> turns ON!
      setPointer({ x: 110, y: 15, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_dual');
      expect(outputs.isOn).toBe(true);
      expect(textOn.components.TextRenderer.color).toBe('#FFFFFF');
      expect(textOn.components.TextRenderer.opacity).toBe(1);
      expect(textOff.components.TextRenderer.color).toBe('#757575');
      expect(textOff.components.TextRenderer.opacity).toBe(0.4);
    });

    it('supports clicking anywhere in the slideDist corridor when no track entity is present', () => {
      const knob = {
        id: 'KnobTrackless',
        scriptId: 'KnobTrackless',
        components: {
          UITransform: { x: 50, y: 50, width: 30, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'knob.png' }
        }
      };

      const { mockGame, setPointer } = createMockGame([knob]);
      // Note: isPointerOver mock returns true only for direct knob bounds [50..80, 50..80]
      // But the corridor spans from x=50 to x=50+60+30=140!

      const scriptData = {
        id: 'test_corridor',
        nodes: [
          {
            id: 'node_corridor',
            type: 'switchButtonShape',
            inputs: shapeSwitchDef.defaultData.inputs,
            outputs: shapeSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'KnobTrackless',
                trackEntity: '',
                isOn: false,
                duration: 0,
                slideDist: 60
              },
              code: shapeSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // Click at x=100 (which is inside slideDist corridor [50..140], but outside the initial knob position [50..80])
      setPointer({ x: 100, y: 60, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_corridor');
      expect(outputs.isOn).toBe(true);
      expect(knob.components.UITransform.x).toBe(110); // 50 + 60
    });

    it('accurately bounds and animates child knob and child text when parented to track entity', () => {
      const track = {
        id: 'TrackParent',
        scriptId: 'TrackParent',
        components: {
          UITransform: { x: 100, y: 100, width: 200, height: 40, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          ShapeRenderer: { color: '#757575', elements: [{ color: '#757575', fill: '#757575' }] }
        }
      };

      const knob = {
        id: 'KnobChild',
        scriptId: 'KnobChild',
        parentId: 'TrackParent',
        components: {
          UITransform: { x: 0, y: 0, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          ShapeRenderer: { color: '#E0E0E0', elements: [{ color: '#E0E0E0', fill: '#E0E0E0' }] }
        }
      };

      const textOff = {
        id: 'TextOffChild',
        scriptId: 'TextOffChild',
        parentId: 'TrackParent',
        components: {
          UITransform: { x: -50, y: 0, width: 50, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          TextRenderer: { value: 'OFF', color: '#000000', opacity: 1 }
        }
      };

      const textOn = {
        id: 'TextOnChild',
        scriptId: 'TextOnChild',
        parentId: 'TrackParent',
        components: {
          UITransform: { x: 50, y: 0, width: 50, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          TextRenderer: { value: 'ON', color: '#000000', opacity: 1 }
        }
      };

      const { mockGame, setPointer } = createMockGame([track, knob, textOff, textOn]);

      const scriptData = {
        id: 'test_child_switch',
        nodes: [
          {
            id: 'node_child_switch',
            type: 'switchButtonShape',
            inputs: shapeSwitchDef.defaultData.inputs,
            outputs: shapeSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'KnobChild',
                trackEntity: 'TrackParent',
                onTextEntity: 'TextOnChild',
                offTextEntity: 'TextOffChild',
                isOn: false,
                duration: 0,
                knobOnColor: '#FFFFFF',
                knobOffColor: '#E0E0E0',
                trackOnColor: '#4CAF50',
                trackOffColor: '#757575',
                onText: 'ON',
                offText: 'OFF'
              },
              code: shapeSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // pad = round((40 - 30) / 2) = 5
      // childOffX = (-0.5 * 200) + (0.5 * 30) + 5 = -100 + 15 + 5 = -80
      // childOnX = (-0.5 * 200) + 200 - (0.5 * 30) - 5 = 100 - 15 - 5 = 80
      expect(knob.components.UITransform.x).toBe(-80);
      expect(textOff.components.TextRenderer.opacity).toBe(1);
      expect(textOn.components.TextRenderer.opacity).toBe(0.4);

      // Click on textOn child (global position: track.x + textOn.x = 100 + 50 = 150, y = 100)
      setPointer({ x: 150, y: 100, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_child_switch');
      expect(outputs.isOn).toBe(true);
      expect(knob.components.UITransform.x).toBe(80);
      expect(textOn.components.TextRenderer.opacity).toBe(1);
      expect(textOff.components.TextRenderer.opacity).toBe(0.4);

      // Release mouse
      setPointer({ x: 150, y: 100, down: false });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // Click on textOff child (global position: track.x + textOff.x = 100 - 50 = 50, y = 100)
      setPointer({ x: 50, y: 100, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(outputs.isOn).toBe(false);
      expect(knob.components.UITransform.x).toBe(-80);
      expect(textOff.components.TextRenderer.opacity).toBe(1);
      expect(textOn.components.TextRenderer.opacity).toBe(0.4);
    });

    it('switchButtonImage accurately bounds and animates child knob parented to track entity', () => {
      const track = {
        id: 'TrackImgParent',
        scriptId: 'TrackImgParent',
        components: {
          UITransform: { x: 200, y: 200, width: 160, height: 40, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'track_off.png' }
        }
      };

      const knob = {
        id: 'KnobImgChild',
        scriptId: 'KnobImgChild',
        parentId: 'TrackImgParent',
        components: {
          UITransform: { x: 0, y: 0, width: 32, height: 32, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'knob_off.png' }
        }
      };

      const { mockGame, setPointer } = createMockGame([track, knob]);

      const scriptData = {
        id: 'test_child_image_switch',
        nodes: [
          {
            id: 'node_child_img',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'KnobImgChild',
                trackEntity: 'TrackImgParent',
                isOn: false,
                duration: 0,
                knobOffImage: 'knob_off.png',
                knobOnImage: 'knob_on.png',
                trackOffImage: 'track_off.png',
                trackOnImage: 'track_on.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // pad = round((40 - 32) / 2) = 4
      // childOffX = (-0.5 * 160) + (0.5 * 32) + 4 = -80 + 16 + 4 = -60
      // childOnX = (-0.5 * 160) + 160 - (0.5 * 32) - 4 = 80 - 16 - 4 = 60
      expect(knob.components.UITransform.x).toBe(-60);
      expect(knob.components.SpriteRenderer.assetId).toBe('knob_off.png');

      // Click on track (global track: x=200, y=200)
      setPointer({ x: 200, y: 200, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      const outputs = runner.nodeOutputs.get('node_child_img');
      expect(outputs.isOn).toBe(true);
      expect(knob.components.UITransform.x).toBe(60);
      expect(knob.components.SpriteRenderer.assetId).toBe('knob_on.png');

      // Release mouse
      setPointer({ x: 200, y: 200, down: false });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      // Click again
      setPointer({ x: 200, y: 200, down: true });
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(outputs.isOn).toBe(false);
      expect(knob.components.UITransform.x).toBe(-60);
      expect(knob.components.SpriteRenderer.assetId).toBe('knob_off.png');
    });

    it('successfully reads entity when knobEntity is passed as entity object directly', () => {
      const knob = {
        id: 'KnobObj1',
        scriptId: 'KnobObj1',
        components: {
          UITransform: { x: 50, y: 50, width: 40, height: 40, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'initial.png' }
        }
      };
      const { mockGame } = createMockGame([knob]);
      const scriptData = {
        id: 'test_obj_knob',
        nodes: [
          {
            id: 'node_obj_knob',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: knob, // Direct object!
                trackEntity: '',
                isOn: false,
                duration: 0,
                slideDist: 20,
                knobOffImage: 'knob_off.png',
                knobOnImage: 'knob_on.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      expect(() => {
        runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
      }).not.toThrow();

      expect(knob.components.SpriteRenderer.assetId).toBe('knob_off.png');
    });

    it('falls back to runner.owner when knobEntity is empty or self', () => {
      const ownerEntity = {
        id: 'SelfKnob',
        scriptId: 'SelfKnob',
        components: {
          UITransform: { x: 10, y: 10, width: 30, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          SpriteRenderer: { assetId: 'initial.png' }
        }
      };
      const { mockGame } = createMockGame([ownerEntity]);
      const scriptData = {
        id: 'test_self_knob',
        nodes: [
          {
            id: 'node_self_knob',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: '', // Empty, defaults to self
                targetEntity: 'self',
                isOn: false,
                duration: 0,
                slideDist: 20,
                knobOffImage: 'knob_off.png',
                knobOnImage: 'knob_on.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner.owner = ownerEntity;
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(ownerEntity.components.SpriteRenderer.assetId).toBe('knob_off.png');
    });

    it('resolves entity from layersUI/allLayers and resolves assetId', () => {
      const knob = {
        id: 'UIKnobLayer',
        scriptId: 'ui_knob_layer',
        components: {
          UITransform: { x: 10, y: 10, width: 30, height: 30, pivotX: 0, pivotY: 0, anchorX: 0, anchorY: 0 },
          ImageRenderer: { assetId: 'raw_asset_id' } // ImageRenderer supported!
        }
      };
      // knob is NOT in world.entities, but in layersUI!
      const { mockGame } = createMockGame([]);
      mockGame.world.layersUI = [
        { id: 'layer_ui_1', entities: [knob] }
      ];
      mockGame.world.allLayers = [
        { id: 'layer_ui_1', entities: [knob] }
      ];

      const scriptData = {
        id: 'test_layer_knob',
        nodes: [
          {
            id: 'node_layer_knob',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'UI_Knob_Layer', // Case-insensitive and slug-matched
                isOn: false,
                duration: 0,
                slideDist: 0,
                knobOffImage: 'knob_off.png',
                knobOnImage: 'knob_on.png'
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

      expect(knob.components.ImageRenderer.assetId).toBe('knob_off.png');
    });

    it('gracefully returns safe outputs without throwing when knob entity is truly missing', () => {
      const { mockGame } = createMockGame([]);
      const scriptData = {
        id: 'test_missing_knob',
        nodes: [
          {
            id: 'node_missing_knob',
            type: 'switchButtonImage',
            inputs: imageSwitchDef.defaultData.inputs,
            outputs: imageSwitchDef.defaultData.outputs,
            data: {
              values: {
                knobEntity: 'NonExistentKnob',
                isOn: false
              },
              code: imageSwitchDef.defaultData.data.code
            }
          }
        ],
        edges: []
      };

      const runner = new ScriptRunner(mockGame, scriptData);
      const executeFlowSpy = vi.spyOn(runner, 'executeFlow');
      expect(() => {
        runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
      }).not.toThrow();

      const outputs = runner.nodeOutputs.get('node_missing_knob');
      expect(outputs).toBeDefined();
      expect(executeFlowSpy).toHaveBeenCalledWith('node_missing_knob', 'execOut');
      expect(outputs.isOn).toBe(false);
    });
  });
});

