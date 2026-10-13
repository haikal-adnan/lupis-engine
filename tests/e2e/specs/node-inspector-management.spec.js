// lokasi: tests/e2e/specs/node-inspector-management.spec.js
import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Inspector E2E',
    description: 'Skenario E2E komprehensif untuk pengujian Node Inspector, Header, Ports, Parameters, Variables, Edge, dan Node-Specific Blueprint via Store Flow',
  },
});

test.describe('Node Inspector Panel E2E Testing Suite', () => {
  test.beforeEach(async ({ nodeGraphCrud }) => {
    await nodeGraphCrud.openGraphForEntity({
      entityName: 'InspectorTestEntity',
      scriptName: 'InspectorTestScript',
    });
  });

  // =========================================================================
  // 1. UPDATE DATA TITLE, COLOR, & DESCRIPTION (NODE HEADER)
  // =========================================================================
  test('dapat memperbarui Header Title, Color, dan Description pada node', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    await nodeInspector.setHeaderTitle('Custom Math Addition');
    await nodeInspector.setHeaderColor('#FF5722');
    await nodeInspector.setHeaderDescription('Mencatat penjumlahan dengan custom header');

    await expect(nodeInspector.titleInput).toHaveValue('Custom Math Addition');
    await expect(nodeInspector.descriptionTextarea).toHaveValue('Mencatat penjumlahan dengan custom header');
    await expect(nodeInspector.colorIndicator).toHaveAttribute('style', /rgb\(255,\s*87,\s*34\)|#ff5722/i);
  });

  test('dapat menghapus node terpilih melalui menu dropdown di Header Inspector', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('event_tick', 'On Tick', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    await nodeInspector.deleteSelectedNode();

    await expect(nodeGraph.nodesByType('event_tick')).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 2. RENAME PORTS DAN CRUD PORTS (DYNAMIC PORTS ON)
  // =========================================================================
  test('dapat merename input & output ports serta melakukan CRUD pada dynamic ports', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const firstInputRow = nodeInspector.portsSection.locator('[data-testid="node-inspector-input-port-row"]').first();
    await expect(firstInputRow).toBeVisible();
    const firstInputId = await firstInputRow.getAttribute('data-port-id');

    const firstOutputRow = nodeInspector.portsSection.locator('[data-testid="node-inspector-output-port-row"]').first();
    await expect(firstOutputRow).toBeVisible();
    const firstOutputId = await firstOutputRow.getAttribute('data-port-id');

    await nodeInspector.renameInputPort(firstInputId, 'Input Utama');
    await nodeInspector.renameOutputPort(firstOutputId, 'Hasil Penjumlahan');

    await expect(nodeInspector.inputPortRowById(firstInputId).getByTestId('node-inspector-input-port-label-input')).toHaveValue('Input Utama');
    await expect(nodeInspector.outputPortRowById(firstOutputId).getByTestId('node-inspector-output-port-label-input')).toHaveValue('Hasil Penjumlahan');

    const portRows = nodeInspector.portsSection.locator('[data-testid="node-inspector-input-port-row"]');
    const initialInputRows = await portRows.count();

    await nodeInspector.addDynamicInputPort();
    await expect(portRows).toHaveCount(initialInputRows + 1);

    const lastPortRow = portRows.last();
    await expect(lastPortRow).toBeVisible();
    const lastPortId = await lastPortRow.getAttribute('data-port-id');

    await nodeInspector.removeInputPort(lastPortId);
    await expect(portRows).toHaveCount(initialInputRows);
  });

  test('[Bad Path] mencegah penghapusan port permanen atau terproteksi', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('ui_notification', 'Notification', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const protectedRow = nodeInspector.inputPortRowById('exec_in');
    await expect(protectedRow).toBeVisible();
    await expect(protectedRow.getByTestId('node-inspector-input-port-remove-btn')).toHaveCount(0);
  });

  // =========================================================================
  // 3. TESTING PARAMETER (TERHUBUNG EDGE / VARIABLE BINDING)
  // =========================================================================
  test('memastikan input parameter ter-disable jika terhubung edge dan dapat menggunakan Variable mode', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'PlayerSpeed', type: 'number', value: 100, scope: 'Local' });

    const nodeAId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 200, y: 200 });
    const nodeBId = await nodeGraph.spawnNodeViaStore('math_subtract', 'Subtract', { x: 500, y: 200 });

    await nodeGraph.selectNodeById(nodeBId);
    const paramRows = nodeInspector.panel.locator('[data-testid="node-inspector-port-row"]');
    await expect(paramRows.first()).toBeVisible();

    const targetPortId = await paramRows.first().getAttribute('data-port-id');
    const unboundPortId = await paramRows.nth(1).getAttribute('data-port-id');

    await nodeGraph.connectPortsViaStore(nodeAId, 'out_0', nodeBId, targetPortId);
    await nodeGraph.selectNodeById(nodeBId);

    const targetPortRow = nodeInspector.portRowById(targetPortId);
    await expect(targetPortRow.getByTestId('node-inspector-port-linked-badge')).toBeVisible();

    await nodeInspector.togglePortMode(unboundPortId);
    await nodeInspector.bindVariableToPort(unboundPortId, 'PlayerSpeed');

    const varGroup = nodeInspector.portRowById(unboundPortId).getByTestId('node-inspector-port-variable-group');
    await expect(varGroup).toBeVisible();
  });

  // =========================================================================
  // 4. PARAMETER UNIK & GENERATE INPUT UNTUK MATH ADD DYNAMIC PORTS
  // =========================================================================
  test('memastikan parameter unik Math Add melakukan sync otomatis saat dynamic port ditambahkan', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const paramRows = nodeInspector.panel.locator('[data-testid="node-inspector-port-row"]');
    const initialCount = await paramRows.count();

    await nodeInspector.addDynamicInputPort();
    await nodeInspector.addDynamicInputPort();

    await expect(paramRows).toHaveCount(initialCount + 2);

    const newRow = paramRows.last();
    await expect(newRow).toBeVisible();
    const newPortId = await newRow.getAttribute('data-port-id');

    await nodeInspector.setPortDirectNumber(newPortId, 25);
    await expect(nodeInspector.portRowById(newPortId).getByTestId('node-inspector-port-number-input').locator('input')).toHaveValue('25');
  });

  // =========================================================================
  // 5. VARIABLE MODIFIER ADD-ON (MODIFIER PADA VARIABLE INPUT)
  // =========================================================================
  test('dapat mengaplikasikan dan menghapus Modifier Add-on pada Variable Parameter', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'BaseDamage', type: 'number', value: 50, scope: 'Local' });

    const nodeId = await nodeGraph.spawnNodeViaStore('math_multiply', 'Multiply', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const firstParamRow = nodeInspector.panel.locator('[data-testid="node-inspector-port-row"]').first();
    await expect(firstParamRow).toBeVisible();
    const targetPortId = await firstParamRow.getAttribute('data-port-id');

    await nodeInspector.togglePortMode(targetPortId);
    await nodeInspector.bindVariableToPort(targetPortId, 'BaseDamage');

    await nodeInspector.setPortVariableModifier(targetPortId, 'Add (+)', 10);

    const varGroup = nodeInspector.portRowById(targetPortId).getByTestId('node-inspector-port-variable-group');
    const modInput = varGroup.getByTestId('node-inspector-var-group-modifier-number-input').locator('input');
    await expect(modInput).toHaveValue('10');

    await nodeInspector.clearPortVariableModifier(targetPortId);

    await expect(varGroup.getByTestId('node-inspector-var-group-modifier-number-input')).toHaveCount(0);
  });

  // =========================================================================
  // 6. INSPECTOR BERUBAH SAAT EDGE TERPILIH (NODE EDGE INSPECTOR)
  // =========================================================================
  test('mengubah tampilan Inspector ke Edge View saat edge diklik dan mengedit Modifier Edge', async ({ nodeGraph, nodeInspector }) => {
    const nodeAId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 200, y: 200 });
    const nodeBId = await nodeGraph.spawnNodeViaStore('math_divide', 'Divide', { x: 500, y: 200 });

    const edgeId = await nodeGraph.connectPortsViaStore(nodeAId, 'out_0', nodeBId, 'in_0');

    await nodeGraph.selectEdgeById(edgeId);

    await expect(nodeInspector.edgeContent).toBeVisible();

    await nodeInspector.setEdgeOperation('Multiply (x)');
    await nodeInspector.setEdgeOperandNumber(2);

    await expect(nodeInspector.edgeSection.getByTestId('node-inspector-edge-operand-number-input').locator('input')).toHaveValue('2');

    await nodeInspector.deleteSelectedEdge();

    await expect(nodeGraph.edges).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 7. PENGUJIAN KHUSUS SPESIFIK BLUEPRINT NODE
  // =========================================================================
  test.describe('Node-Specific Blueprint Inspector Tests', () => {
    test('VARIABLE: mengkonfigurasi Get dan Set Variable node', async ({ variableCrud, nodeGraph, nodeInspector }) => {
      await variableCrud.createVariable({ name: 'PlayerHealth', type: 'number', value: 100, isExposed: true, scope: 'Local' });

      const nodeId = await nodeGraph.spawnNodeViaStore('variable_get', 'Get Variable', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await nodeInspector.selectVariableForNode('PlayerHealth');

      await expect(nodeInspector.titleInput).toHaveValue('Get PlayerHealth');
    });

    test('NOTIFICATION: mengedit default input value pada UI & Debug Notification', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('ui_notification', 'Notification', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      const portRows = nodeInspector.panel.locator('[data-testid="node-inspector-port-row"]');
      await expect(portRows.first()).toBeVisible();

      const sourcePortId = await portRows.first().getAttribute('data-port-id');
      const msgPortId = await portRows.nth(1).getAttribute('data-port-id');

      await nodeInspector.setPortDirectText(sourcePortId, 'SystemAlert');
      await nodeInspector.setPortDirectText(msgPortId, 'Quest Completed!');

      await expect(nodeInspector.portRowById(sourcePortId).locator('input, textarea').first()).toHaveValue('SystemAlert');
      await expect(nodeInspector.portRowById(msgPortId).locator('input, textarea').first()).toHaveValue('Quest Completed!');
    });

    test('LOGIC: mengonfigurasi boolean logic And/Or dengan dynamic boolean input', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('logic_and', 'And', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      const firstPortRow = nodeInspector.panel.locator('[data-testid="node-inspector-port-row"]').first();
      await expect(firstPortRow).toBeVisible();
      const portId = await firstPortRow.getAttribute('data-port-id');

      await nodeInspector.setPortDirectSelect(portId, 'True');
      await expect(nodeInspector.portRowById(portId)).toContainText('True');
    });

    test('LIFECYCLE: menampilkan parameter kosong pada Lifecycle node tanpa editable values', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('event_game_start', 'On Game Start', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await expect(nodeInspector.parametersSection).toBeHidden();
    });

    test('OBJECT: dapat menambah dynamic property port dari Property Options dropdown', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('get_object', 'Get Object Info', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await nodeInspector.addDynamicOutputPort('Active');

      await expect(
        nodeInspector.outputPortRowById('active').or(nodeInspector.outputPortRowById('Active'))
      ).toBeVisible();
    });
  });

  // =========================================================================
  // 8. INSPECTOR SELECTION STATES (MULTI-SELECTION & EMPTY STATE)
  // =========================================================================
  test('menampilkan state multi-selection ketika lebih dari 1 node dipilih', async ({ nodeGraph, nodeInspector }) => {
    const node1Id = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 200, y: 200 });
    const node2Id = await nodeGraph.spawnNodeViaStore('math_subtract', 'Subtract', { x: 500, y: 200 });

    await nodeGraph._evaluateStore((store, [id1, id2]) => {
      store.setSelectedNodes([id1, id2]);
    }, [node1Id, node2Id]);

    await expect(nodeInspector.multiSelectedState).toBeVisible();
    await expect(nodeInspector.multiSelectedCount).toContainText('2 Nodes Selected');
  });
});