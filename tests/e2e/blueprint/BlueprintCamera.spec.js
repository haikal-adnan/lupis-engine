import { test } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Camera E2E',
    description: 'E2E runtime logic evaluation for Camera nodes (follow, stop_follow, set_transform, query_info) in engine preview',
  },
});

test.describe('Blueprint Camera E2E Testing', () => {

  // =========================================================================
  // 1. ACTION_CAMERA_FOLLOW NODE TESTS
  // =========================================================================
  test.describe('Camera Follow Node (action_camera_follow)', () => {

    test('Follows default self entity and executes exec_out pin', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Camera Follow - Self Default Target',
        entityName: 'PlayerEntity',
        scriptName: 'Script_CameraFollow_Self',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'followNode', type: 'action_camera_follow', pos: { x: 350, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Camera Follow Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'followNode', targetHandle: 'exec_in' },
          { source: 'followNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Camera Follow Executed',
      });
    });

    test('Configures follow with custom target entity, smoothness, and offsets', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // Create target entity
      const targetEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await targetEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'CarEntity', scriptId: 'Car_Entity_ID' });
      await inspectorCrud.setupTransform(200, 300);

      await blueprintRunner.runTest({
        testName: 'Camera Follow - Custom Offset and Target',
        entityName: 'PlayerEntity',
        scriptName: 'Script_CameraFollow_Custom',
        variables: [
          { name: 'targetEntityId', type: 'string', value: 'Car_Entity_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          {
            id: 'followNode',
            type: 'action_camera_follow',
            pos: { x: 400, y: 100 },
            inspectorValues: {
              smooth_speed: { value: 0.2, type: 'number' },
              offset_x: { value: 50, type: 'number' },
              offset_y: { value: -30, type: 'number' },
            },
          },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 700, y: 100 },
            inspectorValues: { in_msg: { value: 'Custom Follow Configured', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'targetEntityId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'followNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'followNode', targetHandle: 'target_entity' },
          { source: 'followNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Custom Follow Configured',
      });
    });

    test('[Bad Path] Handles non-existent target entity safely without crashing', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Camera Follow - Null Target Guard',
        entityName: 'CameraEntity',
        scriptName: 'Script_CameraFollow_NullGuard',
        variables: [
          { name: 'missingTarget', type: 'string', value: 'non_existent_entity_id' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'followNode', type: 'action_camera_follow', pos: { x: 400, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 700, y: 100 },
            inspectorValues: { in_msg: { value: 'Safe Guard Passed', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'missingTarget' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'followNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'followNode', targetHandle: 'target_entity' },
          { source: 'followNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Safe Guard Passed',
      });
    });
  });

  // =========================================================================
  // 2. ACTION_CAMERA_STOP_FOLLOW NODE TESTS
  // =========================================================================
  test.describe('Stop Camera Follow Node (action_camera_stop_follow)', () => {

    test('Stops follow and passes execution through exec_out', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Stop Camera Follow - Basic Execution',
        entityName: 'CameraEntity',
        scriptName: 'Script_StopCameraFollow_Basic',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'stopNode', type: 'action_camera_stop_follow', pos: { x: 350, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Stop Follow Executed', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'stopNode', targetHandle: 'exec_in' },
          { source: 'stopNode', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Stop Follow Executed',
      });
    });
  });

  // =========================================================================
  // 3. ACTION_CAMERA_SET_TRANSFORM NODE TESTS
  // =========================================================================
  test.describe('Set Camera Transform Node (action_camera_set_transform)', () => {

    test('Sets custom position, zoom scale, and smoothness parameters', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Camera Transform - Custom Values',
        entityName: 'CameraEntity',
        scriptName: 'Script_SetTransform_Custom',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          {
            id: 'setTransform',
            type: 'action_camera_set_transform',
            pos: { x: 350, y: 100 },
            inspectorValues: {
              x: { value: 320, type: 'number' },
              y: { value: 180, type: 'number' },
              scale: { value: 2, type: 'number' },
              // Menggunakan 1 digit desimal (10^-1) sesuai limitasi input
              smooth_speed: { value: 0.3, type: 'number' },
            },
          },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 650, y: 100 },
            inspectorValues: { in_msg: { value: 'Transform Updated Successfully', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Transform Updated Successfully',
      });
    });

    test('Verifies set transform updates read back accurately through query_camera_info', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Set Transform - Verified via Info Query',
        entityName: 'CameraEntity',
        scriptName: 'Script_SetTransform_QueryMatch',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          {
            id: 'setTransform',
            type: 'action_camera_set_transform',
            pos: { x: 350, y: 100 },
            inspectorValues: {
              x: { value: 120, type: 'number' },
              y: { value: 80, type: 'number' },
              scale: { value: 1.5, type: 'number' },
            },
          },
          { id: 'queryInfo', type: 'query_camera_info', pos: { x: 350, y: 250 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 650, y: 100 } },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'setTransform', targetHandle: 'exec_in' },
          { source: 'setTransform', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
          { source: 'queryInfo', sourceHandle: 'scale', target: 'notif', targetHandle: 'in_msg' },
        ],
        // expectedLog diset bertipe number 1.5 agar cocok dengan tipe payload output queryInfo
        expectedLog: 1.5,
      });
    });
  });

  // =========================================================================
  // 4. QUERY_CAMERA_INFO NODE TESTS
  // =========================================================================
  test.describe('Get Camera Info Node (query_camera_info)', () => {

    test('Returns default values and has_target = false when camera is unattached', async ({ blueprintRunner }) => {
      await blueprintRunner.runTest({
        testName: 'Get Camera Info - Initial Empty Target State',
        entityName: 'CameraEntity',
        scriptName: 'Script_GetCameraInfo_Empty',
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'queryInfo', type: 'query_camera_info', pos: { x: 350, y: 200 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 850, y: 100 },
            inspectorValues: { in_msg: { value: 'No Target Attached', type: 'string' } },
          },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'queryInfo', sourceHandle: 'has_target', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'No Target Attached',
      });
    });

    test('Retrieves target_script_id and has_target = true when follow is active', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // Create target entity
      const bossEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await bossEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'BossEntity', scriptId: 'Boss_Script_ID' });
      await inspectorCrud.setupTransform(500, 500);

      await blueprintRunner.runTest({
        testName: 'Get Camera Info - Active Follow Target',
        entityName: 'PlayerEntity',
        scriptName: 'Script_GetCameraInfo_ActiveTarget',
        variables: [
          { name: 'bossId', type: 'string', value: 'Boss_Script_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 250 } },
          { id: 'followNode', type: 'action_camera_follow', pos: { x: 350, y: 100 } },
          { id: 'queryInfo', type: 'query_camera_info', pos: { x: 350, y: 250 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 600, y: 100 } },
          { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'bossId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'followNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'followNode', targetHandle: 'target_entity' },
          { source: 'followNode', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'queryInfo', sourceHandle: 'has_target', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_0', target: 'notif', targetHandle: 'exec_in' },
          { source: 'queryInfo', sourceHandle: 'target_script_id', target: 'notif', targetHandle: 'in_msg' },
        ],
        expectedLog: 'Boss_Script_ID',
      });
    });

    test('Verifies target is cleared and has_target returns false after stop follow', async ({
      blueprintRunner,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
    }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      const droneEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
      await droneEntity.click();
      await inspectorCrud.configureObjectMetaData({ name: 'DroneEntity', scriptId: 'Drone_ID' });

      await blueprintRunner.runTest({
        testName: 'Get Camera Info - Reset After Stop Follow',
        entityName: 'PlayerEntity',
        scriptName: 'Script_GetCameraInfo_Stopped',
        variables: [
          { name: 'droneId', type: 'string', value: 'Drone_ID' },
        ],
        nodes: [
          { id: 'start', type: 'event_game_start', pos: { x: 50, y: 100 } },
          { id: 'varTarget', type: 'variable_get', pos: { x: 50, y: 250 } },
          { id: 'followNode', type: 'action_camera_follow', pos: { x: 250, y: 100 } },
          { id: 'stopNode', type: 'action_camera_stop_follow', pos: { x: 450, y: 100 } },
          { id: 'queryInfo', type: 'query_camera_info', pos: { x: 450, y: 250 } },
          { id: 'branch', type: 'logic_branch', pos: { x: 680, y: 100 } },
          {
            id: 'notif',
            type: 'ui_notification',
            pos: { x: 920, y: 100 },
            inspectorValues: { in_msg: { value: 'Target Cleared Successfully', type: 'string' } },
          },
        ],
        variableBindings: [
          { nodeId: 'varTarget', varName: 'droneId' },
        ],
        connections: [
          { source: 'start', sourceHandle: 'out', target: 'followNode', targetHandle: 'exec_in' },
          { source: 'varTarget', sourceHandle: 'out_0', target: 'followNode', targetHandle: 'target_entity' },
          { source: 'followNode', sourceHandle: 'exec_out', target: 'stopNode', targetHandle: 'exec_in' },
          { source: 'stopNode', sourceHandle: 'exec_out', target: 'branch', targetHandle: 'exec_in' },
          { source: 'queryInfo', sourceHandle: 'has_target', target: 'branch', targetHandle: 'cond_0' },
          { source: 'branch', sourceHandle: 'out_false', target: 'notif', targetHandle: 'exec_in' },
        ],
        expectedLog: 'Target Cleared Successfully',
      });
    });
  });
});