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
      'itemEntity',
      'value'
    ]);
    expect(collectableDef.defaultData.data.options).toBeDefined();
    expect(collectableDef.defaultData.data.options.pickupMode).toEqual([
      { label: 'Collision', value: 'collision' },
      { label: 'Interact Key', value: 'interact_key' }
    ]);
    expect(collectableDef.defaultData.data.options.despawnAction).toEqual([
      { label: 'Destroy', value: 'destroy' },
      { label: 'Deactivate', value: 'deactivate' },
      { label: 'None', value: 'none' }
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
      expect(outputs.itemEntity).toBe('coin_gold');
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

    it('resolves clips by scriptId (UUID vs scriptId) matching animator platformer helper logic', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      // Entity with editor-style UUID clips where user named clips by scriptId
      coinEntity.components.SpriteAnimator.clips = [
        { id: 'uuid_cat_idle', scriptId: 'IdleGroup', type: 'category' },
        { id: 'uuid_idle_99', scriptId: 'coin_idle', type: 'clip', fps: 12, frames: [0, 1] },
        { id: 'uuid_pop_88', scriptId: 'coin_pop', type: 'clip', fps: 10, frames: [0, 1, 2] }
      ];
      coinEntity.components.SpriteAnimator.currentClip = '';

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        idleClip: 'coin_idle',
        collectClip: 'coin_pop',
        scoreValue: 5,
        canCollect: true,
        despawnAction: 'destroy'
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => []
        },
        triggerFlow: vi.fn()
      };

      // Tick 1: Idle state
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('uuid_idle_99');
      expect(outputs.currentClip).toBe('uuid_idle_99');
      expect(outputs.onClipChanged).toBe(true);
      expect(coinEntity.components.SpriteAnimator.isPlaying).toBe(true);

      // Tick 2: Subsequent idle ticks must NOT reset frameIndex (preserves continuous playback)
      coinEntity.components.SpriteAnimator.clips[1].frameIndex = 1;
      coinEntity.components.SpriteAnimator._elapsedTime = 0.08;
      const outputs2 = {};
      helper.processCollectable({}, inputs, outputs2, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('uuid_idle_99');
      expect(coinEntity.components.SpriteAnimator.clips[1].frameIndex).toBe(1);
      expect(coinEntity.components.SpriteAnimator._elapsedTime).toBe(0.08);
      expect(outputs2.onClipChanged).toBeFalsy();
    });

    it('handles case-insensitive match and skips category items in clips tree', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      coinEntity.components.SpriteAnimator.clips = [
        { id: 'cat_id', scriptId: 'GOLD_COIN', type: 'category' },
        { id: 'clip_gold_uuid', scriptId: 'gold_coin', type: 'clip', fps: 8, frames: [0, 1] }
      ];
      coinEntity.components.SpriteAnimator.currentClip = '';

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        idleClip: 'Gold_Coin, other_clip', // mixed case + comma separated
        canCollect: false
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => []
        },
        triggerFlow: vi.fn()
      };

      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('clip_gold_uuid');
      expect(outputs.currentClip).toBe('clip_gold_uuid');
    });

    it('switches to new idle clip dynamically when input changes', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      coinEntity.components.SpriteAnimator.clips = [
        { id: 'clip_idle_1', scriptId: 'idle_normal', type: 'clip', fps: 8, frames: [0] },
        { id: 'clip_idle_2', scriptId: 'idle_sparkle', type: 'clip', fps: 8, frames: [0] }
      ];
      coinEntity.components.SpriteAnimator.currentClip = '';

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        idleClip: 'idle_normal',
        canCollect: false
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => []
        },
        triggerFlow: vi.fn()
      };

      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('clip_idle_1');

      // Now change input to idle_sparkle
      inputs.idleClip = 'idle_sparkle';
      const outputs2 = {};
      helper.processCollectable({}, inputs, outputs2, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('clip_idle_2');
      expect(outputs2.onClipChanged).toBe(true);
    });

    it('plays collect clip with UUID resolution and restores idle on respawn', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      coinEntity.components.SpriteAnimator.clips = [
        { id: 'uuid_idle', scriptId: 'idle', type: 'clip', fps: 12, frames: [0, 1] },
        { id: 'uuid_pop', scriptId: 'collected', type: 'clip', fps: 10, frames: [0, 1] }
      ];
      coinEntity.components.SpriteAnimator.currentClip = 'uuid_idle';

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        idleClip: 'idle',
        collectClip: 'collected',
        despawnAction: 'deactivate',
        respawnTime: 1.0,
        canCollect: true
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity]
        },
        triggerFlow: vi.fn()
      };

      // 1. Initial collection: collect animation should trigger with resolved UUID
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('uuid_pop');
      expect(coinEntity._collectable.state).toBe('animating_deactivate');

      // 2. Complete collection animation (2 frames at 10fps = 0.2s)
      mockContext.dt = 0.3;
      helper.processCollectable({}, inputs, outputs, mockContext);
      expect(coinEntity.active).toBe(false);
      expect(coinEntity._collectable.state).toBe('despawned');

      // 3. Complete respawn delay (1.0s)
      mockContext.dt = 1.1;
      const outputs3 = {};
      helper.processCollectable({}, inputs, outputs3, mockContext);
      expect(coinEntity.active).toBe(true);
      expect(coinEntity.components.SpriteAnimator.currentClip).toBe('uuid_idle');
      expect(outputs3.onRespawn).toBe(true);
    });

    it('has blank defaultValue for optional idleClip and collectClip', () => {
      const idlePort = collectableDef.defaultData.inputs.find(i => i.id === 'idleClip');
      const collectPort = collectableDef.defaultData.inputs.find(i => i.id === 'collectClip');
      expect(idlePort.defaultValue).toBe('');
      expect(collectPort.defaultValue).toBe('');
      expect(collectableDef.defaultData.data.values.idleClip).toBe('');
      expect(collectableDef.defaultData.data.values.collectClip).toBe('');
    });

    it('destroys immediately when collectClip is empty or clip does not exist', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      coinEntity.components.SpriteAnimator.clips = [
        { id: 'uuid_idle', scriptId: 'idle', type: 'clip', fps: 12, frames: [0, 1] }
      ];

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        idleClip: '',
        collectClip: '', // empty clip
        despawnAction: 'destroy',
        canCollect: true
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity],
          destroy: vi.fn((ent) => { ent._isDestroyed = true; })
        },
        triggerFlow: vi.fn()
      };

      const res = helper.processCollectable({}, inputs, outputs, mockContext);
      expect(mockContext.entity.destroy).toHaveBeenCalledWith(coinEntity);
      expect(outputs.onCollected).toBe(true);
      expect(outputs.onAnimationEnd).toBe(true);
      expect(res.isCollected).toBe(true);
    });

    it('does NOT destroy entity while collect animation is running and returns valid result every frame', () => {
      const helper = contextSystem.toolkitHandler.createFacade({ context: null }).collectable;
      const outputs = {};

      coinEntity.components.SpriteAnimator.clips = [
        { id: 'uuid_idle', scriptId: 'idle', type: 'clip', fps: 12, frames: [0, 1] },
        { id: 'uuid_collect', scriptId: 'pop', type: 'clip', fps: 10, frames: [0, 1, 2, 3] } // 4 frames at 10fps = 0.4s
      ];

      const inputs = {
        targetEntity: 'coin_1',
        collectorTag: 'player',
        pickupMode: 'collision',
        idleClip: 'idle',
        collectClip: 'pop',
        despawnAction: 'destroy',
        canCollect: true
      };

      const mockContext = {
        dt: 0.016,
        entity: {
          get: (id) => coinEntity,
          getAllByTag: (tag) => [playerEntity],
          destroy: vi.fn((ent) => { ent._isDestroyed = true; })
        },
        triggerFlow: vi.fn()
      };

      // Frame 1: Pickup happens
      const res1 = helper.processCollectable({}, inputs, outputs, mockContext);
      expect(res1).toBeDefined();
      expect(res1.isCollected).toBe(true);
      expect(outputs.onCollected).toBe(true);
      expect(mockContext.entity.destroy).not.toHaveBeenCalled(); // Entity NOT destroyed yet!
      expect(coinEntity._isDestroyed).toBeFalsy();

      // Frame 2: Animation is still running (dt = 0.1s out of 0.4s)
      mockContext.dt = 0.1;
      const outputs2 = {};
      const res2 = helper.processCollectable({}, inputs, outputs2, mockContext);
      expect(res2).toBeDefined();
      expect(res2.isCollected).toBe(true); // Must never be undefined!
      expect(mockContext.entity.destroy).not.toHaveBeenCalled(); // Still playing animation!

      // Frame 3: Animation completes (dt = 0.35s, total > 0.4s)
      mockContext.dt = 0.35;
      const outputs3 = {};
      const res3 = helper.processCollectable({}, inputs, outputs3, mockContext);
      expect(res3).toBeDefined();
      expect(res3.isCollected).toBe(true);
      expect(outputs3.onAnimationEnd).toBe(true);
      expect(mockContext.entity.destroy).toHaveBeenCalledWith(coinEntity); // Now destroyed!

      // Frame 4: Entity is now destroyed (_isDestroyed = true) on subsequent tick
      const outputs4 = {};
      const res4 = helper.processCollectable({}, inputs, outputs4, mockContext);
      expect(res4).toBeDefined();
      expect(res4.isCollected).toBe(true); // Never throws Cannot read properties of undefined!
      expect(outputs4.isCollected).toBe(true);
    });
  });
});
