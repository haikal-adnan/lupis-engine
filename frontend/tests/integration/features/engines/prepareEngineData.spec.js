import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Impor modul yang diuji
import { prepareEngineData } from '@engines/engines.js'

// Impor store Pinia terkait
import { useProjectStore } from '@projects/projects.js'
import { useAssetStore } from '@assets/assets.js'
import { useSceneStore } from '@scenes/scenes.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'

// Helper mock OPFS & project
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// ==============================================================================
// MOCK DEPENDENCY EKSTERNAL
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
    // 1. Inisialisasi Pinia & OPFS
    setActivePinia(createPinia())
    mockStoreRef = setupMockOPFS()

    // 2. Inisialisasi seluruh store
    workspaceStore = useWorkspaceStore()
    projectStore = useProjectStore()
    assetStore = useAssetStore()
    sceneStore = useSceneStore()
    prefabStore = usePrefabStore()
    scriptStore = useScriptStore()

    // 3. Setup mock project awal
    const mockProject = await createMockEmptyProject()
    workspaceStore.setProjectId(mockProject.id)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Validasi & Eksekusi Serialisasi Data Engine', () => {
    it('memuat data project jika belum terisi di projectStore lalu menghasilkan payload lengkap', async () => {
      // Arrange
      const loadProjectSpy = vi.spyOn(projectStore, 'loadProject').mockImplementation(async (id) => {
        projectStore.project = {
          id,
          name: 'Engine Data Test Project',
          settings: { tickRate: 60 }
        }
        projectStore.isProjectLoaded = true
      })

      // Setup data awal di store lainnya
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

    it('otomatis membuat default scene jika daftar scene di sceneStore masih kosong', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Test Project' }
      projectStore.isProjectLoaded = true
      sceneStore.scenes = [] // Kosongkan scene

      const createDefaultSceneSpy = vi.spyOn(sceneStore, 'createDefaultScene')

      // Act
      const payload = await prepareEngineData()

      // Assert
      expect(createDefaultSceneSpy).toHaveBeenCalledOnce()
      expect(payload.scenes).toHaveLength(1)
      expect(payload.scenes[0].name).toBe('Main Scene')
    })

    it('memastikan properti engine (raw instance) dihapus dari workspaceConfig dalam payload', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Test Project' }
      projectStore.isProjectLoaded = true

      // Attach mock engine instance ke workspaceStore
      const mockEngineInstance = { bus: { emit: vi.fn() }, render: vi.fn() }
      workspaceStore.setEngine(mockEngineInstance)

      // Act
      const payload = await prepareEngineData()

      // Assert: Instance engine tidak boleh ikut terserialisasi ke dalam payload JSON
      expect(workspaceStore.engine).not.toBeNull()
      expect(payload.workspaceConfig.engine).toBeUndefined()
    })

    it('menghasilkan objek JSON terisolasi tanpa menyisipkan proxy/reactive Vue (toRaw verification)', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Deep Clone Test' }
      projectStore.isProjectLoaded = true
      assetStore.initAssets([{ id: 'ast-deep', name: 'bg.png' }])

      // Act
      const payload = await prepareEngineData()

      // Mutasi data lokal di store setelah payload dibuat
      assetStore.assets[0].name = 'bg-modified.png'

      // Assert: Payload harus tetap menyimpan nilai asli sebelum mutasi (deep copy isolation)
      expect(payload.assets[0].name).toBe('bg.png')
    })
  })

  describe('Penanganan Kasus Batas dan Error [Bad Path]', () => {
    it('[Bad Path] melempar Error jika activeProjectId di workspaceStore tidak terkonfigurasi', async () => {
      // Arrange
      workspaceStore.activeProjectId = null

      // Act & Assert
      await expect(prepareEngineData()).rejects.toThrow('No Active Project ID in WorkspaceStore')
    })

    it('[Bad Path] melempar Error jika pemuatan project dari OPFS gagal (project store bernilai null)', async () => {
      // Arrange
      vi.spyOn(projectStore, 'loadProject').mockResolvedValue(undefined)
      projectStore.project = null // Simulasi gagal load

      // Act & Assert
      await expect(prepareEngineData()).rejects.toThrow('Failed to load project metadata from OPFS')
    })

    it('[Bad Path] menangani error serialisasi JSON saat terdapat siklik/circular structure', async () => {
      // Arrange
      projectStore.project = { id: 'proj-123', name: 'Circular Test' }
      projectStore.isProjectLoaded = true

      // Buat struktur circular pada scene store
      const circularObj = {}
      circularObj.self = circularObj
      sceneStore.scenes = [circularObj]

      // Suppress console.error untuk pengujian error handling
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