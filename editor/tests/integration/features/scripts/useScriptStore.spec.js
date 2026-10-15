import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useOPFSActions } from '@opfs/opfs.js'

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: vi.fn()
  })
}))

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    reloadScene: vi.fn()
  }
}))

describe('Script Store Integration Test', () => {
  let opfsStoreRef

  beforeEach(async () => {
    setActivePinia(createPinia())
    opfsStoreRef = setupMockOPFS()

    await createMockEmptyProject({
      projectName: 'Test Script Project',
      description: 'Project for ScriptStore integration testing'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    if (opfsStoreRef?.store) {
      opfsStoreRef.store.clear()
    }
  })

  describe('Canvas Node Management and Internal Script State Integration', () => {
    it('adds new node to active script, updates selection state, and marks project as dirty', () => {
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'script-1', name: 'PlayerController', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      projectStore.syncStatus = 'synced'

      scriptStore.addNodeToActive({
        type: 'test_node',
        position: { x: 100, y: 150 },
        settings: { headerTitle: 'Test Node' }
      })

      expect(scriptStore.activeScript.nodes).toHaveLength(1)
      const createdNode = scriptStore.activeScript.nodes[0]
      expect(createdNode.settings.headerTitle).toBe('Test Node')
      expect(scriptStore.selectedNodeId).toBe(createdNode.id)
      expect(scriptStore.selectedNodeIds).toContain(createdNode.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('connects edges between nodes and automatically cleans up edges when node is removed', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-1', name: 'LogicScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({ id: 'node-A', type: 'source' })
      scriptStore.addNodeToActive({ id: 'node-B', type: 'target' })

      scriptStore.addEdgeToActive({
        source: 'node-A',
        sourceHandle: 'out_1',
        target: 'node-B',
        targetHandle: 'in_1'
      })

      expect(scriptStore.activeScript.edges).toHaveLength(1)
      expect(scriptStore.isInputConnected('node-B', 'in_1')).toBe(true)

      scriptStore.removeNodeFromActive('node-A')

      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node-A')).toBeUndefined()
      expect(scriptStore.activeScript.edges).toHaveLength(0)
      expect(scriptStore.isInputConnected('node-B', 'in_1')).toBe(false)
    })

    it('manages multi-node selection and synchronizes selectedNode and selectedNodes getters', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-sel', name: 'SelectionScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({ id: 'node-1', type: 'test' })
      scriptStore.addNodeToActive({ id: 'node-2', type: 'test' })

      expect(scriptStore.selectedNodeId).toBe('node-2')
      expect(scriptStore.selectedNode?.id).toBe('node-2')

      scriptStore.toggleNodeSelection('node-1')
      expect(scriptStore.selectedNodeIds).toHaveLength(2)
      expect(scriptStore.selectedNodeId).toBeNull()
      expect(scriptStore.selectedNode).toBeNull()
      expect(scriptStore.selectedNodes).toHaveLength(2)

      scriptStore.toggleNodeSelection('node-2')
      expect(scriptStore.selectedNodeIds).toEqual(['node-1'])
      expect(scriptStore.selectedNodeId).toBe('node-1')
      expect(scriptStore.selectedNode?.id).toBe('node-1')
    })

    it('updates node properties (data & settings) partially with updateNodeInActive', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-upd', name: 'UpdateScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'node-target',
        type: 'test',
        settings: { headerTitle: 'Initial', headerColor: '#ffffff' },
        data: { a: 1, b: 2 }
      })

      scriptStore.updateNodeInActive('node-target', {
        settings: { headerTitle: 'Updated Title' },
        data: { b: 20, c: 30 }
      })

      const node = scriptStore.activeScript.nodes[0]
      expect(node.settings.headerTitle).toBe('Updated Title')
      expect(node.settings.headerColor).toBe('#ffffff')
      expect(node.data).toMatchObject({ a: 1, b: 20, c: 30 })
    })

    it('updates edge modifier and saves changes to active script', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-mod', name: 'ModifierScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addEdgeToActive({
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        modifier: { condition: 'true' }
      })

      scriptStore.updateEdgeModifier('edge-1', { label: 'Go Next' })

      const edge = scriptStore.activeScript.edges[0]
      expect(edge.modifier.condition).toBe('true')
      expect(edge.modifier.label).toBe('Go Next')
    })
  })

  describe('Dynamic Port Management (Sequential & Property Modes)', () => {
    it('adds and removes input ports on sequential nodes and cascades edge deletion', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-dynamic', name: 'DynamicScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'dyn-node',
        type: 'custom_dynamic',
        dynamicMode: 'sequential',
        inputs: []
      })
      scriptStore.addNodeToActive({
        id: 'source-node',
        type: 'source',
        outputs: [{ id: 'out_1', label: 'Out' }]
      })

      scriptStore.addNodePort('dyn-node', 'input', {
        id: 'v0',
        label: 'Param 1',
        dataType: 'number'
      })
      scriptStore.addNodePort('dyn-node', 'input', {
        id: 'v1',
        label: 'Param 2',
        dataType: 'number'
      })

      expect(scriptStore.activeScript.nodes.find(n => n.id === 'dyn-node').inputs).toHaveLength(2)

      scriptStore.addEdgeToActive({
        source: 'source-node',
        sourceHandle: 'out_1',
        target: 'dyn-node',
        targetHandle: 'v1'
      })
      expect(scriptStore.activeScript.edges).toHaveLength(1)

      scriptStore.removeNodePort('dyn-node', 'input', 'v1')

      const updatedNode = scriptStore.activeScript.nodes.find(n => n.id === 'dyn-node')
      expect(updatedNode.inputs).toHaveLength(1)
      expect(updatedNode.inputs[0].id).toBe('v0')
      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })

    it('removes all input ports on inputProperty node until empty', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-prop', name: 'PropertyScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'prop-node',
        type: 'get_transform',
        dynamicMode: 'inputProperty',
        inputs: []
      })

      scriptStore.addNodePort('prop-node', 'input', {
        id: 'pos_x',
        label: 'Position X',
        dataType: 'number'
      })

      expect(scriptStore.activeScript.nodes.find(n => n.id === 'prop-node').inputs).toHaveLength(1)

      scriptStore.removeNodePort('prop-node', 'input', 'pos_x')
      const updatedNode = scriptStore.activeScript.nodes.find(n => n.id === 'prop-node')
      expect(updatedNode.inputs).toHaveLength(0)
    })

    it('adds and removes output ports on node with outputProperty dynamicMode', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-dyn-out', name: 'DynOutScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'dyn-out-node',
        type: 'custom_output',
        dynamicMode: 'outputProperty',
        outputs: []
      })

      scriptStore.addNodePort('dyn-out-node', 'output', {
        id: 'pos_x',
        label: 'Position X',
        dataType: 'number'
      })

      expect(scriptStore.activeScript.nodes.find(n => n.id === 'dyn-out-node').outputs).toHaveLength(1)

      scriptStore.removeNodePort('dyn-out-node', 'output', 'pos_x')
      const updatedNode = scriptStore.activeScript.nodes.find(n => n.id === 'dyn-out-node')
      expect(updatedNode.outputs).toHaveLength(0)
    })

    it('ignores port addition if node has none dynamicMode (static node)', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-static', name: 'StaticScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'static-node',
        type: 'custom_static',
        dynamicMode: 'none',
        inputs: [],
        outputs: []
      })

      scriptStore.addNodePort('static-node', 'input', { id: 'in_1', label: 'In' })
      scriptStore.addNodePort('static-node', 'output', { id: 'out_1', label: 'Out' })

      const node = scriptStore.activeScript.nodes.find(n => n.id === 'static-node')
      expect(node.inputs).toHaveLength(0)
      expect(node.outputs).toHaveLength(0)
    })
  })

  describe('OPFS Storage Save & Delete Integration', () => {
    it('saves single script and creates structured scripts.json metadata in OPFS', async () => {
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()

      const activeProjId = workspaceStore.activeProjectId

      scriptStore.initScripts([
        { id: 'script-101', name: 'MovementScript', type: 'component', folderId: null }
      ])

      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])

      const { scriptsDir, workspacesDir } = await scriptStore._getScriptDirectories()
      
      const scriptFileHandle = await scriptsDir.getFileHandle('script-101.json')
      const scriptFile = await scriptFileHandle.getFile()
      const scriptContent = JSON.parse(await scriptFile.text())

      expect(scriptContent.id).toBe('script-101')
      expect(scriptContent.name).toBe('MovementScript')
      expect(scriptContent.projectId).toBeUndefined()

      const metaFileHandle = await workspacesDir.getFileHandle('scripts.json')
      const metaFile = await metaFileHandle.getFile()
      const metaContent = JSON.parse(await metaFile.text())

      expect(metaContent).toEqual([
        {
          id: 'script-101',
          projectId: activeProjId,
          folderId: null,
          name: 'MovementScript',
          type: 'component'
        }
      ])
    })

    it('removes script from RAM state and deletes physical file in OPFS', async () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-to-delete', name: 'TempScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])
      const { scriptsDir } = await scriptStore._getScriptDirectories()

      expect(await scriptsDir.getFileHandle('script-to-delete.json')).toBeDefined()

      await scriptStore.removeScript('script-to-delete')

      expect(scriptStore.scripts).toHaveLength(0)
      expect(scriptStore.activeScript).toBeNull()
      expect(scriptStore.selectedNodeId).toBeNull()

      await expect(scriptsDir.getFileHandle('script-to-delete.json')).rejects.toThrow()
    })

    it('aligns all scripts in RAM to OPFS when syncAllScriptsToOPFS is called', async () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 's-1', name: 'Script Alpha' },
        { id: 's-2', name: 'Script Beta' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      
      scriptStore.addNodeToActive({ id: 'alpha-node', type: 'action' })

      await scriptStore.syncAllScriptsToOPFS()

      const { scriptsDir } = await scriptStore._getScriptDirectories()
      
      const file1Handle = await scriptsDir.getFileHandle('s-1.json')
      const file1Data = JSON.parse(await (await file1Handle.getFile()).text())
      
      const file2Handle = await scriptsDir.getFileHandle('s-2.json')
      const file2Data = JSON.parse(await (await file2Handle.getFile()).text())

      expect(file1Data.nodes).toHaveLength(1)
      expect(file1Data.nodes[0].id).toBe('alpha-node')
      expect(file2Data.id).toBe('s-2')
    })

    it('moves script folder and synchronizes OPFS metadata via moveScript', async () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-move', name: 'MoveMe', folderId: null }
      ])

      const success = await scriptStore.moveScript('script-move', 'folder-target-123')
      expect(success).toBe(true)
      expect(scriptStore.scripts[0].folderId).toBe('folder-target-123')

      const { workspacesDir } = await scriptStore._getScriptDirectories()
      const metaFile = await (await workspacesDir.getFileHandle('scripts.json')).getFile()
      const meta = JSON.parse(await metaFile.text())
      expect(meta[0].folderId).toBe('folder-target-123')
    })
  })

  describe('Cross-Store Integration (ProjectStore & ScriptStore via OPFS)', () => {
    it('fully loads scripts data from OPFS storage when projectStore.loadProject is called', async () => {
      const projectStore = useProjectStore()
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const opfs = useOPFSActions()

      const createdProject = await createMockEmptyProject({
        projectName: 'Existing Project'
      })
      const projectId = createdProject.id

      workspaceStore.setProjectId(projectId)

      const { scriptsDir, workspacesDir } = await scriptStore._getScriptDirectories()
      
      const mockScriptMeta = [
        { id: 'sc-init-1', projectId, folderId: null, name: 'OPFS Loaded Script', type: 'component' }
      ]
      const mockScriptData = {
        id: 'sc-init-1',
        name: 'OPFS Loaded Script',
        type: 'component',
        nodes: [{ id: 'n1', type: 'start' }],
        edges: []
      }

      await opfs.writeFileToHandle(workspacesDir, 'scripts.json', JSON.stringify(mockScriptMeta))
      await opfs.writeFileToHandle(scriptsDir, 'sc-init-1.json', JSON.stringify(mockScriptData))

      await projectStore.loadProject(projectId)

      expect(scriptStore.scripts).toHaveLength(1)
      expect(scriptStore.scripts[0].id).toBe('sc-init-1')
      expect(scriptStore.scripts[0].name).toBe('OPFS Loaded Script')
      expect(scriptStore.scripts[0].nodes).toHaveLength(1)
      expect(projectStore.syncStatus).toBe('synced')
    })

    it('maintains state consistency and saves script structure when saveProjectToServer is executed', async () => {
      const projectStore = useProjectStore()
      const scriptStore = useScriptStore()

      const createdProject = await createMockEmptyProject({
        projectName: 'Project To Save'
      })
      await projectStore.loadProject(createdProject.id)

      scriptStore.initScripts([
        { id: 'sc-save-1', name: 'Save Target Script' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      scriptStore.addNodeToActive({ id: 'save-node', type: 'output' })

      expect(projectStore.syncStatus).toBe('dirty')

      await projectStore.saveProjectToServer()

      expect(projectStore.syncStatus).toBe('synced')
      
      const { scriptsDir } = await scriptStore._getScriptDirectories()
      const savedHandle = await scriptsDir.getFileHandle('sc-save-1.json')
      const savedContent = JSON.parse(await (await savedHandle.getFile()).text())

      expect(savedContent.nodes).toHaveLength(1)
      expect(savedContent.nodes[0].id).toBe('save-node')
    })
  })

  describe('[Bad Path] Error Handling & Unexpected Scenarios', () => {
    it('[Bad Path] handles OPFS read failures in isolation without corrupting RAM state', async () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-ghost', name: 'GhostScript' }
      ])

      await expect(scriptStore.removeScript('script-ghost')).resolves.not.toThrow()
      expect(scriptStore.getScriptById('script-ghost')).toBeUndefined()
    })

    it('[Bad Path] ignores adding edge to same node (self-loop boundary)', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-loop', name: 'LoopScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      scriptStore.addNodeToActive({ id: 'node-same', type: 'process' })

      scriptStore.addEdgeToActive({
        source: 'node-same',
        sourceHandle: 'out',
        target: 'node-same',
        targetHandle: 'in'
      })

      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })

    it('[Bad Path] makes no changes when removing port on unregistered node', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-port-err', name: 'PortErrScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      expect(() => {
        scriptStore.removeNodePort('non-existent-node', 'input', 'port-x')  
      }).not.toThrow()
    })

    it('[Bad Path] throws error on spawnNodeByType if blueprint type is not found in catalog', () => {
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-spawn', name: 'SpawnScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      expect(() => {
        scriptStore.spawnNodeByType('blueprint_unknown_123')
      }).toThrow('[ScriptStore] Blueprint type "blueprint_unknown_123" not found in catalog!')
    })
  })
})