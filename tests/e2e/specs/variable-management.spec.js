import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Variable System E2E',
    description: 'End-to-end scenarios for CRUD, Scope, Expose Panel, Multi-Script Controller and Raw JSON Editor',
  },
});

test.describe('Variable System E2E Testing', () => {
  test.beforeEach(async ({ page, hierarchyCrud, inspectorCrud, scriptCrud }) => {
    // 1. Set up an empty entity -> create a script -> attach a Script Controller
    const worldLayer = hierarchyCrud.hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchyCrud.entity.create(worldLayer, 'empty');
    await entityNode.click();

    await inspectorCrud.inspector.setEntityName('TestPlayer');
    await inspectorCrud.inspector.ensureScriptControllerComponent();

    await scriptCrud.createScript('MainScript');
    await scriptCrud.attachScriptToEntity('MainScript', 'TestPlayer');

    // 2. Open the Visual Script Graph Editor so the Variable Panel becomes active
    await entityNode.click();
    const openGraphBtn = inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-open-graph-btn');
    await openGraphBtn.click();

    await expect(page.getByTestId('variable-panel-manage-btn')).toBeVisible();
  });

  // =========================================================================
  // 1. CRUD FOR EVERY VARIABLE TYPE
  // =========================================================================
  test('performs CRUD on every variable type (String, Number, Boolean, List, Map)', async ({ variablePage }) => {
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
    await variablePage.setBooleanValue(boolRow, true);

    // 4. List
    await variablePage.createVariable({ name: 'InventoryList', type: 'list' });
    const listRow = variablePage.itemRowByName('InventoryList');
    await expect(listRow.getByTestId('variable-modal-configure-collection-btn')).toBeVisible();

    // 5. Map
    await variablePage.createVariable({ name: 'StatMap', type: 'map' });
    const mapRow = variablePage.itemRowByName('StatMap');
    await expect(mapRow.getByTestId('variable-modal-configure-collection-btn')).toBeVisible();

    // Delete Variable
    await variablePage.openRowMenu('PlayerName');
    await variablePage.page.getByTestId('variable-modal-delete-btn').click();

    await expect(variablePage.itemRowByName('PlayerName')).toHaveCount(0);
    await variablePage.closeManager();
  });

  // =========================================================================
  // 2. SEARCH & DUPLICATE VARIABLE
  // =========================================================================
  test('duplicates variables and filters variables reactively with the search feature', async ({ variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'HealthPoint', type: 'number' });
    await variablePage.createVariable({ name: 'ManaPoint', type: 'number' });

    // Duplicate variable
    const healthRow = variablePage.itemRowByName('HealthPoint');
    await healthRow.getByTestId('variable-modal-row-menu-trigger').click();
    await variablePage.page.getByTestId('variable-modal-duplicate-btn').click();

    const duplicatedRow = variablePage.itemRowByName('HealthPoint_copy');
    await expect(duplicatedRow).toBeVisible();

    // Filter reactively with search
    await variablePage.searchInput.fill('Point_copy');
    await expect(duplicatedRow).toBeVisible();
    await expect(variablePage.itemRowByName('ManaPoint')).toBeHidden();

    await variablePage.searchInput.fill('');
    await expect(variablePage.itemRowByName('ManaPoint')).toBeVisible();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 3. VARIABLE GLOBAL / LOCAL SCOPES & EXPOSED PANEL
  // =========================================================================
  test('keeps Global and Local variable scopes separate and displays exposed variables in panel', async ({ variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'GlobalGameScore', type: 'number', isExposed: true, scope: 'Global' });
    await variablePage.createVariable({ name: 'LocalAmmoCount', type: 'number', isExposed: true, scope: 'Local' });

    // Scope separation inside modal
    await variablePage.switchModalScope('Local');
    await expect(variablePage.itemRowByName('LocalAmmoCount')).toBeVisible();
    await expect(variablePage.itemRowByName('GlobalGameScore')).toBeHidden();

    await variablePage.switchModalScope('Global');
    await expect(variablePage.itemRowByName('GlobalGameScore')).toBeVisible();
    await expect(variablePage.itemRowByName('LocalAmmoCount')).toBeHidden();

    await variablePage.closeManager();

    // Verify exposed variables in the main Variable Panel
    const localExposed = variablePage.panelItemRow('LocalAmmoCount', 'Local');
    const globalExposed = variablePage.panelItemRow('GlobalGameScore', 'Global');
    await expect(localExposed).toBeVisible();
    await expect(globalExposed).toBeVisible();
  });

  // =========================================================================
  // 6. LOCAL VARIABLE CONSISTENCY ACROSS 3 SCRIPTS ON ONE SCRIPT CONTROLLER
  // =========================================================================
  test('keeps local variable values consistent when switching between 3 different scripts', async ({ page, scriptCrud, inspectorCrud, variablePage }) => {
    const sceneTab = page.locator('[data-tab-id="scene"]');
    await sceneTab.click();

    await scriptCrud.createScript('ScriptA');
    await scriptCrud.createScript('ScriptB');
    await scriptCrud.createScript('ScriptC');

    await scriptCrud.attachScriptToEntity('ScriptA', 'TestPlayer');
    await scriptCrud.attachScriptToEntity('ScriptB', 'TestPlayer');
    await scriptCrud.attachScriptToEntity('ScriptC', 'TestPlayer');

    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    await inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-open-graph-btn').click();

    await variablePage.openManager();
    await variablePage.createVariable({ name: 'SpeedA', type: 'number', isExposed: true, scope: 'Local' });
    await variablePage.closeManager();

    await sceneTab.click();

    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    const variableRow = inspectorCrud.inspector.scriptControllerSection.locator('[data-testid="script-variable-row"][data-variable-name="SpeedA"]');
    await expect(variableRow).toBeVisible();

    const speedInput = variableRow.getByTestId('script-variable-number').locator('input');
    await speedInput.fill('250');
    await speedInput.press('Enter');

    await inspectorCrud.inspector.selectAttachedScript('ScriptB');
    await expect(inspectorCrud.inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText('ScriptB');

    await inspectorCrud.inspector.selectAttachedScript('ScriptA');
    await expect(speedInput).toHaveValue('250');
  });

  // =========================================================================
  // 7. RAW JSON EDITOR (FOR LIST AND MAP)
  // =========================================================================
  test('updates complex List and Map structures through the Raw JSON Editor', async ({ popup, variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'ComplexData', type: 'list' });
    const listRow = variablePage.itemRowByName('ComplexData');

    await listRow.getByTestId('variable-modal-configure-collection-btn').click();

    await variablePage.rawEditorBtn.click();
    await expect(variablePage.rawJsonTextarea).toBeVisible();

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
  test('[Bad Path] rejects duplicate keys in a Map and shows a warning', async ({ popup, variablePage }) => {
    await variablePage.openManager();

    await variablePage.createVariable({ name: 'ConfigMap', type: 'map' });
    const mapRow = variablePage.itemRowByName('ConfigMap');

    await mapRow.getByTestId('variable-modal-configure-collection-btn').click();

    await variablePage.addBtn.click();
    await variablePage.addBtn.click();

    await variablePage.fillCollectionMapKey(0, 'duplicate_key');
    await variablePage.fillCollectionMapKey(1, 'duplicate_key');

    await popup.expectPopAlert();
    await variablePage.closeManager();
    await expect(variablePage.modal).toBeHidden();
  });

  // =========================================================================
  // 9. SPAWN & CONNECT VARIABLE GET/SET VIA VARIABLE PANEL & STORE FLOW
  // =========================================================================
  test('drags Get and Set variable nodes onto the canvas and connects them to other nodes', async ({ variablePage, nodeGraph, nodeInspector }) => {
    await variablePage.openManager();
    await variablePage.createVariable({ name: 'PlayerHealth', type: 'number', isExposed: true, scope: 'Local' });
    await variablePage.closeManager();

    const getVarNodeId = await nodeGraph.spawnNodeViaStore('variableGet', 'Get PlayerHealth', { x: 200, y: 200 }, { data: { variableName: 'PlayerHealth' } });
    await expect(nodeGraph.nodeById(getVarNodeId)).toBeVisible();

    await nodeGraph.selectNodeById(getVarNodeId);
    await nodeInspector.selectVariableForNode('PlayerHealth');

    const mathNodeId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Add', { x: 440, y: 200 });
    await expect(nodeGraph.nodeById(mathNodeId)).toBeVisible();

    const setVarNodeId = await nodeGraph.spawnNodeViaStore('variableSet', 'Set PlayerHealth', { x: 680, y: 200 }, { data: { variableName: 'PlayerHealth' } });
    await expect(nodeGraph.nodeById(setVarNodeId)).toBeVisible();

    await nodeGraph.selectNodeById(setVarNodeId);
    await nodeInspector.selectVariableForNode('PlayerHealth');

    await nodeGraph.connectPortsViaStore(getVarNodeId, 'value', mathNodeId, 'v0');
    await nodeGraph.connectPortsViaStore(mathNodeId, 'result', setVarNodeId, 'value');

    await expect(nodeGraph.edges).toHaveCount(2);
  });

  // =========================================================================
  // 10. QUICK ADD VARIABLE TO CANVAS VIA CTRL/ALT + DOUBLE CLICK
  // =========================================================================
  test('spawns Get and Set nodes via Ctrl + Double Click and Alt + Double Click from modal', async ({ page, variablePage }) => {
    await variablePage.openManager();
    await variablePage.createVariable({ name: 'ShieldPower', type: 'number', scope: 'Local' });

    const shieldRow = variablePage.itemRowByName('ShieldPower');
    await expect(shieldRow).toBeVisible();

    // Ctrl + Double Click to spawn Get node
    await shieldRow.dblclick({ modifiers: ['Control'] });
    await expect(variablePage.graphNodeByTitle('Get ShieldPower')).toBeVisible();

    // Alt + Double Click to spawn Set node
    await shieldRow.dblclick({ modifiers: ['Alt'] });
    await expect(variablePage.graphNodeByTitle('Set ShieldPower')).toBeVisible();

    await variablePage.closeManager();
  });

  // =========================================================================
  // 11. QUICK ADD VARIABLE TO GRAPH VIA ROW DROPDOWN MENU
  // =========================================================================
  test('spawns Get and Set nodes via dropdown menu "Add Get to Graph" and "Add Set to Graph"', async ({ page, variablePage }) => {
    await variablePage.openManager();
    await variablePage.createVariable({ name: 'ManaPoints', type: 'number', scope: 'Local' });

    const manaRow = variablePage.itemRowByName('ManaPoints');
    await expect(manaRow).toBeVisible();

    // Click dropdown menu trigger on row
    await manaRow.getByTestId('variable-modal-row-menu-trigger').click();
    await expect(page.getByTestId('variable-modal-add-get-btn')).toBeVisible();
    await expect(page.getByTestId('variable-modal-add-set-btn')).toBeVisible();

    // Click "Add Get to Graph"
    await page.getByTestId('variable-modal-add-get-btn').click();
    await expect(variablePage.graphNodeByTitle('Get ManaPoints')).toBeVisible();

    // Open dropdown again and click "Add Set to Graph"
    await manaRow.getByTestId('variable-modal-row-menu-trigger').click();
    await page.getByTestId('variable-modal-add-set-btn').click();
    await expect(variablePage.graphNodeByTitle('Set ManaPoints')).toBeVisible();

    await variablePage.closeManager();
  });
});