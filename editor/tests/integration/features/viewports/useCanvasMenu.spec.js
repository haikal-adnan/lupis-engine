import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasMenu } from '@viewports/viewports.js'
import { useSceneStore } from '@scenes/useSceneStore.js'
import { useWorkspaceStore } from '@workspaces/useWorkspaceStore.js'
import { 
  createMockEntity, 
  createMockLayer, 
  setupMockSceneEnvironment 
} from '@tests/tests.js'

// Mock external dependencies outside the tested system boundaries
vi.mock('@composables/composables.js', () => ({
  useClipboard: () => ({
    copy: vi.fn(),
    cut: vi.fn(),
    duplicate: vi.fn(),
    remove: vi.fn()
  }),
  usePopAlert: () => ({
    showPop: vi.fn()
  }),
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true)
  })
}))

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    addLayer: vi.fn(),
    updateLayerScriptId: vi.fn(),
    deleteLayer: vi.fn(),
    reorderLayer: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    updateComponentProp: vi.fn(),
    removeComponent: vi.fn(),
    getCameraPosition: vi.fn().mockReturnValue({ x: 0, y: 0 })
  }
}))

vi.mock('@historys/historys.js', () => ({
  useSceneHistory: () => ({
    recordAddLayer: vi.fn(),
    recordDeleteLayer: vi.fn(),
    recordLayerPropChange: vi.fn(),
    recordReorderLayer: vi.fn(),
    recordEntityCreate: vi.fn(),
    recordEntityDelete: vi.fn(),
    recordEntityMove: vi.fn(),
    recordPropChange: vi.fn(),
    recordAddComponent: vi.fn(),
    recordRemoveComponent: vi.fn()
  })
}))

describe('Canvas Menu Integration', () => {
  let workspaceStore
  let sceneStore
  let mockCanvasHandlers

  beforeEach(() => {
    setActivePinia(createPinia())
    workspaceStore = useWorkspaceStore()
    sceneStore = useSceneStore()

    mockCanvasHandlers = {
      bringToFront: vi.fn(),
      sendToBack: vi.fn(),
      useAsPrefab: vi.fn(),
      toggleLock: vi.fn(),
      toggleHidden: vi.fn(),
      toggleInactive: vi.fn(),
      createEntityAtPosition: vi.fn(),
      pasteAtPosition: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('useCanvasMenu Integration with Scene and Workspace Store', () => {
    it('displays entity options when an entity is selected', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_1', name: 'Hero' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(100, 200, 50, 50, true)

      // Assert
      expect(contextMenu.value.visible).toBe(true)
      expect(contextMenu.value.x).toBe(100)
      expect(contextMenu.value.y).toBe(200)

      const labels = contextMenu.value.items.map(item => item.label).filter(Boolean)
      expect(labels).toContain('Copy')
      expect(labels).toContain('Cut')
      expect(labels).toContain('Duplicate')
      expect(labels).toContain('Bring to Front')
      expect(labels).toContain('Send to Back')
      expect(labels).toContain('Use as Prefab')
      expect(labels).toContain('Delete')
    })

    it('disables Use as Prefab action when entity is a descendant of a Prefab', () => {
      // Arrange
      const prefabParent = createMockEntity({ id: 'prefab_root', prefabId: 'prefab_123' })
      const childEntity = createMockEntity({ id: 'child_1', parentId: 'prefab_root' })

      setupMockSceneEnvironment({ entities: [prefabParent, childEntity] })
      sceneStore.selectedEntityIds = ['child_1']

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(100, 200, 0, 0, true)

      // Assert
      const prefabItem = contextMenu.value.items.find(item => item.label === 'Use as Prefab')
      expect(prefabItem).toBeDefined()
      expect(prefabItem.disabled).toBe(true)
    })

    it('displays world layer creation menu when in scene tab without entity selected', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'l_world', scriptId: 'Background_World', name: 'Background_World' })
      setupMockSceneEnvironment({ layersWorld: [worldLayer] })
      workspaceStore.openTab({ id: 'scene', name: 'Scene Editor', type: 'scene' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(150, 150, 30, 40, false)

      // Assert
      const createItem = contextMenu.value.items.find(item => item.label === 'Create Entity')
      expect(createItem).toBeDefined()
      expect(createItem.children.length).toBe(1)
      expect(createItem.children[0].label).toBe('Background_World')

      const entitySubTypes = createItem.children[0].children.map(child => child.label)
      expect(entitySubTypes).toEqual(['Empty Entity', 'Sprite', 'Shape', 'Text', 'Tilemap'])
    })

    it('displays UI layer creation menu when in UI tab', () => {
      // Arrange
      const uiLayer = createMockLayer({ id: 'l_ui', scriptId: 'HUD_Layer', name: 'HUD_Layer' })
      setupMockSceneEnvironment({ layersUI: [uiLayer] })
      workspaceStore.openTab({ id: 'ui_tab', name: 'UI Editor', type: 'ui' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(200, 200, 10, 10, false)

      // Assert
      const createItem = contextMenu.value.items.find(item => item.label === 'Create Entity')
      const entitySubTypes = createItem.children[0].children.map(child => child.label)

      expect(createItem.children[0].label).toBe('HUD_Layer')
      expect(entitySubTypes).toEqual(['UI Shape', 'UI Text', 'UI Image'])
    })

    it('enables Paste Here button only when workspaceStore has clipboard data', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act 1: Without clipboard
      workspaceStore.clearClipboard()
      openMenu(100, 100, 0, 0, false)

      let pasteItem = contextMenu.value.items.find(i => i.label === 'Paste Here')
      expect(pasteItem.disabled).toBe(true)

      // Act 2: With clipboard
      workspaceStore.setClipboard('entity', { id: 'copied_ent' }, 'copy')
      openMenu(100, 100, 0, 0, false)

      pasteItem = contextMenu.value.items.find(i => i.label === 'Paste Here')
      expect(pasteItem.disabled).toBe(false)
    })

    it('calls createEntityAtPosition handler with expected position parameters', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'l_world_target', name: 'Main Layer' })
      setupMockSceneEnvironment({ layersWorld: [worldLayer] })
      workspaceStore.openTab({ id: 'scene', name: 'Scene Editor', type: 'scene' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(300, 400, 120, 250, false)
      const createItem = contextMenu.value.items.find(i => i.label === 'Create Entity')
      const spriteOption = createItem.children[0].children.find(c => c.label === 'Sprite')

      spriteOption.action()

      // Assert
      expect(mockCanvasHandlers.createEntityAtPosition).toHaveBeenCalledWith('sprite', 'l_world_target', 120, 250)
    })

    it('sets contextMenu.visible to false when closeMenu is called', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { contextMenu, openMenu, closeMenu } = useCanvasMenu(mockCanvasHandlers)

      openMenu(100, 100, 0, 0, false)
      expect(contextMenu.value.visible).toBe(true)

      // Act
      closeMenu()

      // Assert
      expect(contextMenu.value.visible).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling [Bad Path]', () => {
    it('[Bad Path] handles scenario when active scene is not found or null', () => {
      // Arrange
      sceneStore.scenes = []
      sceneStore.activeSceneId = null

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act & Assert (Ensure it does not throw or crash)
      expect(() => {
        openMenu(100, 100, 0, 0, true)
      }).not.toThrow()

      const prefabItem = contextMenu.value.items.find(i => i.label === 'Use as Prefab')
      expect(prefabItem.disabled).toBe(true)
    })

    it('[Bad Path] manages default entity creation items when no matching layers exist in section', () => {
      // Arrange
      // Clear layerWorld
      setupMockSceneEnvironment({ layersWorld: [] })
      workspaceStore.openTab({ id: 'scene', name: 'Scene Editor', type: 'scene' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(100, 100, 50, 50, false)

      // Assert
      const createItem = contextMenu.value.items.find(i => i.label === 'Create Entity')
      expect(createItem).toBeDefined()

      // Returns direct entity creation actions without layer wrapper
      const labels = createItem.children.map(c => c.label)
      expect(labels).toEqual(['Empty Entity', 'Sprite', 'Shape', 'Text', 'Tilemap'])

      // Call action with null layer
      createItem.children[0].action()
      expect(mockCanvasHandlers.createEntityAtPosition).toHaveBeenCalledWith('empty', null, 50, 50)
    })
  })
})