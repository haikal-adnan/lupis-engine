import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Import module under test
import { prepareEngineData } from '@engines/engines.js'

// Import related Pinia stores
import { useProjectStore } from '@projects/projects.js'
import { useAssetStore } from '@assets/assets.js'
import { useSceneStore } from '@scenes/scenes.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'

// Helper mock OPFS & project
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// ==============================================================================
// EXTERNAL DEPENDENCY MOCK
// ==============================================================================
vi.mock('@projects/projects.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useProjectActions: () => ({
      createProject: vi.fn().mockResolvedValue({ id: 'proj-123', name: 'Engine Data Test Project' })
    })
  }
})

describe('Integration Test: prepareEngineData', () => {
  let mockStoreRef
  let projectStore
  let assetStore
  let sceneStore
  let prefabStore
  let workspaceStore
  let scriptStore

  beforeEach(async () => {
    // 1. Initialize Pinia & OPFS
    setActivePinia(createPinia())
    mockStoreRef = setupMockOPFS()

    // 2. Initialize all stores
    workspaceStore = useWorkspaceStore()
    projectStore = useProjectStore()
    assetStore = useAssetStore()
    sceneStore = useSceneStore()
    prefabStore = usePrefabStore()
    scriptStore = useScriptStore()

    // 3. Setup initial mock project
    const mockProject = await createMockEmptyProject()
    workspaceStore.setProjectId(mockProject.id)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Engine Data Serialization Validation & Execution', () => {
    it('loads project data if not populated in projectStore and yields complete payload', async () => {
      // Arrange
      const loadProjectSpy = vi.spyOn(projectStore, 'loadProject').mockImplementation(async (id) => {
        projectStore.project = {
          id,
          name: 'Engine Data Test Project',
          settings: { tickRate: 60 }
        }
        projectStore.isProjectLoaded = true
      })

      // Setup initial data in other stores
      assetStore.initAssets([{ id: 'ast-1', name: 'hero.png', type: 'texture' }])
      sceneStore.initScenes([{ id: 'sc-1', name: 'Main Scene', layersWorld: [], layersUI: [], entities: [] }])
      prefabStore.initPrefabs([{ id: 'pf-1', name: 'PlayerPrefab' }])
      scriptStore.initScripts([{ id: 'scr-1', name: 'PlayerController.js' }])

      // Act
      const payload = await prepareEngineData()

      // Assert
      expect(loadProjectSpy).toHaveBeenCalledWith('proj-123')
      expect(payload).toBeDefined()
      expect(payload).toHaveProperty('project')
      expect(payload).toHaveProperty('assets')
      expect(payload).toHaveProperty('scenes')
      expect(payload).toHaveProperty('prefabs')
      expect(payload).toHaveProperty('scripts')
      expect(payload).toHaveProperty('workspaceConfig')

      expect(payload.project.id).toBe('proj-123')
      expect(payload.assets).toHaveLength(1)
      expect(payload.scenes).toHaveLength(1)
      expect(payload.prefabs).toHaveLength(1)
      expect(payload.scripts).toHaveLength(1)
    })

    it('automatically creates default scene if scene list in sceneStore is empty', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Test Project' }
      projectStore.isProjectLoaded = true
      sceneStore.scenes = [] // Empty scenes

      const createDefaultSceneSpy = vi.spyOn(sceneStore, 'createDefaultScene')

      // Act
      const payload = await prepareEngineData()

      // Assert
      expect(createDefaultSceneSpy).toHaveBeenCalledOnce()
      expect(payload.scenes).toHaveLength(1)
      expect(payload.scenes[0].name).toBe('Main Scene')
    })

    it('ensures engine property (raw instance) is omitted from workspaceConfig in payload', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Test Project' }
      projectStore.isProjectLoaded = true

      // Attach mock engine instance to workspaceStore
      const mockEngineInstance = { bus: { emit: vi.fn() }, render: vi.fn() }
      workspaceStore.setEngine(mockEngineInstance)

      // Act
      const payload = await prepareEngineData()

      // Assert: Engine instance must not be serialized into JSON payload
      expect(workspaceStore.engine).not.toBeNull()
      expect(payload.workspaceConfig.engine).toBeUndefined()
    })

    it('produces isolated JSON object without Vue proxy/reactivity (toRaw verification)', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Deep Clone Test' }
      projectStore.isProjectLoaded = true
      assetStore.initAssets([{ id: 'ast-deep', name: 'bg.png' }])

      // Act
      const payload = await prepareEngineData()

      // Mutate local data in store after payload creation
      assetStore.assets[0].name = 'bg-modified.png'

      // Assert: Payload must retain original values before mutation (deep copy isolation)
      expect(payload.assets[0].name).toBe('bg.png')
    })
  })

  describe('Boundary Cases and Error Handling [Bad Path]', () => {
    it('[Bad Path] throws Error when activeProjectId in workspaceStore is not configured', async () => {
      // Arrange
      workspaceStore.activeProjectId = null

      // Act & Assert
      await expect(prepareEngineData()).rejects.toThrow('No Active Project ID in WorkspaceStore')
    })

    it('[Bad Path] throws Error when loading project from OPFS fails (project store is null)', async () => {
      // Arrange
      vi.spyOn(projectStore, 'loadProject').mockResolvedValue(undefined)
      projectStore.project = null // Simulate failed load

      // Act & Assert
      await expect(prepareEngineData()).rejects.toThrow('Failed to load project metadata from OPFS')
    })

    it('[Bad Path] handles JSON serialization error when circular structure exists', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Circular Test' }
      projectStore.isProjectLoaded = true

      // Create circular structure in scene store
      const circularObj = {}
      circularObj.self = circularObj
      sceneStore.scenes = [circularObj]

      // Suppress console.error for error handling test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Act & Assert
      await expect(prepareEngineData()).rejects.toThrow('Engine Payload Serialization Failed')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Critical: Failed to serialize engine payload',
        expect.any(Error)
      )
    })
  })
})