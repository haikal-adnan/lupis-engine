import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnimatorLogic } from '@animators/animators.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { useAnimatorHistory } from '@historys/historys.js'
import { setupMockSceneEnvironment, createMockEntity } from '@tests/tests.js'
import { GenerateUUID } from '@utils/utils.js'

/**
 * Helper untuk membuat mock entity yang dilengkapi dengan SpriteAnimator
 * dan data Asset dummy untuk pengujian Animator.
 */
function createMockAnimatorEntity({
  entityId = `entity_anim_${GenerateUUID().split('-')[0]}`,
  assetId = `asset_tex_${GenerateUUID().split('-')[0]}`,
  assetName = 'hero_spritesheet.png',
  clipId = `clip_${GenerateUUID().split('-')[0]}`,
  ...overrides
} = {}) {
  const mockAsset = {
    id: assetId,
    name: assetName,
    type: 'texture',
    fileKey: `fk_${assetId}`,
    meta: {
      extension: '.png',
      dimensions: { w: 128, h: 32 }
    }
  }

  const defaultClip = {
    id: clipId,
    name: 'Idle_Clip',
    type: 'clip',
    scriptId: `script_${clipId}`,
    assetId: assetId,
    parentId: null,
    fps: 12,
    isLooping: true,
    frames: ['s_0', 's_1'],
    sources: {
      s_0: { x: 0, y: 0, w: 32, h: 32 },
      s_1: { x: 32, y: 0, w: 32, h: 32 }
    },
    baseSize: { w: 32, h: 32 },
    pivot: { x: 0.5, y: 1 },
    frameIndex: 0,
    filterMode: 'pixelated',
    useSDF: false
  }

  const entity = createMockEntity({
    id: entityId,
    name: overrides.name || 'Animator Entity',
    entityType: 'sprite',
    ...overrides,
    attachComponents: {
      SpriteAnimator: {
        active: true,
        isPlaying: false,
        currentClip: clipId,
        clips: overrides.clips || [defaultClip],
        ...(overrides.animatorComponent || {})
      },
      ...(overrides.attachComponents || {})
    }
  })

  return {
    entity,
    mockAsset,
    defaultClip
  }
}

// Mock external Engine Bridge & Composables UI Alert / Prompt / Confirm
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    patchComponent: vi.fn()
  }
}))

const mockShowPop = vi.fn()
const mockPrompt = vi.fn()
const mockConfirm = vi.fn()

vi.mock('@composables/composables.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    usePopAlert: () => ({ showPop: mockShowPop }),
    usePrompt: () => ({ prompt: mockPrompt }),
    useConfirm: () => ({ confirm: mockConfirm })
  }
})

describe('useAnimatorLogic Integration', () => {
  let sceneStore
  let workspaceStore
  let assetStore
  let animatorHistory
  let mockEntityData

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()
    animatorHistory = useAnimatorHistory()

    mockEntityData = createMockAnimatorEntity({ name: 'Player Sprite' })
    const { entity, mockAsset } = mockEntityData

    setupMockSceneEnvironment({ entities: [entity] })
    assetStore.initAssets([mockAsset])

    // Buka tab workspace yang aktif mengarah ke entity
    workspaceStore.openTab({
      id: entity.id,
      name: entity.name,
      type: 'animator'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('Entity Selection and Tab Synchronization', () => {
    it('resolves selected entity and animator state correctly', () => {
      // Arrange & Act
      const logic = useAnimatorLogic()

      // Assert
      expect(logic.selectedEntity.value?.id).toBe(mockEntityData.entity.id)
      expect(logic.hasAnimator.value).toBe(true)
      expect(logic.activeEntityId.value).toBe(mockEntityData.entity.id)
    })

    it('closes animator tab automatically when selected entity has no animator component', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      const entity = sceneStore.activeScene.entities.find(e => e.id === mockEntityData.entity.id)
      
      // Act: Hapus SpriteAnimator dari entity
      delete entity.components.SpriteAnimator
      
      // Trigger re-computation / watcher
      await vi.dynamicImportSettled()

      // Assert
      expect(logic.hasAnimator.value).toBe(false)
    })
  })

  describe('Tree Operations & History Recording Integration', () => {
    it('creates a new category and records state change in history', () => {
      // Arrange
      const logic = useAnimatorLogic()
      const initialClipCount = logic.realClipsData.value.length

      // Act
      logic.createCategory()

      // Assert: Verifikasi perubahan di store dan visual tree
      expect(logic.realClipsData.value.length).toBe(initialClipCount + 1)
      const createdCategory = logic.realClipsData.value.find(c => c.type === 'category')
      expect(createdCategory).toBeDefined()
      expect(createdCategory.name).toBe('New Category')

      // Act: Undo via history
      logic.undo()

      // Assert: State kembali seperti semula
      expect(logic.realClipsData.value.length).toBe(initialClipCount)
    })

    it('creates a clip under targeted category and syncs tree structure', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createCategory()
      const categoryNode = logic.realClipsData.value.find(c => c.type === 'category')

      // Act
      logic.createClip(categoryNode.id)

      // Assert
      const newClip = logic.realClipsData.value.find(c => c.name === 'New_Clip')
      expect(newClip).toBeDefined()
      expect(newClip.parentId).toBe(categoryNode.id)
    })

    it('deletes clip node and resets activeClipId if the deleted clip was active', () => {
      // Arrange
      const logic = useAnimatorLogic()
      const targetClipId = mockEntityData.defaultClip.id
      logic.selectClip(targetClipId)
      expect(logic.activeClipId.value).toBe(targetClipId)

      // Act
      logic.deleteNode(targetClipId)

      // Assert
      expect(logic.activeClipId.value).toBeNull()
      expect(logic.realClipsData.value.find(c => c.id === targetClipId)).toBeUndefined()
    })

    it('renames node through prompt dialog and notifies user upon success', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id
      mockPrompt.mockResolvedValueOnce('Run_Loop')

      // Act
      await logic.renameNode(clipId)

      // Assert
      const updatedClip = logic.realClipsData.value.find(c => c.id === clipId)
      expect(updatedClip.name).toBe('Run_Loop')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })
  })

  describe('Clipboard Operations (Copy, Cut, Paste)', () => {
    it('copies node data into workspace clipboard', () => {
      // Arrange
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id

      // Act
      logic.copyNode(clipId)

      // Assert
      expect(workspaceStore.clipboard.type).toBe('animator_node')
      expect(workspaceStore.clipboard.data.node.id).toBe(clipId)
      expect(logic.hasClipboard.value).toBe(true)
    })

    it('cuts node to clipboard, removes it from scene, and clears clipboard after paste', () => {
      // Arrange
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id

      // Act 1: Cut
      logic.cutNode(clipId)
      expect(logic.realClipsData.value.find(c => c.id === clipId)).toBeUndefined()
      expect(workspaceStore.clipboard.mode).toBe('cut')

      // Act 2: Paste
      logic.pasteNode(null)

      // Assert: Node terduplikasi disalin dan clipboard dikosongkan
      expect(logic.realClipsData.value.length).toBe(1)
      expect(workspaceStore.clipboard.type).toBeNull()
    })
  })

  describe('Timeline & Frame Playback Integration', () => {
    it('adds new frame using last source dimensions and syncs scene data', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      const initialFrameCount = logic.frames.value.length

      // Act
      logic.addFrame()

      // Assert
      expect(logic.frames.value.length).toBe(initialFrameCount + 1)
      expect(logic.currentFrameIndex.value).toBe(initialFrameCount)
    })

    it('plays and steps forward frame timeline over intervals', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      expect(logic.currentFrameIndex.value).toBe(0)

      // Act: Start Playback via togglePlay
      logic.togglePlay()
      expect(logic.isPlaying.value).toBe(true)

      // Advance time (fps: 12 -> interval ~83.3ms)
      vi.advanceTimersByTime(100)
      expect(logic.currentFrameIndex.value).toBe(1)

      // Act: Stop Playback via stopPlayback atau togglePlay
      logic.stopPlayback()
      expect(logic.isPlaying.value).toBe(false)
    })

    it('clears timeline after user confirmation', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      mockConfirm.mockResolvedValueOnce(true)

      // Act
      await logic.clearTimeline()

      // Assert
      expect(logic.frames.value.length).toBe(0)
      expect(logic.currentFrameIndex.value).toBe(0)
    })
  })

  describe('Properties Data Binding', () => {
    it('binds and updates clip property with double-way setter integration', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      const fpsBinding = logic.bindClipProp('fps', 12)

      // Act
      fpsBinding.value = 24

      // Assert
      expect(logic.activeClipData.value.fps).toBe(24)

      // Act: Undo via history
      logic.undo()
      expect(logic.activeClipData.value.fps).toBe(12)
    })
  })

  describe('[Bad Path] Error Handling & Edge Cases', () => {
    it('[Bad Path] handles asset texture URL resolution failure gracefully', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(assetStore, 'getAssetUrlById').mockRejectedValueOnce(new Error('OPFS Read Error'))

      // Act: Trigger asset URL watcher
      logic.activeClipData.value.assetId = 'invalid_asset_id'
      await vi.dynamicImportSettled()

      // Assert
      expect(logic.resolvedAssetUrl.value).toBe('')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('[Bad Path] does not execute node actions when active entity is null', () => {
      // Arrange
      const logic = useAnimatorLogic()
      sceneStore.activeScene.entities = [] // Kosongkan entity

      // Act
      logic.createCategory()
      logic.createClip(null)
      logic.deleteNode('some_id')

      // Assert
      expect(logic.activeEntityId.value).toBeUndefined()
      expect(logic.realClipsData.value).toEqual([])
    })

    it('[Bad Path] rejects auto fill if max width input is invalid or cancelled', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      // Asset tanpa dimensions dan prompt dibatalkan
      logic.activeClipData.value.assetId = null
      mockPrompt.mockResolvedValueOnce(null)

      const initialFrameCount = logic.frames.value.length

      // Act
      await logic.autoFill()

      // Assert: Frame tidak bertambah
      expect(logic.frames.value.length).toBe(initialFrameCount)
    })
  })
})