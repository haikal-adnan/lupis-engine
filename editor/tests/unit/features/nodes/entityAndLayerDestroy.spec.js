import { describe, it, expect, vi, beforeEach } from 'vitest';
import EntitySystem from '@core/System/EntitySystem.js';
import LayerSystem from '@core/System/LayerSystem.js';
import ScriptSystem from '@core/Script/ScriptSystem.js';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintEntity } from '@nodes/library/blueprints/BlueprintEntity.js';

describe('Entity & Layer Destruction Comprehensive Suite', () => {
  let mockGame;
  let world;
  let entitySystem;
  let layerSystem;
  let scriptSystem;

  beforeEach(() => {
    world = {
      entities: [],
      layersWorld: [
        { id: 'layer_world_1', scriptId: 'world_layer', entities: [] }
      ],
      layersUI: [
        { id: 'layer_ui_1', scriptId: 'ui_layer', entities: [] }
      ],
      scriptIdMap: new Map(),
      get allLayers() {
        return [...this.layersWorld, ...this.layersUI];
      }
    };

    mockGame = {
      world,
      events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
      isPaused: false
    };

    entitySystem = new EntitySystem(mockGame);
    layerSystem = new LayerSystem(mockGame);
    scriptSystem = new ScriptSystem(mockGame);

    mockGame.entitySystem = entitySystem;
    mockGame.layerSystem = layerSystem;
    mockGame.scriptSystem = scriptSystem;
  });

  function createEntity(id, scriptId, layerId = 'layer_world_1', tag = 'untagged', parentId = null) {
    const ent = {
      id,
      scriptId,
      layerId,
      tag,
      parentId,
      children: [],
      components: {
        Transform: { x: 10, y: 20 }
      }
    };
    world.entities.push(ent);
    if (scriptId) world.scriptIdMap.set(scriptId, ent);
    const targetLayer = world.allLayers.find(l => l.id === layerId);
    if (targetLayer) targetLayer.entities.push(ent);
    return ent;
  }

  describe('EntitySystem.getEntity', () => {
    it('returns targetId directly if already an entity object', () => {
      const ent = createEntity('ent_1', 'player');
      const owner = createEntity('ent_2', 'enemy');
      expect(entitySystem.getEntity(ent, owner)).toBe(ent);
    });

    it('returns owner entity when targetId is "self" or empty', () => {
      const owner = createEntity('ent_owner', 'hero');
      expect(entitySystem.getEntity('self', owner)).toBe(owner);
      expect(entitySystem.getEntity('', owner)).toBe(owner);
      expect(entitySystem.getEntity(null, owner)).toBe(owner);
    });

    it('finds entity by id or scriptId', () => {
      const ent = createEntity('ent_abc', 'coin_pickup');
      expect(entitySystem.getEntity('ent_abc')).toBe(ent);
      expect(entitySystem.getEntity('coin_pickup')).toBe(ent);
      expect(entitySystem.getEntity('COIN_PICKUP')).toBe(ent);
    });
  });

  describe('EntitySystem.destroyEntity', () => {
    it('destroys entity when passed an Entity object', () => {
      const ent = createEntity('ent_1', 'chest');
      expect(world.entities).toContain(ent);
      expect(world.layersWorld[0].entities).toContain(ent);
      expect(world.scriptIdMap.has('chest')).toBe(true);

      entitySystem.destroyEntity(ent);

      expect(ent._isDestroyed).toBe(true);
      expect(world.entities).not.toContain(ent);
      expect(world.layersWorld[0].entities).not.toContain(ent);
      expect(world.scriptIdMap.has('chest')).toBe(false);
    });

    it('destroys entity when passed a scriptId string', () => {
      const ent = createEntity('ent_target', 'target_dummy');

      entitySystem.destroyEntity('target_dummy');

      expect(ent._isDestroyed).toBe(true);
      expect(world.entities).not.toContain(ent);
      expect(world.layersWorld[0].entities).not.toContain(ent);
      expect(world.scriptIdMap.has('target_dummy')).toBe(false);
    });

    it('destroys entity when passed a UUID string', () => {
      const ent = createEntity('ent_uuid_123', 'some_entity');

      entitySystem.destroyEntity('ent_uuid_123');

      expect(ent._isDestroyed).toBe(true);
      expect(world.entities).not.toContain(ent);
    });

    it('cascades destruction to children entities and unlinks from parent', () => {
      const parent = createEntity('ent_parent', 'boss');
      const child1 = createEntity('ent_child_1', 'minion_1', 'layer_world_1', 'enemy', 'ent_parent');
      const child2 = createEntity('ent_child_2', 'minion_2', 'layer_world_1', 'enemy', 'ent_parent');
      parent.children = [child1, child2];

      entitySystem.destroyEntity(parent);

      expect(parent._isDestroyed).toBe(true);
      expect(child1._isDestroyed).toBe(true);
      expect(child2._isDestroyed).toBe(true);
      expect(world.entities.length).toBe(0);
      expect(world.layersWorld[0].entities.length).toBe(0);
    });

    it('cleans up attached script runners via removeEntityScripts', () => {
      const ent = createEntity('ent_runner', 'scripted_box');
      const mockRunner = {
        owner: ent,
        destroy: vi.fn()
      };
      scriptSystem.runners.push(mockRunner);

      entitySystem.destroyEntity(ent);

      expect(mockRunner.destroy).toHaveBeenCalled();
      expect(scriptSystem.runners).not.toContain(mockRunner);
    });

    it('removes entity from any layer even if layerId does not match entity.layerId', () => {
      const ent = createEntity('ent_orphan', 'orphan_box', 'layer_world_1');
      // Intentionally corrupt or change entity.layerId
      ent.layerId = 'unknown_layer';

      entitySystem.destroyEntity(ent);

      expect(world.layersWorld[0].entities).not.toContain(ent);
    });
  });

  describe('EntitySystem.destroyEntitiesByTag (destroyByTag)', () => {
    it('destroys all entities matching the given tag and returns count', () => {
      const e1 = createEntity('ent_1', 'coin_1', 'layer_world_1', 'collectible');
      const e2 = createEntity('ent_2', 'coin_2', 'layer_world_1', 'collectible');
      const player = createEntity('ent_player', 'player', 'layer_world_1', 'player');

      const count = entitySystem.destroyEntitiesByTag('collectible');

      expect(count).toBe(2);
      expect(e1._isDestroyed).toBe(true);
      expect(e2._isDestroyed).toBe(true);
      expect(player._isDestroyed).toBeFalsy();
      expect(world.entities).toEqual([player]);
    });

    it('handles alias destroyByTag identically', () => {
      const e1 = createEntity('ent_1', 'bullet_1', 'layer_world_1', 'bullet');
      const count = entitySystem.destroyByTag('bullet');
      expect(count).toBe(1);
      expect(e1._isDestroyed).toBe(true);
    });

    it('returns 0 if no matching tag found', () => {
      createEntity('ent_1', 'player', 'layer_world_1', 'player');
      const count = entitySystem.destroyByTag('non_existent');
      expect(count).toBe(0);
    });
  });

  describe('LayerSystem.destroyLayer', () => {
    it('destroys layer and removes its entities when destroyEntities is true', () => {
      const ent1 = createEntity('ent_1', 'obj_1', 'layer_world_1');
      const ent2 = createEntity('ent_2', 'obj_2', 'layer_world_1');

      const res = layerSystem.destroyLayer('layer_world_1', true);

      expect(res).toBe(true);
      expect(ent1._isDestroyed).toBe(true);
      expect(ent2._isDestroyed).toBe(true);
      expect(world.entities.length).toBe(0);
      expect(world.layersWorld.length).toBe(0);
    });

    it('destroys layer but preserves entities when destroyEntities is false', () => {
      const ent1 = createEntity('ent_1', 'obj_1', 'layer_world_1');

      const res = layerSystem.destroyLayer('world_layer', false);

      expect(res).toBe(true);
      expect(ent1._isDestroyed).toBeFalsy();
      expect(world.entities).toContain(ent1);
      expect(world.layersWorld.length).toBe(0);
    });

    it('returns false for unknown layer', () => {
      expect(layerSystem.destroyLayer('unknown_layer')).toBe(false);
    });
  });

  describe('ContextSystem Entity and Layer Facades', () => {
    let context;

    beforeEach(() => {
      const contextSystem = new ContextSystem(mockGame);
      const runner = { owner: createEntity('ent_owner', 'self_ent') };
      context = contextSystem.createExecutionContext(runner, { id: 'test_node', type: 'custom' });
    });

    it('context.entity.destroy destroys self when passed "self"', () => {
      context.entity.destroy('self');
      expect(world.entities.length).toBe(0);
    });

    it('context.entity.destroy destroys by scriptId string', () => {
      const enemy = createEntity('ent_enemy', 'bad_guy');
      context.entity.destroy('bad_guy');
      expect(enemy._isDestroyed).toBe(true);
      expect(world.entities).not.toContain(enemy);
    });

    it('context.entity.destroyByTag destroys tagged entities', () => {
      const e1 = createEntity('ent_drop_1', 'drop_1', 'layer_world_1', 'loot');
      const e2 = createEntity('ent_drop_2', 'drop_2', 'layer_world_1', 'loot');

      const count = context.entity.destroyByTag('loot');
      expect(count).toBe(2);
      expect(e1._isDestroyed).toBe(true);
      expect(e2._isDestroyed).toBe(true);
    });

    it('context.layer.destroy destroys layer and entities', () => {
      const ent = createEntity('ent_ui_obj', 'ui_box', 'layer_ui_1');
      const res = context.layer.destroy('layer_ui_1', true);
      expect(res).toBe(true);
      expect(ent._isDestroyed).toBe(true);
      expect(world.layersUI.length).toBe(0);
    });
  });

  describe('Blueprint Execution via ScriptRunner', () => {
    it('executes entityDestroy blueprint node correctly', () => {
      const destroyNodeDef = BlueprintEntity.items.find(i => i.type === 'entityDestroy');
      expect(destroyNodeDef).toBeDefined();

      const victim = createEntity('ent_victim', 'victim_entity');
      const owner = createEntity('ent_owner', 'owner_entity');

      const contextSystem = new ContextSystem(mockGame);
      const runner = { owner, getNodeState: () => ({}) };
      const ctx = contextSystem.createExecutionContext(runner, destroyNodeDef);

      const fn = new Function('inputs', 'outputs', 'context', 'node', destroyNodeDef.defaultData.data.code + '\nreturn outputs;');
      const outputs = {};
      fn({ targetEntity: 'victim_entity', destroyParent: false }, outputs, ctx, destroyNodeDef);

      expect(outputs.execOut).toBe(true);
      expect(victim._isDestroyed).toBe(true);
      expect(world.entities).not.toContain(victim);
    });

    it('executes entityDestroyByTag blueprint node correctly', () => {
      const destroyByTagDef = BlueprintEntity.items.find(i => i.type === 'entityDestroyByTag');
      expect(destroyByTagDef).toBeDefined();

      createEntity('ent_c1', 'coin1', 'layer_world_1', 'coin');
      createEntity('ent_c2', 'coin2', 'layer_world_1', 'coin');
      createEntity('ent_c3', 'coin3', 'layer_world_1', 'coin');

      const owner = createEntity('ent_owner', 'cleaner');
      const contextSystem = new ContextSystem(mockGame);
      const runner = { owner, getNodeState: () => ({}) };
      const ctx = contextSystem.createExecutionContext(runner, destroyByTagDef);

      const fn = new Function('inputs', 'outputs', 'context', 'node', destroyByTagDef.defaultData.data.code + '\nreturn outputs;');
      const outputs = {};
      fn({ tag: 'coin' }, outputs, ctx, destroyByTagDef);

      expect(outputs.execOut).toBe(true);
      expect(outputs.count).toBe(3);
      expect(world.entities.length).toBe(1);
      expect(world.entities[0]).toBe(owner);
    });

    it('executes layerDestroy blueprint node correctly', () => {
      const layerDestroyDef = BlueprintEntity.items.find(i => i.type === 'layerDestroy');
      expect(layerDestroyDef).toBeDefined();

      const ent = createEntity('ent_layer_child', 'layer_child', 'layer_world_1');
      const owner = createEntity('ent_owner', 'controller', 'layer_ui_1');

      const contextSystem = new ContextSystem(mockGame);
      const runner = { owner, getNodeState: () => ({}) };
      const ctx = contextSystem.createExecutionContext(runner, layerDestroyDef);

      const fn = new Function('inputs', 'outputs', 'context', 'node', layerDestroyDef.defaultData.data.code + '\nreturn outputs;');
      const outputs = {};
      fn({ targetLayer: 'layer_world_1', destroyEntities: true }, outputs, ctx, layerDestroyDef);

      expect(outputs.execOut).toBe(true);
      expect(outputs.success).toBe(true);
      expect(ent._isDestroyed).toBe(true);
      expect(world.layersWorld.length).toBe(0);
    });
  });
});
