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

// Mock dependency eksternal di luar batas sistem yang diuji
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
    updateLayerName: vi.fn(),
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

describe('Integrasi Canvas Menu', () => {
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

  describe('Integrasi useCanvasMenu dengan Scene dan Workspace Store', () => {
    it('menampilkan opsi entitas ketika ada entitas yang dipilih', () => {
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

    it('nonaktifkan aksi Use as Prefab ketika entitas merupakan turunan dari Prefab', () => {
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

    it('menampilkan menu pemuatan layer bertipe world saat di tab scene tanpa memilih entitas', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'l_world', name: 'Background World' })
      setupMockSceneEnvironment({ layersWorld: [worldLayer] })
      workspaceStore.openTab({ id: 'scene', name: 'Scene Editor', type: 'scene' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(150, 150, 30, 40, false)

      // Assert
      const createItem = contextMenu.value.items.find(item => item.label === 'Create Entity')
      expect(createItem).toBeDefined()
      expect(createItem.children.length).toBe(1)
      expect(createItem.children[0].label).toBe('Background World')

      const entitySubTypes = createItem.children[0].children.map(child => child.label)
      expect(entitySubTypes).toEqual(['Empty Entity', 'Sprite', 'Shape', 'Text', 'Tilemap'])
    })

    it('menampilkan menu pemuatan layer bertipe ui saat berada di tab ui', () => {
      // Arrange
      const uiLayer = createMockLayer({ id: 'l_ui', name: 'HUD Layer' })
      setupMockSceneEnvironment({ layersUI: [uiLayer] })
      workspaceStore.openTab({ id: 'ui_tab', name: 'UI Editor', type: 'ui' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(200, 200, 10, 10, false)

      // Assert
      const createItem = contextMenu.value.items.find(item => item.label === 'Create Entity')
      const entitySubTypes = createItem.children[0].children.map(child => child.label)

      expect(createItem.children[0].label).toBe('HUD Layer')
      expect(entitySubTypes).toEqual(['UI Shape', 'UI Text', 'UI Image'])
    })

    it('mengaktifkan tombol Paste Here hanya jika workspaceStore memiliki data clipboard', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act 1: Tanpa clipboard
      workspaceStore.clearClipboard()
      openMenu(100, 100, 0, 0, false)

      let pasteItem = contextMenu.value.items.find(i => i.label === 'Paste Here')
      expect(pasteItem.disabled).toBe(true)

      // Act 2: Dengan clipboard
      workspaceStore.setClipboard('entity', { id: 'copied_ent' }, 'copy')
      openMenu(100, 100, 0, 0, false)

      pasteItem = contextMenu.value.items.find(i => i.label === 'Paste Here')
      expect(pasteItem.disabled).toBe(false)
    })

    it('memanggil handler createEntityAtPosition dengan parameter posisi yang sesuai', () => {
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

    it('mengubah state contextMenu.visible menjadi false saat closeMenu dipanggil', () => {
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

  describe('Pengujian Skenario Buruk [Bad Path]', () => {
    it('[Bad Path] menangani kondisi saat scene aktif tidak ditemukan atau bernilai null', () => {
      // Arrange
      sceneStore.scenes = []
      sceneStore.activeSceneId = null

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act & Assert (Memastikan tidak melontarkan error crash)
      expect(() => {
        openMenu(100, 100, 0, 0, true)
      }).not.toThrow()

      const prefabItem = contextMenu.value.items.find(i => i.label === 'Use as Prefab')
      expect(prefabItem.disabled).toBe(true)
    })

    it('[Bad Path] mengelola item pembuatan entitas default jika tidak ada layer yang cocok pada section', () => {
      // Arrange
      // Mengosongkan layerWorld
      setupMockSceneEnvironment({ layersWorld: [] })
      workspaceStore.openTab({ id: 'scene', name: 'Scene Editor', type: 'scene' })

      const { contextMenu, openMenu } = useCanvasMenu(mockCanvasHandlers)

      // Act
      openMenu(100, 100, 50, 50, false)

      // Assert
      const createItem = contextMenu.value.items.find(i => i.label === 'Create Entity')
      expect(createItem).toBeDefined()

      // Mengembalikan aksi pembuatan entitas langsung tanpa pembungkus layer
      const labels = createItem.children.map(c => c.label)
      expect(labels).toEqual(['Empty Entity', 'Sprite', 'Shape', 'Text', 'Tilemap'])

      // Memanggil fungsi aksi layer null
      createItem.children[0].action()
      expect(mockCanvasHandlers.createEntityAtPosition).toHaveBeenCalledWith('empty', null, 50, 50)
    })
  })
})