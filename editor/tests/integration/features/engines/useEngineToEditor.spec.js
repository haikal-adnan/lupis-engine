import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Import composable under test directly from source file
import { useEngineToEditor } from '@engines/useEngineToEditor.js'
import { engineBridge } from '@engines/engines.js'

// Import related Pinia store
import { useSceneStore, useEntityActions } from '@scenes/scenes.js'
import * as scenesModule from '@scenes/scenes.js'

// OPFS mock helper
import { setupMockOPFS } from '@tests/tests.js'

// Mock engineBridge to simulate engine events
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

      // Test runner helper to trigger engine events
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
  let entityActions

  beforeEach(() => {
    // 1. Initialize Pinia & Mock Environment
    setActivePinia(createPinia())
    setupMockOPFS()

    // 2. Initialize sceneStore & entityActions
    sceneStore = useSceneStore()
    entityActions = useEntityActions()
    vi.spyOn(scenesModule, 'useEntityActions').mockReturnValue(entityActions)

    // Spy synchronization methods
    vi.spyOn(sceneStore, 'syncTransformFromEngine').mockImplementation(() => {})
    vi.spyOn(entityActions, 'updateComponentProp').mockImplementation(() => {})
    vi.spyOn(entityActions, 'syncTilemapDataFromEngine').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Engine Bridge Listener Initialization', () => {
    it('registers listener callbacks to engineBridge when listen is called', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)

      // Act
      listen()

      // Assert
      expect(engineBridge.onEntityModified).toHaveBeenCalledOnce()
      expect(engineBridge.onTilemapDataUpdated).toHaveBeenCalledOnce()
    })
  })

  describe('Event Synchronization: entity:modified (Transform & UITransform)', () => {
    it('synchronizes standard transform from engine to sceneStore with complete payload', () => {
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
      expect(entityActions.updateComponentProp).not.toHaveBeenCalled()
    })

    it('synchronizes UITransform with anchorX/anchorY and updates overridden status', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockEntities = [
        {
          id: 456, // Test number-to-string conversion
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

      expect(entityActions.updateComponentProp).toHaveBeenCalledWith('456', 'UITransform', 'overridden', true)
    })

    it('processes multiple entities in a single event payload', () => {
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

  describe('Event Synchronization: editor:tilemap:update-data', () => {
    it('updates tilemap data in sceneStore when payload data is valid', () => {
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
      expect(entityActions.syncTilemapDataFromEngine).toHaveBeenCalledWith('tilemap-ent-1', [
        [1, 1, 1],
        [0, 2, 0]
      ])
    })

    it('syncs data and records history when payload contains oldData', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      const mockTilemapPayload = {
        entityId: 'tilemap-ent-1',
        oldData: { '0,0': 1 },
        newData: { '1,1': 2 },
        description: 'Move Tiles'
      }

      // Act
      engineBridge.__triggerTilemapUpdated(mockTilemapPayload)

      // Assert
      expect(entityActions.syncTilemapDataFromEngine).toHaveBeenCalledWith('tilemap-ent-1', { '1,1': 2 })
    })
  })

  describe('Boundary Cases and Invalid Data Handling [Bad Path]', () => {
    it('[Bad Path] ignores entity:modified event if payload is null, non-array, or empty', () => {
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

    it('[Bad Path] ignores entity elements that lack id or components', () => {
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

    it('[Bad Path] ignores tilemap event if payload is incomplete or null', () => {
      // Arrange
      const { listen } = useEngineToEditor(sceneStore)
      listen()

      // Act
      engineBridge.__triggerTilemapUpdated(null)
      engineBridge.__triggerTilemapUpdated({})
      engineBridge.__triggerTilemapUpdated({ entityId: 'ent-1' }) // without newData
      engineBridge.__triggerTilemapUpdated({ newData: [[1]] }) // without entityId

      // Assert
      expect(entityActions.syncTilemapDataFromEngine).not.toHaveBeenCalled()
    })
  })
})