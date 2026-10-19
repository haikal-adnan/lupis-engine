import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntityActions, entitySchema, layerSchema } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { usePopAlert, useConfirm } from '@composables/composables.js'
import { useSceneHistory } from '@historys/historys.js'

// Mock external dependencies within system boundaries
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    getCameraPosition: vi.fn(() => ({ x: 100, y: 150 })),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    updateComponentProp: vi.fn(),
    removeComponent: vi.fn()
  }
}))

vi.mock('@composables/composables.js', () => {
  const showPopMock = vi.fn()
  const confirmMock = vi.fn().mockResolvedValue(true)
  return {
    usePopAlert: () => ({ showPop: showPopMock }),
    useConfirm: () => ({ confirm: confirmMock })
  }
})

vi.mock('@historys/historys.js', () => {
  const recordEntityCreateMock = vi.fn()
  const recordEntityDeleteMock = vi.fn()
  const recordPropChangeMock = vi.fn()
  const recordEntityMoveMock = vi.fn()
  const recordAddComponentMock = vi.fn()
  const recordRemoveComponentMock = vi.fn()

  return {
    useSceneHistory: () => ({
      recordEntityCreate: recordEntityCreateMock,
      recordEntityDelete: recordEntityDeleteMock,
      recordPropChange: recordPropChangeMock,
      recordEntityMove: recordEntityMoveMock,
      recordAddComponent: recordAddComponentMock,
      recordRemoveComponent: recordRemoveComponentMock
    })
  }
})

describe('Entity Actions Integration', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Prepare mock state for sceneStore adopting useEntityActions
    sceneStoreState = {
      selectedEntityIds: [],
      activeScene: {
        id: 'scene_1',
        layersWorld: [
          layerSchema({ id: 'layer_world_1', scriptId: 'World_Root' })
        ],
        layersUI: [
          layerSchema({ id: 'layer_ui_1', scriptId: 'UI_Root' })
        ],
        entities: [
          entitySchema({
            id: 'ent_1',
            scriptId: 'sprite_1',
            layerId: 'layer_world_1',
            type: 'entity',
            x: 0,
            y: 0,
            components: {
              SpriteRenderer: { color: '#FFFFFF' }
            }
          })
        ]
      },
      ...useEntityActions
    }
  })

  describe('Entity Creation (createEntity)', () => {
    it('creates a new sprite entity based on camera position, updates store, and records history', () => {
      // Act
      const newEntity = sceneStoreState.createEntity('sprite')

      // Assert
      expect(sceneStoreState.activeScene.entities.length).toBe(2)
      expect(newEntity.scriptId).toBe('sprite_2')
      expect(newEntity.type).toBe('entity')
      expect(newEntity.layerId).toBe('layer_world_1')
      expect(newEntity.components.Transform.x).toBe(100)
      expect(newEntity.components.Transform.y).toBe(150)
      expect(sceneStoreState.selectedEntityIds).toEqual([newEntity.id])

      // Verify external dependencies
      expect(engineBridge.createEntity).toHaveBeenCalledWith(newEntity)
      expect(engineBridge.selectEntity).toHaveBeenCalledWith([newEntity.id])

      const { recordEntityCreate } = useSceneHistory()
      expect(recordEntityCreate).toHaveBeenCalledWith(newEntity)
    })

    it('creates a UI entity with custom position overrides targeting UI layer', () => {
      // Act
      const uiEntity = sceneStoreState.createEntity('ui_text', 'layer_ui_1', { x: 50, y: 50 })

      // Assert
      expect(uiEntity.type).toBe('ui')
      expect(uiEntity.layerId).toBe('layer_ui_1')
      expect(uiEntity.components.UITransform.x).toBe(50)
      expect(uiEntity.components.UITransform.y).toBe(50)
    })

    it('[Bad Path] prevents child entity creation if parent is inside a Prefab instance', () => {
      // Arrange
      const prefabParent = entitySchema({
        id: 'prefab_root',
        prefabId: 'prefab_123',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(prefabParent)

      // Act
      const result = sceneStoreState.createEntity('sprite', prefabParent)

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Cannot add new entities into a Prefab instance hierarchy'),
        type: 'warning'
      })
    })

    it('[Bad Path] returns false if activeScene is null', () => {
      // Arrange
      sceneStoreState.activeScene = null

      // Act
      const result = sceneStoreState.createEntity('sprite')

      // Assert
      expect(result).toBe(false)
      expect(engineBridge.createEntity).not.toHaveBeenCalled()
    })
  })

  describe('Entity Duplication & Copy-Paste (duplicateEntity & pasteEntity)', () => {
    it('duplicates entity and descendant hierarchy with new IDs', () => {
      // Arrange
      const childEntity = entitySchema({
        id: 'ent_child',
        parentId: 'ent_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(childEntity)

      // Act
      const duplicatedIds = sceneStoreState.duplicateEntity('ent_1')

      // Assert
      expect(duplicatedIds.length).toBe(2) // Parent + Child
      expect(sceneStoreState.activeScene.entities.length).toBe(4) // 2 initial + 2 clones
      expect(engineBridge.createEntity).toHaveBeenCalled()
      expect(engineBridge.selectEntity).toHaveBeenCalledWith(duplicatedIds)
      expect(sceneStoreState.selectedEntityIds).toEqual(duplicatedIds)

      const { recordEntityCreate } = useSceneHistory()
      expect(recordEntityCreate).toHaveBeenCalledTimes(2)
    })

    it('[Bad Path] prevents duplication if entity is part of a Prefab instance', () => {
      // Arrange
      const prefabEntity = entitySchema({
        id: 'prefab_child',
        parentId: 'prefab_root',
        layerId: 'layer_world_1'
      })
      const prefabRoot = entitySchema({
        id: 'prefab_root',
        prefabId: 'pf_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(prefabRoot, prefabEntity)

      // Act
      const result = sceneStoreState.duplicateEntity('prefab_child')

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Cannot modify, move, or delete entities inside a Prefab instance'),
        type: 'warning'
      })
    })
  })

  describe('Entity Deletion (deleteEntity)', () => {
    it('deletes entity and all of its children from scene and resets selection', () => {
      // Arrange
      const childEntity = entitySchema({
        id: 'ent_child',
        parentId: 'ent_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(childEntity)
      sceneStoreState.selectedEntityIds = ['ent_1']

      // Act
      const success = sceneStoreState.deleteEntity('ent_1')

      // Assert
      expect(success).toBe(true)
      expect(sceneStoreState.activeScene.entities.length).toBe(0)
      expect(sceneStoreState.selectedEntityIds).toEqual([])

      expect(engineBridge.clearSelection).toHaveBeenCalled()
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_1')
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_child')

      const { recordEntityDelete } = useSceneHistory()
      expect(recordEntityDelete).toHaveBeenCalled()
    })
  })

  describe('Entity Movement (moveEntity)', () => {
    it('moves entity to new parent and synchronizes index order with engine bridge', () => {
      // Arrange
      const parent2 = entitySchema({
        id: 'ent_parent_2',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(parent2)

      const targetContext = {
        newParentId: 'ent_parent_2',
        newLayerId: 'layer_world_1',
        insertionType: 'inside',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('ent_1', targetContext)

      // Assert
      expect(success).toBe(true)
      const movedEntity = sceneStoreState.activeScene.entities.find(e => e.id === 'ent_1')
      expect(movedEntity.parentId).toBe('ent_parent_2')

      expect(engineBridge.moveEntity).toHaveBeenCalledWith({
        draggedId: 'ent_1',
        newParentId: 'ent_parent_2',
        newLayerId: 'layer_world_1',
        insertionType: 'inside',
        referenceId: null
      })

      const { recordEntityMove } = useSceneHistory()
      expect(recordEntityMove).toHaveBeenCalled()
    })

    it('recalculates local transform coordinates so entity visually preserves world position when dragged into parent', () => {
      // Arrange: entity at world (300, 400), parent at world (100, 150)
      const entity = sceneStoreState.activeScene.entities.find(e => e.id === 'ent_1')
      entity.components.Transform.x = 300
      entity.components.Transform.y = 400

      const parentEntity = entitySchema({
        id: 'parent_target',
        layerId: 'layer_world_1',
        x: 100,
        y: 150
      })
      sceneStoreState.activeScene.entities.push(parentEntity)

      const targetContext = {
        newParentId: 'parent_target',
        newLayerId: 'layer_world_1',
        insertionType: 'inside',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('ent_1', targetContext)

      // Assert
      expect(success).toBe(true)
      expect(entity.parentId).toBe('parent_target')
      // Local transform recalculated: 300 - 100 = 200, 400 - 150 = 250
      expect(entity.components.Transform.x).toBe(200)
      expect(entity.components.Transform.y).toBe(250)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        path: 'x',
        value: 200
      })
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        path: 'y',
        value: 250
      })
    })

    it('recalculates local transform back to world coordinates when entity is unparented (dragged to root)', () => {
      // Arrange: Parent at (100, 150), child with parentId 'parent_target' and local (50, 60)
      const parentEntity = entitySchema({
        id: 'parent_target',
        layerId: 'layer_world_1',
        x: 100,
        y: 150
      })
      sceneStoreState.activeScene.entities.push(parentEntity)

      const childEntity = entitySchema({
        id: 'ent_child_1',
        parentId: 'parent_target',
        layerId: 'layer_world_1',
        x: 50,
        y: 60
      })
      sceneStoreState.activeScene.entities.push(childEntity)

      const targetContext = {
        newParentId: null,
        newLayerId: 'layer_world_1',
        insertionType: 'append',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('ent_child_1', targetContext)

      // Assert
      expect(success).toBe(true)
      expect(childEntity.parentId).toBeNull()
      // Local position converted back to world position: 100 + 50 = 150, 150 + 60 = 210
      expect(childEntity.components.Transform.x).toBe(150)
      expect(childEntity.components.Transform.y).toBe(210)
    })

    it('recalculates UI entity transform coordinates relative to parent size and anchor (e.g. 900x900 parent)', () => {
      // Arrange: Parent UI panel of size 900x900 centered at (960, 540)
      const parentUI = entitySchema({
        id: 'ui_panel_parent',
        layerId: 'layer_ui_1',
        name: 'PanelParent'
      })
      delete parentUI.components.Transform
      parentUI.components.UITransform = {
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        pivotX: 0.5,
        pivotY: 0.5,
        width: 900,
        height: 900
      }
      sceneStoreState.activeScene.entities.push(parentUI)

      // Child UI button at screen center (960, 540) with anchor (0.5, 0.5)
      const childUI = entitySchema({
        id: 'ui_btn_child',
        layerId: 'layer_ui_1',
        name: 'ButtonChild'
      })
      delete childUI.components.Transform
      childUI.components.UITransform = {
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        pivotX: 0.5,
        pivotY: 0.5,
        width: 200,
        height: 60
      }
      sceneStoreState.activeScene.entities.push(childUI)

      // Move child into parent
      const targetContext = {
        newParentId: 'ui_panel_parent',
        newLayerId: 'layer_ui_1',
        insertionType: 'inside',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('ui_btn_child', targetContext)

      // Assert
      expect(success).toBe(true)
      expect(childUI.parentId).toBe('ui_panel_parent')
      // Both parent center and child were at (960, 540). Child's anchor is 0.5, 0.5.
      // So local x and y should be 0, 0!
      expect(childUI.components.UITransform.x).toBe(0)
      expect(childUI.components.UITransform.y).toBe(0)
    })

    it('recalculates UI entity transform for 200x56 child in 400x56 display with Center-Left anchor to x: 0, y: 0', () => {
      // Arrange: Display parent 400x56 centered at (960, 540)
      const displayParent = entitySchema({
        id: 'display_parent',
        layerId: 'layer_ui_1',
        name: 'DisplayParent'
      })
      delete displayParent.components.Transform
      displayParent.components.UITransform = {
        x: 0,
        y: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        pivotX: 0.5,
        pivotY: 0.5,
        width: 400,
        height: 56
      }
      sceneStoreState.activeScene.entities.push(displayParent)

      // Child 200x56 at world position (860, 540) with Center-Left anchor (anchorX: 0, anchorY: 0.5)
      // When at world (860, 540), child's left edge is at 760 (exact parent display left edge!)
      const childUI = entitySchema({
        id: 'child_content',
        layerId: 'layer_ui_1',
        name: 'ChildContent'
      })
      delete childUI.components.Transform
      childUI.components.UITransform = {
        x: 860, // root world position (anchorX is 0, so canvasW * 0 + 860 = 860)
        y: 0,   // root center position (anchorY is 0.5, so canvasH * 0.5 + 0 = 540)
        anchorX: 0,
        anchorY: 0.5,
        pivotX: 0.5,
        pivotY: 0.5,
        width: 200,
        height: 56
      }
      sceneStoreState.activeScene.entities.push(childUI)

      const targetContext = {
        newParentId: 'display_parent',
        newLayerId: 'layer_ui_1',
        insertionType: 'inside',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('child_content', targetContext)

      // Assert: Because child is flush with parent left edge, local x must be 0 and local y must be 0!
      expect(success).toBe(true)
      expect(childUI.parentId).toBe('display_parent')
      expect(childUI.components.UITransform.x).toBe(0)
      expect(childUI.components.UITransform.y).toBe(0)
    })
  })

  describe('Component Management (updateComponentProp, addComponent & removeComponent)', () => {
    it('updates component property and adjusts height ratio when ratio locked is active', () => {
      // Arrange
      const entity = sceneStoreState.activeScene.entities[0]
      entity.components.Transform = {
        width: 100,
        height: 50,
        isRatioLocked: true
      }

      // Act
      sceneStoreState.updateComponentProp('ent_1', 'Transform', 'width', 200)

      // Assert
      expect(entity.components.Transform.width).toBe(200)
      expect(entity.components.Transform.height).toBe(100) // 2:1 ratio preserved
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        path: 'height',
        value: 100
      })
    })

    it('adds new component if not present and records history', () => {
      // Act
      const result = sceneStoreState.addComponent('ent_1', 'Physics')

      // Assert
      expect(result.componentName).toBe('Physics')
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeDefined()

      const { recordAddComponent } = useSceneHistory()
      expect(recordAddComponent).toHaveBeenCalledWith('ent_1', 'Physics')
    })

    it('removes component after user confirmation is approved', async () => {
      // Arrange
      sceneStoreState.addComponent('ent_1', 'Physics', null, false)

      // Act
      const result = await sceneStoreState.removeComponent('ent_1', 'Physics', true)

      // Assert
      expect(result).toEqual({ entityId: 'ent_1', componentName: 'Physics' })
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeUndefined()

      const { confirm } = useConfirm()
      expect(confirm).toHaveBeenCalled()
      expect(engineBridge.removeComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Physics'
      })

      const { recordRemoveComponent } = useSceneHistory()
      expect(recordRemoveComponent).toHaveBeenCalled()
    })

    it('[Bad Path] cancels component removal if confirmation is rejected', async () => {
      // Arrange
      const { confirm } = useConfirm()
      vi.mocked(confirm).mockResolvedValueOnce(false)
      sceneStoreState.addComponent('ent_1', 'Physics', null, false)

      // Act
      const result = await sceneStoreState.removeComponent('ent_1', 'Physics', true)

      // Assert
      expect(result).toBe(false)
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeDefined()
      expect(engineBridge.removeComponent).not.toHaveBeenCalled()
    })

    it('[Bad Path] prevents adding components to a Prefab instance', () => {
      // Arrange
      sceneStoreState.activeScene.entities[0].prefabId = 'pf_123'

      // Act
      const result = sceneStoreState.addComponent('ent_1', 'Physics')

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Cannot add components to a Prefab instance'),
        type: 'warning'
      })
    })

    it('automatically generates clip and selects it when adding SpriteAnimator to entity with existing image', () => {
      // Arrange
      sceneStoreState.activeScene.entities[0].components.SpriteRenderer = {
        assetId: 'asset_hero_123',
        sourceX: 10,
        sourceY: 20,
        sourceWidth: 64,
        sourceHeight: 64,
        filterMode: 'smooth',
        useSDF: true
      }

      // Act
      const result = sceneStoreState.addComponent('ent_1', 'SpriteAnimator', null, false)

      // Assert
      expect(result.componentName).toBe('SpriteAnimator')
      const anim = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(anim.clips).toHaveLength(1)
      expect(anim.currentClip).toBe(anim.clips[0].id)
      expect(anim.clips[0].assetId).toBe('asset_hero_123')
      expect(anim.clips[0].sources['s_0']).toEqual({ x: 10, y: 20, w: 64, h: 64 })
      expect(anim.clips[0].baseSize).toEqual({ w: 64, h: 64 })
      expect(anim.clips[0].filterMode).toBe('smooth')
      expect(anim.clips[0].useSDF).toBe(true)
    })

    it('[Bad Path] prevents removing SpriteRenderer if entity has SpriteAnimator', async () => {
      // Arrange
      sceneStoreState.activeScene.entities[0].components.SpriteAnimator = { clips: [] }

      // Act
      const result = await sceneStoreState.removeComponent('ent_1', 'SpriteRenderer', false)

      // Assert
      expect(result).toBe(false)
      expect(sceneStoreState.activeScene.entities[0].components.SpriteRenderer).toBeDefined()
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Restricted',
        message: expect.stringContaining('Image Renderer cannot be removed')
      }))
    })
  })
})