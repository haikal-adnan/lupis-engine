import { describe, it, expect, vi } from 'vitest';
import ScriptRunner from '@core/Script/ScriptRunner.js';
import ContextSystem from '@core/Script/ContextSystem.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';
import { BlueprintUI } from '@nodes/library/blueprints/BlueprintUI.js';

describe('UI Prefab Data Binder Blueprint & Execution Tests', () => {
  const binderDef = BlueprintUI.items.find(i => i.type === 'uiPrefabBinder');

  it('is registered in BlueprintUI and BlueprintHelperTool with correct metadata', () => {
    expect(binderDef).toBeDefined();
    expect(binderDef.label).toBe('UI Prefab Data Binder');
    expect(binderDef.defaultData.settings.category).toBe('Helper & Tool');
    expect(binderDef.defaultData.inputs.map(i => i.id)).toEqual([
      'execIn', 'targetEntity', 'data', 'itemIndex', 'bindings'
    ]);
    expect(binderDef.defaultData.outputs.map(o => o.id)).toEqual([
      'execOut', 'targetEntity', 'boundCount'
    ]);

    const inHelperTool = BlueprintHelperTool.items.find(i => i.type === 'uiPrefabBinder');
    expect(inHelperTool).toBeDefined();
  });

  function createMockGame(initialEntities = []) {
    const mockGame = {
      deltaTime: 0.016,
      world: {
        entities: initialEntities,
        settings: { ui: { width: 1920, height: 1080 } },
        resolveAssetId: vi.fn(id => (id === 'Unlocked' ? 'asset_unlocked_guid' : (id === 'Locked' ? 'asset_locked_guid' : id)))
      },
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        once: vi.fn()
      }
    };

    mockGame.contextSystem = new ContextSystem(mockGame);
    return mockGame;
  }

  it('binds SpriteRenderer, TextRenderer and ScriptController on child entities with mapping and templates', () => {
    const rootEntity = {
      id: 'panel_1',
      scriptId: 'panelLevel',
      components: {
        UITransform: { x: 0, y: 0, width: 172, height: 192 },
        SpriteRenderer: { assetId: 'default_panel', color: '#FFFFFF' },
        ScriptController: {
          data: [{ id: 'inst_1', variables: {} }]
        }
      }
    };

    const textChild = {
      id: 'text_1',
      scriptId: 'textPanelLevel',
      parentId: 'panel_1',
      components: {
        TextRenderer: { value: '0', fontSize: 40 }
      }
    };

    const starChild = {
      id: 'star_1',
      scriptId: 'startPanelLevel',
      parentId: 'panel_1',
      visible: true,
      components: {
        SpriteRenderer: { assetId: 'star_none' }
      }
    };

    const mockGame = createMockGame([rootEntity, textChild, starChild]);

    const itemData = {
      nameLevel: '5',
      sceneLevel: 'sceneLevel5',
      lock: true,
      star: '2_3'
    };

    const bindings = [
      // 1. TextRenderer via template
      {
        target: 'textPanelLevel',
        component: 'TextRenderer',
        property: 'value',
        template: 'Level {nameLevel}'
      },
      // 2. SpriteRenderer via lock mapping
      {
        target: 'self',
        component: 'SpriteRenderer',
        property: 'assetId',
        path: 'lock',
        mapping: {
          true: 'Locked',
          false: 'Unlocked'
        }
      },
      // 3. Child SpriteRenderer with template asset
      {
        target: 'startPanelLevel',
        component: 'SpriteRenderer',
        property: 'assetId',
        template: 'asset_star_{star}'
      },
      // 4. Entity visibility conditional on lock
      {
        target: 'startPanelLevel',
        component: 'Entity',
        property: 'visible',
        path: 'lock',
        mapping: {
          true: false,
          false: true
        }
      },
      // 5. ScriptController variable
      {
        target: 'self',
        component: 'ScriptController',
        property: 'targetScene',
        path: 'sceneLevel'
      }
    ];

    const scriptData = {
      id: 'test_binder_script',
      nodes: [
        {
          id: 'binderNode',
          type: 'uiPrefabBinder',
          inputs: binderDef.defaultData.inputs,
          outputs: binderDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: 'panelLevel',
              data: itemData,
              itemIndex: 4,
              bindings: bindings
            },
            code: binderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    // Assertions
    expect(textChild.components.TextRenderer.value).toBe('Level 5');
    expect(rootEntity.components.SpriteRenderer.assetId).toBe('asset_locked_guid');
    expect(starChild.components.SpriteRenderer.assetId).toBe('asset_star_2_3');
    expect(starChild.visible).toBe(false);
    expect(rootEntity.components.ScriptController.data[0].variables.targetScene).toBe('sceneLevel5');
  });

  it('supports all components from componentSchema.js with auto-inference', () => {
    const testEnt = {
      id: 'ent_all_comps',
      scriptId: 'allCompsEntity',
      active: true,
      visible: true,
      components: {
        Transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
        UITransform: { anchorX: 0, anchorY: 0, width: 100, height: 100 },
        Audio: { assetId: 'sfx_old', volume: 50, isMute: false },
        Collider: { data: [{ enabled: true, width: 32, height: 32 }] },
        Physics: { enabled: true, mass: 1, velocityX: 0 },
        SpriteAnimator: { currentClip: 'idle', isPlaying: false },
        ShapeRenderer: { color: '#000000', isFilled: false },
        Tilemap: { assetId: 'tileset_old', isSolid: false }
      }
    };

    const mockGame = createMockGame([testEnt]);

    const bindings = [
      { property: 'scale', value: 2 }, // sets Transform scaleX & scaleY
      { property: 'anchorX', value: 0.5 }, // UITransform
      { property: 'volume', value: 85 }, // Audio
      { property: 'enabled', component: 'Collider', value: false }, // Collider
      { property: 'mass', value: 5.5 }, // Physics
      { property: 'currentClip', value: 'run' }, // SpriteAnimator
      { property: 'color', component: 'ShapeRenderer', value: '#FF0000' }, // ShapeRenderer
      { property: 'isSolid', value: true }, // Tilemap
      { property: 'active', component: 'Entity', value: false } // Entity
    ];

    const scriptData = {
      id: 'test_all_schema',
      nodes: [
        {
          id: 'node_all',
          type: 'uiPrefabBinder',
          inputs: binderDef.defaultData.inputs,
          outputs: binderDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: 'allCompsEntity',
              data: {},
              itemIndex: 0,
              bindings: bindings
            },
            code: binderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(testEnt.components.Transform.scaleX).toBe(2);
    expect(testEnt.components.Transform.scaleY).toBe(2);
    expect(testEnt.components.UITransform.anchorX).toBe(0.5);
    expect(testEnt.components.Audio.volume).toBe(85);
    expect(testEnt.components.Collider.data[0].enabled).toBe(false);
    expect(testEnt.components.Physics.mass).toBe(5.5);
    expect(testEnt.components.SpriteAnimator.currentClip).toBe('run');
    expect(testEnt.components.ShapeRenderer.color).toBe('#FF0000');
    expect(testEnt.components.Tilemap.isSolid).toBe(true);
    expect(testEnt.active).toBe(false);
  });

  it('supports "switch" keyword and direct global() & local() variables in path and template', () => {
    const cardEnt = {
      id: 'card_vip',
      scriptId: 'cardVip',
      components: {
        TextRenderer: { value: '' },
        SpriteRenderer: { assetId: 'default_frame' }
      }
    };

    const globals = {
      playerName: 'Hero',
      isVip: true,
      profile: { title: 'Champion' }
    };

    const mockGame = {
      deltaTime: 0.016,
      world: {
        entities: [cardEnt],
        settings: { ui: { width: 1920, height: 1080 } },
        resolveAssetId: vi.fn(id => (id === 'vip_gold' ? 'asset_vip_gold' : id))
      },
      events: { emit: vi.fn(), on: vi.fn(), once: vi.fn() },
      variables: {
        getGlobal: vi.fn(key => globals[key]),
        hasGlobal: vi.fn(key => key in globals),
        setGlobal: vi.fn((key, val) => { globals[key] = val; })
      }
    };
    mockGame.contextSystem = new ContextSystem(mockGame);

    const bindings = [
      // 1. "switch" keyword instead of "mapping" with global() in path
      {
        component: 'SpriteRenderer',
        property: 'assetId',
        path: 'global(isVip)',
        switch: {
          true: 'vip_gold',
          false: 'normal_frame'
        }
      },
      // 2. Template mixing item data, global(), and local()
      {
        component: 'TextRenderer',
        property: 'value',
        template: '{global(profile).title} {global(playerName)} - Chapter {local(chapter)} - Lv.{levelNum}'
      }
    ];

    const scriptData = {
      id: 'test_vars_script',
      localVariables: [
        { id: 'loc_ch', name: 'chapter', defaultValue: 3 }
      ],
      nodes: [
        {
          id: 'node_vars',
          type: 'uiPrefabBinder',
          inputs: binderDef.defaultData.inputs,
          outputs: binderDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: 'cardVip',
              data: { levelNum: 99 },
              itemIndex: 0,
              bindings: bindings
            },
            code: binderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(cardEnt.components.SpriteRenderer.assetId).toBe('asset_vip_gold');
    expect(cardEnt.components.TextRenderer.value).toBe('Champion Hero - Chapter 3 - Lv.99');
  });

  it('supports setting local script variables (by scriptId) and global variables directly', () => {
    const multiScriptEntity = {
      id: 'ent_multi_script',
      scriptId: 'panelLevelRoot',
      components: {
        ScriptController: {
          data: [
            {
              id: 'inst_ui_hover',
              assetId: 'script_hover_asset',
              variables: { hoverColor: '#FFF' }
            },
            {
              id: 'inst_btn_level',
              assetId: 'script_btn_asset',
              variables: { sceneTarget: '', levelNum: 0 }
            }
          ]
        }
      }
    };

    const globals = {
      activeLevelId: 0
    };

    const mockGame = {
      deltaTime: 0.016,
      world: {
        entities: [multiScriptEntity],
        settings: { ui: { width: 1920, height: 1080 } },
        scripts: {
          script_hover_asset: { scriptId: 'UIHoverEffect', name: 'UIHoverEffect' },
          script_btn_asset: { scriptId: 'LevelButton', name: 'LevelButton' }
        }
      },
      events: { emit: vi.fn(), on: vi.fn(), once: vi.fn() },
      variables: {
        getGlobal: vi.fn(key => globals[key]),
        hasGlobal: vi.fn(key => key in globals),
        setGlobal: vi.fn((key, val) => { globals[key] = val; })
      }
    };
    mockGame.contextSystem = new ContextSystem(mockGame);

    const bindings = [
      // 1. Setting local variable on specific script by scriptId ("LevelButton")
      {
        local: 'sceneTarget',
        script: 'LevelButton',
        path: 'sceneLevel'
      },
      {
        local: 'levelNum',
        script: 'LevelButton',
        path: 'nameLevel'
      },
      // 2. Setting global variable
      {
        global: 'activeLevelId',
        path: 'nameLevel'
      }
    ];

    const scriptData = {
      id: 'test_local_global_set',
      nodes: [
        {
          id: 'node_set',
          type: 'uiPrefabBinder',
          inputs: binderDef.defaultData.inputs,
          outputs: binderDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: 'panelLevelRoot',
              data: { nameLevel: 7, sceneLevel: 'sceneLevel7' },
              itemIndex: 6,
              bindings: bindings
            },
            code: binderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    const scData = multiScriptEntity.components.ScriptController.data;
    const levelBtnInst = scData.find(s => s.assetId === 'script_btn_asset');
    expect(levelBtnInst.variables.sceneTarget).toBe('sceneLevel7');
    expect(levelBtnInst.variables.levelNum).toBe(7);
    expect(globals.activeLevelId).toBe(7);
  });

  it('supports deep nested lists, ES6 Maps, and dynamic variable interpolation in path', () => {
    const cardEnt = {
      id: 'ent_complex_data',
      scriptId: 'complexCard',
      components: {
        TextRenderer: { value: '' },
        SpriteRenderer: { assetId: '' }
      }
    };

    // Deep nested data containing both Arrays and Maps
    const es6Map = new Map();
    es6Map.set('iconAsset', 'asset_gem_diamond');
    es6Map.set(100, 'bonus_100');

    const complexData = {
      chapters: [
        {
          id: 'ch_intro',
          stages: [
            { stageNum: 1, title: 'Beginner' },
            {
              stageNum: 2,
              title: 'Forest Path',
              rewards: [
                { type: 'coin', amount: 50 },
                { type: 'gem', mapData: es6Map }
              ]
            }
          ]
        }
      ]
    };

    const globals = {
      worldConfig: {
        currentWorld: 'forest',
        worlds: {
          forest: {
            themeColor: '#2E7D32',
            bannerAsset: 'banner_forest_hq'
          }
        }
      }
    };

    const mockGame = {
      deltaTime: 0.016,
      world: {
        entities: [cardEnt],
        settings: { ui: { width: 1920, height: 1080 } },
        resolveAssetId: vi.fn(id => id)
      },
      events: { emit: vi.fn(), on: vi.fn(), once: vi.fn() },
      variables: {
        getGlobal: vi.fn(key => globals[key]),
        hasGlobal: vi.fn(key => key in globals),
        setGlobal: vi.fn((key, val) => { globals[key] = val; })
      }
    };
    mockGame.contextSystem = new ContextSystem(mockGame);

    const bindings = [
      // 1. Deep path with array index + nested Map access
      {
        path: 'chapters[0].stages[{index}].rewards[1].mapData.iconAsset',
        component: 'SpriteRenderer',
        property: 'assetId'
      },
      // 2. Dynamic path accessing Global object with local variable interpolation
      {
        path: 'global(worldConfig).worlds[{local(selectedWorld)}].themeColor',
        component: 'TextRenderer',
        property: 'color'
      },
      // 3. Nested stage title
      {
        path: 'chapters[0].stages[{index}].title',
        component: 'TextRenderer',
        property: 'value'
      }
    ];

    const scriptData = {
      id: 'test_complex_path',
      localVariables: [
        { id: 'loc_w', name: 'selectedWorld', defaultValue: 'forest' }
      ],
      nodes: [
        {
          id: 'node_complex',
          type: 'uiPrefabBinder',
          inputs: binderDef.defaultData.inputs,
          outputs: binderDef.defaultData.outputs,
          data: {
            values: {
              targetEntity: 'complexCard',
              data: complexData,
              itemIndex: 1, // index = 1 targets stage 2
              bindings: bindings
            },
            code: binderDef.defaultData.data.code
          }
        }
      ],
      edges: []
    };

    const runner = new ScriptRunner(mockGame, scriptData, { id: 'owner_ent' });
    runner._executeNodeLogic(scriptData.nodes[0], 'execIn');

    expect(cardEnt.components.SpriteRenderer.assetId).toBe('asset_gem_diamond');
    expect(cardEnt.components.TextRenderer.color).toBe('#2E7D32');
    expect(cardEnt.components.TextRenderer.value).toBe('Forest Path');
  });
});
