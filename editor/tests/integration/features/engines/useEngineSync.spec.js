import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Impor composables yang diuji langsung dari file sumber
import { useEngineSync } from '@engines/useEngineSync.js'
import { useEditorToEngine, useEngineToEditor } from '@engines/engines.js'

// Impor store Pinia terkait
import { useProjectStore } from '@projects/projects.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useAssetStore } from '@assets/assets.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { usePrefabStore } from '@prefabs/prefabs.js'

// Helper mock OPFS
import { setupMockOPFS } from '@tests/tests.js'

// Mock dependencies eksternal (Composables Engine Directional Bridge)
const mockOutgoingListen = vi.fn()
const mockIncomingListen = vi.fn()

vi.mock('@engines/engines.js', () => ({
  useEditorToEngine: vi.fn(() => ({
    listen: mockOutgoingListen
  })),
  useEngineToEditor: vi.fn(() => ({
    listen: mockIncomingListen
  }))
}))

describe('Integration Test: useEngineSync', () => {
  let projectStore
  let sceneStore
  let assetStore
  let workspaceStore
  let scriptStore
  let prefabStore

  beforeEach(() => {
    // 1. Inisialisasi Pinia & Mock Environment
    setActivePinia(createPinia())
    setupMockOPFS()

    // 2. Inisialisasi seluruh instance store
    projectStore = useProjectStore()
    sceneStore = useSceneStore()
    assetStore = useAssetStore()
    workspaceStore = useWorkspaceStore()
    scriptStore = useScriptStore()
    prefabStore = usePrefabStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Inisialisasi Sinkronisasi Engine', () => {
    it('mengarahkan seluruh instance store ke listener outgoing dan incoming saat initSync dipanggil', () => {
      // Arrange
      const { initSync } = useEngineSync()

      // Act
      initSync()

      // Assert: Pastikan bridge outbound mengikat seluruh store yang dibutuhkan
      expect(useEditorToEngine).toHaveBeenCalledWith(
        projectStore,
        sceneStore,
        assetStore,
        workspaceStore,
        scriptStore,
        prefabStore
      )

      // Assert: Pastikan bridge inbound mengikat sceneStore
      expect(useEngineToEditor).toHaveBeenCalledWith(sceneStore)

      // Assert: Listener dua arah berhasil diaktifkan
      expect(mockOutgoingListen).toHaveBeenCalledOnce()
      expect(mockIncomingListen).toHaveBeenCalledOnce()
    })

    it('mengembalikan method initSync sebagai antarmuka composables yang valid', () => {
      // Arrange & Act
      const sync = useEngineSync()

      // Assert
      expect(sync).toHaveProperty('initSync')
      expect(typeof sync.initSync).toBe('function')
    })
  })

  describe('Penanganan Kasus Batas dan Error [Bad Path]', () => {
    it('[Bad Path] menangani kegagalan eksekusi listener outgoing tanpa memutus aliran aplikasi', () => {
      // Arrange
      mockOutgoingListen.mockImplementationOnce(() => {
        throw new Error('Gagal menginisialisasi Outgoing Bridge')
      })

      const { initSync } = useEngineSync()

      // Act & Assert
      expect(() => initSync()).toThrow('Gagal menginisialisasi Outgoing Bridge')
      expect(mockIncomingListen).not.toHaveBeenCalled()
    })

    it('[Bad Path] menangani kegagalan listener incoming saat outgoing bridge sudah terhubung', () => {
      // Arrange
      mockIncomingListen.mockImplementationOnce(() => {
        throw new Error('Gagal menginisialisasi Incoming Bridge')
      })

      const { initSync } = useEngineSync()

      // Act & Assert
      expect(() => initSync()).toThrow('Gagal menginisialisasi Incoming Bridge')
      expect(mockOutgoingListen).toHaveBeenCalledOnce()
    })
  })
})