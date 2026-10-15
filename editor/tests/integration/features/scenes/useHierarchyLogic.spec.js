import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneStore, useHierarchyLogic } from '@scenes/scenes.js'
import { 
  setupMockSceneEnvironment, 
  createMockEntity, 
  createMockLayer 
} from '@tests/tests.js'

// 1. Mock external bridges
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    moveEntity: vi.fn(),
    reorderLayer: vi.fn(),
    updateEntityProp: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}))

// 2. Mock pop alert composable
const mockShowPop = vi.fn()
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: mockShowPop
  }),
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true)
  })
}))

// 3. Mock useSceneHistory to prevent errors when recordEntityMove is called
vi.mock('@historys/historys.js', () => ({
  useSceneHistory: () => ({
    recordEntityMove: vi.fn(),
    recordEntityCreate: vi.fn(),
    recordEntityDelete: vi.fn(),
    recordPropChange: vi.fn(),
    recordAddLayer: vi.fn(),
    recordDeleteLayer: vi.fn(),
    recordReorderLayer: vi.fn(),
    recordLayerPropChange: vi.fn()
  })
}))

describe('Hierarchy Logic Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Tree Data Computation', () => {
    it('builds a reactive tree hierarchy separated into world and ui layers', () => {
      const worldLayer = createMockLayer({ id: 'l_world', name: 'World Layer', section: 'world', zIndex: 0 })
      const uiLayer = createMockLayer({ id: 'l_ui', name: 'UI Layer', section: 'ui', zIndex: 1 })

      const parentEntity = createMockEntity({
        id: 'e_parent',
        name: 'Parent Entity',
        layerId: 'l_world',
        parentId: null,
        zIndex: 0,
        orderIndex: 0
      })
      const childEntity = createMockEntity({
        id: 'e_child',
        name: 'Child Entity',
        layerId: 'l_world',
        parentId: 'e_parent',
        zIndex: 0,
        orderIndex: 0
      })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer],
        entities: [parentEntity, childEntity]
      })

      const { treeData } = useHierarchyLogic()

      expect(treeData.value.worldTree.length).toBe(1)
      expect(treeData.value.uiTree.length).toBe(1)

      const worldNodes = treeData.value.worldTree[0].children
      expect(worldNodes.length).toBe(1)
      expect(worldNodes[0].id).toBe('e_parent')
      expect(worldNodes[0].children.length).toBe(1)
      expect(worldNodes[0].children[0].id).toBe('e_child')
    })

    it('sorts nodes recursively based on zIndex and orderIndex', () => {
      const layer = createMockLayer({ id: 'l_world', section: 'world' })
      const entityA = createMockEntity({ id: 'e_a', layerId: 'l_world', zIndex: 1, orderIndex: 0 })
      const entityB = createMockEntity({ id: 'e_b', layerId: 'l_world', zIndex: 0, orderIndex: 5 })
      const entityC = createMockEntity({ id: 'e_c', layerId: 'l_world', zIndex: 0, orderIndex: 2 })

      setupMockSceneEnvironment({
        layersWorld: [layer],
        entities: [entityA, entityB, entityC]
      })

      const { treeData } = useHierarchyLogic()

      const layerChildren = treeData.value.worldTree[0].children
      expect(layerChildren.map(node => node.id)).toEqual(['e_c', 'e_b', 'e_a'])
    })

    it('correctly identifies UI layers based on scriptId fallback rules', () => {
      const hudLayer = createMockLayer({ id: 'l_hud_1', scriptId: 'l_hud', section: undefined })

      setupMockSceneEnvironment({
        layersWorld: [],
        layersUI: [hudLayer]
      })

      const { treeData } = useHierarchyLogic()

      expect(treeData.value.uiTree.length).toBe(1)
      expect(treeData.value.uiTree[0].id).toBe('l_hud_1')
    })
  })

  describe('Move Operations and Rule Validations', () => {
    it('executes entity move to root layer when no target node is provided', () => {
      const layer = createMockLayer({ id: 'l_world', section: 'world' })
      const entity = createMockEntity({ id: 'e_1', layerId: 'l_world', parentId: 'e_parent' })

      setupMockSceneEnvironment({
        layersWorld: [layer],
        entities: [entity]
      })

      const sceneStore = useSceneStore()
      const { moveEntity } = useHierarchyLogic()

      moveEntity('e_1', null, 'append')

      const updatedEntity = sceneStore.activeEntities.find(e => e.id === 'e_1')
      expect(updatedEntity.parentId).toBeNull()
      expect(updatedEntity.layerId).toBe('l_world')
    })

    it('reorders layers when dragging a layer node over another layer in the same section', () => {
      const layer1 = createMockLayer({ id: 'l_1', name: 'Layer 1', section: 'world', orderIndex: 0 })
      const layer2 = createMockLayer({ id: 'l_2', name: 'Layer 2', section: 'world', orderIndex: 1 })

      setupMockSceneEnvironment({
        layersWorld: [layer1, layer2]
      })

      const sceneStore = useSceneStore()
      const { moveEntity, treeData } = useHierarchyLogic()

      const targetLayerNode = treeData.value.worldTree.find(n => n.id === 'l_2')

      moveEntity('l_1', targetLayerNode, 'top')

      const worldLayers = sceneStore.activeScene.layersWorld
      expect(worldLayers.find(l => l.id === 'l_1').orderIndex).toBe(0)
      expect(worldLayers.find(l => l.id === 'l_2').orderIndex).toBe(1)
    })

    it('allows valid move of UI entity within UI layers and hierarchy', () => {
      const uiLayer = createMockLayer({ id: 'l_ui', section: 'ui' })
      const parentUiEntity = createMockEntity({ id: 'e_ui_parent', type: 'ui', layerId: 'l_ui' })
      const childUiEntity = createMockEntity({ id: 'e_ui_child', type: 'ui', layerId: 'l_ui' })

      setupMockSceneEnvironment({
        layersUI: [uiLayer],
        entities: [parentUiEntity, childUiEntity]
      })

      const sceneStore = useSceneStore()
      const { moveEntity, treeData } = useHierarchyLogic()

      const uiLayerNode = treeData.value.uiTree.find(n => n.id === 'l_ui')
      const targetParentNode = uiLayerNode.children.find(n => n.id === 'e_ui_parent')

      moveEntity('e_ui_child', targetParentNode, 'inside')

      const updatedChild = sceneStore.activeEntities.find(e => e.id === 'e_ui_child')
      expect(mockShowPop).not.toHaveBeenCalled()
      expect(updatedChild.parentId).toBe('e_ui_parent')
      expect(updatedChild.layerId).toBe('l_ui')
    })

    it('[Bad Path] triggers pop alert error when attempting to move layer between World and UI sections', () => {
      const worldLayer = createMockLayer({ id: 'l_world', name: 'World', section: 'world' })
      const uiLayer = createMockLayer({ id: 'l_ui', name: 'UI Layer', section: 'ui' })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer]
      })

      const { moveEntity, treeData } = useHierarchyLogic()
      const uiLayerNode = treeData.value.uiTree.find(n => n.id === 'l_ui')

      moveEntity('l_world', uiLayerNode, 'inside')

      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid Move',
        type: 'error'
      }))
    })

    it('[Bad Path] triggers pop alert error when moving entity inside its own descendant', () => {
      const layer = createMockLayer({ id: 'l_world', section: 'world' })
      const parentEntity = createMockEntity({ id: 'e_parent', layerId: 'l_world', parentId: null })
      const childEntity = createMockEntity({ id: 'e_child', layerId: 'l_world', parentId: 'e_parent' })

      setupMockSceneEnvironment({
        layersWorld: [layer],
        entities: [parentEntity, childEntity]
      })

      const { moveEntity } = useHierarchyLogic()

      moveEntity('e_parent', { id: 'e_child', type: 'entity', layerId: 'l_world' }, 'inside')

      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid Move',
        message: 'Cannot move an entity inside its own child.',
        type: 'error'
      }))
    })

    it('[Bad Path] prevents cross-domain movement between UI and World entities', () => {
      const worldLayer = createMockLayer({ id: 'l_world', section: 'world' })
      const uiLayer = createMockLayer({ id: 'l_ui', section: 'ui' })

      const uiEntity = createMockEntity({
        id: 'e_ui',
        type: 'ui',
        layerId: 'l_ui',
        components: { UITransform: {} }
      })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer],
        entities: [uiEntity]
      })

      const { moveEntity, treeData } = useHierarchyLogic()
      const worldLayerNode = treeData.value.worldTree.find(n => n.id === 'l_world')

      moveEntity('e_ui', worldLayerNode, 'inside')

      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid Move',
        message: 'UI Entity cannot go to World Layer.',
        type: 'error'
      }))
    })

    it('[Bad Path] prevents cross-domain movement of World entity into UI Layer', () => {
      const worldLayer = createMockLayer({ id: 'l_world', section: 'world' })
      const uiLayer = createMockLayer({ id: 'l_ui', section: 'ui' })
      const worldEntity = createMockEntity({ id: 'e_world', type: 'entity', layerId: 'l_world' })

      setupMockSceneEnvironment({
        layersWorld: [worldLayer],
        layersUI: [uiLayer],
        entities: [worldEntity]
      })

      const { moveEntity, treeData } = useHierarchyLogic()
      const uiLayerNode = treeData.value.uiTree.find(n => n.id === 'l_ui')

      moveEntity('e_world', uiLayerNode, 'inside')

      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid Move',
        message: 'World Entity cannot go to UI Layer.',
        type: 'error'
      }))
    })

    it('[Bad Path] displays warning pop alert when reordering siblings with different Z-Index values', () => {
      const layer = createMockLayer({ id: 'l_world', section: 'world' })
      const entityA = createMockEntity({ id: 'e_a', layerId: 'l_world', parentId: null, zIndex: 0 })
      const entityB = createMockEntity({ id: 'e_b', layerId: 'l_world', parentId: null, zIndex: 2 })

      setupMockSceneEnvironment({
        layersWorld: [layer],
        entities: [entityA, entityB]
      })

      const { moveEntity } = useHierarchyLogic()

      moveEntity('e_a', { id: 'e_b', type: 'entity', layerId: 'l_world', parentId: null, zIndex: 2 }, 'top')

      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Action Restricted',
        type: 'warning'
      }))
    })

    it('updates entity hierarchy and parent-child relations upon valid drop inside an entity', () => {
      const layer = createMockLayer({ id: 'l_world', name: 'World Default', section: 'world', _section: 'world' })
      const sourceEntity = createMockEntity({ id: 'e_src', layerId: 'l_world', parentId: null, type: 'entity' })
      const targetEntity = createMockEntity({ id: 'e_target', layerId: 'l_world', parentId: null, type: 'entity' })

      setupMockSceneEnvironment({
        layersWorld: [layer],
        entities: [sourceEntity, targetEntity]
      })

      const sceneStore = useSceneStore()
      const { moveEntity, treeData } = useHierarchyLogic()

      const worldLayerNode = treeData.value.worldTree.find(l => l.id === 'l_world')
      const targetNode = worldLayerNode.children.find(n => n.id === 'e_target')

      moveEntity('e_src', targetNode, 'inside')

      const updatedSource = sceneStore.activeEntities.find(e => e.id === 'e_src')
      expect(mockShowPop).not.toHaveBeenCalled()
      expect(updatedSource.parentId).toBe('e_target')
      expect(updatedSource.layerId).toBe('l_world')
    })
  })
})