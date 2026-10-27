import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useShapeEditorLogic } from '@builders/builders.js'
import { useSceneStore } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { setupMockSceneEnvironment, createMockEntity } from '@tests/tests.js'
import { GenerateUUID } from '@utils/utils.js'

/**
 * Helper untuk membuat mock entity yang dilengkapi dengan komponen ShapeRenderer
 * dan elemen default (point & polygon) untuk pengujian Shape Editor.
 */
function createMockShapeEntity({
  entityId = `entity_shape_${GenerateUUID().split('-')[0]}`,
  ...overrides
} = {}) {
  const p1 = `pt_${GenerateUUID().split('-')[0]}`
  const p2 = `pt_${GenerateUUID().split('-')[0]}`
  const p3 = `pt_${GenerateUUID().split('-')[0]}`

  const defaultElements = [
    { id: p1, type: 'point', x: -50, y: -50, size: 6, enabled: true },
    { id: p2, type: 'point', x: 50, y: -50, size: 6, enabled: true },
    { id: p3, type: 'point', x: 0, y: 50, size: 6, enabled: true },
    {
      id: `poly_${GenerateUUID().split('-')[0]}`,
      type: 'polygon',
      points: [p1, p2, p3],
      enabled: true
    }
  ]

  const entity = createMockEntity({
    id: entityId,
    name: overrides.name || 'Custom Shape Entity',
    entityType: 'shape',
    ...overrides,
    attachComponents: {
      ShapeRenderer: {
        type: 'custom',
        color: '#FF1E00',
        fillOpacity: 1,
        opacity: 1,
        isFilled: true,
        outlineWidth: 2,
        outlineColor: '#0066FF',
        elements: overrides.elements || defaultElements,
        ...(overrides.shapeComponent || {})
      },
      ...(overrides.attachComponents || {})
    }
  })

  return {
    entity,
    defaultElements
  }
}

// Mock engineBridge methods
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateComponentProp: vi.fn(),
    onEntityModified: vi.fn()
  }
}))

// Mock useSceneHistory
const mockRecordComponentChange = vi.fn()
vi.mock('@historys/historys.js', () => ({
  useSceneHistory: () => ({
    recordComponentChange: mockRecordComponentChange
  })
}))

describe('useShapeEditorLogic Integration', () => {
  let sceneStore
  let mockShapeData

  beforeEach(() => {
    setActivePinia(createPinia())

    sceneStore = useSceneStore()
    mockShapeData = createMockShapeEntity({ name: 'Triangle Shape' })
    const { entity } = mockShapeData

    setupMockSceneEnvironment({ entities: [entity] })
    sceneStore.selectedEntityIds = [entity.id]
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Entity Selection and Component Verification', () => {
    it('resolves selected entity and detects ShapeRenderer correctly', () => {
      // Arrange & Act
      const logic = useShapeEditorLogic()

      // Assert
      expect(logic.selectedEntity.value?.id).toBe(mockShapeData.entity.id)
      expect(logic.hasShapeRenderer.value).toBe(true)
      expect(logic.elements.value.length).toBe(mockShapeData.defaultElements.length)
    })

    it('returns null when no entity is selected in sceneStore', () => {
      // Arrange
      sceneStore.selectedEntityIds = []
      const logic = useShapeEditorLogic()

      // Assert
      expect(logic.selectedEntity.value).toBeNull()
      expect(logic.hasShapeRenderer.value).toBe(false)
      expect(logic.elements.value).toEqual([])
    })
  })

  describe('Component Properties Data Binding and Synchronization', () => {
    it('binds and updates primitive component property across scene store, history, and engine bridge', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const entityId = mockShapeData.entity.id
      const colorProp = logic.bindComponentProp('ShapeRenderer', 'color', '#000000')

      expect(colorProp.value).toBe('#FF1E00')

      // Act: Ubah warna bentuk
      colorProp.value = '#00FF00'

      // Assert: Store lokal di-update
      const entityInStore = sceneStore.activeScene.entities.find(e => e.id === entityId)
      expect(entityInStore.components.ShapeRenderer.color).toBe('#00FF00')

      // Assert: History mencatat perubahan
      expect(mockRecordComponentChange).toHaveBeenCalledWith(
        entityId,
        'ShapeRenderer',
        'color',
        '#FF1E00',
        '#00FF00'
      )

      // Assert: engineBridge menerima pemberitahuan update
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'color',
        value: '#00FF00'
      })
    })

    it('ignores property setter if new value is identical to old value', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const colorProp = logic.bindComponentProp('ShapeRenderer', 'color', '#000000')

      // Act: Set dengan nilai yang sama
      colorProp.value = '#FF1E00'

      // Assert
      expect(mockRecordComponentChange).not.toHaveBeenCalled()
      expect(engineBridge.updateComponentProp).not.toHaveBeenCalled()
    })
  })

  describe('Elements Manipulation (Add, Update, Remove)', () => {
    it('removes element by index and syncs updated array with stores and engine', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const entityId = mockShapeData.entity.id
      const initialLength = logic.elements.value.length
      const oldElementsList = [...logic.elements.value]

      // Act: Hapus elemen pertama (Point 1)
      logic.removeElement(0)

      // Assert
      expect(logic.elements.value.length).toBe(initialLength - 1)

      const expectedNewElements = oldElementsList.slice(1)
      expect(mockRecordComponentChange).toHaveBeenCalledWith(
        entityId,
        'ShapeRenderer',
        'elements',
        oldElementsList,
        expectedNewElements
      )

      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'elements',
        value: expectedNewElements
      })
    })

    it('updates specific element by index merging new partial data', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const entityId = mockShapeData.entity.id
      const targetIndex = 0

      // Act: Ubah posisi point index 0
      logic.updateElement(targetIndex, { x: 100, y: 150 })

      // Assert
      const updatedElement = logic.elements.value[targetIndex]
      expect(updatedElement.x).toBe(100)
      expect(updatedElement.y).toBe(150)
      expect(updatedElement.size).toBe(6)

      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'ShapeRenderer',
        path: 'elements',
        value: expect.any(Array)
      })
    })
  })

  describe('[Bad Path] Edge Cases and Error Handling', () => {
    it('[Bad Path] ignores removeElement call if index is out of bounds', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      const initialLength = logic.elements.value.length

      // Act
      logic.removeElement(-1)
      logic.removeElement(999)

      // Assert
      expect(logic.elements.value.length).toBe(initialLength)
      expect(engineBridge.updateComponentProp).not.toHaveBeenCalled()
    })

    it('[Bad Path] ignores property mutation when no entity is selected', () => {
      // Arrange
      const logic = useShapeEditorLogic()
      sceneStore.selectedEntityIds = []

      // Act
      const isFilledProp = logic.bindComponentProp('ShapeRenderer', 'isFilled', false)
      isFilledProp.value = true

      // Assert
      expect(engineBridge.updateComponentProp).not.toHaveBeenCalled()
      expect(mockRecordComponentChange).not.toHaveBeenCalled()
    })
  })
})