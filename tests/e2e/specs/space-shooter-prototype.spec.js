import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import { test, expect } from '../fixtures.js';

const LUPIS_HEADER = [
  0x4C, 0x55, 0x50, 0x49, 0x53, 0x5F, 0x50, 0x52, 0x4F, 0x4A, 0x45, 0x43, 0x54, 0x31, 0x21, 0x00,
];
const XOR_KEY = 0x5A;

async function decodeLupisProjectBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const zipBytes = new Uint8Array(bytes.length - LUPIS_HEADER.length);
  for (let i = 0; i < zipBytes.length; i++) {
    zipBytes[i] = bytes[LUPIS_HEADER.length + i] ^ XOR_KEY;
  }
  const zip = new JSZip();
  return zip.loadAsync(zipBytes);
}

// Disable automatic fixture project isolation so the test builds its own project from scratch
test.use({ isolatedProject: false });

test.describe('Space Shooter Prototype E2E', () => {
  test('creates a vector shape space shooter prototype, evaluates gameplay logic, and exports project archive', async ({
    page,
    controls,
    dashboard,
    hierarchy,
    hierarchyCrud,
    inspector,
    inspectorCrud,
    nodeGraphCrud,
    nodeInspectorCrud,
    variableCrud,
    previewPage,
    popup,
  }, testInfo) => {
    // This comprehensive E2E test creates an entire Space Shooter game using vector shapes,
    // configures visual scripting for player, enemy AI, and bullet projectiles,
    // verifies WebGL engine runtime execution, and exports the archive to tests/prototype/.
    test.slow();

    const projectName = `Space Shooter Prototype ${testInfo.testId}`;
    const projectDesc = 'A complete 2D space shooter built entirely from vector shapes, with player controls, enemy AI, laser projectiles, scoring, and game over state.';

    // =========================================================================
    // 1. PROJECT CREATION WORKFLOW
    // =========================================================================
    await dashboard.goto();
    await controls.clickButton('create-project-btn');

    const modal = dashboard.createModal;
    await expect(modal).toBeVisible();

    await controls.fillInput('project-name-input', projectName, modal);
    await controls.fillInput('project-desc-input', projectDesc, modal);
    await controls.clickButton('submit-create-project-btn', modal);

    await expect(page).toHaveURL(/\/editor\/.+/);
    await expect(page.locator('header').getByText(projectName)).toBeVisible();

    // =========================================================================
    // 2. WORLD ENTITIES & VECTOR SHAPES CREATION
    // =========================================================================
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    // 1. Create Player Starfighter Entity (Vector Shape)
    const playerEntity = await hierarchyCrud.entity.create(worldLayer, 'shape');
    await playerEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'PlayerShip', scriptId: 'PlayerShip_ID', tag: 'Player' });
    await inspectorCrud.setupTransform(0, 220, 0);
    await inspectorCrud.configureShapeRenderer({ outlineWidth: 2, polygonCollision: true });
    await inspectorCrud.setupCollider('Solid (Physics)', true);

    // 2. Create Enemy Invader Entity (Vector Shape)
    const enemyEntity = await hierarchyCrud.entity.create(worldLayer, 'shape');
    await enemyEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'EnemyAlien', scriptId: 'EnemyAlien_ID', tag: 'Enemy' });
    await inspectorCrud.setupTransform(0, -180, 180);
    await inspectorCrud.configureShapeRenderer({ outlineWidth: 2, polygonCollision: true });
    await inspectorCrud.setupCollider('Trigger (Zone)', true);

    // 3. Create Laser Projectile Entity (Vector Shape)
    const bulletEntity = await hierarchyCrud.entity.create(worldLayer, 'shape');
    await bulletEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'LaserBullet', scriptId: 'LaserBullet_ID', tag: 'Bullet' });
    await inspectorCrud.setupTransform(0, 20, 0);
    await inspectorCrud.configureShapeRenderer({ outlineWidth: 1, polygonCollision: true });
    await inspectorCrud.setupCollider('Trigger (Zone)', true);

    // Ensure UI Layer is ready
    const uiLayer = hierarchy.nodeByName('UI Layer');
    await expect(uiLayer).toBeVisible();

    // 4. Create HUD Background (UI Shape)
    const hudBgEntity = await hierarchyCrud.entity.create(uiLayer, 'ui_shape');
    await hudBgEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'ScorePanelBg', scriptId: 'ScorePanelBg_ID' });
    await inspectorCrud.setupUITransform(20, 20, 240, 60);

    // 5. Create HUD Score Text (UI Text)
    const scoreTextEntity = await hierarchyCrud.entity.create(uiLayer, 'ui_text');
    await scoreTextEntity.click();
    await inspectorCrud.configureObjectMetaData({ name: 'ScoreHUD', scriptId: 'ScoreHUD_ID' });
    await inspector.setUIPosition(30, 25);
    await inspectorCrud.configureTextRenderer({ text: 'SCORE: 000', fontSize: 24 });

    // Customize specialized vector geometries (starfighter, alien diamond, laser bolt)
    await page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const sceneStore = pinia?._s?.get('scene');
      if (!sceneStore) return;

      const player = sceneStore.activeEntities?.find((e) => e?.name === 'PlayerShip');
      if (player?.components?.ShapeRenderer) {
        player.components.ShapeRenderer.color = '#00E5FF';
        player.components.ShapeRenderer.outlineColor = '#FFFFFF';
        player.components.ShapeRenderer.outlineWidth = 2;
        player.components.ShapeRenderer.elements = [
          { id: 'p_nose', type: 'point', x: 0, y: -30, size: 6, enabled: true },
          { id: 'p_rwing', type: 'point', x: 25, y: 25, size: 6, enabled: true },
          { id: 'p_core', type: 'point', x: 0, y: 15, size: 6, enabled: true },
          { id: 'p_lwing', type: 'point', x: -25, y: 25, size: 6, enabled: true },
          { id: 'poly_ship', type: 'polygon', points: ['p_nose', 'p_rwing', 'p_core', 'p_lwing'], enabled: true },
        ];
      }

      const enemy = sceneStore.activeEntities?.find((e) => e?.name === 'EnemyAlien');
      if (enemy?.components?.ShapeRenderer) {
        enemy.components.ShapeRenderer.color = '#FF3D00';
        enemy.components.ShapeRenderer.outlineColor = '#FFEA00';
        enemy.components.ShapeRenderer.outlineWidth = 2;
        enemy.components.ShapeRenderer.elements = [
          { id: 'p_top', type: 'point', x: 0, y: -25, size: 6, enabled: true },
          { id: 'p_right', type: 'point', x: 25, y: 0, size: 6, enabled: true },
          { id: 'p_bottom', type: 'point', x: 0, y: 25, size: 6, enabled: true },
          { id: 'p_left', type: 'point', x: -25, y: 0, size: 6, enabled: true },
          { id: 'poly_alien', type: 'polygon', points: ['p_top', 'p_right', 'p_bottom', 'p_left'], enabled: true },
        ];
      }

      const bullet = sceneStore.activeEntities?.find((e) => e?.name === 'LaserBullet');
      if (bullet?.components?.ShapeRenderer) {
        bullet.components.ShapeRenderer.color = '#FFFF00';
        bullet.components.ShapeRenderer.outlineColor = '#FFFFFF';
        bullet.components.ShapeRenderer.outlineWidth = 1;
        bullet.components.ShapeRenderer.elements = [
          { id: 'p_b1', type: 'point', x: -4, y: -15, size: 4, enabled: true },
          { id: 'p_b2', type: 'point', x: 4, y: -15, size: 4, enabled: true },
          { id: 'p_b3', type: 'point', x: 4, y: 15, size: 4, enabled: true },
          { id: 'p_b4', type: 'point', x: -4, y: 15, size: 4, enabled: true },
          { id: 'poly_bullet', type: 'polygon', points: ['p_b1', 'p_b2', 'p_b3', 'p_b4'], enabled: true },
        ];
      }
    });

    // Helper to build visual scripting graphs cleanly for any entity
    const buildGraphForEntity = async ({ entityName, scriptName, variables = [], nodes = [], variableBindings = [], connections = [] }) => {
      await page.getByRole('tab', { name: 'Main Scene', exact: true }).click();
      await nodeGraphCrud.openGraphForEntity({ entityName, scriptName });

      for (const v of variables) {
        await variableCrud.createVariable({
          name: v.name,
          type: v.type,
          value: v.value,
          scope: v.scope || 'Local',
          isExposed: v.isExposed || false,
        });
      }

      const spawned = {};
      for (const n of nodes) {
        const id = await nodeGraphCrud.spawnDirect(n.type, n.label || n.type, n.pos || { x: 100, y: 100 });
        spawned[n.id] = id;

        const hasInspectorConfig = n.dynamicInputs || n.dynamicOutputs || n.inspectorValues;
        if (hasInspectorConfig) {
          await nodeGraphCrud.nodeGraph.selectNodeById(id);
          for (const prop of [].concat(n.dynamicInputs ?? [])) {
            await nodeInspectorCrud.addDynamicInputPort(prop);
          }
          for (const prop of [].concat(n.dynamicOutputs ?? [])) {
            await nodeInspectorCrud.addDynamicOutputPort(prop);
          }
          for (const [portId, cfg] of Object.entries(n.inspectorValues ?? {})) {
            await nodeInspectorCrud.setDirectValue(portId, cfg.value, cfg.type || 'string');
          }
        }
      }

      for (const b of variableBindings) {
        const realId = spawned[b.nodeId] || b.nodeId;
        await nodeGraphCrud.nodeGraph.selectNodeById(realId);
        if (b.portId) {
          await nodeInspectorCrud.bindVariableToPort(b.portId, b.varName);
        } else {
          await nodeInspectorCrud.selectVariableForNode(b.varName);
        }
      }

      for (const conn of connections) {
        const srcId = spawned[conn.source] || conn.source;
        const tgtId = spawned[conn.target] || conn.target;
        await nodeGraphCrud.connectDirect(srcId, conn.sourceHandle, tgtId, conn.targetHandle);
      }

      await nodeGraphCrud.saveGraphState();
    };

    // =========================================================================
    // 3. BLUEPRINT VISUAL SCRIPTING CONFIGURATION
    // =========================================================================

    // A. Player Controller Script (Player controls, health, collision & Game Over flow)
    await buildGraphForEntity({
      entityName: 'PlayerShip',
      scriptName: 'PlayerShipScript',
      variables: [
        { name: 'score', type: 'number', value: 0 },
        { name: 'playerHealth', type: 'number', value: 100 },
        { name: 'isGameOver', type: 'boolean', value: false },
      ],
      nodes: [
        { id: 'start', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'startNotif',
          type: 'uiNotification',
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Space Shooter: Player Ship Ready', type: 'string' } },
        },
        {
          id: 'onKeyFire',
          type: 'eventOnKey',
          pos: { x: 100, y: 300 },
          inspectorValues: { keys: { value: 'space', type: 'string' } },
        },
        {
          id: 'fireNotif',
          type: 'uiNotification',
          pos: { x: 450, y: 300 },
          inspectorValues: { message: { value: 'Player Fired Laser!', type: 'string' } },
        },
        {
          id: 'solidCheck',
          type: 'solidCollision',
          pos: { x: 100, y: 500 },
          inspectorValues: { tag: { value: 'Enemy', type: 'string' } },
        },
        { id: 'gameOverBranch', type: 'logicBranch', pos: { x: 450, y: 500 } },
        {
          id: 'gameOverNotif',
          type: 'uiNotification',
          pos: { x: 750, y: 500 },
          inspectorValues: { message: { value: 'GAME OVER: Player Ship Destroyed!', type: 'string' } },
        },
        { id: 'pauseGame', type: 'actionGamePause', pos: { x: 1050, y: 500 } },
      ],
      connections: [
        { source: 'start', sourceHandle: 'execOut', target: 'startNotif', targetHandle: 'execIn' },
        { source: 'onKeyFire', sourceHandle: 'onSpace', target: 'fireNotif', targetHandle: 'execIn' },
        { source: 'solidCheck', sourceHandle: 'execOut', target: 'gameOverBranch', targetHandle: 'execIn' },
        { source: 'solidCheck', sourceHandle: 'isColliding', target: 'gameOverBranch', targetHandle: 'condition' },
        { source: 'gameOverBranch', sourceHandle: 'onTrue', target: 'gameOverNotif', targetHandle: 'execIn' },
        { source: 'gameOverNotif', sourceHandle: 'execOut', target: 'pauseGame', targetHandle: 'execIn' },
      ],
    });

    // B. Enemy AI Script (Simple Enemy AI movement, hit detection & scoring flow)
    await buildGraphForEntity({
      entityName: 'EnemyAlien',
      scriptName: 'EnemyAIScript',
      variables: [
        { name: 'aiSpeed', type: 'number', value: 120 },
      ],
      nodes: [
        { id: 'enemyStart', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'enemyStartNotif',
          type: 'uiNotification',
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Space Shooter: Enemy Alien Spawning', type: 'string' } },
        },
        { id: 'enemyTick', type: 'eventTick', pos: { x: 100, y: 300 } },
        { id: 'enemyTransform', type: 'getTransform', pos: { x: 350, y: 300 }, dynamicOutputs: ['Position Y'] },
        { id: 'enemyAdd', type: 'mathAdd', pos: { x: 600, y: 300 } },
        { id: 'enemySetTransform', type: 'setTransform', pos: { x: 850, y: 300 }, dynamicInputs: ['Position Y'] },
        {
          id: 'enemyHit',
          type: 'solidCollision',
          pos: { x: 100, y: 500 },
          inspectorValues: { tag: { value: 'Bullet', type: 'string' } },
        },
        { id: 'enemyHitBranch', type: 'logicBranch', pos: { x: 400, y: 500 } },
        { id: 'enemyDestroy', type: 'entityDestroy', pos: { x: 700, y: 500 } },
        {
          id: 'scoreNotif',
          type: 'uiNotification',
          pos: { x: 950, y: 500 },
          inspectorValues: { message: { value: 'Enemy Hit! Score +100', type: 'string' } },
        },
      ],
      connections: [
        { source: 'enemyStart', sourceHandle: 'execOut', target: 'enemyStartNotif', targetHandle: 'execIn' },
        { source: 'enemyTick', sourceHandle: 'execOut', target: 'enemySetTransform', targetHandle: 'execIn' },
        { source: 'enemyTransform', sourceHandle: 'y', target: 'enemyAdd', targetHandle: 'v0' },
        { source: 'enemyAdd', sourceHandle: 'result', target: 'enemySetTransform', targetHandle: 'y' },
        { source: 'enemyHit', sourceHandle: 'execOut', target: 'enemyHitBranch', targetHandle: 'execIn' },
        { source: 'enemyHit', sourceHandle: 'isColliding', target: 'enemyHitBranch', targetHandle: 'condition' },
        { source: 'enemyHitBranch', sourceHandle: 'onTrue', target: 'enemyDestroy', targetHandle: 'execIn' },
        { source: 'enemyDestroy', sourceHandle: 'execOut', target: 'scoreNotif', targetHandle: 'execIn' },
      ],
    });

    // C. Laser Bullet Script (Upward projectile trajectory, trigger zone impact)
    await buildGraphForEntity({
      entityName: 'LaserBullet',
      scriptName: 'LaserBulletScript',
      variables: [
        { name: 'bulletSpeed', type: 'number', value: 350 },
      ],
      nodes: [
        { id: 'bulletStart', type: 'eventGameStart', pos: { x: 100, y: 100 } },
        {
          id: 'bulletStartNotif',
          type: 'uiNotification',
          pos: { x: 450, y: 100 },
          inspectorValues: { message: { value: 'Space Shooter: Laser Armed', type: 'string' } },
        },
        { id: 'bulletTick', type: 'eventTick', pos: { x: 100, y: 300 } },
        { id: 'bulletTransform', type: 'getTransform', pos: { x: 350, y: 300 }, dynamicOutputs: ['Position Y'] },
        { id: 'bulletSub', type: 'mathSubtract', pos: { x: 600, y: 300 } },
        { id: 'bulletSetTransform', type: 'setTransform', pos: { x: 850, y: 300 }, dynamicInputs: ['Position Y'] },
        {
          id: 'bulletTrigger',
          type: 'triggerZone',
          pos: { x: 100, y: 500 },
          inspectorValues: { tag: { value: 'Enemy', type: 'string' } },
        },
        { id: 'bulletHitBranch', type: 'logicBranch', pos: { x: 400, y: 500 } },
        { id: 'bulletDestroy', type: 'entityDestroy', pos: { x: 700, y: 500 } },
        {
          id: 'impactNotif',
          type: 'uiNotification',
          pos: { x: 950, y: 500 },
          inspectorValues: { message: { value: 'Laser Impact on Target!', type: 'string' } },
        },
      ],
      connections: [
        { source: 'bulletStart', sourceHandle: 'execOut', target: 'bulletStartNotif', targetHandle: 'execIn' },
        { source: 'bulletTick', sourceHandle: 'execOut', target: 'bulletSetTransform', targetHandle: 'execIn' },
        { source: 'bulletTransform', sourceHandle: 'y', target: 'bulletSub', targetHandle: 'v0' },
        { source: 'bulletSub', sourceHandle: 'result', target: 'bulletSetTransform', targetHandle: 'y' },
        { source: 'bulletTrigger', sourceHandle: 'execOut', target: 'bulletHitBranch', targetHandle: 'execIn' },
        { source: 'bulletTrigger', sourceHandle: 'isInside', target: 'bulletHitBranch', targetHandle: 'condition' },
        { source: 'bulletHitBranch', sourceHandle: 'onTrue', target: 'bulletDestroy', targetHandle: 'execIn' },
        { source: 'bulletDestroy', sourceHandle: 'execOut', target: 'impactNotif', targetHandle: 'execIn' },
      ],
    });

    // =========================================================================
    // 4. STORAGE SYNCHRONIZATION
    // =========================================================================
    await page.getByRole('tab', { name: 'Main Scene', exact: true }).click();
    await page.evaluate(async () => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const projectStore = pinia?._s?.get('project');
      if (projectStore) {
        await projectStore.saveProjectToServer({ silent: true });
      }
    });

    // =========================================================================
    // 5. RUNTIME WEBGL PREVIEW EVALUATION
    // =========================================================================
    let previewPopup = null;
    try {
      await previewPage.startLogCapture();
      previewPopup = await previewPage.openPreview();
      await previewPage.expectEngineReady(previewPopup);

      // Verify the Space Shooter runtime notifications emitted by the engine
      await previewPage.expectLog('Space Shooter: Player Ship Ready', 'Notification');
      await previewPage.expectLog('Space Shooter: Enemy Alien Spawning', 'Notification');
      await previewPage.expectLog('Space Shooter: Laser Armed', 'Notification');
    } finally {
      if (previewPopup && !previewPopup.isClosed()) {
        await previewPopup.close();
      }
    }

    // =========================================================================
    // 6. EXPORT PROJECT TO tests/prototype/
    // =========================================================================
    await dashboard.goto();
    const card = dashboard.card(projectName);
    await expect(card).toBeVisible();

    const prototypeDir = fileURLToPath(new URL('../../prototype', import.meta.url));
    if (!fs.existsSync(prototypeDir)) {
      fs.mkdirSync(prototypeDir, { recursive: true });
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      popup.selectContextMenu(card, 'Save Project'),
    ]);

    await popup.expectPopAlert('Export Successful');
    const filename = download.suggestedFilename() || 'Space_Shooter_Prototype.lupisproject';
    const targetFile = path.join(prototypeDir, filename);

    await download.saveAs(targetFile);

    // Also copy to standard canonical filename for easy retrieval
    const canonicalFile = path.join(prototypeDir, 'space-shooter.lupisproject');
    fs.copyFileSync(targetFile, canonicalFile);

    // Verify exported archive exists and is non-empty
    expect(fs.existsSync(targetFile)).toBe(true);
    expect(fs.existsSync(canonicalFile)).toBe(true);
    const stats = fs.statSync(targetFile);
    expect(stats.size).toBeGreaterThan(0);

    // Decode and verify package archive integrity
    const fileBuffer = fs.readFileSync(targetFile);
    const zip = await decodeLupisProjectBuffer(fileBuffer);

    const projectJson = JSON.parse(await zip.file('project.json').async('text'));
    expect(projectJson.name).toBe(projectName);

    const scenesJson = JSON.parse(await zip.file('workspaces/scenes.json').async('text'));
    expect(scenesJson.length).toBeGreaterThan(0);

    const scriptsJson = JSON.parse(await zip.file('workspaces/scripts.json').async('text'));
    expect(scriptsJson.length).toBeGreaterThanOrEqual(3);
  });
});
