import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Graph Edge E2E',
    description: 'Skenario E2E khusus pengujian koneksi edge, modifier edge, dan pembatasan koneksi port',
  },
});

test.describe('Graph Edge Connection & Modifier E2E Testing', () => {
  test.beforeEach(async ({ nodeCanvasCrud }) => {
    await nodeCanvasCrud.openGraphForEntity({
      entityName: 'EdgeTestEntity',
      scriptName: 'EdgeTestScript',
    });
  });

  // =========================================================================
  // 1. KONEKSI EDGE KOMPATIBEL (EXECUTION & DATA)
  // =========================================================================
  test('dapat mengoneksikan edge antar node yang kompatibel', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange: Buat 2 node bertipe Math
    const sourceType = await nodeLibrary.addFromSidebarGroup('Math', 0);
    const targetType = await nodeLibrary.addFromSidebarGroup('Math', 1);

    const sourceNode = nodeCanvas.nodeByType(sourceType);
    const targetNode = nodeCanvas.nodeByType(targetType);

    const { output, input } = await nodeCanvas.findPortPair(sourceNode, targetNode, { compatible: true });
    await nodeCanvas.spreadApart(targetNode, sourceNode);

    // Act
    await nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);

    // Assert
    await expect(nodeCanvas.edges).toHaveCount(1);
  });

  // =========================================================================
  // 2. MODIFIER EDGE PADA PROPERTY INSPECTOR
  // =========================================================================
  test('dapat memilih edge dan mengubah konfigurasi modifier pada Property Inspector', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange: Buat 2 node Math dan hubungkan
    const sourceType = await nodeLibrary.addFromSidebarGroup('Math', 0);
    const targetType = await nodeLibrary.addFromSidebarGroup('Math', 1);

    const sourceNode = nodeCanvas.nodeByType(sourceType);
    const targetNode = nodeCanvas.nodeByType(targetType);

    const { output, input } = await nodeCanvas.findPortPair(sourceNode, targetNode, { compatible: true });
    await nodeCanvas.spreadApart(targetNode, sourceNode);
    await nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);

    // Act: Select edge line di canvas
    const edge = nodeCanvas.edges.locator('nth=0');
    await nodeCanvas.selectEdge(edge);

    // Assert: Inspector menampilkan detail edge terpilih
    await expect(nodeCanvas.edgeInspectorSection).toBeVisible();

    // Act: Ubah Operation Modifier menjadi Add (+) dan isi Operand Value = 50
    await nodeCanvas.setEdgeOperation('Add (+)');
    await nodeCanvas.setEdgeOperandValue(50, true);

    // Assert: Value tersimpan pada input
    await expect(nodeCanvas.edgeOperandNumberInput).toHaveValue('50');
  });

  // =========================================================================
  // 3. PENGHAPUSAN EDGE KONEKSI
  // =========================================================================
  test('dapat menghapus koneksi edge melalui tombol delete di Inspector', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange
    const sourceType = await nodeLibrary.addFromSidebarGroup('Math', 0);
    const targetType = await nodeLibrary.addFromSidebarGroup('Math', 1);

    const sourceNode = nodeCanvas.nodeByType(sourceType);
    const targetNode = nodeCanvas.nodeByType(targetType);

    const { output, input } = await nodeCanvas.findPortPair(sourceNode, targetNode, { compatible: true });
    await nodeCanvas.spreadApart(targetNode, sourceNode);
    await nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);

    await expect(nodeCanvas.edges).toHaveCount(1);

    // Act
    const edge = nodeCanvas.edges.locator('nth=0');
    await nodeCanvas.selectEdge(edge);
    await nodeCanvas.deleteSelectedEdgeViaInspector();

    // Assert
    await expect(nodeCanvas.edges).toHaveCount(0);
  });

  // =========================================================================
  // 4. [Bad Path] PENOLAKAN KONEKSI PORT TIDAK KOMPATIBEL
  // =========================================================================
  test('[Bad Path] menolak koneksi port antar tipe data yang tidak cocok', async ({ nodeLibrary, nodeCanvas, popup }) => {
    // Arrange: Source Math (Number) -> Target Boolean Logic (Bool)
    const sourceType = await nodeLibrary.addFromSidebarGroup('Math', 0);
    const targetType = await nodeLibrary.addFromSidebarGroup('Boolean Logic', 0);

    const sourceNode = nodeCanvas.nodeByType(sourceType);
    const targetNode = nodeCanvas.nodeByType(targetType);

    const { output, input } = await nodeCanvas.findPortPair(sourceNode, targetNode, { compatible: false });
    await nodeCanvas.spreadApart(targetNode, sourceNode);

    // Act
    await nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);

    // Assert
    await popup.expectPopAlert('Connection Failed');
    await expect(nodeCanvas.edges).toHaveCount(0);
  });
});