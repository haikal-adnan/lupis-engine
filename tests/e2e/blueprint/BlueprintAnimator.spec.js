// lokasi: tests/e2e/blueprint/BlueprintAnimator.spec.js
import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Animator E2E',
    description: 'Concise E2E evaluation focusing purely on Animator Blueprint node execution',
  },
});

/**
 * Memastikan World Layer bawaan project sudah siap & visible sebelum manipulasi entity
 */
async function getReadyWorldLayer(hierarchy) {
  await expect(hierarchy.sceneSelect).toBeVisible();

  const worldSection = hierarchy.section('World');
  await worldSection.scrollIntoViewIfNeeded();
  await expect(worldSection).toBeVisible();

  const sectionContent = worldSection
    .locator('[data-element="section-content"]')
    .or(worldSection.getByTestId('hierarchy-section-world-content'));

  if ((await sectionContent.count()) > 0 && !(await sectionContent.isVisible())) {
    await worldSection.getByTestId('hierarchy-section-world-header').click();
  }

  const worldLayer = hierarchy.nodeByName('World Layer');
  await expect(worldLayer).toBeVisible();
  return worldLayer;
}

/**
 * Bare-minimum animator setup:
 * Menyiapkan entity dengan 2 klip dasar ('walk' dan 'run') untuk pengujian blueprint.
 */
async function setupBareMinimumAnimatorEntity({
  hierarchyCrud,
  inspectorCrud,
  hierarchy,
  page,
  entityName = 'HeroEntity',
  scriptId = 'Hero_Entity_ID',
}) {
  const worldLayer = await getReadyWorldLayer(hierarchy);

  const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
  await spriteEntity.click();
  await inspectorCrud.configureObjectMetaData({ name: entityName, scriptId });

  await inspectorCrud.configureSpriteAnimator({
    sampleImageName: 'sample_image.png',
  });

  // Injeksi state klip minimum ke Pinia store
  await page.evaluate(({ name }) => {
    const app = document.querySelector('#app')?.__vue_app__;
    const pinia = app?.config?.globalProperties?.$pinia;
    if (!pinia) return;

    for (const [, store] of pinia._s.entries()) {
      const entities = store.entities || store.currentScene?.entities || store.activeScene?.entities;
      let target = null;
      if (Array.isArray(entities)) {
        target = entities.find((e) => e.name === name || e.scriptId === name);
      } else if (entities && typeof entities === 'object') {
        target = Object.values(entities).find((e) => e?.name === name || e?.scriptId === name);
      }

      if (target) {
        if (!target.components) target.components = {};
        target.components.SpriteAnimator = {
          currentClip: 'clip_walk',
          active: true,
          isPlaying: true,
          clips: [
            {
              id: 'clip_walk',
              scriptId: 'walk',
              name: 'Walk_Clip',
              fps: 12,
              isLooping: true,
              flipX: false,
              frameIndex: 0,
              frames: [{ id: 'f_w_1' }],
            },
            {
              id: 'clip_run',
              scriptId: 'run',
              name: 'Run_Clip',
              fps: 24,
              isLooping: false,
              flipX: false,
              frameIndex: 0,
              frames: [{ id: 'f_r_1' }, { id: 'f_r_2' }],
            },
          ],
        };
        break;
      }
    }
  }, { name: entityName });

  return spriteEntity;
}

test.describe('Blueprint Animator Core Node Tests', () => {

  // =========================================================================
  // 1. PLAY ANIMATION & GET ANIMATOR
  // =========================================================================
  test('Play Animation resolves clip and triggers playback (read via Get Animator)', async ({
    page,
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    await setupBareMinimumAnimatorEntity({
      page,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      entityName: 'Hero_PlayAnim',
      scriptId: 'Hero_Play_01',
    });

    await blueprintRunner.runTest({
      testName: 'Play Animation - Resolves Clip and Fires On Start',
      entityName: 'Hero_PlayAnim',
      scriptName: 'Script_PlayAnim',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'clipToPlay', type: 'string', value: 'run' },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
        { id: 'varClip', type: 'variable_get', pos: { x: 100, y: 300 } },
        { id: 'playAnim', type: 'play_animation', pos: { x: 350, y: 100 } },
        {
          id: 'getAnim',
          type: 'get_animator',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Current Clip ID'],
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varClip', varName: 'clipToPlay' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'playAnim', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'playAnim', targetHandle: 'target' },
        { source: 'varClip', sourceHandle: 'out_0', target: 'playAnim', targetHandle: 'clip_id' },
        { source: 'playAnim', sourceHandle: 'on_start', target: 'notif', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'getAnim', targetHandle: 'target' },
        { source: 'getAnim', sourceHandle: 'currentClip', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 'clip_run',
    });
  });

  // =========================================================================
  // 2. PAUSE ANIMATION
  // =========================================================================
  test('Pause Animation stops playback (verifies isPlaying = false)', async ({
    page,
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    await setupBareMinimumAnimatorEntity({
      page,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      entityName: 'Hero_PauseAnim',
      scriptId: 'Hero_Pause_01',
    });

    await blueprintRunner.runTest({
      testName: 'Pause Animation - Stop Playback State',
      entityName: 'Hero_PauseAnim',
      scriptName: 'Script_PauseAnim',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
        { id: 'pauseAnim', type: 'pause_animation', pos: { x: 350, y: 100 } },
        {
          id: 'getAnim',
          type: 'get_animator',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Is Playing?'],
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'pauseAnim', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'pauseAnim', targetHandle: 'target' },
        { source: 'pauseAnim', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'getAnim', targetHandle: 'target' },
        { source: 'getAnim', sourceHandle: 'isPlaying', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: false,
    });
  });

  // =========================================================================
  // 3. SET ANIMATOR
  // =========================================================================
  test('Set Animator modifies properties dynamically (Current Clip and FlipX)', async ({
    page,
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    await setupBareMinimumAnimatorEntity({
      page,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      entityName: 'Hero_SetAnim',
      scriptId: 'Hero_SetAnim_01',
    });

    await blueprintRunner.runTest({
      testName: 'Set Animator - Update Clip and FlipX',
      entityName: 'Hero_SetAnim',
      scriptName: 'Script_SetAnim',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'targetClip', type: 'string', value: 'run' },
        { name: 'flipXVal', type: 'boolean', value: true },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variable_get', pos: { x: 100, y: 200 } },
        { id: 'varClip', type: 'variable_get', pos: { x: 100, y: 300 } },
        { id: 'varFlip', type: 'variable_get', pos: { x: 100, y: 400 } },
        {
          id: 'setAnim',
          type: 'set_animator',
          pos: { x: 350, y: 100 },
          dynamicInputs: ['Set Current Clip', 'Flip Horizontal'],
        },
        {
          id: 'getAnim',
          type: 'get_animator',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Flip Horizontal'],
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varClip', varName: 'targetClip' },
        { nodeId: 'varFlip', varName: 'flipXVal' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'setAnim', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'setAnim', targetHandle: 'target' },
        { source: 'varClip', sourceHandle: 'out_0', target: 'setAnim', targetHandle: 'currentClip' },
        { source: 'varFlip', sourceHandle: 'out_0', target: 'setAnim', targetHandle: 'flipX' },
        { source: 'setAnim', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'varTarget', sourceHandle: 'out_0', target: 'getAnim', targetHandle: 'target' },
        { source: 'getAnim', sourceHandle: 'flipX', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: true,
    });
  });

  // =========================================================================
  // 4. SET CLIP PROP & GET CLIP PROP
  // =========================================================================
  test('Set Clip Prop modifies clip FPS and verifies via Get Clip Prop', async ({
    page,
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    await setupBareMinimumAnimatorEntity({
      page,
      hierarchyCrud,
      inspectorCrud,
      hierarchy,
      entityName: 'Hero_ClipProps',
      scriptId: 'Hero_ClipProps_01',
    });

    await blueprintRunner.runTest({
      testName: 'Clip Props - Set and Get FPS',
      entityName: 'Hero_ClipProps',
      scriptName: 'Script_ClipProps',
      variables: [
        { name: 'clipWalkId', type: 'string', value: 'walk' },
        { name: 'newFps', type: 'number', value: 48 },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varClip', type: 'variable_get', pos: { x: 100, y: 200 } },
        { id: 'varFps', type: 'variable_get', pos: { x: 100, y: 300 } },
        {
          id: 'setClip',
          type: 'set_clip_prop',
          pos: { x: 350, y: 100 },
          dynamicInputs: ['Set FPS'],
        },
        {
          id: 'getClip',
          type: 'get_clip_prop',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Frame Rate'],
        },
        { id: 'notif', type: 'ui_notification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varClip', varName: 'clipWalkId' },
        { nodeId: 'varFps', varName: 'newFps' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'setClip', targetHandle: 'exec_in' },
        { source: 'varClip', sourceHandle: 'out_0', target: 'setClip', targetHandle: 'clip_id' },
        { source: 'varFps', sourceHandle: 'out_0', target: 'setClip', targetHandle: 'fps' },
        { source: 'setClip', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
        { source: 'varClip', sourceHandle: 'out_0', target: 'getClip', targetHandle: 'clip_id' },
        { source: 'getClip', sourceHandle: 'fps', target: 'notif', targetHandle: 'in_msg' },
      ],
      expectedLog: 48,
    });
  });

  // =========================================================================
  // 5. [BAD PATH] MISSING COMPONENT GUARD
  // =========================================================================
  test('[Bad Path] Safely executes Out pin when entity lacks SpriteAnimator', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = await getReadyWorldLayer(hierarchy);
    const emptyEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await emptyEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'Empty_NoAnim', scriptId: 'Empty_NoAnim_ID' });

    await blueprintRunner.runTest({
      testName: 'Animator Guards - Early Out on Missing Component',
      entityName: 'Empty_NoAnim',
      scriptName: 'Script_Anim_MissingComp',
      variables: [
        { name: 'clipId', type: 'string', value: 'walk' },
      ],
      nodes: [
        { id: 'start', type: 'event_game_start', pos: { x: 100, y: 100 } },
        { id: 'varClip', type: 'variable_get', pos: { x: 100, y: 200 } },
        { id: 'playAnim', type: 'play_animation', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'ui_notification',
          pos: { x: 650, y: 100 },
          inspectorValues: { in_msg: { value: 'Guard Passed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varClip', varName: 'clipId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'out', target: 'playAnim', targetHandle: 'exec_in' },
        { source: 'varClip', sourceHandle: 'out_0', target: 'playAnim', targetHandle: 'clip_id' },
        { source: 'playAnim', sourceHandle: 'exec_out', target: 'notif', targetHandle: 'exec_in' },
      ],
      expectedLog: 'Guard Passed',
    });
  });
});