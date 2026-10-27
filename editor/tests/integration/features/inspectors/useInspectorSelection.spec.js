import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

import { useInspectorSelection } from '@inspectors/inspectors.js'
import { useSceneStore } from '@scenes/scenes.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import {
  setupMockSceneEnvironment,
  createMockEntity,
  createMockLayer
} from '@tests/tests.js'

function setupComposableRunner() {
  let composableResult
  const TestComponent = defineComponent({
    setup() {
      composableResult = useInspectorSelection()
      return () => null
    }
  })
  const wrapper = mount(TestComponent)
  return {
    get result() {
      return composableResult
    },
    wrapper
  }
}

describe('useInspectorSelection Integration', () => {
  let sceneStore
  let prefabStore
  let workspaceStore

  beforeEach(() => {
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    prefabStore = usePrefabStore()
    workspaceStore = useWorkspaceStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Master Prefab Tab Integration', () => {
    it('detects master prefab tab active state and resolves selected entity from prefab store', () => {
      // Arrange
      setupMockSceneEnvironment()
      prefabStore.initPrefabs([
        {
          id: 'prefab_1',
          name: 'Player Prefab',
          folderId: null,
          data: { id: 'p_data_1', name: 'Player Root Entity' }
        }
      ])

      workspaceStore.openTab({
        id: 'prefab_1',
        name: 'Player Prefab',
        type: 'prefab'
      })

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.isEditingMasterPrefab.value).toBe(true)
      expect(result.selectedEntity.value).toEqual({
        id: 'p_data_1',
        name: 'Player Root Entity'
      })
      expect(result.selectedLayerId.value).toBeNull()
      expect(result.isMultiSelection.value).toBe(false)
      expect(result.hasSelection.value).toBe(true)
    })

    it('[Bad Path] returns null selectedEntity when master prefab is active but prefab data does not exist in store', () => {
      // Arrange
      setupMockSceneEnvironment()
      prefabStore.initPrefabs([])

      workspaceStore.openTab({
        id: 'non_existing_prefab',
        name: 'Missing Prefab',
        type: 'prefab'
      })

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.isEditingMasterPrefab.value).toBe(true)
      expect(result.selectedEntity.value).toBeNull()
      expect(result.hasSelection.value).toBe(false)
    })
  })

  describe('Scene Layer Selection Integration', () => {
    it('identifies layer selection when single selected entity ID matches active layer ID', () => {
      // Arrange
      const customLayer = createMockLayer({ id: 'layer_custom_1', name: 'Custom Layer' })
      setupMockSceneEnvironment({
        layersWorld: [customLayer]
      })

      sceneStore.selectedEntityIds = ['layer_custom_1']

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.selectedLayerId.value).toBe('layer_custom_1')
      expect(result.selectedEntity.value).toBeNull()
      expect(result.hasSelection.value).toBe(true)
      expect(result.isMultiSelection.value).toBe(false)
    })
  })

  describe('Hierarchy and Top-Level Selection Resolution', () => {
    it('resolves single entity selection and locked state correctly', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_1',
        name: 'Static Wall',
        _editor: { locked: true }
      })
      setupMockSceneEnvironment({ entities: [entity] })

      sceneStore.selectedEntityIds = ['ent_1']

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.topLevelSelection.value).toEqual(['ent_1'])
      expect(result.selectedEntity.value?.id).toBe('ent_1')
      expect(result.locked.value).toBe(true)
      expect(result.isMultiSelection.value).toBe(false)
      expect(result.hasSelection.value).toBe(true)
    })

    it('filters out child entities from top level selection when parent is also selected', () => {
      // Arrange
      const parent = createMockEntity({ id: 'parent_1', name: 'Parent Entity' })
      const child = createMockEntity({ id: 'child_1', parentId: 'parent_1', name: 'Child Entity' })
      const grandChild = createMockEntity({ id: 'grandchild_1', parentId: 'child_1', name: 'GrandChild Entity' })

      setupMockSceneEnvironment({ entities: [parent, child, grandChild] })

      sceneStore.selectedEntityIds = ['parent_1', 'child_1', 'grandchild_1']

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.topLevelSelection.value).toEqual(['parent_1'])
      expect(result.selectedEntity.value?.id).toBe('parent_1')
      expect(result.isMultiSelection.value).toBe(false)
    })

    it('flags multi selection mode when multiple top-level entities are selected', () => {
      // Arrange
      const entity1 = createMockEntity({ id: 'ent_1', name: 'Entity 1' })
      const entity2 = createMockEntity({ id: 'ent_2', name: 'Entity 2' })

      setupMockSceneEnvironment({ entities: [entity1, entity2] })

      sceneStore.selectedEntityIds = ['ent_1', 'ent_2']

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.topLevelSelection.value).toEqual(['ent_1', 'ent_2'])
      expect(result.selectedEntity.value).toBeNull()
      expect(result.isMultiSelection.value).toBe(true)
      expect(result.hasSelection.value).toBe(false)
    })

    it('[Bad Path] returns empty selection when activeScene is null', () => {
      // Arrange
      setupMockSceneEnvironment()
      sceneStore.activeSceneId = null

      // Act
      const { result } = setupComposableRunner()

      // Assert
      expect(result.topLevelSelection.value).toEqual([])
      expect(result.selectedEntity.value).toBeNull()
      expect(result.hasSelection.value).toBe(false)
    })
  })

  describe('Keyboard Event Lifecycle Integration', () => {
    it('clears selection in scene store on Escape key press when selection exists', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_1', name: 'Interactive Box' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { result } = setupComposableRunner()
      expect(result.hasSelection.value).toBe(true)

      // Act
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(escapeEvent)

      // Assert
      expect(sceneStore.selectedEntityIds).toEqual([])
      expect(result.hasSelection.value).toBe(false)
    })

    it('[Bad Path] ignores Escape key press when editing master prefab', () => {
      // Arrange
      setupMockSceneEnvironment()
      prefabStore.initPrefabs([{ id: 'prefab_1', name: 'Prefab', folderId: null, data: { id: 'p1' } }])
      workspaceStore.openTab({ id: 'prefab_1', name: 'Prefab', type: 'prefab' })

      const clearSelectionSpy = vi.spyOn(sceneStore, 'clearSelection')
      setupComposableRunner()

      // Act
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(escapeEvent)

      // Assert
      expect(clearSelectionSpy).not.toHaveBeenCalled()
    })

    it('removes window keydown event listener on component unmount', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_1' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const clearSelectionSpy = vi.spyOn(sceneStore, 'clearSelection')
      const { wrapper } = setupComposableRunner()

      // Act
      wrapper.unmount()

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(escapeEvent)

      // Assert
      expect(clearSelectionSpy).not.toHaveBeenCalled()
    })
  })
})