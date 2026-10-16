import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

import { 
  useInspectorBinding, 
  useInspectorSelection, 
  useInspectorPrefab 
} from '@inspectors/inspectors.js'
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

  /* ========================================================================
   * RECREATION & REGRESSION PREVENTION TEST SUITE (OPSI 1 FALLBACK TEST)
   * ======================================================================== */
  describe('Option 1 Architecture: Implicit Arguments Fallback (Prevention for Unbound Editors)', () => {
    it('successfully binds component properties when called WITH NO ARGUMENTS (Zero-Argument Signature)', () => {
      // Arrange - Setup entity di sceneStore dan pilih melalui selection store
      const entity = createMockEntity({
        id: 'ent_audio_unbound',
        components: { Audio: { currentClip: 'clip_101', clips: [{ id: 'clip_101', volume: 0.8 }] } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      
      // Simulasikan pemilihan entitas pada global selection store
      sceneStore.selectedEntityIds = ['ent_audio_unbound']

      // Act - Panggil useInspectorBinding TANPA ARGUMEN (Gaya EditorAudio.vue / EditorScript.vue)
      const { bindComponentProp } = useInspectorBinding()
      const clipBinding = bindComponentProp('Audio', 'currentClip')

      // Assert - Memastikan getter membaca data entitas terpilih tanpa melempar TypeError/undefined
      expect(clipBinding.value).toBe('clip_101')

      // Act - Lakukan perubahan via setter
      clipBinding.value = 'clip_102'

      // Assert - Memastikan mutasi berhasil direfleksikan ke sceneStore
      expect(sceneStore.activeScene.entities[0].components.Audio.currentClip).toBe('clip_102')
    })

    it('dynamically adapts when selectedEntity changes via useInspectorSelection without passing refs', () => {
      // Arrange - Buat dua entitas berbeda
      const entityA = createMockEntity({ id: 'ent_A', name: 'Entity A', components: { SpriteRenderer: { opacity: 0.5 } } })
      const entityB = createMockEntity({ id: 'ent_B', name: 'Entity B', components: { SpriteRenderer: { opacity: 1.0 } } })
      setupMockSceneEnvironment({ entities: [entityA, entityB] })

      // Panggil binding tanpa argumen pada level komputasi
      sceneStore.selectedEntityIds = ['ent_A']
      const { bindComponentProp } = useInspectorBinding()
      const opacityBinding = bindComponentProp('SpriteRenderer', 'opacity')

      // Assert awal - Membaca entitas A
      expect(opacityBinding.value).toBe(0.5)

      // Act - Ubah seleksi global ke entitas B
      sceneStore.selectedEntityIds = ['ent_B']

      // Assert - Reactive getter otomatis beralih ke entitas B
      expect(opacityBinding.value).toBe(1.0)
    })

    it('triggers markAsOverridden fallback when editing prefab instance component without explicit parameters', () => {
      // Arrange
      const entity = createMockEntity({
        id: 'ent_prefab_fallback',
        prefabId: 'prefab_master_001',
        components: { Physics: { gravityScale: 1.0, overridden: false } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_prefab_fallback']

      // Act - Panggil tanpa argumen
      const { bindComponentProp } = useInspectorBinding()
      const gravityBinding = bindComponentProp('Physics', 'gravityScale')
      gravityBinding.value = 2.5

      // Assert
      const updatedComp = sceneStore.activeScene.entities[0].components.Physics
      expect(updatedComp.gravityScale).toBe(2.5)
      expect(updatedComp.overridden).toBe(true)
    })
  })

  /* ========================================================================
   * ORIGINAL INTEGRATION TESTS
   * ======================================================================== */
  describe('Project and Scene Setting Prop Bindings (bindSettingProp)', () => {
    it('reads and updates project grid settings through computed binding', () => {
      const { bindSettingProp } = setupBinding()
      const gridWidthBinding = bindSettingProp('grid', 'width')
      const gridSnapBinding = bindSettingProp('grid', 'snap')

      expect(gridWidthBinding.value).toBe(32)
      expect(gridSnapBinding.value).toBe(true)

      gridWidthBinding.value = 64
      gridSnapBinding.value = false

      expect(projectStore.project.settings.grid.width).toBe(64)
      expect(projectStore.project.settings.grid.snap).toBe(false)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('reads and updates active scene background color settings through computed binding', () => {
      setupMockSceneEnvironment()
      const { bindSettingProp } = setupBinding()
      const bgBinding = bindSettingProp(null, 'backgroundColor')

      bgBinding.value = '#FF0000'

      expect(sceneStore.activeScene.settings.backgroundColor).toBe('#FF0000')
    })

    it('[Bad Path] returns undefined and ignores setters when category is scene-based but activeScene is null', () => {
      setupMockSceneEnvironment()
      sceneStore.activeSceneId = null

      const { bindSettingProp } = setupBinding()
      const bgBinding = bindSettingProp(null, 'backgroundColor')

      expect(bgBinding.value).toBeUndefined()
      expect(() => {
        bgBinding.value = '#00FF00'
      }).not.toThrow()
    })
  })

  describe('Entity Prop Bindings (bindEntityProp)', () => {
    it('updates entity name in sceneStore and records prop change history when editing regular entity', () => {
      const entity = createMockEntity({ id: 'ent_1', name: 'Original Name' })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      nameBinding.value = 'Updated Name'

      expect(sceneStore.activeScene.entities[0].name).toBe('Updated Name')
    })

    it('updates prefab store and dispatches engineBridge call when editing master prefab entity', () => {
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

      engineBridge.updatePrefabMasterProp = () => {}
      const spyBridge = vi.spyOn(engineBridge, 'updatePrefabMasterProp')

      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      nameBinding.value = 'New Prefab Name'

      expect(prefabStore.getPrefabById('prefab_101').name).toBe('New Prefab Name')
      expect(spyBridge).toHaveBeenCalledWith({
        prefabId: 'prefab_101',
        prop: 'name',
        value: 'New Prefab Name'
      })
    })

    it('[Bad Path] returns empty string and skips update when selectedEntity is null', () => {
      selectedEntityRef.value = null
      const { bindEntityProp } = setupBinding()
      const nameBinding = bindEntityProp('name')

      expect(nameBinding.value).toBe('')
      expect(() => {
        nameBinding.value = 'Any Name'
      }).not.toThrow()
    })
  })

  describe('Component Prop Bindings (bindComponentProp)', () => {
    it('updates component property with precision rounding and notifies engineBridge', () => {
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

      xBinding.value = 45.6789

      expect(sceneStore.activeScene.entities[0].components.Transform.x).toBe(45.68)
      expect(spyBridge).toHaveBeenCalledWith({
        entityId: 'ent_transform',
        componentName: 'Transform',
        path: 'x',
        value: 45.68
      })
    })

    it('synchronizes linked scale properties when scale locking is enabled on Transform', () => {
      const entity = createMockEntity({
        id: 'ent_scale',
        entityType: 'sprite',
        components: { Transform: { scaleX: 1, scaleY: 1, isScaleLocked: true } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { bindComponentProp } = setupBinding()
      const scaleXBinding = bindComponentProp('Transform', 'scaleX')

      scaleXBinding.value = 3.4

      const transform = sceneStore.activeScene.entities[0].components.Transform
      expect(transform.scaleX).toBe(3)
      expect(transform.scaleY).toBe(3)
    })

    it('marks prefab instance component as overridden when edited outside master prefab mode', () => {
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

      colorBinding.value = '#00FF00'

      expect(sceneStore.activeScene.entities[0].components.SpriteRenderer.overridden).toBe(true)
    })
  })

  describe('Script Controller Operations (Script Instances)', () => {
    it('adds and removes script instances while invoking markAsOverridden when attached to prefab instance', () => {
      const entity = createMockEntity({
        id: 'ent_script',
        components: { ScriptController: { data: [] } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]
      prefabIdRef.value = 'prefab_origin'

      const { addScript, removeScript, scriptsData } = setupBinding()

      addScript('asset_script_1')

      expect(scriptsData.value.length).toBe(1)
      expect(scriptsData.value[0].assetId).toBe('asset_script_1')
      expect(markAsOverriddenMock).toHaveBeenCalledTimes(1)

      removeScript(0)

      expect(scriptsData.value.length).toBe(0)
      expect(markAsOverriddenMock).toHaveBeenCalledTimes(2)
    })

    it('updates script instance field path in sceneStore', () => {
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

      updateScriptInstance(0, 'active', false)

      const scriptInst = sceneStore.activeScene.entities[0].components.ScriptController.data[0]
      expect(scriptInst.active).toBe(false)
    })
  })

  describe('Texture URL and Helper Utilities', () => {
    it('resolves texture URL from asset store using sprite renderer asset ID', async () => {
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

      const url = await currentTextureUrl.value

      expect(url).toBe('blob:http://localhost/mock-blob-uuid')
      expect(assetStore.getAssetUrlById).toHaveBeenCalledWith('asset_tex_1')
    })

    it('[Bad Path] returns null currentTextureUrl when entity or assetId is missing', () => {
      selectedEntityRef.value = null
      const { currentTextureUrl } = setupBinding()

      expect(currentTextureUrl.value).toBeNull()
    })

    it('updates UI settings in bulk through project store', () => {
      const { updateUISettingsBulk } = setupBinding()

      updateUISettingsBulk({ showUIBorder: true })

      expect(projectStore.project.settings.ui.showUIBorder).toBe(true)
    })

    it('resets text ratio by reapplying text renderer font size', () => {
      const entity = createMockEntity({
        id: 'ent_text',
        components: { TextRenderer: { fontSize: 32, autoFit: false } }
      })
      setupMockSceneEnvironment({ entities: [entity] })
      selectedEntityRef.value = sceneStore.activeScene.entities[0]

      const { resetTextRatio } = setupBinding()

      resetTextRatio()

      expect(sceneStore.activeScene.entities[0].components.TextRenderer.fontSize).toBe(32)
      expect(sceneStore.activeScene.entities[0].components.TextRenderer.autoFit).toBe(true)
    })
  })
})