import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import { useInspectorPrefab } from '@inspectors/inspectors.js'
import { useSceneStore } from '@scenes/scenes.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useProjectStore, projectSchema } from '@projects/projects.js'
import { engineBridge } from '@engines/engines.js'
import * as composables from '@composables/composables.js'
import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity
} from '@tests/tests.js'

describe('useInspectorPrefab Integration', () => {
  let sceneStore
  let prefabStore
  let workspaceStore
  let projectStore

  let selectedEntityRef
  let isEditingMasterPrefabRef

  beforeEach(() => {
    // 1. Setup Mock OPFS storage
    setupMockOPFS()

    // 2. Set active Pinia and instantiate stores
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    prefabStore = usePrefabStore()
    workspaceStore = useWorkspaceStore()
    projectStore = useProjectStore()

    // 3. Mock confirm dialog
    vi.spyOn(composables, 'useConfirm').mockReturnValue({
      confirm: vi.fn().mockResolvedValue(true)
    })

    // 4. Initialize default project structure
    projectStore.project = projectSchema({ id: 'test_project_prefab', name: 'Prefab Test Project' })

    selectedEntityRef = ref(null)
    isEditingMasterPrefabRef = ref(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupPrefabBinding() {
    return useInspectorPrefab(selectedEntityRef, isEditingMasterPrefabRef)
  }

  describe('Prefab State and Lock Resolution', () => {
    it('detects locked state when entity or its ancestor has a prefabId', () => {
      const parentPrefabEntity = createMockEntity({ id: 'parent_p1', prefabId: 'prefab_master_1' })
      const childEntity = createMockEntity({ id: 'child_c1', parentId: 'parent_p1' })

      setupMockSceneEnvironment({ entities: [parentPrefabEntity, childEntity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[1]

      const { isLockedByPrefab, prefabId, showSyncControls } = setupPrefabBinding()

      expect(isLockedByPrefab.value).toBe(true)
      expect(prefabId.value).toBeNull()
      expect(showSyncControls.value).toBe(false)
    })

    it('resolves direct prefabId and sync controls when selected entity is a prefab instance', () => {
      const prefabInstance = createMockEntity({
        id: 'inst_1',
        prefabId: 'prefab_hero',
        overridden: true
      })

      setupMockSceneEnvironment({ entities: [prefabInstance] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { prefabId, overridden, showSyncControls, isLockedByPrefab } = setupPrefabBinding()

      expect(isLockedByPrefab.value).toBe(true)
      expect(prefabId.value).toBe('prefab_hero')
      expect(overridden.value).toBe(true)
      expect(showSyncControls.value).toBe(true)
    })

    it('[Bad Path] returns false for locks and sync controls in master prefab editing mode', () => {
      setupMockSceneEnvironment()
      isEditingMasterPrefabRef.value = true
      selectedEntityRef.value = createMockEntity({ id: 'p_master_ent', prefabId: 'prefab_hero' })

      const { isLockedByPrefab, prefabId, overridden, showSyncControls } = setupPrefabBinding()

      expect(isLockedByPrefab.value).toBe(false)
      expect(prefabId.value).toBeNull()
      expect(overridden.value).toBe(false)
      expect(showSyncControls.value).toBe(false)
    })
  })

  describe('Syncing Operations (syncObject, syncComponent)', () => {
    it('syncs entity tags and active status from master prefab to instance', () => {
      prefabStore.initPrefabs([
        {
          id: 'prefab_tree',
          name: 'Tree Master',
          data: { tag: 'Environment', active: true }
        }
      ])

      const entity = createMockEntity({
        id: 'ent_tree_inst',
        prefabId: 'prefab_tree',
        tag: 'Untagged',
        active: false,
        overridden: true
      })

      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'updateEntityProp').mockImplementation(() => {})

      const { syncObject } = setupPrefabBinding()

      syncObject()

      const updatedEntity = sceneStore.activeScene.entities[0]
      expect(updatedEntity.tag).toBe('Environment')
      expect(updatedEntity.active).toBe(true)
      expect(updatedEntity.overridden).toBe(false)
      expect(spyBridge).toHaveBeenCalledWith({ id: 'ent_tree_inst', prop: 'tag', value: 'Environment' })
    })

    it('syncs specific component from master prefab while preserving current position on Transform', async () => {
      prefabStore.initPrefabs([
        {
          id: 'prefab_wall',
          name: 'Wall Master',
          data: {
            components: {
              Transform: { x: 0, y: 0, width: 200, height: 50, scaleX: 1, scaleY: 1 }
            }
          }
        }
      ])

      const instance = createMockEntity({
        id: 'ent_wall_inst',
        prefabId: 'prefab_wall',
        components: {
          Transform: { x: 150, y: 300, width: 100, height: 100, scaleX: 2, scaleY: 2, overridden: true }
        }
      })

      setupMockSceneEnvironment({ entities: [instance] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'patchComponent').mockImplementation(() => {})

      const { syncComponent } = setupPrefabBinding()

      await syncComponent('Transform')

      const updatedTransform = sceneStore.activeScene.entities[0].components.Transform
      expect(updatedTransform.x).toBe(150)
      expect(updatedTransform.y).toBe(300)
      expect(updatedTransform.width).toBe(200)
      expect(updatedTransform.height).toBe(50)
      expect(updatedTransform.overridden).toBe(false)
      expect(spyBridge).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: 'ent_wall_inst',
          componentName: 'Transform'
        })
      )
    })

    it('syncs all components from master prefab using syncObject and removes missing instance-only components', () => {
      prefabStore.initPrefabs([
        {
          id: 'prefab_box',
          name: 'Box Master',
          data: {
            components: {
              SpriteRenderer: { color: '#FF0000', opacity: 1 }
            }
          }
        }
      ])

      const instance = createMockEntity({
        id: 'ent_box_inst',
        prefabId: 'prefab_box',
        components: {
          SpriteRenderer: { color: '#00FF00', opacity: 0.5, overridden: true },
          Audio: { currentClip: 'sound_1' } // Instance-only component
        }
      })

      setupMockSceneEnvironment({ entities: [instance] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      vi.spyOn(engineBridge, 'patchComponent').mockImplementation(() => {})

      const { syncObject } = setupPrefabBinding()

      syncObject()

      const updatedEntity = sceneStore.activeScene.entities[0]
      expect(updatedEntity.components.SpriteRenderer.color).toBe('#FF0000')
      expect(updatedEntity.components.SpriteRenderer.overridden).toBe(false)
      expect(updatedEntity.components.Audio).toBeUndefined()
    })
  })

  describe('Unpack Operations (unpackPrefab)', () => {
    it('detaches entity from prefab master and clears override flags', () => {
      const instance = createMockEntity({
        id: 'ent_unpack',
        prefabId: 'prefab_item',
        overridden: true,
        components: {
          SpriteRenderer: { overridden: true }
        }
      })

      setupMockSceneEnvironment({ entities: [instance] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'updateEntityProp').mockImplementation(() => {})

      const { unpackPrefab } = setupPrefabBinding()

      unpackPrefab()

      const unpackedEntity = sceneStore.activeScene.entities[0]
      expect(unpackedEntity.prefabId).toBeNull()
      expect(unpackedEntity.overridden).toBe(false)
      expect(unpackedEntity.components.SpriteRenderer.overridden).toBe(false)
      expect(spyBridge).toHaveBeenCalledWith({ id: 'ent_unpack', prop: 'prefabId', value: null })
    })
  })

  describe('Component Addition & Removal Restrictions', () => {
    it('[Bad Path] blocks component addition when selected entity is locked by prefab hierarchy', () => {
      const parentPrefab = createMockEntity({ id: 'p_lock', prefabId: 'prefab_master_x' })
      const child = createMockEntity({ id: 'c_lock', parentId: 'p_lock' })

      setupMockSceneEnvironment({ entities: [parentPrefab, child] })
      selectedEntityRef.value = sceneStore.activeScene.entities[1]

      const spyAdd = vi.spyOn(sceneStore, 'addComponent')

      const { addComponentToSelection } = setupPrefabBinding()

      addComponentToSelection('Audio')

      expect(spyAdd).not.toHaveBeenCalled()
    })

    it('adds component directly to sceneStore when modifying non-prefab entity', () => {
      const regularEntity = createMockEntity({ id: 'ent_free', components: {} })
      setupMockSceneEnvironment({ entities: [regularEntity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyAdd = vi.spyOn(sceneStore, 'addComponent').mockImplementation(() => {})

      const { addComponentToSelection } = setupPrefabBinding()

      addComponentToSelection('Audio')

      expect(spyAdd).toHaveBeenCalledWith('ent_free', 'Audio')
    })

    it('removes component from master prefab when editing in master prefab mode', async () => {
      setupMockSceneEnvironment()
      isEditingMasterPrefabRef.value = true

      prefabStore.initPrefabs([
        {
          id: 'prefab_tab_1',
          name: 'Master Prefab',
          data: { id: 'p_ent', components: { Audio: {} } }
        }
      ])
      workspaceStore.openTab({ id: 'prefab_tab_1', name: 'Master Prefab', type: 'prefab' })
      selectedEntityRef.value = prefabStore.getPrefabById('prefab_tab_1').data

      engineBridge.removePrefabMasterComponent = () => {}
      prefabStore.removeComponent = () => {}

      const spyBridge = vi.spyOn(engineBridge, 'removePrefabMasterComponent')
      const spyPrefabStore = vi.spyOn(prefabStore, 'removeComponent')

      const { removeComponent } = setupPrefabBinding()

      await removeComponent('Audio')

      expect(spyPrefabStore).toHaveBeenCalledWith('prefab_tab_1', 'Audio')
      expect(spyBridge).toHaveBeenCalledWith({ prefabId: 'prefab_tab_1', componentName: 'Audio' })
    })
  })
})