import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintTopDown } from '@nodes/library/blueprints/BlueprintTopDown.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('topDownAnimator Blueprint & Runtime Tests', () => {
  const animDef = BlueprintTopDown.items.find(i => i.type === 'topDownAnimator');

  it('is registered with correct metadata in BlueprintTopDown and BlueprintHelperTool', () => {
    expect(animDef).toBeDefined();
    expect(animDef.label).toBe('Top-Down Animator');
    expect(animDef.defaultData.settings.category).toBe('Helper & Tool');

    const inHelper = BlueprintHelperTool.items.find(i => i.type === 'topDownAnimator');
    expect(inHelper).toBeDefined();

    const inputIds = animDef.defaultData.inputs.map(i => i.id);
    expect(inputIds).toEqual([
      'execIn',
      'targetEntity',
      'movementState',
      'facingDirection',
      'facingAngle',
      'idleClips',
      'walkClips',
      'runClips',
      'hitClips',
      'isHit',
      'directionMode',
      'autoFlipX'
    ]);

    const outputIds = animDef.defaultData.outputs.map(o => o.id);
    expect(outputIds).toEqual([
      'execOut',
      'onClipChanged',
      'currentClip',
      'activeState',
      'facingDirection',
      'isFlipped'
    ]);

    expect(animDef.defaultData.data.options?.directionMode).toEqual([
      { label: '4-Way (Cardinal)', value: '4way' },
      { label: '8-Way (Cardinal + Diagonals)', value: '8way' },
      { label: 'Rotation (Angle-Based)', value: 'rotation' }
    ]);
  });

  function createMockEnvironment(customTargetProps = {}) {
    const targetEntity = {
      id: 'player_td_anim',
      scriptId: 'player_td_anim',
      components: {
        Transform: { x: 100, y: 100, flipX: false, rotation: 0 },
        Physics: {
          velocityX: 0,
          velocityY: 0,
          movementState: 'idle',
          facingDirection: 'down'
        },
        SpriteAnimator: {
          active: true,
          isPlaying: true,
          currentClip: '',
          _elapsedTime: 0,
          clips: [
            { id: 'clip_idle_d', scriptId: 'idleDown', name: 'idleDown', type: 'clip', frameIndex: 0 },
            { id: 'clip_idle_u', scriptId: 'idleUp', name: 'idleUp', type: 'clip', frameIndex: 0 },
            { id: 'clip_idle_r', scriptId: 'idleRight', name: 'idleRight', type: 'clip', frameIndex: 0 },
            { id: 'clip_idle_l', scriptId: 'idleLeft', name: 'idleLeft', type: 'clip', frameIndex: 0 },
            { id: 'clip_walk_d', scriptId: 'walkDown', name: 'walkDown', type: 'clip', frameIndex: 0 },
            { id: 'clip_walk_u', scriptId: 'walkUp', name: 'walkUp', type: 'clip', frameIndex: 0 },
            { id: 'clip_walk_r', scriptId: 'walkRight', name: 'walkRight', type: 'clip', frameIndex: 0 },
            { id: 'clip_walk_l', scriptId: 'walkLeft', name: 'walkLeft', type: 'clip', frameIndex: 0 },
            { id: 'clip_hit', scriptId: 'hitClip', name: 'hitClip', type: 'clip', frameIndex: 0 }
          ]
        },
        ...customTargetProps
      }
    };

    const mockGame = {
      world: {
        entities: [targetEntity]
      }
    };

    const contextSystem = new ContextSystem(mockGame);
    mockGame.contextSystem = contextSystem;

    const script = {
      id: 'test_anim_script',
      nodes: [
        {
          id: 'node_td_anim_1',
          type: 'topDownAnimator',
          inputs: animDef.defaultData.inputs,
          outputs: animDef.defaultData.outputs,
          data: {
            values: {
              ...animDef.defaultData.data.values,
              targetEntity: 'player_td_anim',
              idleClips: 'idleDown, idleUp, idleRight, idleLeft',
              walkClips: 'walkDown, walkUp, walkRight, walkLeft'
            },
            code: animDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script);
    runner.owner = targetEntity;

    const flowSpy = vi.spyOn(runner, 'executeFlow');

    const runAnimator = (inputOverrides = {}) => {
      Object.assign(script.nodes[0].data.values, inputOverrides);
      runner._executeNodeLogic(script.nodes[0], 'execIn');
      return runner.nodeOutputs.get('node_td_anim_1');
    };

    return { targetEntity, mockGame, runner, node: script.nodes[0], runAnimator, flowSpy };
  }

  it('plays idleDown clip when idle and facing down', () => {
    const { runAnimator, targetEntity, flowSpy } = createMockEnvironment();
    const result = runAnimator({ movementState: 'idle', facingDirection: 'down' });

    expect(flowSpy).toHaveBeenCalledWith('node_td_anim_1', 'execOut');
    expect(flowSpy).toHaveBeenCalledWith('node_td_anim_1', 'onClipChanged');
    expect(result.currentClip).toBe('clip_idle_d');
    expect(result.activeState).toBe('idle');
    expect(result.facingDirection).toBe('down');
    expect(result.isFlipped).toBe(false);
    expect(targetEntity.components.SpriteAnimator.currentClip).toBe('clip_idle_d');
  });

  it('switches to walkUp clip when walking up', () => {
    const { runAnimator, flowSpy } = createMockEnvironment();
    const result = runAnimator({ movementState: 'walk', facingDirection: 'up' });

    expect(flowSpy).toHaveBeenCalledWith('node_td_anim_1', 'onClipChanged');
    expect(result.currentClip).toBe('clip_walk_u');
    expect(result.activeState).toBe('walk');
    expect(result.facingDirection).toBe('up');
    expect(result.isFlipped).toBe(false);
  });

  it('handles 3-way clips with autoFlipX when facing left without explicit left clip', () => {
    const { runAnimator, targetEntity } = createMockEnvironment();
    const result = runAnimator({
      walkClips: 'walkDown, walkUp, walkRight',
      movementState: 'walk',
      facingDirection: 'left',
      autoFlipX: true
    });

    expect(result.currentClip).toBe('clip_walk_r');
    expect(result.facingDirection).toBe('left');
    expect(result.isFlipped).toBe(true);
    expect(targetEntity.components.Transform.flipX).toBe(true);
  });

  it('applies transform rotation in rotation mode', () => {
    const { runAnimator, targetEntity, flowSpy } = createMockEnvironment();
    runAnimator({
      directionMode: 'rotation',
      facingAngle: 135
    });

    expect(flowSpy).toHaveBeenCalledWith('node_td_anim_1', 'execOut');
    expect(targetEntity.components.Transform.rotation).toBe(135);
  });

  it('plays hit clip when isHit is true', () => {
    const { runAnimator } = createMockEnvironment();
    const result = runAnimator({
      hitClips: 'hitClip',
      isHit: true
    });

    expect(result.currentClip).toBe('clip_hit');
    expect(result.activeState).toBe('hit');
  });
});
