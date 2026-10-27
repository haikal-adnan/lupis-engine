import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import ColliderSystem from '@core/System/ColliderSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';

describe('platformerCombat Blueprint & Execution Tests', () => {
  const combatNodeDef = BlueprintHelperTool.items.find(i => i.type === 'platformerCombat');

  it('is registered in BlueprintHelperTool with correct metadata', () => {
    expect(combatNodeDef).toBeDefined();
    expect(combatNodeDef.label).toBe('Platformer Combat');
    expect(combatNodeDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(combatNodeDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn',
      'targetEntity',
      'triggerAttack',
      'keyAttack',
      'targetTag',
      'facingDirection',
      'isGrounded',
      'attacksConfig',
      'attackCooldown',
      'comboBufferTime',
      'autoLockMovement'
    ]);
    expect(combatNodeDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut',
      'onAttackStart',
      'onHitboxActive',
      'onHit',
      'onAttackEnd',
      'isAttacking',
      'canMove',
      'isCoolingDown',
      'cooldownRemaining',
      'currentCombo',
      'currentClip',
      'hitTarget',
      'damage'
    ]);
  });

  function createMockEnvironment(customTargetProps = {}, enemies = []) {
    const targetEntity = {
      id: 'player_1',
      scriptId: 'player_1',
      components: {
        Transform: { x: 100, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5, flipX: false },
        Physics: {
          velocityX: 0,
          velocityY: 0,
          isGrounded: true,
          facingDirection: 'right'
        },
        SpriteAnimator: {
          active: true,
          isPlaying: false,
          currentClip: '',
          _elapsedTime: 0,
          clips: [
            { id: 'clip_atk1', scriptId: 'attack1', name: 'attack1', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3, 4] },
            { id: 'clip_atk2', scriptId: 'attack2', name: 'attack2', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3, 4, 5] },
            { id: 'clip_air', scriptId: 'airAttack', name: 'airAttack', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3] }
          ]
        },
        ...customTargetProps
      }
    };

    const allEntities = [targetEntity, ...enemies];
    const mockGame = {
      world: {
        entities: allEntities
      }
    };

    const colliderSystem = new ColliderSystem(mockGame);
    mockGame.colliderSystem = colliderSystem;
    const contextSystem = new ContextSystem(mockGame);
    mockGame.contextSystem = contextSystem;

    let pressedKey = null;
    let downKeys = new Set();
    mockGame.input = {
      keyboard: {
        isDown: (key) => downKeys.has(key),
        isPressed: (key) => key === pressedKey,
        isReleased: () => false
      }
    };

    const script = {
      id: 'test_combat_script',
      nodes: [
        {
          id: 'node_combat_1',
          type: 'platformerCombat',
          inputs: combatNodeDef.defaultData.inputs,
          outputs: combatNodeDef.defaultData.outputs,
          data: {
            values: { ...combatNodeDef.defaultData.data.values },
            code: combatNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script);
    runner.owner = targetEntity;

    const flowSpy = vi.spyOn(runner, 'executeFlow');

    const setKey = (k) => {
      pressedKey = k;
      downKeys.clear();
      if (k) downKeys.add(k);
    };
    const step = () => {
      runner._executeNodeLogic(script.nodes[0], 'execIn');
      return runner.nodeOutputs.get('node_combat_1');
    };

    return { mockGame, runner, targetEntity, node: script.nodes[0], setKey, step, flowSpy };
  }

  it('triggers attack start and locks movement when attack key is pressed', () => {
    const { targetEntity, setKey, step, flowSpy } = createMockEnvironment();
    setKey('j');

    const result = step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onAttackStart');
    expect(result.isAttacking).toBe(true);
    expect(result.canMove).toBe(false);
    expect(result.currentClip).toBe('clip_atk1');
    expect(targetEntity.components.SpriteAnimator.isPlaying).toBe(true);
  });

  it('triggers onHitboxActive and hits enemy when frame is within active window', () => {
    const enemy = {
      id: 'enemy_1',
      tag: 'enemy',
      active: true,
      components: {
        Transform: { x: 130, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5 },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true },
        Health: { current: 100, max: 100 }
      }
    };

    const { targetEntity, setKey, step, flowSpy } = createMockEnvironment({}, [enemy]);
    
    // Step 1: Start attack
    setKey('j');
    step();
    setKey(null);

    // Step 2: Set frame within active window (1 to 3)
    const clip = targetEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk1');
    clip.frameIndex = 2;

    const result = step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onHitboxActive');
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onHit');
    expect(result.hitTarget).toBe('enemy_1');
    expect(result.damage).toBe(10);
    expect(enemy.components.Health.current).toBe(90);
    expect(enemy.components.Physics.velocityX).toBe(150);
  });

  it('reverses knockback when facing left', () => {
    const enemy = {
      id: 'enemy_1',
      tag: 'enemy',
      active: true,
      components: {
        Transform: { x: 70, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5 },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true }
      }
    };

    const { targetEntity, node, setKey, step, flowSpy } = createMockEnvironment({}, [enemy]);
    node.data.values.facingDirection = 'left';

    setKey('j');
    step();
    setKey(null);

    const clip = targetEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk1');
    clip.frameIndex = 2;

    step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onHit');
    expect(enemy.components.Physics.velocityX).toBe(-150);
  });

  it('allows aerial movement drift during air attack', () => {
    const { node, setKey, step, flowSpy } = createMockEnvironment();
    node.data.values.isGrounded = false;
    setKey('j');

    const result = step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onAttackStart');
    expect(result.isAttacking).toBe(true);
    expect(result.canMove).toBe(true);
    expect(result.currentClip).toBe('clip_air');
  });

  it('chains combo attack 1 into attack 2 when buffered', () => {
    const { targetEntity, setKey, step, flowSpy } = createMockEnvironment();

    // Start Attack 1
    setKey('j');
    step();
    setKey(null);

    // Mid-animation: Player presses attack key again (buffer input)
    setKey('j');
    step();
    setKey(null);

    // Finish clip 1 animation
    targetEntity.components.SpriteAnimator.isPlaying = false;
    const clip1 = targetEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk1');
    clip1.frameIndex = 4;

    const result = step();
    // Should trigger attack 2
    expect(result.isAttacking).toBe(true);
    expect(result.currentCombo).toBe(1);
    expect(result.currentClip).toBe('clip_atk2');
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onAttackStart');
  });

  it('triggers onAttackEnd when animation finishes without combo buffer', () => {
    const { targetEntity, setKey, step, flowSpy } = createMockEnvironment();

    // Start Attack 1
    setKey('j');
    step();
    setKey(null);

    // Finish clip 1 animation without buffering
    targetEntity.components.SpriteAnimator.isPlaying = false;
    const clip1 = targetEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk1');
    clip1.frameIndex = 4;

    const result = step();
    expect(result.isAttacking).toBe(false);
    expect(result.canMove).toBe(true);
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onAttackEnd');
  });

  it('seamlessly cooperates with platformerAnimator so attack clip is prioritized over idle/run', () => {
    const animNodeDef = BlueprintHelperTool.items.find(i => i.type === 'platformerAnimator');
    const { runner, targetEntity, node, setKey, step } = createMockEnvironment();

    const animNode = {
      id: 'node_animator_1',
      type: 'platformerAnimator',
      inputs: animNodeDef.defaultData.inputs,
      outputs: animNodeDef.defaultData.outputs,
      data: {
        values: {
          ...animNodeDef.defaultData.data.values,
          idleClips: 'attack1', // fallback test
          runClips: 'attack1',
          targetEntity: 'player_1'
        },
        code: animNodeDef.defaultData.data.code
      }
    };
    runner.data.nodes.push(animNode);
    runner.nodeMap.set('node_animator_1', animNode);
    runner._compileAllNodes();

    // Player presses attack
    setKey('j');
    step(); // runs combat node, sets isAttacking = true and currentClip = clip_atk1
    setKey(null);

    expect(targetEntity.components.SpriteAnimator.currentClip).toBe('clip_atk1');

    // In the same or next tick, Animator runs with movementState = 'idle'
    runner._executeNodeLogic(animNode, 'execIn');
    const animOutputs = runner.nodeOutputs.get('node_animator_1');

    // Animator should yield and NOT overwrite clip_atk1!
    expect(animOutputs.activeState).toBe('attack');
    expect(targetEntity.components.SpriteAnimator.currentClip).toBe('clip_atk1');
  });

  it('platformerController executes without errors and respects speed, knockback, and combat locking', () => {
    const ctrlNodeDef = BlueprintHelperTool.items.find(i => i.type === 'platformerController');
    const { runner, targetEntity, setKey } = createMockEnvironment();

    const ctrlNode = {
      id: 'node_ctrl_1',
      type: 'platformerController',
      inputs: ctrlNodeDef.defaultData.inputs,
      outputs: ctrlNodeDef.defaultData.outputs,
      data: {
        values: {
          ...ctrlNodeDef.defaultData.data.values,
          targetEntity: 'player_1',
          speed: 260,
          jumpForce: 520
        },
        code: ctrlNodeDef.defaultData.data.code
      }
    };
    runner.data.nodes.push(ctrlNode);
    runner.nodeMap.set('node_ctrl_1', ctrlNode);
    runner._compileAllNodes();

    // 1. Normal run right
    setKey('d');
    runner._executeNodeLogic(ctrlNode, 'execIn');
    let outputs = runner.nodeOutputs.get('node_ctrl_1');
    expect(outputs.velocityX).toBe(260);
    expect(targetEntity.components.Physics.velocityX).toBe(260);

    // 2. While knocked back, movement is locked and knockback duration ticks down
    targetEntity._knockback = { duration: 0.25, velocityX: -300, velocityY: -100 };
    targetEntity.components.Physics.velocityX = -300;
    runner._executeNodeLogic(ctrlNode, 'execIn');
    expect(targetEntity._knockback.duration).toBeLessThan(0.25);
    // Keyboard 'd' did not overwrite knockback velocity
    expect(targetEntity.components.Physics.velocityX).toBe(-300);

    // 3. Clear knockback, attack active -> movement locked to 0
    targetEntity._knockback = null;
    targetEntity._combat = { isAttacking: true };
    runner._executeNodeLogic(ctrlNode, 'execIn');
    expect(targetEntity.components.Physics.velocityX).toBe(0);
  });

  it('supports attacksConfig with colliderScriptId and auto-flips hitbox when facing left', () => {
    const enemy = {
      id: 'enemy_left',
      tag: 'enemy',
      active: true,
      components: {
        Transform: { x: 60, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5 },
        Collider: {
          data: [
            { scriptId: 'enemy_hurtbox', type: 'hurtbox', enabled: true, offsetX: 0, offsetY: 0, width: 30, height: 40 }
          ]
        },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true },
        Health: { current: 100, max: 100 }
      }
    };

    const targetProps = {
      Transform: { x: 100, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5, flipX: true },
      Collider: {
        data: [
          { scriptId: 'slash_hitbox_1', type: 'hitbox', enabled: false, autoFlipX: true, offsetX: 35, offsetY: 0, width: 40, height: 32 }
        ]
      }
    };

    const { targetEntity, node, setKey, step, flowSpy } = createMockEnvironment(targetProps, [enemy]);
    node.data.values.facingDirection = 'left';
    node.data.values.attacksConfig = {
      ground: [
        {
          clip: 'attack1',
          startFrame: 1,
          endFrame: 3,
          colliderScriptId: 'slash_hitbox_1',
          damage: 25,
          knockbackX: 180,
          knockbackY: -40
        }
      ]
    };

    // Step 1: Start attack
    setKey('j');
    step();
    setKey(null);

    // Step 2: Set active hitbox frame
    const clip = targetEntity.components.SpriteAnimator.clips.find(c => c.id === 'clip_atk1');
    clip.frameIndex = 2;

    const result = step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onHit');
    expect(result.hitTarget).toBe('enemy_left');
    expect(result.damage).toBe(25);
    expect(enemy.components.Health.current).toBe(75);
    expect(enemy.components.Physics.velocityX).toBe(-180);

    const shape = targetEntity.components.Collider.data[0];
    expect(shape.enabled).toBe(true);

    // Step 3: Finish animation
    clip.frameIndex = 4;
    targetEntity.components.SpriteAnimator.isPlaying = false;
    step();
    expect(shape.enabled).toBe(false);
  });

  it('can be used by Enemy AI via triggerAttack, attackCooldown, and single-attack config', () => {
    const playerTarget = {
      id: 'player_target',
      tag: 'Player',
      active: true,
      components: {
        Transform: { x: 125, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5 },
        Collider: {
          data: [
            { scriptId: 'player_hurtbox', type: 'hurtbox', enabled: true, offsetX: 0, offsetY: 0, width: 30, height: 40 }
          ]
        },
        Physics: { velocityX: 0, velocityY: 0, isGrounded: true },
        Health: { current: 100, max: 100 }
      }
    };

    const enemyProps = {
      id: 'mob_enemy',
      scriptId: 'mob_enemy',
      tag: 'Enemy',
      components: {
        Transform: { x: 100, y: 200, width: 32, height: 48, pivotX: 0.5, pivotY: 0.5, flipX: false },
        Collider: {
          data: [
            { scriptId: 'claw_hitbox', type: 'hitbox', enabled: false, offsetX: 25, offsetY: 0, width: 30, height: 32 }
          ]
        },
        SpriteAnimator: {
          active: true,
          isPlaying: false,
          currentClip: '',
          _elapsedTime: 0,
          clips: [
            { id: 'clip_claw', scriptId: 'attack', name: 'attack', type: 'clip', frameIndex: 0, frames: [0, 1, 2, 3] }
          ]
        }
      }
    };

    const { targetEntity, node, step, flowSpy } = createMockEnvironment(enemyProps.components, [playerTarget]);
    // Configure for Enemy: no keyAttack, triggered by triggerAttack, targeting Player
    node.data.values.keyAttack = '';
    node.data.values.targetTag = 'Player';
    node.data.values.attackCooldown = 1.0;
    node.data.values.attacksConfig = {
      clip: 'attack',
      startFrame: 1,
      endFrame: 2,
      colliderScriptId: 'claw_hitbox',
      damage: 15,
      knockbackX: 120
    };

    // 1. When triggerAttack is false, enemy does not attack
    node.inputs.find(i => i.id === 'triggerAttack').defaultValue = false;
    let res = step();
    expect(res.isAttacking).toBe(false);

    // 2. When inAttackRange triggers (triggerAttack = true), enemy attacks!
    node.data.values.triggerAttack = true;
    res = step();
    expect(res.isAttacking).toBe(true);
    expect(res.currentClip).toBe('clip_claw');
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onAttackStart');

    // 3. Move to hitbox frame
    const clip = targetEntity.components.SpriteAnimator.clips[0];
    clip.frameIndex = 1;
    res = step();
    expect(flowSpy).toHaveBeenCalledWith('node_combat_1', 'onHit');
    expect(res.hitTarget).toBe('player_target');
    expect(res.damage).toBe(15);
    expect(playerTarget.components.Health.current).toBe(85);

    // 4. Finish attack -> enters cooldown
    clip.frameIndex = 3;
    targetEntity.components.SpriteAnimator.isPlaying = false;
    res = step();
    expect(res.isAttacking).toBe(false);
    expect(res.isCoolingDown).toBe(true);
    expect(res.cooldownRemaining).toBeGreaterThan(0);

    // 5. While cooling down, new triggerAttack will NOT attack immediately
    clip.frameIndex = 0;
    res = step();
    expect(res.isAttacking).toBe(false);
  });
});

