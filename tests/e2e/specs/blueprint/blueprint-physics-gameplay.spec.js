import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Blueprint Physics & Gameplay E2E',
    description: 'E2E runtime logic evaluation for Physics, Colliders, Renderer, Camera, Animator, and Input in engine preview',
  },
});

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

async function setupBareMinimumAnimatorEntity({
  hierarchyCrud,
  inspectorCrud,
  hierarchy,
  page,
  entityName = 'HeroEntity',
  scriptId,
}) {
  const worldLayer = await getReadyWorldLayer(hierarchy);
  const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
  await spriteEntity.click();
  const targetScriptId = scriptId || entityName;
  await inspectorCrud.configureObjectMetaData({ scriptId: targetScriptId });

  await inspectorCrud.configureSpriteAnimator({
    sampleImageName: 'sample_image.png',
  });

  await page.evaluate(({ targetScriptId }) => {
    const app = document.querySelector('#app')?.__vue_app__;
    const pinia = app?.config?.globalProperties?.$pinia;
    if (!pinia) return;

    for (const store of pinia._s.values()) {
      if (store.$id === 'scene') {
        const entity = store.activeEntities?.find((e) => e?.scriptId === targetScriptId)
          || (Array.isArray(store.scenes) ? store.scenes.flatMap(s => s.entities || []).find(e => e?.scriptId === targetScriptId) : null);

        if (entity) {
          if (!entity.components) entity.components = {};
          const animatorData = {
            currentClip: 'clip_walk',
            active: true,
            isPlaying: true,
            clips: [
              {
                id: 'clip_walk',
                type: 'clip',
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
                type: 'clip',
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

          entity.components.SpriteAnimator = animatorData;
          if (typeof store.patchComponent === 'function') {
            store.patchComponent(entity.id, 'SpriteAnimator', animatorData);
          }
          break;
        }
      }
    }
  }, { targetScriptId });

  return spriteEntity;
}

test.describe('Blueprint Physics, Gameplay & Interaction E2E Testing', () => {

  // 1. PHYSICS PROPERTIES & MASS
  test('reads initial physics properties from target entity', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await physEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'PhysEntity_Mass' });
    await inspectorCrud.setupPhysics('Dynamic (Standard)', 3.5, 1.0);

    await blueprintRunner.runTest({
      testName: 'Get Physics - Read Mass',
      entityName: 'PhysEntity_Mass',
      scriptName: 'Script_GetPhysics_Mass',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
        {
          id: 'getPhysics',
          type: 'getPhysics',
          pos: { x: 350, y: 200 },
          dynamicOutputs: ['Mass'],
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'varTarget', sourceHandle: 'value', target: 'getPhysics', targetHandle: 'targetEntity' },
        { source: 'start', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'getPhysics', sourceHandle: 'mass', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 3.5,
    });
  });

  // 2. KINEMATIC MOVE AND SLIDE
  test('applies velocity and executes move and slide flow safely', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const physEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await physEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'FrozenEntity' });
    await inspectorCrud.setupPhysics('Dynamic (Standard)', 1.0, 1.0);

    await blueprintRunner.runTest({
      testName: 'Move and Slide - Frozen Entity Early Return',
      entityName: 'FrozenEntity',
      scriptName: 'Script_MoveSlide_Frozen',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'freezeVal', type: 'boolean', value: true },
        { name: 'vx', type: 'number', value: 300 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varFreeze', type: 'variableGet', pos: { x: 100, y: 300 } },
        { id: 'varVx', type: 'variableGet', pos: { x: 100, y: 400 } },
        {
          id: 'setPhysics',
          type: 'setPhysics',
          pos: { x: 350, y: 100 },
          dynamicInputs: ['Is Frozen'],
        },
        { id: 'moveSlide', type: 'moveAndSlide', pos: { x: 600, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 850, y: 100 },
          inspectorValues: { message: { value: 'Frozen Move Slide Passed', type: 'string' } },
        },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varFreeze', varName: 'freezeVal' },
        { nodeId: 'varVx', varName: 'vx' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'setPhysics', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'targetEntity' },
        { source: 'varFreeze', sourceHandle: 'value', target: 'setPhysics', targetHandle: 'isFrozen' },
        { source: 'setPhysics', sourceHandle: 'execOut', target: 'moveSlide', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'targetEntity' },
        { source: 'varVx', sourceHandle: 'value', target: 'moveSlide', targetHandle: 'velocityX' },
        { source: 'moveSlide', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Frozen Move Slide Passed',
    });
  });

  // 3. COLLIDER & SOLID COLLISION
  test('reads self entity ID and triggers execution out via solid collision', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const testerEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await testerEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'Solid_Tester_ID' });
    await inspectorCrud.setupCollider();

    await blueprintRunner.runTest({
      testName: 'Solid Collision - Read Self ID',
      entityName: 'Solid_Tester_ID',
      scriptName: 'Script_Solid_ReadSelf',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 250 } },
        { id: 'solidNode', type: 'solidCollision', pos: { x: 350, y: 150 } },
        { id: 'notif', type: 'uiNotification', pos: { x: 650, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'solidNode', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'solidNode', targetHandle: 'targetEntity' },
        { source: 'solidNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'solidNode', sourceHandle: 'selfEntity', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'Solid_Tester_ID',
    });
  });

  // 4. RENDERER COMPONENT PROPERTIES
  test('modifies and reads sprite source dimensions', async ({
    blueprintRunner,
    hierarchyCrud,
    inspectorCrud,
    hierarchy,
  }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
    await spriteEntity.click();
    await inspectorCrud.configureObjectMetaData({ scriptId: 'SpriteTester' });

    await blueprintRunner.runTest({
      testName: 'Sprite - Modify and Read Source Width',
      entityName: 'SpriteTester',
      scriptName: 'Script_Sprite_Dimensions',
      variables: [
        { name: 'targetId', type: 'string', value: 'self' },
        { name: 'newWidth', type: 'number', value: 250 },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varWidth', type: 'variableGet', pos: { x: 100, y: 300 } },
        {
          id: 'setSprite',
          type: 'setSprite',
          pos: { x: 350, y: 100 },
          dynamicInputs: ['Source Width'],
        },
        {
          id: 'getSprite',
          type: 'getSprite',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Source Width'],
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varWidth', varName: 'newWidth' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'setSprite', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'setSprite', targetHandle: 'targetEntity' },
        { source: 'varWidth', sourceHandle: 'value', target: 'setSprite', targetHandle: 'sourceWidth' },
        { source: 'setSprite', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'getSprite', targetHandle: 'targetEntity' },
        { source: 'getSprite', sourceHandle: 'sourceWidth', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 250,
    });
  });

  // 5. CAMERA TRACKING & FOLLOW
  test('follows target entity and executes out pin via camera follow node', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Camera Follow - Self Default Target',
      entityName: 'PlayerEntity',
      scriptName: 'Script_CameraFollow_Self',
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'followNode', type: 'actionCameraFollow', pos: { x: 350, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 650, y: 100 },
          inspectorValues: { message: { value: 'Camera Follow Executed', type: 'string' } },
        },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'followNode', targetHandle: 'execIn' },
        { source: 'followNode', sourceHandle: 'execOut', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Camera Follow Executed',
    });
  });

  // 6. ANIMATOR PLAYBACK
  test('resolves animation clip and triggers playback', async ({
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
      scriptId: 'Hero_PlayAnim',
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
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        { id: 'varTarget', type: 'variableGet', pos: { x: 100, y: 200 } },
        { id: 'varClip', type: 'variableGet', pos: { x: 100, y: 300 } },
        { id: 'playAnim', type: 'playAnimation', pos: { x: 350, y: 100 } },
        {
          id: 'getAnim',
          type: 'getAnimator',
          pos: { x: 600, y: 250 },
          dynamicOutputs: ['Current Clip ID'],
        },
        { id: 'notif', type: 'uiNotification', pos: { x: 850, y: 100 } },
      ],
      variableBindings: [
        { nodeId: 'varTarget', varName: 'targetId' },
        { nodeId: 'varClip', varName: 'clipToPlay' },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'playAnim', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'playAnim', targetHandle: 'targetEntity' },
        { source: 'varClip', sourceHandle: 'value', target: 'playAnim', targetHandle: 'clipId' },
        { source: 'playAnim', sourceHandle: 'onStart', target: 'notif', targetHandle: 'execIn' },
        { source: 'varTarget', sourceHandle: 'value', target: 'getAnim', targetHandle: 'targetEntity' },
        { source: 'getAnim', sourceHandle: 'currentClip', target: 'notif', targetHandle: 'message' },
      ],
      expectedLog: 'clip_run',
    });
  });

  // 7. KEYBOARD INPUT EVENTS
  test('evaluates key state with branch condition and notification', async ({ blueprintRunner }) => {
    await blueprintRunner.runTest({
      testName: 'Get Key State Test',
      entityName: 'KeyboardEntity2',
      scriptName: 'GetKeyStateScript',
      nodes: [
        { id: 'tick', type: 'eventTick', pos: { x: 100, y: 100 } },
        {
          id: 'simKey',
          type: 'simulateKey',
          pos: { x: 300, y: 100 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        {
          id: 'getKeyState',
          type: 'getKeyState',
          pos: { x: 300, y: 300 },
          inspectorValues: { key: { value: 'space', type: 'string' } },
        },
        { id: 'branch', type: 'logicBranch', pos: { x: 550, y: 100 } },
        {
          id: 'notif',
          type: 'uiNotification',
          pos: { x: 800, y: 100 },
          inspectorValues: { message: { value: 'Space Key Active', type: 'string' } },
        },
      ],
      connections: [
        { source: 'tick', sourceHandle: 'execOut', target: 'simKey', targetHandle: 'execIn' },
        { source: 'simKey', sourceHandle: 'execOut', target: 'branch', targetHandle: 'execIn' },
        { source: 'getKeyState', sourceHandle: 'isDown', target: 'branch', targetHandle: 'condition' },
        { source: 'branch', sourceHandle: 'onTrue', target: 'notif', targetHandle: 'execIn' },
      ],
      expectedLog: 'Space Key Active',
    });
  });

});
