import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useSceneStore } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { engineBridge } from '@engines/engines.js'

import {
  useHierarchyLogic
} from '@scenes/scenes.js'

import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity,
  createMockLayer,
  createMockScene
} from '@tests/tests.js'

// Mock composables dialog untuk pengujian terisolasi
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
  usePrompt: () => ({ prompt: vi.fn().mockResolvedValue('Mocked Name') }),
  useAlert: () => ({ alert: vi.fn().mockResolvedValue(true) })
}))

describe('Hierarchy Management Integration', () => {
  let sceneStore
  let projectStore

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    projectStore = useProjectStore()

    projectStore.project = {
      id: 'proj_hierarchy_test',
      name: 'Hierarchy Test Project',
      scenes: []
    }

    // Reset spy engineBridge
    vi.restoreAllMocks()
    vi.spyOn(engineBridge, 'addLayer').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'deleteLayer').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'createEntity').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'deleteEntity').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'moveEntity').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'updateEntityProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'reorderLayer').mockImplementation(() => {})
  })

  describe('Layer Operations & Section Separation Integration', () => {
    it('creates layers in World and UI sections separately and triggers engineBridge', () => {
      // Arrange
      setupMockSceneEnvironment()

      // Act
      const worldLayer = sceneStore.addLayer('World Layer 2', 'world')
      const uiLayer = sceneStore.addLayer('HUD Layer', 'ui')

      // Assert
      expect(sceneStore.activeScene.layersWorld).toContainEqual(expect.objectContaining({ id: worldLayer.id, name: 'World Layer 2' }))
      expect(sceneStore.activeScene.layersUI).toContainEqual(expect.objectContaining({ id: uiLayer.id, name: 'HUD Layer' }))
      expect(engineBridge.addLayer).toHaveBeenCalledTimes(2)
    })

    it('[Bad Path] prevents deleting the last remaining layer in World or UI section', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'layer_world_sole', name: 'Sole World', section: 'world' })
      const uiLayer = createMockLayer({ id: 'layer_ui_sole', name: 'Sole UI', section: 'ui' })
      setupMockSceneEnvironment({ layersWorld: [worldLayer], layersUI: [uiLayer] })

      // Act
      sceneStore.deleteLayer(worldLayer.id)
      sceneStore.deleteLayer(uiLayer.id)

      // Assert
      expect(sceneStore.activeScene.layersWorld).toHaveLength(1)
      expect(sceneStore.activeScene.layersUI).toHaveLength(1)
      expect(engineBridge.deleteLayer).not.toHaveBeenCalled()
    })

    it('deletes layer along with all its contained entities', () => {
      // Arrange
      const targetLayer = createMockLayer({ id: 'layer_world_extra', section: 'world' })
      const defaultLayer = createMockLayer({ id: 'layer_world_default', section: 'world' })
      const entityInLayer = createMockEntity({ id: 'ent_in_layer', layerId: targetLayer.id })

      setupMockSceneEnvironment({
        layersWorld: [defaultLayer, targetLayer],
        entities: [entityInLayer]
      })

      // Act
      sceneStore.deleteLayer(targetLayer.id)

      // Assert
      expect(sceneStore.activeScene.layersWorld.find(l => l.id === targetLayer.id)).toBeUndefined()
      expect(sceneStore.activeScene.entities.find(e => e.id === 'ent_in_layer')).toBeUndefined()
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_in_layer')
      expect(engineBridge.deleteLayer).toHaveBeenCalledWith(targetLayer.id)
    })
  })

  describe('Entity Branching & Parent-Child Hierarchy Integration', () => {
    it('constructs a multi-level tree structure correctly with treeData getter', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_world_default', section: 'world' })
      const parent = createMockEntity({ id: 'parent_1', name: 'Parent Node', layerId: layer.id })
      const child = createMockEntity({ id: 'child_1', name: 'Child Node', parentId: 'parent_1', layerId: layer.id })
      const grandChild = createMockEntity({ id: 'grandchild_1', name: 'Grandchild Node', parentId: 'child_1', layerId: layer.id })

      setupMockSceneEnvironment({ layersWorld: [layer], entities: [parent, child, grandChild] })

      // Act
      const { treeData } = useHierarchyLogic()

      // Assert
      const worldLayers = treeData.value.worldTree
      expect(worldLayers).toHaveLength(1)
      const rootEntities = worldLayers[0].children
      expect(rootEntities).toHaveLength(1)
      expect(rootEntities[0].id).toBe('parent_1')
      expect(rootEntities[0].children[0].id).toBe('child_1')
      expect(rootEntities[0].children[0].children[0].id).toBe('grandchild_1')
    })

    it('moves entity to become child of another entity and updates sceneStore and engineBridge', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_world_default', section: 'world' })
      const entityA = createMockEntity({ id: 'ent_a', layerId: layer.id })
      const entityB = createMockEntity({ id: 'ent_b', layerId: layer.id })

      setupMockSceneEnvironment({ layersWorld: [layer], entities: [entityA, entityB] })
      const { moveEntity } = useHierarchyLogic()

      // Act: Pindahkan entityB ke dalam entityA (position: 'inside')
      moveEntity('ent_b', { id: 'ent_a', type: 'entity', layerId: layer.id }, 'inside')

      // Assert
      const updatedEntityB = sceneStore.activeScene.entities.find(e => e.id === 'ent_b')
      expect(updatedEntityB.parentId).toBe('ent_a')
      expect(engineBridge.moveEntity).toHaveBeenCalledWith(expect.objectContaining({
        draggedId: 'ent_b',
        newParentId: 'ent_a',
        insertionType: 'inside'
      }))
    })

    it('[Bad Path] prevents moving an entity into its own descendant child', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_world_default', section: 'world' })
      const parent = createMockEntity({ id: 'parent_x', layerId: layer.id })
      const child = createMockEntity({ id: 'child_y', parentId: 'parent_x', layerId: layer.id })

      setupMockSceneEnvironment({ layersWorld: [layer], entities: [parent, child] })
      const { moveEntity } = useHierarchyLogic()

      // Act: Coba geser parent ke dalam child-nya sendiri
      moveEntity('parent_x', { id: 'child_y', type: 'entity', layerId: layer.id }, 'inside')

      // Assert
      const parentEntity = sceneStore.activeScene.entities.find(e => e.id === 'parent_x')
      expect(parentEntity.parentId).toBeNull() // Posisi tidak berubah
      expect(engineBridge.moveEntity).not.toHaveBeenCalled()
    })
  })

  describe('Section Boundaries & Prefab Restriction Integration', () => {
    it('[Bad Path] prevents moving World entity to UI Layer and vice versa', () => {
      // Arrange
      const worldLayer = createMockLayer({ id: 'layer_world_1', section: 'world' })
      const uiLayer = createMockLayer({ id: 'layer_ui_1', section: 'ui' })

      const worldEntity = createMockEntity({ id: 'ent_world', type: 'entity', layerId: worldLayer.id })
      const uiEntity = createMockEntity({ id: 'ent_ui', entityType: 'ui_empty', layerId: uiLayer.id })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer],
        entities: [worldEntity, uiEntity]
      })
      const { moveEntity } = useHierarchyLogic()

      // Act 1: Coba pindahkan entitas World ke UI Layer
      moveEntity('ent_world', { id: 'layer_ui_1', type: 'layer', section: 'ui' }, 'inside')
      // Act 2: Coba pindahkan entitas UI ke World Layer
      moveEntity('ent_ui', { id: 'layer_world_1', type: 'layer', section: 'world' }, 'inside')

      // Assert
      expect(sceneStore.activeScene.entities.find(e => e.id === 'ent_world').layerId).toBe('layer_world_1')
      expect(sceneStore.activeScene.entities.find(e => e.id === 'ent_ui').layerId).toBe('layer_ui_1')
      expect(engineBridge.moveEntity).not.toHaveBeenCalled()
    })

    it('[Bad Path] restricts creating child entities inside an immutable Prefab instance tree', () => {
      // Arrange
      const prefabParent = createMockEntity({ id: 'prefab_instance_1', prefabId: 'master_prefab_1' })
      const prefabChild = createMockEntity({ id: 'prefab_child_1', parentId: 'prefab_instance_1' })

      setupMockSceneEnvironment({ entities: [prefabParent, prefabChild] })

      // Act: Coba buat entitas baru di dalam anak dari instansi prefab
      const result = sceneStore.createEntity('sprite', { id: 'prefab_child_1', type: 'entity', layerId: 'layer_world_default' })

      // Assert
      expect(result).toBe(false)
      expect(sceneStore.activeScene.entities).toHaveLength(2) // Tidak ada entitas baru bertambah
    })

    it('[Bad Path] restricts deleting an entity located inside a Prefab instance', () => {
      // Arrange
      const prefabParent = createMockEntity({ id: 'prefab_root', prefabId: 'master_prefab_1' })
      const prefabChild = createMockEntity({ id: 'prefab_nested_child', parentId: 'prefab_root' })

      setupMockSceneEnvironment({ entities: [prefabParent, prefabChild] })

      // Act
      const deleteResult = sceneStore.deleteEntity('prefab_nested_child')

      // Assert
      expect(deleteResult).toBe(false)
      expect(sceneStore.activeScene.entities).toHaveLength(2)
      expect(engineBridge.deleteEntity).not.toHaveBeenCalled()
    })
  })

  describe('Sorting & Indexing Rules Integration (zIndex and orderIndex)', () => {
    it('sorts layers and entities based on zIndex ascending, then orderIndex ascending', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_world_1', zIndex: 0 })
      const ent1 = createMockEntity({ id: 'ent_1', layerId: layer.id, zIndex: 1, orderIndex: 0 })
      const ent2 = createMockEntity({ id: 'ent_2', layerId: layer.id, zIndex: 0, orderIndex: 2 })
      const ent3 = createMockEntity({ id: 'ent_3', layerId: layer.id, zIndex: 0, orderIndex: 1 })

      setupMockSceneEnvironment({ layersWorld: [layer], entities: [ent1, ent2, ent3] })
      const { treeData } = useHierarchyLogic()

      // Act
      const sortedChildren = treeData.value.worldTree[0].children

      // Assert:
      // ent3 (z:0, order:1) -> ent2 (z:0, order:2) -> ent1 (z:1, order:0)
      expect(sortedChildren[0].id).toBe('ent_3')
      expect(sortedChildren[1].id).toBe('ent_2')
      expect(sortedChildren[2].id).toBe('ent_1')
    })

    it('reorders layer sequence and recalculates orderIndex across collection', () => {
      // Arrange
      const layerA = createMockLayer({ id: 'layer_a', name: 'Layer A', orderIndex: 0, section: 'world' })
      const layerB = createMockLayer({ id: 'layer_b', name: 'Layer B', orderIndex: 1, section: 'world' })
      const layerC = createMockLayer({ id: 'layer_c', name: 'Layer C', orderIndex: 2, section: 'world' })

      setupMockSceneEnvironment({ layersWorld: [layerA, layerB, layerC] })

      // Act: Pindahkan layerC ke atas layerA (position: 'top')
      sceneStore.reorderLayer('layer_c', 'layer_a', 'top')

      // Assert
      const worldLayers = sceneStore.activeScene.layersWorld
      expect(worldLayers[0].id).toBe('layer_c')
      expect(worldLayers[0].orderIndex).toBe(0)
      expect(worldLayers[1].id).toBe('layer_a')
      expect(worldLayers[1].orderIndex).toBe(1)
      expect(worldLayers[2].id).toBe('layer_b')
      expect(worldLayers[2].orderIndex).toBe(2)
      expect(engineBridge.reorderLayer).toHaveBeenCalledWith({ id: 'layer_c', targetId: 'layer_a', position: 'top' })
    })

    it('updates orderIndex automatically when an entity is moved relative to another entity', () => {
      // Arrange
      const layer = createMockLayer({ id: 'layer_main', section: 'world' })
      const ent1 = createMockEntity({ id: 'ent_1', layerId: layer.id, zIndex: 0, orderIndex: 0 })
      const ent2 = createMockEntity({ id: 'ent_2', layerId: layer.id, zIndex: 0, orderIndex: 1 })

      setupMockSceneEnvironment({ layersWorld: [layer], entities: [ent1, ent2] })
      const { moveEntity } = useHierarchyLogic()

      // Act: Pindahkan ent2 ke sebelum ent1 (position: 'top' / 'before')
      moveEntity('ent_2', { id: 'ent_1', type: 'entity', layerId: layer.id, zIndex: 0, parentId: null }, 'top')

      // Assert
      const entities = sceneStore.activeScene.entities
      const updatedEnt2 = entities.find(e => e.id === 'ent_2')
      const updatedEnt1 = entities.find(e => e.id === 'ent_1')

      expect(updatedEnt2.orderIndex).toBe(0)
      expect(updatedEnt1.orderIndex).toBe(1)
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({ id: 'ent_2', prop: 'orderIndex', value: 0 })
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({ id: 'ent_1', prop: 'orderIndex', value: 1 })
    })
  })
})