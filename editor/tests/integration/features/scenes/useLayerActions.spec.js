import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLayerActions, layerSchema } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { usePopAlert } from '@composables/composables.js'
import { useSceneHistory } from '@historys/historys.js'

// Mock dependency eksternal sesuai batas sistem
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    updateLayerName: vi.fn(),
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

describe('Integrasi Layer Actions', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mempersiapkan mock state untuk sceneStore yang mengadopsi useLayerActions
    sceneStoreState = {
      activeScene: {
        id: 'scene_1',
        layersWorld: [
          layerSchema({ id: 'layer_w1', name: 'World Root', orderIndex: 0, zIndex: 0 })
        ],
        layersUI: [
          layerSchema({ id: 'layer_u1', name: 'UI Root', orderIndex: 0, zIndex: 0 })
        ],
        entities: [
          { id: 'entity_1', name: 'Player', layerId: 'layer_w1', type: 'sprite' }
        ]
      },
      ...useLayerActions
    }
  })

  describe('Tambah Layer (addLayer)', () => {
    it('menambahkan layer baru ke world section, memberi tahu engine bridge, dan mencatat history', () => {
      // Act
      const newLayer = sceneStoreState.addLayer('Background', 'world', true)

      // Assert
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(2)
      expect(newLayer.name).toBe('Background')
      expect(newLayer.section).toBe('world')
      expect(newLayer.orderIndex).toBe(1)

      // Verification pada dependency eksternal
      expect(engineBridge.addLayer).toHaveBeenCalledWith(newLayer)
      
      const { recordAddLayer } = useSceneHistory()
      expect(recordAddLayer).toHaveBeenCalledWith(newLayer, 'world')
    })

    it('menambahkan layer baru ke UI section tanpa mencatat history jika recordHistory = false', () => {
      // Act
      const newLayer = sceneStoreState.addLayer('HUD', 'ui', false)

      // Assert
      expect(sceneStoreState.activeScene.layersUI.length).toBe(2)
      expect(newLayer.section).toBe('ui')
      expect(engineBridge.addLayer).toHaveBeenCalledWith(newLayer)

      const { recordAddLayer } = useSceneHistory()
      expect(recordAddLayer).not.toHaveBeenCalled()
    })

    it('[Bad Path] mengembalikan null jika activeScene tidak ada', () => {
      // Arrange
      sceneStoreState.activeScene = null

      // Act
      const result = sceneStoreState.addLayer('Ghost Layer')

      // Assert
      expect(result).toBeNull()
      expect(engineBridge.addLayer).not.toHaveBeenCalled()
    })
  })

  describe('Pembaruan Properti Layer (updateLayerName & updateLayerZIndex)', () => {
    it('memperbarui nama layer dan mengirim pembaruan ke engine bridge dan history', () => {
      // Act
      sceneStoreState.updateLayerName('layer_w1', 'Base World')

      // Assert
      const layer = sceneStoreState.activeScene.layersWorld[0]
      expect(layer.name).toBe('Base World')
      expect(engineBridge.updateLayerName).toHaveBeenCalledWith('layer_w1', 'Base World')

      const { recordLayerPropChange } = useSceneHistory()
      expect(recordLayerPropChange).toHaveBeenCalledWith('layer_w1', 'name', 'World Root', 'Base World')
    })

    it('memperbarui zIndex layer dan mengabaikan jika nilai berupa NaN', () => {
      // Act
      sceneStoreState.updateLayerZIndex('layer_w1', '10')

      // Assert
      const layer = sceneStoreState.activeScene.layersWorld[0]
      expect(layer.zIndex).toBe(10)

      const { recordLayerPropChange } = useSceneHistory()
      expect(recordLayerPropChange).toHaveBeenCalledWith('layer_w1', 'zIndex', 0, 10)

      // Act dengan input tidak valid
      sceneStoreState.updateLayerZIndex('layer_w1', 'abc')
      expect(layer.zIndex).toBe(10) // Nilai tidak berubah
    })
  })

  describe('Hapus Layer (deleteLayer)', () => {
    it('menghapus layer dan entity di dalamnya jika terdapat lebih dari satu layer', () => {
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

    it('[Bad Path] mencegah penghapusan layer terakhir dan menampilkan alert warning', () => {
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

    it('menghapus entity yang menempel pada layer yang dihapus', () => {
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

  describe('Urutan Layer (reorderLayer)', () => {
    it('mengubah urutan layer dalam section dan menyinkronkan ke engine bridge', () => {
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

  describe('Duplikasi & Paste Layer (duplicateLayer & pasteLayer)', () => {
    it('menduplikasi layer beserta entity di dalamnya', () => {
      // Act
      const createdIds = sceneStoreState.duplicateLayer('layer_w1')

      // Assert
      expect(createdIds.length).toBe(1)
      expect(sceneStoreState.activeScene.layersWorld.length).toBe(2)
      
      const duplicatedLayer = sceneStoreState.activeScene.layersWorld[1]
      expect(duplicatedLayer.name).toBe('World Root (Copy)')
      expect(duplicatedLayer.id).toBe(createdIds[0])

      // Verifikasi entity juga ikut terduplikasi
      expect(sceneStoreState.activeScene.entities.length).toBe(2)
      expect(engineBridge.createEntity).toHaveBeenCalled()
    })

    it('[Bad Path] menolak paste jika section target berbeda dari section sumber', () => {
      // Arrange
      const mockClipboard = {
        type: 'layer',
        mode: 'copy',
        data: [{
          layer: layerSchema({ name: 'World Overlay' }),
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