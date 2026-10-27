import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore, useHierarchyMenu } from '@scenes/scenes.js'
import { 
  setupMockSceneEnvironment, 
  createMockEntity, 
  createMockLayer 
} from '@tests/tests.js'

describe('Hierarchy Menu Integration', () => {
  let handlers

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    handlers = {
      refresh: vi.fn(),
      createEntity: vi.fn(),
      renameLayer: vi.fn(),
      changeZIndex: vi.fn(),
      renameEntity: vi.fn(),
      useAsPrefab: vi.fn()
    }
  })

  describe('Context Menu Population & Visibility', () => {
    it('opens context menu for empty canvas background with root actions', () => {
      // Arrange
      setupMockSceneEnvironment()
      const workspaceStore = useWorkspaceStore()
      workspaceStore.setClipboard('entity', [{ id: 'e_1' }], 'copy')

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const dummyEvent = { clientX: 120, clientY: 240 }

      // Act
      openMenu(dummyEvent, null, 'world')

      // Assert
      expect(contextMenu.value.visible).toBe(true)
      expect(contextMenu.value.x).toBe(120)
      expect(contextMenu.value.y).toBe(240)

      const labels = contextMenu.value.items.map(item => item.label).filter(Boolean)
      expect(labels).toContain('Refresh Tree')
      expect(labels).toContain('Paste')

      const pasteItem = contextMenu.value.items.find(item => item.label === 'Paste')
      expect(pasteItem.disabled).toBe(false)
    })

    it('populates layer-specific menu items when right-clicking a layer node', () => {
      // Arrange
      const layer = createMockLayer({ id: 'l_world_1', scriptId: 'WorldLayer', section: 'world' })
      setupMockSceneEnvironment({ layersWorld: [layer] })

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const layerNode = { id: 'l_world_1', type: 'layer', _section: 'world' }
      const dummyEvent = { clientX: 100, clientY: 200 }

      // Act
      openMenu(dummyEvent, layerNode, 'world')

      // Assert
      const labels = contextMenu.value.items.map(item => item.label).filter(Boolean)
      expect(labels).toContain('Add Entity')
      expect(labels).toContain('Copy Layer')
      expect(labels).toContain('Cut Layer')
      expect(labels).toContain('Rename Layer')
      expect(labels).toContain('Change Z-Index')
      expect(labels).toContain('Delete Layer')
    })

    it('populates entity-specific menu items when right-clicking a standard entity node', () => {
      // Arrange
      const entity = createMockEntity({ id: 'e_world_1', type: 'entity' })
      setupMockSceneEnvironment({ entities: [entity] })

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const entityNode = { id: 'e_world_1', type: 'entity', layerId: 'layer_world_default' }
      const dummyEvent = { clientX: 150, clientY: 250 }

      // Act
      openMenu(dummyEvent, entityNode, 'world')

      // Assert
      const labels = contextMenu.value.items.map(item => item.label).filter(Boolean)
      expect(labels).toContain('Add Child')
      expect(labels).toContain('Duplicate')
      expect(labels).toContain('Copy')
      expect(labels).toContain('Cut')
      expect(labels).toContain('Use as Prefab')
      expect(labels).toContain('Rename Entity')
      expect(labels).toContain('Delete Entity')
    })

    it('populates UI-specific items when opening menu for a UI context node', () => {
      // Arrange
      const uiLayer = createMockLayer({ id: 'l_ui_1', section: 'ui' })
      setupMockSceneEnvironment({ layersUI: [uiLayer] })

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const uiLayerNode = { id: 'l_ui_1', type: 'layer', _section: 'ui' }
      const dummyEvent = { clientX: 50, clientY: 50 }

      // Act
      openMenu(dummyEvent, uiLayerNode, 'ui')

      // Assert
      const addUiGroup = contextMenu.value.items.find(item => item.label === 'Add UI Element')
      expect(addUiGroup).toBeDefined()
      
      const childLabels = addUiGroup.children.map(child => child.label).filter(Boolean)
      expect(childLabels).toEqual(['Empty UI', 'UI Shape', 'UI Text', 'UI Image'])
    })

    it('closes menu correctly when closeMenu is invoked', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { contextMenu, openMenu, closeMenu } = useHierarchyMenu(handlers)
      openMenu({ clientX: 10, clientY: 10 }, null, 'world')

      // Act
      closeMenu()

      // Assert
      expect(contextMenu.value.visible).toBe(false)
    })
  })

  describe('Prefab Restrictions & Validation Rules', () => {
    it('disables "Use as Prefab" option when target node is already a prefab instance', () => {
      // Arrange
      const prefabEntity = createMockEntity({ id: 'e_prefab', prefabId: 'p_100' })
      setupMockSceneEnvironment({ entities: [prefabEntity] })

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const dummyEvent = { clientX: 100, clientY: 100 }

      // Act
      openMenu(dummyEvent, prefabEntity, 'world')

      // Assert
      const prefabItem = contextMenu.value.items.find(item => item.label === 'Use as Prefab')
      expect(prefabItem).toBeDefined()
      expect(prefabItem.disabled).toBe(true)
    })

    it('disables "Use as Prefab" option when target node is a child inside a prefab hierarchy', () => {
      // Arrange
      const parentPrefab = createMockEntity({ id: 'e_prefab_root', prefabId: 'p_100' })
      const childEntity = createMockEntity({ id: 'e_child', parentId: 'e_prefab_root' })
      setupMockSceneEnvironment({ entities: [parentPrefab, childEntity] })

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      const dummyEvent = { clientX: 100, clientY: 100 }

      // Act
      openMenu(dummyEvent, childEntity, 'world')

      // Assert
      const prefabItem = contextMenu.value.items.find(item => item.label === 'Use as Prefab')
      expect(prefabItem).toBeDefined()
      expect(prefabItem.disabled).toBe(true)
    })
  })

  describe('Clipboard Integration & Menu Action Execution', () => {
    it('executes handler actions and closes menu on action selection', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { contextMenu, openMenu } = useHierarchyMenu(handlers)
      openMenu({ clientX: 10, clientY: 20 }, null, 'world')

      const refreshItem = contextMenu.value.items.find(item => item.label === 'Refresh Tree')

      // Act
      refreshItem.action()

      // Assert
      expect(handlers.refresh).toHaveBeenCalledTimes(1)
      expect(contextMenu.value.visible).toBe(false)
    })

    it('triggers clipboard paste operation when selecting paste menu item', () => {
      // Arrange
      const sceneLayer = createMockLayer({ id: 'l_default', section: 'world' })
      setupMockSceneEnvironment({ layersWorld: [sceneLayer] })

      const workspaceStore = useWorkspaceStore()
      const sceneStore = useSceneStore()

      workspaceStore.setClipboard('entity', [{
        root: { id: 'e_copy', scriptId: 'CopiedEntity', layerId: 'l_default', parentId: null },
        descendants: []
      }], 'copy')

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)

      // Act
      openMenu({ clientX: 0, clientY: 0 }, null, 'world')
      const pasteItem = contextMenu.value.items.find(item => item.label === 'Paste')
      pasteItem.action()

      // Assert
      expect(sceneStore.activeEntities.length).toBe(1)
      expect(sceneStore.activeEntities[0].scriptId.startsWith('CopiedEntity')).toBe(true)
      expect(contextMenu.value.visible).toBe(false)
    })

    it('[Bad Path] disables paste action when clipboard is empty', () => {
      // Arrange
      setupMockSceneEnvironment()
      const workspaceStore = useWorkspaceStore()
      workspaceStore.clearClipboard()

      const { contextMenu, openMenu } = useHierarchyMenu(handlers)

      // Act
      openMenu({ clientX: 0, clientY: 0 }, null, 'world')

      // Assert
      const pasteItem = contextMenu.value.items.find(item => item.label === 'Paste')
      expect(pasteItem.disabled).toBe(true)
    })
  })
})