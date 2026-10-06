import { setActivePinia, createPinia } from 'pinia'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useWorkspaceStore } from '@workspaces/workspaces.js' // sesuaikan path impor ke store
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js' // sesuaikan path impor helper

// Mock dependensi proyek external jika diperlukan
vi.mock('@projects/projects.js', () => ({
  useProjectActions: () => ({
    createProject: vi.fn(async ({ projectName }) => ({
      id: 'proj-123',
      name: projectName,
      created: true
    }))
  })
}))

describe('Integration Test: useWorkspaceStore', () => {
  let workspaceStore

  beforeEach(() => {
    // 1. Arrange: Inisialisasi Pinia & Mock OPFS Environment
    setActivePinia(createPinia())
    setupMockOPFS()
    workspaceStore = useWorkspaceStore()
  })

  afterEach(() => {
    // Clean up mock state setelah pengujian
    vi.clearAllMocks()
  })

  describe('Integrasi Inisialisasi Proyek & State Workspace', () => {
    it('mengintegrasikan pembuatan proyek baru dengan pembaruan activeProjectId dan assetBaseUrl', async () => {
      // Arrange
      const mockProject = await createMockEmptyProject({ projectName: 'Game Baru' })

      // Act
      workspaceStore.setProjectId(mockProject.id)

      // Assert
      expect(workspaceStore.activeProjectId).toBe('proj-123')
      expect(workspaceStore.assetBaseUrl).toContain('/projects/proj-123/')
    })

    it('memperbarui status engine dan memverifikasi getter isEngineReady', () => {
      // Arrange
      const mockEngineInstance = {
        render: vi.fn(),
        stop: vi.fn()
      }

      // Act
      workspaceStore.setEngine(mockEngineInstance)

      // Assert
      expect(workspaceStore.isEngineReady).toBe(true)
      expect(workspaceStore.engine).not.toBeNull()
    })
  })

  describe('Integrasi Manajemen Tool & Selection', () => {
    it('mengubah activeTool secara otomatis menjadi brush saat tileSelection diset', () => {
      // Arrange
      const mockRect = { x: 0, y: 0, width: 32, height: 32 }

      // Act
      workspaceStore.setTileSelection(mockRect)

      // Assert
      expect(workspaceStore.hasTileSelection).toBe(true)
      expect(workspaceStore.tileSelection).toEqual(mockRect)
      expect(workspaceStore.activeTool).toBe('brush')
    })

    it('mengembalikan activeTool ke select saat tileSelection dibersihkan', () => {
      // Arrange
      workspaceStore.setTileSelection({ x: 0, y: 0, width: 16, height: 16 })
      expect(workspaceStore.activeTool).toBe('brush')

      // Act
      workspaceStore.clearTileSelection()

      // Assert
      expect(workspaceStore.hasTileSelection).toBe(false)
      expect(workspaceStore.tileSelection).toBeNull()
      expect(workspaceStore.activeTool).toBe('select')
    })

    it('[Bad Path] menolak perubahan tool ke brush jika tidak memiliki tileSelection', () => {
      // Arrange
      workspaceStore.clearTileSelection()

      // Act
      workspaceStore.setTool('brush')

      // Assert
      expect(workspaceStore.activeTool).toBe('select')
    })
  })

  describe('Integrasi Manajemen Tab System', () => {
    it('membuka tab baru dan menandainya sebagai tab aktif', () => {
      // Arrange
      const newTab = { id: 'script-1', name: 'PlayerScript.js', type: 'code' }

      // Act
      workspaceStore.openTab(newTab)

      // Assert
      expect(workspaceStore.tabs.length).toBe(2)
      expect(workspaceStore.activeTabId).toBe('script-1')
      expect(workspaceStore.activeTab.name).toBe('PlayerScript.js')
    })

    it('berpindah ke tab sebelumnya saat tab aktif non-fixed ditutup', () => {
      // Arrange
      workspaceStore.openTab({ id: 'tab-a', name: 'Tab A', type: 'code' })
      workspaceStore.openTab({ id: 'tab-b', name: 'Tab B', type: 'code' })
      expect(workspaceStore.activeTabId).toBe('tab-b')

      // Act
      workspaceStore.closeTab('tab-b')

      // Assert
      expect(workspaceStore.tabs.find(t => t.id === 'tab-b')).toBeUndefined()
      expect(workspaceStore.activeTabId).toBe('tab-a')
    })

    it('[Bad Path] tidak menghapus tab yang berstatus fixed', () => {
      // Act: Mencoba menutup tab 'scene' yang secara bawaan fixed: true
      workspaceStore.closeTab('scene')

      // Assert
      expect(workspaceStore.tabs.length).toBe(1)
      expect(workspaceStore.tabs[0].id).toBe('scene')
    })
  })

  describe('Integrasi Clipboard Operations', () => {
    it('menyimpan salinan data terisolasi (deep copy) ke dalam clipboard state', () => {
      // Arrange
      const originalData = { entityId: 'entity-99', components: ['Transform', 'Sprite'] }

      // Act
      workspaceStore.setClipboard('entity', originalData, 'copy')

      // Mutasi data asli untuk menguji deep clone
      originalData.components.push('RigidBody')

      // Assert
      expect(workspaceStore.hasClipboardData).toBe(true)
      expect(workspaceStore.clipboard.data.components).toEqual(['Transform', 'Sprite'])
      expect(workspaceStore.clipboard.data.components).not.toContain('RigidBody')
    })

    it('clears clipboard data correctly', () => {
      // Arrange
      workspaceStore.setClipboard('entity', { id: 1 }, 'copy')

      // Act
      workspaceStore.clearClipboard()

      // Assert
      expect(workspaceStore.hasClipboardData).toBe(false)
      expect(workspaceStore.clipboard.data).toBeNull()
    })
  })

  describe('Konsistensi Status Asinkronus & Error Handling', () => {
    it('mengsinkronkan status isLoading dan loadingMessage saat proses setSaving dijalankan', () => {
      // Act: Mulai Menyimpan
      workspaceStore.setSaving(true, 'Menyimpan perubahan proyek...')

      // Assert
      expect(workspaceStore.isSaving).toBe(true)
      expect(workspaceStore.isLoading).toBe(true)
      expect(workspaceStore.loadingMessage).toBe('Menyimpan perubahan proyek...')

      // Act: Selesai Menyimpan
      workspaceStore.setSaving(false)

      // Assert
      expect(workspaceStore.isSaving).toBe(false)
      expect(workspaceStore.isLoading).toBe(false)
      expect(workspaceStore.loadingMessage).toBe('')
    })

    it('[Bad Path] menangani pesan error dependency dan memperbarui state error', () => {
      // Arrange
      const errorMessage = 'Gagal memuat struktur file dari OPFS'

      // Act
      workspaceStore.setError(errorMessage)

      // Assert
      expect(workspaceStore.error).toBe(errorMessage)

      // Act: Clear Error
      workspaceStore.clearError()

      // Assert
      expect(workspaceStore.error).toBeNull()
    })
  })
})