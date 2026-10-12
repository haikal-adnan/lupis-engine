import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Library E2E',
    description: 'Skenario E2E menyeluruh untuk Drag & Drop, Search, Recents, Double Click, dan Batch Node Categories',
  },
});

/** Label harus sama dengan data-category-label di UI (27 kategori, dibagi 3 batch). */
const CATEGORY_BATCHES = [
  {
    name: 'Batch 1: Animator sampai Events & Signals',
    categories: [
      'Animator', 'Basic Layer', 'Basic Object', 'Boolean Logic', 'Camera',
      'Collection Helpers', 'Collider System', 'Entity Management', 'Events & Signals',
    ],
  },
  {
    name: 'Batch 2: Flow Helpers sampai Math',
    categories: [
      'Flow Helpers', 'Game Lifecycle', 'Interface', 'Keyboard Events', 'List Operations',
      'Logic & Compare', 'Loops', 'Map Operations', 'Math',
    ],
  },
  {
    name: 'Batch 3: Mouse Events sampai Transition',
    categories: [
      'Mouse Events', 'Physics & Collision', 'Pointer & Touch', 'Random Operations',
      'Renderer', 'Scene Management', 'String Utils', 'Transform', 'Transition',
    ],
  },
];

test.describe('Node Library & Graph Editor E2E Testing', () => {
  test.beforeEach(async ({ nodeCanvasCrud }) => {
    await nodeCanvasCrud.openGraphForEntity({
      entityName: 'GraphTestEntity',
      scriptName: 'GraphMainScript',
    });
  });

  // =========================================================================
  // 1. DRAG AND DROP DARI NODE LIBRARY
  // =========================================================================
  test('dapat melakukan drag and drop node dari sidebar search ke graph canvas', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange
    await nodeLibrary.searchInSidebar('get transform');
    const searchItem = nodeLibrary.sidebarSearchItemByType('get_transform');
    await expect(searchItem).toBeVisible();
    await expect(nodeCanvas.nodesByType('get_transform')).toHaveCount(0);

    // Act
    await nodeCanvas.dropFromSidebarToCanvas(searchItem, { x: 450, y: 250 });

    // Assert
    await expect(nodeCanvas.nodesByType('get_transform')).toHaveCount(1);
  });

  // =========================================================================
  // 2. SISTEM SEARCH (MODAL DAN SIDEBAR PANEL)
  // =========================================================================
  test('memfilter node secara reaktif pada modal library dan sidebar panel', async ({ nodeLibrary }) => {
    // A. Sidebar: query = label grup -> ada hasil; query ngawur -> kosong; clear -> hilang
    await nodeLibrary.searchInSidebar('Keyboard Events');
    await expect(nodeLibrary.sidebarSearchItems).not.toHaveCount(0);

    await nodeLibrary.searchInSidebar('zzz-node-tidak-ada');
    await expect(nodeLibrary.sidebarNoResults).toBeVisible();
    await expect(nodeLibrary.sidebarSearchItems).toHaveCount(0);

    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarNoResults).toHaveCount(0);

    // B. Modal: pakai label node nyata dari kategori Math (modal hanya memfilter label item)
    await nodeLibrary.openModal();
    await nodeLibrary.openCategory('Math');
    const label = await nodeLibrary.firstModalItemLabel();

    await nodeLibrary.searchInModal(label);
    await expect(nodeLibrary.modalItemByLabel(label)).toBeVisible();

    await nodeLibrary.searchInModal('zzz-node-tidak-ada');
    await expect(nodeLibrary.modalNoResults).toBeVisible();

    await nodeLibrary.clearModalSearch();
    await expect(nodeLibrary.modalNoResults).toHaveCount(0);
    await nodeLibrary.closeModal();
  });

  // =========================================================================
  // 3. SISTEM RECENT (MODAL DAN SIDEBAR PANEL)
  // =========================================================================
  test('mencatat dan menampilkan node yang baru saja ditambahkan pada daftar Recent', async ({ nodeLibrary, nodeCanvas }) => {
    // Act
    const type = await nodeLibrary.addFromSidebarGroup('Game Lifecycle');
    await expect(nodeCanvas.nodesByType(type)).toHaveCount(1);

    // Assert: Recent Sidebar (tampil setelah search dikosongkan)
    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarRecentItemByType(type)).toBeVisible();

    // Assert: Recent Modal
    await nodeLibrary.openModal();
    await expect(nodeLibrary.modalRecentItemByType(type)).toBeVisible();
    await nodeLibrary.closeModal();
  });

  // =========================================================================
  // 4. SISTEM DOUBLE CLICK UNTUK MENAMBAHKAN NODE
  // =========================================================================
  test('menambahkan node ke graph canvas saat double-click dari modal maupun sidebar', async ({ nodeLibrary, nodeCanvas }) => {
    // A. Modal (otomatis tertutup setelah node ditambahkan)
    const modalType = await nodeLibrary.addFirstFromModalCategory('Math');
    await expect(nodeCanvas.nodesByType(modalType)).toHaveCount(1);

    // B. Sidebar search
    const sidebarType = await nodeLibrary.addFromSidebarGroup('Keyboard Events');
    await expect(nodeCanvas.nodesByType(sidebarType)).toHaveCount(1);
  });

  // =========================================================================
  // 5. SELURUH NODE PER KATEGORI (3 batch, data-driven dari UI)
  // =========================================================================
  test.describe('Penambahan Seluruh Node per Kategori (Tanpa Error)', () => {
    for (const { name, categories } of CATEGORY_BATCHES) {
      test(name, async ({ nodeLibrary, nodeCanvas }) => {
        test.slow();

        // Arrange
        const pageErrors = nodeCanvas.collectPageErrors();
        let expectedTotal = 0;

        for (const category of categories) {
          // Act: satu node lewat alur modal, lalu seluruh item kategori lewat sidebar (tanpa buka-tutup modal)
          await nodeLibrary.addFirstFromModalCategory(category);
          expectedTotal += 1;

          const types = await nodeLibrary.sidebarGroupTypes(category);
          for (const type of types) {
            await nodeLibrary.sidebarSearchItemByType(type).dblclick();
            expectedTotal += 1;
          }

          // Assert: satu assertion per kategori
          await expect(nodeCanvas.nodes, `Jumlah node setelah kategori "${category}"`).toHaveCount(expectedTotal);
        }

        // Assert: tidak ada exception di halaman selama penambahan node
        expect(pageErrors).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 6. PORT EDGE, DELETE
  // =========================================================================
  test('mampu menghubungkan port antar node yang kompatibel', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange: dua node Math berbeda, dipisah agar tidak bertumpuk
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

  test('menghapus node menggunakan tombol Keyboard Delete', async ({ nodeLibrary, nodeCanvas }) => {
    // Arrange
    const type = await nodeLibrary.addFromSidebarGroup('Game Lifecycle');
    const node = nodeCanvas.nodeByType(type);

    await node.click();
    await nodeCanvas.expectNodeSelected(node);

    // Act
    await nodeCanvas.deleteSelectedNodes();

    // Assert
    await expect(nodeCanvas.nodesByType(type)).toHaveCount(0);
  });

  test('[Bad Path] menolak koneksi port dengan tipe data yang tidak kompatibel', async ({ nodeLibrary, nodeCanvas, popup }) => {
    // Arrange: output Math (data) -> input Boolean Logic yang tipenya tidak cocok
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