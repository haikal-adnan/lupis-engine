import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefabStore, usePrefabLogic } from '@prefabs/prefabs.js'
import { useFolderStore } from '@folders/folders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneHistory } from '@historys/historys.js'
import { useConfirm, usePopAlert, usePrompt } from '@composables/composables.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock supporting UI composables called inside Actions
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

describe('Integration Test: PrefabLogic', () => {
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

    // Set default scene for smooth prefab operations
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

  describe('Filtering and Computed Properties Integration', () => {
    it('filters visibleFolders and visiblePrefabs based on active folder, tab, and search query', () => {
      // Arrange
      folderStore.initFolders([
        { id: 'f1', name: 'Folder UI', section: 'prefabs-ui', parentId: null },
        { id: 'f2', name: 'Folder World', section: 'prefabs-world', parentId: null }
      ])
      folderStore.setActiveFolder(null)

      prefabStore.initPrefabs([
        { id: 'p1', scriptId: 'Player', type: 'world', folderId: null },
        { id: 'p2', scriptId: 'HealthBar', type: 'ui', folderId: null }
      ])

      // Act & Assert: Default tab ('world')
      expect(logic.visibleFolders.value).toHaveLength(1)
      expect(logic.visibleFolders.value[0].name).toBe('Folder World')

      expect(logic.visiblePrefabs.value).toHaveLength(1)
      expect(logic.visiblePrefabs.value[0].scriptId).toBe('Player')

      // Act: Switch tab to 'ui' and search
      logic.activeTab.value = 'ui'
      logic.searchQuery.value = 'health'

      // Assert
      expect(logic.visibleFolders.value).toHaveLength(0)
      expect(logic.visiblePrefabs.value).toHaveLength(1)
      expect(logic.visiblePrefabs.value[0].scriptId).toBe('HealthBar')
    })

    it('generates sequential folder breadcrumbs from root', () => {
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

  describe('Navigation and Clipboard Operations Integration', () => {
    it('changes active folder and clears selection and search query on navigation', () => {
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

    it('moves prefab item to new folder via paste (cut) operation', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p1', scriptId: 'Item', folderId: 'folder-old' }
      ])
      folderStore.setActiveFolder('folder-new')

      logic.clipboard.value = {
        action: 'cut',
        item: { id: 'p1', type: 'prefab' }
      }

      // Act
      await logic.handlePaste()

      // Assert: Updated state
      expect(prefabStore.getPrefabById('p1').folderId).toBe('folder-new')
      expect(logic.clipboard.value.action).toBeNull()

      // Assert: History record
      const { recordMovePrefabFolder } = useSceneHistory()
      expect(recordMovePrefabFolder).toHaveBeenCalledWith('p1', 'folder-old', 'folder-new')
    })

    it('duplicates prefab when executing paste (copy) operation', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p1', scriptId: 'Original', folderId: null }
      ])

      logic.clipboard.value = {
        action: 'copy',
        item: { id: 'p1', type: 'prefab' }
      }

      // Act
      await logic.handlePaste()

      // Assert: New prefab duplicated in store
      expect(prefabStore.prefabs).toHaveLength(2)
      expect(prefabStore.prefabs[1].scriptId).toBe('Original_copy')
    })
  })

  describe('Item Creation, Movement, and Deletion Integration', () => {
    it('creates new empty prefab in active folder and selects it automatically', async () => {
      // Arrange
      folderStore.setActiveFolder('active-f')

      // Act
      await logic.createEmptyPrefab()

      // Assert
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(logic.selectedId.value).toBe(prefabStore.prefabs[0].id)
      expect(prefabStore.prefabs[0].folderId).toBe('active-f')
    })

    it('creates new folder in current directory and selects it', async () => {
      // Arrange
      folderStore.setActiveFolder('active-f')
      mockPrompt.mockResolvedValue('New Folder') // Ensure prompt dialog returns folder name

      // Act
      await logic.createFolder()

      // Assert
      expect(folderStore.folders).toHaveLength(1)
      expect(logic.selectedId.value).toBe(folderStore.folders[0].id)
      expect(folderStore.folders[0].parentId).toBe('active-f')
    })

    it('processes drag and drop data to move item', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-drag', scriptId: 'Dragged', folderId: 'f-start' }
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

    it('deletes prefab item and clears selection if deleted item was selected', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-delete', scriptId: 'ToDelete', folderId: null }
      ])
      logic.selectedId.value = 'p-delete'

      // Act
      await logic.handleDelete({ id: 'p-delete', isFolder: false })

      // Assert
      expect(prefabStore.getPrefabById('p-delete')).toBeUndefined()
      expect(logic.selectedId.value).toBeNull()
    })

    it('routes rename action to prompt dialog and updates item name', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-1', scriptId: 'OldName', folderId: null }
      ])
      mockPrompt.mockResolvedValue('RenamedPrefab')

      // Act
      await logic.handleRename({ id: 'p-1', isFolder: false })

      // Assert
      expect(prefabStore.getPrefabById('p-1').scriptId).toBe('RenamedPrefab')
    })
  })

  describe('Boundary Cases and Bad Path Handling', () => {
    it('[Bad Path] ignores drop process if drag and drop payload is corrupt or invalid JSON', async () => {
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
        '[PrefabLogic] Failed to parse drag-and-drop payload:',
        expect.any(SyntaxError)
      )
    })

    it('[Bad Path] does not move prefab if target folder is the same as source folder', async () => {
      // Arrange
      prefabStore.initPrefabs([
        { id: 'p-same', scriptId: 'Same', folderId: 'f-same' }
      ])

      // Act
      await logic.moveItem('p-same', 'prefab', 'f-same')

      // Assert
      const { recordMovePrefabFolder } = useSceneHistory()
      expect(recordMovePrefabFolder).not.toHaveBeenCalled()
    })
  })
})