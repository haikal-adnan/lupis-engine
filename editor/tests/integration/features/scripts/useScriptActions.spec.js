import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js' // Sesuaikan path helper mock
import { useScriptActions, useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useFolderStore } from '@folders/folders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'

// Mock composables dialog & visual alert
const mockPrompt = vi.fn()
const mockConfirm = vi.fn()
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopAlert: () => ({ showPop: mockShowPop })
}))

describe('Script Actions Integration Test', () => {
  beforeEach(async () => {
    // 1. Inisialisasi Ulang Pinia State
    setActivePinia(createPinia())

    // 2. Inisialisasi Mock Environment OPFS
    setupMockOPFS()

    // 3. Buat Proyek Kosong dan Muat State Awal
    const createdProject = await createMockEmptyProject({
      projectName: 'Script Actions Test Project'
    })
    
    const workspaceStore = useWorkspaceStore()
    workspaceStore.setProjectId(createdProject.id)

    const projectStore = useProjectStore()
    await projectStore.loadProject(createdProject.id)

    // Reset Mock Functions
    mockPrompt.mockReset()
    mockConfirm.mockReset()
    mockShowPop.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Integrasi Pembuatan dan Validasi Nama Script (createScript & getValidUniqueName)', () => {
    it('membuat script baru dengan sanitasi nama dan otomatis menangani nama duplikat', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      // Buat script awal bernama "Player_Controller"
      scriptStore.initScripts([
        { id: 'sc-1', name: 'Player_Controller', type: 'component' }
      ])

      // User memasukkan nama yang sama dan mengandung karakter ilegal/spasi: "Player Controller! "
      mockPrompt.mockResolvedValue('Player Controller! ')

      // Act
      const createdScript = await scriptActions.createScript('component', null)

      // Assert
      expect(mockPrompt).toHaveBeenCalledWith(expect.objectContaining({
        defaultValue: 'NewComponent'
      }))
      
      // Sanitasi -> "Player_Controller", Duplikat -> "Player_Controller_1"
      expect(createdScript).not.toBeNull()
      expect(createdScript.name).toBe('Player_Controller_1')
      expect(scriptStore.scripts).toHaveLength(2)
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })

    it('membatalkan pembuatan script jika user menekan tombol batal pada prompt', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()

      mockPrompt.mockResolvedValue(null) // User cancel

      // Act
      const result = await scriptActions.createScript('component')

      // Assert
      expect(result).toBeNull()
      expect(scriptStore.scripts).toHaveLength(0)
      expect(mockShowPop).not.toHaveBeenCalled()
    })
  })

  describe('Integrasi Penghapusan dan Pengubahan Nama Script (deleteScript & renameScript)', () => {
    it('menghapus script dari store dan OPFS setelah user mengonfirmasi dialog confirm', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'sc-del-1', name: 'UnusedScript' }
      ])
      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])
      projectStore.syncStatus = 'synced'

      mockConfirm.mockResolvedValue(true) // User setuju hapus

      // Act
      const isDeleted = await scriptActions.deleteScript('sc-del-1')

      // Assert
      expect(isDeleted).toBe(true)
      expect(scriptStore.scripts).toHaveLength(0)
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'info'
      }))
    })

    it('mengubah nama script dan menyelaraskan state ketika input nama baru valid', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const projectStore = useProjectStore()

      scriptStore.initScripts([
        { id: 'sc-ren-1', name: 'OldName' }
      ])
      mockPrompt.mockResolvedValue('New Awesome Name')

      // Act
      await scriptActions.renameScript('sc-ren-1')

      // Assert
      const updatedScript = scriptStore.getScriptById('sc-ren-1')
      expect(updatedScript.name).toBe('New_Awesome_Name')
      expect(projectStore.syncStatus).toBe('dirty')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })
  })

  describe('Integrasi Duplikasi Script (duplicateScript)', () => {
    it('menduplikasi script yang ada beserta seluruh isi node/variabel dengan suffix copy', async () => {
      // Arrange
      const scriptActions = useScriptActions()
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()

      folderStore.activeFolderId = 'folder-101'

      scriptStore.initScripts([
        {
          id: 'sc-orig',
          name: 'EnemyAI',
          localVariables: [{ id: 'v1', name: 'hp', defaultValue: 100 }],
          nodes: [{ id: 'n1', type: 'start' }]
        }
      ])

      // Act
      const clonedScript = await scriptActions.duplicateScript('sc-orig')

      // Assert
      expect(clonedScript).not.toBeNull()
      expect(clonedScript.id).not.toBe('sc-orig')
      expect(clonedScript.name).toBe('EnemyAI_Copy')
      expect(clonedScript.folderId).toBe('folder-101')
      expect(clonedScript.nodes).toHaveLength(1)
      expect(scriptStore.scripts).toHaveLength(2)
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })
  })

  describe('Integrasi Script ke Scene Entity (applyToEntity)', () => {
    it('menempelkan script ke ScriptController milik entity dan menginisialisasi nilai awal variabel', () => {
      // Arrange
      const scriptActions = useScriptActions()
      const sceneStore = useSceneStore()

      const mockScript = {
        id: 'sc-attach-1',
        name: 'RotatorScript',
        localVariables: [
          { name: 'speed', defaultValue: 5 },
          { name: 'loop', defaultValue: true }
        ]
      }

      const mockEntity = {
        id: 'ent-1',
        name: 'CubeObject',
        components: {
          ScriptController: { data: [] }
        }
      }

      vi.spyOn(sceneStore, 'patchComponent')

      // Act
      scriptActions.applyToEntity(mockScript, mockEntity)

      // Assert
      expect(sceneStore.patchComponent).toHaveBeenCalledWith(
        'ent-1',
        'ScriptController',
        {
          data: [
            expect.objectContaining({
              assetId: 'sc-attach-1',
              active: true,
              variables: { speed: 5, loop: true }
            })
          ]
        }
      )
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success'
      }))
    })

    it('[Bad Path] menolak penempelan script jika script sudah aktif pada entity yang sama', () => {
      // Arrange
      const scriptActions = useScriptActions()
      const sceneStore = useSceneStore()

      const mockScript = { id: 'sc-attached', name: 'RotatorScript' }
      const mockEntity = {
        id: 'ent-1',
        name: 'CubeObject',
        components: {
          ScriptController: {
            data: [{ id: 'inst_123', assetId: 'sc-attached' }]
          }
        }
      }

      vi.spyOn(sceneStore, 'patchComponent')

      // Act
      scriptActions.applyToEntity(mockScript, mockEntity)

      // Assert
      expect(sceneStore.patchComponent).not.toHaveBeenCalled()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        type: 'warning',
        title: 'Script Exists'
      }))
    })
  })

  describe('[Bad Path] Penanganan Akses Resource Tak Valid', () => {
    it('[Bad Path] mengembalikan false/null secara aman ketika scriptId tidak ditemukan di store', async () => {
      // Arrange
      const scriptActions = useScriptActions()

      // Act
      const deleteResult = await scriptActions.deleteScript('non-existent-id')
      const duplicateResult = await scriptActions.duplicateScript('non-existent-id')

      // Assert
      expect(deleteResult).toBe(false)
      expect(duplicateResult).toBeNull()
      expect(mockConfirm).not.toHaveBeenCalled()
      expect(mockShowPop).not.toHaveBeenCalled()
    })
  })
})