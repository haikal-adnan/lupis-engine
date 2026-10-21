import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('Enemy AI (enemyChaser & enemyCombat) Blueprint & Execution Tests', () => {
  const chaserDef = BlueprintHelperTool.items.find(i => i.type === 'enemyChaser');
  const combatDef = BlueprintHelperTool.items.find(i => i.type === 'enemyCombat');

  it('both nodes are registered in BlueprintHelperTool with correct metadata', () => {
    expect(chaserDef).toBeDefined();
    expect(chaserDef.label).toBe('Enemy Chaser');
    expect(chaserDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(chaserDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn',
      'targetEntity',
      'playerTag',
      'detectRadius',
      'loseRadius',
      'stopRadius',
      'chaseSpeed',
      'patrolSpeed',
      'patrolDistance',
      'autoFlipX'
    ]);
    expect(chaserDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut',
      'onTargetAcquired',
      'onTargetLost',
      'onInAttackRange',
      'isChasing',
      'inAttackRange',
      'movementState',
      'distanceToTarget',
      'facingDirection',
      'targetPlayer'
    ]);

    expect(combatDef).toBeDefined();
    expect(combatDef.label).toBe('Enemy Combat');
    expect(combatDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(combatDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn',
      'triggerAttack',
      'targetEntity',
      'playerTag',
      'attackClip',
      'attackCooldown',
      'startFrame',
      'endFrame',
      'hitboxConfig',
      'damage',
      'knockbackX',
      'knockbackY',
      'autoTriggerInRange',
      'facingDirection'
    ]);
    expect(combatDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut',
      'onAttackStart',
      'onHitboxActive',
      'onHit',
      'onAttackEnd',
      'isAttacking',
      'isCoolingDown',
      'cooldownRemaining',
      'currentClip',
      'damageDealt',
      'hitPlayer'
    ]);
  });

  function createMockEnvironment(playerPos = { x: 500, y: 100 }) {
    const enemyEntity = {
      id: 'enemy_1',
      scriptId: 'enemy_1',
      tag: 'enemy',
      components: {
        Transform: { x: 100, y: 100, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5, flipX: false },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true, facingDirection: 'right' },
        SpriteAnimator: {
          active: true,
          isPlaying: false,
          currentClip: '',
          _elapsedTime: 0,
          clips: [
            { id: 'clip_idle', scriptId: 'idle', name: 'idle', type: 'clip', frameIndex: 0, frames: [0, 1] },
            { id: 'clip_walk', scriptId: 'walk', name: 'walk', type: 'clip', frameIndex: 0, frames: [0, 1, 2] },
            { id: 'clip_run', scriptId: 'run', name: 'run', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3] },
            { id: 'clip_atk', scriptId: 'attack', name: 'attack', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3, 4] }
          ]
        }
      }
    };

    const playerEntity = {
      id: 'player_1',
      scriptId: 'player_1',
      tag: 'player',
      active: true,
      components: {
        Transform: { x: playerPos.x, y: playerPos.y, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5 },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true },
        Health: { current: 100, max: 100 }
      }
    };

    const mockGame = {
      world: {
        entities: [enemyEntity, playerEntity]
      }
    };

    const contextSystem = new ContextSystem(mockGame);
    mockGame.contextSystem = contextSystem;

    const script = {
      id: 'enemy_ai_script',
      nodes: [
        {
          id: 'node_chaser',
          type: 'enemyChaser',
          inputs: chaserDef.defaultData.inputs,
          outputs: chaserDef.defaultData.outputs,
          data: {
            values: { ...chaserDef.defaultData.data.values, targetEntity: 'enemy_1' },
            code: chaserDef.defaultData.data.code
          }
        },
        {
          id: 'node_combat',
          type: 'enemyCombat',
          inputs: combatDef.defaultData.inputs,
          outputs: combatDef.defaultData.outputs,
          data: {
            values: { ...combatDef.defaultData.data.values, targetEntity: 'enemy_1' },
            code: combatDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script, enemyEntity);
    const flowSpy = vi.spyOn(runner, 'executeFlow');

    const stepChaser = () => {
      runner._executeNodeLogic(script.nodes[0], 'execIn');
      return runner.nodeOutputs.get('node_chaser');
    };

    const stepCombat = () => {
      runner._executeNodeLogic(script.nodes[1], 'execIn');
      return runner.nodeOutputs.get('node_combat');
    };

    return { runner, enemyEntity, playerEntity, stepChaser, stepCombat, flowSpy, script };
  }

  it('patrols when player is far away outside detectRadius', () => {
    const { stepChaser, enemyEntity } = createMockEnvironment({ x: 800, y: 100 }); // far away

    const result = stepChaser();
    expect(result.isChasing).toBe(false);
    expect(result.inAttackRange).toBe(false);
    expect(result.movementState).toBe('walk');
    expect(enemyEntity.components.Physics.velocityX).toBe(70); // patrol speed
    expect(enemyEntity.components.Physics.movementState).toBe('walk');
  });

  it('detects and chases player when player enters detectRadius', () => {
    const { stepChaser, enemyEntity, flowSpy } = createMockEnvironment({ x: 250, y: 100 }); // distance = 150 <= 250

    const result = stepChaser();
    expect(flowSpy).toHaveBeenCalledWith('node_chaser', 'onTargetAcquired');
    expect(result.isChasing).toBe(true);
    expect(result.inAttackRange).toBe(false);
    expect(result.movementState).toBe('run');
    expect(result.facingDirection).toBe('right');
    expect(enemyEntity.components.Physics.velocityX).toBe(160); // chase speed
    expect(enemyEntity.components.Physics.movementState).toBe('run');
    expect(enemyEntity.components.Transform.flipX).toBe(false);
  });

  it('stops and faces player when within stopRadius (attack range)', () => {
    const { stepChaser, enemyEntity, flowSpy } = createMockEnvironment({ x: 130, y: 100 }); // distance = 30 <= 45

    const result = stepChaser();
    expect(flowSpy).toHaveBeenCalledWith('node_chaser', 'onInAttackRange');
    expect(result.isChasing).toBe(true);
    expect(result.inAttackRange).toBe(true);
    expect(result.movementState).toBe('idle');
    expect(enemyEntity.components.Physics.velocityX).toBe(0); // stops moving!
    expect(enemyEntity.components.Physics.movementState).toBe('idle');
  });

  it('enemyCombat automatically triggers attack when enemy is in attack range', () => {
    const { stepChaser, stepCombat, enemyEntity, flowSpy } = createMockEnvironment({ x: 130, y: 100 });

    // Step 1: Chaser sees player in attack range
    stepChaser();

    // Step 2: Combat node runs, automatically detects inAttackRange from enemy AI and triggers attack
    const result = stepCombat();
    expect(flowSpy).toHaveBeenCalledWith('node_combat', 'onAttackStart');
    expect(result.isAttacking).toBe(true);
    expect(result.currentClip).toBe('clip_atk');
    expect(enemyEntity.components.SpriteAnimator.currentClip).toBe('clip_atk');
  });

  it('enemyCombat hits player, reduces health and applies knockback on active frames', () => {
    const { stepChaser, stepCombat, enemyEntity, playerEntity, flowSpy } = createMockEnvironment({ x: 130, y: 100 });

    stepChaser();
    stepCombat();

    // Advance animation frame to frame 2 (within startFrame: 1 and endFrame: 3)
    const clip = enemyEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk');
    clip.frameIndex = 2;

    const result = stepCombat();
    expect(flowSpy).toHaveBeenCalledWith('node_combat', 'onHit');
    expect(result.damageDealt).toBe(10);
    expect(playerEntity.components.Health.current).toBe(90);
    expect(playerEntity._knockback).toBeDefined();
    expect(playerEntity._knockback.duration).toBe(0.25);
    expect(playerEntity.components.Physics.velocityX).toBe(180);
    expect(playerEntity.components.Physics.velocityY).toBe(-60);
  });

  it('enemyCombat respects attack cooldown between attacks', () => {
    const { stepChaser, stepCombat, enemyEntity } = createMockEnvironment({ x: 130, y: 100 });

    stepChaser();
    stepCombat();

    // Simulate animation finished
    enemyEntity.components.SpriteAnimator.isPlaying = false;
    const endResult = stepCombat();
    expect(endResult.isAttacking).toBe(false);
    expect(endResult.isCoolingDown).toBe(true);

    // Immediate next step should NOT trigger attack because cooling down
    const coolResult = stepCombat();
    expect(coolResult.isAttacking).toBe(false);
  });

  it('enemyChaser seamlessly drives platformerAnimator via movementState', () => {
    const { stepChaser, enemyEntity, playerEntity, runner, script } = createMockEnvironment({ x: 800, y: 100 });
    const animDef = BlueprintHelperTool.items.find(i => i.type === 'platformerAnimator');
    const animNode = {
      id: 'node_animator',
      type: 'platformerAnimator',
      inputs: animDef.defaultData.inputs,
      outputs: animDef.defaultData.outputs,
      data: {
        values: {
          ...animDef.defaultData.data.values,
          targetEntity: 'enemy_1',
          idleClips: 'idle',
          walkClips: 'walk',
          runClips: 'run'
        },
        code: animDef.defaultData.data.code
      }
    };
    runner.nodeMap.set('node_animator', animNode);
    runner._compileAllNodes();
    script.nodes.push(animNode);

    // 1. Patrol -> walk
    const chaserOut = stepChaser();
    expect(chaserOut.movementState).toBe('walk');
    runner._executeNodeLogic(animNode, 'execIn');
    let animOut = runner.nodeOutputs.get('node_animator');
    expect(animOut.currentClip).toBe('clip_walk');
    expect(animOut.activeState).toBe('walk');

    // 2. Player approaches -> chase -> run
    playerEntity.components.Transform.x = 250; // within 250 detect radius
    const chaseOut = stepChaser();
    expect(chaseOut.movementState).toBe('run');
    runner._executeNodeLogic(animNode, 'execIn');
    animOut = runner.nodeOutputs.get('node_animator');
    expect(animOut.currentClip).toBe('clip_run');
    expect(animOut.activeState).toBe('run');

    // 3. Stop in attack range -> idle
    playerEntity.components.Transform.x = 130; // within 45 stop radius
    const stopOut = stepChaser();
    expect(stopOut.movementState).toBe('idle');
    runner._executeNodeLogic(animNode, 'execIn');
    animOut = runner.nodeOutputs.get('node_animator');
    expect(animOut.currentClip).toBe('clip_idle');
    expect(animOut.activeState).toBe('idle');
  });

  it('enemyChaser handles knockback and combat attacking states without undefined isChasing error', () => {
    const { stepChaser, enemyEntity } = createMockEnvironment({ x: 250, y: 100 });

    // 1. Normal chase
    let res = stepChaser();
    expect(res.isChasing).toBe(true);

    // 2. Knockback active: must still output isChasing (boolean) and hit movementState
    enemyEntity._knockback = { duration: 0.5 };
    res = stepChaser();
    expect(res).toBeDefined();
    expect(typeof res.isChasing).toBe('boolean');
    expect(res.movementState).toBe('hit');

    // 3. Combat attack active: must still output isChasing (boolean) and attack movementState
    enemyEntity._knockback.duration = 0;
    enemyEntity._combat = { isAttacking: true };
    res = stepChaser();
    expect(res).toBeDefined();
    expect(typeof res.isChasing).toBe('boolean');
    expect(res.movementState).toBe('attack');
  });

  it('enemyChaser safely handles missing/undefined helper return without throwing cannot read properties of undefined', () => {
    const { runner, script } = createMockEnvironment();
    runner.game.contextSystem.toolkitHandler.createFacade = () => ({
      ai: {
        processChaser: () => undefined
      }
    });

    expect(() => {
      runner._executeNodeLogic(script.nodes[0], 'execIn');
    }).not.toThrow();
  });
});
