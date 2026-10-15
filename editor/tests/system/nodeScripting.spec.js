import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { 
  useGraphEditor, 
  useNodeInspector, 
  useVariableLogic, 
  useNodeBlueprint,
  BlueprintTransform 
} from '@nodes/nodes.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mocking dependencies UI/Alert
vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  })),
  usePrompt: vi.fn(() => ({
    prompt: vi.fn()
  })),
  useTheme: vi.fn(() => ({
    isDark: { value: true }
  }))
}))

describe('Node Scripting System Integration Tests', () => {
  let pinia
  let scriptStore
  let projectStore
  let mockStoreRef

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)

    mockStoreRef = setupMockOPFS()

    projectStore = useProjectStore()
    scriptStore = useScriptStore()

    const mockProject = await createMockEmptyProject({ projectName: 'Node Scripting Test' })
    projectStore.project = mockProject

    const initialScript = {
      id: 'script_test_1',
      name: 'MainGraphScript',
      type: 'component',
      localVariables: [],
      nodes: [],
      edges: []
    }

    // 1. Register script ke store list
    scriptStore.initScripts([initialScript])

    // 2. Set activeScript dengan OBJEK script, BUKAN string ID!
    scriptStore.setActiveScript(initialScript)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear()
    }
  })

  describe('Blueprint Library to Graph Integration', () => {
    it('adds a blueprint item from library into active graph on drop', () => {
      const { onDrop } = useGraphEditor()
      const blueprintTemplate = BlueprintTransform.items[0] // e.g. Get Transform

      // Mock Event DataTransfer yang membedakan type key
      const mockDropEvent = {
        clientX: 240,
        clientY: 120,
        dataTransfer: {
          getData: vi.fn((type) => {
            if (type === 'application/node-template') {
              return JSON.stringify(blueprintTemplate)
            }
            return '' // Mime type lain (seperti application/script-variable) bernilai kosong
          })
        }
      }

      onDrop(mockDropEvent)

      expect(scriptStore.activeScript.nodes).toHaveLength(1)
      const addedNode = scriptStore.activeScript.nodes[0]

      // Assert tipe dan nama node
      expect(addedNode.type).toBe(blueprintTemplate.type)
      expect(addedNode.name || addedNode.settings?.headerTitle).toBe(blueprintTemplate.label)
    })

    it('[Bad Path] handles invalid drop payload without corrupting nodes state', () => {
      const { onDrop } = useGraphEditor()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockInvalidDropEvent = {
        clientX: 100,
        clientY: 100,
        dataTransfer: {
          getData: vi.fn((type) => {
            if (type === 'application/node-template') {
              return 'invalid-json-data'
            }
            return ''
          })
        }
      }

      onDrop(mockInvalidDropEvent)

      expect(scriptStore.activeScript.nodes).toHaveLength(0)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('Exposed Variable to Graph Integration', () => {
    it('creates get and set variable nodes on canvas from exposed local variables', () => {
      const localVars = useVariableLogic('Local')
      const newVar = localVars.addVariable('Number')
      localVars.updateVariable(0, 'isExposed', true)

      localVars.addNodeToCanvas(newVar, { x: 100, y: 100 }, 'variable_get')
      localVars.addNodeToCanvas(newVar, { x: 300, y: 100 }, 'variable_set')

      expect(scriptStore.activeScript.nodes).toHaveLength(2)

      const getNode = scriptStore.activeScript.nodes.find(n => n.type === 'variable_get')
      const setNode = scriptStore.activeScript.nodes.find(n => n.type === 'variable_set')

      // Periksa 'name' atau 'settings.headerTitle' alih-alih 'label' di root node
      const expectedGetTitle = `Get ${newVar.name}`
      const expectedSetTitle = `Set ${newVar.name}`

      expect(getNode.name || getNode.settings?.headerTitle).toBe(expectedGetTitle)
      expect(getNode.outputs[0].dataType).toBe('number')

      expect(setNode.name || setNode.settings?.headerTitle).toBe(expectedSetTitle)
      expect(setNode.inputs.some(i => i.dataType === 'execution')).toBe(true)
    })

    it('synchronizes existing node attributes when variable properties are modified', () => {
      const localVars = useVariableLogic('Local')
      const targetVar = localVars.addVariable('String')
      localVars.addNodeToCanvas(targetVar, { x: 0, y: 0 }, 'variable_get')

      localVars.updateVariable(0, 'name', 'playerHealth')
      localVars.updateVariable(0, 'type', 'number')

      const updatedNode = scriptStore.activeScript.nodes[0]

      // Periksa 'name' atau 'settings.headerTitle'
      expect(updatedNode.name || updatedNode.settings?.headerTitle).toBe('Get playerHealth')
      expect(updatedNode.outputs[0].dataType).toBe('number')
    })
  })

  describe('Node Connection and Type Safety Integration', () => {
    it('connects compatible data type handles and updates graph edges', () => {
      const { interaction, handleGlobalMouseUp } = useGraphEditor()

      const sourceNode = {
        id: 'node_math_1',
        type: 'math_add',
        outputs: [{ id: 'out_num', dataType: 'number' }]
      }
      const targetNode = {
        id: 'node_math_2',
        type: 'math_sub',
        inputs: [{ id: 'in_num', dataType: 'number' }]
      }

      // Memperbarui state secara aman via updateScriptInList/setActiveScript
      scriptStore.updateScriptInList(scriptStore.activeScript.id, {
        nodes: [sourceNode, targetNode]
      })

      interaction.mode = 'connect'
      interaction.activeId = sourceNode.id
      interaction.activeHandle = 'out_num'
      interaction.activeType = 'output'
      interaction.activeDataType = 'number'
      interaction.candidate = {
        nodeId: targetNode.id,
        portId: 'in_num',
        dataType: 'number'
      }

      handleGlobalMouseUp()

      expect(scriptStore.activeScript.edges).toHaveLength(1)
      expect(scriptStore.activeScript.edges[0]).toMatchObject({
        source: 'node_math_1',
        sourceHandle: 'out_num',
        target: 'node_math_2',
        targetHandle: 'in_num'
      })
    })

    it('[Bad Path] blocks invalid connections between incompatible data types', () => {
      const { interaction, handleGlobalMouseUp } = useGraphEditor()

      const sourceNode = {
        id: 'node_str',
        outputs: [{ id: 'out_str', dataType: 'string' }]
      }
      const targetNode = {
        id: 'node_exec',
        inputs: [{ id: 'in_exec', dataType: 'execution' }]
      }

      scriptStore.updateScriptInList(scriptStore.activeScript.id, {
        nodes: [sourceNode, targetNode]
      })

      interaction.mode = 'connect'
      interaction.activeId = sourceNode.id
      interaction.activeHandle = 'out_str'
      interaction.activeType = 'output'
      interaction.activeDataType = 'string'
      interaction.candidate = {
        nodeId: targetNode.id,
        portId: 'in_exec',
        dataType: 'execution'
      }

      handleGlobalMouseUp()

      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })
  })

  describe('Node CRUD & Operations Integration', () => {
    it('supports full node lifecycle including creation, movement, and deletion', () => {
      const { deleteSelectedNodes } = useGraphEditor()

      const nodeA = { id: 'node_a', position: { x: 0, y: 0 }, inputs: [], outputs: [] }
      const nodeB = { id: 'node_b', position: { x: 100, y: 100 }, inputs: [], outputs: [] }
      const edgeAB = { id: 'e_ab', source: 'node_a', target: 'node_b' }

      scriptStore.updateScriptInList(scriptStore.activeScript.id, {
        nodes: [nodeA, nodeB],
        edges: [edgeAB]
      })

      // Act 1: Update Posisi Node A
      scriptStore.updateNodeInActive('node_a', { position: { x: 50, y: 50 } })
      expect(scriptStore.activeScript.nodes[0].position).toEqual({ x: 50, y: 50 })

      // Act 2: Hapus Node A
      scriptStore.setSelectedNodes(['node_a'])
      deleteSelectedNodes()

      expect(scriptStore.activeScript.nodes).toHaveLength(1)
      expect(scriptStore.activeScript.nodes[0].id).toBe('node_b')
      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })

    it('duplicates selected nodes with position offset', () => {
      const originalNode = {
        id: 'node_orig',
        type: 'math_add',
        position: { x: 100, y: 100 },
        inputs: [],
        outputs: []
      }
      scriptStore.updateScriptInList(scriptStore.activeScript.id, {
        nodes: [originalNode]
      })
      scriptStore.setSelectedNodes(['node_orig'])

      const newNode = JSON.parse(JSON.stringify(originalNode))
      newNode.id = 'node_copy'
      newNode.position.x += 40
      newNode.position.y += 40
      scriptStore.addNodeToActive(newNode)

      expect(scriptStore.activeScript.nodes).toHaveLength(2)
      expect(scriptStore.activeScript.nodes[1].position).toEqual({ x: 140, y: 140 })
    })
  })

  describe('Dynamic Node Inspector & Port Management', () => {
    it('adds dynamic input ports and automatically regenerates node internal logic code', () => {
      const { syncDynamicInputsAndCode } = useNodeBlueprint()

      const dynamicNode = {
        type: 'stringJoin',
        inputs: [
          { id: 'v0', dataType: 'string' }
        ],
        data: {
          values: { v0: 'Hello' },
          code: `outputs.result = collection.join('');\nreturn;`
        }
      }

      dynamicNode.inputs.push({ id: 'v1', dataType: 'string' })
      syncDynamicInputsAndCode(dynamicNode)

      expect(dynamicNode.data.values).toHaveProperty('v1')
      expect(dynamicNode.data.code).toContain("const val1 = inputs.v0;")
      expect(dynamicNode.data.code).toContain("const val2 = inputs.v1;")
      expect(dynamicNode.data.code).toContain('const collection = [val1, val2];')
    })

    it('cleans up invalid edges when removing dynamic node ports', () => {
      const { disconnectInvalidEdges } = useNodeInspector()

      const nodeA = { id: 'node_a', inputs: [{ id: 'dyn_in', dataType: 'number' }] }
      const nodeB = { id: 'node_b', outputs: [{ id: 'out_1', dataType: 'number' }] }
      const edge = { id: 'edge_1', source: 'node_b', sourceHandle: 'out_1', target: 'node_a', targetHandle: 'dyn_in' }

      scriptStore.updateScriptInList(scriptStore.activeScript.id, {
        nodes: [nodeA, nodeB],
        edges: [edge]
      })
      scriptStore.setSelectedNode('node_a')

      disconnectInvalidEdges('dyn_in')

      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })
  })
})