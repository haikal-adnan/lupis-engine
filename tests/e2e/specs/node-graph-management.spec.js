import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Library & Graph E2E',
    description: 'Skenario E2E menyeluruh untuk Node Library (Search, Recents, Drag/Drop, Batch Categories) dan Graph Editor (Node & Edge Manipulation via Store, Inspector Modifiers)',
  },
});

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

test.describe('Node Library & Graph Editor Unified E2E Testing', () => {
  test.beforeEach(async ({ nodeGraphCrud }) => {
    await nodeGraphCrud.openGraphForEntity({
      entityName: 'GraphTestEntity',
      scriptName: 'GraphMainScript',
    });
  });

  // =========================================================================
  // 1. DRAG AND DROP DARI NODE LIBRARY
  // =========================================================================
  test('dapat melakukan drag and drop node dari sidebar search ke graph canvas', async ({ nodeLibrary, nodeGraph }) => {
    await nodeLibrary.searchInSidebar('get transform');
    const searchItem = nodeLibrary.sidebarSearchItemByType('get_transform');
    await expect(searchItem).toBeVisible();
    await expect(nodeGraph.nodesByType('get_transform')).toHaveCount(0);

    await nodeGraph.dropFromSidebarToCanvas(searchItem, { x: 450, y: 250 });

    await expect(nodeGraph.nodesByType('get_transform')).toHaveCount(1);
  });

  // =========================================================================
  // 2. SISTEM SEARCH (MODAL DAN SIDEBAR PANEL)
  // =========================================================================
  test('memfilter node secara reaktif pada modal library dan sidebar panel', async ({ nodeLibrary }) => {
    await nodeLibrary.searchInSidebar('Keyboard Events');
    await expect(nodeLibrary.sidebarSearchItems).not.toHaveCount(0);

    await nodeLibrary.searchInSidebar('zzz-node-tidak-ada');
    await expect(nodeLibrary.sidebarNoResults).toBeVisible();
    await expect(nodeLibrary.sidebarSearchItems).toHaveCount(0);

    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarNoResults).toHaveCount(0);

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
  test('mencatat dan menampilkan node yang baru saja ditambahkan pada daftar Recent', async ({ nodeLibrary, nodeGraph }) => {
    const type = await nodeLibrary.addFromSidebarGroup('Game Lifecycle');
    await expect(nodeGraph.nodesByType(type)).toHaveCount(1);

    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarRecentItemByType(type)).toBeVisible();

    await nodeLibrary.openModal();
    await expect(nodeLibrary.modalRecentItemByType(type)).toBeVisible();
    await nodeLibrary.closeModal();
  });

  // =========================================================================
  // 4. SISTEM DOUBLE CLICK UNTUK MENAMBAHKAN NODE
  // =========================================================================
  test('menambahkan node ke graph canvas saat double-click dari modal maupun sidebar', async ({ nodeLibrary, nodeGraph }) => {
    const modalType = await nodeLibrary.addFirstFromModalCategory('Math');
    await expect(nodeGraph.nodesByType(modalType)).toHaveCount(1);

    const sidebarType = await nodeLibrary.addFromSidebarGroup('Keyboard Events');
    await expect(nodeGraph.nodesByType(sidebarType)).toHaveCount(1);
  });

  // =========================================================================
  // 5. SELURUH NODE PER KATEGORI (BATCH TESTING)
  // =========================================================================
  test.describe('Penambahan Seluruh Node per Kategori (Tanpa Error)', () => {
    for (const { name, categories } of CATEGORY_BATCHES) {
      test(name, async ({ nodeLibrary, nodeGraph }) => {
        test.slow();

        const pageErrors = nodeGraph.collectPageErrors();
        let expectedTotal = 0;

        for (const category of categories) {
          await nodeLibrary.addFirstFromModalCategory(category);
          expectedTotal += 1;

          const types = await nodeLibrary.sidebarGroupTypes(category);
          for (const type of types) {
            await nodeLibrary.sidebarSearchItemByType(type).dblclick();
            expectedTotal += 1;
          }

          await expect(nodeGraph.nodes, `Jumlah node setelah kategori "${category}"`).toHaveCount(expectedTotal);
        }

        expect(pageErrors).toEqual([]);
      });
    }
  });

  // =========================================================================
  // 6. MANIPULASI NODE DIRECT VIA STORE
  // =========================================================================
  test('dapat membuat, memilih, memindahkan, dan menghapus node via Pinia store', async ({ nodeGraph }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('get_transform', 'Get Transform', { x: 350, y: 200 });
    await expect(nodeGraph.nodeById(nodeId)).toBeVisible();

    await nodeGraph.selectNodeById(nodeId);
    await nodeGraph.moveNodeById(nodeId, { x: 550, y: 350 });

    await nodeGraph.deleteNodeById(nodeId);
    await expect(nodeGraph.nodeById(nodeId)).toHaveCount(0);
  });

  // =========================================================================
  // 7. KONEKSI EDGE & MODIFIER PROPERTY INSPECTOR
  // =========================================================================
  test('dapat mengoneksikan edge, memilihnya, dan mengedit modifier di Property Inspector', async ({ nodeGraph }) => {
    const sourceId = await nodeGraph.spawnNodeViaStore('math_add', 'Source Node', { x: 200, y: 200 });
    const targetId = await nodeGraph.spawnNodeViaStore('math_subtract', 'Target Node', { x: 500, y: 200 });

    const edgeId = await nodeGraph.connectPortsViaStore(sourceId, 'out_0', targetId, 'in_0');
    await expect(nodeGraph.edgeById(edgeId)).toBeAttached();

    await nodeGraph.selectEdgeById(edgeId);
    await expect(nodeGraph.edgeInspectorSection).toBeVisible();

    await nodeGraph.setEdgeOperation('Add (+)');
    await nodeGraph.setEdgeOperandValue(50, true);
    await expect(nodeGraph.edgeOperandNumberInput).toHaveValue('50');

    await nodeGraph.deleteSelectedEdgeViaInspector();
    await expect(nodeGraph.edges).toHaveCount(0);
  });

  // =========================================================================
  // 8. [Bad Path] VALIDASI KONEKSI EDGE
  // =========================================================================
  test('[Bad Path] menolak koneksi edge jika source dan target node sama', async ({ nodeGraph }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('math_add', 'Self Node', { x: 300, y: 200 });

    await nodeGraph.connectPortsViaStore(nodeId, 'exec_out', nodeId, 'exec_in');

    await expect(nodeGraph.edges).toHaveCount(0);
  });
});