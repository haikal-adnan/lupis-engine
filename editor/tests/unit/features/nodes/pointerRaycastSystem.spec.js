import { describe, it, expect, beforeEach } from 'vitest';
import PointerRaycast from '@core/System/PointerRaycast.js';
import Game from '@core/Core/Game.js';
import { BlueprintInput } from '@nodes/library/blueprints/BlueprintInput.js';

describe('PointerRaycast & Entity Mouse Event System', () => {
  let game;
  let canvas;
  let uiLayer;
  let buttonEntity;

  beforeEach(() => {
    game = new Game();

    canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    // Simulate real browser viewport scaling where CSS display size differs from internal canvas resolution
    Object.defineProperty(canvas, 'clientWidth', { value: 960, configurable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: 540, configurable: true });

    game.setCanvas(canvas);

    buttonEntity = {
      id: 'btn_play',
      scriptId: 'PlayButton',
      layerId: 'layer_ui',
      active: true,
      visible: true,
      components: {
        UITransform: {
          x: 0,
          y: 0,
          anchorX: 0.5,
          anchorY: 0.5,
          pivotX: 0.5,
          pivotY: 0.5,
          width: 200,
          height: 80,
          scaleX: 1,
          scaleY: 1
        }
      }
    };

    uiLayer = {
      id: 'layer_ui',
      scriptId: 'LayerUI',
      active: true,
      visible: true,
      freezeInput: false,
      entities: [buttonEntity]
    };

    game.world.layersUI = [uiLayer];
    game.world.entities = [buttonEntity];
  });

  it('correctly detects pointer over entity when useRaycast is true and canvas has CSS clientWidth', () => {
    // Center of screen (1920 / 2, 1080 / 2) -> (960, 540) in internal canvas resolution
    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    const isOver = PointerRaycast.isPointerOver(game, buttonEntity, true);
    expect(isOver).toBe(true);
  });

  it('correctly detects pointer over entity when useRaycast is false even when canvas has CSS clientWidth', () => {
    // When useRaycast is false (off), it must NOT divide pointer coords by clientWidth (960)
    // Internal canvas resolution is 1920x1080, center is (960, 540)
    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    const isOver = PointerRaycast.isPointerOver(game, buttonEntity, false);
    expect(isOver).toBe(true);
  });

  it('correctly handles string values for useRaycast ("false", "off", "0")', () => {
    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    expect(PointerRaycast.isPointerOver(game, buttonEntity, 'false')).toBe(true);
    expect(PointerRaycast.isPointerOver(game, buttonEntity, 'off')).toBe(true);
    expect(PointerRaycast.isPointerOver(game, buttonEntity, '0')).toBe(true);
    expect(PointerRaycast.isPointerOver(game, buttonEntity, 'true')).toBe(true);
  });

  it('returns false when pointer is outside entity bounds with useRaycast = false', () => {
    // Far top-left outside the 200x80 center button
    game.input.getPointer = () => ({ x: 100, y: 100, down: false });

    expect(PointerRaycast.isPointerOver(game, buttonEntity, false)).toBe(false);
    expect(PointerRaycast.isPointerOver(game, buttonEntity, true)).toBe(false);
  });

  it('detects click when entity has regular Transform in a UI layer with useRaycast = false', () => {
    const uiEntityWithTransform = {
      id: 'ui_icon',
      scriptId: 'UIIcon',
      layerId: 'layer_ui',
      active: true,
      visible: true,
      components: {
        Transform: {
          x: 960,
          y: 540,
          pivotX: 0.5,
          pivotY: 0.5,
          width: 64,
          height: 64,
          scaleX: 1,
          scaleY: 1
        }
      }
    };
    uiLayer.entities.push(uiEntityWithTransform);
    game.world.entities.push(uiEntityWithTransform);

    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    expect(PointerRaycast.isPointerOver(game, uiEntityWithTransform, false)).toBe(true);
  });

  it('detects pointer on parent entity when hovering over a child entity with useRaycast = false', () => {
    // Button container with 0 width, but child label has 160x40
    const containerButton = {
      id: 'container_btn',
      scriptId: 'ContainerBtn',
      layerId: 'layer_ui',
      active: true,
      visible: true,
      components: {
        UITransform: {
          x: 0,
          y: 0,
          anchorX: 0.5,
          anchorY: 0.5,
          pivotX: 0.5,
          pivotY: 0.5,
          width: 0,
          height: 0,
          scaleX: 1,
          scaleY: 1
        }
      }
    };

    const childText = {
      id: 'child_label',
      scriptId: 'ChildLabel',
      parentId: 'container_btn',
      layerId: 'layer_ui',
      active: true,
      visible: true,
      components: {
        UITransform: {
          x: 0,
          y: 0,
          anchorX: 0.5,
          anchorY: 0.5,
          pivotX: 0.5,
          pivotY: 0.5,
          width: 160,
          height: 40,
          scaleX: 1,
          scaleY: 1
        }
      }
    };

    uiLayer.entities.push(containerButton, childText);
    game.world.entities.push(containerButton, childText);

    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    expect(PointerRaycast.isPointerOver(game, containerButton, false)).toBe(true);
  });

  it('returns false when parent entity is inactive or invisible with useRaycast = false', () => {
    const parentEntity = {
      id: 'modal_dialog',
      scriptId: 'ModalDialog',
      layerId: 'layer_ui',
      active: false,
      visible: true,
      components: {
        UITransform: { x: 0, y: 0, width: 400, height: 400 }
      }
    };

    const modalBtn = {
      id: 'modal_btn',
      scriptId: 'ModalBtn',
      parentId: 'modal_dialog',
      layerId: 'layer_ui',
      active: true,
      visible: true,
      components: {
        UITransform: { x: 0, y: 0, width: 100, height: 50 }
      }
    };

    uiLayer.entities.push(parentEntity, modalBtn);
    game.world.entities.push(parentEntity, modalBtn);

    game.input.getPointer = () => ({ x: 960, y: 540, down: false });

    expect(PointerRaycast.isPointerOver(game, modalBtn, false)).toBe(false);
    expect(PointerRaycast.isPointerOver(game, modalBtn, true)).toBe(false);
  });

  it('runs mouseEntityInteract node cleanly when useRaycast is false and clicks are triggered', () => {
    const mouseNode = BlueprintInput.items.find(item => item.type === 'mouseEntityInteract');
    expect(mouseNode).toBeDefined();

    const runner = {
      owner: buttonEntity,
      getNodeState: () => ({})
    };
    const context = game.contextSystem.createExecutionContext(runner, mouseNode);
    const executeCode = new Function('inputs', 'outputs', 'context', 'node', mouseNode.defaultData.data.code);

    // Frame 1: Pointer down over button with useRaycast = false
    game.input.getPointer = () => ({ x: 960, y: 540, down: true });
    const frame1Outputs = {};
    executeCode({ targetEntity: 'self', useRaycast: false }, frame1Outputs, context, mouseNode);

    expect(frame1Outputs.execOut).toBe(true);
    expect(frame1Outputs.isHovering).toBe(true);
    expect(frame1Outputs.isHolding).toBe(true);
    expect(frame1Outputs.onDown).toBe(true);
    expect(frame1Outputs.onHover).toBe(true);
    expect(frame1Outputs.onUp).toBeUndefined();

    // Frame 2: Pointer released over button -> onUp is fired
    game.input.getPointer = () => ({ x: 960, y: 540, down: false });
    const frame2Outputs = {};
    executeCode({ targetEntity: 'self', useRaycast: false }, frame2Outputs, context, mouseNode);

    expect(frame2Outputs.execOut).toBe(true);
    expect(frame2Outputs.isHovering).toBe(true);
    expect(frame2Outputs.isHolding).toBe(false);
    expect(frame2Outputs.onDown).toBeUndefined();
    expect(frame2Outputs.onUp).toBe(true);
  });
});
