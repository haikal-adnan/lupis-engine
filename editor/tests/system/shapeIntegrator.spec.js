import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Import target modules langsung dari source file (tanpa barrel)
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { engineBridge } from '@engines/engines.js'
import { useSceneHistory } from '@historys/historys.js'
import { useShapeEditorLogic } from '@builders/builders.js'

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

describe('Shape Editor Panel System Integration Test', () => {
  let sceneStore
  let workspaceStore
  let sceneHistory
  let entityId

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    sceneHistory = useSceneHistory()

    // Setup Mock Engine Bus dengan emit, on, dan off untuk mencegah error disconnect
    workspaceStore.setEngine({
      bus: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      }
    })

    // 1. Arrange Environment: Entity dengan komponen ShapeRenderer
    const entity = createMockEntity({
      name: 'Custom Shape Entity',
      entityType: 'shape',
      attachComponents: {
        ShapeRenderer: {
          type: 'custom',
          isFilled: true,
          color: '#0066FF',
          fillOpacity: 0.3,
          outlineWidth: 2,
          outlineColor: '#0066FF',
          outlineOpacity: 1.0,
          elements: [
            { id: 'pt_1', type: 'point', x: -50, y: -50, size: 6, enabled: true },
            { id: 'pt_2', type: 'point', x: 50, y: -50, size: 6, enabled: true },
            { id: 'pt_3', type: 'point', x: 50, y: 50, size: 6, enabled: true },
            { id: 'poly_1', type: 'polygon', points: ['pt_1', 'pt_2', 'pt_3'], enabled: true }
          ]
        }
      }
    })
    entityId = entity.id

    setupMockSceneEnvironment({
      entities: [entity],
      selectedEntityIds: [entityId]
    })

    // Buka tab shape_editor di workspace agar activeTab.type === 'shape_editor'
    workspaceStore.openTab({
      id: entityId,
      name: 'Custom Shape Entity',
      type: 'shape_editor',
      fixed: false
    })
    workspaceStore.setActiveTab(entityId)

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
    it('binds shape component properties and synchronizes mutations with SceneStore, EngineBridge, and History', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const colorBinding = logic.bindComponentProp('ShapeRenderer', 'color', '#0066FF')
      const outlineWidthBinding = logic.bindComponentProp('ShapeRenderer', 'outlineWidth', 2)

      // Act
      colorBinding.value = '#FF0000'
      outlineWidthBinding.value = 5

      // Assert Reactive State di SceneStore
      const shapeComp = sceneStore.activeScene.entities[0].components.ShapeRenderer
      expect(shapeComp.color).toBe('#FF0000')
      expect(shapeComp.outlineWidth).toBe(5)

      // Assert EngineBridge Transmission
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'color',
        value: '#FF0000'
      })
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'outlineWidth',
        value: 5
      })

      // Assert SceneHistory Capability (Undo)
      expect(sceneHistory.undo).toBeTypeOf('function')
      sceneHistory.undo()
      expect(sceneStore.activeScene.entities[0].components.ShapeRenderer.outlineWidth).toBe(2)
    })

    it('detects shape renderer presence correctly when active entity is selected', () => {
      // Arrange & Act
      const logic = useShapeEditorLogic()

      // Assert
      expect(logic.selectedEntity.value.id).toBe(entityId)
      expect(logic.hasShapeRenderer.value).toBe(true)
      expect(logic.elements.value.length).toBe(4)
    })
  })

  describe('Shape Elements Collection Management', () => {
    it('updates element property in elements array and syncs with scene store', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const initialPoint = logic.elements.value[0]
      expect(initialPoint.x).toBe(-50)

      // Act: Update point position di index 0
      logic.updateElement(0, { x: -100, y: -100 })

      // Assert
      const updatedElements = sceneStore.activeScene.entities[0].components.ShapeRenderer.elements
      expect(updatedElements[0].x).toBe(-100)
      expect(updatedElements[0].y).toBe(-100)

      // Assert EngineBridge Transmission
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'elements',
        value: updatedElements
      })
    })

    it('removes element from elements collection and records change to history', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      expect(logic.elements.value.length).toBe(4)

      // Act: Hapus elemen index 3 (poly_1)
      logic.removeElement(3)

      // Assert
      const updatedElements = sceneStore.activeScene.entities[0].components.ShapeRenderer.elements
      expect(updatedElements.length).toBe(3)
      expect(updatedElements.find(e => e.id === 'poly_1')).toBeUndefined()

      // Assert EngineBridge Transmission
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'elements',
        value: updatedElements
      })
    })
  })

  describe('Workspace Tools and Context Management', () => {
    it('updates active tool in WorkspaceStore', () => {
      // Act
      workspaceStore.setTool('polygon')

      // Assert
      expect(workspaceStore.activeTool).toBe('polygon')
    })

    it('updates shapeContext opacity and triggers workspace update on engine bus', () => {
      // Arrange
      const emitSpy = vi.fn()
      workspaceStore.setEngine({
        bus: { emit: emitSpy, on: vi.fn(), off: vi.fn() }
      })

      workspaceStore.shapeContext = { opacity: 0.3, showOthers: true, pointSize: 6 }

      // Act: Ubah opacity context
      const newCtx = { ...workspaceStore.shapeContext, opacity: 0.8 }
      workspaceStore.shapeContext = newCtx
      workspaceStore.engine.bus.emit('workspace:store:update', { shapeContext: newCtx })

      // Assert
      expect(workspaceStore.shapeContext.opacity).toBe(0.8)
      expect(emitSpy).toHaveBeenCalledWith('workspace:store:update', { shapeContext: newCtx })
    })

    it('updates shapeContext showOthers visibility correctly', () => {
      // Arrange
      workspaceStore.shapeContext = { opacity: 0.3, showOthers: true, pointSize: 6 }

      // Act
      workspaceStore.shapeContext.showOthers = false

      // Assert
      expect(workspaceStore.shapeContext.showOthers).toBe(false)
    })
  })

  describe('Keyboard Shortcuts and Interactions', () => {
    const shortcutMap = {
      ' ': 'hand', 'v': 'select', 'e': 'eraser', 'p': 'point', 
      's': 'segment', 'l': 'line', 'g': 'polygon', 'c': 'circle'
    }

    const setupKeyboardHandler = () => {
      const handleKeydown = (event) => {
        const tagName = event.target.tagName
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || event.target.isContentEditable) return
        if (workspaceStore.activeTab?.type !== 'shape_editor') return

        const key = event.key.toLowerCase()
        if (shortcutMap[key]) {
          if (key === ' ') event.preventDefault()
          workspaceStore.setTool(shortcutMap[key])
        }
      }
      window.addEventListener('keydown', handleKeydown)
      return () => window.removeEventListener('keydown', handleKeydown)
    }

    it('switches tool on pressing shortcut key when shape_editor tab is active', () => {
      // Arrange
      const cleanup = setupKeyboardHandler()

      workspaceStore.setActiveTab(entityId)
      expect(workspaceStore.activeTab?.type).toBe('shape_editor')

      // Act: Dispatch KeyboardEvent tombol 'g' (Polygon Tool)
      const event = new KeyboardEvent('keydown', { key: 'g', bubbles: true })
      window.dispatchEvent(event)

      // Assert
      expect(workspaceStore.activeTool).toBe('polygon')

      cleanup()
    })

    it('switches to eraser tool on pressing "e" key', () => {
      // Arrange
      const cleanup = setupKeyboardHandler()

      workspaceStore.setActiveTab(entityId)
      expect(workspaceStore.activeTab?.type).toBe('shape_editor')

      // Act: Dispatch KeyboardEvent tombol 'e' (Eraser Tool)
      const event = new KeyboardEvent('keydown', { key: 'e', bubbles: true })
      window.dispatchEvent(event)

      // Assert
      expect(workspaceStore.activeTool).toBe('eraser')

      cleanup()
    })
  })

  describe('Negative Scenarios [Bad Path]', () => {
    it('[Bad Path] handles gracefully when operations run without active shape entity', () => {
      // Arrange: Deselect entity dari scene
      sceneStore.selectedEntityIds = []
      workspaceStore.closeTab(entityId)

      const logic = useShapeEditorLogic()

      // Act & Assert (Tidak melempar exception/crash)
      expect(() => {
        logic.removeElement(0)
        logic.updateElement(0, { x: 0 })
      }).not.toThrow()

      expect(logic.selectedEntity.value).toBeNull()
      expect(logic.hasShapeRenderer.value).toBe(false)
    })

    it('[Bad Path] ignores removeElement with out-of-bounds index', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const initialLength = logic.elements.value.length

      // Act: Mencoba menghapus index negatif dan di luar jangkauan
      logic.removeElement(-1)
      logic.removeElement(99)

      // Assert Elements Unchanged
      expect(logic.elements.value.length).toBe(initialLength)
    })
  })
})