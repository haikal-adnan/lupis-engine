import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// Import target modules langsung dari source file (tanpa barrel)
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useAssetStore } from '@assets/assets.js'
import { useAnimatorHistory } from '@historys/historys.js'
import { useAnimatorLogic, useAnimatorMenu } from '@animators/animators.js'

// Import helper mock project
import { 
  setupMockOPFS, 
  setupMockSceneEnvironment, 
  createMockEntity 
} from '@tests/tests.js'

// Mock composables UI dialog/alert eksternal
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn() })
}))

describe('Animator Panel System Integration Test', () => {
  let sceneStore
  let workspaceStore
  let assetStore
  let animatorHistory
  let entityId

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    workspaceStore = useWorkspaceStore()
    assetStore = useAssetStore()
    animatorHistory = useAnimatorHistory()

    // 1. Arrange Environment: Entity dengan komponen SpriteAnimator
    const entity = createMockEntity({
      name: 'Hero Player',
      entityType: 'sprite',
      attachComponents: {
        SpriteAnimator: {
          active: true,
          isPlaying: true,
          currentClip: null,
          clips: []
        }
      }
    })
    entityId = entity.id

    setupMockSceneEnvironment({
      entities: [entity],
      selectedEntityIds: [entityId]
    })

    // Buka tab animator di workspace agar logic aktif
    workspaceStore.openTab({
      id: entityId,
      name: 'Hero Player',
      type: 'animator',
      fixed: false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Category and Clip Hierarchy Operations', () => {
    it('creates category and nested clip correctly in scene store and history', () => {
      // Arrange
      const logic = useAnimatorLogic()

      // Act: Buat Kategori
      logic.createCategory(null)

      // Assert Kategori
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips.length).toBe(1)
      const createdCategory = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0]
      expect(createdCategory.type).toBe('category')
      expect(createdCategory.name).toBe('New Category')

      // Act: Buat Clip di dalam Kategori
      logic.createClip(createdCategory.id)

      // Assert Clip Child
      const clips = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips
      expect(clips.length).toBe(2)
      const createdClip = clips.find(c => c.type === 'clip')
      expect(createdClip).toBeDefined()
      expect(createdClip.parentId).toBe(createdCategory.id)

      // Assert Tree Visual Structural Mapping
      expect(logic.treeVisualData.value.length).toBe(1)
      expect(logic.treeVisualData.value[0]._uiChildren.length).toBe(1)
    })

    it('toggles category expansion state and synchronizes with scene store', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createCategory(null)
      const categoryId = logic.realClipsData.value[0].id

      // Act
      logic.toggleCategory(categoryId)

      // Assert
      const updatedCategory = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips.find(c => c.id === categoryId)
      expect(updatedCategory.isOpen).toBe(false)
    })

    it('deletes category and automatically cascades deletion to its child clips', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createCategory(null)
      const categoryId = logic.realClipsData.value[0].id
      logic.createClip(categoryId)
      expect(logic.realClipsData.value.length).toBe(2)

      // Act
      logic.deleteNode(categoryId)

      // Assert
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips.length).toBe(0)
      expect(logic.treeVisualData.value.length).toBe(0)
    })
  })

  describe('Clipboard Operations (Copy, Cut, Paste, Duplicate)', () => {
    it('copies a clip node to workspace clipboard and pastes it as a new node', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const originalClip = logic.realClipsData.value[0]

      // Act: Copy
      logic.copyNode(originalClip.id)

      // Assert Clipboard State
      expect(workspaceStore.hasClipboardData).toBe(true)
      expect(workspaceStore.clipboard.type).toBe('animator_node')
      expect(workspaceStore.clipboard.data.node.id).toBe(originalClip.id)

      // Act: Paste
      logic.pasteNode(null)

      // Assert
      const updatedClips = logic.realClipsData.value
      expect(updatedClips.length).toBe(2)
      expect(updatedClips[1].id).not.toBe(originalClip.id)
      expect(updatedClips[1].name).toBe(originalClip.name)
    })

    it('cuts a node and clears clipboard after paste operation', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const clipId = logic.realClipsData.value[0].id

      // Act: Cut
      logic.cutNode(clipId)

      // Assert Node Removed & Clipboard Populated
      expect(logic.realClipsData.value.length).toBe(0)
      expect(workspaceStore.clipboard.mode).toBe('cut')

      // Act: Paste
      logic.pasteNode(null)

      // Assert Node Restored & Clipboard Cleared
      expect(logic.realClipsData.value.length).toBe(1)
      expect(workspaceStore.clipboard.data).toBeNull()
    })

    it('duplicates a node directly within the entity animator clips', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const originalId = logic.realClipsData.value[0].id

      // Act
      logic.duplicateNode(originalId)

      // Assert
      expect(logic.realClipsData.value.length).toBe(2)
    })
  })

  describe('Timeline, Frames, and Sources Management', () => {
    beforeEach(() => {
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const clipId = logic.realClipsData.value[0].id
      logic.selectClip(clipId)
    })

    it('adds new frame and automatically computes source coordinates', () => {
      // Arrange
      const logic = useAnimatorLogic()

      // Act
      logic.addFrame()

      // Assert
      expect(logic.frames.value.length).toBe(1)
      const sourceId = logic.frames.value[0]
      expect(logic.sources.value[sourceId]).toBeDefined()
      expect(logic.sources.value[sourceId]).toEqual({ x: 0, y: 0, w: 32, h: 32 })
    })

    it('removes a frame from timeline and updates active frame index safely', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.addFrame()
      logic.addFrame()
      expect(logic.frames.value.length).toBe(2)

      // Act
      logic.removeFrame(0)

      // Assert
      expect(logic.frames.value.length).toBe(1)
      expect(logic.currentFrameIndex.value).toBe(0)
    })

    it('auto fills frames based on asset width dimension metadata', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      const mockAssetId = 'asset_spritesheet_1'

      // Inisialisasi asset langsung ke Pinia assetStore state agar getter getAssetById bekerja normal
      assetStore.initAssets([
        {
          id: mockAssetId,
          name: 'Hero Spritesheet',
          type: 'sprite',
          meta: { dimensions: { w: 128, h: 32 } }
        }
      ])

      logic.activeClipData.value.assetId = mockAssetId
      logic.activeClipData.value.baseSize = { w: 32, h: 32 }

      // Act
      await logic.autoFill()

      // Assert: 128px width / 32px baseSize.w = 4 frames
      expect(logic.frames.value.length).toBe(4)
      expect(Object.keys(logic.sources.value).length).toBe(4)
    })

    it('controls playback animation timer advancing current frame index', () => {
      // Arrange
      vi.useFakeTimers()
      const logic = useAnimatorLogic()
      logic.addFrame()
      logic.addFrame() // Total 2 frames
      expect(logic.currentFrameIndex.value).toBe(1)

      // Act: Toggle Playback (Start)
      logic.togglePlay()
      expect(logic.isPlaying.value).toBe(true)

      // Advance time by 1 frame interval (1000ms / 12fps = ~83.3ms)
      vi.advanceTimersByTime(100)

      // Assert: Advanced to frame index 0 (looped)
      expect(logic.currentFrameIndex.value).toBe(0)

      // Act: Stop Playback
      logic.togglePlay()
      expect(logic.isPlaying.value).toBe(false)
    })
  })

  describe('Property Two-Way Binding and History Integration', () => {
    it('binds clip property and records prop change into history stack', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const clipId = logic.realClipsData.value[0].id
      logic.selectClip(clipId)

      const fpsBinding = logic.bindClipProp('fps', 12)

      // Act
      fpsBinding.value = 24

      // Assert Reactive State
      expect(logic.activeClipData.value.fps).toBe(24)
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].fps).toBe(24)

      // Assert History Undo Capability
      logic.undo()
      expect(logic.activeClipData.value.fps).toBe(12)
    })
  })

  describe('Context Menu Integration (useAnimatorMenu)', () => {
    it('generates root context menu items when right-clicking empty space', () => {
      // Arrange
      const handlers = {
        hasClipboardData: ref(false),
        createCategory: vi.fn(),
        createClip: vi.fn(),
        pasteNode: vi.fn()
      }
      const menu = useAnimatorMenu(handlers)
      const dummyEvent = { clientX: 100, clientY: 200 }

      // Act
      menu.openMenu(dummyEvent, null)

      // Assert
      expect(menu.contextMenu.value.visible).toBe(true)
      expect(menu.contextMenu.value.x).toBe(100)
      expect(menu.contextMenu.value.y).toBe(200)
      
      const labels = menu.contextMenu.value.items.map(i => i.label).filter(Boolean)
      expect(labels).toContain('New Category')
      expect(labels).toContain('New Clip')
      expect(labels).toContain('Paste')
    })

    it('generates clip context menu items when right-clicking a clip node', () => {
      // Arrange
      const handlers = {
        hasClipboardData: ref(true),
        createClip: vi.fn(),
        renameNode: vi.fn(),
        duplicateNode: vi.fn(),
        copyNode: vi.fn(),
        cutNode: vi.fn(),
        pasteNode: vi.fn(),
        deleteNode: vi.fn()
      }
      const menu = useAnimatorMenu(handlers)
      const clipNode = { id: 'clip_1', type: 'clip', name: 'Idle' }

      // Act
      menu.openMenu({ clientX: 50, clientY: 50 }, clipNode)

      // Assert
      const labels = menu.contextMenu.value.items.map(i => i.label).filter(Boolean)
      expect(labels).toEqual([
        'New Clip', 'Rename', 'Duplicate', 'Copy', 'Cut', 'Paste Below', 'Delete Clip'
      ])
    })
  })

  describe('Negative Scenarios [Bad Path]', () => {
    it('[Bad Path] handles gracefully when operations run without active entity', () => {
      // Arrange: Deselect entity from scene
      sceneStore.selectedEntityIds = []
      workspaceStore.closeTab(entityId)
      
      const logic = useAnimatorLogic()

      // Act & Assert
      expect(() => {
        logic.createClip(null)
        logic.deleteNode('non_existent_id')
        logic.stepForward()
        logic.copyNode('non_existent_id')
      }).not.toThrow()

      expect(logic.activeEntityId.value).toBeUndefined()
    })

    it('[Bad Path] ignores drag and drop moveNode when dragging onto itself', () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const clipId = logic.realClipsData.value[0].id

      // Act
      logic.moveNode(clipId, clipId, 'inside')

      // Assert State Unchanged
      expect(logic.realClipsData.value.length).toBe(1)
    })

    it('[Bad Path] handles asset url resolution failure without throwing error', async () => {
      // Arrange
      const logic = useAnimatorLogic()
      logic.createClip(null)
      const clipId = logic.realClipsData.value[0].id
      logic.selectClip(clipId)

      assetStore.getAssetUrlById = vi.fn().mockRejectedValue(new Error('Asset missing'))

      // Act
      logic.activeClipData.value.assetId = 'invalid_asset_id'
      await vi.waitFor(() => {
        expect(assetStore.getAssetUrlById).toHaveBeenCalled()
      })

      // Assert
      expect(logic.resolvedAssetUrl.value).toBe('')
    })
  })
})