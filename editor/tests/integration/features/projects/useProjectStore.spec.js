import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

if (typeof globalThis.navigator !== 'undefined') {
  const createMockDirectoryHandle = () => ({
    getDirectoryHandle: vi.fn().mockImplementation(async () => createMockDirectoryHandle()),
    getFileHandle: vi.fn().mockResolvedValue({
      getFile: vi.fn().mockResolvedValue({ text: vi.fn().mockResolvedValue('') }),
      createWritable: vi.fn().mockResolvedValue({ write: vi.fn(), close: vi.fn() })
    }),
    removeEntry: vi.fn().mockResolvedValue(undefined),
    entries: async function* () {}
  })

  Object.defineProperty(globalThis.navigator, 'storage', {
    value: {
      getDirectory: vi.fn().mockImplementation(async () => createMockDirectoryHandle())
    },
    writable: true,
    configurable: true
  })
}

// Import Pinia Store modules & related dependencies
import { useProjectStore } from '@projects/useProjectStore.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useAssetStore } from '@assets/assets.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useFolderStore } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { engineBridge } from '@engines/engines.js'
import { normalizer } from '@utils/utils.js'

// Mock controller variables
const mockGetProjectById = vi.fn()
const mockSyncProject = vi.fn()
const mockShowPop = vi.fn()

// Isolate & mock external modules
vi.mock('@projects/useProjectActions.js', () => ({
  useProjectActions: () => ({
    getProjectById: mockGetProjectById,
    syncProject: mockSyncProject,
    getUserProjectsDir: vi.fn(),
    getProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn()
  })
}))

vi.mock('@projects/projects.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useProjectActions: () => ({
      getProjectById: mockGetProjectById,
      syncProject: mockSyncProject,
      getUserProjectsDir: vi.fn(),
      getProjects: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn()
    })
  }
})

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: mockShowPop
  })
}))

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    reloadScene: vi.fn()
  }
}))

vi.mock('@utils/utils.js', () => ({
  normalizer: vi.fn()
}))

describe('Project Store Integration', () => {
  let projectStore
  let workspaceStore
  let sceneStore
  let assetStore
  let prefabStore
  let folderStore
  let scriptStore

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    projectStore = useProjectStore()
    workspaceStore = useWorkspaceStore()
    sceneStore = useSceneStore()
    assetStore = useAssetStore()
    prefabStore = usePrefabStore()
    folderStore = useFolderStore()
    scriptStore = useScriptStore()

    // Mock OPFS methods according to store implementation
    folderStore.syncFoldersToOPFS = vi.fn().mockResolvedValue()
    assetStore.syncAssetsToOPFS = vi.fn().mockResolvedValue()
  })

  describe('Clear Project Data (clearProjectData)', () => {
    it('resets projectStore state and all integrated child stores', () => {
      projectStore.project = { id: 'proj-1', name: 'Test Project' }
      projectStore.syncStatus = 'dirty'

      const sceneResetSpy = vi.spyOn(sceneStore, '$reset')
      const assetResetSpy = vi.spyOn(assetStore, '$reset')
      const prefabResetSpy = vi.spyOn(prefabStore, '$reset')
      const folderResetSpy = vi.spyOn(folderStore, '$reset')
      const scriptResetSpy = vi.spyOn(scriptStore, '$reset')
      const workspaceResetSpy = vi.spyOn(workspaceStore, '$reset')

      projectStore.clearProjectData()

      expect(projectStore.project).toBeNull()
      expect(projectStore.syncStatus).toBe('synced')
      expect(sceneResetSpy).toHaveBeenCalledOnce()
      expect(assetResetSpy).toHaveBeenCalledOnce()
      expect(prefabResetSpy).toHaveBeenCalledOnce()
      expect(folderResetSpy).toHaveBeenCalledOnce()
      expect(scriptResetSpy).toHaveBeenCalledOnce()
      expect(workspaceResetSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Loading Project (loadProject)', () => {
    it('loads project data and distributes data to all related stores on successful integration', async () => {
      const projectId = 'proj-123'
      const rawResult = {
        project: { id: projectId, name: 'Game Project' },
        scenes: [{ id: 'scene-1' }],
        assets: [{ id: 'asset-1' }],
        prefabs: [{ id: 'prefab-1' }],
        folders: [{ id: 'folder-1' }],
        scripts: [{ id: 'script-1' }]
      }

      const normalizedResult = {
        project: { id: projectId, name: 'Game Project Normalized' },
        scenes: [{ id: 'scene-1', normalized: true }],
        assets: [{ id: 'asset-1', normalized: true }],
        prefabs: [{ id: 'prefab-1', normalized: true }],
        folders: [{ id: 'folder-1', normalized: true }],
        scripts: [{ id: 'script-1', normalized: true }]
      }

      mockGetProjectById.mockResolvedValueOnce(rawResult)
      vi.mocked(normalizer).mockReturnValueOnce(normalizedResult)

      const initScenesSpy = vi.spyOn(sceneStore, 'initScenes')
      const initAssetsSpy = vi.spyOn(assetStore, 'initAssets')
      const initPrefabsSpy = vi.spyOn(prefabStore, 'initPrefabs')
      const initFoldersSpy = vi.spyOn(folderStore, 'initFolders')
      const initScriptsSpy = vi.spyOn(scriptStore, 'initScripts')
      const resetCanvasSpy = vi.spyOn(workspaceStore, 'resetCanvas')

      await projectStore.loadProject(projectId)

      expect(mockGetProjectById).toHaveBeenCalledWith(projectId)
      expect(normalizer).toHaveBeenCalledWith(
        rawResult.project,
        rawResult.scenes,
        rawResult.assets,
        rawResult.prefabs,
        rawResult.folders,
        rawResult.scripts
      )
      expect(projectStore.project).toEqual(normalizedResult.project)
      expect(initScenesSpy).toHaveBeenCalledWith(normalizedResult.scenes)
      expect(initAssetsSpy).toHaveBeenCalledWith(normalizedResult.assets)
      expect(initPrefabsSpy).toHaveBeenCalledWith(normalizedResult.prefabs)
      expect(initFoldersSpy).toHaveBeenCalledWith(normalizedResult.folders)
      expect(initScriptsSpy).toHaveBeenCalledWith(normalizedResult.scripts)
      expect(resetCanvasSpy).toHaveBeenCalledOnce()
      
      expect(workspaceStore.activeProjectId).toBe(projectId)
      expect(projectStore.syncStatus).toBe('synced')
      expect(workspaceStore.isLoading).toBe(false)
    })

    it('[Bad Path] handles external dependency failure during loadProject and rethrows error', async () => {
      const errorMessage = 'Network error: Failed to fetch data'
      mockGetProjectById.mockRejectedValueOnce(new Error(errorMessage))

      await expect(projectStore.loadProject('proj-invalid')).rejects.toThrow(errorMessage)
    })
  })

  describe('Sync from Server/OPFS (syncFromServer)', () => {
    it('updates store state and calls engineBridge when engine is ready', async () => {
      projectStore.project = { id: 'proj-1', name: 'Existing Project' }
      
      workspaceStore.setEngine({ name: 'Mock Engine Instance' })

      sceneStore.activeScene = { id: 'scene-1', name: 'Main Scene' }
      prefabStore.prefabs = []
      scriptStore.scripts = []

      const serverData = {
        project: { id: 'proj-1', name: 'Updated Project' },
        scenes: [{ id: 'scene-1', name: 'Main Scene' }],
        assets: [],
        prefabs: [],
        folders: [],
        scripts: []
      }

      mockGetProjectById.mockResolvedValueOnce(serverData)
      vi.mocked(normalizer).mockReturnValueOnce({
        project: serverData.project,
        scenes: serverData.scenes,
        assets: [],
        prefabs: [],
        folders: [],
        scripts: []
      })

      await projectStore.syncFromServer()

      expect(mockGetProjectById).toHaveBeenCalledWith('proj-1')
      expect(projectStore.syncStatus).toBe('synced')
      expect(engineBridge.reloadScene).toHaveBeenCalledOnce()
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Sync Successful',
        message: 'Project data reloaded successfully from OPFS.',
        type: 'success'
      })
      expect(workspaceStore.isLoading).toBe(false)
    })

    it('[Bad Path] throws an error when syncFromServer fails due to OPFS error', async () => {
      projectStore.project = { id: 'proj-1' }
      const error = new Error('OPFS Disk Full')
      mockGetProjectById.mockRejectedValueOnce(error)

      await expect(projectStore.syncFromServer()).rejects.toThrow('OPFS Disk Full')
    })

    it('[Bad Path] throws TypeError when syncFromServer is called but no project is active (project is null)', async () => {
      projectStore.project = null

      await expect(projectStore.syncFromServer()).rejects.toThrow(TypeError)
    })
  })

  describe('Save Project to Server/OPFS (saveProjectToServer)', () => {
    it('sends entire composite payload across stores to syncProject function', async () => {
      projectStore.project = { id: 'proj-1', name: 'Project to Save' }
      assetStore.assets = [{ id: 'asset-1' }]
      folderStore.folders = [{ id: 'folder-1' }]
      sceneStore.scenes = [{ id: 'scene-1' }]
      prefabStore.prefabs = [{ id: 'prefab-1' }]
      scriptStore.scripts = [{ id: 'script-1' }]

      mockSyncProject.mockResolvedValueOnce({ success: true })

      await projectStore.saveProjectToServer()

      expect(folderStore.syncFoldersToOPFS).toHaveBeenCalledOnce()
      expect(assetStore.syncAssetsToOPFS).toHaveBeenCalledOnce()
      expect(mockSyncProject).toHaveBeenCalledWith('proj-1', {
        project: projectStore.project,
        assets: assetStore.assets,
        folders: folderStore.folders,
        scenes: sceneStore.scenes,
        prefabs: prefabStore.prefabs,
        scripts: scriptStore.scripts
      })
      expect(projectStore.syncStatus).toBe('synced')
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Save Successful',
        message: 'Project saved successfully to OPFS.',
        type: 'success'
      })
      expect(workspaceStore.isSaving).toBe(false)
    })

    it('[Bad Path] rethrows error when I/O Exception occurs in OPFS', async () => {
      projectStore.project = { id: 'proj-1' }
      const error = new Error('I/O Exception')
      mockSyncProject.mockRejectedValueOnce(error)

      await expect(projectStore.saveProjectToServer()).rejects.toThrow('I/O Exception')
    })

    it('[Bad Path] handles staged asset commit failure before syncProject process', async () => {
      projectStore.project = { id: 'proj-1' }
      assetStore.syncAssetsToOPFS = vi.fn().mockRejectedValueOnce(new Error('Failed to commit assets'))

      await expect(projectStore.saveProjectToServer()).rejects.toThrow('Failed to commit assets')
    })
  })

  describe('Internal State and Project Settings Changes', () => {
    beforeEach(() => {
      projectStore.project = {
        id: 'proj-1',
        name: 'Editable Project',
        scenes: [],
        tags: ['Untagged'],
        settings: {
          tickRate: 60,
          grid: { visible: true, snap: false, width: 10, height: 10, color: '#fff', opacity: 1 },
          ui: { showUIBorder: false },
          camera: {},
          debug: { active: true, position: 'top-right', width: 360, height: 220, maxLogs: 50 }
        }
      }
      workspaceStore.isLoading = false
      workspaceStore.isSaving = false
    })

    it('sets syncStatus to dirty when markAsDirty is called', () => {
      projectStore.markAsDirty()
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('adds new tag without duplicates and marks store as dirty', () => {
      projectStore.addTag('Gameplay')
      projectStore.addTag('gameplay')

      expect(projectStore.project.tags).toEqual(['Untagged', 'Gameplay'])
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('removes selected tag and marks store as dirty', () => {
      projectStore.project.tags = ['Untagged', 'Gameplay']

      projectStore.removeTag('Gameplay')

      expect(projectStore.project.tags).toEqual(['Untagged'])
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('updates debug settings and marks store as dirty', () => {
      projectStore.updateDebugSettings({ active: false })

      expect(projectStore.project.settings.debug.active).toBe(false)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })
})