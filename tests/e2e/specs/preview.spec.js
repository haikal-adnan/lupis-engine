import { test, expect } from '../fixtures.js';

test.describe('Game Preview & Blueprint Execution E2E Testing', () => {
  test('dapat menjalankan game preview dan mengeksekusi node Notification', async ({
    nodeGraphCrud,
    nodeGraph,
    previewPage,
  }) => {
    const entityName = 'PreviewTestEntity';
    const scriptName = 'PreviewTestScript';

    // 1. Buat Entity, Attach ScriptController, dan Buka Graph Editor
    await nodeGraphCrud.openGraphForEntity({
      entityName,
      scriptName,
    });

    // 2. Spawn node On Game Start dan Notification
    const startNodeId = await nodeGraphCrud.spawnDirect(
      'event_game_start',
      'On Game Start',
      { x: 200, y: 200 }
    );
    const notifNodeId = await nodeGraphCrud.spawnDirect(
      'ui_notification',
      'Notification',
      { x: 500, y: 200 }
    );

    await expect(nodeGraph.nodeById(startNodeId)).toBeVisible();
    await expect(nodeGraph.nodeById(notifNodeId)).toBeVisible();

    // 3. Hubungkan Edge: On Game Start (out) -> Notification (exec_in)
    const edgeId = await nodeGraphCrud.connectDirect(
      startNodeId,
      'out',
      notifNodeId,
      'exec_in'
    );
    await expect(nodeGraph.edgeById(edgeId)).toBeAttached();

    // 4. Inisialisasi pendengar BroadcastChannel
    await previewPage.startLogCapture();

    // 5. Buka Preview Game & tunggu Engine aktif
    const previewPopup = await previewPage.openPreview();
    await previewPage.expectEngineReady(previewPopup);

    // 6. Verifikasi Log "Hello World" dari Notification
    await previewPage.expectLog('Hello World', 'Notification');

    // 7. Bersihkan popup
    await previewPopup.close();
  });
});