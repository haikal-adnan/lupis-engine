import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlueprintLifecycle } from '@nodes/library/blueprints/BlueprintLifecycle.js';
import { validateCodePanelContract } from '@nodes/contract/codePanelContract.js';
import Game from '@core/Core/Game.js';
import ContextSystem from '@core/Script/ContextSystem.js';

describe('resetLayer Node & Layer Reset System', () => {
  const resetNode = BlueprintLifecycle.items.find(item => item.type === 'resetLayer');

  describe('Blueprint Definition and Contract Compliance', () => {
    it('defines the resetLayer blueprint with exact specified input/output ports', () => {
      expect(resetNode).toBeDefined();
      expect(resetNode.label).toBe('Reset Layer');

      const inputIds = resetNode.defaultData.inputs.map(p => p.id);
      expect(inputIds).toEqual(['execIn', 'sceneName', 'layerName']);

      const outputIds = resetNode.defaultData.outputs.map(p => p.id);
      expect(outputIds).toEqual(['execOut', 'success']);

      // Verify default values
      const defaultValues = resetNode.defaultData.data.values;
      expect(defaultValues.sceneName).toBe('');
      expect(defaultValues.layerName).toBe('');

      // Enforce no label property exists on ports
      [...resetNode.defaultData.inputs, ...resetNode.defaultData.outputs].forEach(port => {
        expect(port.label).toBeUndefined();
        expect(port.id).toMatch(/^[A-Za-z][A-Za-z0-9]{0,31}$/);
      });
    });

    it('adheres to code syntax, comment stripping, and clean execution standards', () => {
      const code = resetNode.defaultData.data.code;
      expect(code.includes('//')).toBe(false);
      expect(code.includes('/*')).toBe(false);
      expect(code.includes('?.')).toBe(false);
      expect(code.includes('??')).toBe(false);
      expect(code.trim().endsWith('return;')).toBe(true);
    });

    it('passes code panel contract validation without any forbidden null checks or mismatches', () => {
      const nodeInstance = {
        id: 'node_reset_layer_test',
        type: 'resetLayer',
        inputs: resetNode.defaultData.inputs,
        outputs: resetNode.defaultData.outputs,
        data: resetNode.defaultData.data
      };

      const validation = validateCodePanelContract(resetNode.defaultData.data.code, { node: nodeInstance });
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('executes blueprint code and properly delegates to context.scene.resetLayer', () => {
      const mockContext = {
        scene: {
          resetLayer: vi.fn((scene, layer) => true)
        }
      };

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', resetNode.defaultData.data.code);

      const inputs = {
        sceneName: 'Main_Scene',
        layerName: 'HUD_Layer'
      };
      const outputs = {};

      executeCode(inputs, outputs, mockContext, resetNode);

      expect(mockContext.scene.resetLayer).toHaveBeenCalledWith('Main_Scene', 'HUD_Layer');
      expect(outputs.execOut).toBe(true);
      expect(outputs.success).toBe(true);
    });

    it('handles failure when context.scene.resetLayer returns false', () => {
      const mockContext = {
        scene: {
          resetLayer: vi.fn(() => false)
        }
      };

      const executeCode = new Function('inputs', 'outputs', 'context', 'node', resetNode.defaultData.data.code);

      const inputs = {
        sceneName: 'Invalid_Scene',
        layerName: 'Invalid_Layer'
      };
      const outputs = {};

      executeCode(inputs, outputs, mockContext, resetNode);

      expect(outputs.execOut).toBe(true);
      expect(outputs.success).toBe(false);
    });
  });

  describe('SceneSystem.resetLayer Runtime Implementation', () => {
    let game;
    let templateSceneData;

    beforeEach(() => {
      game = new Game();

      templateSceneData = {
        id: 'scene_main',
        scriptId: 'Main_Scene',
        layersWorld: [
          { id: 'layer_world', scriptId: 'World_Layer', visible: true, active: true, opacity: 1, zIndex: 0 }
        ],
        layersUI: [
          { id: 'layer_hud', scriptId: 'HUD_Layer', visible: true, active: true, opacity: 1, zIndex: 10, freezeInput: false }
        ],
        entities: [
          {
            id: 'ent_player',
            scriptId: 'player',
            type: 'entity',
            layerId: 'layer_world',
            components: {
              Transform: { x: 50, y: 100 }
            }
          },
          {
            id: 'ent_score',
            scriptId: 'score_text',
            type: 'ui_entity',
            layerId: 'layer_hud',
            components: {
              UITransform: { x: 10, y: 20, width: 200, height: 50 },
              TextRenderer: { text: 'Score: 0' }
            }
          }
        ]
      };

      game.sceneSystem.setSceneCache([templateSceneData]);
      game.sceneSystem.loadScene('scene_main');
    });

    it('resets mutated layer properties back to initial template values', () => {
      const hudLayer = game.world.layersUI.find(l => l.scriptId === 'HUD_Layer');
      expect(hudLayer).toBeDefined();

      // Mutate layer properties
      hudLayer.visible = false;
      hudLayer.opacity = 0.2;
      hudLayer.freezeInput = true;

      const success = game.sceneSystem.resetLayer('Main_Scene', 'HUD_Layer');
      expect(success).toBe(true);

      const resetLayer = game.world.layersUI.find(l => l.scriptId === 'HUD_Layer');
      expect(resetLayer.visible).toBe(true);
      expect(resetLayer.opacity).toBe(1);
      expect(resetLayer.freezeInput).toBe(false);
    });

    it('resets mutated entity components back to initial values', () => {
      const scoreEnt = game.world.entities.find(e => e.scriptId === 'score_text');
      expect(scoreEnt).toBeDefined();

      // Mutate score entity
      scoreEnt.components.UITransform.x = 999;
      scoreEnt.components.TextRenderer.text = 'Score: 9999';

      const success = game.sceneSystem.resetLayer('Main_Scene', 'HUD_Layer');
      expect(success).toBe(true);

      const restoredScoreEnt = game.world.entities.find(e => e.scriptId === 'score_text');
      expect(restoredScoreEnt).toBeDefined();
      expect(restoredScoreEnt.components.UITransform.x).toBe(10);
      expect(restoredScoreEnt.components.TextRenderer.text).toBe('Score: 0');
    });

    it('removes entities spawned dynamically on the layer during gameplay', () => {
      // Spawn a dynamic entity into HUD_Layer
      const dynamicEnt = {
        id: 'dynamic_popup',
        scriptId: 'popup_win',
        type: 'ui_entity',
        layerId: 'layer_hud',
        components: {
          UITransform: { x: 500, y: 500 }
        }
      };
      game.world.addEntity(dynamicEnt);
      expect(game.world.entities.some(e => e.scriptId === 'popup_win')).toBe(true);

      const success = game.sceneSystem.resetLayer('Main_Scene', 'HUD_Layer');
      expect(success).toBe(true);

      // The dynamically spawned entity must be removed
      expect(game.world.entities.some(e => e.scriptId === 'popup_win')).toBe(false);
      // The template entity must still be present
      expect(game.world.entities.some(e => e.scriptId === 'score_text')).toBe(true);
    });

    it('restores entities from the template that were destroyed during gameplay', () => {
      const scoreEnt = game.world.entities.find(e => e.scriptId === 'score_text');
      game.entitySystem.destroyEntity(scoreEnt);
      expect(game.world.entities.some(e => e.scriptId === 'score_text')).toBe(false);

      const success = game.sceneSystem.resetLayer('Main_Scene', 'HUD_Layer');
      expect(success).toBe(true);

      // Restored from initial template
      expect(game.world.entities.some(e => e.scriptId === 'score_text')).toBe(true);
    });

    it('defaults sceneName to current active scene when sceneName is empty or "self"', () => {
      const scoreEnt = game.world.entities.find(e => e.scriptId === 'score_text');
      scoreEnt.components.UITransform.x = 888;

      // Pass empty string
      const successEmpty = game.sceneSystem.resetLayer('', 'HUD_Layer');
      expect(successEmpty).toBe(true);
      expect(game.world.entities.find(e => e.scriptId === 'score_text').components.UITransform.x).toBe(10);

      // Pass 'self'
      scoreEnt.components.UITransform.x = 777;
      const successSelf = game.sceneSystem.resetLayer('self', 'HUD_Layer');
      expect(successSelf).toBe(true);
      expect(game.world.entities.find(e => e.scriptId === 'score_text').components.UITransform.x).toBe(10);
    });

    it('returns false when scene or layer cannot be found', () => {
      expect(game.sceneSystem.resetLayer('NonExistent_Scene', 'HUD_Layer')).toBe(false);
      expect(game.sceneSystem.resetLayer('Main_Scene', 'NonExistent_Layer')).toBe(false);
      expect(game.sceneSystem.resetLayer('Main_Scene', '')).toBe(false);
    });

    it('works correctly via ContextSystem facades (context.scene and context.layer)', () => {
      const contextSystem = new ContextSystem(game);
      const runner = { owner: game.world.entities.find(e => e.scriptId === 'player') };
      const context = contextSystem.createExecutionContext(runner, {});

      // Mutate player entity on World_Layer
      const playerEnt = game.world.entities.find(e => e.scriptId === 'player');
      playerEnt.components.Transform.x = 1234;

      // Call via context.scene.resetLayer
      const sceneResult = context.scene.resetLayer('Main_Scene', 'World_Layer');
      expect(sceneResult).toBe(true);
      expect(game.world.entities.find(e => e.scriptId === 'player').components.Transform.x).toBe(50);

      // Mutate again and call via context.layer.reset
      playerEnt.components.Transform.x = 4321;
      const layerResult = context.layer.reset('Main_Scene', 'World_Layer');
      expect(layerResult).toBe(true);
      expect(game.world.entities.find(e => e.scriptId === 'player').components.Transform.x).toBe(50);
    });

    it('does not duplicate entities in layer.entities and keeps animation speed at normal 1x', () => {
      const animSceneData = {
        id: 'scene_anim',
        scriptId: 'Anim_Scene',
        layersWorld: [
          { id: 'layer_sprites', scriptId: 'Sprites_Layer', visible: true, active: true }
        ],
        layersUI: [],
        entities: [
          {
            id: 'ent_actor',
            scriptId: 'actor',
            type: 'entity',
            layerId: 'layer_sprites',
            components: {
              SpriteAnimator: {
                active: true,
                isPlaying: true,
                currentClip: 'idle',
                clips: [{
                  id: 'idle',
                  type: 'clip',
                  assetId: 'asset_actor',
                  fps: 10,
                  frameIndex: 0,
                  frames: ['f1', 'f2'],
                  sources: { f1: { x: 0, y: 0, w: 16, h: 16 }, f2: { x: 16, y: 0, w: 16, h: 16 } }
                }]
              }
            }
          }
        ]
      };

      game.sceneSystem.setSceneCache([animSceneData]);
      game.sceneSystem.loadScene('scene_anim');

      const spriteLayer = game.world.layersWorld.find(l => l.scriptId === 'Sprites_Layer');
      expect(spriteLayer.entities.length).toBe(1);

      // Reset the layer
      const success = game.sceneSystem.resetLayer('Anim_Scene', 'Sprites_Layer');
      expect(success).toBe(true);

      // Entity count must remain exactly 1, not duplicated
      expect(spriteLayer.entities.length).toBe(1);

      // Verify animator updates with exact dt (0.05s), not 2x dt (0.10s)
      const actorAfterReset = game.world.entities.find(e => e.scriptId === 'actor');
      expect(actorAfterReset).toBeDefined();

      game.animatorSystem.update(0.05);
      expect(actorAfterReset.components.SpriteAnimator._elapsedTime).toBeCloseTo(0.05, 5);
    });

    it('does NOT inject layer or entities from another scene into the current world when resetting an un-injected layer', () => {
      const sceneAData = {
        id: 'scene_a',
        scriptId: 'Scene_A',
        layersWorld: [{ id: 'l_a', scriptId: 'Layer_A', visible: true, active: true }],
        layersUI: [],
        entities: [{ id: 'ent_a', scriptId: 'hero_a', type: 'entity', layerId: 'l_a' }]
      };

      const sceneBData = {
        id: 'scene_b',
        scriptId: 'Scene_B',
        layersWorld: [{ id: 'l_b', scriptId: 'Layer_B', visible: true, active: true }],
        layersUI: [],
        entities: [{ id: 'ent_b', scriptId: 'enemy_b', type: 'entity', layerId: 'l_b' }]
      };

      game.sceneSystem.setSceneCache([sceneAData, sceneBData]);
      game.sceneSystem.loadScene('scene_a');

      // Ensure we are in Scene_A and only have Layer_A and hero_a
      expect(game.world.layersWorld.length).toBe(1);
      expect(game.world.layersWorld[0].scriptId).toBe('Layer_A');
      expect(game.world.entities.length).toBe(1);
      expect(game.world.entities[0].scriptId).toBe('hero_a');

      // Now call resetLayer on Scene_B's Layer_B while currently running Scene_A
      const success = game.sceneSystem.resetLayer('Scene_B', 'Layer_B');
      expect(success).toBe(true);

      // Verify that Scene_B's layer and entities were NOT injected into Scene_A
      expect(game.world.layersWorld.some(l => l.scriptId === 'Layer_B' || l.id === 'l_b')).toBe(false);
      expect(game.world.entities.some(e => e.scriptId === 'enemy_b' || e.id === 'ent_b')).toBe(false);
      expect(game.world.entities.length).toBe(1);
      expect(game.world.entities[0].scriptId).toBe('hero_a');
    });
  });
});
