import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import ColliderSystem from '@core/System/ColliderSystem.js';
import PhysicsSystem from '@core/System/PhysicsSystem.js';
import { BlueprintPlatformer } from '@nodes/library/blueprints/BlueprintPlatformer.js';

describe('platformerController Blueprint & One-Way Platform Tests', () => {
  const ctrlNodeDef = BlueprintPlatformer.items.find(i => i.type === 'platformerController');

  it('is registered in BlueprintPlatformer with correct oneWayTag default metadata', () => {
    expect(ctrlNodeDef).toBeDefined();
    expect(ctrlNodeDef.label).toBe('Platformer Controller');
    expect(ctrlNodeDef.defaultData.settings.category).toBe('Helper & Tool');
    
    const oneWayInput = ctrlNodeDef.defaultData.inputs.find(i => i.id === 'oneWayTag');
    expect(oneWayInput).toBeDefined();
    expect(oneWayInput.defaultValue).toBe('platform');

    expect(ctrlNodeDef.defaultData.outputs.map(o => o.id)).toContain('isGroundedOnOneWay');
    expect(ctrlNodeDef.defaultData.outputs.map(o => o.id)).toContain('groundType');
    expect(ctrlNodeDef.defaultData.outputs.map(o => o.id)).toContain('onDrop');
  });

  function createTestEnvironment(customTargetProps = {}, platforms = []) {
    const targetEntity = {
      id: 'player_1',
      scriptId: 'player_1',
      components: {
        Transform: { x: 100, y: 150, width: 32, height: 32, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 },
        Physics: {
          enabled: true,
          gravityScale: 1,
          velocityX: 0,
          velocityY: 0,
          isGrounded: true,
          facingDirection: 'right',
          collisionInfo: {}
        },
        Collider: {
          data: [
            { id: 'col1', enabled: true, autoFit: true, type: 'solid', cornerRadius: 0 }
          ]
        },
        ...customTargetProps
      }
    };

    const allEntities = [targetEntity, ...platforms];
    const mockGame = {
      world: {
        settings: { physics: { gravity: 1200, drag: 0 } },
        entities: allEntities,
        layersWorld: [{ _id: 'layer1', visible: true, active: true }],
        layersUI: []
      }
    };

    const colliderSystem = new ColliderSystem(mockGame);
    mockGame.colliderSystem = colliderSystem;
    const physicsSystem = new PhysicsSystem(mockGame);
    mockGame.physicsSystem = physicsSystem;
    const contextSystem = new ContextSystem(mockGame);
    mockGame.contextSystem = contextSystem;

    let pressedKey = null;
    let downKeys = new Set();
    mockGame.input = {
      keyboard: {
        isDown: (k) => downKeys.has(k),
        isPressed: (k) => k === pressedKey,
        isReleased: () => false
      }
    };

    const script = {
      id: 'test_controller_script',
      nodes: [
        {
          id: 'node_ctrl_1',
          type: 'platformerController',
          inputs: ctrlNodeDef.defaultData.inputs,
          outputs: ctrlNodeDef.defaultData.outputs,
          data: {
            values: { ...ctrlNodeDef.defaultData.data.values },
            code: ctrlNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, script);
    runner.owner = targetEntity;

    const flowSpy = vi.spyOn(runner, 'executeFlow');

    const setKey = (press, held = []) => {
      pressedKey = press;
      downKeys = new Set(held);
      if (press) downKeys.add(press);
    };

    const runController = () => {
      runner._executeNodeLogic(script.nodes[0], 'execIn');
      return runner.nodeOutputs.get('node_ctrl_1');
    };

    return { mockGame, colliderSystem, physicsSystem, runner, targetEntity, script, setKey, runController, flowSpy };
  }

  it('handles left and right keyboard movement correctly', () => {
    const { setKey, runController, targetEntity } = createTestEnvironment();

    setKey(null, ['d']);
    let outputs = runController();
    expect(outputs.velocityX).toBe(260);
    expect(outputs.facingDirection).toBe('right');
    expect(targetEntity.components.Physics.velocityX).toBe(260);

    setKey(null, ['a']);
    outputs = runController();
    expect(outputs.velocityX).toBe(-260);
    expect(outputs.facingDirection).toBe('left');
    expect(targetEntity.components.Physics.velocityX).toBe(-260);
  });

  it('triggers jump when grounded and keyJump pressed', () => {
    const { setKey, runController, targetEntity, flowSpy } = createTestEnvironment();
    targetEntity.components.Physics.isGrounded = true;

    setKey('space', []);
    const outputs = runController();
    expect(flowSpy).toHaveBeenCalledWith('node_ctrl_1', 'onJump');
    expect(targetEntity.components.Physics.velocityY).toBe(-520);
    expect(targetEntity.components.Physics.isGrounded).toBe(false);
  });

  describe('One-Way Entity Platform', () => {
    function createEntityPlatform(y = 100, tag = 'platform') {
      return {
        id: 'platform_ent',
        scriptId: 'platform_ent',
        tag,
        components: {
          Transform: { x: 100, y, width: 100, height: 16, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [
              { id: 'p_col', enabled: true, autoFit: true, type: 'solid', cornerRadius: 0 }
            ]
          }
        }
      };
    }

    it('allows jumping through from underneath (tembus saat loncat)', () => {
      const platform = createEntityPlatform(100, 'platform');
      const { targetEntity, colliderSystem, runController } = createTestEnvironment({}, [platform]);

      // Player is at Y = 130 (head is at 114, platform bottom is at 108)
      targetEntity.components.Transform.x = 100;
      targetEntity.components.Transform.y = 130;
      targetEntity.components.Physics.velocityY = -400; // moving upward

      runController(); // Registers oneWayTag = 'platform' onto target & phys

      // Move upward 20px
      const hit = colliderSystem.moveAndSlide(targetEntity, 0, -20);
      expect(hit).toBeNull(); // No collision! Successfully passed through!
      expect(targetEntity.components.Transform.y).toBeCloseTo(110, 5);
    });

    it('lands on top of entity platform from above and detects groundType entity', () => {
      const platform = createEntityPlatform(100, 'platform'); // top is at 92, bottom at 108
      const { targetEntity, colliderSystem, physicsSystem, runController } = createTestEnvironment({}, [platform]);

      // Player falling from above (feet at Y = 90, above platform top at 92)
      targetEntity.components.Transform.x = 100;
      targetEntity.components.Transform.y = 74; // feet at 74 + 16 = 90
      targetEntity.components.Physics.velocityY = 200;

      runController();

      // Move downward onto platform
      const hit = colliderSystem.moveAndSlide(targetEntity, 0, 10);
      expect(hit).not.toBeNull();
      expect(hit.y).toBe(platform);

      // Check grounded
      physicsSystem._checkGrounded(targetEntity, targetEntity.components.Physics);
      expect(targetEntity.components.Physics.isGrounded).toBe(true);
      expect(targetEntity.components.Physics.isGroundedOnOneWay).toBe(true);
      expect(targetEntity.components.Physics.groundType).toBe('entity');

      const outputs = runController();
      expect(outputs.isGrounded).toBe(true);
      expect(outputs.isGroundedOnOneWay).toBe(true);
      expect(outputs.groundType).toBe('entity');
    });

    it('drops through entity platform on Down + Jump (bisa turun)', () => {
      const platform = createEntityPlatform(100, 'platform');
      const { targetEntity, setKey, runController, colliderSystem, flowSpy } = createTestEnvironment({}, [platform]);

      // Player standing on platform (feet at 92, platform top is 92)
      targetEntity.components.Transform.x = 100;
      targetEntity.components.Transform.y = 76;
      targetEntity.components.Physics.isGrounded = true;
      targetEntity.components.Physics.isGroundedOnOneWay = true;
      targetEntity.components.Physics.groundEntity = platform;
      targetEntity.components.Physics.groundType = 'entity';

      // Down + Jump pressed
      setKey('space', ['s']);
      runController();

      expect(flowSpy).toHaveBeenCalledWith('node_ctrl_1', 'onDrop');
      expect(targetEntity._dropThroughTimer).toBeGreaterThan(0);
      expect(targetEntity.components.Physics.velocityY).toBeGreaterThan(0);
      expect(targetEntity.components.Physics.isGrounded).toBe(false);

      // In next frame, moveAndSlide must pass through platform downward
      const hit = colliderSystem.moveAndSlide(targetEntity, 0, 20);
      expect(hit).toBeNull(); // Drops freely through!
    });
  });

  describe('One-Way Tilemap Platform', () => {
    function createTilemapPlatform(y = 100, tag = 'platform') {
      return {
        id: 'tilemap_ent',
        scriptId: 'tilemap_ent',
        tag,
        components: {
          Transform: { x: 0, y, width: 200, height: 32, scaleX: 1, scaleY: 1, pivotX: 0, pivotY: 0 },
          Tilemap: {
            width: 32,
            height: 32,
            isSolid: true,
            // 2 tiles at (2, 0) and (3, 0) -> x: 64 to 128, y: 100 to 132
            data: {
              '2,0': 1,
              '3,0': 1
            }
          }
        }
      };
    }

    it('allows jumping through tilemap from underneath (tembus jika loncat)', () => {
      const tilemap = createTilemapPlatform(100, 'platform');
      const { targetEntity, colliderSystem, runController } = createTestEnvironment({}, [tilemap]);

      // Player below tilemap (x = 80, y = 160)
      targetEntity.components.Transform.x = 80;
      targetEntity.components.Transform.y = 160;
      targetEntity.components.Physics.velocityY = -450;

      runController();

      // Move upward through tilemap
      const hit = colliderSystem.moveAndSlide(targetEntity, 0, -40);
      expect(hit).toBeNull(); // No collision bonk!
      expect(targetEntity.components.Transform.y).toBe(120);
    });

    it('lands on top of tilemap platform from above and detects groundType tilemap', () => {
      const tilemap = createTilemapPlatform(100, 'platform');
      const { targetEntity, colliderSystem, physicsSystem, runController } = createTestEnvironment({}, [tilemap]);

      // Player falling onto tile at x=80, platform top is 100 (feet at 98)
      targetEntity.components.Transform.x = 80;
      targetEntity.components.Transform.y = 82; // feet at 82 + 16 = 98
      targetEntity.components.Physics.velocityY = 180;

      runController();

      const hit = colliderSystem.moveAndSlide(targetEntity, 0, 10);
      expect(hit).not.toBeNull();
      expect(hit.y).toBe(tilemap);

      physicsSystem._checkGrounded(targetEntity, targetEntity.components.Physics);
      expect(targetEntity.components.Physics.isGrounded).toBe(true);
      expect(targetEntity.components.Physics.isGroundedOnOneWay).toBe(true);
      expect(targetEntity.components.Physics.groundType).toBe('tilemap');

      const outputs = runController();
      expect(outputs.isGrounded).toBe(true);
      expect(outputs.isGroundedOnOneWay).toBe(true);
      expect(outputs.groundType).toBe('tilemap');
    });

    it('drops through tilemap platform on Down + Jump (bisa turun)', () => {
      const tilemap = createTilemapPlatform(100, 'platform');
      const { targetEntity, setKey, runController, colliderSystem, flowSpy } = createTestEnvironment({}, [tilemap]);

      // Player grounded on tilemap
      targetEntity.components.Transform.x = 80;
      targetEntity.components.Transform.y = 84;
      targetEntity.components.Physics.isGrounded = true;
      targetEntity.components.Physics.isGroundedOnOneWay = true;
      targetEntity.components.Physics.groundEntity = tilemap;
      targetEntity.components.Physics.groundType = 'tilemap';

      setKey('space', ['s']);
      runController();

      expect(flowSpy).toHaveBeenCalledWith('node_ctrl_1', 'onDrop');
      expect(targetEntity._dropThroughTimer).toBeGreaterThan(0);
      expect(targetEntity.components.Physics.isGrounded).toBe(false);

      // In next frame, moveAndSlide must pass through tilemap downward
      const hit = colliderSystem.moveAndSlide(targetEntity, 0, 30);
      expect(hit).toBeNull();
    });
  });

  describe('Normal Ground Protection', () => {
    it('does not drop through normal solid ground on Down + Jump; jumps instead', () => {
      const solidGround = {
        id: 'solid_ground',
        tag: 'ground', // Not 'platform'!
        components: {
          Transform: { x: 100, y: 200, width: 200, height: 32, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [{ id: 'g_col', enabled: true, autoFit: true, type: 'solid' }]
          }
        }
      };

      const { targetEntity, setKey, runController, flowSpy } = createTestEnvironment({}, [solidGround]);

      targetEntity.components.Physics.isGrounded = true;
      targetEntity.components.Physics.isGroundedOnOneWay = false;
      targetEntity.components.Physics.groundEntity = solidGround;

      // Press Down + Jump on normal solid ground
      setKey('space', ['s']);
      runController();

      // Must NOT drop through normal solid ground! Must jump instead!
      expect(flowSpy).not.toHaveBeenCalledWith('node_ctrl_1', 'onDrop');
      expect(flowSpy).toHaveBeenCalledWith('node_ctrl_1', 'onJump');
      expect(targetEntity.components.Physics.velocityY).toBe(-520);
      expect(targetEntity._dropThroughTimer).toBeFalsy();
    });
  });

  describe('Custom oneWayTag input', () => {
    it('respects custom oneWayTag (e.g. semi_solid)', () => {
      const platform = {
        id: 'custom_plat',
        tag: 'semi_solid',
        components: {
          Transform: { x: 100, y: 100, width: 100, height: 16, scaleX: 1, scaleY: 1, pivotX: 0.5, pivotY: 0.5 },
          Collider: {
            data: [{ id: 'p_col', enabled: true, autoFit: true, type: 'solid' }]
          }
        }
      };

      const { script, targetEntity, setKey, runController, flowSpy } = createTestEnvironment({}, [platform]);

      // Set node input oneWayTag to 'semi_solid'
      script.nodes[0].data.values.oneWayTag = 'semi_solid';

      targetEntity.components.Physics.isGrounded = true;
      targetEntity.components.Physics.isGroundedOnOneWay = true;
      targetEntity.components.Physics.groundEntity = platform;

      setKey('space', ['s']);
      runController();

      expect(flowSpy).toHaveBeenCalledWith('node_ctrl_1', 'onDrop');
      expect(targetEntity._dropThroughTimer).toBeGreaterThan(0);
    });
  });
});
