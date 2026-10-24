import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { BlueprintHelperTool } from '@nodes/library/blueprints/BlueprintHelperTool.js';
import { validateCodePanelContract } from '@nodes/contract/codePanelContract.js';
import Game from '@core/Core/Game.js';
import Config from '@core/Core/Config.js';
import PointerRaycast from '@core/System/PointerRaycast.js';

describe('injectLayer Node & Layer Injection System', () => {
  const injectNode = BlueprintLifecycle.items.find(item => item.type === 'injectLayer');

  describe('Blueprint Definition and T-001 Contract Compliance', () => {
    it('defines the injectLayer blueprint with exact specified input/output ports', () => {
      expect(injectNode).toBeDefined();
      expect(injectNode.label).toBe('Inject Layer');

      const inputIds = injectNode.defaultData.inputs.map(p => p.id);
      expect(inputIds).toEqual(['execIn', 'sceneTemplate', 'layerTemplate', 'targetScene', 'targetLayer', 'inheritState']);

      const outputIds = injectNode.defaultData.outputs.map(p => p.id);
      expect(outputIds).toEqual(['execOut', 'success', 'isFirstLoad']);

      // Verify default values
      const defaultValues = injectNode.defaultData.data.values;
      expect(defaultValues.layerTemplate).toBeNull();
      expect(defaultValues.targetScene).toBe('self');
      expect(defaultValues.targetLayer).toBe('self');
      expect(defaultValues.inheritState).toBe(true);

      // Enforce no label property exists on ports
      [...injectNode.defaultData.inputs, ...injectNode.defaultData.outputs].forEach(port => {
        expect(port.label).toBeUndefined();
        expect(port.id).toMatch(/^[A-Za-z][A-Za-z0-9]{0,31}$/);
      });
    });

    it('adheres to code syntax, comment stripping, and clean execution standards', () => {
      const code = injectNode.defaultData.data.code;
      expect(code.includes('//')).toBe(false);
      expect(code.includes('/*')).toBe(false);
      expect(code.includes('?.')).toBe(false);
      expect(code.includes('??')).toBe(false);
      expect(code.trim().endsWith('return;')).toBe(true);
    });

    it('passes code panel contract validation without any forbidden null checks or mismatches', () => {
      const nodeInstance = {
        id: 'node_inject_layer_test',
        type: 'injectLayer',
        inputs: injectNode.defaultData.inputs,
        outputs: injectNode.defaultData.outputs,
        data: injectNode.defaultData.data
      };

      const validation = validateCodePanelContract(injectNode.defaultData.data.code, { node: nodeInstance });
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('executes blueprint code and properly delegates to context.scene.injectLayer', () => {
      const mockContext = {
        scene: {
          injectLayer: vi.fn((scene, layer, inherit, targetLayer, targetScene) => ({
            success: true,
            isFirstLoad: inherit
          }))
        }
      };

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', injectNode.defaultData.data.code);

      const inputs = {
        sceneTemplate: 'Template_UI',
        layerTemplate: 'Settings_Layer',
        targetScene: 'Main_Scene',
        targetLayer: 'Custom_Target',
        inheritState: true
      };
      const outputs = {};

      executeCode(inputs, outputs, mockContext, injectNode);

      expect(mockContext.scene.injectLayer).toHaveBeenCalledWith('Template_UI', 'Settings_Layer', true, 'Custom_Target', 'Main_Scene');
      expect(outputs.execOut).toBe(true);
      expect(outputs.success).toBe(true);
      expect(outputs.isFirstLoad).toBe(true);

      // Verify inheritState false passes false
      inputs.inheritState = false;
      executeCode(inputs, outputs, mockContext, injectNode);
      expect(mockContext.scene.injectLayer).toHaveBeenCalledWith('Template_UI', 'Settings_Layer', false, 'Custom_Target', 'Main_Scene');
      expect(outputs.isFirstLoad).toBe(false);
    });

    it('executes blueprint code when layerTemplate is null and targetScene/targetLayer default to self', () => {
      const mockContext = {
        scene: {
          injectLayer: vi.fn((scene, layer, inherit, targetLayer, targetScene) => ({
            success: true,
            isFirstLoad: inherit
          }))
        }
      };

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', injectNode.defaultData.data.code);

      const inputs = {
        sceneTemplate: 'Template_UI',
        layerTemplate: null,
        targetScene: 'self',
        targetLayer: 'self'
      };
      const outputs = {};

      executeCode(inputs, outputs, mockContext, injectNode);

      expect(mockContext.scene.injectLayer).toHaveBeenCalledWith('Template_UI', null, true, 'self', 'self');
      expect(outputs.execOut).toBe(true);
      expect(outputs.success).toBe(true);
    });
  });

  describe('SceneSystem.injectLayer Runtime System', () => {
    let game;
    let templateSceneData;
    let mainSceneData;

    beforeEach(() => {
      Config.ENGINE_MODE = 'editor';
      game = new Game();

      templateSceneData = {
        id: 'scene_template_ui',
        scriptId: 'Template_UI',
        layersUI: [
          {
            id: 'layer_settings_ui',
            scriptId: 'Settings_Layer',
            section: 'ui',
            zIndex: 100,
            orderIndex: 0,
            visible: true,
            active: true
          }
        ],
        layersWorld: [],
        entities: [
          {
            id: 'ent_modal_panel',
            scriptId: 'modal_panel',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: null,
            visible: true,
            active: true,
            components: {
              UITransform: { x: 100, y: 100, width: 400, height: 300 }
            }
          },
          {
            id: 'ent_btn_close',
            scriptId: 'btn_close',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: 'ent_modal_panel',
            visible: true,
            active: true,
            components: {
              UITransform: { x: 350, y: 20, width: 30, height: 30 }
            }
          },
          {
            id: 'VolumeBGMBar',
            scriptId: 'VolumeBGMBar',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: 'ent_modal_panel',
            visible: true,
            active: true,
            components: {
              UITransform: { x: -270, y: 0, width: 360, height: 20, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 },
              SpriteRenderer: { sourceX: 0, sourceY: 0, sourceWidth: 360, sourceHeight: 20 }
            }
          },
          {
            id: 'VolumeBGMHandler',
            scriptId: 'VolumeBGMHandler',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: 'ent_modal_panel',
            visible: true,
            active: true,
            components: {
              UITransform: { x: -90, y: 0, width: 30, height: 30, pivotX: 0.5, pivotY: 0.5, anchorX: 0.5, anchorY: 0.5 }
            }
          },
          {
            id: 'SwitchTrack',
            scriptId: 'SwitchTrack',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: 'ent_modal_panel',
            visible: true,
            active: true,
            components: {
              UITransform: { x: 0, y: 50, width: 80, height: 30, pivotX: 0.5, pivotY: 0.5 },
              ShapeRenderer: { color: '#757575' }
            }
          },
          {
            id: 'SwitchKnob',
            scriptId: 'SwitchKnob',
            type: 'ui',
            layerId: 'layer_settings_ui',
            parentId: 'ent_modal_panel',
            visible: true,
            active: true,
            components: {
              UITransform: { x: 0, y: 50, width: 30, height: 26, pivotX: 0.5, pivotY: 0.5 },
              ShapeRenderer: { color: '#E0E0E0' }
            }
          }
        ]
      };

      mainSceneData = {
        id: 'scene_main',
        scriptId: 'Main_Level',
        layersWorld: [
          { id: 'layer_world', scriptId: 'World_Layer', visible: true, active: true }
        ],
        layersUI: [
          { id: 'layer_hud', scriptId: 'HUD_Layer', visible: true, active: true }
        ],
        entities: [
          {
            id: 'ent_player',
            scriptId: 'player',
            type: 'entity',
            layerId: 'layer_world',
            components: {
              Transform: { x: 0, y: 0 }
            }
          }
        ]
      };

      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData]);
      game.sceneSystem.loadScene('scene_main');
    });

    it('injects layer and its entities into current world for the first time', () => {
      const result = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);

      expect(result.success).toBe(true);
      expect(result.isFirstLoad).toBe(true);

      const injectedLayer = game.world.layersUI.find(l => l.scriptId === 'Settings_Layer');
      expect(injectedLayer).toBeDefined();

      const modalPanel = game.world.entities.find(e => e.scriptId === 'modal_panel');
      const btnClose = game.world.entities.find(e => e.scriptId === 'btn_close');

      expect(modalPanel).toBeDefined();
      expect(btnClose).toBeDefined();
      expect(btnClose.parentId).toBe(modalPanel.id);
      expect(modalPanel.children.some(c => c.id === btnClose.id)).toBe(true);
    });

    it('inherits mutated runtime state when inheritState is true across scene loads', () => {
      // 1. First injection in Main_Level
      const firstResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(firstResult.success).toBe(true);
      expect(firstResult.isFirstLoad).toBe(true);

      // 2. Mutate runtime state (e.g. user toggles modal to invisible and moves slider/panel)
      const modal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      modal.visible = false;
      modal.components.UITransform.x = 999;

      // 3. Switch to another scene (Level 2)
      const level2SceneData = {
        id: 'scene_level_2',
        scriptId: 'Level_2',
        layersWorld: [{ id: 'l_w2', scriptId: 'World_2' }],
        layersUI: [{ id: 'l_ui2', scriptId: 'UI_2' }],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level2SceneData]);
      game.sceneSystem.loadScene('scene_level_2');

      // Verify scene switched and old entities cleared
      expect(game.world.entities.find(e => e.scriptId === 'modal_panel')).toBeUndefined();

      // 4. Inject layer in Level 2 with inheritState = true
      const secondResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(secondResult.success).toBe(true);
      expect(secondResult.isFirstLoad).toBe(false);

      // 5. Verify that mutated runtime state is retained!
      const inheritedModal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      expect(inheritedModal).toBeDefined();
      expect(inheritedModal.visible).toBe(false);
      expect(inheritedModal.components.UITransform.x).toBe(999);
    });

    it('resets to initial template schema when inheritState is false', () => {
      // 1. First injection and mutation
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      const modal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      modal.visible = false;
      modal.components.UITransform.x = 999;

      // 2. Reload scene and inject with inheritState = false
      game.sceneSystem.loadScene('scene_main');
      const resetResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', false);

      expect(resetResult.success).toBe(true);
      expect(resetResult.isFirstLoad).toBe(true);

      const resetModal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      expect(resetModal.visible).toBe(true);
      expect(resetModal.components.UITransform.x).toBe(100); // Original value from template
    });

    it('prevents duplicating layers or entities when injectLayer is called multiple times in same scene', () => {
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      const initialCount = game.world.entities.length;
      const initialLayerCount = game.world.layersUI.length;

      // Inject again
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(game.world.entities.length).toBe(initialCount);
      expect(game.world.layersUI.length).toBe(initialLayerCount);
    });

    it('[Bad Path] returns failure when source scene does not exist', () => {
      const result = game.sceneSystem.injectLayer('NonExistent_Scene', 'Settings_Layer', true);
      expect(result.success).toBe(false);
      expect(result.isFirstLoad).toBe(false);
    });

    it('[Bad Path] returns failure when target layer does not exist in source scene', () => {
      const result = game.sceneSystem.injectLayer('Template_UI', 'Unknown_Layer', true);
      expect(result.success).toBe(false);
      expect(result.isFirstLoad).toBe(false);
    });

    it('allows clearing persistent layer cache via clearPersistentLayers', () => {
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      const modal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      modal.visible = false;

      // Clear cache
      game.sceneSystem.clearPersistentLayers();

      // Reload scene and inject with inheritState = true
      game.sceneSystem.loadScene('scene_main');
      const result = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);

      expect(result.isFirstLoad).toBe(true);
      const freshModal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      expect(freshModal.visible).toBe(true);
    });

    it('preserves mutated layer properties (active: false, opacity: 0) across scene transitions', () => {
      // 1. First injection in Main_Level
      const firstResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(firstResult.success).toBe(true);

      const injectedLayer = game.world.layersUI.find(l => l.scriptId === 'Settings_Layer');
      expect(injectedLayer).toBeDefined();

      // 2. Mutate layer properties at runtime (inactive and opacity 0)
      injectedLayer.active = false;
      injectedLayer.opacity = 0;

      // 3. Switch to another scene (Level 2)
      const level2SceneData = {
        id: 'scene_level_2',
        scriptId: 'Level_2',
        layersWorld: [{ id: 'l_w2', scriptId: 'World_2' }],
        layersUI: [{ id: 'l_ui2', scriptId: 'UI_2' }],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level2SceneData]);
      game.sceneSystem.loadScene('scene_level_2');

      // 4. Inject layer into Level 2
      const secondResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(secondResult.success).toBe(true);
      expect(secondResult.isFirstLoad).toBe(false);

      const level2Layer = game.world.layersUI.find(l => l.scriptId === 'Settings_Layer');
      expect(level2Layer).toBeDefined();
      expect(level2Layer.active).toBe(false);
      expect(level2Layer.opacity).toBe(0);
    });

    it('preserves mutated layer properties even when destination scene already defines a layer with the same name', () => {
      // 1. First injection in Main_Level
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      const injectedLayer = game.world.layersUI.find(l => l.scriptId === 'Settings_Layer');
      injectedLayer.active = false;
      injectedLayer.opacity = 0;

      // 2. Prepare Level 3 that already has Settings_Layer defined with defaults (active: true, opacity: 1)
      const level3SceneData = {
        id: 'scene_level_3',
        scriptId: 'Level_3',
        layersWorld: [{ id: 'l_w3', scriptId: 'World_3' }],
        layersUI: [
          { id: 'l_ui_existing_settings', scriptId: 'Settings_Layer', section: 'ui', active: true, opacity: 1 }
        ],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level3SceneData]);
      game.sceneSystem.loadScene('scene_level_3');

      // 3. Inject layer into Level 3 with inheritState = true
      const result = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(result.success).toBe(true);

      const level3Layer = game.world.layersUI.find(l => l.scriptId === 'Settings_Layer');
      expect(level3Layer).toBeDefined();
      expect(level3Layer.active).toBe(false);
      expect(level3Layer.opacity).toBe(0);
    });

    it('routes injected entities into specified targetLayer when provided', () => {
      // Main level has HUD_Layer
      const result = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true, 'HUD_Layer');
      expect(result.success).toBe(true);

      const targetLayer = game.world.layersUI.find(l => l.scriptId === 'HUD_Layer');
      expect(targetLayer).toBeDefined();

      const modalPanel = game.world.entities.find(e => e.scriptId === 'modal_panel');
      expect(modalPanel).toBeDefined();
      expect(modalPanel.layerId).toBe(targetLayer.id);
    });

    it('inherits mutated state from a native layer of Scene 1 when injected into Scene 2 even if injectLayer was never called in Scene 1', () => {
      // 1. Scene 1 (scene_main) is loaded natively (not injected). It has HUD_Layer.
      const nativeHud = game.world.layersUI.find(l => l.scriptId === 'HUD_Layer');
      expect(nativeHud).toBeDefined();
      expect(nativeHud.active).toBe(true);

      // 2. Runtime mutates the native HUD_Layer in Scene 1 (inactive, opacity 0)
      nativeHud.active = false;
      nativeHud.opacity = 0;

      // 3. Player transitions to Scene 2 (Level 2)
      const level2SceneData = {
        id: 'scene_level_2',
        scriptId: 'Level_2',
        layersWorld: [{ id: 'l_w2', scriptId: 'World_2' }],
        layersUI: [{ id: 'l_ui2', scriptId: 'UI_2' }],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level2SceneData]);
      game.sceneSystem.loadScene('scene_level_2');

      // 4. In Scene 2, user calls injectLayer from Scene 1
      const result = game.sceneSystem.injectLayer('Main_Level', 'HUD_Layer', true);
      expect(result.success).toBe(true);

      // 5. Verify the layer in Scene 2 inherits active: false and opacity: 0!
      const injectedHud = game.world.layersUI.find(l => l.scriptId === 'HUD_Layer');
      expect(injectedHud).toBeDefined();
      expect(injectedHud.active).toBe(false);
      expect(injectedHud.opacity).toBe(0);
    });

    it('defaults targetScene and targetLayer to self and layerTemplate to null in blueprint node when inputs are omitted', () => {
      const mockContext = {
        scene: {
          injectLayer: vi.fn((scene, layer, inherit, targetLayer, targetScene) => ({
            success: true,
            isFirstLoad: inherit
          }))
        }
      };

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', injectNode.defaultData.data.code);

      // inputs only contains sceneTemplate
      const inputs = {
        sceneTemplate: 'Template_UI'
      };
      const outputs = {};

      executeCode(inputs, outputs, mockContext, injectNode);

      expect(mockContext.scene.injectLayer).toHaveBeenCalledWith('Template_UI', null, true, 'self', 'self');
      expect(outputs.execOut).toBe(true);
    });

    it('preserves slider base width and full 0-100% interactive range when injected after being at 30% in source scene', () => {
      const sliderNodeDef = BlueprintHelperTool.items.find(i => i.type === 'volumeSliderManager');
      expect(sliderNodeDef).toBeDefined();

      // 1. First injection in Main_Level
      const firstResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(firstResult.success).toBe(true);

      const barEnt = game.world.entities.find(e => e.scriptId === 'VolumeBGMBar');
      expect(barEnt).toBeDefined();
      expect(barEnt.components.UITransform.width).toBe(360);

      // 2. Simulate volume at 30% in Scene 1 (mutating UITransform and SpriteRenderer)
      barEnt.components.UITransform.width = 108;
      barEnt.components.UITransform.x = -396;
      barEnt.components.SpriteRenderer.sourceWidth = 108;

      // 3. Switch to Level 2
      const level2SceneData = {
        id: 'scene_level_2',
        scriptId: 'Level_2',
        layersWorld: [{ id: 'l_w2', scriptId: 'World_2' }],
        layersUI: [{ id: 'l_ui2', scriptId: 'UI_2' }],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level2SceneData]);
      game.sceneSystem.loadScene('scene_level_2');

      // 4. Inject layer into Level 2
      const secondResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(secondResult.success).toBe(true);

      const injectedBar = game.world.entities.find(e => e.scriptId === 'VolumeBGMBar');
      expect(injectedBar).toBeDefined();
      // UITransform retains baseWidth from source template!
      expect(injectedBar.components.UITransform._baseWidth).toBe(360);
      expect(injectedBar.components.UITransform._baseX).toBe(-270);
      expect(injectedBar.components.SpriteRenderer._baseSourceWidth).toBe(360);

      // 5. Execute volumeSliderManager in Scene 2
      let audioVolumes = { background: 30 };
      const mockContext = {
        game,
        ui: game.contextSystem.uiHandler,
        audio: {
          getVolume: vi.fn(() => 30),
          setVolume: vi.fn((bus, v) => { audioVolumes[bus] = v; })
        },
        entity: {
          get: vi.fn(id => game.world.entities.find(e => e.id === id || e.scriptId === id))
        },
        input: {
          getPointer: vi.fn(() => ({ x: 0, y: 0, down: false })),
          mouse: { isDown: vi.fn(() => false) }
        },
        state: {},
        onTick: vi.fn(),
        triggerFlow: vi.fn()
      };

      const executeSlider = new Function('inputs', 'outputs', 'context', 'node', sliderNodeDef.defaultData.data.code);
      const outputs = {};
      executeSlider({ config: { background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler' } } }, outputs, mockContext, sliderNodeDef);

      const s = mockContext.state.sliders.background;
      expect(s).toBeDefined();
      // baseW MUST be 360, not 108!
      expect(s.baseW).toBe(360);
      expect(s.screenRight - s.screenLeft).toBe(360);

      // Now drag to 100% of the bar width (screenLeft + 360)
      mockContext.input.getPointer = vi.fn(() => ({ x: s.screenLeft + 360, y: s.screenTop + 10, down: true }));
      mockContext.input.mouse.isDown = vi.fn(() => true);

      // Trigger interaction
      executeSlider({ config: { background: { bar: 'VolumeBGMBar', handler: 'VolumeBGMHandler' } } }, outputs, mockContext, sliderNodeDef);

      expect(mockContext.audio.setVolume).toHaveBeenCalledWith('background', 100);
      expect(outputs.backgroundVolume).toBe(100);
      expect(injectedBar.components.UITransform.width).toBe(360);
    });

    it('preserves switch state and bounds when injected after being toggled in source scene', () => {
      const switchDef = BlueprintHelperTool.items.find(i => i.type === 'switchButtonShape');
      expect(switchDef).toBeDefined();

      // 1. Inject layer into Main_Level
      game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);

      const knobEnt = game.world.entities.find(e => e.scriptId === 'SwitchKnob');
      const trackEnt = game.world.entities.find(e => e.scriptId === 'SwitchTrack');
      expect(knobEnt).toBeDefined();
      expect(trackEnt).toBeDefined();

      // Set track width to 74 so travelDist = 74 - 30 - 4 = 40
      trackEnt.components.UITransform.width = 74;

      // 2. Toggle switch to ON in Scene 1
      knobEnt.components.UITransform.x = 40;
      knobEnt._switchIsOn = true;
      trackEnt._switchIsOn = true;

      // 3. Switch to Level 2 and inject layer
      const level2SceneData = {
        id: 'scene_level_2',
        scriptId: 'Level_2',
        layersWorld: [{ id: 'l_w2', scriptId: 'World_2' }],
        layersUI: [{ id: 'l_ui2', scriptId: 'UI_2' }],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, level2SceneData]);
      game.sceneSystem.loadScene('scene_level_2');

      const secondResult = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true);
      expect(secondResult.success).toBe(true);

      const injectedKnob = game.world.entities.find(e => e.scriptId === 'SwitchKnob');
      const injectedTrack = game.world.entities.find(e => e.scriptId === 'SwitchTrack');

      // 4. Run switchButtonShape in Scene 2
      const mockContext = {
        game,
        ui: game.contextSystem.uiHandler,
        entity: {
          get: vi.fn(id => game.world.entities.find(e => e.id === id || e.scriptId === id))
        },
        input: {
          getPointer: vi.fn(() => ({ x: 0, y: 0, down: false })),
          mouse: { isDown: vi.fn(() => false) }
        },
        state: {},
        onTick: vi.fn(),
        triggerFlow: vi.fn()
      };

      const executeSwitch = new Function('inputs', 'outputs', 'context', 'node', switchDef.defaultData.data.code);
      const outputs = {};
      const inputs = {
        knobEntity: 'SwitchKnob',
        trackEntity: 'SwitchTrack',
        isOn: false, // Default unconnected input port is false
        slideDist: 40
      };

      executeSwitch(inputs, outputs, mockContext, switchDef);

      // In Scene 2, the switch must retain its ON state from Scene 1!
      expect(mockContext.state.isOn).toBe(true);
      expect(outputs.isOn).toBe(true);
      expect(mockContext.state.offX).toBe(0);
      expect(mockContext.state.onX).toBe(40);
      expect(injectedKnob.components.UITransform.x).toBe(40);
    });

    it('injects layer successfully when layerIdentifier is null and targetLayer is self', () => {
      // When layerTemplate is null and targetLayer is 'self', it should pick the first layer from sourceScene
      const result = game.sceneSystem.injectLayer('Template_UI', null, true, 'self', 'self');
      expect(result.success).toBe(true);
      expect(game.world.layersUI.some(l => l.scriptId === 'Settings_Layer')).toBe(true);
    });

    it('injects layer successfully into specified targetScene other than self', () => {
      const scene2Data = {
        id: 'scene_2',
        scriptId: 'Scene_2',
        layersWorld: [],
        layersUI: [],
        entities: []
      };
      game.sceneSystem.setSceneCache([templateSceneData, mainSceneData, scene2Data]);
      const result = game.sceneSystem.injectLayer('Template_UI', 'Settings_Layer', true, 'self', 'Scene_2');
      expect(result.success).toBe(true);
      const scene2 = game.sceneSystem._sceneDataCache.find(s => s.id === 'scene_2');
      expect(scene2.layersUI.some(l => l.scriptId === 'Settings_Layer')).toBe(true);
    });

    it('preserves existing target layer zIndex and renders/picks layer with zIndex 1 in front of zIndex 0', () => {
      // 1. Add an existing 'layerPause' with zIndex = 1 to main scene
      const pauseLayer = {
        id: 'layer_pause_custom',
        scriptId: 'layerPause',
        zIndex: 1,
        orderIndex: 0,
        visible: true,
        active: true,
        entities: []
      };
      game.world.layersUI.push(pauseLayer);

      // Add a HUD entity in HUD_Layer (zIndex: 0)
      const hudEntity = {
        id: 'ent_hud_button',
        scriptId: 'hud_btn',
        type: 'ui',
        layerId: 'layer_hud',
        visible: true,
        active: true,
        components: {
          UITransform: { x: 100, y: 100, width: 200, height: 200, pivotX: 0.5, pivotY: 0.5, anchorX: 0, anchorY: 0 }
        }
      };
      game.world.addEntity(hudEntity);

      // Template layer has zIndex: 0 (or default)
      const tLayer = templateSceneData.layersUI[0];
      tLayer.zIndex = 0;

      // 2. Inject template layer into 'layerPause'
      const result = game.sceneSystem.injectLayer('Template_UI', null, true, 'layerPause');
      expect(result.success).toBe(true);

      // 3. Verify 'layerPause' kept its zIndex = 1
      const foundPause = game.world.layersUI.find(l => l.scriptId === 'layerPause');
      expect(foundPause).toBeDefined();
      expect(foundPause.zIndex).toBe(1);

      // 4. Verify layersUI is properly ordered: HUD_Layer (zIndex: 0) before layerPause (zIndex: 1)
      const hudIdx = game.world.layersUI.findIndex(l => l.scriptId === 'HUD_Layer');
      const pauseIdx = game.world.layersUI.findIndex(l => l.scriptId === 'layerPause');
      expect(hudIdx).toBeLessThan(pauseIdx);

      // 5. Verify the injected entity is attached to layerPause
      const modal = game.world.entities.find(e => e.scriptId === 'modal_panel');
      expect(modal).toBeDefined();
      expect(modal.layerId).toBe(foundPause.id);
      expect(foundPause.entities.some(e => e.id === modal.id)).toBe(true);

      // 6. Test PointerRaycast ordering: pointer hovering over the overlapping region (100, 100)
      // Position modal_panel over the same coordinates
      modal.components.UITransform.x = 100;
      modal.components.UITransform.y = 100;
      modal.components.UITransform.width = 200;
      modal.components.UITransform.height = 200;
      modal.components.UITransform.anchorX = 0;
      modal.components.UITransform.anchorY = 0;

      game.input = {
        getPointer: () => ({ x: 100, y: 100 }),
        mouse: { canvas: { width: 1920, height: 1080 } }
      };

      const topEntity = PointerRaycast.getTopEntityUnderPointer(game);
      // Top entity must be an entity from layerPause (modal or its child), NOT the HUD button!
      expect(topEntity.layerId).toBe(foundPause.id);
      expect(topEntity.id).not.toBe(hudEntity.id);
    });
  });
});
