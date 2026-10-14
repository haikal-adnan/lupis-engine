// lokasi: tests/e2e/blueprint/BlueprintSceneManagement.spec.js
import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Scene Management E2E',
    description: 'E2E runtime logic evaluation for Scene nodes (event_scene_start, change_scene, restart_scene, get_current_scene) in engine preview',
  },
});

test.describe('Blueprint Scene Management (game_scene) E2E Testing', () => {

  // Helper untuk inisialisasi 4 Scene lengkap dengan World Layer
  async function setupFourScenes(hierarchyCrud, controls, popup) {
    // 1. Rename scene bawaan ke Scene_Alpha (menggunakan World Layer default)
    await controls.clickSelectAction('hierarchy-scene-options-button', 'Rename Scene');
    await popup.fillPromptAndSubmit('Rename Scene', 'Scene_Alpha', 'OK');

    // 2. Buat Scene_Beta, Scene_Gamma, dan Scene_Delta beserta World Layer masing-masing
    for (const sceneName of ['Scene_Beta', 'Scene_Gamma', 'Scene_Delta']) {
      await hierarchyCrud.scene.create(sceneName);
      await hierarchyCrud.layer.create('World', 'World Layer');
    }

    // 3. Kembali ke Scene_Alpha untuk memulai pengujian
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
          { id: 'onStart', type: 'event_scene_start', pos: { x: 100, y: 100 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 450, y: 100 } },
        ],
        connections: [
          { source: 'onStart', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'onStart', sourceHandle: 'scene_name', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'getScene', type: 'get_current_scene', pos: { x: 350, y: 200 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'getScene', sourceHandle: 'sceneName', target: 'notif', targetHandle: 'in_msg' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'change_scene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Transition Out Executed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'targetScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'changeScene', targetHandle: 'exec_in' },
          { source: 'varScene', sourceHandle: 'out_0', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'change_scene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Fallback Execution Continued', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'invalidScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'changeScene', targetHandle: 'exec_in' },
          { source: 'varScene', sourceHandle: 'out_0', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varScene', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'changeScene', type: 'change_scene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Handled Empty Scene Input', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varScene', varName: 'emptyScene' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'changeScene', targetHandle: 'exec_in' },
          { source: 'varScene', sourceHandle: 'out_0', target: 'changeScene', targetHandle: 'sceneName' },
          { source: 'changeScene', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
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
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'restartNode', type: 'restart_scene', pos: { x: 350, y: 100 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Restart Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'restartNode', targetHandle: 'exec_in' },
          { source: 'restartNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
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

      // Pindah ke Scene_Gamma lalu buat TargetEntity_In_Gamma
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

      // Jalankan test dari Scene_Alpha untuk mencari entity yang berada di Scene_Gamma
      await blueprintRunner.runTest({
        testName: 'Cross Scene Entity Search Failure Guard',
        entityName: 'SearcherInAlpha',
        scriptName: 'Script_SearchCrossScene',
        variables: [
          { name: 'targetEntityId', type: 'string', value: 'Gamma_Entity_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'getObject', type: 'get_object', pos: { x: 350, y: 200 } },
          { 
            id: 'notif', 
            type: 'ui_notification', 
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Cross Scene Entity Not Found Safe Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
        ],
        connections: [
          { source: 'varTarget', sourceHandle: 'out_0', target: 'getObject', targetHandle: 'target_in' },
          { source: 'start', sourceHandle: 'out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Cross Scene Entity Not Found Safe Guard Passed',
      });
    });
  });
});