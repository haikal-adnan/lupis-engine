import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Variable System E2E',
    description: 'Skenario E2E menyeluruh untuk CRUD, Scope, Expose Panel, Multi-Script Controller, dan Raw JSON Editor',
  },
});

test.describe('Variable System E2E Testing', () => {
  test.beforeEach(async ({ page, hierarchyCrud, inspectorCrud, scriptCrud }) => {
    // 1. Setup Entity Kosong -> Buat Script -> Attach Script Controller
    const worldLayer = hierarchyCrud.hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await entityNode.click();

    await inspectorCrud.inspector.setEntityName('TestPlayer');
    await inspectorCrud.inspector.ensureScriptControllerComponent();

    await scriptCrud.createScript('MainScript');
    await scriptCrud.attachScriptToEntity('MainScript', 'TestPlayer');

    // 2. Buka Visual Script Graph Editor agar Variable Panel aktif
    await entityNode.click();
    const openGraphBtn = inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-open-graph-btn');
    await openGraphBtn.click();

    await expect(page.getByTestId('variable-panel-manage-btn')).toBeVisible();
  });

  // =========================================================================
  // 1. CRUD SEMUA TIPE VARIABLE
  // =========================================================================
  test('melakukan CRUD pada semua tipe data variabel (String, Number, Boolean, List, Map)', async ({ variablePage }) => {
    await variablePage.openManager();

    // 1. String
    await variablePage.createVariable({ name: 'PlayerName', type: 'string' });
    const stringRow = variablePage.itemRowByName('PlayerName');
    const stringInput = stringRow.getByTestId('variable-modal-value-string-input').locator('input');
    await stringInput.fill('Hero123');
    await expect(stringInput).toHaveValue('Hero123');

    // 2. Number
    await variablePage.createVariable({ name: 'MoveSpeed', type: 'number' });
    const numberRow = variablePage.itemRowByName('MoveSpeed');
    const numberInput = numberRow.getByTestId('variable-modal-value-number-input').locator('input');
    await numberInput.fill('150');
    await numberInput.press('Enter');
    await expect(numberInput).toHaveValue('150');

    // 3. Boolean
    await variablePage.createVariable({ name: 'IsAlive', type: 'boolean' });
    const boolRow = variablePage.itemRowByName('IsAlive');
    const boolSelect = boolRow.getByTestId('variable-modal-value-bool-select');
    await boolSelect.click();
    await boolRow.page().getByTestId('select-option').filter({ hasText: 'True' }).click();

    // 4. List
    await variablePage.createVariable({ name: 'InventoryList', type: 'list' });
    const listRow = variablePage.itemRowByName('InventoryList');
    await expect(listRow.getByTestId('variable-modal-configure-collection-btn')).toBeVisible();

    // 5. Map
    await variablePage.createVariable({ name: 'StatMap', type: 'map' });
    const mapRow = variablePage.itemRowByName('StatMap');
    await expect(mapRow.getByTestId('variable-modal-configure-collection-btn')).toBeVisible();

    // Delete Variable
    const rowMenuTrigger = stringRow.getByTestId('variable-modal-row-menu-trigger');
    await rowMenuTrigger.click();
    await variablePage.page.getByTestId('variable-modal-delete-btn').click();

    await expect(variablePage.itemRowByName('PlayerName')).toHaveCount(0);
    await variablePage.closeManager();
  });

  // =========================================================================
  // 2. SEARCH VARIABLE
  // =========================================================================
  test('memfilter variabel secara reaktif menggunakan fitur search', async ({ variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'HealthPoint', type: 'number' });
    await variablePage.createVariable({ name: 'ManaPoint', type: 'number' });
    await variablePage.createVariable({ name: 'AttackPower', type: 'number' });

    await variablePage.searchInput.fill('Point');

    await expect(variablePage.itemRowByName('HealthPoint')).toBeVisible();
    await expect(variablePage.itemRowByName('ManaPoint')).toBeVisible();
    await expect(variablePage.itemRowByName('AttackPower')).toBeHidden();

    await variablePage.searchInput.fill('');
    await expect(variablePage.itemRowByName('AttackPower')).toBeVisible();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 3. VARIABLE GLOBAL / LOCAL
  // =========================================================================
  test('memastikan pemisahan data scope antara Global dan Local Variables', async ({ variablePage }) => {
    await variablePage.openManager();

    // Buat Global Variable
    await variablePage.createVariable({ name: 'GlobalGameScore', type: 'number', scope: 'Global' });

    // Buat Local Variable
    await variablePage.createVariable({ name: 'LocalAmmoCount', type: 'number', scope: 'Local' });

    // Verifikasi pada tab Local
    await variablePage.switchModalScope('Local');
    await expect(variablePage.itemRowByName('LocalAmmoCount')).toBeVisible();
    await expect(variablePage.itemRowByName('GlobalGameScore')).toBeHidden();

    // Verifikasi pada tab Global
    await variablePage.switchModalScope('Global');
    await expect(variablePage.itemRowByName('GlobalGameScore')).toBeVisible();
    await expect(variablePage.itemRowByName('LocalAmmoCount')).toBeHidden();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 4. DUPLICATE VARIABLE
  // =========================================================================
  test('menduplikasi variabel dan menghasilkan postfix nama berurut', async ({ variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'BaseSpeed', type: 'number' });
    const originalRow = variablePage.itemRowByName('BaseSpeed');

    await originalRow.getByTestId('variable-modal-row-menu-trigger').click();
    await variablePage.page.getByTestId('variable-modal-duplicate-btn').click();

    const duplicatedRow = variablePage.itemRowByName('BaseSpeed_copy');
    await expect(duplicatedRow).toBeVisible();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 5. EXPOSE PANEL GLOBAL / LOCAL
  // =========================================================================
  test('menampilkan variabel exposed di Variable Panel utama', async ({ variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'ExposedHealth', type: 'number', isExposed: true, scope: 'Local' });
    await variablePage.createVariable({ name: 'ExposedDifficulty', type: 'string', isExposed: true, scope: 'Global' });

    await variablePage.closeManager();

    // Verifikasi kemunculan pada Variable Panel
    const localExposed = variablePage.panelItemRow('ExposedHealth', 'Local');
    const globalExposed = variablePage.panelItemRow('ExposedDifficulty', 'Global');

    await expect(localExposed).toBeVisible();
    await expect(globalExposed).toBeVisible();
  });

  // =========================================================================
  // 6. KONSISTENSI LOCAL VARIABLE PADA 3 SCRIPT DENGAN SCRIPT CONTROLLER
  // =========================================================================
  test('memastikan nilai local variable konsisten saat berpindah antar 3 script berbeda', async ({ page, scriptCrud, inspectorCrud, variablePage }) => {
    // 1. Pindah tab ke Scene agar bottom panel / ScriptPanelPage siap diakses
    const sceneTab = page.locator('[data-tab-id="scene"]');
    await sceneTab.click();

    // 2. Buat 3 Script dengan nama terpisah
    await scriptCrud.createScript('ScriptA');
    await scriptCrud.createScript('ScriptB');
    await scriptCrud.createScript('ScriptC');

    // Attach ketiga script ke entity TestPlayer
    await scriptCrud.attachScriptToEntity('ScriptA', 'TestPlayer');
    await scriptCrud.attachScriptToEntity('ScriptB', 'TestPlayer');
    await scriptCrud.attachScriptToEntity('ScriptC', 'TestPlayer');

    // Buka kembali Visual Script Graph Editor untuk ScriptA
    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    await inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-open-graph-btn').click();

    // Setup Variable pada Modal untuk ScriptA
    await variablePage.openManager();
    await variablePage.createVariable({ name: 'SpeedA', type: 'number', isExposed: true, scope: 'Local' });
    await variablePage.closeManager();

    // 3. Pindah kembali ke tab Scene agar Inspector menampilkan komponen TestPlayer
    await sceneTab.click();

    // Edit nilai di Inspector ScriptController
    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    const variableRow = inspectorCrud.inspector.scriptControllerSection.locator('[data-testid="script-variable-row"][data-variable-name="SpeedA"]');
    await expect(variableRow).toBeVisible();

    const speedInput = variableRow.getByTestId('script-variable-number').locator('input');
    await speedInput.fill('250');
    await speedInput.press('Enter');

    // Pindah ke ScriptB
    await inspectorCrud.inspector.selectAttachedScript('ScriptB');
    await expect(inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText('ScriptB');

    // Pindah kembali ke ScriptA dan verifikasi nilai tetap 250
    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    await expect(speedInput).toHaveValue('250');
  });

  // =========================================================================
  // 7. RAW JSON EDITOR (UNTUK LIST DAN MAP)
  // =========================================================================
  test('memperbarui struktur kompleks List dan Map menggunakan Raw JSON Editor', async ({ popup, variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'ComplexData', type: 'list' });
    const listRow = variablePage.itemRowByName('ComplexData');

    // Masuk ke level nested
    await listRow.getByTestId('variable-modal-configure-collection-btn').click();

    // Buka Raw JSON Editor
    await variablePage.rawEditorBtn.click();
    await expect(variablePage.rawJsonTextarea).toBeVisible();

    // Edit JSON Payload
    const newJsonPayload = JSON.stringify(['item_1', 'item_2', 'item_3']);
    await variablePage.rawJsonTextarea.fill(newJsonPayload);
    await variablePage.rawJsonApplyBtn.click();

    await popup.expectPopAlert('Success');
    await expect(variablePage.rawJsonTextarea).toBeHidden();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 8. [Bad Path] DUPLICATE MAP KEY WARNING
  // =========================================================================
  test('[Bad Path] menolak pembuat key duplikat pada struktur Map dan menampilkan peringatan', async ({ popup, variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'ConfigMap', type: 'map' });
    const mapRow = variablePage.itemRowByName('ConfigMap');

    // Masuk ke level nested Map
    await mapRow.getByTestId('variable-modal-configure-collection-btn').click();

    // Tambah dua key
    await variablePage.addBtn.click();
    await variablePage.addBtn.click();

    const keyInput1 = variablePage.modal.locator('input[placeholder*="Key"]').locator('nth=0');
    const keyInput2 = variablePage.modal.locator('input[placeholder*="Key"]').locator('nth=1');

    await expect(keyInput1).toBeVisible();
    await keyInput1.focus();
    await keyInput1.fill('duplicate_key');
    await keyInput1.dispatchEvent('input');
    await keyInput1.dispatchEvent('change');
    await keyInput1.press('Enter');
    await keyInput1.blur();

    await expect(keyInput2).toBeVisible();
    await keyInput2.focus();
    await keyInput2.fill('duplicate_key');
    await keyInput2.dispatchEvent('input');
    await keyInput2.dispatchEvent('change');
    await keyInput2.press('Enter');
    await keyInput2.blur();

    // Verifikasi kemunculan notifikasi peringatan duplikat
    await popup.expectPopAlert();
    await variablePage.closeManager();
    await expect(variablePage.modal).toBeHidden();
  });

  // =========================================================================
  // 9. DRAG & DROP VARIABLE GET/SET NODE KE CANVAS & KONEKSI EDGE
  // =========================================================================
  test('melakukan drag and drop node Get dan Set variable ke canvas lalu mengoneksikannya ke node lain', async ({ variablePage, nodeCanvas, nodeCanvasCrud, nodeLibraryCrud }) => {
    // 1. Buat Variable "PlayerHealth" (Number) & expose ke Variable Panel
    await variablePage.openManager();
    await variablePage.createVariable({ name: 'PlayerHealth', type: 'number', isExposed: true, scope: 'Local' });
    await variablePage.closeManager();

    // 2. Drag & Drop Get Variable "PlayerHealth" langsung dari Variable Panel ke canvas
    const getVarNode = await nodeCanvasCrud.dropVariableToCanvas('PlayerHealth', 'get', { x: 200, y: 200 });
    await expect(getVarNode).toBeVisible();

    // 3. Tambahkan Node Math di posisi tengah (posisi x: 440)
    const mathNode = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 440, y: 200 });
    await expect(mathNode).toBeVisible();

    // 4. Drag & Drop Set Variable "PlayerHealth" (posisi x: 680)
    const setVarNode = await nodeCanvasCrud.dropVariableToCanvas('PlayerHealth', 'set', { x: 680, y: 200 });
    await expect(setVarNode).toBeVisible();

    // 5. Hubungkan Output Port Get Variable ke Input Port Math Node
    await nodeCanvasCrud.connectNodes(getVarNode, mathNode);

    // 6. Hubungkan Output Port Math Node ke Input Port Set Variable
    await nodeCanvasCrud.connectNodes(mathNode, setVarNode);

    // Assert: Terdapat 2 koneksi edge di graph canvas
    await expect(nodeCanvas.edges).toHaveCount(2);
  });
});