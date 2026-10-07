import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import { useSceneStore } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { engineBridge } from '@engines/engines.js'

// Mock composables dialog & alerts
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) }),
  usePrompt: () => ({ prompt: vi.fn().mockResolvedValue('Mocked Value') }),
  useAlert: () => ({ alert: vi.fn().mockResolvedValue(true) })
}))

import {
  useInspectorSelection,
  useInspectorBinding,
  useInspectorPrefab,
  useInspectorTransform
} from '@inspectors/inspectors.js'

import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity,
  createMockComponent
} from '@tests/tests.js'

describe('Inspector Property Management Integration Suite', () => {
  let sceneStore
  let projectStore
  let prefabStore
  let workspaceStore

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    projectStore = useProjectStore()
    prefabStore = usePrefabStore()
    workspaceStore = useWorkspaceStore()

    // Setup state awal project & workspace
    projectStore.project = {
      id: 'proj_test_inspector',
      name: 'Inspector Test Project',
      tags: ['Untagged', 'Player', 'Enemy', 'UI'],
      settings: {
        tickRate: 60,
        ui: { showUIBorder: false },
        grid: { width: 32, height: 32, color: '#ffffff', opacity: 0.5, visible: true, snap: true },
        camera: { zoom: 1 }
      }
    }

    workspaceStore.$patch({
      tabs: [{ id: 'tab_scene_main', type: 'scene' }],
      activeTabId: 'tab_scene_main',
      activeTab: { id: 'tab_scene_main', type: 'scene' }
    })

    // Mock spy engineBridge
    vi.restoreAllMocks()
    vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'updateEntityProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'patchComponent').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'addComponent').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'removeComponent').mockImplementation(() => {})
  })

  describe('Selection & State Derivation Integration', () => {
    it('correctly resolves selectedEntity and selection states when single World Entity is selected', () => {
      const entity = createMockEntity({ name: 'Hero', type: 'entity' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab, hasSelection, isMultiSelection } = useInspectorSelection()

      expect(isEditingMasterPrefab.value).toBe(false)
      expect(hasSelection.value).toBe(true)
      expect(isMultiSelection.value).toBe(false)
      expect(selectedEntity.value.id).toBe(entity.id)
      expect(selectedEntity.value.name).toBe('Hero')
    })

    it('correctly resolves selectedEntity when UI Entity is selected', () => {
      const uiEntity = createMockEntity({
        name: 'UI Button',
        type: 'ui',
        components: {
          UITransform: createMockComponent('UITransform', { x: 10, y: 20, width: 200, height: 50, anchorX: 0.5, anchorY: 0.5 })
        }
      })
      setupMockSceneEnvironment({ entities: [uiEntity] })
      sceneStore.selectedEntityIds = [uiEntity.id]

      const { selectedEntity, hasSelection } = useInspectorSelection()

      expect(hasSelection.value).toBe(true)
      expect(selectedEntity.value.id).toBe(uiEntity.id)
      expect(selectedEntity.value.type).toBe('ui')
      expect(selectedEntity.value.components.UITransform).toBeDefined()
    })

    it('switches selection context to master prefab data when active tab is a prefab', () => {
      const mockPrefab = {
        id: 'prefab_hero_1',
        name: 'Hero Prefab Master',
        data: createMockEntity({ id: 'ent_master', name: 'Master Hero' })
      }
      prefabStore.prefabs = [mockPrefab]

      workspaceStore.$patch({
        tabs: [{ id: 'prefab_hero_1', type: 'prefab' }],
        activeTabId: 'prefab_hero_1',
        activeTab: { id: 'prefab_hero_1', type: 'prefab' }
      })

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()

      expect(isEditingMasterPrefab.value).toBe(true)
      expect(selectedEntity.value).not.toBeNull()
      expect(selectedEntity.value.id).toBe('ent_master')
      expect(selectedEntity.value.name).toBe('Master Hero')
    })
  })

  describe('UI Entity vs World Entity Property Binding Integration', () => {
    it('binds entity property and synchronizes changes with sceneStore', () => {
      const entity = createMockEntity({ name: 'Old Entity Name' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const prefabId = ref(null)
      const markAsOverridden = vi.fn()

      const { bindEntityProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)
      const entityName = bindEntityProp('name')

      entityName.value = 'New Entity Name'

      expect(sceneStore.activeScene.entities[0].name).toBe('New Entity Name')
      expect(selectedEntity.value.name).toBe('New Entity Name')
    })

    it('binds UITransform properties and syncs correctly without looking for Transform', () => {
      const uiEntity = createMockEntity({
        type: 'ui',
        components: {
          UITransform: createMockComponent('UITransform', { x: -100, y: 50, width: 300, height: 200, anchorX: 0.5, anchorY: 0.5 })
        }
      })
      setupMockSceneEnvironment({ entities: [uiEntity] })
      sceneStore.selectedEntityIds = [uiEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const prefabId = ref(null)
      const markAsOverridden = vi.fn()

      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const anchorXProp = bindComponentProp('UITransform', 'anchorX')
      const widthProp = bindComponentProp('UITransform', 'width', 2)

      expect(anchorXProp.value).toBe(0.5)
      expect(widthProp.value).toBe(300)

      anchorXProp.value = 0
      widthProp.value = 400.1234

      expect(sceneStore.activeScene.entities[0].components.UITransform.anchorX).toBe(0)
      expect(sceneStore.activeScene.entities[0].components.UITransform.width).toBe(400.12)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: uiEntity.id,
        componentName: 'UITransform',
        path: 'width',
        value: 400.12
      })
    })

    it('binds World Transform properties, applies precision, updates sceneStore, and triggers engineBridge', () => {
      const worldEntity = createMockEntity({
        type: 'entity',
        components: {
          Transform: createMockComponent('Transform', { width: 100, height: 100 })
        }
      })
      setupMockSceneEnvironment({ entities: [worldEntity] })
      sceneStore.selectedEntityIds = [worldEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, ref(null), vi.fn())

      const widthProp = bindComponentProp('Transform', 'width', 2)
      widthProp.value = 150.4567

      expect(sceneStore.activeScene.entities[0].components.Transform.width).toBe(150.46)
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: worldEntity.id,
        componentName: 'Transform',
        path: 'width',
        value: 150.46
      })
    })

    it('updates array-based nested properties such as Collider data in UI/World entities', () => {
      const entity = createMockEntity({
        components: {
          Transform: createMockComponent('Transform'),
          Collider: {
            data: [
              { type: 'solid', enabled: true, autoFit: false, offsetX: 0, offsetY: 0, width: 32, height: 32 }
            ]
          }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, ref(null), vi.fn())

      const colliderType = bindComponentProp('Collider', 'data.0.type')
      expect(colliderType.value).toBe('solid')

      colliderType.value = 'trigger'

      expect(sceneStore.activeScene.entities[0].components.Collider.data[0].type).toBe('trigger')
    })
  })

  describe('Script Controller Binding Tests', () => {
    it('attaches a new script instance and correctly updates reactive state in sceneStore', () => {
      const entity = createMockEntity({
        components: {
          ScriptController: { data: [], overridden: false }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const markAsOverridden = vi.fn()
      const { addScript, scriptsData } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, ref(null), markAsOverridden)

      addScript('asset_script_player_movement')

      expect(scriptsData.value.length).toBe(1)
      expect(scriptsData.value[0].assetId).toBe('asset_script_player_movement')
      expect(sceneStore.activeScene.entities[0].components.ScriptController.data.length).toBe(1)
      expect(sceneStore.activeScene.entities[0].components.ScriptController.data[0].assetId).toBe('asset_script_player_movement')
    })

    it('removes a script instance and maintains accurate reactive array references', () => {
      const entity = createMockEntity({
        components: {
          ScriptController: {
            data: [
              { id: 'inst_1', assetId: 'sc_1', active: true, variables: {} },
              { id: 'inst_2', assetId: 'sc_2', active: true, variables: {} }
            ]
          }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { removeScript, scriptsData } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, ref(null), vi.fn())

      removeScript(0)

      expect(scriptsData.value.length).toBe(1)
      expect(scriptsData.value[0].assetId).toBe('sc_2')
      expect(sceneStore.activeScene.entities[0].components.ScriptController.data[0].assetId).toBe('sc_2')
    })

    it('updates nested script instance property via updateScriptInstance', () => {
      const entity = createMockEntity({
        components: {
          ScriptController: {
            data: [{ id: 'inst_1', assetId: 'sc_1', active: true, variables: {} }]
          }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { updateScriptInstance, scriptsData } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, ref(null), vi.fn())

      updateScriptInstance(0, 'active', false)

      expect(scriptsData.value[0].active).toBe(false)
      expect(sceneStore.activeScene.entities[0].components.ScriptController.data[0].active).toBe(false)
    })
  })

  describe('Prefab Syncing, Adding & Removing Components Integration', () => {
    it('adds a new component to entity and records addition in sceneStore', () => {
      const entity = createMockEntity({ entityType: 'sprite' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { addComponentToSelection } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      addComponentToSelection('Physics')

      expect(sceneStore.activeScene.entities[0].components.Physics).toBeDefined()
      expect(sceneStore.activeScene.entities[0].components.Physics.type).toBe('dynamic')
    })

    it('removes a component from entity and communicates deletion with engineBridge', async () => {
      const entity = createMockEntity({
        components: {
          Physics: createMockComponent('Physics')
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { removeComponent } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      await removeComponent('Physics')

      expect(sceneStore.activeScene.entities[0].components.Physics).toBeUndefined()
      expect(engineBridge.removeComponent).toHaveBeenCalledWith({
        entityId: entity.id,
        componentName: 'Physics'
      })
    })

    it('syncs all components from master prefab to instance, resetting overrides', () => {
      const masterEntity = createMockEntity({
        tag: 'Enemy',
        components: {
          Transform: createMockComponent('Transform', { x: 0, y: 0, scaleX: 2 }),
          SpriteRenderer: createMockComponent('SpriteRenderer', { color: '#FF0000' })
        }
      })
      const mockPrefab = { id: 'prefab_enemy', name: 'Enemy Prefab', data: masterEntity }
      prefabStore.prefabs = [mockPrefab]

      const instanceEntity = createMockEntity({
        prefabId: 'prefab_enemy',
        overridden: true,
        components: {
          Transform: createMockComponent('Transform', { x: 50, y: 100, scaleX: 1, overridden: true }),
          SpriteRenderer: createMockComponent('SpriteRenderer', { color: '#00FF00', overridden: true })
        }
      })
      setupMockSceneEnvironment({ entities: [instanceEntity] })
      sceneStore.selectedEntityIds = [instanceEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { syncAllComponents } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      syncAllComponents()

      const updatedComp = sceneStore.activeScene.entities[0].components
      expect(updatedComp.Transform.scaleX).toBe(2)
      expect(updatedComp.Transform.x).toBe(50)
      expect(updatedComp.Transform.y).toBe(100)
      expect(updatedComp.SpriteRenderer.color).toBe('#FF0000')
      expect(sceneStore.activeScene.entities[0].overridden).toBe(false)
      expect(engineBridge.patchComponent).toHaveBeenCalled()
    })

    it('unpacks prefab by clearing prefabId and resetting overridden flags', () => {
      const instanceEntity = createMockEntity({
        prefabId: 'prefab_boss',
        overridden: true,
        components: {
          Transform: createMockComponent('Transform', { overridden: true })
        }
      })
      setupMockSceneEnvironment({ entities: [instanceEntity] })
      sceneStore.selectedEntityIds = [instanceEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { unpackPrefab } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      unpackPrefab()

      const entity = sceneStore.activeScene.entities[0]
      expect(entity.prefabId).toBeNull()
      expect(entity.overridden).toBe(false)
      expect(entity.components.Transform.overridden).toBe(false)
      expect(engineBridge.updateEntityProp).toHaveBeenCalledWith({
        id: entity.id,
        prop: 'prefabId',
        value: null
      })
    })

    it('restricts adding components when entity is locked by prefab', () => {
      const childEntity = createMockEntity({
        parentId: 'parent_prefab_1',
        entityType: 'sprite'
      })
      const parentPrefabEntity = createMockEntity({
        id: 'parent_prefab_1',
        prefabId: 'prefab_master_1'
      })
      setupMockSceneEnvironment({ entities: [parentPrefabEntity, childEntity] })
      sceneStore.selectedEntityIds = [childEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { addComponentToSelection, isLockedByPrefab } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      addComponentToSelection('Collider')

      expect(isLockedByPrefab.value).toBe(true)
      expect(sceneStore.activeScene.entities.find(e => e.id === childEntity.id).components.Collider).toBeUndefined()
    })
  })

  describe('Transform Calculations for UI & World Entities', () => {
    it('resets World Transform values and updates sceneStore', () => {
      const entity = createMockEntity({
        components: {
          Transform: createMockComponent('Transform', { x: 200, y: 300, rotation: 45, scaleX: 2, scaleY: 2 })
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { resetTransform } = useInspectorTransform(selectedEntity, isEditingMasterPrefab)

      resetTransform()

      const transform = sceneStore.activeScene.entities[0].components.Transform
      expect(transform.x).toBe(0)
      expect(transform.y).toBe(0)
      expect(transform.rotation).toBe(0)
      expect(transform.scaleX).toBe(1)
      expect(transform.scaleY).toBe(1)
    })

    it('resets UITransform correctly and applies default anchorX/anchorY', () => {
      const uiEntity = createMockEntity({
        type: 'ui',
        components: {
          UITransform: createMockComponent('UITransform', { x: 200, y: 300, rotation: 90, anchorX: 1, anchorY: 1 })
        }
      })
      setupMockSceneEnvironment({ entities: [uiEntity] })
      sceneStore.selectedEntityIds = [uiEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { resetTransform } = useInspectorTransform(selectedEntity, isEditingMasterPrefab)

      resetTransform()

      const uiComp = sceneStore.activeScene.entities[0].components.UITransform
      expect(uiComp.x).toBe(0)
      expect(uiComp.y).toBe(0)
      expect(uiComp.rotation).toBe(0)
      expect(uiComp.anchorX).toBe(0.5)
      expect(uiComp.anchorY).toBe(0.5)
    })

    it('detects transform name automatically and updates pivot on UI entity', () => {
      const uiEntity = createMockEntity({
        type: 'ui',
        components: {
          UITransform: createMockComponent('UITransform', { x: 0, y: 0, width: 100, height: 100, pivotX: 0.5, pivotY: 0.5 })
        }
      })
      setupMockSceneEnvironment({ entities: [uiEntity] })
      sceneStore.selectedEntityIds = [uiEntity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { updatePivot, getTransformCompName } = useInspectorTransform(selectedEntity, isEditingMasterPrefab)

      expect(getTransformCompName(selectedEntity.value)).toBe('UITransform')

      updatePivot({ x: 1, y: 1 })

      const uiComp = sceneStore.activeScene.entities[0].components.UITransform
      expect(uiComp.pivotX).toBe(1)
      expect(uiComp.pivotY).toBe(1)
    })

    it('resets tilemap dimensions to tile count multiplied by tile size', () => {
      const entity = createMockEntity({
        components: {
          Transform: createMockComponent('Transform', { width: 100, height: 100 }),
          Tilemap: createMockComponent('Tilemap', { width: 20, height: 10, tileWidth: 16, tileHeight: 16 })
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = [entity.id]

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { resetTilemapTransform } = useInspectorTransform(selectedEntity, isEditingMasterPrefab)

      resetTilemapTransform()

      const transform = sceneStore.activeScene.entities[0].components.Transform
      expect(transform.width).toBe(320)  // 20 * 16
      expect(transform.height).toBe(160) // 10 * 16
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: entity.id,
        componentName: 'Transform',
        path: 'width',
        value: 320
      })
    })
  })

  describe('Defensive Robustness & Edge Cases', () => {
    it('safely handles composable initialization without passing any arguments', () => {
      expect(() => {
        const { isLockedByPrefab, prefabId } = useInspectorPrefab()
        expect(isLockedByPrefab.value).toBe(false)
        expect(prefabId.value).toBeNull()
      }).not.toThrow()

      expect(() => {
        const { bindEntityProp, bindComponentProp } = useInspectorBinding()
        const prop = bindEntityProp('name')
        expect(prop.value).toBe('')
        const compProp = bindComponentProp('Transform', 'width')
        expect(compProp.value).toBeUndefined()
      }).not.toThrow()

      expect(() => {
        const { isSizeLockedByText, getTransformCompName } = useInspectorTransform()
        expect(isSizeLockedByText.value).toBe(false)
        expect(getTransformCompName(null)).toBe('Transform')
      }).not.toThrow()
    })
  })
})