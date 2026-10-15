import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import { useInspectorTransform } from '@inspectors/inspectors.js'
import { useSceneStore } from '@scenes/scenes.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { engineBridge } from '@engines/engines.js'
import { projectSchema } from '@projects/projects.js'
import { useProjectStore } from '@projects/projects.js'
import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity
} from '@tests/tests.js'

describe('useInspectorTransform Integration', () => {
  let sceneStore
  let prefabStore
  let workspaceStore
  let projectStore

  let selectedEntityRef
  let isEditingMasterPrefabRef

  beforeEach(() => {
    // 1. Initialize Mock OPFS
    setupMockOPFS()

    // 2. Set Active Pinia & Instantiate Stores
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    prefabStore = usePrefabStore()
    workspaceStore = useWorkspaceStore()
    projectStore = useProjectStore()

    // 3. Set default project data
    projectStore.project = projectSchema({ id: 'test_project_1', name: 'Test Project' })

    selectedEntityRef = ref(null)
    isEditingMasterPrefabRef = ref(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupTransform() {
    return useInspectorTransform(selectedEntityRef, isEditingMasterPrefabRef)
  }

  describe('Transform Component Determination & Locks', () => {
    it('detects transform component type correctly between standard entity and UI entity', () => {
      // Arrange
      const standardEntity = createMockEntity({ id: 'ent_standard', type: 'entity' })
      const uiEntity = createMockEntity({ id: 'ent_ui', type: 'ui', entityType: 'ui_empty' })

      const { getTransformCompName } = setupTransform()

      // Act & Assert
      expect(getTransformCompName(standardEntity)).toBe('Transform')
      expect(getTransformCompName(uiEntity)).toBe('UITransform')
      expect(getTransformCompName(null)).toBe('Transform')
    })

    it('identifies size locking state when TextRenderer autoFit or Tilemap autoFit is enabled', () => {
      // Arrange
      const textEntity = createMockEntity({
        id: 'ent_text',
        components: { TextRenderer: { autoFit: true } }
      })
      setupMockSceneEnvironment({ entities: [textEntity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { isSizeLockedByText, isSizeLockedByTilemap } = setupTransform()

      // Act & Assert
      expect(isSizeLockedByText.value).toBe(true)
      expect(isSizeLockedByTilemap.value).toBe(false)
    })

    it('[Bad Path] returns false for size locks when selectedEntity is null', () => {
      // Arrange
      selectedEntityRef.value = null
      const { isSizeLockedByText, isSizeLockedByTilemap, hasChildren } = setupTransform()

      // Act & Assert
      expect(isSizeLockedByText.value).toBe(false)
      expect(isSizeLockedByTilemap.value).toBe(false)
      expect(hasChildren.value).toBe(false)
    })
  })

  describe('Global Transform Hierarchy Calculations', () => {
    it('computes accumulated global scale and formatted rotation from parent-child hierarchy', () => {
      // Arrange
      const parent = createMockEntity({
        id: 'parent_1',
        components: { Transform: { x: 100, y: 100, rotation: 45, scaleX: 2, scaleY: 2 } }
      })
      const child = createMockEntity({
        id: 'child_1',
        parentId: 'parent_1',
        components: { Transform: { x: 50, y: 0, rotation: 30, scaleX: 1.5, scaleY: 1.5 } }
      })

      setupMockSceneEnvironment({ entities: [parent, child] })
      selectedEntityRef.value = sceneStore.activeScene.entities[1]

      const { globalScaleX, globalScaleY, globalRotation } = setupTransform()

      // Act & Assert
      // Global Scale = parent (2) * child (1.5) = 3.00
      expect(globalScaleX.value).toBe('3.00')
      expect(globalScaleY.value).toBe('3.00')
      // Global Rotation = (45 + 30) % 360 = 75.00
      expect(globalRotation.value).toBe('75.00')
    })

    it('returns null for global transform properties when entity has no parent', () => {
      // Arrange
      const rootEntity = createMockEntity({ id: 'root_1', parentId: null })
      setupMockSceneEnvironment({ entities: [rootEntity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { globalScaleX, globalScaleY, globalRotation } = setupTransform()

      // Act & Assert
      expect(globalScaleX.value).toBeNull()
      expect(globalScaleY.value).toBeNull()
      expect(globalRotation.value).toBeNull()
    })
  })

  describe('Pivot Point Updates (updatePivot)', () => {
    it('recalculates local position and pivot coordinates when pivot is moved in sceneStore', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_pivot',
        components: {
          Transform: { x: 100, y: 100, width: 200, height: 100, pivotX: 0.5, pivotY: 0.5, rotation: 0, scaleX: 1, scaleY: 1 }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { updatePivot } = setupTransform()

      // Act - Shift pivot from (0.5, 0.5) to (1.0, 1.0)
      // dPx = 0.5, dPy = 0.5 -> localDx = 0.5 * 200 = 100, localDy = 0.5 * 100 = 50
      updatePivot({ x: 1.0, y: 1.0 })

      // Assert
      const updatedTransform = sceneStore.activeScene.entities[0].components.Transform
      expect(updatedTransform.pivotX).toBe(1.0)
      expect(updatedTransform.pivotY).toBe(1.0)
      expect(updatedTransform.x).toBe(200)
      expect(updatedTransform.y).toBe(150)
    })

    it('updates pivot and position in prefabStore when editing master prefab', () => {
      // Arrange
      setupMockSceneEnvironment()
      isEditingMasterPrefabRef.value = true

      prefabStore.initPrefabs([
        {
          id: 'prefab_202',
          name: 'Box Prefab',
          data: {
            id: 'p_box',
            components: {
              Transform: { x: 0, y: 0, width: 100, height: 100, pivotX: 0, pivotY: 0, rotation: 0, scaleX: 1, scaleY: 1 }
            }
          }
        }
      ])
      workspaceStore.openTab({ id: 'prefab_202', name: 'Box Prefab', type: 'prefab' })
      selectedEntityRef.value = prefabStore.getPrefabById('prefab_202').data

      const { updatePivot } = setupTransform()

      // Act
      updatePivot({ x: 0.5, y: 0.5 })

      // Assert
      const prefabTransform = prefabStore.getPrefabById('prefab_202').data.components.Transform
      expect(prefabTransform.pivotX).toBe(0.5)
      expect(prefabTransform.pivotY).toBe(0.5)
      expect(prefabTransform.x).toBe(50)
      expect(prefabTransform.y).toBe(50)
    })
  })

  describe('Transform Reset Operations (resetTransform & resetTilemapTransform)', () => {
    it('resets transform values to defaults and records transform history', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_reset',
        components: {
          Transform: { x: 500, y: 300, rotation: 180, scaleX: 2, scaleY: 2, pivotX: 0, pivotY: 0, flipX: true, flipY: true }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { resetTransform } = setupTransform()

      // Act
      resetTransform()

      // Assert
      const t = sceneStore.activeScene.entities[0].components.Transform
      expect(t.x).toBe(0)
      expect(t.y).toBe(0)
      expect(t.rotation).toBe(0)
      expect(t.scaleX).toBe(1)
      expect(t.scaleY).toBe(1)
      expect(t.pivotX).toBe(0.5)
      expect(t.pivotY).toBe(0.5)
      expect(t.flipX).toBe(false)
      expect(t.flipY).toBe(false)
    })

    it('resets tilemap transform dimensions based on tile map dimensions and tile size', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_tilemap',
        components: {
          Transform: { width: 100, height: 100 },
          Tilemap: { width: 20, height: 15, tileWidth: 16, tileHeight: 16 }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})

      const { resetTilemapTransform } = setupTransform()

      // Act
      resetTilemapTransform()

      // Assert - Target width = 20 * 16 = 320, target height = 15 * 16 = 240
      const transform = sceneStore.activeScene.entities[0].components.Transform
      expect(transform.width).toBe(320)
      expect(transform.height).toBe(240)
      expect(spyBridge).toHaveBeenCalledWith({
        entityId: 'ent_tilemap',
        componentName: 'Transform',
        path: 'width',
        value: 320
      })
    })

    it('[Bad Path] returns safely on reset operations when selectedEntity is null', () => {
      // Arrange
      selectedEntityRef.value = null
      const { resetTransform, resetTilemapTransform, fitToChildren } = setupTransform()

      // Act & Assert
      expect(() => {
        resetTransform()
        resetTilemapTransform()
        fitToChildren()
      }).not.toThrow()
    })
  })

  describe('Fit to Children Operations (fitToChildren)', () => {
    it('calculates bounding box of descendant entities and resizes parent transform accordingly', () => {
      // Arrange
      const parent = createMockEntity({
        id: 'parent_container',
        components: {
          Transform: { x: 0, y: 0, width: 10, height: 10, pivotX: 0.5, pivotY: 0.5, rotation: 0, scaleX: 1, scaleY: 1 }
        }
      })
      const child1 = createMockEntity({
        id: 'child_a',
        parentId: 'parent_container',
        components: {
          Transform: { x: -50, y: -50, width: 100, height: 100, pivotX: 0.5, pivotY: 0.5, rotation: 0, scaleX: 1, scaleY: 1 }
        }
      })
      const child2 = createMockEntity({
        id: 'child_b',
        parentId: 'parent_container',
        components: {
          Transform: { x: 50, y: 50, width: 100, height: 100, pivotX: 0.5, pivotY: 0.5, rotation: 0, scaleX: 1, scaleY: 1 }
        }
      })

      setupMockSceneEnvironment({ entities: [parent, child1, child2] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'patchComponent').mockImplementation(() => {})

      const { fitToChildren, hasChildren } = setupTransform()

      // Act
      expect(hasChildren.value).toBe(true)
      fitToChildren()

      // Assert
      const parentTransform = sceneStore.activeScene.entities[0].components.Transform
      expect(parentTransform.width).toBeGreaterThan(0)
      expect(parentTransform.height).toBeGreaterThan(0)
      expect(spyBridge).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'parent_container',
          componentName: 'Transform'
        })
      )
    })
  })
})