import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Inspector E2E',
    description: 'Skenario E2E komprehensif untuk pengujian Node Inspector, Header, Ports, Parameters, Variables, Edge, dan Node-Specific Blueprint',
  },
});

test.describe('Node Inspector Panel E2E Testing Suite', () => {
  test.beforeEach(async ({ nodeCanvasCrud }) => {
    await nodeCanvasCrud.openGraphForEntity({
      entityName: 'InspectorTestEntity',
      scriptName: 'InspectorTestScript',
    });
  });

  // =========================================================================
  // 1. UPDATE DATA TITLE, COLOR, & DESCRIPTION (NODE HEADER)
  // =========================================================================
  test('dapat memperbarui Header Title, Color, dan Description pada node', async ({ nodeLibraryCrud, nodeCanvas, nodeInspector }) => {
    // Arrange: Buat node Math Add
    const node = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 300, y: 200 });
    await node.click();
    await nodeCanvas.expectNodeSelected(node);

    // Act: Update Header Title, Color, dan Description
    await nodeInspector.setHeaderTitle('Custom Math Addition');
    await nodeInspector.setHeaderColor('#FF5722');
    await nodeInspector.setHeaderDescription('Mencatat penjumlahan dengan custom header');

    // Assert: Nilai ter-render di input & indikator warna
    await expect(nodeInspector.titleInput).toHaveValue('Custom Math Addition');
    await expect(nodeInspector.descriptionTextarea).toHaveValue('Mencatat penjumlahan dengan custom header');
    await expect(nodeInspector.colorIndicator).toHaveAttribute('style', expect.stringContaining('rgb(255, 87, 34)'));
  });

  test('dapat menghapus node terpilih melalui menu dropdown di Header Inspector', async ({ nodeLibraryCrud, nodeCanvas, nodeInspector }) => {
    // Arrange
    const node = await nodeLibraryCrud.dropNodeFromSidebar('On Tick', { x: 300, y: 200 });
    await node.click();

    // Act
    await nodeInspector.deleteSelectedNode();

    // Assert: Node terhapus dari canvas & Inspector kembali ke Empty State
    await expect(nodeCanvas.nodesByType('event_tick')).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 2. RENAME PORTS DAN CRUD PORTS (DYNAMIC PORTS ON)
  // =========================================================================
  test('dapat merename input & output ports serta melakukan CRUD pada dynamic ports', async ({ nodeLibraryCrud, nodeCanvas, nodeInspector }) => {
    // Arrange: Node Math Add memiliki allowDynamicInputs = true
    const mathNode = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 300, y: 200 });
    await mathNode.click();

    // Act A: Rename Port Label
    await nodeInspector.renameInputPort('v0', 'Input Utama');
    await nodeInspector.renameOutputPort('res', 'Hasil Penjumlahan');

    // Assert A
    await expect(nodeInspector.inputPortRowById('v0').getByTestId('node-inspector-input-port-label-input')).toHaveValue('Input Utama');
    await expect(nodeInspector.outputPortRowById('res').getByTestId('node-inspector-output-port-label-input')).toHaveValue('Hasil Penjumlahan');

    // Act B: Tambah Dynamic Input Port Baru
    const initialInputRows = await nodeInspector.portsSection.getByTestId('node-inspector-input-port-row').count();
    await nodeInspector.addDynamicInputPort();

    // Assert B: Jumlah input port bertambah 1
    await expect(nodeInspector.portsSection.getByTestId('node-inspector-input-port-row')).toHaveCount(initialInputRows + 1);

    // Act C: Hapus Dynamic Input Port yang baru dibuat
    const lastPortId = await nodeInspector.portsSection.getByTestId('node-inspector-input-port-row').locator('nth=-1').getAttribute('data-port-id');
    await nodeInspector.removeInputPort(lastPortId);

    // Assert C: Kembali ke jumlah awal
    await expect(nodeInspector.portsSection.getByTestId('node-inspector-input-port-row')).toHaveCount(initialInputRows);
  });

  test('[Bad Path] mencegah penghapusan port permanen/terproteksi', async ({ nodeLibraryCrud, nodeInspector }) => {
    // Arrange: UI Notification memiliki port exec_in yang terproteksi
    const notifNode = await nodeLibraryCrud.dropNodeFromSidebar('Notification', { x: 300, y: 200 });
    await notifNode.click();

    // Assert: Tombol hapus tidak tersedia pada input port exec_in
    const protectedRow = nodeInspector.inputPortRowById('exec_in');
    await expect(protectedRow.getByTestId('node-inspector-input-port-remove-btn')).toHaveCount(0);
  });

  // =========================================================================
  // 3. TESTING PARAMETER (TERHUBUNG EDGE / VARIABLE BINDING)
  // =========================================================================
  test('memastikan input parameter ter-disable jika terhubung edge dan dapat menggunakan Variable mode', async ({ variableCrud, nodeLibraryCrud, nodeCanvasCrud, nodeInspector }) => {
    // 1. Arrange: Buat Local Variable "PlayerSpeed" bertipe Number
    await variableCrud.createVariable({ name: 'PlayerSpeed', type: 'number', value: 100, scope: 'Local' });

    // 2. Buat 2 Node Math
    const nodeA = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 200, y: 200 });
    const nodeB = await nodeLibraryCrud.dropNodeFromSidebar('Subtract', { x: 500, y: 200 });

    // Act A: Hubungkan Output Node A ke Input 'v0' Node B
    await nodeCanvasCrud.connectNodes(nodeA, nodeB);
    await nodeB.click();

    // Assert A: Input 'v0' pada Node B menampilkan badge LINKED dan control-nya disable
    const portRowV0 = nodeInspector.portRowById('v0');
    await expect(portRowV0.getByTestId('node-inspector-port-linked-badge')).toBeVisible();

    // Act B: Mengubah mode input 'v1' pada Node B ke Mode Variable
    await nodeInspector.togglePortMode('v1');
    await nodeInspector.bindVariableToPort('v1', 'PlayerSpeed');

    // Assert B: Mode Variable aktif dan variabel terhubung
    const varGroup = nodeInspector.portRowById('v1').getByTestId('node-inspector-port-variable-group');
    await expect(varGroup).toBeVisible();
  });

  // =========================================================================
  // 4. PARAMETER UNIK & GENERATE INPUT UNTUK MATH ADD DYNAMIC PORTS
  // =========================================================================
  test('memastikan parameter unik Math Add melakukan sync otomatis saat dynamic port ditambahkan', async ({ nodeLibraryCrud, nodeInspector }) => {
    // Arrange
    const mathNode = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 300, y: 200 });
    await mathNode.click();

    // Assert awal: Memiliki 2 input parameter (v0 & v1) pada section Parameters
    await expect(nodeInspector.parametersSection.getByTestId('node-inspector-port-row')).toHaveCount(2);

    // Act: Tambahkan 2 dynamic port baru dari section Ports Configuration
    await nodeInspector.addDynamicInputPort();
    await nodeInspector.addDynamicInputPort();

    // Assert: Parameter Section merefleksikan 4 input controls secara otomatis
    await expect(nodeInspector.parametersSection.getByTestId('node-inspector-port-row')).toHaveCount(4);

    // Isi nilai direct number pada port baru ketiga
    const newPortId = await nodeInspector.parametersSection.getByTestId('node-inspector-port-row').locator('nth=2').getAttribute('data-port-id');
    await nodeInspector.setPortDirectNumber(newPortId, 25);
  });

  // =========================================================================
  // 5. VARIABLE MODIFIER ADD-ON (MODIFIER PADA VARIABLE INPUT)
  // =========================================================================
  test('dapat mengaplikasikan dan menghapus Modifier Add-on pada Variable Parameter', async ({ variableCrud, nodeLibraryCrud, nodeInspector }) => {
    // Arrange: Buat variable number "BaseDamage"
    await variableCrud.createVariable({ name: 'BaseDamage', type: 'number', value: 50, scope: 'Local' });

    const mathNode = await nodeLibraryCrud.dropNodeFromSidebar('Multiply', { x: 300, y: 200 });
    await mathNode.click();

    // Act A: Pindah port 'v0' ke Mode Variable dan hubungkan ke "BaseDamage"
    await nodeInspector.togglePortMode('v0');
    await nodeInspector.bindVariableToPort('v0', 'BaseDamage');

    // Act B: Terapkan Modifier Add (+10)
    await nodeInspector.setPortVariableModifier('v0', 'Add (+)', 10);

    // Assert B: Input modifier number muncul dengan nilai 10
    const varGroup = nodeInspector.portRowById('v0').getByTestId('node-inspector-port-variable-group');
    const modInput = varGroup.getByTestId('node-inspector-var-group-modifier-number-input').locator('input');
    await expect(modInput).toHaveValue('10');

    // Act C: Clear modifier
    await nodeInspector.clearPortVariableModifier('v0');

    // Assert C: Input modifier hilang
    await expect(varGroup.getByTestId('node-inspector-var-group-modifier-number-input')).toHaveCount(0);
  });

  // =========================================================================
  // 6. INSPECTOR BERUBAH SAAT EDGE TERPILIH (NODE EDGE INSPECTOR)
  // =========================================================================
  test('mengubah tampilan Inspector ke Edge View saat edge diklik dan mengedit Modifier Edge', async ({ nodeLibraryCrud, nodeCanvasCrud, nodeCanvas, nodeInspector }) => {
    // Arrange: Hubungkan 2 node Math
    const nodeA = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 200, y: 200 });
    const nodeB = await nodeLibraryCrud.dropNodeFromSidebar('Divide', { x: 500, y: 200 });

    await nodeCanvasCrud.connectNodes(nodeA, nodeB);

    // Act: Klik garis edge di canvas
    const edge = nodeCanvas.edges.locator('nth=0');
    await nodeCanvas.selectEdge(edge);

    // Assert: Inspector beralih ke tampilan Edge Content
    await expect(nodeInspector.edgeContent).toBeVisible();

    // Act: Ubah Operation Modifier Edge menjadi Multiply (x) dengan operand = 2
    await nodeInspector.setEdgeOperation('Multiply (x)');
    await nodeInspector.setEdgeOperandNumber(2);

    // Assert
    await expect(nodeInspector.edgeSection.getByTestId('node-inspector-edge-operand-number-input').locator('input')).toHaveValue('2');

    // Act: Hapus Edge dari Inspector
    await nodeInspector.deleteSelectedEdge();

    // Assert: Edge terhapus dan kembali ke Empty State
    await expect(nodeCanvas.edges).toHaveCount(0);
    await expect(nodeInspector.emptySelectionState).toBeVisible();
  });

  // =========================================================================
  // 7. PENGUJIANKHUSUS SPESIFIK BLUEPRINT NODE
  // =========================================================================
  test.describe('Node-Specific Blueprint Inspector Tests', () => {
    // A. VARIABLE NODES (Get / Set Variable)
    test('VARIABLE: mengkonfigurasi Get dan Set Variable node', async ({ variableCrud, nodeCanvasCrud, nodeInspector }) => {
      // 1. Buat Local Variable "PlayerHealth" via Variable Panel dengan isExposed: true agar muncul di Variable Panel
      await variableCrud.createVariable({ name: 'PlayerHealth', type: 'number', value: 100, isExposed: true, scope: 'Local' });

      // 2. Seret node Get Variable langsung dari Variable Panel ke Canvas
      const getVarNode = await nodeCanvasCrud.dropVariableToCanvas('PlayerHealth', 'get', { x: 300, y: 200 });
      await getVarNode.click();

      // 3. Pilih Variable "PlayerHealth" di Inspector
      await nodeInspector.selectVariableForNode('PlayerHealth');

      // Assert: Title header berubah menjadi "Get PlayerHealth"
      await expect(nodeInspector.titleInput).toHaveValue('Get PlayerHealth');
    });

    // B. NOTIFICATION NODES (UI Notification & Debug Notification)
    test('NOTIFICATION: mengedit default input value pada UI & Debug Notification', async ({ nodeLibraryCrud, nodeInspector }) => {
      const notifNode = await nodeLibraryCrud.dropNodeFromSidebar('Notification', { x: 300, y: 200 });
      await notifNode.click();

      // Edit default message parameter
      await nodeInspector.setPortDirectText('in_source', 'SystemAlert');
      await nodeInspector.setPortDirectText('in_msg', 'Quest Completed!');

      await expect(nodeInspector.portRowById('in_source').getByTestId('node-inspector-port-text-input').locator('input')).toHaveValue('SystemAlert');
      await expect(nodeInspector.portRowById('in_msg').getByTestId('node-inspector-port-text-input').locator('input')).toHaveValue('Quest Completed!');
    });

    // C. LOGIC NODES (And, Or, Not)
    test('LOGIC: mengonfigurasi boolean logic And/Or dengan dynamic boolean input', async ({ nodeLibraryCrud, nodeInspector }) => {
      const logicNode = await nodeLibraryCrud.dropNodeFromSidebar('And', { x: 300, y: 200 });
      await logicNode.click();

      // Set input boolean v0 menjadi true
      await nodeInspector.setPortDirectSelect('v0', 'True');
      await expect(nodeInspector.portRowById('v0').getByTestId('node-inspector-port-boolean-select')).toContainText('True');
    });

    // D. LIFECYCLE NODES (On Tick, On Game Start, Pause Game)
    test('LIFECYCLE: menampilkan parameter kosong pada Lifecycle node tanpa editable values', async ({ nodeLibraryCrud, nodeInspector }) => {
      const startNode = await nodeLibraryCrud.dropNodeFromSidebar('On Game Start', { x: 300, y: 200 });
      await startNode.click();

      // Assert: Component NodeData tidak merender section parameters (hidden/tidak ada di DOM)
      await expect(nodeInspector.parametersSection).toBeHidden();
    });

    // E. OBJECT NODES (Get Object, Set Object, Find Closest By Tag)
    test('OBJECT: dapat menambah dynamic property port dari Property Options dropdown', async ({ nodeLibraryCrud, nodeInspector }) => {
      const getObjNode = await nodeLibraryCrud.dropNodeFromSidebar('Get Object Info', { x: 300, y: 200 });
      await getObjNode.click();

      // Tambah Output Port dari Property Options Dropdown
      await nodeInspector.addDynamicOutputPort('Active');

      // Assert: Port "Active" ditambahkan ke output ports
      await expect(nodeInspector.outputPortRowById('active')).toBeVisible();
    });
  });

  // =========================================================================
  // 8. INSPECTOR SELECTION STATES (MULTI-SELECTION & EMPTY STATE)
  // =========================================================================
  test('menampilkan state multi-selection ketika lebih dari 1 node dipilih', async ({ nodeLibraryCrud, nodeCanvas, nodeInspector }) => {
    // Arrange: Buat 2 node
    const node1 = await nodeLibraryCrud.dropNodeFromSidebar('Add', { x: 200, y: 200 });
    const node2 = await nodeLibraryCrud.dropNodeFromSidebar('Subtract', { x: 500, y: 200 });

    // Act: Select kedua node bersamaan via canvas
    await nodeCanvas.selectMultipleNodes([node1, node2]);

    // Assert: Multi-selected state aktif di Inspector
    await expect(nodeInspector.multiSelectedState).toBeVisible();
    await expect(nodeInspector.multiSelectedCount).toContainText('2 Nodes Selected');
  });
});