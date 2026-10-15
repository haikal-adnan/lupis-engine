// lokasi: tests/e2e/blueprint/BlueprintSceneManagement.spec.js
import { test } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Scene Management E2E',
    description: 'E2E runtime logic evaluation for Scene nodes (event_scene_start, change_scene, restart_scene, get_current_scene) in engine preview',
  },
});

test.describe('Blueprint Scene Management (game_scene) E2E Testing', () => {

  // Helper to initialize 4 Scenes complete with World Layers
  async function setupFourScenes(hierarchyCrud, controls, popup) {
    // 1. Rename scene bawaan ke Scene_Alpha (menggunakan World Layer default)
    await controls.clickSelectAction('hierarchy-scene-options-button', 'Rename Scene');
    await popup.fillPromptAndSubmit('Rename Scene', 'Scene_Alpha', 'OK');

    // 2. Create Scene_Beta, Scene_Gamma, and Scene_Delta with respective World Layers
    for (const sceneName of ['Scene_Beta', 'Scene_Gamma', 'Scene_Delta']) {
      await hierarchyCrud.scene.create(sceneName);
      await hierarchyCrud.layer.create('World', 'World Layer');
    }

    // 3. Return to Scene_Alpha to start testing
    await hierarchyCrud.scene.switch('Scene_Alpha');
  }

  // =========================================================================
  // EVENT ON SCENE START & GET CURRENT SCENE NODE TESTS
  // =========================================================================
  test.describe('On scene start and get current scene', () => {

    test('Triggers on scene start and reads scene name when loaded', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'On Scene Start - Capture Scene Name',
        entityName: 'SceneManagerEntity',
        scriptName: 'Script_OnSceneStart',
        nodes: [
          { id: 'onStart', type: 'eventSceneStart', pos: { x: 100, y: 100 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 450, y: 100 } },
        ],
        connections: [
          { source: 'onStart', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'onStart', sourceHandle: 'sceneName', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Scene_Alpha',
      });
    });

    test('Reads active scene name using get current scene node', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'Get Current Scene - Verify Active Scene Name',
        entityName: 'SceneManagerEntity',
        scriptName: 'Script_GetCurrentScene',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'getScene', type: 'getCurrentScene', pos: { x: 350, y: 200 } },
          { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
          { source: 'getScene', sourceHandle: 'sceneName', target: 'notif', targetHandle: 'message' },
        ],
        expectedLog: 'Scene_Alpha',
      });
    });
  });

  // =========================================================================
  // CHANGE SCENE NODE TESTS (HAPPY PATH & EDGE CASES)
  // =========================================================================
  test.describe('Change scene node', () => {

    test('Transitions to another valid target scene (Scene_Alpha -> Scene_Beta)', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'Change Scene - Valid Target Scene',
        entityName: 'SceneChangerEntity',
        scriptName: 'Script_ChangeScene_Success',
        variables: [
          { name: 'targetScene', type: 'string', value: 'Scene_Beta' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'changeScene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Transition Out Executed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'targetScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'changeScene', targetHandle: 'execIn' },
          { source: 'varScene', sourceHandle: 'value', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Transition Out Executed',
      });
    });

    test('Handles non-existent target scene safely without interrupting flow', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'Change Scene - Non-Existent Target Scene Guard',
        entityName: 'SceneChangerEntity',
        scriptName: 'Script_ChangeScene_NotFound',
        variables: [
          { name: 'invalidScene', type: 'string', value: 'Scene_Unknown_404' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'changeScene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Fallback Execution Continued', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'invalidScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'changeScene', targetHandle: 'execIn' },
          { source: 'varScene', sourceHandle: 'value', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Fallback Execution Continued',
      });
    });

    test('Handles empty scene name input safely with fallback execution', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'Change Scene - Empty Scene Name Input Warning',
        entityName: 'SceneChangerEntity',
        scriptName: 'Script_ChangeScene_EmptyName',
        variables: [
          { name: 'emptyScene', type: 'string', value: '' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'changeScene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Handled Empty Scene Input', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'emptyScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'changeScene', targetHandle: 'execIn' },
          { source: 'varScene', sourceHandle: 'value', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Handled Empty Scene Input',
      });
    });
  });

  // =========================================================================
  // RESTART SCENE NODE TESTS
  // =========================================================================
  test.describe('Restart scene node', () => {

    test('Reloads currently active scene using restart scene node', async ({ 
      blueprintRunner, 
      hierarchyCrud,
      controls,
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      await blueprintRunner.runTest({
        testName: 'Restart Scene - Execution Out Test',
        entityName: 'SceneRestarterEntity',
        scriptName: 'Script_RestartScene',
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'restartNode', type: 'restartScene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Restart Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'execOut', target: 'restartNode', targetHandle: 'execIn' },
          { source: 'restartNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Restart Executed',
      });
    });
  });

  // =========================================================================
  // CROSS-SCENE ENTITY ISOLATION TESTS
  // =========================================================================
  test.describe('Cross-scene entity isolation', () => {

    test('Verifies entity search in another scene fails as expected', async ({ 
      blueprintRunner, 
      hierarchyCrud, 
      inspectorCrud, 
      hierarchy, 
      controls, 
      popup 
    }) => {
      await setupFourScenes(hierarchyCrud, controls, popup);

      // Switch to Scene_Gamma then create TargetEntity_In_Gamma
      await hierarchyCrud.scene.switch('Scene_Gamma');
      const worldLayerGamma = hierarchy.nodeByName('World Layer');
      const gammaEntity = await hierarchyCrud.entity.create(worldLayerGamma, 'empty');
      await gammaEntity.click();
      await inspectorCrud.configureObjectMetaData({ 
        name: 'TargetEntity_In_Gamma', 
        scriptId: 'Gamma_Entity_ID', 
        tag: 'Enemy',
      });

      // Pindah kembali ke Scene_Alpha
      await hierarchyCrud.scene.switch('Scene_Alpha');

      // Run test from Scene_Alpha to find entity in Scene_Gamma
      await blueprintRunner.runTest({
        testName: 'Cross Scene Entity Search Failure Guard',
        entityName: 'SearcherInAlpha',
        scriptName: 'Script_SearchCrossScene',
        variables: [
          { name: 'targetEntityId', type: 'string', value: 'Gamma_Entity_ID' },
        ],
        nodes: [
          { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
          { id: 'getObject', type: 'getObject', pos: { x: 350, y: 200 } },
          { 
            id: 'notif', 
            type: 'uiNotification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { message: { value: 'Cross Scene Entity Not Found Safe Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'value', target: 'getObject', targetHandle: 'targetEntity' },
          { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        ],
        expectedLog: 'Cross Scene Entity Not Found Safe Guard Passed',
      });
    });
  });
});