import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// 1. Mock @nodes/nodes.js tanpa importOriginal untuk memutus sirkular import top-level
vi.mock('@nodes/nodes.js', () => {
  return {
    useNodeBlueprint: vi.fn(() => ({
      syncDynamicInputsAndCode: vi.fn()
    })),
    useVariableConfig: vi.fn(() => ({
      VAR_TYPES: { STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean', LIST: 'list', MAP: 'map' },
      VAR_COLORS: { string: '#F48FB1', number: '#64B5F6', boolean: '#E57373', list: '#4DD0E1', map: '#FF8A65' },
      getVarColor: (type) => '#64B5F6',
      isCollectionType: (type) => ['list', 'map'].includes(String(type).toLowerCase()),
      getDefaultValueForType: (type) => {
        const t = String(type).toLowerCase()
        if (t === 'string') return ''
        if (t === 'number') return 0
        if (t === 'boolean') return false
        if (t === 'list') return []
        if (t === 'map') return {}
        return null
      },
      sanitizeVariableValue: (val, type) => {
        const t = String(type).toLowerCase()
        if (t === 'list' && !Array.isArray(val)) return []
        if (t === 'map' && (typeof val !== 'object' || Array.isArray(val))) return {}
        return val
      }
    }))
  }
})

// 2. Mock UI alert composable
vi.mock('@composables/composables.js', () => ({
  usePopAlert: vi.fn(() => ({
    showPop: vi.fn()
  }))
}))

// Import modul setelah vi.mock terdefinisi
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useScriptHistory } from '@historys/historys.js'
import { useVariableLogic } from '@nodes/variable/composables/useVariableLogic.js'
import { 
  setupMockOPFS, 
  createMockEmptyProject, 
  setupMockScriptEnvironment 
} from '@tests/tests.js'

describe('useVariableLogic Integration', () => {
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

    const mockProject = await createMockEmptyProject({ projectName: 'Variable Logic Test Project' })
    projectStore.project = mockProject
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (mockStoreRef?.store) {
      mockStoreRef.store.clear()
    }
  })

  describe('Local Variable Scope Management', () => {
    it('creates local variable, updates script store state, and records history', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_local', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_local'))

      const variableLogic = useVariableLogic('Local')
      const history = useScriptHistory()

      // Act
      const newVar = variableLogic.addVariable('String')

      // Assert
      expect(scriptStore.activeScript.localVariables.length).toBe(1)
      expect(newVar.name).toBe('NewVar')
      expect(newVar.type).toBe('String')
      expect(newVar.defaultValue).toBe('')

      // Undo via history
      history.undo()
      expect(scriptStore.activeScript.localVariables.length).toBe(0)
    })

    it('prevents duplicate variable names by auto-incrementing naming counter', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_dup_names', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_dup_names'))

      const variableLogic = useVariableLogic('Local')

      // Act
      const var1 = variableLogic.addVariable('String')
      const var2 = variableLogic.addVariable('String')
      const var3 = variableLogic.addVariable('Number')

      // Assert
      expect(var1.name).toBe('NewVar')
      expect(var2.name).toBe('NewVar_1')
      expect(var3.name).toBe('NewVar_2')
      expect(scriptStore.activeScript.localVariables.length).toBe(3)
    })

    it('updates variable type, resets default value, and synchronizes with graph nodes', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_update_var', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_update_var'))

      const variableLogic = useVariableLogic('Local')
      const targetVar = variableLogic.addVariable('String')

      variableLogic.addNodeToCanvas(targetVar, { x: 0, y: 0 }, 'variable_get')
      variableLogic.addNodeToCanvas(targetVar, { x: 200, y: 0 }, 'variable_set')

      // Act
      const varIdx = variableLogic.variables.value.findIndex(v => v.id === targetVar.id)
      variableLogic.updateVariable(varIdx, 'name', 'moveSpeed')
      variableLogic.updateVariable(varIdx, 'type', 'Number')

      // Assert: Store updated
      const updatedVar = scriptStore.activeScript.localVariables[0]
      expect(updatedVar.name).toBe('moveSpeed')
      expect(updatedVar.type).toBe('number')
      expect(updatedVar.defaultValue).toBe(0)

      // Assert: Nodes synchronized & Project marked dirty via syncNodesWithVariable -> saveActiveScript
      const nodes = scriptStore.activeScript.nodes
      const getNode = nodes.find(n => n.type === 'variable_get')
      const setNode = nodes.find(n => n.type === 'variable_set')

      const getTitle = getNode.label || getNode.name || getNode.settings?.headerTitle
      const setTitle = setNode.label || setNode.name || setNode.settings?.headerTitle

      expect(getTitle).toBe('Get moveSpeed')
      expect(getNode.outputs[0].dataType).toBe('number')

      expect(setTitle).toBe('Set moveSpeed')
      expect(setNode.inputs.find(i => i.dataType !== 'execution').dataType).toBe('number')
      expect(setNode.data.code).toContain('moveSpeed')
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Global Variable Scope Management', () => {
    it('manages global variables directly inside project store', () => {
      // Arrange
      projectStore.project.globalVariables = []
      const globalLogic = useVariableLogic('Global')

      // Act
      const globalVar = globalLogic.addVariable('Boolean')

      // Assert
      expect(projectStore.activeProject.globalVariables.length).toBe(1)
      expect(globalVar.name).toBe('NewVar')
      expect(globalVar.type).toBe('Boolean')
      expect(globalVar.defaultValue).toBe(false)
      expect(projectStore.syncStatus).toBe('dirty')

      // Act: Delete global var
      globalLogic.deleteVariable(0)
      expect(projectStore.activeProject.globalVariables.length).toBe(0)
    })
  })

  describe('Collection Operations (List & Map)', () => {
    it('performs CRUD operations on list type default values', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_list', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_list'))

      const variableLogic = useVariableLogic('Local')
      variableLogic.addVariable('List')

      // Act & Assert
      variableLogic.addListItem(0, 'string')
      variableLogic.addListItem(0, 'number')
      expect(scriptStore.activeScript.localVariables[0].defaultValue).toEqual(['', 0])

      variableLogic.updateListItem(0, 0, 'FirstItem')
      expect(scriptStore.activeScript.localVariables[0].defaultValue[0]).toBe('FirstItem')

      variableLogic.removeListItem(0, 1)
      expect(scriptStore.activeScript.localVariables[0].defaultValue).toEqual(['FirstItem'])
    })

    it('performs set and remove entries on map type default values', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_map', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_map'))

      const variableLogic = useVariableLogic('Local')
      variableLogic.addVariable('Map')

      // Act & Assert
      variableLogic.setMapEntry(0, 'maxHP', 100)
      variableLogic.setMapEntry(0, 'atk', 25)
      expect(scriptStore.activeScript.localVariables[0].defaultValue).toEqual({ maxHP: 100, atk: 25 })

      variableLogic.removeMapEntry(0, 'atk')
      expect(scriptStore.activeScript.localVariables[0].defaultValue).toEqual({ maxHP: 100 })
    })
  })

  describe('Canvas Node Creation & Drag payload', () => {
    it('prepares correct dataTransfer payload when drag starts', () => {
      // Arrange
      const variableLogic = useVariableLogic('Local')
      const mockVariable = { id: 'v_123', name: 'playerHealth', type: 'Number' }
      const mockDataTransfer = {
        data: {},
        setData(key, val) { this.data[key] = val },
        effectAllowed: ''
      }
      const mockEvent = { dataTransfer: mockDataTransfer }

      // Act
      variableLogic.onDragStart(mockEvent, mockVariable, 'variable_get')

      // Assert
      expect(mockDataTransfer.effectAllowed).toBe('copy')
      const payload = JSON.parse(mockDataTransfer.data['application/script-variable'])
      expect(payload.id).toBe('v_123')
      expect(payload.name).toBe('playerHealth')
      expect(payload.scope).toBe('Local')
      expect(payload.actionType).toBe('variable_get')
    })

    it('calculates screen-to-world position when dropping variable onto canvas with active camera', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_cam_drop', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_cam_drop'))

      scriptStore.camera = { x: 100, y: 50, scale: 2 }

      const variableLogic = useVariableLogic('Local')
      const createdVar = variableLogic.addVariable('Number')

      const screenPos = { x: 300, y: 250 }

      // Act
      variableLogic.addNodeToCanvas(createdVar, screenPos, 'variable_get', true)

      // Assert
      const addedNode = scriptStore.activeScript.nodes.find(n => n.type === 'variable_get')
      expect(addedNode).toBeDefined()
      expect(addedNode.position).toEqual({ x: 100, y: 100 })
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Negative & Edge Cases', () => {
    it('[Bad Path] handles map entry insertion gracefully when key is empty or whitespace', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_empty_key', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_empty_key'))

      const variableLogic = useVariableLogic('Local')
      variableLogic.addVariable('Map')

      // Act
      variableLogic.setMapEntry(0, '', 'InvalidValue')
      variableLogic.setMapEntry(0, '   ', 'InvalidValue2')

      // Assert
      expect(scriptStore.activeScript.localVariables[0].defaultValue).toEqual({})
    })

    it('[Bad Path] ignores updateVariable calls when index is out of bounds', async () => {
      // Arrange
      await setupMockScriptEnvironment({ scriptId: 'script_out_bounds', localVariables: [] })
      scriptStore.setActiveScript(scriptStore.getScriptById('script_out_bounds'))

      const variableLogic = useVariableLogic('Local')

      // Act & Assert
      expect(() => {
        variableLogic.updateVariable(99, 'name', 'NonExistent')
      }).not.toThrow()
    })
  })
})