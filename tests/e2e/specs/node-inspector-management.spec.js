// lokasi: node-inspector-management.spec.js
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
    await expect(nodeInspector.colorIndicator).toHaveAttribute('style', expect.stringContaining('rgb(255, 87, 34)'));
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

    await nodeInspector.renameInputPort('in_0', 'Input Utama');
    await nodeInspector.renameOutputPort('out_0', 'Hasil Penjumlahan');

    await expect(nodeInspector.inputPortRowById('in_0').locator('input').first()).toHaveValue('Input Utama');
    await expect(nodeInspector.outputPortRowById('out_0').locator('input').first()).toHaveValue('Hasil Penjumlahan');

    const portRows = nodeInspector.panel.locator('[data-testid="node-inspector-input-port-row"]');
    const initialInputRows = await portRows.count();
    await nodeInspector.addDynamicInputPort();

    await expect(portRows).toHaveCount(initialInputRows + 1);

    const lastPortRow = portRows.locator('nth=-1');
    await expect(lastPortRow).toHaveAttribute('data-port-id');
    const lastPortId = await lastPortRow.getAttribute('data-port-id');
    await nodeInspector.removeInputPort(lastPortId);

    await expect(portRows).toHaveCount(initialInputRows);
  });

  test('[Bad Path] mencegah penghapusan port permanen/terproteksi', async ({ nodeGraph, nodeInspector }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('ui_notification', 'Notification', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    const protectedRow = nodeInspector.inputPortRowById('exec_in');
    await expect(protectedRow.getByTestId('node-inspector-input-port-remove-btn')).toHaveCount(0);
  });

  // =========================================================================
  // 3. TESTING PARAMETER (TERHUBUNG EDGE / VARIABLE BINDING)
  // =========================================================================
  test('memastikan input parameter ter-disable jika terhubung edge dan dapat menggunakan Variable mode', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'PlayerSpeed', type: 'number', value: 100, scope: 'Local' });

    const nodeAId = await nodeGraph.spawnNodeViaStore('math_add', 'Add', { x: 200, y: 200 });
    const nodeBId = await nodeGraph.spawnNodeViaStore('math_subtract', 'Subtract', { x: 500, y: 200 });

    await nodeGraph.connectPortsViaStore(nodeAId, 'out_0', nodeBId, 'in_0');
    await nodeGraph.selectNodeById(nodeBId);

    const portRowIn0 = nodeInspector.portRowById('in_0');
    const linkedIndicator = portRowIn0.getByTestId('node-inspector-port-linked-badge')
      .or(portRowIn0.locator('[data-testid*="linked"]'))
      .or(portRowIn0.locator('.linked-badge, [data-linked="true"]'))
      .or(portRowIn0.locator('input[disabled], [disabled]'))
      .or(portRowIn0.getByText(/linked|connected|terhubung/i));

    await expect(linkedIndicator.first()).toBeVisible();

    await nodeInspector.togglePortMode('in_1');
    await nodeInspector.bindVariableToPort('in_1', 'PlayerSpeed');

    const varGroup = nodeInspector.portRowById('in_1').getByTestId('node-inspector-port-variable-group');
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

    const thirdRow = paramRows.locator('nth=2');
    await expect(thirdRow).toHaveAttribute('data-port-id');

    const newPortId = await thirdRow.getAttribute('data-port-id');
    await nodeInspector.setPortDirectNumber(newPortId, 25);
  });

  // =========================================================================
  // 5. VARIABLE MODIFIER ADD-ON (MODIFIER PADA VARIABLE INPUT)
  // =========================================================================
  test('dapat mengaplikasikan dan menghapus Modifier Add-on pada Variable Parameter', async ({ variableCrud, nodeGraph, nodeInspector }) => {
    await variableCrud.createVariable({ name: 'BaseDamage', type: 'number', value: 50, scope: 'Local' });

    const nodeId = await nodeGraph.spawnNodeViaStore('math_multiply', 'Multiply', { x: 300, y: 200 });
    await nodeGraph.selectNodeById(nodeId);

    await nodeInspector.togglePortMode('in_0');
    await nodeInspector.bindVariableToPort('in_0', 'BaseDamage');

    await nodeInspector.setPortVariableModifier('in_0', 'Add (+)', 10);

    const varGroup = nodeInspector.portRowById('in_0').getByTestId('node-inspector-port-variable-group');
    const modInput = varGroup.getByTestId('node-inspector-var-group-modifier-number-input').locator('input');
    await expect(modInput).toHaveValue('10');

    await nodeInspector.clearPortVariableModifier('in_0');

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

      await expect(nodeInspector.titleInput).toHaveValue(/Get PlayerHealth/i);
    });

    test('NOTIFICATION: mengedit default input value pada UI & Debug Notification', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('ui_notification', 'Notification', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await nodeInspector.setPortDirectText('in_source', 'SystemAlert');
      await nodeInspector.setPortDirectText('in_msg', 'Quest Completed!');

      await expect(nodeInspector.portRowById('in_source').locator('input, textarea').first()).toHaveValue('SystemAlert');
      await expect(nodeInspector.portRowById('in_msg').locator('input, textarea').first()).toHaveValue('Quest Completed!');
    });

    test('LOGIC: mengonfigurasi boolean logic And/Or dengan dynamic boolean input', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('logic_and', 'And', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await nodeInspector.setPortDirectSelect('in_0', 'True');
      await expect(nodeInspector.portRowById('in_0')).toContainText(/True/i);
    });

    test('LIFECYCLE: menampilkan parameter kosong pada Lifecycle node tanpa editable values', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('event_game_start', 'On Game Start', { x: 300, y: 200 });
      await nodeGraph.selectNodeById(nodeId);

      await expect(nodeInspector.parametersSection).toBeHidden();
    });

    test('OBJECT: dapat menambah dynamic property port dari Property Options dropdown', async ({ nodeGraph, nodeInspector }) => {
      const nodeId = await nodeGraph.spawnNodeViaStore('object_get_info', 'Get Object Info', { x: 300, y: 200 });
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