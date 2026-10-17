import { setActivePinia, createPinia } from 'pinia'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useWorkspaceActions } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'

// 1. Declare mock function outside vi.mock
const mockConfirmFn = vi.fn()

// 2. Mock external dependencies
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
    // Arrange: Initialize Pinia & reset mock implementation
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    
    // Reset mock function before each test
    mockConfirmFn.mockReset()

    // Setup stub for navigator.clipboard Web API
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })

    // Initialize tested composable after Pinia and mocks are ready
    workspaceActions = useWorkspaceActions()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Entity Deletion Integration (handleDeleteEntity)', () => {
    it('deletes entity from sceneStore when user confirms dialog', async () => {
      // Arrange
      sceneStore.createDefaultScene()
      const entity = { id: 'ent-001', scriptId: 'Player' }
      sceneStore.activeScene.entities.push({
        id: 'ent-001',
        scriptId: 'Player',
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

    it('cancels entity deletion if user cancels confirmation dialog', async () => {
      // Arrange
      sceneStore.createDefaultScene()
      const entity = { id: 'ent-002', scriptId: 'Enemy' }
      sceneStore.activeScene.entities.push({
        id: 'ent-002',
        scriptId: 'Enemy',
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

    it('[Bad Path] ignores deletion process if entity object is null or undefined', async () => {
      // Act
      await workspaceActions.handleDeleteEntity(null)
      await workspaceActions.handleDeleteEntity(undefined)

      // Assert
      expect(mockConfirmFn).not.toHaveBeenCalled()
    })
  })

  describe('Copy ID to Clipboard Integration (handleCopyId)', () => {
    it('successfully copies entity ID to navigator clipboard', async () => {
      // Arrange
      const targetId = 'entity-uuid-12345'

      // Act
      await workspaceActions.handleCopyId(targetId)

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('entity-uuid-12345')
    })

    it('[Bad Path] ignores execution if ID is empty string, null, or undefined', async () => {
      // Act
      await workspaceActions.handleCopyId('')
      await workspaceActions.handleCopyId(null)
      await workspaceActions.handleCopyId(undefined)

      // Assert
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
    })

    it('[Bad Path] handles navigator.clipboard API failure safely without throwing unhandled rejection', async () => {
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