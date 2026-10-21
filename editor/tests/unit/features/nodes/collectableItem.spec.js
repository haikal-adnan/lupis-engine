import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';
import { BlueprintCollectable } from '@nodes/library/blueprints/BlueprintCollectable.js';

describe('Collectable Item Blueprint & Execution Tests', () => {
  const collectableDef = BlueprintHelperTool.items.find(i => i.type === 'collectableItem');

  it('collectableItem is properly registered in BlueprintCollectable and BlueprintHelperTool', () => {
    expect(collectableDef).toBeDefined();
    expect(collectableDef.label).toBe('Collectable Item');
    expect(collectableDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(collectableDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn',
      'targetEntity',
      'collectorTag',
      'pickupMode',
      'interactKey',
      'scoreValue',
      'canCollect',
      'idleClip',
      'collectClip',
      'sfxName',
      'despawnAction',
      'respawnTime',
      'autoBobbing'
    ]);
    expect(collectableDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut',
      'onCollected',
      'onAnimationEnd',
      'onRespawn',
      'isCollected',
      'collectorEntity',
      'value'
    ]);
  });

  describe('Collectable Helper Execution', () => {
    let mockGame;
    let contextSystem;
    let coinEntity;
    let playerEntity;

    beforeEach(() => {
      coinEntity = {
        id: 'coin_1',
        scriptId: 'coin_gold',
        active: true,
        visible: true,
        components: {
          Transform: { x: 100, y: 100 },
          SpriteAnimator: {
            clips: [
              { id: 'coin_idle', name: 'idle', fps: 10, frames: [0, 1] },
              { id: 'coin_pop', name: 'collected', fps: 10, frames: [0, 1, 2] }
            ],
            currentClip: 'coin_idle',
            isPlaying: true
          }
        }
      };

      playerEntity = {
        id: 'player_1',
        scriptId: 'hero',
        tag: 'player',
        active: true,
        visible: true,
        components: {
          Transform: { x: 100, y: 100 }
        }
      };

      mockGame = {
        deltaTime: 0.016,
        world: {
          entities: [coinEntity, playerEntity]
        },
        entitySystem: {
          getEntity: vi.fn((id) => (id === 'coin_1' || id === 'self') ? coinEntity : (id === 'hero' ? playerEntity : null)),
          getAllByTag: vi.fn((tag) => tag === 'player' ? [playerEntity] : []),
          destroyEntity: vi.fn((ent) => { ent._isDestroyed = true; })
        },
        audioSystem: {
          playAudio: vi.fn()
        },
        events: {
          emit: vi.fn()
        }
      };

      contextSystem = new ContextSystem(mockGame);
    });

    it('collects item when overlapping and canCollect is true', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};
      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        scoreValue: 10,
        canCollect: true,
        despawnAction: 'none'
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity],
          destroy: vi.fn()
        },
        audio: {
          play: vi.fn()
        },
        triggerFlow: vi.fn()
      };

      helper.processCollectable({}, inputs, outputs, mockContext);

      expect(outputs.isCollected).toBe(true);
      expect(outputs.value).toBe(10);
      expect(outputs.collectorEntity).toBe('hero');
      expect(outputs.onCollected).toBe(true);
      expect(mockContext.triggerFlow).toHaveBeenCalledWith('onCollected');
    });

    it('does NOT collect item when canCollect is false even if overlapping', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};
      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        scoreValue: 5,
        canCollect: false,
        despawnAction: 'destroy'
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity],
          destroy: vi.fn()
        },
        triggerFlow: vi.fn()
      };

      helper.processCollectable({}, inputs, outputs, mockContext);

      expect(outputs.isCollected).toBe(false);
      expect(mockContext.triggerFlow).not.toHaveBeenCalled();
      expect(mockContext.entity.destroy).not.toHaveBeenCalled();
    });

    it('destroys item after collection animation timer completes', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};
      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        collectClip: 'collected',
        canCollect: true,
        despawnAction: 'destroy'
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity],
          destroy: vi.fn()
        },
        triggerFlow: vi.fn()
      };

      // 1. Initial collection frame
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(outputs.onCollected).toBe(true);
      expect(coinEntity._collectable.state).toBe('animating_destroy');

      // 2. Advance time past animation duration (3 frames at 10fps = 0.3s)
      mockContext.dt = 0.4;
      helper.processCollectable({}, inputs, outputs, mockContext);

      expect(mockContext.triggerFlow).toHaveBeenCalledWith('onAnimationEnd');
      expect(mockContext.entity.destroy).toHaveBeenCalledWith(coinEntity);
    });

    it('deactivates and schedules respawn correctly', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};
      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        collectClip: '',
        canCollect: true,
        despawnAction: 'deactivate',
        respawnTime: 2.0
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity]
        },
        triggerFlow: vi.fn()
      };

      // 1. Collect
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.active).toBe(false);
      expect(coinEntity._collectable.state).toBe('despawned');

      // 2. Advance time by 1s (halfway)
      mockContext.dt = 1.0;
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.active).toBe(false);

      // 3. Advance time by another 1.1s (past 2.0s)
      mockContext.dt = 1.1;
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.active).toBe(true);
      expect(coinEntity._collectable.isCollected).toBe(false);
      expect(mockContext.triggerFlow).toHaveBeenCalledWith('onRespawn');
    });
  });
});
