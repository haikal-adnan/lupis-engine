import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLayerActions, layerSchema } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { usePopAlert } from '@composables/composables.js'
import { useSceneHistory } from '@historys/historys.js'

// Mock external dependencies within system boundaries
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    updateLayerScriptId: vi.fn(),
    reorderLayer: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn()
  }
}))

vi.mock('@composables/composables.js', () => {
  const showPopMock = vi.fn()
  return {
    usePopAlert: () => ({
      showPop: showPopMock
    })
  }
})

vi.mock('@historys/historys.js', () => {
  const recordAddLayerMock = vi.fn()
  const recordDeleteLayerMock = vi.fn()
  const recordLayerPropChangeMock = vi.fn()
  const recordReorderLayerMock = vi.fn()

  return {
    useSceneHistory: () => ({
      recordAddLayer: recordAddLayerMock,
      recordDeleteLayer: recordDeleteLayerMock,
      recordLayerPropChange: recordLayerPropChangeMock,
      recordReorderLayer: recordReorderLayerMock
    })
  }
})

describe('Layer Actions Integration', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Prepare mock state for sceneStore adopting useLayerActions
    sceneStoreState = {
      activeScene: {
        id: 'scene_1',
        layersWorld: [
          layerSchema({ id: 'layer_w1', scriptId: 'World_Root', orderIndex: 0, zIndex: 0 })
        ],
        layersUI: [
          layerSchema({ id: 'layer_u1', scriptId: 'UI_Root', orderIndex: 0, zIndex: 0 })
        ],
        entities: [
          { id: 'entity_1', scriptId: 'Player', layerId: 'layer_w1', type: 'sprite' }
        ]
      },
      ...useLayerActions
    }
  })

  describe('Add Layer (addLayer)', () => {
    it('adds new layer to world section, notifies engine bridge, and records history', () => {
      // Act
      const newLayer = sceneStoreState.addLayer('Background', 'world', true)

      // Assert
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(2)
      expect(newLayer.scriptId).toBe('Background')
      expect(newLayer.section).toBe('world')
      expect(newLayer.orderIndex).toBe(1)

      // Verify external dependencies
      expect(engineBridge.addLayer).toHaveBeenCalledWith(newLayer)
      
      const { recordAddLayer } = useSceneHistory()
      expect(recordAddLayer).toHaveBeenCalledWith(newLayer, 'world')
    })

    it('adds new layer to UI section without recording history if recordHistory = false', () => {
      // Act
      const newLayer = sceneStoreState.addLayer('HUD', 'ui', false)

      // Assert
      expect(sceneStoreState.activeScene.layersUI.length).toBe(2)
      expect(newLayer.section).toBe('ui')
      expect(engineBridge.addLayer).toHaveBeenCalledWith(newLayer)

      const { recordAddLayer } = useSceneHistory()
      expect(recordAddLayer).not.toHaveBeenCalled()
    })

    it('[Bad Path] returns null if activeScene does not exist', () => {
      // Arrange
      sceneStoreState.activeScene = null

      // Act
      const result = sceneStoreState.addLayer('Ghost Layer')

      // Assert
      expect(result).toBeNull()
      expect(engineBridge.addLayer).not.toHaveBeenCalled()
    })
  })

  describe('Layer Property Updates (updateLayerScriptId & updateLayerZIndex)', () => {
    it('updates layer scriptId and sends update to engine bridge and history', () => {
      // Act
      sceneStoreState.updateLayerScriptId('layer_w1', 'Base_World')

      // Assert
      const layer = sceneStoreState.activeScene.layersWorld[0]
      expect(layer.scriptId).toBe('Base_World')
      expect(engineBridge.updateLayerScriptId).toHaveBeenCalledWith('layer_w1', 'Base_World')

      const { recordLayerPropChange } = useSceneHistory()
      expect(recordLayerPropChange).toHaveBeenCalledWith('layer_w1', 'scriptId', 'World_Root', 'Base_World')
    })

    it('updates layer zIndex and ignores if value is NaN', () => {
      // Act
      sceneStoreState.updateLayerZIndex('layer_w1', '10')

      // Assert
      const layer = sceneStoreState.activeScene.layersWorld[0]
      expect(layer.zIndex).toBe(10)

      const { recordLayerPropChange } = useSceneHistory()
      expect(recordLayerPropChange).toHaveBeenCalledWith('layer_w1', 'zIndex', 0, 10)

      // Act with invalid input
      sceneStoreState.updateLayerZIndex('layer_w1', 'abc')
      expect(layer.zIndex).toBe(10) // Value unchanged
    })
  })

  describe('Delete Layer (deleteLayer)', () => {
    it('deletes layer and entities within if more than one layer exists', () => {
      // Arrange
      const layer2 = sceneStoreState.addLayer('Foreground', 'world')

      // Act
      sceneStoreState.deleteLayer(layer2.id)

      // Assert
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(1)
      expect(engineBridge.deleteLayer).toHaveBeenCalledWith(layer2.id)

      const { recordDeleteLayer } = useSceneHistory()
      expect(recordDeleteLayer).toHaveBeenCalledWith(layer2, 'world', [])
    })

    it('[Bad Path] prevents deleting last layer and displays warning alert', () => {
      // Act
      sceneStoreState.deleteLayer('layer_w1')

      // Assert
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(1)
      expect(engineBridge.deleteLayer).not.toHaveBeenCalled()

      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Action Prevented',
        message: 'Cannot delete the last layer in World section.',
        type: 'warning'
      })
    })

    it('deletes entities attached to the deleted layer', () => {
      // Arrange
      sceneStoreState.addLayer('Secondary World', 'world')

      // Act
      sceneStoreState.deleteLayer('layer_w1')

      // Assert
      expect(sceneStoreState.activeScene.entities.length).toBe(0)
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('entity_1')
      expect(engineBridge.deleteLayer).toHaveBeenCalledWith('layer_w1')
    })
  })

  describe('Layer Ordering (reorderLayer)', () => {
    it('changes layer order within section and synchronizes with engine bridge', () => {
      // Arrange
      const layer2 = sceneStoreState.addLayer('Layer 2', 'world')

      // Act
      sceneStoreState.reorderLayer(layer2.id, 'layer_w1', 'top')

      // Assert
      const layers = sceneStoreState.activeScene.layersWorld
      expect(layers[0].id).toBe(layer2.id)
      expect(layers[0].orderIndex).toBe(0)
      expect(layers[1].id).toBe('layer_w1')
      expect(layers[1].orderIndex).toBe(1)

      expect(engineBridge.reorderLayer).toHaveBeenCalledWith({
        id: layer2.id,
        targetId: 'layer_w1',
        position: 'top'
      })
    })
  })

  describe('Layer Duplication & Paste (duplicateLayer & pasteLayer)', () => {
    it('duplicates layer along with entities inside it', () => {
      // Act
      const createdIds = sceneStoreState.duplicateLayer('layer_w1')

      // Assert
      expect(createdIds.length).toBe(1)
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(2)
      
      const duplicatedLayer = sceneStoreState.activeScene.layersWorld[1]
      expect(duplicatedLayer.scriptId).toBe('World_Root_copy')
      expect(duplicatedLayer.id).toBe(createdIds[0])

      // Verify entity is also duplicated
      expect(sceneStoreState.activeScene.entities.length).toBe(2)
      expect(engineBridge.createEntity).toHaveBeenCalled()
    })

    it('[Bad Path] rejects paste if target section differs from source section', () => {
      // Arrange
      const mockClipboard = {
        type: 'layer',
        mode: 'copy',
        data: [{
          layer: layerSchema({ scriptId: 'World_Overlay' }),
          entities: [],
          section: 'world'
        }]
      }

      // Act
      const createdIds = sceneStoreState.pasteLayer(mockClipboard, 'ui')

      // Assert
      expect(createdIds.length).toBe(0)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Paste Failed',
        message: 'Cannot paste world layer into ui section.',
        type: 'error'
      })
    })
  })
})