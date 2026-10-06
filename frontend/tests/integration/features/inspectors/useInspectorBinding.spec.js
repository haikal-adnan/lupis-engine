import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import { useInspectorBinding } from '@inspectors/inspectors.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { useAssetStore } from '@assets/assets.js'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { engineBridge } from '@engines/engines.js'
import { projectSchema } from '@projects/projects.js'
import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity
} from '@tests/tests.js'

describe('useInspectorBinding Integration', () => {
  let sceneStore
  let projectStore
  let assetStore
  let prefabStore
  let workspaceStore

  let selectedEntityRef
  let isEditingMasterPrefabRef
  let prefabIdRef
  let markAsOverriddenMock

  beforeEach(() => {
    // 1. Inisialisasi Mock OPFS
    setupMockOPFS()

    // 2. Set Active Pinia & Instantiate Stores
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    projectStore = useProjectStore()
    assetStore = useAssetStore()
    prefabStore = usePrefabStore()
    workspaceStore = useWorkspaceStore()

    // 3. Set data project default menggunakan projectSchema agar terjamin validitasnya
    projectStore.project = projectSchema({ id: 'test_project_1', name: 'Test Project' })

    selectedEntityRef = ref(null)
    isEditingMasterPrefabRef = ref(false)
    prefabIdRef = ref(null)
    markAsOverriddenMock = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function setupBinding() {
    return useInspectorBinding(
      selectedEntityRef,
      isEditingMasterPrefabRef,
      prefabIdRef,
      markAsOverriddenMock
    )
  }

  describe('Project and Scene Setting Prop Bindings (bindSettingProp)', () => {
    it('reads and updates project grid settings through computed binding', () => {
      // Arrange
      const { bindSettingProp } = setupBinding()
      const gridWidthBinding = bindSettingProp('grid', 'width')
      const gridSnapBinding = bindSettingProp('grid', 'snap')

      // Act & Assert - Get initial values (default grid width is 32, snap is true)
      expect(gridWidthBinding.value).toBe(32)
      expect(gridSnapBinding.value).toBe(true)

      // Act - Update values
      gridWidthBinding.value = 64
      gridSnapBinding.value = false

      // Assert - Verify project store state updated
      expect(projectStore.project.settings.grid.width).toBe(64)
      expect(projectStore.project.settings.grid.snap).toBe(false)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('reads and updates active scene background color settings through computed binding', () => {
      // Arrange
      setupMockSceneEnvironment()
      const { bindSettingProp } = setupBinding()
      const bgBinding = bindSettingProp(null, 'backgroundColor')

      // Act
      bgBinding.value = '#FF0000'

      // Assert
      expect(sceneStore.activeScene.settings.backgroundColor).toBe('#FF0000')
    })

    it('[Bad Path] returns undefined and ignores setters when category is scene-based but activeScene is null', () => {
      // Arrange
      setupMockSceneEnvironment()
      sceneStore.activeSceneId = null

      const { bindSettingProp } = setupBinding()
      const bgBinding = bindSettingProp(null, 'backgroundColor')

      // Act & Assert
      expect(bgBinding.value).toBeUndefined()
      expect(() => {
        bgBinding.value = '#00FF00'
      }).not.toThrow()
    })
  })

  describe('Entity Prop Bindings (bindEntityProp)', () => {
    it('updates entity name in sceneStore and records prop change history when editing regular entity', () => {
      // Arrange
      const entity = createMockEntity({ id: 'ent_1', name: 'Original Name' })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      // Act
      nameBinding.value = 'Updated Name'

      // Assert
      expect(sceneStore.activeScene.entities[0].name).toBe('Updated Name')
    })

    it('updates prefab store and dispatches engineBridge call when editing master prefab entity', () => {
      // Arrange
      setupMockSceneEnvironment()
      isEditingMasterPrefabRef.value = true

      prefabStore.initPrefabs([
        {
          id: 'prefab_101',
          name: 'Old Prefab Name',
          data: { id: 'ent_p1', name: 'Old Prefab Name' }
        }
      ])
      workspaceStore.openTab({ id: 'prefab_101', name: 'Prefab', type: 'prefab' })
      selectedEntityRef.value = prefabStore.getPrefabById('prefab_101').data

      // Pastikan method terdefinisi sebelum di-spy
      engineBridge.updatePrefabMasterProp = () => {}
      const spyBridge = vi.spyOn(engineBridge, 'updatePrefabMasterProp')

      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      // Act
      nameBinding.value = 'New Prefab Name'

      // Assert
      expect(prefabStore.getPrefabById('prefab_101').name).toBe('New Prefab Name')
      expect(spyBridge).toHaveBeenCalledWith({
        prefabId: 'prefab_101',
        prop: 'name',
        value: 'New Prefab Name'
      })
    })

    it('[Bad Path] returns empty string and skips update when selectedEntity is null', () => {
      // Arrange
      selectedEntityRef.value = null
      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      // Act & Assert
      expect(nameBinding.value).toBe('')
      expect(() => {
        nameBinding.value = 'Any Name'
      }).not.toThrow()
    })
  })

  describe('Component Prop Bindings (bindComponentProp)', () => {
    it('updates component property with precision rounding and notifies engineBridge', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_transform',
        entityType: 'sprite',
        components: { Transform: { x: 10.1234, y: 20.5 } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const spyBridge = vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})

      const { bindComponentProp } = setupBinding()
      const xBinding = bindComponentProp('Transform', 'x', 2)

      // Act
      xBinding.value = 45.6789

      // Assert (45.6789 rounded to precision 2 is 45.68)
      expect(sceneStore.activeScene.entities[0].components.Transform.x).toBe(45.68)
      expect(spyBridge).toHaveBeenCalledWith({
        entityId: 'ent_transform',
        componentName: 'Transform',
        path: 'x',
        value: 45.68
      })
    })

    it('synchronizes linked scale properties when scale locking is enabled on Transform', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_scale',
        entityType: 'sprite',
        components: { Transform: { scaleX: 1, scaleY: 1, isScaleLocked: true } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { bindComponentProp } = setupBinding()
      const scaleXBinding = bindComponentProp('Transform', 'scaleX')

      // Act - scale values are clamped using Math.max(1, Math.round(val))
      scaleXBinding.value = 3.4

      // Assert
      const transform = sceneStore.activeScene.entities[0].components.Transform
      expect(transform.scaleX).toBe(3)
      expect(transform.scaleY).toBe(3)
    })

    it('marks prefab instance component as overridden when edited outside master prefab mode', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_prefab_inst',
        prefabId: 'prefab_99',
        components: { SpriteRenderer: { color: '#FFFFFF' } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]
      prefabIdRef.value = 'prefab_99'

      const { bindComponentProp } = setupBinding()
      const colorBinding = bindComponentProp('SpriteRenderer', 'color')

      // Act
      colorBinding.value = '#00FF00'

      // Assert
      expect(sceneStore.activeScene.entities[0].components.SpriteRenderer.overridden).toBe(true)
    })
  })

  describe('Script Controller Operations (Script Instances)', () => {
    it('adds and removes script instances while invoking markAsOverridden when attached to prefab instance', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_script',
        components: { ScriptController: { data: [] } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]
      prefabIdRef.value = 'prefab_origin'

      const { addScript, removeScript, scriptsData } = setupBinding()

      // Act 1 - Add Script
      addScript('asset_script_1')

      // Assert 1
      expect(scriptsData.value.length).toBe(1)
      expect(scriptsData.value[0].assetId).toBe('asset_script_1')
      expect(markAsOverriddenMock).toHaveBeenCalledTimes(1)

      // Act 2 - Remove Script
      removeScript(0)

      // Assert 2
      expect(scriptsData.value.length).toBe(0)
      expect(markAsOverriddenMock).toHaveBeenCalledTimes(2)
    })

    it('updates script instance field path in sceneStore', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_script_mod',
        components: {
          ScriptController: {
            data: [{ id: 'inst_1', assetId: 's1', active: true, variables: {} }]
          }
        }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { updateScriptInstance } = setupBinding()

      // Act
      updateScriptInstance(0, 'active', false)

      // Assert
      const scriptInst = sceneStore.activeScene.entities[0].components.ScriptController.data[0]
      expect(scriptInst.active).toBe(false)
    })
  })

  describe('Texture URL and Helper Utilities', () => {
    it('resolves texture URL from asset store using sprite renderer asset ID', async () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_sprite',
        components: { SpriteRenderer: { assetId: 'asset_tex_1' } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      assetStore.assets = [
        { id: 'asset_tex_1', name: 'Hero Sprite', type: 'texture', fileKey: 'hero', meta: { extension: '.png' } }
      ]

      vi.spyOn(assetStore, 'getAssetUrlById').mockResolvedValue('blob:http://localhost/mock-blob-uuid')

      const { currentTextureUrl } = setupBinding()

      // Act
      const url = await currentTextureUrl.value

      // Assert
      expect(url).toBe('blob:http://localhost/mock-blob-uuid')
      expect(assetStore.getAssetUrlById).toHaveBeenCalledWith('asset_tex_1')
    })

    it('[Bad Path] returns null currentTextureUrl when entity or assetId is missing', () => {
      // Arrange
      selectedEntityRef.value = null
      const { currentTextureUrl } = setupBinding()

      // Act & Assert
      expect(currentTextureUrl.value).toBeNull()
    })

    it('updates UI settings in bulk through project store', () => {
      // Arrange
      const { updateUISettingsBulk } = setupBinding()

      // Act
      updateUISettingsBulk({ showUIBorder: true })

      // Assert
      expect(projectStore.project.settings.ui.showUIBorder).toBe(true)
    })

    it('resets text ratio by reapplying text renderer font size', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_text',
        components: { TextRenderer: { fontSize: 32 } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { resetTextRatio } = setupBinding()

      // Act
      resetTextRatio()

      // Assert
      expect(sceneStore.activeScene.entities[0].components.TextRenderer.fontSize).toBe(32)
    })
  })
})