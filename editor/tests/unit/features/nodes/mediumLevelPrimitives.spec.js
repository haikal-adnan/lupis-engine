import { describe, it, expect, vi } from 'vitest';
import { findBlueprintByType, ALL_BLUEPRINTS } from '@nodes/library/blueprints/index.js';
import { BlueprintMath } from '@nodes/library/blueprints/BlueprintMath.js';
import { BlueprintAnimation } from '@nodes/library/blueprints/BlueprintAnimation.js';
import { BlueprintPhysics } from '@nodes/library/blueprints/BlueprintPhysics.js';
import { BlueprintFlow } from '@nodes/library/blueprints/BlueprintFlow.js';
import { BlueprintDialogue } from '@nodes/library/blueprints/BlueprintDialogue.js';
import { BlueprintAI } from '@nodes/library/blueprints/BlueprintAI.js';

describe('Medium & Low Level Blueprint Primitives Specification', () => {

  function executeNode(blueprint, inputs = {}, contextState = {}, mockContextExt = {}) {
    const outputs = {};
    const context = {
      state: contextState,
      dt: 0.016,
      deltaTime: 0.016,
      currentInputPort: 'execIn',
      triggerFlow: vi.fn((portId) => {
        outputs[portId] = true;
      }),
      assert: {
        exists: (val, msg) => {
          if (!val) throw new Error(msg || 'Assertion failed: entity does not exist');
          return val;
        },
        hasComponent: (entity, compName) => {
          if (!entity || !entity.components || !entity.components[compName]) {
            throw new Error(`Entity missing ${compName}`);
          }
          return entity.components[compName];
        }
      },
      ...mockContextExt
    };

    const nodeData = blueprint.defaultData;
    const fn = new Function('inputs', 'outputs', 'context', 'node', nodeData.data.code);
    fn(inputs, outputs, context, nodeData);
    return { outputs, context };
  }

  // -------------------------------------------------------------
  // 1. snapValue (BlueprintMath)
  // -------------------------------------------------------------
  describe('1. snapValue (Math & Random)', () => {
    const def = BlueprintMath.items.find(i => i.type === 'snapValue');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('snapValue')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['value', 'step', 'min', 'max']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual(['result']);
    });

    it('snaps numbers to step increments without limits', () => {
      const { outputs: o1 } = executeNode(def, { value: 23, step: 10 });
      expect(o1.result).toBe(20);

      const { outputs: o2 } = executeNode(def, { value: 27, step: 10 });
      expect(o2.result).toBe(30);

      const { outputs: o3 } = executeNode(def, { value: 15, step: 5 });
      expect(o3.result).toBe(15);
    });

    it('clamps snapped values within min and max boundaries', () => {
      // Below min clamp
      const { outputs: oMin } = executeNode(def, { value: 5, step: 10, min: 20 });
      expect(oMin.result).toBe(20);

      // Above max clamp
      const { outputs: oMax } = executeNode(def, { value: 95, step: 10, max: 70 });
      expect(oMax.result).toBe(70);

      // Between min and max
      const { outputs: oMid } = executeNode(def, { value: 44, step: 10, min: 10, max: 50 });
      expect(oMid.result).toBe(40);
    });

    it('handles floating point step snapping cleanly', () => {
      const { outputs } = executeNode(def, { value: 0.24, step: 0.1 });
      expect(o => Math.abs(outputs.result - 0.2) < 0.0001).toBeTruthy();
    });
  });

  // -------------------------------------------------------------
  // 2. onAnimationFrame (BlueprintAnimation)
  // -------------------------------------------------------------
  describe('2. onAnimationFrame (Animation)', () => {
    const def = BlueprintAnimation.items.find(i => i.type === 'onAnimationFrame');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('onAnimationFrame')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'targetEntity', 'clipId', 'frameIndex', 'endFrame']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual([
        'execOut', 'onFrameEnter', 'onFrameActive', 'onFrameExit', 'currentFrame', 'isActive'
      ]);
    });

    it('triggers onFrameEnter and onFrameActive upon entering target frame range', () => {
      const entity = {
        id: 'hero',
        components: {
          SpriteAnimator: {
            currentClip: 'attack',
            clips: [{ id: 'attack', frameIndex: 2 }]
          }
        }
      };

      const { outputs, context } = executeNode(def, {
        execIn: true,
        targetEntity: 'hero',
        clipId: 'attack',
        frameIndex: 2,
        endFrame: 4
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.execOut).toBe(true);
      expect(outputs.isActive).toBe(true);
      expect(outputs.currentFrame).toBe(2);
      expect(outputs.onFrameEnter).toBe(true);
      expect(outputs.onFrameActive).toBe(true);
      expect(context.state._animFrame_hero).toBe(true);
    });

    it('does not re-trigger onFrameEnter while remaining in active frame range', () => {
      const entity = {
        id: 'hero',
        components: {
          SpriteAnimator: {
            currentClip: 'attack',
            clips: [{ id: 'attack', frameIndex: 3 }]
          }
        }
      };

      const existingState = { _animFrame_hero: true };
      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'hero',
        clipId: 'attack',
        frameIndex: 2,
        endFrame: 4
      }, existingState, {
        entity: { get: () => entity }
      });

      expect(outputs.isActive).toBe(true);
      expect(outputs.onFrameActive).toBe(true);
      expect(outputs.onFrameEnter).toBeUndefined();
    });

    it('triggers onFrameExit when exiting the target frame range', () => {
      const entity = {
        id: 'hero',
        components: {
          SpriteAnimator: {
            currentClip: 'attack',
            clips: [{ id: 'attack', frameIndex: 5 }]
          }
        }
      };

      const existingState = { _animFrame_hero: true };
      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'hero',
        clipId: 'attack',
        frameIndex: 2,
        endFrame: 4
      }, existingState, {
        entity: { get: () => entity }
      });

      expect(outputs.isActive).toBe(false);
      expect(outputs.onFrameExit).toBe(true);
      expect(outputs.onFrameActive).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 3. applyKnockback (BlueprintPhysics)
  // -------------------------------------------------------------
  describe('3. applyKnockback (Physics & Collision)', () => {
    const def = BlueprintPhysics.items.find(i => i.type === 'applyKnockback');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('applyKnockback')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'targetEntity', 'forceX', 'forceY', 'duration', 'friction']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual(['execOut', 'onFinished', 'isKnocked']);
    });

    it('applies initial impulse to physics component and sets knockback state', () => {
      const phys = { velocityX: 0, velocityY: 0 };
      const entity = { id: 'enemy_1', components: { Physics: phys } };

      const { outputs, context } = executeNode(def, {
        execIn: true,
        targetEntity: 'enemy_1',
        forceX: 300,
        forceY: -150,
        duration: 200,
        friction: 0.8
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.execOut).toBe(true);
      expect(outputs.isKnocked).toBe(true);
      expect(phys.velocityX).toBe(300);
      expect(phys.velocityY).toBe(-150);
      expect(phys._knockbackActive).toBe(true);
      expect(context.state.isKnocked).toBe(true);
      expect(context.state.knockbackRemaining).toBe(200);
    });

    it('completes immediately when duration is 0', () => {
      const phys = { velocityX: 0, velocityY: 0 };
      const entity = { id: 'enemy_2', components: { Physics: phys } };

      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'enemy_2',
        forceX: 100,
        forceY: 0,
        duration: 0
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.execOut).toBe(true);
      expect(outputs.isKnocked).toBe(false);
      expect(outputs.onFinished).toBe(true);
    });

    it('decelerates via onTick callback until finished', () => {
      const phys = { velocityX: 0, velocityY: 0 };
      const entity = { id: 'enemy_3', components: { Physics: phys } };
      let tickCallback = null;

      const { outputs, context } = executeNode(def, {
        execIn: true,
        targetEntity: 'enemy_3',
        forceX: 200,
        forceY: -100,
        duration: 50,
        friction: 0.5
      }, {}, {
        entity: { get: () => entity },
        onTick: (cb) => { tickCallback = cb; }
      });

      expect(typeof tickCallback).toBe('function');

      // Tick 1 (30ms passed)
      tickCallback(0.03);
      expect(phys.velocityX).toBe(100);
      expect(context.state.knockbackRemaining).toBe(20);
      expect(context.state.isKnocked).toBe(true);

      // Tick 2 (30ms passed, duration expired)
      tickCallback(0.03);
      expect(context.state.isKnocked).toBe(false);
      expect(phys._knockbackActive).toBe(false);
      expect(outputs.onFinished).toBe(true);
      expect(outputs.isKnocked).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 4. logicTypewriter (BlueprintFlow)
  // -------------------------------------------------------------
  describe('4. logicTypewriter (Flow & Logic)', () => {
    const def = BlueprintFlow.items.find(i => i.type === 'logicTypewriter');

    it('is registered with valid metadata and enhanced ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('logicTypewriter')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'skip', 'targetEntity', 'text', 'speed']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual(['execOut', 'onChar', 'onComplete', 'isTyping', 'currentText']);
    });

    it('animates text character by character on consecutive steps', () => {
      const textRenderer = { value: '' };
      const entity = { id: 'narrator', components: { TextRenderer: textRenderer } };
      const contextState = {};

      // Step 1: 50ms (first char 'H' typed)
      const { outputs: o1 } = executeNode(def, {
        execIn: true,
        targetEntity: 'narrator',
        text: 'Hello',
        speed: 50
      }, contextState, {
        dt: 0.05,
        entity: { get: () => entity }
      });

      expect(o1.isTyping).toBe(true);
      expect(o1.currentText).toBe('H');
      expect(textRenderer.value).toBe('H');
      expect(o1.onChar).toBe(true);

      // Step 2: 100ms (next two chars 'el' typed -> 'Hel')
      const { outputs: o2 } = executeNode(def, {
        execIn: true,
        targetEntity: 'narrator',
        text: 'Hello',
        speed: 50
      }, contextState, {
        dt: 0.10,
        entity: { get: () => entity }
      });

      expect(o2.isTyping).toBe(true);
      expect(o2.currentText).toBe('Hel');
      expect(textRenderer.value).toBe('Hel');
    });

    it('immediately finishes text when skip port is triggered', () => {
      const textRenderer = { value: 'Hel' };
      const entity = { id: 'narrator', components: { TextRenderer: textRenderer } };
      const contextState = {
        isTyping: true,
        cachedTarget: 'Hello World',
        typewriterIndex: 3
      };

      const { outputs } = executeNode(def, {
        skip: true,
        targetEntity: 'narrator'
      }, contextState, {
        currentInputPort: 'skip',
        entity: { get: () => entity }
      });

      expect(outputs.isTyping).toBe(false);
      expect(outputs.onComplete).toBe(true);
      expect(outputs.currentText).toBe('Hello World');
      expect(textRenderer.value).toBe('Hello World');
    });
  });

  // -------------------------------------------------------------
  // 5. interpolateVariables (BlueprintDialogue)
  // -------------------------------------------------------------
  describe('5. interpolateVariables (Dialogue & Narrative)', () => {
    const def = BlueprintDialogue.items.find(i => i.type === 'interpolateVariables');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('interpolateVariables')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['text', 'customMap']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual(['result', 'tokenCount']);
    });

    it('interpolates tokens from customMap', () => {
      const { outputs } = executeNode(def, {
        text: 'Welcome {player}, you have {gold} gold coins!',
        customMap: { player: 'Arthur', gold: 150 }
      });

      expect(outputs.result).toBe('Welcome Arthur, you have 150 gold coins!');
      expect(outputs.tokenCount).toBe(2);
    });

    it('resolves tokens from context global and local variables', () => {
      const { outputs } = executeNode(def, {
        text: 'Zone: {zoneName}, Level: {level}'
      }, {
        level: 42
      }, {
        global: { get: (k) => k === 'zoneName' ? 'Sanctuary' : null }
      });

      expect(outputs.result).toBe('Zone: Sanctuary, Level: 42');
      expect(outputs.tokenCount).toBe(2);
    });

    it('retains untouched tokens when variable is not found', () => {
      const { outputs } = executeNode(def, {
        text: 'Hello {unknown}!'
      });

      expect(outputs.result).toBe('Hello {unknown}!');
      expect(outputs.tokenCount).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 6. proximitySensor (BlueprintAI)
  // -------------------------------------------------------------
  describe('6. proximitySensor (Enemy & AI)', () => {
    const def = BlueprintAI.items.find(i => i.type === 'proximitySensor');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('proximitySensor')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual(['execIn', 'sourceEntity', 'targetEntity', 'targetTag', 'radius']);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual([
        'execOut', 'onDetected', 'onLost', 'inRange', 'distance', 'directionX', 'directionY', 'facingDirection', 'detectedEntity'
      ]);
    });

    it('detects target within radius and calculates direction vector and facing direction', () => {
      const source = { id: 'goblin', components: { Transform: { x: 100, y: 100 } } };
      const target = { id: 'player_1', components: { Transform: { x: 160, y: 100 } } };

      const { outputs } = executeNode(def, {
        execIn: true,
        sourceEntity: 'goblin',
        targetEntity: 'player_1',
        radius: 100
      }, {}, {
        entity: {
          get: (id) => (id === 'goblin' ? source : target)
        }
      });

      expect(outputs.inRange).toBe(true);
      expect(outputs.distance).toBe(60);
      expect(outputs.directionX).toBe(1);
      expect(outputs.directionY).toBe(0);
      expect(outputs.facingDirection).toBe('right');
      expect(outputs.onDetected).toBe(true);
    });

    it('triggers onLost when target leaves proximity radius', () => {
      const source = { id: 'goblin', components: { Transform: { x: 100, y: 100 } } };
      const target = { id: 'player_1', components: { Transform: { x: 350, y: 100 } } };
      const contextState = { _prox_goblin: true };

      const { outputs } = executeNode(def, {
        execIn: true,
        sourceEntity: 'goblin',
        targetEntity: 'player_1',
        radius: 100
      }, contextState, {
        entity: {
          get: (id) => (id === 'goblin' ? source : target)
        }
      });

      expect(outputs.inRange).toBe(false);
      expect(outputs.distance).toBe(250);
      expect(outputs.onLost).toBe(true);
      expect(outputs.onDetected).toBeUndefined();
    });
  });

  // -------------------------------------------------------------
  // 7. pingPongStepper (BlueprintAI)
  // -------------------------------------------------------------
  describe('7. pingPongStepper (Enemy & AI)', () => {
    const def = BlueprintAI.items.find(i => i.type === 'pingPongStepper');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('pingPongStepper')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual([
        'execIn', 'currentPos', 'minPos', 'maxPos', 'speed', 'direction', 'targetEntity', 'axis'
      ]);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual([
        'execOut', 'onBounce', 'nextPos', 'nextDirection', 'isAtBoundary'
      ]);
    });

    it('increments position while between min and max bounds', () => {
      const { outputs } = executeNode(def, {
        execIn: true,
        currentPos: 50,
        minPos: 0,
        maxPos: 100,
        speed: 10,
        direction: 1
      });

      expect(outputs.nextPos).toBe(60);
      expect(outputs.nextDirection).toBe(1);
      expect(outputs.isAtBoundary).toBe(false);
      expect(outputs.onBounce).toBeUndefined();
    });

    it('reverses direction and fires onBounce when reaching max bound', () => {
      const { outputs } = executeNode(def, {
        execIn: true,
        currentPos: 95,
        minPos: 0,
        maxPos: 100,
        speed: 10,
        direction: 1
      });

      expect(outputs.nextPos).toBe(100);
      expect(outputs.nextDirection).toBe(-1);
      expect(outputs.isAtBoundary).toBe(true);
      expect(outputs.onBounce).toBe(true);
    });

    it('reverses direction and fires onBounce when reaching min bound', () => {
      const { outputs } = executeNode(def, {
        execIn: true,
        currentPos: 5,
        minPos: 0,
        maxPos: 100,
        speed: 10,
        direction: -1
      });

      expect(outputs.nextPos).toBe(0);
      expect(outputs.nextDirection).toBe(1);
      expect(outputs.isAtBoundary).toBe(true);
      expect(outputs.onBounce).toBe(true);
    });

    it('updates entity Transform directly when targetEntity is supplied', () => {
      const transform = { x: 50, y: 100 };
      const entity = { id: 'patrol_bot', components: { Transform: transform } };

      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'patrol_bot',
        axis: 'x',
        minPos: 0,
        maxPos: 100,
        speed: 15,
        direction: 1
      }, {}, {
        entity: { get: () => entity }
      });

      expect(transform.x).toBe(65);
      expect(outputs.nextPos).toBe(65);
    });
  });

  // -------------------------------------------------------------
  // 8. raycast2D (BlueprintPhysics)
  // -------------------------------------------------------------
  describe('8. raycast2D (Physics & Collision)', () => {
    const def = BlueprintPhysics.items.find(i => i.type === 'raycast2D');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('raycast2D')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual([
        'execIn', 'sourceEntity', 'useEntityOrigin', 'originX', 'originY', 'dirX', 'dirY', 'distance', 'stepSize', 'targetTag'
      ]);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual([
        'execOut', 'onHit', 'onMiss', 'hasHit', 'hitX', 'hitY', 'hitDistance', 'hitEntity'
      ]);
    });

    it('detects obstacle in ray path and triggers onHit', () => {
      const wall = {
        id: 'wall_1',
        active: true,
        components: {
          Transform: { x: 100, y: 0, width: 32, height: 32 }
        }
      };

      const { outputs } = executeNode(def, {
        execIn: true,
        useEntityOrigin: false,
        originX: 0,
        originY: 0,
        dirX: 1,
        dirY: 0,
        distance: 150,
        stepSize: 10
      }, {}, {
        game: { world: { entities: [wall] } }
      });

      expect(outputs.hasHit).toBe(true);
      expect(outputs.onHit).toBe(true);
      expect(outputs.hitEntity).toBe('wall_1');
      expect(outputs.hitX).toBeGreaterThanOrEqual(84);
      expect(outputs.hitDistance).toBeGreaterThanOrEqual(80);
    });

    it('triggers onMiss when ray misses all targets', () => {
      const obstacle = {
        id: 'obstacle_high',
        active: true,
        components: {
          Transform: { x: 100, y: 500, width: 32, height: 32 }
        }
      };

      const { outputs } = executeNode(def, {
        execIn: true,
        useEntityOrigin: false,
        originX: 0,
        originY: 0,
        dirX: 1,
        dirY: 0,
        distance: 100,
        stepSize: 10
      }, {}, {
        game: { world: { entities: [obstacle] } }
      });

      expect(outputs.hasHit).toBe(false);
      expect(outputs.onMiss).toBe(true);
      expect(outputs.hitEntity).toBe('');
      expect(outputs.hitDistance).toBe(100);
    });
  });

  // -------------------------------------------------------------
  // 9. manageCollider (BlueprintPhysics)
  // -------------------------------------------------------------
  describe('9. manageCollider (Physics & Collision)', () => {
    const def = BlueprintPhysics.items.find(i => i.type === 'manageCollider');

    it('is registered with valid metadata and ports', () => {
      expect(def).toBeDefined();
      expect(findBlueprintByType('manageCollider')).toBeDefined();
      expect(def.defaultData.inputs.map(i => i.id)).toEqual([
        'execIn', 'targetEntity', 'operation', 'shapeId', 'shapeType', 'offsetX', 'offsetY', 'width', 'height', 'isTrigger', 'enabled'
      ]);
      expect(def.defaultData.outputs.map(o => o.id)).toEqual(['execOut', 'success', 'shapeCount']);
    });

    it('adds a new shape to entity Collider', () => {
      const entity = { id: 'player_1', components: { Collider: { enabled: true, data: [] } } };

      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'player_1',
        operation: 'add',
        shapeId: 'hitbox_sword',
        shapeType: 'box',
        width: 48,
        height: 24,
        isTrigger: true
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.success).toBe(true);
      expect(outputs.shapeCount).toBe(1);
      expect(entity.components.Collider.data[0].id).toBe('hitbox_sword');
      expect(entity.components.Collider.data[0].isTrigger).toBe(true);
      expect(entity.components.Collider.data[0].width).toBe(48);
    });

    it('modifies an existing shape', () => {
      const shape = { id: 'body', scriptId: 'body', width: 32, height: 32, offsetX: 0, offsetY: 0, enabled: true };
      const entity = { id: 'player_2', components: { Collider: { enabled: true, data: [shape] } } };

      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'player_2',
        operation: 'modify',
        shapeId: 'body',
        width: 64,
        height: 48,
        offsetY: -10
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.success).toBe(true);
      expect(shape.width).toBe(64);
      expect(shape.height).toBe(48);
      expect(shape.offsetY).toBe(-10);
    });

    it('removes a shape by shapeId', () => {
      const s1 = { id: 's1', scriptId: 's1' };
      const s2 = { id: 's2', scriptId: 's2' };
      const entity = { id: 'player_3', components: { Collider: { enabled: true, data: [s1, s2] } } };

      const { outputs } = executeNode(def, {
        execIn: true,
        targetEntity: 'player_3',
        operation: 'remove',
        shapeId: 's1'
      }, {}, {
        entity: { get: () => entity }
      });

      expect(outputs.success).toBe(true);
      expect(outputs.shapeCount).toBe(1);
      expect(entity.components.Collider.data[0].id).toBe('s2');
    });

    it('toggles overall collider or shape enabled state', () => {
      const s1 = { id: 'shield', scriptId: 'shield', enabled: true };
      const entity = { id: 'player_4', components: { Collider: { enabled: true, data: [s1] } } };

      // Toggle shape
      const { outputs: o1 } = executeNode(def, {
        execIn: true,
        targetEntity: 'player_4',
        operation: 'toggle',
        shapeId: 'shield'
      }, {}, {
        entity: { get: () => entity }
      });

      expect(o1.success).toBe(true);
      expect(s1.enabled).toBe(false);

      // Toggle overall collider
      const { outputs: o2 } = executeNode(def, {
        execIn: true,
        targetEntity: 'player_4',
        operation: 'toggle',
        shapeId: ''
      }, {}, {
        entity: { get: () => entity }
      });

      expect(o2.success).toBe(true);
      expect(entity.components.Collider.enabled).toBe(false);
    });
  });
});
