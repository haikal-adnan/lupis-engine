import { describe, it, expect } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('platformerAnimator Blueprint & Execution Tests', () => {
  const animNodeDef = BlueprintHelperTool.items.find(i => i.type === 'platformerAnimator');

  it('is registered in BlueprintHelperTool with correct metadata', () => {
    expect(animNodeDef).toBeDefined();
    expect(animNodeDef.label).toBe('Platformer Animator');
    expect(animNodeDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(animNodeDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn',
      'targetEntity',
      'idleClips',
      'runClips',
      'jumpClips',
      'fallClips',
      'movementState',
      'facingDirection',
      'autoFlipX'
    ]);
    expect(animNodeDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut',
      'onClipChanged',
      'currentClip',
      'activeState',
      'facingDirection',
      'isFlipped'
    ]);
  });

  function createMockEnvironment(customTargetProps = {}) {
    const targetEntity = {
      id: 'player_1',
      scriptId: 'player_1',
      components: {
        Transform: { x: 100, y: 200, flipX: false },
        Physics: {
          velocityX: 0,
          velocityY: 0,
          isGrounded: true,
          movementState: 'idle',
          facingDirection: 'right'
        },
        SpriteAnimator: {
          active: true,
          isPlaying: true,
          currentClip: '',
          _elapsedTime: 0,
          clips: [
            { id: 'clip_idle_r', scriptId: 'idleRight', name: 'idleRight', type: 'clip', frameIndex: 0 },
            { id: 'clip_idle_l', scriptId: 'idleLeft', name: 'idleLeft', type: 'clip', frameIndex: 0 },
            { id: 'clip_run_r', scriptId: 'runRight', name: 'runRight', type: 'clip', frameIndex: 0 },
            { id: 'clip_run_l', scriptId: 'runLeft', name: 'runLeft', type: 'clip', frameIndex: 0 },
            { id: 'clip_jump_single', scriptId: 'jump', name: 'jump', type: 'clip', frameIndex: 0 },
            { id: 'clip_fall_single', scriptId: 'fall', name: 'fall', type: 'clip', frameIndex: 0 }
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
      id: 'test_script',
      nodes: [
        {
          id: 'node_animator_1',
          type: 'platformerAnimator',
          inputs: animNodeDef.defaultData.inputs,
          outputs: animNodeDef.defaultData.outputs,
          data: {
            values: { ...animNodeDef.defaultData.data.values },
            code: animNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script);
    runner.owner = targetEntity;
    return { mockGame, runner, targetEntity, node: script.nodes[0] };
  }

  it('plays idleRight when entity is idle facing right', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.runClips = 'runLeft, runRight';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    const outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_idle_r');
    expect(outputs.activeState).toBe('idle');
    expect(outputs.facingDirection).toBe('right');
    expect(outputs.isFlipped).toBe(false);
    expect(targetEntity.components.SpriteAnimator.currentClip).toBe('clip_idle_r');
  });

  it('plays idleLeft when entity is idle facing left with dual clips', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    targetEntity.components.Physics.facingDirection = 'left';
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    const outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_idle_l');
    expect(outputs.activeState).toBe('idle');
    expect(outputs.facingDirection).toBe('left');
    expect(outputs.isFlipped).toBe(false);
    expect(targetEntity.components.Transform.flipX).toBe(false);
  });

  it('auto-flips transform when facing left with single clip', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    targetEntity.components.Physics.facingDirection = 'left';
    node.data.values.idleClips = 'jump';
    node.data.values.autoFlipX = true;
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    const outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_jump_single');
    expect(outputs.facingDirection).toBe('left');
    expect(outputs.isFlipped).toBe(true);
    expect(targetEntity.components.Transform.flipX).toBe(true);
  });

  it('switches to run clip when moving horizontally', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    targetEntity.components.Physics.velocityX = 150;
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.runClips = 'runLeft, runRight';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    const outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_run_r');
    expect(outputs.activeState).toBe('run');
  });

  it('detects jumping and falling states from Physics velocity', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    targetEntity.components.Physics.isGrounded = false;
    targetEntity.components.Physics.velocityY = -300;
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.jumpClips = 'jump';
    node.data.values.fallClips = 'fall';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    let outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_jump_single');
    expect(outputs.activeState).toBe('jump');

    // Now falling
    targetEntity.components.Physics.velocityY = 250;
    runner._executeNodeLogic(node, 'execIn');
    outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_fall_single');
    expect(outputs.activeState).toBe('fall');
  });

  it('falls back to jump clip if fall clip is not specified', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    targetEntity.components.Physics.isGrounded = false;
    targetEntity.components.Physics.velocityY = 250;
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.jumpClips = 'jump';
    node.data.values.fallClips = '';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    const outputs = runner.nodeOutputs.get('node_animator_1');
    expect(outputs.currentClip).toBe('clip_jump_single');
  });

  it('is tick-safe: consecutive executions do not reset clip elapsedTime or frameIndex', () => {
    const { runner, targetEntity, node } = createMockEnvironment();
    node.data.values.idleClips = 'idleLeft, idleRight';
    node.data.values.targetEntity = 'player_1';

    runner._executeNodeLogic(node, 'execIn');

    // Simulate progress in AnimatorSystem
    targetEntity.components.SpriteAnimator._elapsedTime = 0.08;
    targetEntity.components.SpriteAnimator.clips[0].frameIndex = 2;

    // Tick again with same state
    runner._executeNodeLogic(node, 'execIn');

    // Should NOT be reset to 0 because clip did not change!
    expect(targetEntity.components.SpriteAnimator._elapsedTime).toBe(0.08);
    expect(targetEntity.components.SpriteAnimator.clips[0].frameIndex).toBe(2);
  });
});
