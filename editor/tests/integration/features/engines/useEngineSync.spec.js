import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Import composables under test directly from source file
import { useEngineSync } from '@engines/useEngineSync.js'
import { useEditorToEngine, useEngineToEditor } from '@engines/engines.js'

// Import related Pinia stores
import { useProjectStore } from '@projects/projects.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useAssetStore } from '@assets/assets.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptStore } from '@scripts/scripts.js'
import { usePrefabStore } from '@prefabs/prefabs.js'

// OPFS mock helper
import { setupMockOPFS } from '@tests/tests.js'

// External dependencies mock (Composables Engine Directional Bridge)
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
    // 1. Initialize Pinia & Mock Environment
    setActivePinia(createPinia())
    setupMockOPFS()

    // 2. Initialize all store instances
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

  describe('Engine Sync Initialization', () => {
    it('routes all store instances to outgoing and incoming listeners when initSync is called', () => {
      // Arrange
      const { initSync } = useEngineSync()

      // Act
      initSync()

      // Assert: Ensure outbound bridge binds all required stores
      expect(useEditorToEngine).toHaveBeenCalledWith(
        projectStore,
        sceneStore,
        assetStore,
        workspaceStore,
        scriptStore,
        prefabStore
      )

      // Assert: Ensure inbound bridge binds sceneStore
      expect(useEngineToEditor).toHaveBeenCalledWith(sceneStore)

      // Assert: Bi-directional listeners enabled successfully
      expect(mockOutgoingListen).toHaveBeenCalledOnce()
      expect(mockIncomingListen).toHaveBeenCalledOnce()
    })

    it('returns initSync method as valid composable interface', () => {
      // Arrange & Act
      const sync = useEngineSync()

      // Assert
      expect(sync).toHaveProperty('initSync')
      expect(typeof sync.initSync).toBe('function')
    })
  })

  describe('Boundary Cases and Error Handling [Bad Path]', () => {
    it('[Bad Path] handles outgoing listener execution failure gracefully without breaking application flow', () => {
      // Arrange
      mockOutgoingListen.mockImplementationOnce(() => {
        throw new Error('Failed to initialize Outgoing Bridge')
      })

      const { initSync } = useEngineSync()

      // Act & Assert
      expect(() => initSync()).toThrow('Failed to initialize Outgoing Bridge')
      expect(mockIncomingListen).not.toHaveBeenCalled()
    })

    it('[Bad Path] handles incoming listener failure when outgoing bridge is already connected', () => {
      // Arrange
      mockIncomingListen.mockImplementationOnce(() => {
        throw new Error('Failed to initialize Incoming Bridge')
      })

      const { initSync } = useEngineSync()

      // Act & Assert
      expect(() => initSync()).toThrow('Failed to initialize Incoming Bridge')
      expect(mockOutgoingListen).toHaveBeenCalledOnce()
    })
  })
})