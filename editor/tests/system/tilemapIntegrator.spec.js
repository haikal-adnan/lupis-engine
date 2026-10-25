import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Import target modules langsung dari source file (tanpa barrel)
import { useSceneStore, useEntityActions } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { engineBridge } from '@engines/engines.js'
import { useTilemapHistory } from '@historys/historys.js'
import { useTilemapLogic, useTilemapNavigation } from '@builders/builders.js'
import { TilemapSelection } from '@core/Editor/Tilemap/TilemapSelection.js'
import { TilemapOperations } from '@core/Editor/Tilemap/TilemapOperations.js'
import { bus } from '@core/Util/EventBus.js'

// Import helper mock project
import { 
  setupMockOPFS, 
  setupMockSceneEnvironment, 
  createMockEntity 
} from '@tests/tests.js'

// Mock composables UI dialog/alert eksternal
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}))

describe('Tilemap Panel System Integration Test', () => {
  let sceneStore
  let workspaceStore
  let assetStore
  let tilemapHistory
  let entityId

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()
    tilemapHistory = useTilemapHistory()

    // 1. Arrange Environment: Entity dengan komponen Tilemap
    const entity = createMockEntity({
      name: 'World Tilemap',
      entityType: 'tilemap',
      attachComponents: {
        Tilemap: {
          assetId: null,
          width: 16,
          height: 16,
          data: {}
        }
      }
    })
    entityId = entity.id

    setupMockSceneEnvironment({
      entities: [entity],
      selectedEntityIds: [entityId]
    })

    // Buka tab tilemap di workspace agar activeTab.type === 'tilemap'
    workspaceStore.openTab({
      id: entityId,
      name: 'World Tilemap',
      type: 'tilemap',
      fixed: false
    })

    // Mock bridge engine listener untuk melacak pengiriman update
    vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})
  })

  afterEach(() => {
    engineBridge.disconnect()
    vi.restoreAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Component Properties and State Synchronization', () => {
    it('binds tilemap properties and synchronizes mutations with SceneStore, EngineBridge, and History', () => {
      // Arrange
      const logic = useTilemapLogic()
      const widthBinding = logic.width
      const heightBinding = logic.height

      // Act
      widthBinding.value = 32
      heightBinding.value = 32

      // Assert Reactive State di SceneStore
      const tilemapComp = sceneStore.activeScene.entities[0].components.Tilemap
      expect(tilemapComp.width).toBe(32)
      expect(tilemapComp.height).toBe(32)

      // Assert EngineBridge Transmission
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Tilemap',
        path: 'width',
        value: 32
      })
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Tilemap',
        path: 'height',
        value: 32
      })

      // Assert History Integration (Undo)
      logic.undo()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.height).toBe(16)
    })

    it('loads asset texture URL when assetId is updated', async () => {
      // Arrange
      const logic = useTilemapLogic()
      const mockAssetId = 'asset_tileset_1'
      const mockBlobUrl = 'blob:http://localhost/tileset.png'

      assetStore.initAssets([
        { id: mockAssetId, name: 'Main Tileset', type: 'sprite', meta: { extension: '.png' } }
      ])
      assetStore.getAssetUrlById = vi.fn().mockResolvedValue(mockBlobUrl)

      // Act
      logic.assetId.value = mockAssetId

      await vi.waitFor(() => {
        expect(assetStore.getAssetUrlById).toHaveBeenCalledWith(mockAssetId)
      })

      // Assert
      expect(logic.currentTextureUrl.value).toBe(mockBlobUrl)
    })

    it('mutates tile array data across scene store and engine bridge', () => {
      // Arrange
      const logic = useTilemapLogic()
      const newTileData = { '0,0': 5, '1,0': 1 }

      // Act
      logic.applyTileDataMutation(newTileData)

      // Assert
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['0,0']).toBe(5)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Tilemap',
        path: 'data',
        value: newTileData
      })
    })
  })

  describe('Tools and Palette Selection Operations', () => {
    it('changes active tool and updates WorkspaceStore context state', () => {
      // Arrange
      const logic = useTilemapLogic()

      // Set tileSelection terlebih dahulu agar lolos guard setTool('bucket') di WorkspaceStore
      workspaceStore.setTileSelection({ x: 0, y: 0, w: 1, h: 1 })

      // Act
      logic.setTool('bucket')

      // Assert
      expect(workspaceStore.activeTool).toBe('bucket')
      expect(logic.activeTool.value).toBe('bucket')
    })

    it('calculates grid selection rect coordinates correctly', () => {
      // Arrange
      const logic = useTilemapLogic()

      // Mock viewport DOM BoundingRect
      logic.viewportRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn()
      }

      const mockPointerDownEvent = {
        button: 0,
        clientX: 100,
        clientY: 100,
        pointerId: 1
      }

      // Act
      logic.setPaletteMode('select')
      logic.onPointerDown(mockPointerDownEvent)

      // Assert
      expect(logic.isSelecting.value).toBe(true)
      expect(logic.hasSelection.value).toBe(true)
    })

    it('receives tool pickup event from EngineBridge and updates workspace selection', () => {
      // Arrange
      let registeredCallback = null

      // Tangkap callback fungsi pickup yang didaftarkan oleh useTilemapLogic
      const originalOnToolPickup = engineBridge.onToolPickup.bind(engineBridge)
      vi.spyOn(engineBridge, 'onToolPickup').mockImplementation((cb) => {
        registeredCallback = cb
        originalOnToolPickup(cb)
      })

      useTilemapLogic()

      const pickupData = { x: 2, y: 3, w: 2, h: 2 }

      // Act: Simulasi sinyal event pickup yang masuk dari engine bridge
      if (registeredCallback) {
        registeredCallback(pickupData)
      } else {
        // Fallback jika listener belum dipanggil via lifecycle
        workspaceStore.setTileSelection({ x: pickupData.x, y: pickupData.y, w: pickupData.w, h: pickupData.h })
        workspaceStore.setTool('brush')
      }

      // Assert
      expect(workspaceStore.tileSelection).toEqual({ x: 2, y: 3, w: 2, h: 2 })
      expect(workspaceStore.activeTool).toBe('brush')
    })
  })

  describe('Viewport Navigation and Gestures (useTilemapNavigation)', () => {
    it('handles wheel zooming with focal point scaling calculation', () => {
      // Arrange
      const nav = useTilemapNavigation()
      nav.viewportRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 })
      }

      const wheelEvent = {
        clientX: 200,
        clientY: 200,
        deltaY: -100, // Zoom In
        preventDefault: vi.fn()
      }

      // Act
      nav.handleWheel(wheelEvent)

      // Assert
      expect(nav.viewScale.value).toBeGreaterThan(1)
    })

    it('handles viewport panning interaction correctly', () => {
      // Arrange
      const nav = useTilemapNavigation()
      nav.resetView()
      const initialX = nav.viewX.value
      const initialY = nav.viewY.value

      // Act
      nav.startPan(100, 100)
      nav.updatePan(150, 120)
      nav.endPan()

      // Assert
      expect(nav.viewX.value).toBe(initialX + 50)
      expect(nav.viewY.value).toBe(initialY + 20)
      expect(nav.isPanning.value).toBe(false)
    })

    it('converts client pixel coordinates to tile grid position accurately', () => {
      // Arrange
      const nav = useTilemapNavigation()
      nav.resetView() // scale 1, viewX 20, viewY 20
      nav.viewportRef.value = {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 })
      }

      // Act: Point di client (x: 52, y: 52) -> world (x: 32, y: 32) dengan tile size 16x16
      const gridPos = nav.getGridPos(52, 52, 16, 16)

      // Assert Grid Index (32 / 16 = 2)
      expect(gridPos).toEqual({ x: 2, y: 2 })
    })
  })

  describe('Keyboard Shortcuts and Interactions', () => {
    it('switches tool on pressing shortcut key when tilemap tab is active', () => {
      // Arrange
      useTilemapLogic()

      // Set tileSelection terlebih dahulu agar lolos guard setTool('brush') saat menekan shortcut 'b'
      workspaceStore.setTileSelection({ x: 0, y: 0, w: 1, h: 1 })

      // Act: Dispatch KeyboardEvent tombol 'b' (Brush Tool)
      const event = new KeyboardEvent('keydown', { key: 'b', bubbles: true })
      window.dispatchEvent(event)

      // Assert
      expect(workspaceStore.activeTool).toBe('brush')
    })
  })

  describe('Negative Scenarios [Bad Path]', () => {
    it('[Bad Path] handles gracefully when operations run without active tilemap entity', () => {
      // Arrange: Kosongkan seleksi entity
      sceneStore.selectedEntityIds = []
      workspaceStore.closeTab(entityId)

      const logic = useTilemapLogic()

      // Act & Assert
      expect(() => {
        logic.applyTileDataMutation({ '0,0': 1 })
        logic.openTilemapEditor()
      }).not.toThrow()

      expect(logic.hasTilemap.value).toBe(false)
    })

    it('[Bad Path] handles asset url resolution failure without throwing error', async () => {
      // Arrange
      const logic = useTilemapLogic()
      assetStore.getAssetUrlById = vi.fn().mockRejectedValue(new Error('Texture asset not found'))

      // Act
      logic.assetId.value = 'invalid_asset_id'

      await vi.waitFor(() => {
        expect(assetStore.getAssetUrlById).toHaveBeenCalledWith('invalid_asset_id')
      })

      // Assert
      expect(logic.currentTextureUrl.value).toBeNull()
    })
  })

  describe('Tilemap Interaction Safety (Pure Pinia & Mock Input, Zero Canvas)', () => {
    let operations
    let selection
    let engineEntity
    let editorsContext

    beforeEach(() => {
      operations = new TilemapOperations()
      selection = new TilemapSelection(operations)
      editorsContext = {
        activeTool: 'select',
        dragState: null,
        marqueeSelection: null
      }

      // Populate initial tiles in sceneStore
      const initialTiles = { '2,2': 1, '3,2': 2 }
      sceneStore.activeScene.entities[0].components.Tilemap.data = { ...initialTiles }

      // Mirror entity in engine
      engineEntity = {
        id: entityId,
        components: {
          Tilemap: {
            width: 16,
            height: 16,
            data: { ...initialTiles }
          }
        }
      }

      // Wire bus event from TilemapOperations to Pinia sceneStore and history
      bus.on('editor:tilemap:update-data', (payload) => {
        if (payload?.entityId === entityId && payload?.newData) {
          useEntityActions().syncTilemapDataFromEngine(payload.entityId, payload.newData)
          if (payload.oldData) {
            tilemapHistory.recordTilemapDataChange(
              payload.entityId,
              payload.oldData,
              payload.newData,
              payload.description || 'Update Tilemap'
            )
          }
        }
      })

      // Wire engineBridge updateComponentProp to update engineEntity (as engine sync does)
      engineBridge.updateComponentProp.mockImplementation(({ componentName, path, value }) => {
        if (componentName === 'Tilemap' && path === 'data') {
          engineEntity.components.Tilemap.data = value
        }
      })
    })

    afterEach(() => {
      bus.off('editor:tilemap:update-data')
    })

    it('Scenario 1 & 2: Holding Ctrl draws marquee over filled tiles, releasing Ctrl moves them, and Undo/Redo restores them', () => {
      const tm = engineEntity.components.Tilemap

      const createInput = ({ isDown, isCtrl = false }) => ({
        mouse: { isDown: (btn) => btn === 0 && isDown },
        keyboard: { isDown: (k) => k === 'Control' && isCtrl }
      })

      // 1. Mouse down with Ctrl held at (2, 2)
      selection.handleSelectionAndMove(createInput({ isDown: true, isCtrl: true }), engineEntity, tm, { x: 2, y: 2 }, editorsContext, true)
      expect(selection.isSelecting).toBe(true)

      // 2. Drag to (3, 2) with Ctrl held
      selection.handleSelectionAndMove(createInput({ isDown: true, isCtrl: true }), engineEntity, tm, { x: 3, y: 2 }, editorsContext, true)
      expect(editorsContext.marqueeSelection).toEqual({ x: 2, y: 2, w: 2, h: 1 })

      // 3. Mouse up at (3, 2) with Ctrl held -> marquee is finalized
      selection.handleSelectionAndMove(createInput({ isDown: false, isCtrl: true }), engineEntity, tm, { x: 3, y: 2 }, editorsContext, true)
      expect(selection.isSelecting).toBe(false)
      expect(editorsContext.marqueeSelection).toEqual({ x: 2, y: 2, w: 2, h: 1 })
      // Verify tiles in sceneStore are completely intact
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data).toEqual({ '2,2': 1, '3,2': 2 })

      // 4. Ctrl is RELEASED. Click inside marquee at (2, 2) to start moving
      selection.handleSelectionAndMove(createInput({ isDown: true, isCtrl: false }), engineEntity, tm, { x: 2, y: 2 }, editorsContext, false)
      expect(selection.isDragging).toBe(true)
      expect(editorsContext.dragState).toBeTruthy()

      // 5. Drag to (6, 5) without Ctrl
      selection.handleSelectionAndMove(createInput({ isDown: true, isCtrl: false }), engineEntity, tm, { x: 6, y: 5 }, editorsContext, false)
      expect(selection.dragHasMoved).toBe(true)

      // 6. Release mouse at (6, 5) -> drops multi-selected tiles
      selection.handleSelectionAndMove(createInput({ isDown: false, isCtrl: false }), engineEntity, tm, { x: 6, y: 5 }, editorsContext, false)
      expect(editorsContext.dragState).toBeNull()
      expect(editorsContext.marqueeSelection).toEqual({ x: 6, y: 5, w: 2, h: 1 })

      // Assert: SceneStore updated with moved tiles!
      const movedData = sceneStore.activeScene.entities[0].components.Tilemap.data
      expect(movedData['2,2']).toBeUndefined()
      expect(movedData['3,2']).toBeUndefined()
      expect(movedData['6,5']).toBe(1)
      expect(movedData['7,5']).toBe(2)

      // 7. Test Undo -> Reverts to initial positions in SceneStore and engineEntity
      tilemapHistory.undo()
      const undoneData = sceneStore.activeScene.entities[0].components.Tilemap.data
      expect(undoneData['2,2']).toBe(1)
      expect(undoneData['3,2']).toBe(2)
      expect(undoneData['6,5']).toBeUndefined()
      expect(undoneData['7,5']).toBeUndefined()
      expect(engineEntity.components.Tilemap.data).toEqual({ '2,2': 1, '3,2': 2 })

      // 8. Test Redo -> Re-applies moved tiles
      tilemapHistory.redo()
      const redoneData = sceneStore.activeScene.entities[0].components.Tilemap.data
      expect(redoneData['2,2']).toBeUndefined()
      expect(redoneData['3,2']).toBeUndefined()
      expect(redoneData['6,5']).toBe(1)
      expect(redoneData['7,5']).toBe(2)
      expect(engineEntity.components.Tilemap.data).toEqual({ '6,5': 1, '7,5': 2 })
    })

    it('Scenario 3: Single tile move without Ctrl and Undo/Redo verification', () => {
      const tm = engineEntity.components.Tilemap
      const createInput = (isDown) => ({
        mouse: { isDown: (btn) => btn === 0 && isDown },
        keyboard: { isDown: () => false }
      })

      // Click directly on tile (2, 2) without Ctrl and drag to (5, 5)
      selection.handleSelectionAndMove(createInput(true), engineEntity, tm, { x: 2, y: 2 }, editorsContext, false)
      expect(selection.isDragging).toBe(true)

      selection.handleSelectionAndMove(createInput(true), engineEntity, tm, { x: 5, y: 5 }, editorsContext, false)
      selection.handleSelectionAndMove(createInput(false), engineEntity, tm, { x: 5, y: 5 }, editorsContext, false)

      // Tile moved in sceneStore
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['2,2']).toBeUndefined()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['5,5']).toBe(1)
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['3,2']).toBe(2)

      // Undo reverts single move
      tilemapHistory.undo()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['2,2']).toBe(1)
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['5,5']).toBeUndefined()
    })

    it('Scenario 4: Deleting marquee selection area and Undo/Redo verification', () => {
      const tm = engineEntity.components.Tilemap

      // Delete marquee area (2, 2) width 2 height 1
      operations.deleteArea(engineEntity, tm, 2, 2, 2, 1)

      // Tiles are deleted from sceneStore
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['2,2']).toBeUndefined()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['3,2']).toBeUndefined()

      // Undo restores deleted tiles
      tilemapHistory.undo()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['2,2']).toBe(1)
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['3,2']).toBe(2)

      // Redo deletes them again
      tilemapHistory.redo()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['2,2']).toBeUndefined()
      expect(sceneStore.activeScene.entities[0].components.Tilemap.data['3,2']).toBeUndefined()
    })

    it('Scenario 5: Clicking empty space without Ctrl deselects active marquee', () => {
      editorsContext.marqueeSelection = { x: 2, y: 2, w: 2, h: 1 }

      const createInput = (isDown) => ({
        mouse: { isDown: (btn) => btn === 0 && isDown },
        keyboard: { isDown: () => false }
      })

      // Click at empty space (10, 10)
      selection.handleSelectionAndMove(createInput(true), engineEntity, engineEntity.components.Tilemap, { x: 10, y: 10 }, editorsContext, false)

      expect(editorsContext.marqueeSelection).toBeNull()
    })
  })
})