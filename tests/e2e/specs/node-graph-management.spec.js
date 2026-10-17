// lokasi: tests/e2e/specs/node-library-graph.spec.js
import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Node Library & Graph E2E',
    description: 'End-to-end scenarios for the Node Library (Search, Recents, Drag/Drop, Batch Categories) and the Graph Editor (Node & Edge Manipulation via Store, Inspector Modifiers)',
  },
});

const REPRESENTATIVE_CATEGORIES = [
  'Math & Random', 'Scene & Lifecycle', 'Audio & System', 'Flow & Logic', 'Input & Controls',
];

test.describe('Node Library & Graph Editor Unified E2E Testing', () => {
  test.beforeEach(async ({ nodeGraphCrud }) => {
    await nodeGraphCrud.openGraphForEntity({
      entityName: 'GraphTestEntity',
      scriptName: 'GraphMainScript',
    });
  });

  // =========================================================================
  // 1. DRAG AND DROP FROM THE NODE LIBRARY
  // =========================================================================
  test('drags a node from the sidebar search results onto the graph canvas', async ({ nodeLibrary, nodeGraph }) => {
    await nodeLibrary.searchInSidebar('get transform');
    const searchItem = nodeLibrary.sidebarSearchItemByType('getTransform');
    await expect(searchItem).toBeVisible();
    await expect(nodeGraph.nodesByType('getTransform')).toHaveCount(0);

    await nodeGraph.dropFromSidebarToCanvas(searchItem, { x: 450, y: 250 });

    await expect(nodeGraph.nodesByType('getTransform')).toHaveCount(1);
  });

  // =========================================================================
  // 2. SISTEM SEARCH (MODAL DAN SIDEBAR PANEL)
  // =========================================================================
  test('filters nodes reactively in the library modal and the sidebar panel', async ({ nodeLibrary }) => {
    await nodeLibrary.searchInSidebar('Input & Controls');
    await expect(nodeLibrary.sidebarSearchItems).not.toHaveCount(0);

    await nodeLibrary.searchInSidebar('zzz-node-not-found');
    await expect(nodeLibrary.sidebarNoResults).toBeVisible();
    await expect(nodeLibrary.sidebarSearchItems).toHaveCount(0);

    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarNoResults).toHaveCount(0);

    await nodeLibrary.openModal();
    await nodeLibrary.openCategory('Math & Random');
    const label = await nodeLibrary.firstModalItemLabel();

    await nodeLibrary.searchInModal(label);
    await expect(nodeLibrary.modalItemByLabel(label)).toBeVisible();

    await nodeLibrary.searchInModal('zzz-node-not-found');
    await expect(nodeLibrary.modalNoResults).toBeVisible();

    await nodeLibrary.clearModalSearch();
    await expect(nodeLibrary.modalNoResults).toHaveCount(0);
    await nodeLibrary.closeModal();
  });

  // =========================================================================
  // 3. SISTEM RECENT (MODAL DAN SIDEBAR PANEL)
  // =========================================================================
  test('records recently added nodes and lists them in Recent', async ({ nodeLibrary, nodeGraph }) => {
    const type = await nodeLibrary.addFromSidebarGroup('Scene & Lifecycle');
    await expect(nodeGraph.nodesByType(type)).toHaveCount(1);

    await nodeLibrary.clearSidebarSearch();
    await expect(nodeLibrary.sidebarRecentItemByType(type)).toBeVisible();

    await nodeLibrary.openModal();
    await expect(nodeLibrary.modalRecentItemByType(type)).toBeVisible();
    await nodeLibrary.closeModal();
  });

  // =========================================================================
  // 4. DOUBLE-CLICK TO ADD A NODE
  // =========================================================================
  test('adds a node to the graph canvas on double-click from both the modal and the sidebar', async ({ nodeLibrary, nodeGraph }) => {
    const modalType = await nodeLibrary.addFirstFromModalCategory('Math & Random');
    await expect(nodeGraph.nodesByType(modalType)).toHaveCount(1);

    const sidebarType = await nodeLibrary.addFromSidebarGroup('Input & Controls');
    await expect(nodeGraph.nodesByType(sidebarType)).toHaveCount(1);
  });

  // =========================================================================
  // 5. REPRESENTATIVE CATEGORY BATCH TESTING
  // =========================================================================
  test('adds nodes across representative categories without errors', async ({ nodeLibrary, nodeGraph }) => {
    // Slow by design: adds nodes of multiple categories
    test.slow();

    const pageErrors = nodeGraph.collectPageErrors();
    let expectedTotal = 0;

    for (const category of REPRESENTATIVE_CATEGORIES) {
      await nodeLibrary.addFirstFromModalCategory(category);
      expectedTotal += 1;

      const types = await nodeLibrary.sidebarGroupTypes(category);
      for (const type of types) {
        await nodeLibrary.sidebarSearchItemByType(type).dblclick();
        expectedTotal += 1;
      }

      await expect(nodeGraph.nodes, `Node count after category "${category}"`).toHaveCount(expectedTotal);
    }

    expect(pageErrors).toEqual([]);
  });

  // =========================================================================
  // 6. MANIPULASI NODE DIRECT VIA STORE
  // =========================================================================
  test('creates, selects, moves and deletes a node via the Pinia store', async ({ nodeGraph }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('getTransform', 'Get Transform', { x: 350, y: 200 });
    await expect(nodeGraph.nodeById(nodeId)).toBeVisible();

    await nodeGraph.selectNodeById(nodeId);
    await nodeGraph.moveNodeById(nodeId, { x: 550, y: 350 });

    await nodeGraph.deleteNodeById(nodeId);
    await expect(nodeGraph.nodeById(nodeId)).toHaveCount(0);
  });

  // =========================================================================
  // 7. KONEKSI EDGE & MODIFIER PROPERTY INSPECTOR
  // =========================================================================
  test('connects an edge, selects it and edits its modifier in the Property Inspector', async ({ nodeGraph }) => {
    const sourceId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Source Node', { x: 200, y: 200 });
    const targetId = await nodeGraph.spawnNodeViaStore('mathSubtract', 'Target Node', { x: 500, y: 200 });

    const edgeId = await nodeGraph.connectPortsViaStore(sourceId, 'result', targetId, 'v0');
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
  test('[Bad Path] rejects an edge connection when source and target are the same node', async ({ nodeGraph }) => {
    const nodeId = await nodeGraph.spawnNodeViaStore('mathAdd', 'Self Node', { x: 300, y: 200 });

    await nodeGraph.connectPortsViaStore(nodeId, 'execOut', nodeId, 'execIn');

    await expect(nodeGraph.edges).toHaveCount(0);
  });
});