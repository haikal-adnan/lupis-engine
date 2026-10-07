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

// Impor modul Pinia Store & dependensi terkait
import { useProjectStore } from '@projects/useProjectStore.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useAssetStore } from '@assets/assets.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useFolderStore } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { engineBridge } from '@engines/engines.js'
import { normalizer } from '@utils/utils.js'

// Variable pengendali mock
const mockGetProjectById = vi.fn()
const mockSyncProject = vi.fn()
const mockShowPop = vi.fn()

// Isolasi & Mock modul eksternal
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

describe('Integrasi Project Store', () => {
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

    // PERBAIKAN: Mock method OPFS yang benar sesuai implementation store
    folderStore.syncFoldersToOPFS = vi.fn().mockResolvedValue()
    assetStore.syncAssetsToOPFS = vi.fn().mockResolvedValue()
  })

  describe('Pembersihan Data Project (clearProjectData)', () => {
    it('mereset state projectStore beserta seluruh child store yang terintegrasi', () => {
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

  describe('Pemuatan Project (loadProject)', () => {
    it('memuat data project dan mendistribusikan data ke seluruh store terkait saat integrasi berhasil', async () => {
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

    it('[Bad Path] menangani kegagalan dependency external saat loadProject dan meneruskan throw error', async () => {
      const errorMessage = 'Network error: Gagal mengambil data'
      mockGetProjectById.mockRejectedValueOnce(new Error(errorMessage))

      await expect(projectStore.loadProject('proj-invalid')).rejects.toThrow(errorMessage)
    })
  })

  describe('Sinkronisasi dari Server/OPFS (syncFromServer)', () => {
    it('memperbarui state store dan memanggil engineBridge ketika engine dalam kondisi ready', async () => {
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

    it('[Bad Path] melempar error saat syncFromServer gagal dipanggil karena OPFS error', async () => {
      projectStore.project = { id: 'proj-1' }
      const error = new Error('Disk OPFS Penuh')
      mockGetProjectById.mockRejectedValueOnce(error)

      await expect(projectStore.syncFromServer()).rejects.toThrow('Disk OPFS Penuh')
    })

    it('[Bad Path] melempar TypeError saat syncFromServer dipanggil tetapi tidak ada proyek yang aktif (project is null)', async () => {
      projectStore.project = null

      await expect(projectStore.syncFromServer()).rejects.toThrow(TypeError)
    })
  })

  describe('Penyimpanan Project ke Server/OPFS (saveProjectToServer)', () => {
    it('mengirim seluruh payload gabungan antar-store ke fungsi syncProject', async () => {
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

    it('[Bad Path] meneruskan error saat terjadi kegagalan I/O Exception di OPFS', async () => {
      projectStore.project = { id: 'proj-1' }
      const error = new Error('I/O Exception')
      mockSyncProject.mockRejectedValueOnce(error)

      await expect(projectStore.saveProjectToServer()).rejects.toThrow('I/O Exception')
    })

    it('[Bad Path] menangani kegagalan commit staged assets sebelum proses syncProject', async () => {
      projectStore.project = { id: 'proj-1' }
      assetStore.syncAssetsToOPFS = vi.fn().mockRejectedValueOnce(new Error('Gagal commit asset'))

      await expect(projectStore.saveProjectToServer()).rejects.toThrow('Gagal commit asset')
    })
  })

  describe('Perubahan State Internal dan Pengaturan Project', () => {
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

    it('mengubah status syncStatus menjadi dirty ketika method markAsDirty dipanggil', () => {
      projectStore.markAsDirty()
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('menambahkan tag baru tanpa duplikasi dan menandai store sebagai dirty', () => {
      projectStore.addTag('Gameplay')
      projectStore.addTag('gameplay')

      expect(projectStore.project.tags).toEqual(['Untagged', 'Gameplay'])
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('menghapus tag pilihan dan menandai store sebagai dirty', () => {
      projectStore.project.tags = ['Untagged', 'Gameplay']

      projectStore.removeTag('Gameplay')

      expect(projectStore.project.tags).toEqual(['Untagged'])
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('memperbarui pengaturan debug dan menandai store sebagai dirty', () => {
      projectStore.updateDebugSettings({ active: false })

      expect(projectStore.project.settings.debug.active).toBe(false)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })
})