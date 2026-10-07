import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefabStore, usePrefabLogic } from '@prefabs/prefabs.js'
import { useFolderStore } from '@folders/folders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneHistory } from '@historys/historys.js'
import { useConfirm, usePopAlert, usePrompt } from '@composables/composables.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock composable UI pendukung yang dipanggil di dalam Actions
vi.mock('@composables/composables.js', () => ({
  useConfirm: vi.fn(),
  usePopAlert: vi.fn(),
  usePrompt: vi.fn()
}))

// Mock history recorder
vi.mock('@historys/historys.js', () => ({
  useSceneHistory: vi.fn().mockReturnValue({
    recordMovePrefabFolder: vi.fn(),
    recordCreatePrefab: vi.fn(),
    recordDeletePrefab: vi.fn(),
    recordRenamePrefab: vi.fn()
  })
}))

describe('Integrasi PrefabLogic', () => {
  let logic
  let prefabStore
  let folderStore
  let sceneStore
  let workspaceStore

  let mockShowPop
  let mockConfirm
  let mockPrompt

  beforeEach(async () => {
    setActivePinia(createPinia())
    setupMockOPFS()

    mockShowPop = vi.fn()
    mockConfirm = vi.fn()
    mockPrompt = vi.fn()

    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop })
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm })
    vi.mocked(usePrompt).mockReturnValue({ prompt: mockPrompt })

    workspaceStore = useWorkspaceStore()
    prefabStore = usePrefabStore()
    folderStore = useFolderStore()
    sceneStore = useSceneStore()

    const project = await createMockEmptyProject({ projectName: 'Logic Integration Test' })
    workspaceStore.setProjectId(project.id)

    // Set default scene agar operasi prefab berjalan lancar
    sceneStore.initScenes([
      {
        id: 'scene-1',
        name: 'Main Scene',
        entities: [],
        layersWorld: [{ id: 'layer-world-1' }],
        layersUI: [{ id: 'layer-ui-1' }]
      }
    ])

    logic = usePrefabLogic()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Integrasi Filtering dan Computed Properties', () => {
    it('memfilter visibleFolders dan visiblePrefabs berdasarkan folder aktif, tab, dan query pencarian', () => {
      // Arrange
      folderStore.initFolders([
        { id: 'f1', name: 'Folder UI', section: 'prefabs-ui', parentId: null },
        { id: 'f2', name: 'Folder World', section: 'prefabs-world', parentId: null }
      ])
      folderStore.setActiveFolder(null)

      prefabStore.initPrefabs([
        { id: 'p1', name: 'Player', type: 'world', folderId: null },
        { id: 'p2', name: 'HealthBar', type: 'ui', folderId: null }
      ])

      // Act & Assert: Tab Default ('world')
      expect(logic.visibleFolders.value).toHaveLength(1)
      expect(logic.visibleFolders.value[0].name).toBe('Folder World')

      expect(logic.visiblePrefabs.value).toHaveLength(1)
      expect(logic.visiblePrefabs.value[0].name).toBe('Player')

      // Act: Ganti Tab ke 'ui' dan lakukan Pencarian
      logic.activeTab.value = 'ui'
      logic.searchQuery.value = 'health'

      // Assert
      expect(logic.visibleFolders.value).toHaveLength(0)
      expect(logic.visiblePrefabs.value).toHaveLength(1)
      expect(logic.visiblePrefabs.value[0].name).toBe('HealthBar')
    })

    it('menghasilkan susunan breadcrumb folder yang berurutan dari root', () => {
      // Arrange
      folderStore.initFolders([
        { id: 'root-f', name: 'Root Folder', parentId: null },
        { id: 'sub-f', name: 'Sub Folder', parentId: 'root-f' }
      ])
      folderStore.setActiveFolder('sub-f')

      // Act
      const breadcrumbs = logic.folderBreadcrumbs.value

      // Assert
      expect(breadcrumbs).toHaveLength(2)
      expect(breadcrumbs[0].name).toBe('Root Folder')
      expect(breadcrumbs[1].name).toBe('Sub Folder')
    })
  })

  describe('Integrasi Navigasi dan Salin-Tempel (Clipboard Operations)', () => {
    it('mengubah folder aktif dan membersihkan seleksi serta pencarian saat navigasi', () => {
      // Arrange
      logic.selectedId.value = 'item-1'
      logic.searchQuery.value = 'test'

      // Act
      logic.navigateTo({ id: 'target-folder' })

      // Assert
      expect(folderStore.activeFolderId).toBe('target-folder')
      expect(logic.selectedId.value).toBeNull()
      expect(logic.searchQuery.value).toBe('')
    })

    it('memindahkan item prefab ke folder baru melalui operasi paste (cut)', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p1', name: 'Item', folderId: 'folder-old' }
      ])
      folderStore.setActiveFolder('folder-new')

      logic.clipboard.value = {
        action: 'cut',
        item: { id: 'p1', type: 'prefab' }
      }

      // Act
      await logic.handlePaste()

      // Assert: State terbarui
      expect(prefabStore.getPrefabById('p1').folderId).toBe('folder-new')
      expect(logic.clipboard.value.action).toBeNull()

      // Assert: Rekaman history
      const { recordMovePrefabFolder } = useSceneHistory()
      expect(recordMovePrefabFolder).toHaveBeenCalledWith('p1', 'folder-old', 'folder-new')
    })

    it('menduplikasi prefab saat menjalankan operasi paste (copy)', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p1', name: 'Original', folderId: null }
      ])

      logic.clipboard.value = {
        action: 'copy',
        item: { id: 'p1', type: 'prefab' }
      }

      // Act
      await logic.handlePaste()

      // Assert: Prefab baru berhasil diduplikasi di store
      expect(prefabStore.prefabs).toHaveLength(2)
      expect(prefabStore.prefabs[1].name).toBe('Original_copy')
    })
  })

  describe('Integrasi Pembuatan, Pemindahan, dan Penghapusan Item', () => {
    it('membuat prefab kosong baru di folder aktif dan memilihnya secara otomatis', async () => {
      // Arrange
      folderStore.setActiveFolder('active-f')

      // Act
      await logic.createEmptyPrefab()

      // Assert
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(logic.selectedId.value).toBe(prefabStore.prefabs[0].id)
      expect(prefabStore.prefabs[0].folderId).toBe('active-f')
    })

    it('membuat folder baru di direktori saat ini dan memilihnya', async () => {
      // Arrange
      folderStore.setActiveFolder('active-f')
      mockPrompt.mockResolvedValue('New Folder') // Memastikan prompt dialog mengembalikan nama folder

      // Act
      await logic.createFolder()

      // Assert
      expect(folderStore.folders).toHaveLength(1)
      expect(logic.selectedId.value).toBe(folderStore.folders[0].id)
      expect(folderStore.folders[0].parentId).toBe('active-f')
    })

    it('memproses data drag and drop untuk memindahkan item', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-drag', name: 'Dragged', folderId: 'f-start' }
      ])
      const mockEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue(JSON.stringify({ id: 'p-drag', type: 'prefab' }))
        }
      }

      // Act
      await logic.handleDrop(mockEvent, 'f-target')

      // Assert
      expect(prefabStore.getPrefabById('p-drag').folderId).toBe('f-target')
    })

    it('menghapus item prefab dan membersihkan seleksi jika item yang dihapus sedang dipilih', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-delete', name: 'ToDelete', folderId: null }
      ])
      logic.selectedId.value = 'p-delete'

      // Act
      await logic.handleDelete({ id: 'p-delete', isFolder: false })

      // Assert
      expect(prefabStore.getPrefabById('p-delete')).toBeUndefined()
      expect(logic.selectedId.value).toBeNull()
    })

    it('mengarahkan aksi rename ke prompt dialog lalu memperbarui nama item', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-1', name: 'OldName', folderId: null }
      ])
      mockPrompt.mockResolvedValue('RenamedPrefab')

      // Act
      await logic.handleRename({ id: 'p-1', isFolder: false })

      // Assert
      expect(prefabStore.getPrefabById('p-1').name).toBe('RenamedPrefab')
    })
  })

  describe('Penanganan Kasus Batas dan Jalur Buruk [Bad Path]', () => {
    it('[Bad Path] mengabaikan proses drop jika payload drag and drop corrupt atau invalid JSON', async () => {
      // Arrange
      const mockEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue('invalid-json-payload')
        }
      }
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Act
      await logic.handleDrop(mockEvent, 'target-folder')

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PrefabLogic] Gagal parse payload drag and drop:',
        expect.any(SyntaxError)
      )
    })

    it('[Bad Path] tidak memindahkan prefab jika target folder sama dengan folder asal', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-same', name: 'Same', folderId: 'f-same' }
      ])

      // Act
      await logic.moveItem('p-same', 'prefab', 'f-same')

      // Assert
      const { recordMovePrefabFolder } = useSceneHistory()
      expect(recordMovePrefabFolder).not.toHaveBeenCalled()
    })
  })
})