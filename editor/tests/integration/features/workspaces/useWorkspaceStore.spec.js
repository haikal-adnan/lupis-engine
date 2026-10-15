import { setActivePinia, createPinia } from 'pinia'
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock external project dependencies if needed
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
    // 1. Arrange: Initialize Pinia & Mock OPFS Environment
    setActivePinia(createPinia())
    setupMockOPFS()
    workspaceStore = useWorkspaceStore()
  })

  afterEach(() => {
    // Clean up mock state after test
    vi.clearAllMocks()
  })

  describe('Project Initialization & Workspace State Integration', () => {
    it('integrates new project creation with activeProjectId and assetBaseUrl updates', async () => {
      // Arrange
      const mockProject = await createMockEmptyProject({ projectName: 'New Game' })

      // Act
      workspaceStore.setProjectId(mockProject.id)

      // Assert
      expect(workspaceStore.activeProjectId).toBe('proj-123')
      expect(workspaceStore.assetBaseUrl).toContain('/projects/proj-123/')
    })

    it('updates engine status and verifies isEngineReady getter', () => {
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

  describe('Tool Management & Selection Integration', () => {
    it('automatically switches activeTool to brush when tileSelection is set', () => {
      // Arrange
      const mockRect = { x: 0, y: 0, width: 32, height: 32 }

      // Act
      workspaceStore.setTileSelection(mockRect)

      // Assert
      expect(workspaceStore.hasTileSelection).toBe(true)
      expect(workspaceStore.tileSelection).toEqual(mockRect)
      expect(workspaceStore.activeTool).toBe('brush')
    })

    it('reverts activeTool to select when tileSelection is cleared', () => {
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

    it('[Bad Path] rejects tool change to brush if tileSelection is not set', () => {
      // Arrange
      workspaceStore.clearTileSelection()

      // Act
      workspaceStore.setTool('brush')

      // Assert
      expect(workspaceStore.activeTool).toBe('select')
    })
  })

  describe('Tab System Management Integration', () => {
    it('opens new tab and marks it as active tab', () => {
      // Arrange
      const newTab = { id: 'script-1', name: 'PlayerScript.js', type: 'code' }

      // Act
      workspaceStore.openTab(newTab)

      // Assert
      expect(workspaceStore.tabs.length).toBe(2)
      expect(workspaceStore.activeTabId).toBe('script-1')
      expect(workspaceStore.activeTab.name).toBe('PlayerScript.js')
    })

    it('switches to previous tab when non-fixed active tab is closed', () => {
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

    it('[Bad Path] does not remove tab with fixed status', () => {
      // Act: Attempt to close 'scene' tab which has fixed: true by default
      workspaceStore.closeTab('scene')

      // Assert
      expect(workspaceStore.tabs.length).toBe(1)
      expect(workspaceStore.tabs[0].id).toBe('scene')
    })
  })

  describe('Clipboard Operations Integration', () => {
    it('saves isolated copy (deep copy) into clipboard state', () => {
      // Arrange
      const originalData = { entityId: 'entity-99', components: ['Transform', 'Sprite'] }

      // Act
      workspaceStore.setClipboard('entity', originalData, 'copy')

      // Mutate original data to test deep clone
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

  describe('Asynchronous Status Consistency & Error Handling', () => {
    it('synchronizes isLoading and loadingMessage state when setSaving is executed', () => {
      // Act: Start Saving
      workspaceStore.setSaving(true, 'Saving project changes...')

      // Assert
      expect(workspaceStore.isSaving).toBe(true)
      expect(workspaceStore.isLoading).toBe(true)
      expect(workspaceStore.loadingMessage).toBe('Saving project changes...')

      // Act: Finish Saving
      workspaceStore.setSaving(false)

      // Assert
      expect(workspaceStore.isSaving).toBe(false)
      expect(workspaceStore.isLoading).toBe(false)
      expect(workspaceStore.loadingMessage).toBe('')
    })

    it('[Bad Path] handles dependency error message and updates error state', () => {
      // Arrange
      const errorMessage = 'Failed to load file structure from OPFS'

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