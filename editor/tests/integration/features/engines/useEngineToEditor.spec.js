import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Impor composable yang diuji langsung dari file sumber
import { useEngineToEditor } from '@engines/useEngineToEditor.js'
import { engineBridge } from '@engines/engines.js'

// Impor store Pinia terkait
import { useSceneStore } from '@scenes/scenes.js'

// Helper mock OPFS
import { setupMockOPFS } from '@tests/tests.js'

// Mock engineBridge untuk mensimulasikan event dari engine
vi.mock('@engines/engines.js', () => {
  let entityModifiedHandler = null
  let tilemapUpdatedHandler = null

  return {
    engineBridge: {
      onEntityModified: vi.fn((cb) => {
        entityModifiedHandler = cb
      }),
      onTilemapDataUpdated: vi.fn((cb) => {
        tilemapUpdatedHandler = cb
      }),

      // Helper buatan khusus test runner untuk memicu event engine
      __triggerEntityModified: (data) => {
        if (entityModifiedHandler) entityModifiedHandler(data)
      },
      __triggerTilemapUpdated: (data) => {
        if (tilemapUpdatedHandler) tilemapUpdatedHandler(data)
      }
    }
  }
})

describe('Integration Test: useEngineToEditor', () => {
  let sceneStore

  beforeEach(() => {
    // 1. Inisialisasi Pinia & Mock Environment
    setActivePinia(createPinia())
    setupMockOPFS()

    // 2. Inisialisasi sceneStore
    sceneStore = useSceneStore()

    // Spy method sinkronisasi di sceneStore
    vi.spyOn(sceneStore, 'syncTransformFromEngine').mockImplementation(() => {})
    vi.spyOn(sceneStore, 'updateComponentProp').mockImplementation(() => {})
    vi.spyOn(sceneStore, 'syncTilemapDataFromEngine').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Inisialisasi Listener Bridge Engine', () => {
    it('mendaftarkan callback listener ke engineBridge saat listen dipanggil', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)

      // Act
      listen()

      // Assert
      expect(engineBridge.onEntityModified).toHaveBeenCalledOnce()
      expect(engineBridge.onTilemapDataUpdated).toHaveBeenCalledOnce()
    })
  })

  describe('Sinkronisasi Event entity:modified (Transform & UITransform)', () => {
    it('menyinkronkan transform standar dari engine ke sceneStore dengan payload lengkap', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockEntities = [
        {
          id: 'ent-123',
          components: {
            Transform: {
              x: 100,
              y: 200,
              width: 64,
              height: 64,
              rotation: 45,
              scaleX: 1.5,
              scaleY: 1.5,
              pivotX: 0.5,
              pivotY: 0.5,
              flipX: true,
              flipY: false,
              isRatioLocked: true,
              overridden: false
            }
          }
        }
      ]

      // Act
      engineBridge.__triggerEntityModified(mockEntities)

      // Assert
      expect(sceneStore.syncTransformFromEngine).toHaveBeenCalledWith('ent-123', {
        x: 100,
        y: 200,
        width: 64,
        height: 64,
        rotation: 45,
        scaleX: 1.5,
        scaleY: 1.5,
        pivotX: 0.5,
        pivotY: 0.5,
        flipX: true,
        flipY: false,
        isRatioLocked: true,
        overridden: false
      })
      expect(sceneStore.updateComponentProp).not.toHaveBeenCalled()
    })

    it('menyinkronkan UITransform dengan anchorX/anchorY dan memperbarui status overridden', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockEntities = [
        {
          id: 456, // Test konversi angka ke String
          components: {
            UITransform: {
              x: 50,
              y: 50,
              width: 128,
              height: 32,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              pivotX: 0,
              pivotY: 0,
              anchorX: 0.5,
              anchorY: 0.5,
              overridden: true
            }
          }
        }
      ]

      // Act
      engineBridge.__triggerEntityModified(mockEntities)

      // Assert
      expect(sceneStore.syncTransformFromEngine).toHaveBeenCalledWith('456', {
        x: 50,
        y: 50,
        width: 128,
        height: 32,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        pivotX: 0,
        pivotY: 0,
        flipX: false,
        flipY: false,
        isRatioLocked: false,
        overridden: true,
        anchorX: 0.5,
        anchorY: 0.5
      })

      expect(sceneStore.updateComponentProp).toHaveBeenCalledWith('456', 'UITransform', 'overridden', true)
    })

    it('memproses multiple entity dalam satu event payload sekaligus', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockEntities = [
        { id: 'ent-1', components: { Transform: { x: 10, y: 10 } } },
        { id: 'ent-2', components: { Transform: { x: 20, y: 20 } } }
      ]

      // Act
      engineBridge.__triggerEntityModified(mockEntities)

      // Assert
      expect(sceneStore.syncTransformFromEngine).toHaveBeenCalledTimes(2)
      expect(sceneStore.syncTransformFromEngine).toHaveBeenNthCalledWith(1, 'ent-1', expect.objectContaining({ x: 10, y: 10 }))
      expect(sceneStore.syncTransformFromEngine).toHaveBeenNthCalledWith(2, 'ent-2', expect.objectContaining({ x: 20, y: 20 }))
    })
  })

  describe('Sinkronisasi Event editor:tilemap:update-data', () => {
    it('memperbarui data tilemap di sceneStore ketika payload data valid', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockTilemapPayload = {
        entityId: 'tilemap-ent-1',
        newData: [
          [1, 1, 1],
          [0, 2, 0]
        ]
      }

      // Act
      engineBridge.__triggerTilemapUpdated(mockTilemapPayload)

      // Assert
      expect(sceneStore.syncTilemapDataFromEngine).toHaveBeenCalledWith('tilemap-ent-1', [
        [1, 1, 1],
        [0, 2, 0]
      ])
    })
  })

  describe('Penanganan Kasus Batas dan Data Tidak Valid [Bad Path]', () => {
    it('[Bad Path] mengabaikan event entity:modified jika payload bernilai null, non-array, atau kosong', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      // Act
      engineBridge.__triggerEntityModified(null)
      engineBridge.__triggerEntityModified(undefined)
      engineBridge.__triggerEntityModified({})
      engineBridge.__triggerEntityModified([])

      // Assert
      expect(sceneStore.syncTransformFromEngine).not.toHaveBeenCalled()
    })

    it('[Bad Path] mengabaikan elemen entity yang tidak memiliki id atau components', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const invalidEntities = [
        { id: null, components: { Transform: { x: 0 } } },
        { id: 'ent-no-comps' },
        { id: 'ent-empty-comps', components: {} }
      ]

      // Act
      engineBridge.__triggerEntityModified(invalidEntities)

      // Assert
      expect(sceneStore.syncTransformFromEngine).not.toHaveBeenCalled()
    })

    it('[Bad Path] mengabaikan event tilemap jika payload tidak lengkap atau bernilai null', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      // Act
      engineBridge.__triggerTilemapUpdated(null)
      engineBridge.__triggerTilemapUpdated({})
      engineBridge.__triggerTilemapUpdated({ entityId: 'ent-1' }) // tanpa newData
      engineBridge.__triggerTilemapUpdated({ newData: [[1]] }) // tanpa entityId

      // Assert
      expect(sceneStore.syncTilemapDataFromEngine).not.toHaveBeenCalled()
    })
  })
})