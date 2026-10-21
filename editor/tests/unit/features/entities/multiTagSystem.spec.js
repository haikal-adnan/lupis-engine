import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import Entity from '@core/Core/Entity.js';
import EntitySystem from '@core/System/EntitySystem.js';
import ColliderSystem from '@core/System/ColliderSystem.js';
import { useProjectStore } from '@projects/projects.js';
import { entitySchema } from '@scenes/scenes.js';

describe('Multi-Tag System Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Core Entity Multi-Tag Functionality', () => {
    it('initializes with empty tags array and tag getter returns "untagged"', () => {
      const entity = new Entity('ent_1');
      expect(Array.isArray(entity.tags)).toBe(true);
      expect(entity.tags).toHaveLength(0);
      expect(entity.tag).toBe('untagged');
    });

    it('adds valid tags and prevents case-insensitive duplicates and invalid characters', () => {
      const entity = new Entity('ent_1');
      expect(entity.addTag('Player')).toBe(true);
      expect(entity.tags).toEqual(['Player']);
      expect(entity.tag).toBe('Player');

      // Case-insensitive duplicate should be rejected
      expect(entity.addTag('player')).toBe(false);
      expect(entity.addTag('PLAYER')).toBe(false);
      expect(entity.tags).toEqual(['Player']);

      // Valid tag with underscore and numbers
      expect(entity.addTag('Enemy_01')).toBe(true);
      expect(entity.tags).toEqual(['Player', 'Enemy_01']);

      // Sanitization of spaces or invalid characters
      expect(entity.addTag('Special Item!@#')).toBe(true);
      expect(entity.hasTag('Special_Item')).toBe(true);
    });

    it('correctly checks hasTag case-insensitively', () => {
      const entity = new Entity('ent_1');
      entity.addTag('Undead');
      entity.addTag('Boss');

      expect(entity.hasTag('Undead')).toBe(true);
      expect(entity.hasTag('undead')).toBe(true);
      expect(entity.hasTag('UNDEAD')).toBe(true);
      expect(entity.hasTag('boss')).toBe(true);
      expect(entity.hasTag('Hero')).toBe(false);
    });

    it('checks hasAnyTag and hasAllTags correctly', () => {
      const entity = new Entity('ent_1');
      entity.addTag('Enemy');
      entity.addTag('Flying');
      entity.addTag('Flammable');

      expect(entity.hasAnyTag(['flying', 'ground'])).toBe(true);
      expect(entity.hasAnyTag(['hero', 'npc'])).toBe(false);

      expect(entity.hasAllTags(['enemy', 'flying'])).toBe(true);
      expect(entity.hasAllTags(['enemy', 'water'])).toBe(false);
    });

    it('removes tag case-insensitively and updates primary tag getter', () => {
      const entity = new Entity('ent_1');
      entity.addTag('TagA');
      entity.addTag('TagB');

      expect(entity.removeTag('taga')).toBe(true);
      expect(entity.hasTag('TagA')).toBe(false);
      expect(entity.tag).toBe('TagB');

      expect(entity.removeTag('tagb')).toBe(true);
      expect(entity.tags).toHaveLength(0);
      expect(entity.tag).toBe('untagged');
    });

    it('supports backward-compatible tag setter', () => {
      const entity = new Entity('ent_1');
      entity.tag = 'Player';
      expect(entity.tags).toEqual(['Player']);
      expect(entity.hasTag('player')).toBe(true);

      entity.tag = 'untagged';
      expect(entity.tags).toEqual([]);
      expect(entity.tag).toBe('untagged');
    });
  });

  describe('EntitySystem Multi-Tag Queries', () => {
    let mockGame;
    let entitySystem;

    beforeEach(() => {
      mockGame = {
        world: {
          entities: []
        }
      };
      entitySystem = new EntitySystem(mockGame);
    });

    it('finds all entities by tag even when entities have multiple tags', () => {
      const e1 = new Entity('1');
      e1.addTag('Enemy');
      e1.addTag('Undead');

      const e2 = new Entity('2');
      e2.addTag('Enemy');
      e2.addTag('Flying');

      const e3 = new Entity('3');
      e3.addTag('Player');

      mockGame.world.entities = [e1, e2, e3];

      const enemies = entitySystem.getAllByTag('enemy');
      expect(enemies).toHaveLength(2);
      expect(enemies.map(e => e.id)).toEqual(['1', '2']);

      const undead = entitySystem.getAllByTag('UNDEAD');
      expect(undead).toHaveLength(1);
      expect(undead[0].id).toBe('1');
    });

    it('destroys entities by tag correctly in multi-tag environment', () => {
      const e1 = new Entity('1');
      e1.addTag('Minion');
      e1.addTag('Temporary');

      const e2 = new Entity('2');
      e2.addTag('Minion');

      const e3 = new Entity('3');
      e3.addTag('Boss');

      mockGame.world.entities = [e1, e2, e3];

      const destroyedCount = entitySystem.destroyEntitiesByTag('temporary');
      expect(destroyedCount).toBe(1);
      expect(e1._isDestroyed).toBe(true);
      expect(e2._isDestroyed).toBeFalsy();
    });

    it('findClosestByTag finds nearest entity matching tag', () => {
      const e1 = new Entity('1');
      e1.addTag('Target');
      e1.addComponent('Transform', { x: 100, y: 0 });

      const e2 = new Entity('2');
      e2.addTag('Target');
      e2.addComponent('Transform', { x: 20, y: 0 });

      const e3 = new Entity('3');
      e3.addTag('Other');
      e3.addComponent('Transform', { x: 5, y: 0 });

      mockGame.world.entities = [e1, e2, e3];

      const closest = entitySystem.findClosestByTag('target', 0, 0);
      expect(closest).not.toBeNull();
      expect(closest.id).toBe('2');
    });

    it('getEntitiesByAnyTag and getEntitiesByAllTags filter correctly', () => {
      const e1 = new Entity('1');
      e1.addTag('Enemy');
      e1.addTag('Water');

      const e2 = new Entity('2');
      e2.addTag('Enemy');
      e2.addTag('Fire');

      mockGame.world.entities = [e1, e2];

      const anyWaterOrFire = entitySystem.getEntitiesByAnyTag(['water', 'fire']);
      expect(anyWaterOrFire).toHaveLength(2);

      const allEnemyAndWater = entitySystem.getEntitiesByAllTags(['enemy', 'water']);
      expect(allEnemyAndWater).toHaveLength(1);
      expect(allEnemyAndWater[0].id).toBe('1');
    });
  });

  describe('ColliderSystem Multi-Tag Support', () => {
    it('detects isOneWayPlatform with entity that has multiple tags', () => {
      const colliderSystem = new ColliderSystem({});
      const platform = new Entity('platform_1');
      platform.addTag('Wood');
      platform.addTag('OneWay');

      expect(colliderSystem.isOneWayPlatform(platform, 'oneway')).toBe(true);
      expect(colliderSystem.isOneWayPlatform(platform, 'solid')).toBe(false);
      expect(colliderSystem.isOneWayPlatform(platform, 'jumpthrough, oneway')).toBe(true);
    });
  });

  describe('ProjectStore Tag Management & Validation', () => {
    it('adds tag with valid naming and rejects duplicate case-insensitively', () => {
      const projectStore = useProjectStore();
      projectStore.project = { tags: ['Untagged', 'Player', 'Enemy'] };

      expect(projectStore.addTag('Platform')).toBe(true);
      expect(projectStore.project.tags).toContain('Platform');

      // Duplicate case-insensitive
      expect(projectStore.addTag('platform')).toBe(false);
      expect(projectStore.addTag('PLATFORM')).toBe(false);

      // Invalid character sanitization / validation
      expect(projectStore.addTag('Ground Area')).toBe(true);
      expect(projectStore.project.tags).toContain('Ground_Area');
    });

    it('renames tag cleanly across project tags', () => {
      const projectStore = useProjectStore();
      projectStore.project = { tags: ['Untagged', 'Player', 'Enemy'] };

      expect(projectStore.renameTag('Enemy', 'Monster')).toBe(true);
      expect(projectStore.project.tags).toContain('Monster');
      expect(projectStore.project.tags).not.toContain('Enemy');

      // Cannot rename to existing tag
      expect(projectStore.renameTag('Monster', 'Player')).toBe(false);

      // Cannot rename Untagged
      expect(projectStore.renameTag('Untagged', 'Default')).toBe(false);
    });

    it('removes tag cleanly from project tags except Untagged', () => {
      const projectStore = useProjectStore();
      projectStore.project = { tags: ['Untagged', 'Player', 'Enemy'] };

      expect(projectStore.removeTag('Enemy')).toBe(true);
      expect(projectStore.project.tags).not.toContain('Enemy');

      // Untagged protected
      expect(projectStore.removeTag('Untagged')).toBe(false);
      expect(projectStore.project.tags).toContain('Untagged');
    });
  });

  describe('Entity Schema Normalization', () => {
    it('normalizes legacy single tag data into tags array', () => {
      const legacy = entitySchema({
        id: 'ent_legacy',
        tag: 'Hero'
      });

      expect(legacy.tags).toEqual(['Hero']);
      expect(legacy.tag).toBe('Hero');
    });

    it('normalizes multiple tags and removes duplicates case-insensitively', () => {
      const modern = entitySchema({
        id: 'ent_modern',
        tags: ['Enemy', 'enemy', 'Boss', 'Special_#1']
      });

      expect(modern.tags).toEqual(['Enemy', 'Boss', 'Special_1']);
      expect(modern.tag).toBe('Enemy');
    });
  });

  describe('Blueprint Tag Nodes & getObject Outputs', () => {
    it('getObject outputs tags as list even when empty or 1 tag', () => {
      const eEmpty = new Entity('e_empty');
      const eSingle = new Entity('e_single');
      eSingle.addTag('Hero');
      const eMulti = new Entity('e_multi');
      eMulti.addTag('Enemy');
      eMulti.addTag('Boss');

      const runGetObject = (ent) => {
        const inputs = { targetEntity: 'self' };
        const outputs = {};
        const context = {
          assert: { exists: (v) => v },
          entity: { get: () => ent }
        };

        const entity = context.assert.exists(context.entity.get(inputs.targetEntity), 'Target entity must exist');
        outputs.entityId = entity.scriptId;
        outputs.tagName = entity.tag;
        outputs.tags = Array.isArray(entity.tags) ? [...entity.tags] : (entity.tag && entity.tag !== 'untagged' ? [entity.tag] : []);
        outputs.active = entity.active;
        outputs.visible = entity.visible;
        return outputs;
      };

      const outEmpty = runGetObject(eEmpty);
      expect(Array.isArray(outEmpty.tags)).toBe(true);
      expect(outEmpty.tags).toEqual([]);

      const outSingle = runGetObject(eSingle);
      expect(Array.isArray(outSingle.tags)).toBe(true);
      expect(outSingle.tags).toEqual(['Hero']);

      const outMulti = runGetObject(eMulti);
      expect(Array.isArray(outMulti.tags)).toBe(true);
      expect(outMulti.tags).toEqual(['Enemy', 'Boss']);
    });

    it('entityCountByTag counts active matching entities', () => {
      const e1 = new Entity('1'); e1.addTag('Coin');
      const e2 = new Entity('2'); e2.addTag('Coin');
      const e3 = new Entity('3'); e3.addTag('Enemy');

      const mockContext = {
        entity: {
          getAllByTag: (t) => [e1, e2, e3].filter(e => e.hasTag(t))
        }
      };

      const inputs = { tag: 'coin' };
      const outputs = {};
      const tag = inputs.tag;
      const count = mockContext.entity && typeof mockContext.entity.countByTag === 'function'
        ? mockContext.entity.countByTag(tag)
        : (mockContext.entity && typeof mockContext.entity.getAllByTag === 'function' ? mockContext.entity.getAllByTag(tag).length : 0);

      outputs.count = count;
      outputs.hasAny = count > 0;

      expect(outputs.count).toBe(2);
      expect(outputs.hasAny).toBe(true);
    });

    it('entityHasTag checks tags accurately and case-insensitively', () => {
      const ent = new Entity('hero_1');
      ent.addTag('Player');

      const mockContext = {
        assert: { exists: (v) => v },
        entity: { get: () => ent }
      };

      const checkTag = (searchTag) => {
        const inputs = { targetEntity: 'self', tag: searchTag };
        const outputs = {};
        const entity = mockContext.assert.exists(mockContext.entity.get(inputs.targetEntity), 'Target entity must exist');
        const tag = inputs.tag;
        const match = typeof entity.hasTag === 'function'
          ? entity.hasTag(tag)
          : (Array.isArray(entity.tags) ? entity.tags.some(t => String(t).trim().toLowerCase() === String(tag).trim().toLowerCase()) : String(entity.tag || '').trim().toLowerCase() === String(tag).trim().toLowerCase());

        outputs.hasTag = Boolean(match);
        return outputs.hasTag;
      };

      expect(checkTag('player')).toBe(true);
      expect(checkTag('PLAYER')).toBe(true);
      expect(checkTag('Enemy')).toBe(false);
    });

    it('entityAddTag and entityRemoveTag dynamically alter tags', () => {
      const ent = new Entity('slime_1');
      ent.addTag('Enemy');

      expect(ent.hasTag('Frozen')).toBe(false);

      // Add tag
      expect(ent.addTag('Frozen')).toBe(true);
      expect(ent.hasTag('frozen')).toBe(true);
      expect(ent.tags).toEqual(['Enemy', 'Frozen']);

      // Remove tag
      expect(ent.removeTag('enemy')).toBe(true);
      expect(ent.hasTag('Enemy')).toBe(false);
      expect(ent.tags).toEqual(['Frozen']);
    });
  });
});
