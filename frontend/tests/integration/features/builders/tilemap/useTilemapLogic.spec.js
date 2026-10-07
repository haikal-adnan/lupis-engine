import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useTilemapLogic } from '@builders/builders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { engineBridge } from '@engines/engines.js'
import { setupMockSceneEnvironment, createMockTilemapEntity } from '@tests/tests.js'

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateComponentProp: vi.fn(),
    onToolPickup: vi.fn()
  }
}))

describe('useTilemapLogic Integration', () => {
  let sceneStore
  let workspaceStore
  let assetStore
  let mockTilemapData

  beforeEach(() => {
    setActivePinia(createPinia())

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()

    mockTilemapData = createMockTilemapEntity({ name: 'Level 1 Tilemap' })
    const { entity, mockAsset } = mockTilemapData

    setupMockSceneEnvironment({ entities: [entity] })
    assetStore.initAssets([mockAsset])

    sceneStore.selectedEntityIds = [entity.id]

    workspaceStore.openTab({
      id: entity.id,
      name: entity.name,
      type: 'tilemap'
    })
    workspaceStore.setActiveTab(entity.id)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Entity Selection and Tilemap Identification', () => {
    it('resolves selected entity and tilemap component status correctly', () => {
      // Arrange & Act
      const logic = useTilemapLogic()

      // Assert
      expect(logic.selectedEntity.value?.id).toBe(mockTilemapData.entity.id)
      expect(logic.hasTilemap.value).toBe(true)
      expect(logic.tileWidth.value).toBe(16)
      expect(logic.tileHeight.value).toBe(16)
      expect(logic.width.value).toBe(10)
      expect(logic.height.value).toBe(10)
    })

    it('opens tilemap editor tab in workspace store', () => {
      // Arrange
      const logic = useTilemapLogic()

      // Act
      logic.openTilemapEditor()

      // Assert
      expect(workspaceStore.activeTab.id).toBe(mockTilemapData.entity.id)
      expect(workspaceStore.activeTab.type).toBe('tilemap')
    })
  })

  describe('Component Properties Data Binding and Synchronization', () => {
    it('updates component property across scene store and engine bridge while recording history', () => {
      // Arrange
      const logic = useTilemapLogic()
      const entityId = mockTilemapData.entity.id

      // Act
      logic.tileWidth.value = 32

      // Assert
      const entityInStore = sceneStore.activeScene.entities.find(e => e.id === entityId)
      expect(entityInStore.components.Tilemap.tileWidth).toBe(32)

      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Tilemap',
        path: 'tileWidth',
        value: 32
      })

      // Act: Undo
      logic.undo()

      // Assert
      expect(entityInStore.components.Tilemap.tileWidth).toBe(16)
    })

    it('fetches texture URL when assetId changes', async () => {
      // Arrange
      const logic = useTilemapLogic()
      const newAssetId = 'asset_new_tileset_123'
      
      const spyGetUrl = vi.spyOn(assetStore, 'getAssetUrlById').mockResolvedValue('blob:http://localhost/tileset.png')

      // Act
      logic.assetId.value = newAssetId
      await nextTick()

      // Assert
      expect(spyGetUrl).toHaveBeenCalledWith(newAssetId)
      expect(logic.currentTextureUrl.value).toBe('blob:http://localhost/tileset.png')
    })
  })

  describe('Palette Selection and Tool Pickup', () => {
    it('applies tile data mutation to scene store and engine bridge', () => {
      // Arrange
      const logic = useTilemapLogic()
      const entityId = mockTilemapData.entity.id
      const newMapData = new Array(100).fill(1)

      // Act
      logic.applyTileDataMutation(newMapData)

      // Assert
      const entityInStore = sceneStore.activeScene.entities.find(e => e.id === entityId)
      expect(entityInStore.components.Tilemap.data).toEqual(newMapData)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Tilemap',
        path: 'data',
        value: newMapData
      })
    })

    it('handles region selection on palette in select mode and sets workspace brush tool', () => {
      // Arrange
      const logic = useTilemapLogic()
      logic.setPaletteMode('select')

      logic.viewportRef.value = {
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600, x: 0, y: 0 })
      }

      logic.viewX.value = 0
      logic.viewY.value = 0

      const fakePointerDown = { pointerId: 1, button: 0, clientX: 32, clientY: 32 }
      const fakePointerUp = { pointerId: 1, button: 0, clientX: 32, clientY: 32 }

      // Act
      logic.onPointerDown(fakePointerDown)
      expect(logic.isSelecting.value).toBe(true)

      logic.onPointerUp(fakePointerUp)

      // Assert
      expect(logic.isSelecting.value).toBe(false)
      expect(logic.hasSelection.value).toBe(true)
      expect(workspaceStore.activeTool).toBe('brush')
    })
  })

  describe('Workspace Tool and Context Interaction', () => {
    it('synchronizes workspace tool and context opacity controls', () => {
      // Arrange
      const logic = useTilemapLogic()

      // Act
      logic.setTool('eraser')
      logic.setContextOpacity(0.8)

      // Assert
      expect(workspaceStore.activeTool).toBe('eraser')
      expect(workspaceStore.tilemapContext.opacity).toBe(0.8)
    })

    it('toggles tilemap context visibility correctly', () => {
      // Arrange
      const logic = useTilemapLogic()
      const initialVisibility = workspaceStore.tilemapContext.showOthers

      // Act
      logic.toggleContextVisibility()

      // Assert
      expect(workspaceStore.tilemapContext.showOthers).toBe(!initialVisibility)
    })
  })

  describe('[Bad Path] Edge Cases and Error Handling', () => {
    it('[Bad Path] handles asset URL fetch rejection gracefully', async () => {
      // Arrange
      const logic = useTilemapLogic()
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(assetStore, 'getAssetUrlById').mockRejectedValueOnce(new Error('Asset non-existent'))

      // Act
      logic.assetId.value = 'invalid_asset_id'
      await nextTick()

      // Assert
      expect(logic.currentTextureUrl.value).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Gagal memuat URL tekstur tilemap:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it('[Bad Path] ignores property mutation when no entity is selected', () => {
      // Arrange
      const logic = useTilemapLogic()
      sceneStore.activeScene.entities = []
      sceneStore.selectedEntityIds = []

      // Act
      logic.tileWidth.value = 64
      logic.applyTileDataMutation([1, 2, 3])

      // Assert
      expect(logic.selectedEntity.value).toBeNull()
      expect(engineBridge.updateComponentProp).not.toHaveBeenCalled()
    })
  })
})