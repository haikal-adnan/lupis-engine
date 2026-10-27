import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';
import { BlueprintUI } from '@nodes/library/blueprints/BlueprintUI.js';
import { BlueprintEntity } from '@nodes/library/blueprints/BlueprintEntity.js';

describe('UI Grid Spawner Blueprint & Execution Tests', () => {
  const gridSpawnerDef = BlueprintUI.items.find(i => i.type === 'uiGridSpawner');

  it('is registered in BlueprintUI and BlueprintHelperTool with correct metadata', () => {
    expect(gridSpawnerDef).toBeDefined();
    expect(gridSpawnerDef.label).toBe('UI Grid Spawner');
    expect(gridSpawnerDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(gridSpawnerDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn', 'prefabName', 'totalCount', 'columns', 'spacingX', 'spacingY', 'startX', 'startY', 'parentEntity', 'layerId', 'dataList'
    ]);
    expect(gridSpawnerDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut', 'onSpawnItem', 'spawnedEntity', 'itemIndex', 'rowIndex', 'colIndex', 'itemData', 'spawnedEntities'
    ]);

    // Ensure it is also re-exported through BlueprintHelperTool
    const inHelperTool = BlueprintHelperTool.items.find(i => i.type === 'uiGridSpawner');
    expect(inHelperTool).toBeDefined();
  });

  function createMockGame(prefabs = {}, initialEntities = []) {
    const spawnedEntities = [...initialEntities];
    let spawnCount = 0;

    const mockGame = {
      deltaTime: 0.016,
      camera: { x: 0, y: 0, scale: 1 },
      canvas: { width: 1920, height: 1080 },
      world: {
        entities: spawnedEntities,
        prefabs,
        settings: { ui: { width: 1920, height: 1080 } }
      },
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        once: vi.fn()
      },
      prefabSystem: {
        spawnPrefab: vi.fn((prefabIdentifier, posX, posY, layerScriptId) => {
          spawnCount++;
          const newEnt = {
            id: `ent_spawned_${spawnCount}`,
            scriptId: `spawned_card_${spawnCount}`,
            prefabId: prefabIdentifier,
            layerId: layerScriptId || 'default_layer',
            parentId: null,
            children: [],
            components: {
              UITransform: { x: posX, y: posY, width: 100, height: 100 }
            }
          };
          spawnedEntities.push(newEnt);
          return newEnt;
        })
      },
      input: {
        getPointer: vi.fn(() => ({ x: 0, y: 0, down: false })),
        mouse: { isDown: vi.fn(() => false) },
        isPointerOver: vi.fn(() => false)
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return { mockGame, spawnedEntities };
  }

  it('spawns a 3x5 (15 items) level grid with correct coordinates and index calculation', () => {
    const { mockGame } = createMockGame({
      LevelCard: { id: 'LevelCard', scriptId: 'LevelCard' }
    });

    const scriptData = {
      id: 'test_grid_script',
      nodes: [
        {
          id: 'spawnerNode',
          type: 'uiGridSpawner',
          inputs: gridSpawnerDef.defaultData.inputs,
          outputs: gridSpawnerDef.defaultData.outputs,
          data: {
            values: {
              prefabName: 'LevelCard',
              totalCount: 15,
              columns: 5,
              spacingX: 120,
              spacingY: 150,
              startX: 100,
              startY: 200,
              parentEntity: '',
              layerId: 'ui_layer',
              dataList: []
            },
            code: gridSpawnerDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(mockGame.prefabSystem.spawnPrefab).toHaveBeenCalledTimes(15);

    // Verify 1st item (col 0, row 0)
    expect(mockGame.prefabSystem.spawnPrefab).toHaveBeenNthCalledWith(1, 'LevelCard', 100, 200, 'ui_layer');

    // Verify 5th item (col 4, row 0) -> x = 100 + 4*120 = 580, y = 200
    expect(mockGame.prefabSystem.spawnPrefab).toHaveBeenNthCalledWith(5, 'LevelCard', 580, 200, 'ui_layer');

    // Verify 6th item (col 0, row 1) -> x = 100, y = 200 + 1*150 = 350
    expect(mockGame.prefabSystem.spawnPrefab).toHaveBeenNthCalledWith(6, 'LevelCard', 100, 350, 'ui_layer');

    // Verify 15th item (col 4, row 2) -> x = 580, y = 200 + 2*150 = 500
    expect(mockGame.prefabSystem.spawnPrefab).toHaveBeenNthCalledWith(15, 'LevelCard', 580, 500, 'ui_layer');

    const nodeOutputs = runner.nodeOutputs.get('spawnerNode');
    expect(nodeOutputs.execOut).toBe(false); // Consumed by runner
    expect(nodeOutputs.spawnedEntities.length).toBe(15);
    expect(nodeOutputs.itemIndex).toBe(14);
    expect(nodeOutputs.rowIndex).toBe(2);
    expect(nodeOutputs.colIndex).toBe(4);
  });

  it('parents spawned entities to parentEntity if provided', () => {
    const parent = {
      id: 'ent_parent_container',
      scriptId: 'GridContainer',
      children: [],
      addChild(child) {
        this.children.push(child);
        child.parentId = this.id;
      }
    };

    const { mockGame } = createMockGame(
      { LevelCard: { id: 'LevelCard' } },
      [parent]
    );

    const scriptData = {
      id: 'test_grid_parent_script',
      nodes: [
        {
          id: 'spawnerNode',
          type: 'uiGridSpawner',
          inputs: gridSpawnerDef.defaultData.inputs,
          outputs: gridSpawnerDef.defaultData.outputs,
          data: {
            values: {
              prefabName: 'LevelCard',
              totalCount: 3,
              columns: 3,
              spacingX: 100,
              spacingY: 100,
              startX: 0,
              startY: 0,
              parentEntity: 'GridContainer',
              layerId: '',
              dataList: []
            },
            code: gridSpawnerDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(parent.children.length).toBe(3);
    expect(parent.children[0].parentId).toBe('ent_parent_container');
    expect(parent.children[1].parentId).toBe('ent_parent_container');
    expect(parent.children[2].parentId).toBe('ent_parent_container');
  });

  it('passes dataList itemData to outputs during iteration', () => {
    const { mockGame } = createMockGame({
      LevelCard: { id: 'LevelCard' }
    });

    const levelData = [
      { level: 1, stars: 3, score: 1000 },
      { level: 2, stars: 2, score: 850 },
      { level: 3, stars: 0, score: 0 }
    ];

    const scriptData = {
      id: 'test_grid_data_script',
      nodes: [
        {
          id: 'spawnerNode',
          type: 'uiGridSpawner',
          inputs: gridSpawnerDef.defaultData.inputs,
          outputs: gridSpawnerDef.defaultData.outputs,
          data: {
            values: {
              prefabName: 'LevelCard',
              totalCount: 3,
              columns: 3,
              spacingX: 100,
              spacingY: 100,
              startX: 0,
              startY: 0,
              parentEntity: '',
              layerId: '',
              dataList: levelData
            },
            code: gridSpawnerDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    const nodeOutputs = runner.nodeOutputs.get('spawnerNode');
    expect(nodeOutputs.spawnedEntities.length).toBe(3);
    // Last iteration itemData is level 3
    expect(nodeOutputs.itemData).toEqual({ level: 3, stars: 0, score: 0 });
  });

  it('handles empty prefabName gracefully with warning and zero spawns', () => {
    const { mockGame } = createMockGame();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const scriptData = {
      id: 'test_empty_script',
      nodes: [
        {
          id: 'spawnerNode',
          type: 'uiGridSpawner',
          inputs: gridSpawnerDef.defaultData.inputs,
          outputs: gridSpawnerDef.defaultData.outputs,
          data: {
            values: {
              prefabName: '',
              totalCount: 5,
              columns: 5,
              spacingX: 100,
              spacingY: 100,
              startX: 0,
              startY: 0,
              parentEntity: '',
              layerId: '',
              dataList: []
            },
            code: gridSpawnerDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(mockGame.prefabSystem.spawnPrefab).not.toHaveBeenCalled();
    const nodeOutputs = runner.nodeOutputs.get('spawnerNode');
    expect(nodeOutputs.spawnedEntities).toEqual([]);
    warnSpy.mockRestore();
  });

  it('retrieves specific child entities by prefab child name via Get Child By Name node without global tags', () => {
    const getChildNodeDef = BlueprintEntity.items.find(i => i.type === 'entityGetChildByName');
    expect(getChildNodeDef).toBeDefined();

    // Create a spawned level card with children having unique random suffixes (from PrefabSystem)
    const cardId = 'card_level_1';
    const cardEntity = {
      id: 'ent_root_1',
      scriptId: cardId,
      parentId: null,
      children: []
    };

    const textChild = {
      id: 'ent_text_1',
      scriptId: 'LevelText_7a8b9c',
      parentId: 'ent_root_1'
    };
    const starChild2 = {
      id: 'ent_star_2',
      scriptId: 'Star2_7a8b9c',
      parentId: 'ent_root_1'
    };
    const scoreChild = {
      id: 'ent_score_1',
      scriptId: 'ScoreText_7a8b9c',
      parentId: 'ent_root_1'
    };

    cardEntity.children = [textChild, starChild2, scoreChild];

    const { mockGame } = createMockGame({}, [cardEntity, textChild, starChild2, scoreChild]);

    const scriptData = {
      id: 'test_child_lookup_script',
      nodes: [
        {
          id: 'findTextNode',
          type: 'entityGetChildByName',
          inputs: getChildNodeDef.defaultData.inputs,
          outputs: getChildNodeDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: cardId,
              childName: 'LevelText'
            },
            code: getChildNodeDef.defaultData.data.code
          }
        },
        {
          id: 'findStarNode',
          type: 'entityGetChildByName',
          inputs: getChildNodeDef.defaultData.inputs,
          outputs: getChildNodeDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: cardId,
              childName: 'Star2'
            },
            code: getChildNodeDef.defaultData.data.code
          }
        },
        {
          id: 'findMissingNode',
          type: 'entityGetChildByName',
          inputs: getChildNodeDef.defaultData.inputs,
          outputs: getChildNodeDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: cardId,
              childName: 'NonExistent'
            },
            code: getChildNodeDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });

    // 1. Find LevelText
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');
    const textOutputs = runner.nodeOutputs.get('findTextNode');
    expect(textOutputs.found).toBe(true);
    expect(textOutputs.childEntity).toBe('LevelText_7a8b9c');

    // 2. Find Star2
    runner._executeNodeLogic(scriptData.nodes[1], 'execIn');
    const starOutputs = runner.nodeOutputs.get('findStarNode');
    expect(starOutputs.found).toBe(true);
    expect(starOutputs.childEntity).toBe('Star2_7a8b9c');

    // 3. Find Missing
    runner._executeNodeLogic(scriptData.nodes[2], 'execIn');
    const missingOutputs = runner.nodeOutputs.get('findMissingNode');
    expect(missingOutputs.found).toBe(false);
    expect(missingOutputs.childEntity).toBe('');
  });
});
