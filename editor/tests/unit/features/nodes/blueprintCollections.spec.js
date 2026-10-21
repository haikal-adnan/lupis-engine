import { describe, it, expect } from 'vitest';
import { BlueprintCollections } from '../../../../src/features/nodes/library/blueprints/BlueprintCollections.js';
import { findBlueprintByType, findBlueprintCategory, ALL_BLUEPRINTS } from '../../../../src/features/nodes/library/blueprints/index.js';

describe('BlueprintCollections Specification & Path Nodes', () => {
  it('is registered in ALL_BLUEPRINTS with correct metadata', () => {
    expect(BlueprintCollections.id).toBe('data_collections');
    expect(BlueprintCollections.label).toBe('Collections & Data');
    expect(findBlueprintCategory('data_collections')).toBe(BlueprintCollections);
    expect(ALL_BLUEPRINTS.includes(BlueprintCollections)).toBe(true);
  });

  it('defines getFromPath and setFromPath with any dataType for collection inputs/outputs', () => {
    const getNode = BlueprintCollections.items.find(i => i.type === 'getFromPath');
    expect(getNode).toBeDefined();
    expect(getNode.defaultData.inputs.find(p => p.id === 'collection')?.dataType).toBe('any');
    expect(getNode.defaultData.outputs.find(p => p.id === 'value')?.dataType).toBe('any');
    expect(getNode.defaultData.outputs.find(p => p.id === 'found')?.dataType).toBe('boolean');

    const setNode = BlueprintCollections.items.find(i => i.type === 'setFromPath');
    expect(setNode).toBeDefined();
    expect(setNode.defaultData.inputs.find(p => p.id === 'collection')?.dataType).toBe('any');
    expect(setNode.defaultData.outputs.find(p => p.id === 'collectionOut')?.dataType).toBe('any');
  });

  describe('Get Value by Path (getFromPath) Runtime Logic', () => {
    function executeGetFromPath(inputs) {
      const getNode = BlueprintCollections.items.find(i => i.type === 'getFromPath');
      const code = getNode.defaultData.data.code;
      const fn = new Function('inputs', 'outputs', 'context', 'node', code + '\nreturn outputs;');
      const outputs = {};
      fn(inputs, outputs, {}, getNode);
      return outputs;
    }

    it('reads item from List (Array) via numeric index and bracket notation', () => {
      const list = ['Apple', 'Banana', 'Cherry'];
      
      const out1 = executeGetFromPath({ collection: list, path: '1' });
      expect(out1.value).toBe('Banana');
      expect(out1.found).toBe(true);

      const out2 = executeGetFromPath({ collection: list, path: '[2]' });
      expect(out2.value).toBe('Cherry');
      expect(out2.found).toBe(true);

      const out3 = executeGetFromPath({ collection: list, path: '5' });
      expect(out3.value).toBeNull();
      expect(out3.found).toBe(false);
    });

    it('reads item from Map (Object) via dot notation and bracket notation', () => {
      const map = { stats: { hp: 100, maxHp: 150 }, name: 'Hero' };

      const out1 = executeGetFromPath({ collection: map, path: 'stats.hp' });
      expect(out1.value).toBe(100);
      expect(out1.found).toBe(true);

      const out2 = executeGetFromPath({ collection: map, path: "stats['maxHp']" });
      expect(out2.value).toBe(150);
      expect(out2.found).toBe(true);

      const out3 = executeGetFromPath({ collection: map, path: 'stats.mp' });
      expect(out3.value).toBeNull();
      expect(out3.found).toBe(false);
    });

    it('reads nested structures combining List and Map (e.g. users[0].name)', () => {
      const complex = {
        users: [
          { id: 1, name: 'Alice', inventory: ['Sword', 'Shield'] },
          { id: 2, name: 'Bob', inventory: ['Bow', 'Arrow'] }
        ]
      };

      const out1 = executeGetFromPath({ collection: complex, path: 'users.0.name' });
      expect(out1.value).toBe('Alice');
      expect(out1.found).toBe(true);

      const out2 = executeGetFromPath({ collection: complex, path: 'users[1].inventory[0]' });
      expect(out2.value).toBe('Bow');
      expect(out2.found).toBe(true);
    });

    it('reads from ES6 Map instance', () => {
      const es6Map = new Map([
        ['player', new Map([['level', 10]])]
      ]);

      const out = executeGetFromPath({ collection: es6Map, path: 'player.level' });
      expect(out.value).toBe(10);
      expect(out.found).toBe(true);
    });

    it('reads from JSON string representation of List or Map', () => {
      const listJson = '["First", "Second", "Third"]';
      const mapJson = '{"config": {"volume": 0.8}}';

      const out1 = executeGetFromPath({ collection: listJson, path: '1' });
      expect(out1.value).toBe('Second');
      expect(out1.found).toBe(true);

      const out2 = executeGetFromPath({ collection: mapJson, path: 'config.volume' });
      expect(out2.value).toBe(0.8);
      expect(out2.found).toBe(true);
    });

    it('handles empty path or null inputs safely without throwing', () => {
      const list = ['A', 'B'];
      const out1 = executeGetFromPath({ collection: list, path: '' });
      expect(out1.value).toBe(list);
      expect(out1.found).toBe(true);

      const out2 = executeGetFromPath({ collection: null, path: 'foo' });
      expect(out2.value).toBeNull();
      expect(out2.found).toBe(false);

      const out3 = executeGetFromPath({ collection: list, path: null });
      expect(out3.value).toBe(list);
    });
  });

  describe('Set Value by Path (setFromPath) Runtime Logic', () => {
    function executeSetFromPath(inputs) {
      const setNode = BlueprintCollections.items.find(i => i.type === 'setFromPath');
      const code = setNode.defaultData.data.code;
      const fn = new Function('inputs', 'outputs', 'context', 'node', code + '\nreturn outputs;');
      const outputs = {};
      const context = {
        assert: {
          exists: (val, msg) => {
            if (val === undefined || val === null) throw new Error(msg);
            return val;
          }
        }
      };
      fn(inputs, outputs, context, setNode);
      return outputs;
    }

    it('updates value in List (Array) at specified index', () => {
      const list = ['Apple', 'Banana', 'Cherry'];
      const out = executeSetFromPath({ collection: list, path: '1', value: 'Blueberry' });

      expect(out.collectionOut[1]).toBe('Blueberry');
      expect(out.valueOut).toBe('Blueberry');
      expect(out.execOut).toBe(true);
      expect(list[1]).toBe('Blueberry');
    });

    it('updates nested property in Map (Object) and List via bracket notation', () => {
      const map = { profile: { title: 'Novice' }, inventory: ['Stick'] };
      const out1 = executeSetFromPath({ collection: map, path: "profile['title']", value: 'Master' });
      expect(out1.collectionOut.profile.title).toBe('Master');

      const out2 = executeSetFromPath({ collection: map, path: "inventory[0]", value: 'Excalibur' });
      expect(out2.collectionOut.inventory[0]).toBe('Excalibur');
    });

    it('creates intermediate nested containers (arrays for numeric keys, objects for string keys)', () => {
      const root = {};
      const out = executeSetFromPath({ collection: root, path: 'teams.0.leader', value: 'Captain' });

      expect(Array.isArray(out.collectionOut.teams)).toBe(true);
      expect(out.collectionOut.teams[0].leader).toBe('Captain');
    });

    it('updates ES6 Map instance', () => {
      const es6Map = new Map([
        ['score', 50]
      ]);
      const out = executeSetFromPath({ collection: es6Map, path: 'score', value: 100 });

      expect(out.collectionOut.get('score')).toBe(100);
      expect(out.valueOut).toBe(100);
    });

    it('handles JSON string collection input and returns modified collection', () => {
      const jsonMap = '{"hero": {"hp": 100}}';
      const out = executeSetFromPath({ collection: jsonMap, path: 'hero.hp', value: 200 });

      expect(out.collectionOut.hero.hp).toBe(200);
      expect(out.valueOut).toBe(200);
    });
  });
});
