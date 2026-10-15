import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'
import { useScriptLogic } from '@scripts/scripts.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useFolderStore } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useProjectStore } from '@projects/projects.js'

// Mock dialog & visual alert composables so they don't block UI integration flow
const mockPrompt = vi.fn()
const mockConfirm = vi.fn()
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopAlert: () => ({ showPop: mockShowPop })
}))

describe('Script Logic Composable Integration Test', () => {
  beforeEach(async () => {
    // 1. Reset Pinia State
    setActivePinia(createPinia())

    // 2. Setup Mock OPFS Simulator
    setupMockOPFS()

    // 3. Initialize Project and Workspace
    const createdProject = await createMockEmptyProject({
      projectName: 'Script Logic Integration Test Project'
    })

    const workspaceStore = useWorkspaceStore()
    workspaceStore.setProjectId(createdProject.id)

    const projectStore = useProjectStore()
    await projectStore.loadProject(createdProject.id)

    // Reset Mocks
    mockPrompt.mockReset()
    mockConfirm.mockReset()
    mockShowPop.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Navigation, Folder Hierarchy, and Visual Filtering Integration (Breadcrumb, Sorting, Filtering)', () => {
    it('computes folder breadcrumbs structurally and filters directory contents based on active folder', () => {
      // Arrange
      const folderStore = useFolderStore()
      const scriptStore = useScriptStore()
      const scriptLogic = useScriptLogic()

      // Create nested folder structure: Root -> FolderA -> FolderB
      folderStore.initFolders([
        { id: 'f-1', name: 'Utilities', parentId: null, section: 'scripts' },
        { id: 'f-2', name: 'MathHelpers', parentId: 'f-1', section: 'scripts' }
      ])

      scriptStore.initScripts([
        { id: 'sc-1', name: 'RootScript', folderId: null },
        { id: 'sc-2', name: 'VectorMath', folderId: 'f-2' },
        { id: 'sc-3', name: 'AlgebraMath', folderId: 'f-2' }
      ])

      // Act: Navigate to Folder B (f-2)
      scriptLogic.navigateTo({ id: 'f-2' })

      // Assert Breadcrumbs
      expect(scriptLogic.folderBreadcrumbs.value).toHaveLength(2)
      expect(scriptLogic.folderBreadcrumbs.value[0].name).toBe('Utilities')
      expect(scriptLogic.folderBreadcrumbs.value[1].name).toBe('MathHelpers')

      // Assert Visible Scripts sorted naturally (AlgebraMath -> VectorMath)
      expect(scriptLogic.visibleScripts.value).toHaveLength(2)
      expect(scriptLogic.visibleScripts.value[0].name).toBe('AlgebraMath')
      expect(scriptLogic.visibleScripts.value[1].name).toBe('VectorMath')
    })

    it('filters script and folder list in real-time when searchQuery is populated', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()
      const scriptLogic = useScriptLogic()

      folderStore.initFolders([
        { id: 'f-sub1', name: 'PhysicsNodes', parentId: null, section: 'scripts' },
        { id: 'f-sub2', name: 'UINodes', parentId: null, section: 'scripts' }
      ])

      scriptStore.initScripts([
        { id: 'sc-1', name: 'PlayerMovement', folderId: null },
        { id: 'sc-2', name: 'EnemyAI', folderId: null }
      ])

      // Act: Enter search query "phys"
      scriptLogic.searchQuery.value = 'phys'

      // Assert
      expect(scriptLogic.visibleFolders.value).toHaveLength(1)
      expect(scriptLogic.visibleFolders.value[0].name).toBe('PhysicsNodes')
      expect(scriptLogic.visibleScripts.value).toHaveLength(0)

      // Act: Change search query to "player"
      scriptLogic.searchQuery.value = 'player'

      // Assert
      expect(scriptLogic.visibleFolders.value).toHaveLength(0)
      expect(scriptLogic.visibleScripts.value).toHaveLength(1)
      expect(scriptLogic.visibleScripts.value[0].name).toBe('PlayerMovement')
    })
  })

  describe('Drag & Drop and Clipboard Integration (Move, Cut & Paste, Copy & Paste)', () => {
    it('moves script to target folder when handleDrop event is called', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()
      const scriptLogic = useScriptLogic()

      folderStore.initFolders([
        { id: 'target-folder', name: 'TargetDir', parentId: null, section: 'scripts' }
      ])

      scriptStore.initScripts([
        { id: 'sc-move-1', name: 'ScriptToMove', folderId: null }
      ])

      const mockDropEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue(JSON.stringify({ id: 'sc-move-1', type: 'script' }))
        }
      }

      // Act: Drop into target folder
      await scriptLogic.handleDrop(mockDropEvent, 'target-folder')

      // Assert
      const movedScript = scriptStore.getScriptById('sc-move-1')
      expect(movedScript.folderId).toBe('target-folder')
    })

    it('handles item Cut & Paste operation using clipboard', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()
      const scriptLogic = useScriptLogic()

      folderStore.initFolders([
        { id: 'f-dest', name: 'DestinationFolder', parentId: null, section: 'scripts' }
      ])

      scriptStore.initScripts([
        { id: 'sc-cut-1', name: 'CutScript', folderId: null }
      ])

      // 1. Store Cut action in clipboard
      scriptLogic.clipboard.value = {
        action: 'cut',
        item: { id: 'sc-cut-1', type: 'script' }
      }

      // 2. Navigate to DestinationFolder
      scriptLogic.navigateTo({ id: 'f-dest' })

      // Act: Run Paste
      await scriptLogic.handlePaste()

      // Assert
      const pastedScript = scriptStore.getScriptById('sc-cut-1')
      expect(pastedScript.folderId).toBe('f-dest')
      expect(scriptLogic.clipboard.value).toBeNull() // Clipboard cleared after cut-paste
    })

    it('handles script Copy & Paste operation (duplicate) using clipboard', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const scriptLogic = useScriptLogic()

      scriptStore.initScripts([
        { id: 'sc-copy-1', name: 'OriginalScript', folderId: null }
      ])

      scriptLogic.clipboard.value = {
        action: 'copy',
        item: { id: 'sc-copy-1', type: 'script' }
      }

      // Act
      await scriptLogic.handlePaste()

      // Assert
      expect(scriptStore.scripts).toHaveLength(2)
      expect(scriptStore.scripts[1].name).toBe('OriginalScript_Copy')
    })
  })

  describe('Graph Editor Opening Integration (handleOpenGraph)', () => {
    it('sets activeScript in scriptStore and opens new diagram tab in workspaceStore', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const scriptLogic = useScriptLogic()

      const targetScript = { id: 'sc-graph-1', name: 'CameraGraphScript', nodes: [], edges: [] }
      scriptStore.initScripts([targetScript])

      // Act
      scriptLogic.handleOpenGraph(targetScript)

      // Assert Active Script State on ScriptStore
      expect(scriptStore.activeScript).not.toBeNull()
      expect(scriptStore.activeScript.id).toBe('sc-graph-1')

      // Assert Workspace Tab Opened
      expect(workspaceStore.tabs).toContainEqual(expect.objectContaining({
        id: 'sc-graph-1',
        name: 'CameraGraphScript',
        type: 'diagram'
      }))
      expect(workspaceStore.activeTabId).toBe('sc-graph-1')
    })
  })

  describe('Complex CRUD Actions Integration (createScript, handleDelete, handleRename)', () => {
    it('creates new script directly inside current active folder', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const folderStore = useFolderStore()
      const scriptLogic = useScriptLogic()

      folderStore.initFolders([
        { id: 'active-f', name: 'ActiveFolder', parentId: null, section: 'scripts' }
      ])
      folderStore.setActiveFolder('active-f')

      mockPrompt.mockResolvedValue('NewInFolderScript')

      // Act
      await scriptLogic.createScript()

      // Assert
      expect(scriptStore.scripts).toHaveLength(1)
      expect(scriptStore.scripts[0].name).toBe('NewInFolderScript')
      expect(scriptStore.scripts[0].folderId).toBe('active-f')
    })

    it('deletes selected script and resets selectedId if deleted item was selected', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      const scriptLogic = useScriptLogic()

      scriptStore.initScripts([
        { id: 'sc-select-del', name: 'SelectedForDelete' }
      ])
      await scriptStore.saveScriptToOPFS(scriptStore.scripts[0])

      scriptLogic.handleSelect('sc-select-del')
      expect(scriptLogic.selectedId.value).toBe('sc-select-del')

      mockConfirm.mockResolvedValue(true) // User confirms delete

      // Act
      await scriptLogic.handleDelete({ id: 'sc-select-del' })

      // Assert
      expect(scriptStore.scripts).toHaveLength(0)
      expect(scriptLogic.selectedId.value).toBeNull()
    })
  })

  describe('[Bad Path] Invalid Payload & Operation Handling', () => {
    it('[Bad Path] safely ignores handleDrop if JSON payload format is invalid', async () => {
      // Arrange
      const scriptLogic = useScriptLogic()

      const mockInvalidDropEvent = {
        dataTransfer: {
          getData: vi.fn().mockReturnValue('INVALID_JSON_PAYLOAD')
        }
      }

      // Act & Assert (does not throw fatal runtime exception)
      await expect(scriptLogic.handleDrop(mockInvalidDropEvent)).resolves.not.toThrow()
    })

    it('[Bad Path] ignores handleOpenGraph if script object is null or undefined', () => {
      // Arrange
      const workspaceStore = useWorkspaceStore()
      const scriptStore = useScriptStore()
      const scriptLogic = useScriptLogic()

      const initialTabCount = workspaceStore.tabs.length

      // Act
      scriptLogic.handleOpenGraph(null)

      // Assert
      expect(scriptStore.activeScript).toBeNull()
      expect(workspaceStore.tabs).toHaveLength(initialTabCount)
    })
  })
})