import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintInput } from '@nodes/library/blueprints/BlueprintInput.js';
import { BlueprintAnimation } from '@nodes/library/blueprints/BlueprintAnimation.js';
import { validateCodePanelContract } from '@nodes/nodes.js';
import { layerSchema } from '@scenes/scenes.js';
import LayerSystem from '@core/System/LayerSystem.js';
import PointerRaycast from '@core/System/PointerRaycast.js';
import Game from '@core/Core/Game.js';
import ContextSystem from '@core/Script/ContextSystem.js';

describe('freezeLayerInput Node & Layer Input Freezing System', () => {
  const freezeNode = BlueprintInput.items.find(item => item.type === 'freezeLayerInput');

  it('defines the freezeLayerInput blueprint with exact specified input/output ports', () => {
    expect(freezeNode).toBeDefined();
    expect(freezeNode.label).toBe('Freeze Layer Input');
    
    const inputIds = freezeNode.defaultData.inputs.map(p => p.id);
    expect(inputIds).toEqual(['execIn', 'layer', 'inputType', 'active']);

    const outputIds = freezeNode.defaultData.outputs.map(p => p.id);
    expect(outputIds).toEqual(['execOut']);

    const inputTypeOption = freezeNode.defaultData.data.options.inputType;
    expect(inputTypeOption).toEqual([
      { label: 'Pointer', value: 'pointer' },
      { label: 'Keyboard', value: 'keyboard' },
      { label: 'All', value: 'all' }
    ]);
  });

  it('passes code panel contract validation without any forbidden null checks or mismatches', () => {
    const nodeInstance = {
      id: 'node_freeze_test',
      type: 'freezeLayerInput',
      inputs: freezeNode.defaultData.inputs,
      outputs: freezeNode.defaultData.outputs,
      data: freezeNode.defaultData.data
    };

    const validation = validateCodePanelContract(freezeNode.defaultData.data.code, { node: nodeInstance });
    expect(validation.isValid).toBe(true);
    expect(validation.issues).toEqual([]);
  });

  it('executes blueprint code and properly updates layer freeze state', () => {
    const mockLayer = {
      id: 'layer_gameplay',
      scriptId: 'GameplayLayer',
      freezeInput: false,
      freezeInputType: 'all'
    };

    const mockContext = {
      layer: {
        get: vi.fn((name) => (name === 'GameplayLayer' || name === 'self') ? mockLayer : null)
      },
      assert: {
        exists: vi.fn((val, msg) => {
          if (!val) throw new Error(msg || 'Value must exist');
          return val;
        })
      }
    };

    const executeCode = new Function('inputs', 'outputs', 'context', 'node', freezeNode.defaultData.data.code);

    // Test 1: Freeze Pointer input
    const inputs1 = { layer: 'GameplayLayer', inputType: 'pointer', active: true };
    const outputs1 = {};
    executeCode(inputs1, outputs1, mockContext, freezeNode);

    expect(outputs1.execOut).toBe(true);
    expect(mockLayer.freezeInput).toBe(true);
    expect(mockLayer.freezeInputType).toBe('pointer');

    // Test 2: Unfreeze input
    const inputs2 = { layer: 'GameplayLayer', inputType: 'all', active: false };
    const outputs2 = {};
    executeCode(inputs2, outputs2, mockContext, freezeNode);

    expect(outputs2.execOut).toBe(true);
    expect(mockLayer.freezeInput).toBe(false);
    expect(mockLayer.freezeInputType).toBe('all');
  });

  it('ensures layerSchema provides freezeInput and freezeInputType by default', () => {
    const newLayer = layerSchema({ id: 'layer_test', scriptId: 'TestLayer' });
    expect(newLayer.freezeInput).toBe(false);
    expect(newLayer.freezeInputType).toBe('all');
  });

  describe('LayerSystem and PointerRaycast Runtime Freezing', () => {
    let mockGame;
    let mockEntity;
    let uiLayer;

    beforeEach(() => {
      mockEntity = {
        id: 'btn_1',
        scriptId: 'Button1',
        layerId: 'layer_ui',
        active: true,
        visible: true,
        components: {
          UITransform: {
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            anchorX: 0,
            anchorY: 0,
            pivotX: 0.5,
            pivotY: 0.5,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          }
        }
      };

      uiLayer = {
        id: 'layer_ui',
        scriptId: 'ui_layer',
        freezeInput: false,
        freezeInputType: 'all',
        zIndex: 1,
        active: true,
        visible: true,
        entities: [mockEntity]
      };

      mockGame = {
        world: {
          allLayers: [uiLayer],
          layersUI: [uiLayer],
          layersWorld: [],
          entities: [mockEntity],
          settings: { ui: { width: 1920, height: 1080 } }
        },
        camera: { x: 0, y: 0, scale: 1 },
        input: {
          getPointer: () => ({ x: 50, y: 50 })
        },
        renderer: {
          canvas: { width: 1920, height: 1080 }
        }
      };
    });

    it('LayerSystem correctly detects when a layer is frozen for pointer, keyboard, or all', () => {
      const layerSys = new LayerSystem(mockGame);

      expect(layerSys.isInputFrozen('layer_ui', 'pointer')).toBe(false);
      expect(layerSys.isInputFrozen('layer_ui', 'keyboard')).toBe(false);

      layerSys.freezeInput('layer_ui', true, 'pointer');
      expect(layerSys.isInputFrozen('layer_ui', 'pointer')).toBe(true);
      expect(layerSys.isInputFrozen('layer_ui', 'keyboard')).toBe(false);
      expect(layerSys.isInputFrozen('layer_ui', 'all')).toBe(true);

      layerSys.freezeInput('layer_ui', true, 'keyboard');
      expect(layerSys.isInputFrozen('layer_ui', 'pointer')).toBe(false);
      expect(layerSys.isInputFrozen('layer_ui', 'keyboard')).toBe(true);

      layerSys.freezeInput('layer_ui', true, 'all');
      expect(layerSys.isInputFrozen('layer_ui', 'pointer')).toBe(true);
      expect(layerSys.isInputFrozen('layer_ui', 'keyboard')).toBe(true);
    });

    it('PointerRaycast skips layers that have freezeInput set for pointer or all', () => {
      // Unfrozen: entity should be hit
      uiLayer.freezeInput = false;
      const hitUnfrozen = PointerRaycast.getTopEntityUnderPointer(mockGame);
      expect(hitUnfrozen?.id).toBe('btn_1');

      // Frozen for keyboard only: pointer still hits
      uiLayer.freezeInput = true;
      uiLayer.freezeInputType = 'keyboard';
      const hitKeyboardFrozen = PointerRaycast.getTopEntityUnderPointer(mockGame);
      expect(hitKeyboardFrozen?.id).toBe('btn_1');

      // Frozen for pointer: entity is skipped
      uiLayer.freezeInput = true;
      uiLayer.freezeInputType = 'pointer';
      const hitPointerFrozen = PointerRaycast.getTopEntityUnderPointer(mockGame);
      expect(hitPointerFrozen).toBeNull();

      // Frozen for all: entity is skipped
      uiLayer.freezeInput = true;
      uiLayer.freezeInputType = 'all';
      const hitAllFrozen = PointerRaycast.getTopEntityUnderPointer(mockGame);
      expect(hitAllFrozen).toBeNull();
    });

    it('PointerRaycast.isPointerOver returns false if layer is frozen for pointer or all', () => {
      mockGame.layerSystem = new LayerSystem(mockGame);

      uiLayer.freezeInput = false;
      expect(PointerRaycast.isPointerOver(mockGame, mockEntity, true)).toBe(true);

      mockGame.layerSystem.freezeInput('layer_ui', true, 'pointer');
      expect(PointerRaycast.isPointerOver(mockGame, mockEntity, true)).toBe(false);

      mockGame.layerSystem.freezeInput('layer_ui', true, 'keyboard');
      expect(PointerRaycast.isPointerOver(mockGame, mockEntity, true)).toBe(true);

      mockGame.layerSystem.freezeInput('layer_ui', true, 'all');
      expect(PointerRaycast.isPointerOver(mockGame, mockEntity, true)).toBe(false);
    });

    it('instantiates LayerSystem properly on Game class', () => {
      const gameInstance = new Game();
      expect(gameInstance.layerSystem).toBeInstanceOf(LayerSystem);
    });

    it('verifies ContextSystem strictly delegates layer and input operations to systems', () => {
      const gameInstance = new Game();
      gameInstance.world.layersUI = [uiLayer];
      gameInstance.world.entities = [mockEntity];

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      gameInstance.setCanvas(canvas);

      const runner = {
        owner: mockEntity,
        getNodeState: () => ({})
      };
      const node = { id: 'test_node', type: 'custom' };
      const context = gameInstance.contextSystem.createExecutionContext(runner, node);

      // Verify layer facade delegation
      expect(context.layer.get('layer_ui')?.id).toBe('layer_ui');
      expect(context.layer.get('self')?.id).toBe('layer_ui');
      expect(context.layer.isInputFrozen('self', 'pointer')).toBe(false);

      context.layer.freezeInput('self', true, 'pointer');
      expect(context.layer.isInputFrozen('self', 'pointer')).toBe(true);
      expect(gameInstance.layerSystem.isEntityInputFrozen(mockEntity, 'pointer')).toBe(true);

      // Verify input facade delegation respects runner.owner layer freeze
      expect(context.input.getPointer()).toBeNull();
      expect(context.input.mouse).toBeNull();

      // Keyboard is not frozen when inputType is pointer
      expect(context.input.keyboard.isDown('space')).toBe(false);

      // Freeze keyboard as well
      context.layer.freezeInput('self', true, 'all');
      expect(context.input.keyboard.isDown('space')).toBe(false);
      expect(context.input.isPointerOver(mockEntity)).toBe(false);

      // Unfreeze
      context.layer.freezeInput('self', false, 'all');
      expect(context.layer.isInputFrozen('self', 'all')).toBe(false);
      expect(context.input.getPointer()).not.toBeNull();
    });

    it('executes Entity Mouse Event (mouseEntityInteract) cleanly when layer is frozen without throwing errors', () => {
      const mouseNode = BlueprintInput.items.find(item => item.type === 'mouseEntityInteract');
      expect(mouseNode).toBeDefined();

      const gameInstance = new Game();
      gameInstance.world.layersUI = [uiLayer];
      gameInstance.world.entities = [mockEntity];

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      gameInstance.setCanvas(canvas);

      const runner = {
        owner: mockEntity,
        getNodeState: () => ({})
      };
      const context = gameInstance.contextSystem.createExecutionContext(runner, mouseNode);

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', mouseNode.defaultData.data.code);

      // Scenario 1: Layer is FROZEN for pointer
      gameInstance.layerSystem.freezeInput('layer_ui', true, 'pointer');
      expect(gameInstance.layerSystem.isEntityInputFrozen(mockEntity, 'pointer')).toBe(true);

      const frozenOutputs = {};
      expect(() => {
        executeCode({ targetEntity: 'self', useRaycast: true }, frozenOutputs, context, mouseNode);
      }).not.toThrow();

      // Node continues running (execOut = true, selfEntity set) but does NOT function (no hover/down/hold/up)
      expect(frozenOutputs.execOut).toBe(true);
      expect(frozenOutputs.selfEntity).toBe('Button1');
      expect(frozenOutputs.isHovering).toBe(false);
      expect(frozenOutputs.isHolding).toBe(false);
      expect(frozenOutputs.onHover).toBeUndefined();
      expect(frozenOutputs.onDown).toBeUndefined();
      expect(frozenOutputs.onHold).toBeUndefined();
      expect(frozenOutputs.onUp).toBeUndefined();

      // Scenario 2: Layer is UNROZEN
      gameInstance.layerSystem.freezeInput('layer_ui', false, 'all');
      expect(gameInstance.layerSystem.isEntityInputFrozen(mockEntity, 'pointer')).toBe(false);

      const unfrozenOutputs = {};
      // Mock pointer position over entity (entity is at 50, 50)
      gameInstance.input.getPointer = () => ({ x: 50, y: 50, down: true });

      expect(() => {
        executeCode({ targetEntity: 'self', useRaycast: false }, unfrozenOutputs, context, mouseNode);
      }).not.toThrow();

      expect(unfrozenOutputs.execOut).toBe(true);
      expect(unfrozenOutputs.selfEntity).toBe('Button1');
      expect(unfrozenOutputs.isHovering).toBe(true);
      expect(unfrozenOutputs.isHolding).toBe(true);
      expect(unfrozenOutputs.onHover).toBe(true);
      expect(unfrozenOutputs.onDown).toBe(true);
    });

    it('executes Button Scale Effect (uiButtonScaleEffect) cleanly when layer is frozen without throwing errors', () => {
      const buttonScaleNode = BlueprintAnimation.items.find(item => item.type === 'uiButtonScaleEffect');
      expect(buttonScaleNode).toBeDefined();

      const gameInstance = new Game();
      gameInstance.world.layersUI = [uiLayer];
      gameInstance.world.entities = [mockEntity];

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      gameInstance.setCanvas(canvas);

      const runner = {
        owner: mockEntity,
        getNodeState: () => ({})
      };
      const context = gameInstance.contextSystem.createExecutionContext(runner, buttonScaleNode);

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', buttonScaleNode.defaultData.data.code);

      // Scenario 1: Layer is FROZEN for pointer
      gameInstance.layerSystem.freezeInput('layer_ui', true, 'pointer');
      expect(gameInstance.layerSystem.isEntityInputFrozen(mockEntity, 'pointer')).toBe(true);

      const frozenOutputs = {};
      expect(() => {
        executeCode({
          targetEntity: 'self',
          useRaycast: true,
          scaleNormal: 1.0,
          scaleHover: 1.1,
          scalePressed: 0.9,
          lerpSpeed: 0.5
        }, frozenOutputs, context, buttonScaleNode);
      }).not.toThrow();

      // Node continues running (execOut = true, selfEntity set) but does NOT click
      expect(frozenOutputs.execOut).toBe(true);
      expect(frozenOutputs.selfEntity).toBe('Button1');
      expect(frozenOutputs.onClick).toBeUndefined();

      // Scenario 2: Layer is UNROZEN
      gameInstance.layerSystem.freezeInput('layer_ui', false, 'all');
      expect(gameInstance.layerSystem.isEntityInputFrozen(mockEntity, 'pointer')).toBe(false);

      // First frame: pointer down over entity -> wasDown = true
      gameInstance.input.getPointer = () => ({ x: 50, y: 50, down: true });
      const frame1Outputs = {};
      executeCode({
        targetEntity: 'self',
        useRaycast: false,
        scaleNormal: 1.0,
        scaleHover: 1.1,
        scalePressed: 0.9,
        lerpSpeed: 1.0
      }, frame1Outputs, context, buttonScaleNode);
      expect(frame1Outputs.onClick).toBeUndefined();

      // Second frame: pointer released over entity -> click triggered!
      gameInstance.input.getPointer = () => ({ x: 50, y: 50, down: false });
      const frame2Outputs = {};
      executeCode({
        targetEntity: 'self',
        useRaycast: false,
        scaleNormal: 1.0,
        scaleHover: 1.1,
        scalePressed: 0.9,
        lerpSpeed: 1.0
      }, frame2Outputs, context, buttonScaleNode);
      expect(frame2Outputs.onClick).toBe(true);
    });
  });
});
