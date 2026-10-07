import { setActivePinia, createPinia } from 'pinia'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useWorkspaceActions } from '@workspaces/workspaces.js' // Sesuaikan path impor
import { useSceneStore } from '@scenes/scenes.js'

// 1. Deklarasi mock function di luar vi.mock
const mockConfirmFn = vi.fn()

// 2. Mocking dependencies eksternal
vi.mock('@composables/composables.js', () => ({
  useConfirm: () => ({
    confirm: mockConfirmFn
  }),
  usePopAlert: () => ({
    showPop: vi.fn()
  })
}))

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    createEntity: vi.fn(),
    selectEntity: vi.fn(),
    deleteEntity: vi.fn(),
    clearSelection: vi.fn(),
    updateEntityProp: vi.fn(),
    moveEntity: vi.fn()
  }
}))

vi.mock('@historys/historys.js', () => ({
  useSceneHistory: () => ({
    recordEntityDelete: vi.fn(),
    recordEntityCreate: vi.fn(),
    recordPropChange: vi.fn()
  })
}))

describe('Integration Test: useWorkspaceActions', () => {
  let workspaceActions
  let sceneStore

  beforeEach(() => {
    // Arrange: Inisialisasi Pinia & reset mock implementation
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    
    // Reset mock function sebelum setiap pengujian
    mockConfirmFn.mockReset()

    // Setup stub untuk Web API navigator.clipboard
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })

    // Inisialisasi composable yang diuji setelah Pinia dan mock siap
    workspaceActions = useWorkspaceActions()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Integrasi Penghapusan Entitas (handleDeleteEntity)', () => {
    it('menghapus entitas dari sceneStore ketika pengguna mengonfirmasi dialog', async () => {
      // Arrange
      sceneStore.createDefaultScene()
      const entity = { id: 'ent-001', name: 'Player' }
      sceneStore.activeScene.entities.push({
        id: 'ent-001',
        name: 'Player',
        parentId: null,
        layerId: 'layer_world_default'
      })

      mockConfirmFn.mockResolvedValue(true)

      // Act
      await workspaceActions.handleDeleteEntity(entity)

      // Assert
      expect(mockConfirmFn).toHaveBeenCalledWith({
        title: 'Delete Entity?',
        message: 'Are you sure you want to delete "Player"? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      })
      const remainingEntity = sceneStore.activeScene.entities.find(e => e.id === 'ent-001')
      expect(remainingEntity).toBeUndefined()
    })

    it('membatalkan penghapusan entitas jika pengguna menolak dialog konfirmasi', async () => {
      // Arrange
      sceneStore.createDefaultScene()
      const entity = { id: 'ent-002', name: 'Enemy' }
      sceneStore.activeScene.entities.push({
        id: 'ent-002',
        name: 'Enemy',
        parentId: null,
        layerId: 'layer_world_default'
      })

      mockConfirmFn.mockResolvedValue(false)

      // Act
      await workspaceActions.handleDeleteEntity(entity)

      // Assert
      expect(mockConfirmFn).toHaveBeenCalled()
      const remainingEntity = sceneStore.activeScene.entities.find(e => e.id === 'ent-002')
      expect(remainingEntity).toBeDefined()
    })

    it('[Bad Path] mengabaikan proses penghapusan jika objek entitas bernilai null atau undefined', async () => {
      // Act
      await workspaceActions.handleDeleteEntity(null)
      await workspaceActions.handleDeleteEntity(undefined)

      // Assert
      expect(mockConfirmFn).not.toHaveBeenCalled()
    })
  })

  describe('Integrasi Penyalinan ID ke Clipboard (handleCopyId)', () => {
    it('berhasil menyalin ID entitas ke clipboard navigator', async () => {
      // Arrange
      const targetId = 'entity-uuid-12345'

      // Act
      await workspaceActions.handleCopyId(targetId)

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('entity-uuid-12345')
    })

    it('[Bad Path] mengabaikan eksekusi jika ID bernilai empty string, null, atau undefined', async () => {
      // Act
      await workspaceActions.handleCopyId('')
      await workspaceActions.handleCopyId(null)
      await workspaceActions.handleCopyId(undefined)

      // Assert
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
    })

    it('[Bad Path] menangani kegagalan API navigator.clipboard secara aman tanpa melemparkan unhandled rejection', async () => {
      // Arrange
      const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Permission denied'))

      // Act & Assert
      await expect(workspaceActions.handleCopyId('ent-fail')).resolves.not.toThrow()
      expect(spyConsoleError).toHaveBeenCalledWith('Failed to copy ID:', expect.any(Error))

      spyConsoleError.mockRestore()
    })
  })
})