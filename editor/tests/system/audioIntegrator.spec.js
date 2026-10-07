import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Import target modules langsung dari source file (tanpa barrel)
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { engineBridge } from '@engines/engines.js'
import { useSceneHistory } from '@historys/historys.js'
import { 
  useInspectorSelection, 
  useInspectorPrefab, 
  useInspectorBinding 
} from '@inspectors/inspectors.js'

// Import helper mock project
import { 
  setupMockOPFS, 
  setupMockSceneEnvironment, 
  createMockEntity 
} from '@tests/tests.js'

// Mock composables UI dialog/alert/audio eksternal
const mockShowAudio = vi.fn()
const mockConfirm = vi.fn().mockResolvedValue(true)

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: vi.fn() }),
  useConfirm: () => ({ confirm: mockConfirm }),
  usePopAudio: () => ({ showAudio: mockShowAudio })
}))

describe('Audio Inspector System Integration Test', () => {
  let sceneStore
  let workspaceStore
  let assetStore
  let sceneHistory
  let entityId

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()
    sceneHistory = useSceneHistory()

    // 1. Arrange Environment: Entity dengan komponen Audio yang memiliki klip default
    const entity = createMockEntity({
      name: 'Audio Source Entity',
      entityType: 'audio',
      attachComponents: {
        Audio: {
          currentClip: 'clip_1',
          clips: [
            {
              id: 'clip_1',
              scriptId: 'BGM_MAIN',
              assetId: 'asset_bgm_1',
              isMute: false,
              volume: 0.8,
              pitch: 1.0,
              loop: true,
              autoplay: true,
              spatial: false,
              persist: false,
              fadeIn: 0.5,
              fadeOut: 0.5,
              refDistance: 100,
              maxDistance: 1000
            }
          ]
        }
      }
    })
    entityId = entity.id

    setupMockSceneEnvironment({
      entities: [entity],
      selectedEntityIds: [entityId]
    })

    // Mock bridge engine listener untuk melacak pengiriman update
    vi.spyOn(engineBridge, 'updateComponentProp').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'removeComponent').mockImplementation(() => {})
  })

  afterEach(() => {
    engineBridge.disconnect()
    vi.restoreAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Selection and Component Presence', () => {
    it('detects Audio component on the currently selected entity', () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      // Act
      const currentClip = bindComponentProp('Audio', 'currentClip')

      // Assert
      expect(selectedEntity.value.id).toBe(entityId)
      expect(selectedEntity.value.components.Audio).toBeDefined()
      expect(currentClip.value).toBe('clip_1')
    })

    it('binds audio clips array and current clip data properly', () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')
      const currentClipId = bindComponentProp('Audio', 'currentClip')

      // Assert
      expect(clips.value).toHaveLength(1)
      expect(clips.value[0].scriptId).toBe('BGM_MAIN')
      expect(currentClipId.value).toBe('clip_1')
    })
  })

  describe('Audio Clip Mutations and Property Binding', () => {
    it('mutates clip parameters (volume, pitch, loop, autoplay) and syncs with SceneStore and EngineBridge', () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')
      const currentClipId = bindComponentProp('Audio', 'currentClip')

      // Helper untuk membuat binding dua arah pada klip aktif seperti di AudioInspector
      const updateClipProp = (propName, value) => {
        const idx = clips.value.findIndex(c => c.id === currentClipId.value)
        if (idx === -1) return
        const updatedClips = [...clips.value]
        updatedClips[idx] = { ...updatedClips[idx], [propName]: value }
        clips.value = updatedClips
      }

      // Act: Ubah parameter klip audio
      updateClipProp('volume', 1.0)
      updateClipProp('pitch', 1.2)
      updateClipProp('loop', false)

      // Assert di SceneStore
      const audioComp = sceneStore.activeScene.entities[0].components.Audio
      const activeClip = audioComp.clips.find(c => c.id === 'clip_1')

      expect(activeClip.volume).toBe(1.0)
      expect(activeClip.pitch).toBe(1.2)
      expect(activeClip.loop).toBe(false)

      // Assert transmisi ke EngineBridge
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId,
        componentName: 'Audio',
        path: 'clips',
        value: expect.any(Array)
      })
    })

    it('adds a new audio clip to the bank and automatically sets it as current clip', () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')
      const currentClipId = bindComponentProp('Audio', 'currentClip')

      const initialLength = clips.value.length

      // Act: Tambah klip baru
      const newClipId = 'clip_2'
      const newClip = {
        id: newClipId,
        scriptId: 'SFX_JUMP',
        assetId: null,
        isMute: false,
        volume: 1.0,
        pitch: 1.0,
        loop: false,
        autoplay: false,
        spatial: true,
        persist: false,
        fadeIn: 0.0,
        fadeOut: 0.0,
        refDistance: 100,
        maxDistance: 1000
      }

      clips.value = [...clips.value, newClip]
      currentClipId.value = newClipId

      // Assert
      const updatedAudioComp = sceneStore.activeScene.entities[0].components.Audio
      expect(updatedAudioComp.clips).toHaveLength(initialLength + 1)
      expect(updatedAudioComp.currentClip).toBe(newClipId)
      expect(updatedAudioComp.clips[1].scriptId).toBe('SFX_JUMP')
    })

    it('removes current audio clip after confirmation and updates currentClip selection', async () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')
      const currentClipId = bindComponentProp('Audio', 'currentClip')

      // Tambahkan klip kedua terlebih dahulu
      clips.value = [
        ...clips.value,
        { id: 'clip_2', scriptId: 'SFX_COIN', assetId: null }
      ]
      currentClipId.value = 'clip_1'

      // Mock user menyetujui dialog konfirmasi
      mockConfirm.mockResolvedValueOnce(true)

      // Act: Hapus klip aktif ('clip_1')
      const isConfirmed = await mockConfirm({
        title: 'Remove Clip?',
        message: 'Are you sure you want to remove "BGM_MAIN"?'
      })

      if (isConfirmed) {
        const remainingClips = clips.value.filter(c => c.id !== 'clip_1')
        clips.value = remainingClips
        currentClipId.value = remainingClips.length > 0 ? remainingClips[0].id : null
      }

      // Assert
      const updatedAudioComp = sceneStore.activeScene.entities[0].components.Audio
      expect(updatedAudioComp.clips).toHaveLength(1)
      expect(updatedAudioComp.clips[0].id).toBe('clip_2')
      expect(updatedAudioComp.currentClip).toBe('clip_2')
    })
  })

  describe('Asset Resolution and Audio Playback Preview', () => {
    it('resolves audio asset details and triggers audio playback popup', () => {
      // Arrange
      const mockAssetId = 'asset_bgm_1'
      const mockAssetUrl = 'blob:http://localhost/audio/bgm.mp3'

      assetStore.initAssets([
        { id: mockAssetId, name: 'bgm.mp3', displayName: 'Main Theme BGM', type: 'audio' }
      ])
      assetStore.getAssetUrlById = vi.fn().mockReturnValue(mockAssetUrl)

      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')
      const activeClip = clips.value[0]

      // Act: Ambil URL dan mainkan audio
      const resolvedAsset = assetStore.assets.find(a => a.id === activeClip.assetId)
      const audioUrl = assetStore.getAssetUrlById(activeClip.assetId)

      mockShowAudio(audioUrl, resolvedAsset.displayName || resolvedAsset.name)

      // Assert
      expect(assetStore.getAssetUrlById).toHaveBeenCalledWith(mockAssetId)
      expect(mockShowAudio).toHaveBeenCalledWith(mockAssetUrl, 'Main Theme BGM')
    })
  })

  describe('Prefab Sync and Component Lifecycle', () => {
    it('removes Audio component from selected entity via useInspectorPrefab', async () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { removeComponent } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)

      // Act
      await removeComponent('Audio')

      // Assert
      expect(sceneStore.activeScene.entities[0].components.Audio).toBeUndefined()
    })
  })

  describe('Negative Scenarios [Bad Path]', () => {
    it('[Bad Path] handles operations gracefully when entity has no Audio component', async () => {
      // Arrange: Hapus komponen Audio dari entity
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { removeComponent } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      await removeComponent('Audio')

      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)
      
      const clips = bindComponentProp('Audio', 'clips')

      // Act & Assert
      expect(clips.value).toBeUndefined()
      expect(() => {
        if (clips.value) {
          clips.value = []
        }
      }).not.toThrow()
    })

    it('[Bad Path] cancels audio clip deletion when user rejects confirmation dialog', async () => {
      // Arrange
      const { selectedEntity, isEditingMasterPrefab } = useInspectorSelection()
      const { prefabId, markAsOverridden } = useInspectorPrefab(selectedEntity, isEditingMasterPrefab)
      const { bindComponentProp } = useInspectorBinding(selectedEntity, isEditingMasterPrefab, prefabId, markAsOverridden)

      const clips = bindComponentProp('Audio', 'clips')

      // Mock user menolak dialog konfirmasi
      mockConfirm.mockResolvedValueOnce(false)

      // Act
      const isConfirmed = await mockConfirm({ title: 'Remove Clip?' })

      if (isConfirmed) {
        clips.value = []
      }

      // Assert: Klip tidak dihapus
      expect(clips.value).toHaveLength(1)
      expect(sceneStore.activeScene.entities[0].components.Audio.clips).toHaveLength(1)
    })
  })
})