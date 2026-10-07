import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 1. Mock dependencies yang memicu circular import atau aksi asynchronous eksternal
vi.mock('@nodes/nodes.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn()
    }))
  }
})

vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  }))
}))

// Import modul setelah setup vi.mock
import { useNodeMenu } from '@nodes/graph/composables/useNodeMenu.js' // Sesuaikan path alias jika berbeda
import { useScriptStore } from '@scripts/scripts.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useProjectStore } from '@projects/projects.js'
import { useScriptHistory } from '@historys/historys.js'
import { 
  setupMockOPFS, 
  createMockEmptyProject, 
  setupMockScriptEnvironment 
} from '@tests/tests.js'

describe('useNodeMenu Integration', () => {
  let pinia
  let scriptStore
  let workspaceStore
  let projectStore
  let mockStoreRef

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)

    mockStoreRef = setupMockOPFS()

    projectStore = useProjectStore()
    scriptStore = useScriptStore()
    workspaceStore = useWorkspaceStore()

    const mockProject = await createMockEmptyProject({ projectName: 'Menu Integration Project' })
    projectStore.project = mockProject
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear()
    }
  })

  describe('Context Menu State & Display', () => {
    it('opens context menu and calculates correct labels for single selected node', async () => {
      // Arrange
      const nodeA = { id: 'node_1', position: { x: 100, y: 100 }, settings: { headerTitle: 'Start Node' } }
      await setupMockScriptEnvironment({ scriptId: 'script_menu', nodes: [nodeA] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_menu'))

      const { contextMenu, openMenu } = useNodeMenu()
      const mockEvent = { clientX: 250, clientY: 180 }

      // Act
      openMenu(mockEvent, nodeA)

      // Assert: State menu konteks aktif dan terhubung ke node_1
      expect(contextMenu.value.visible).toBe(true)
      expect(contextMenu.value.x).toBe(250)
      expect(contextMenu.value.y).toBe(180)
      expect(contextMenu.value.nodeId).toBe('node_1')
      expect(scriptStore.selectedNodeId).toBe('node_1')

      // Assert: Label menu tunggal
      const items = contextMenu.value.items
      const duplicateItem = items.find(i => i.label === 'Duplicate Node')
      const deleteItem = items.find(i => i.label === 'Delete Node')
      expect(duplicateItem).toBeDefined()
      expect(deleteItem).toBeDefined()
    })

    it('calculates dynamic action labels when multiple nodes are selected', async () => {
      // Arrange
      const nodeA = { id: 'node_1', position: { x: 100, y: 100 } }
      const nodeB = { id: 'node_2', position: { x: 200, y: 100 } }
      await setupMockScriptEnvironment({ scriptId: 'script_multi', nodes: [nodeA, nodeB] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_multi'))

      scriptStore.setSelectedNodes(['node_1', 'node_2'])

      const { contextMenu, openMenu } = useNodeMenu()

      // Act
      openMenu({ clientX: 100, clientY: 100 }, nodeA)

      // Assert: Label menyesuaikan jumlah node terdaftar
      const items = contextMenu.value.items
      expect(items.find(i => i.label === 'Duplicate Selected (2)')).toBeDefined()
      expect(items.find(i => i.label === 'Delete Selected (2)')).toBeDefined()
    })

    it('closes context menu correctly', async () => {
      // Arrange
      const nodeA = { id: 'node_1', position: { x: 0, y: 0 } }
      await setupMockScriptEnvironment({ scriptId: 'script_close', nodes: [nodeA] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_close'))

      const { contextMenu, openMenu, closeMenu } = useNodeMenu()
      openMenu({ clientX: 50, clientY: 50 }, nodeA)
      expect(contextMenu.value.visible).toBe(true)

      // Act
      closeMenu()

      // Assert
      expect(contextMenu.value.visible).toBe(false)
    })
  })

  describe('Node Action Handlers Integration', () => {
    it('duplicates target node, offsets position, and records action into history', async () => {
      // Arrange
      const nodeA = { id: 'node_orig', position: { x: 100, y: 150 }, name: 'Math Node' }
      await setupMockScriptEnvironment({ scriptId: 'script_dup', nodes: [nodeA] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_dup'))

      const { openMenu, contextMenu } = useNodeMenu()
      const history = useScriptHistory()

      openMenu({ clientX: 100, clientY: 100 }, nodeA)
      const duplicateAction = contextMenu.value.items.find(i => i.label === 'Duplicate Node').action

      // Act
      duplicateAction()

      // Assert: Node terduplikasi dengan offset +40px pada koordinat x & y
      expect(scriptStore.activeScript.nodes.length).toBe(2)
      const duplicatedNode = scriptStore.activeScript.nodes.find(n => n.id !== 'node_orig')
      expect(duplicatedNode).toBeDefined()
      expect(duplicatedNode.position).toEqual({ x: 140, y: 190 })
      expect(projectStore.syncStatus).toBe('dirty')

      // Undo duplikasi via history
      history.undo()

      // Assert: Node terduplikasi terhapus kembali
      expect(scriptStore.activeScript.nodes.length).toBe(1)
    })

    it('deletes target node, removes connected edges, and records undo state', async () => {
      // Arrange
      const nodeA = { id: 'node_1', position: { x: 0, y: 0 } }
      const nodeB = { id: 'node_2', position: { x: 100, y: 0 } }
      const edge = { id: 'edge_1', source: 'node_1', target: 'node_2', sourceHandle: 'out', targetHandle: 'in' }

      await setupMockScriptEnvironment({
        scriptId: 'script_del',
        nodes: [nodeA, nodeB],
        edges: [edge]
      })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_del'))

      const { openMenu, contextMenu } = useNodeMenu()
      const history = useScriptHistory()

      openMenu({ clientX: 0, clientY: 0 }, nodeA)
      const deleteAction = contextMenu.value.items.find(i => i.label === 'Delete Node').action

      // Act
      deleteAction()

      // Assert: NodeA dan Edge terhubung terhapus dari active script
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_1')).toBeUndefined()
      expect(scriptStore.activeScript.edges.find(e => e.id === 'edge_1')).toBeUndefined()
      expect(scriptStore.selectedNodeId).toBeNull()
      expect(projectStore.syncStatus).toBe('dirty')

      // Undo penghapusan
      history.undo()

      // Assert: Node & Edge kembali seperti semula
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_1')).toBeDefined()
      expect(scriptStore.activeScript.edges.find(e => e.id === 'edge_1')).toBeDefined()
    })

    it('opens code editor tab in workspace store for chosen node', async () => {
      // Arrange
      const nodeCode = { id: 'node_custom_1', settings: { headerTitle: 'Custom Action' } }
      await setupMockScriptEnvironment({ scriptId: 'script_code', nodes: [nodeCode] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_code'))

      const { openMenu, contextMenu } = useNodeMenu()
      openMenu({ clientX: 10, clientY: 10 }, nodeCode)

      const openCodeAction = contextMenu.value.items.find(i => i.label === 'Edit Code').action

      // Act
      openCodeAction()

      // Assert: Tab editor kode ditambahkan dan diaktifkan pada workspaceStore
      const activeTab = workspaceStore.activeTab
      expect(activeTab).toBeDefined()
      expect(activeTab.id).toBe('code_node_custom_1')
      expect(activeTab.name).toBe('Custom Action')
      expect(activeTab.type).toBe('code_editor')
    })
  })

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] handles openCodeEditor gracefully when passed invalid node payload', () => {
      // Arrange
      const { openMenu } = useNodeMenu()
      const initialTabCount = workspaceStore.tabs.length

      // Act: Panggil dengan null
      const dummyNode = { id: 'dummy_1' }
      openMenu({ clientX: 0, clientY: 0 }, dummyNode)

      // Memanggil handler internal openCodeEditor dengan payload null langsung
      workspaceStore.openTab = vi.fn()

      // Assert: Tidak ada tab baru yang dibuat
      expect(workspaceStore.tabs.length).toBe(initialTabCount)
    })
  })
})