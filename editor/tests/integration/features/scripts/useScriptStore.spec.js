import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js' // sesuaikan path helper
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useOPFSActions } from '@opfs/opfs.js'

// Mock composables & modules luar yang tidak menjadi target integrasi utama
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
    // 1. Reset Pinia Instance
    setActivePinia(createPinia())

    // 2. Setup In-Memory OPFS Environment
    opfsStoreRef = setupMockOPFS()

    // 3. Inisialisasi Proyek Kosong melalui Helper Integrasi
    await createMockEmptyProject({
      projectName: 'Test Script Project',
      description: 'Project for ScriptStore integration testing'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Integrasi Manajemen Node Canvas dan State internal Script', () => {
    it('menambahkan node baru ke active script dan memperbarui state pilihan serta menandai proyek dirty', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'script-1', name: 'PlayerController', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      projectStore.syncStatus = 'synced'

      // Act
      scriptStore.addNodeToActive({
        type: 'test_node',
        position: { x: 100, y: 150 },
        settings: { headerTitle: 'Test Node' }
      })

      // Assert
      expect(scriptStore.activeScript.nodes).toHaveLength(1)
      const createdNode = scriptStore.activeScript.nodes[0]
      expect(createdNode.settings.headerTitle).toBe('Test Node')
      expect(scriptStore.selectedNodeId).toBe(createdNode.id)
      expect(scriptStore.selectedNodeIds).toBeDefined()
      expect(scriptStore.selectedNodeIds).toContain(createdNode.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('menghubungkan edge antar node dan membersihkan edge secara otomatis jika node dihapus', () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-1', name: 'LogicScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({ id: 'node-A', type: 'source' })
      scriptStore.addNodeToActive({ id: 'node-B', type: 'target' })

      // Act: Tambah Edge
      scriptStore.addEdgeToActive({
        source: 'node-A',
        sourceHandle: 'out_1',
        target: 'node-B',
        targetHandle: 'in_1'
      })

      // Assert Edge Terbuat
      expect(scriptStore.activeScript.edges).toHaveLength(1)
      const edge = scriptStore.activeScript.edges[0]
      expect(scriptStore.isInputConnected('node-B', 'in_1')).toBe(true)

      // Act: Hapus Node A
      scriptStore.removeNodeFromActive('node-A')

      // Assert Cascade Delete Edge
      expect(scriptStore.activeScript.nodes.find(n => n.id === 'node-A')).toBeUndefined()
      expect(scriptStore.activeScript.edges).toHaveLength(0)
      expect(scriptStore.isInputConnected('node-B', 'in_1')).toBe(false)
    })

    it('mensinkronisasi dynamic inputs dan re-generate code ketika port dinamis ditambahkan', () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-dynamic', name: 'DynamicScript', nodes: [], edges: [] }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      scriptStore.addNodeToActive({
        id: 'dyn-node',
        type: 'custom_dynamic',
        allowDynamicInputs: true,
        inputs: []
      })

      // Act
      scriptStore.addNodePort('dyn-node', 'input', {
        label: 'Custom Param',
        dataType: 'number'
      })

      // Assert
      const targetNode = scriptStore.activeScript.nodes.find(n => n.id === 'dyn-node')
      expect(targetNode.inputs).toHaveLength(1)
      expect(targetNode.inputs[0].id).toBe('v0')
      expect(targetNode.data.values.v0).toBe(0)
      expect(targetNode.data.code).toContain('const val1 = inputs[\'Val 1\'];')
      expect(targetNode.data.code).toContain('const collection = [val1];')
    })
  })

  describe('Integrasi Simpan & Hapus dengan OPFS Storage', () => {
    it('menyimpan single script dan membuat metadata scripts.json secara terstruktur di OPFS', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const opfs = useOPFSActions()

      const activeProjId = workspaceStore.activeProjectId

      scriptStore.initScripts([
        { id: 'script-101', name: 'MovementScript', type: 'component', folderId: null }
      ])

      // Act
      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])

      // Assert File Script .json Terbuat di OPFS
      const { scriptsDir, workspacesDir } = await scriptStore._getScriptDirectories()
      
      const scriptFileHandle = await scriptsDir.getFileHandle('script-101.json')
      const scriptFile = await scriptFileHandle.getFile()
      const scriptContent = JSON.parse(await scriptFile.text())

      expect(scriptContent.id).toBe('script-101')
      expect(scriptContent.name).toBe('MovementScript')
      expect(scriptContent.projectId).toBeUndefined() // Dipastikan dibersihkan saat simpan

      // Assert Meta scripts.json Terbuat di OPFS Workspace
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

    it('menghapus script dari state RAM dan menghapus file fisik di OPFS', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-to-delete', name: 'TempScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      // Simpan terlebih dahulu ke OPFS
      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])
      const { scriptsDir } = await scriptStore._getScriptDirectories()

      // Pastikan file terbuat
      expect(await scriptsDir.getFileHandle('script-to-delete.json')).toBeDefined()

      // Act
      await scriptStore.removeScript('script-to-delete')

      // Assert State RAM bersih
      expect(scriptStore.scripts).toHaveLength(0)
      expect(scriptStore.activeScript).toBeNull()
      expect(scriptStore.selectedNodeId).toBeNull()

      // Assert File di OPFS terhapus
      await expect(scriptsDir.getFileHandle('script-to-delete.json')).rejects.toThrow(
        "File 'script-to-delete.json' tidak ditemukan di OPFS."
      )
    })

    it('menyelaraskan seluruh script di RAM ke OPFS saat syncAllScriptsToOPFS dipanggil', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 's-1', name: 'Script Alpha' },
        { id: 's-2', name: 'Script Beta' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      
      // Lakukan modifikasi pada activeScript di RAM
      scriptStore.addNodeToActive({ id: 'alpha-node', type: 'action' })

      // Act
      await scriptStore.syncAllScriptsToOPFS()

      // Assert
      const { scriptsDir } = await scriptStore._getScriptDirectories()
      
      const file1Handle = await scriptsDir.getFileHandle('s-1.json')
      const file1Data = JSON.parse(await (await file1Handle.getFile()).text())
      
      const file2Handle = await scriptsDir.getFileHandle('s-2.json')
      const file2Data = JSON.parse(await (await file2Handle.getFile()).text())

      expect(file1Data.nodes).toHaveLength(1)
      expect(file1Data.nodes[0].id).toBe('alpha-node')
      expect(file2Data.id).toBe('s-2')
    })
  })

  describe('Integrasi Antar-Store (ProjectStore & ScriptStore via OPFS)', () => {
    it('memuat data scripts dari storage OPFS secara penuh ketika projectStore.loadProject dipanggil', async () => {
      // Arrange
      const projectStore = useProjectStore()
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const opfs = useOPFSActions()

      // 1. Buat project mock awal
      const createdProject = await createMockEmptyProject({
        projectName: 'Existing Project'
      })
      const projectId = createdProject.id

      // 2. Set activeProjectId di workspaceStore AGAR _getScriptDirectories() mengarah ke ID proyek yang tepat
      workspaceStore.setProjectId(projectId)

      // 3. Dapatkan referensi direktori OPFS proyek yang benar
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

      // 4. Tulis file script dan metadata script ke OPFS
      await opfs.writeFileToHandle(workspacesDir, 'scripts.json', JSON.stringify(mockScriptMeta))
      await opfs.writeFileToHandle(scriptsDir, 'sc-init-1.json', JSON.stringify(mockScriptData))

      // Act: Load ulang project via ProjectStore
      await projectStore.loadProject(projectId)

      // Assert
      expect(scriptStore.scripts).toHaveLength(1)
      expect(scriptStore.scripts[0].id).toBe('sc-init-1')
      expect(scriptStore.scripts[0].name).toBe('OPFS Loaded Script')
      expect(scriptStore.scripts[0].nodes).toHaveLength(1)
      expect(projectStore.syncStatus).toBe('synced')
    })
    it('mempertahankan konsistensi state dan menyimpan struktur script saat saveProjectToServer dijalankan', async () => {
      // Arrange
      const projectStore = useProjectStore()
      const scriptStore = useScriptStore()

      // Buat proyek dan muat ke projectStore agar this.project tidak null
      const createdProject = await createMockEmptyProject({
        projectName: 'Project To Save'
      })
      await projectStore.loadProject(createdProject.id)

      // Tambahkan script di RAM
      scriptStore.initScripts([
        { id: 'sc-save-1', name: 'Save Target Script' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      scriptStore.addNodeToActive({ id: 'save-node', type: 'output' })

      expect(projectStore.syncStatus).toBe('dirty')

      // Act
      await projectStore.saveProjectToServer()

      // Assert
      expect(projectStore.syncStatus).toBe('synced')
      
      const { scriptsDir } = await scriptStore._getScriptDirectories()
      const savedHandle = await scriptsDir.getFileHandle('sc-save-1.json')
      const savedContent = JSON.parse(await (await savedHandle.getFile()).text())

      expect(savedContent.nodes).toHaveLength(1)
      expect(savedContent.nodes[0].id).toBe('save-node')
    })
  })

  describe('[Bad Path] Penanganan Error & Skenario Tak Terduga', () => {
    it('[Bad Path] menangani kegagalan pembacaan OPFS secara terisolasi tanpa merusak state RAM', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-ghost', name: 'GhostScript' }
      ])

      // Mencoba menghapus file yang tidak pernah ada di OPFS
      const { scriptsDir } = await scriptStore._getScriptDirectories()

      // Act & Assert (removeEntry pada mock OPFS silent/handled, namun memicu pengerjaan beruntun)
      await expect(scriptStore.removeScript('script-ghost')).resolves.not.toThrow()

      // State RAM harus tetap berhasil dibersihkan meskipun file fisik tidak ditemukan
      expect(scriptStore.getScriptById('script-ghost')).toBeUndefined()
    })

    it('[Bad Path] mengabaikan penambahan edge ke node yang sama (self-loop boundary)', () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-loop', name: 'LoopScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])
      scriptStore.addNodeToActive({ id: 'node-same', type: 'process' })

      // Act: Tambahkan edge dari dan ke node yang sama
      scriptStore.addEdgeToActive({
        source: 'node-same',
        sourceHandle: 'out',
        target: 'node-same',
        targetHandle: 'in'
      })

      // Assert
      expect(scriptStore.activeScript.edges).toHaveLength(0)
    })

    it('[Bad Path] tidak melakukan perubahan jika menghapus port pada node yang tidak terdaftar', () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.initScripts([
        { id: 'script-port-err', name: 'PortErrScript' }
      ])
      scriptStore.setActiveScript(scriptStore.scripts[0])

      // Act & Assert
      expect(() => {
        scriptStore.removeNodePort('non-existent-node', 'input', 'port-x')
      }).not.toThrow()
    })
  })
})