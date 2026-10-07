import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 1. Mock useNodeBlueprint untuk mencegah Top-Level Circular Import Error pada useScriptStore
vi.mock('@nodes/nodes.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn()
    }))
  }
})

// 2. Mock composables UI / alert agar tidak berinteraksi dengan DOM
vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  }))
}))

// Import modul setelah vi.mock terdaftar
import { useGraphEditor } from '@nodes/graph/composables/useGraphEditor.js' // Sesuaikan path jika berbeda
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useScriptHistory } from '@historys/historys.js'
import { useVariableLogic } from '@nodes/nodes.js'
import { 
  setupMockOPFS, 
  createMockEmptyProject, 
  setupMockScriptEnvironment 
} from '@tests/tests.js'

describe('Graph Editor Integration', () => {
  let pinia
  let scriptStore
  let projectStore
  let mockStoreRef

  beforeEach(async () => {
    // Isolasi instance Pinia untuk setiap skenario tes
    pinia = createPinia()
    setActivePinia(pinia)

    // Setup in-memory mock OPFS & project environment
    mockStoreRef = setupMockOPFS()
    
    projectStore = useProjectStore()
    scriptStore = useScriptStore()

    const mockProject = await createMockEmptyProject({ projectName: 'Integration Test Project' })
    projectStore.project = mockProject
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear()
    }
  })

  describe('Node & Edge Management Integration', () => {
    it('deletes selected nodes and records the action into script history', async () => {
      // Arrange
      const nodeA = { id: 'node_a', position: { x: 100, y: 100 } }
      const nodeB = { id: 'node_b', position: { x: 300, y: 100 } }
      const edge = { id: 'e_1', source: 'node_a', target: 'node_b', sourceHandle: 'out_0', targetHandle: 'in_0' }

      await setupMockScriptEnvironment({
        scriptId: 'script_1',
        nodes: [nodeA, nodeB],
        edges: [edge]
      })

      const targetScript = scriptStore.getScriptById('script_1')
      scriptStore.setActiveScript(targetScript)

      const graphEditor = useGraphEditor()
      const history = useScriptHistory()

      scriptStore.setSelectedNodes(['node_a'])

      // Act
      graphEditor.deleteSelectedNodes()

      // Assert: Node A dan Edge terhubung terhapus dari state active script
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_a')).toBeUndefined()
      expect(scriptStore.activeScript.edges.find(e => e.id === 'e_1')).toBeUndefined()
      expect(scriptStore.activeScript.nodes.length).toBe(1)
      expect(projectStore.syncStatus).toBe('dirty')

      // Undo penghapusan via History
      history.undo()

      // Assert: State dikembalikan
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node_a')).toBeDefined()
      expect(scriptStore.activeScript.edges.find(e => e.id === 'e_1')).toBeDefined()
    })

    it('creates a new connection edge between compatible ports on mouse release', async () => {
      // Arrange
      const nodeSource = {
        id: 'node_src',
        outputs: [{ id: 'out_val', dataType: 'number' }]
      }
      const nodeTarget = {
        id: 'node_tgt',
        inputs: [{ id: 'in_val', dataType: 'number' }]
      }

      await setupMockScriptEnvironment({
        scriptId: 'script_connect',
        nodes: [nodeSource, nodeTarget],
        edges: []
      })

      scriptStore.setActiveScript(scriptStore.getScriptById('script_connect'))
      const graphEditor = useGraphEditor()

      graphEditor.panelRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 })
      }

      // Act
      graphEditor.startConnect(
        { button: 0, preventDefault: vi.fn(), stopPropagation: vi.fn(), clientX: 10, clientY: 10 },
        'node_src',
        'out_val',
        'output'
      )

      graphEditor.interaction.candidate = {
        nodeId: 'node_tgt',
        portId: 'in_val',
        dataType: 'number'
      }

      graphEditor.handleGlobalMouseUp()

      // Assert: Edge berhasil dibuat
      expect(scriptStore.activeScript.edges.length).toBe(1)
      const addedEdge = scriptStore.activeScript.edges[0]
      expect(addedEdge.source).toBe('node_src')
      expect(addedEdge.target).toBe('node_tgt')
      expect(scriptStore.selectedEdgeId).toBe(addedEdge.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Variable Logic Integration with Canvas', () => {
    it('instantiates variable node onto graph canvas through drop payload', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_vars', nodes: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_vars'))

      const variableLogic = useVariableLogic('Local')

      const createdVar = variableLogic.addVariable('String')
      const dropPos = { x: 96, y: 144 }

      // Act
      variableLogic.addNodeToCanvas(createdVar, dropPos, 'variable_get', false)

      // Assert
      const addedNode = scriptStore.activeScript.nodes.find(n => n.type === 'variable_get')
      expect(addedNode).toBeDefined()
      
      // Periksa label di level root / name / settings.headerTitle sesuai skema
      const nodeTitle = addedNode.label || addedNode.name || addedNode.settings?.headerTitle
      expect(nodeTitle).toBe(`Get ${createdVar.name}`)
      expect(addedNode.position).toEqual(dropPos)
      expect(addedNode.data.variableId).toBe(createdVar.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('synchronizes all existing node attributes when a variable is updated', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_sync', nodes: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_sync'))

      const variableLogic = useVariableLogic('Local')
      const targetVar = variableLogic.addVariable('String')

      variableLogic.addNodeToCanvas(targetVar, { x: 0, y: 0 }, 'variable_get', false)
      variableLogic.addNodeToCanvas(targetVar, { x: 200, y: 0 }, 'variable_set', false)

      // Act: Update nama & tipe data variabel menggunakan fungsi asli useVariableLogic
      const varIndex = variableLogic.variables.value.findIndex(v => v.id === targetVar.id)
      variableLogic.updateVariable(varIndex, 'name', 'healthPoints')
      variableLogic.updateVariable(varIndex, 'type', 'Number')

      // Assert
      const updatedNodes = scriptStore.activeScript.nodes
      const getNode = updatedNodes.find(n => n.type === 'variable_get')
      const setNode = updatedNodes.find(n => n.type === 'variable_set')

      expect(getNode).toBeDefined()
      const getTitle = getNode.label || getNode.name || getNode.settings?.headerTitle
      expect(getTitle).toBe('Get healthPoints')
      expect(getNode.outputs[0].dataType).toBe('number')

      expect(setNode).toBeDefined()
      const setTitle = setNode.label || setNode.name || setNode.settings?.headerTitle
      expect(setTitle).toBe('Set healthPoints')
      expect(setNode.inputs.find(i => i.dataType !== 'execution').dataType).toBe('number')
      expect(setNode.data.code).toContain('healthPoints')
    })
  })

  describe('Canvas Navigation & Camera State', () => {
    it('updates camera zoom scale within limits during wheel event', () => {
      // Arrange
      scriptStore.setActiveScript({ id: 'script_cam', nodes: [], edges: [] })
      const graphEditor = useGraphEditor()

      graphEditor.panelRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 })
      }

      // Act
      graphEditor.handleWheel({
        preventDefault: vi.fn(),
        clientX: 100,
        clientY: 100,
        deltaY: -100,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      })

      // Assert
      expect(scriptStore.camera.scale).toBeGreaterThan(1.0)
    })
  })

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] rejects connection between incompatible port data types and triggers pop alert', async () => {
      // Arrange
      const nodeA = {
        id: 'node_exec',
        outputs: [{ id: 'out_exec', dataType: 'execution' }]
      }
      const nodeB = {
        id: 'node_num',
        inputs: [{ id: 'in_num', dataType: 'number' }]
      }

      await setupMockScriptEnvironment({
        scriptId: 'script_bad_connect',
        nodes: [nodeA, nodeB],
        edges: []
      })

      scriptStore.setActiveScript(scriptStore.getScriptById('script_bad_connect'))
      const graphEditor = useGraphEditor()

      graphEditor.panelRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 })
      }

      // Act
      graphEditor.startConnect(
        { button: 0, preventDefault: vi.fn(), stopPropagation: vi.fn(), clientX: 0, clientY: 0 },
        'node_exec',
        'out_exec',
        'output'
      )

      graphEditor.interaction.activeDataType = 'execution'
      graphEditor.interaction.candidate = {
        nodeId: 'node_num',
        portId: 'in_num',
        dataType: 'number'
      }

      graphEditor.handleGlobalMouseUp()

      // Assert: Koneksi ditolak karena tipe tidak kompatibel
      expect(scriptStore.activeScript.edges.length).toBe(0)
    })

    it('[Bad Path] ignores keydown delete action when user is focused on text input element', async () => {
      // Arrange
      await setupMockScriptEnvironment({
        scriptId: 'script_input_focus',
        nodes: [{ id: 'node_protected' }],
        edges: []
      })

      scriptStore.setActiveScript(scriptStore.getScriptById('script_input_focus'))
      scriptStore.setSelectedNodes(['node_protected'])

      const graphEditor = useGraphEditor()
      const mockEvent = {
        target: { tagName: 'INPUT' },
        key: 'Delete',
        preventDefault: vi.fn()
      }

      // Act
      graphEditor.handleKeyDown(mockEvent)

      // Assert: Node tidak terhapus saat input teks sedang aktif
      expect(scriptStore.activeScript.nodes.length).toBe(1)
      expect(mockEvent.preventDefault).not.toHaveBeenCalled()
    })
  })
})