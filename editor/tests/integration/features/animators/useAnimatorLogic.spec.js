import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useAnimatorLogic, useAnimatorMenu } from '@animators/animators.js'
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

    // Gunakan vi.spyOn untuk mengawasi dan meng-override aksi Pinia sceneStore
    vi.spyOn(sceneStore, '_saveAnimatorClips').mockImplementation((entityId, clips) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      if (ent?.components?.SpriteAnimator) ent.components.SpriteAnimator.clips = clips
    })

    vi.spyOn(sceneStore, 'animatorCreateCategory').mockImplementation((entityId, targetId) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      if (ent?.components?.SpriteAnimator) {
        ent.components.SpriteAnimator.clips.push({
          id: `cat_${Date.now()}`,
          name: 'New Category',
          type: 'category',
          parentId: targetId || null,
          isOpen: true
        })
      }
    })

    vi.spyOn(sceneStore, 'animatorCreateClip').mockImplementation((entityId, targetId) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      if (ent?.components?.SpriteAnimator) {
        ent.components.SpriteAnimator.clips.push({
          id: `clip_${Date.now()}`,
          name: 'New Clip',
          type: 'clip',
          parentId: targetId || null,
          fps: 12,
          frames: [],
          sources: {},
          baseSize: { w: 32, h: 32 }
        })
      }
    })

    vi.spyOn(sceneStore, 'animatorDeleteNode').mockImplementation((entityId, id) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      if (ent?.components?.SpriteAnimator) {
        const clips = ent.components.SpriteAnimator.clips
        const idx = clips.findIndex(c => c.id === id)
        if (idx !== -1) return clips.splice(idx, 1)[0]
      }
      return null
    })

    vi.spyOn(sceneStore, 'animatorGetNodeClone').mockImplementation((entityId, id) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      const node = ent?.components?.SpriteAnimator?.clips?.find(c => c.id === id)
      return node ? JSON.parse(JSON.stringify(node)) : null
    })

    vi.spyOn(sceneStore, 'animatorPasteNode').mockImplementation((entityId, targetId, nodeData) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      if (ent?.components?.SpriteAnimator) {
        const clone = JSON.parse(JSON.stringify(nodeData.node || nodeData))
        clone.id = `pasted_${Date.now()}`
        clone.parentId = targetId || null
        ent.components.SpriteAnimator.clips.push(clone)
      }
    })

    vi.spyOn(sceneStore, 'animatorRenameNode').mockImplementation((entityId, id, newName) => {
      const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
      const node = ent?.components?.SpriteAnimator?.clips?.find(c => c.id === id)
      if (node) node.name = newName
    })

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
      const logic = useAnimatorLogic()

      expect(logic.selectedEntity.value?.id).toBe(mockEntityData.entity.id)
      expect(logic.hasAnimator.value).toBe(true)
      expect(logic.activeEntityId.value).toBe(mockEntityData.entity.id)
    })

    it('closes animator tab automatically when active entity becomes a prefab or is removed', async () => {
      useAnimatorLogic()
      const closeTabSpy = vi.spyOn(workspaceStore, 'closeTab')

      const reactiveEntity = sceneStore.activeScene.entities.find(e => e.id === mockEntityData.entity.id)
      reactiveEntity.prefabId = 'prefab_123'

      await nextTick()

      expect(closeTabSpy).toHaveBeenCalledWith(mockEntityData.entity.id)
    })

    it('closes animator tab automatically when SpriteAnimator component is removed', async () => {
      useAnimatorLogic()
      const closeTabSpy = vi.spyOn(workspaceStore, 'closeTab')

      const reactiveEntity = sceneStore.activeScene.entities.find(e => e.id === mockEntityData.entity.id)
      delete reactiveEntity.components.SpriteAnimator

      await nextTick()

      expect(closeTabSpy).toHaveBeenCalledWith(mockEntityData.entity.id)
    })
  })

  describe('Tree Operations & Visual Hierarchy', () => {
    it('organizes categories and clips into treeVisualData structure', () => {
      const logic = useAnimatorLogic()
      logic.createCategory()
      const cat = logic.realClipsData.value.find(c => c.type === 'category')
      logic.createClip(cat.id)

      const tree = logic.treeVisualData.value
      const catInTree = tree.find(n => n.id === cat.id)

      expect(catInTree).toBeDefined()
      expect(catInTree._uiChildren).toHaveLength(1)
      expect(catInTree._uiChildren[0].name).toBe('New Clip')
    })

    it('toggles category open status and records history', () => {
      const logic = useAnimatorLogic()
      logic.createCategory()
      const cat = logic.realClipsData.value.find(c => c.type === 'category')

      logic.toggleCategory(cat.id)
      expect(logic.realClipsData.value.find(c => c.id === cat.id).isOpen).toBe(false)

      logic.undo()
      expect(logic.realClipsData.value.find(c => c.id === cat.id).isOpen).toBe(true)
    })

    it('duplicates node and pastes clone under the same target', () => {
      const logic = useAnimatorLogic()
      const initialLength = logic.realClipsData.value.length

      logic.duplicateNode(mockEntityData.defaultClip.id)

      expect(sceneStore.animatorGetNodeClone).toHaveBeenCalledWith(mockEntityData.entity.id, mockEntityData.defaultClip.id)
      expect(sceneStore.animatorPasteNode).toHaveBeenCalled()
      expect(logic.realClipsData.value.length).toBe(initialLength + 1)
    })

    it('moves node to root position in tree structure', () => {
      const logic = useAnimatorLogic()
      logic.createCategory()
      const cat = logic.realClipsData.value.find(c => c.type === 'category')
      logic.createClip(cat.id)

      const childClip = logic.realClipsData.value.find(c => c.parentId === cat.id)
      logic.moveNode(childClip.id, null, 'root')

      const movedClip = logic.realClipsData.value.find(c => c.id === childClip.id)
      expect(movedClip.parentId).toBeNull()
    })

    it('renames node through prompt dialog and notifies user upon success', async () => {
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id
      mockPrompt.mockResolvedValueOnce('Run_Loop')

      await logic.renameNode(clipId)

      const updatedClip = logic.realClipsData.value.find(c => c.id === clipId)
      expect(updatedClip.name).toBe('Run_Loop')
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })
  })

  describe('Clipboard Operations (Copy, Cut, Paste)', () => {
    it('copies node data into workspace clipboard', () => {
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id

      logic.copyNode(clipId)

      expect(workspaceStore.clipboard.type).toBe('animator_node')
      const copiedNode = workspaceStore.clipboard.data?.node || workspaceStore.clipboard.data
      expect(copiedNode?.id).toBe(clipId)
      expect(logic.hasClipboard.value).toBe(true)
    })

    it('cuts node to clipboard, removes it from scene, and clears clipboard after paste', () => {
      const logic = useAnimatorLogic()
      const clipId = mockEntityData.defaultClip.id

      logic.cutNode(clipId)
      expect(logic.realClipsData.value.find(c => c.id === clipId)).toBeUndefined()
      expect(workspaceStore.clipboard.mode).toBe('cut')

      logic.pasteNode(null)
      expect(logic.realClipsData.value.length).toBe(1)
      expect(workspaceStore.clipboard.type).toBeNull()
    })
  })

  describe('Timeline, Playback & Auto-Fill Integration', () => {
    it('adds new frame using last source dimensions and syncs scene data', () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      const initialFrameCount = logic.frames.value.length

      logic.addFrame()

      expect(logic.frames.value.length).toBe(initialFrameCount + 1)
      expect(logic.currentFrameIndex.value).toBe(initialFrameCount)
    })

    it('removes frame from timeline and updates current frame index', () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      logic.addFrame() // Total 3 frames (0, 1, 2)
      logic.currentFrameIndex.value = 2

      logic.removeFrame(2)

      expect(logic.frames.value.length).toBe(2)
      expect(logic.currentFrameIndex.value).toBe(1)
    })

    it('plays, steps forward, and steps backward playback properly', () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      logic.stepForward()
      expect(logic.currentFrameIndex.value).toBe(1)

      logic.stepBackward()
      expect(logic.currentFrameIndex.value).toBe(0)

      logic.togglePlay()
      expect(logic.isPlaying.value).toBe(true)

      vi.advanceTimersByTime(100)
      expect(logic.currentFrameIndex.value).toBe(1)

      logic.stopPlayback()
      expect(logic.isPlaying.value).toBe(false)
    })

    it('auto fills frames automatically using asset texture width', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      
      await logic.autoFill()

      expect(logic.frames.value.length).toBe(4)
    })

    it('clears timeline after user confirmation', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      mockConfirm.mockResolvedValueOnce(true)

      await logic.clearTimeline()

      expect(logic.frames.value.length).toBe(0)
      expect(logic.currentFrameIndex.value).toBe(0)
    })
  })

  describe('Source Management', () => {
    it('creates new source via prompt and updates frame source', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      mockPrompt.mockResolvedValueOnce('jump_01')

      await logic.handleCreateSource()

      expect(logic.sources.value['jump_01']).toBeDefined()
      expect(logic.frames.value[logic.currentFrameIndex.value]).toBe('jump_01')
    })

    it('deletes specific source and all sources upon confirmation', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      logic.handleDeleteSource('s_0')
      expect(logic.sources.value['s_0']).toBeUndefined()

      mockConfirm.mockResolvedValueOnce(true)
      await logic.deleteAllSources()
      expect(Object.keys(logic.sources.value)).toHaveLength(0)
    })
  })

  describe('Editor Navigation & Property Binding', () => {
    it('opens animator editor tab for active entity', () => {
      const logic = useAnimatorLogic()
      sceneStore.selectedEntityIds = [mockEntityData.entity.id]
      const openTabSpy = vi.spyOn(workspaceStore, 'openTab')

      logic.openAnimatorEditor()

      expect(openTabSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: mockEntityData.entity.id,
        type: 'animator'
      }))
    })

    it('binds clip property with getter and setter', () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)
      const fpsBinding = logic.bindClipProp('fps', 12)

      fpsBinding.value = 24

      expect(logic.activeClipData.value.fps).toBe(24)

      logic.undo()
      expect(logic.activeClipData.value.fps).toBe(12)
    })
  })

  describe('Edge Cases & Error Handling', () => {
    it('handles asset texture URL resolution failure gracefully', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.spyOn(assetStore, 'getAssetUrlById').mockRejectedValueOnce(new Error('OPFS Read Failure'))

      logic.activeClipData.value.assetId = 'invalid_asset_id'
      await nextTick()

      expect(logic.resolvedAssetUrl.value).toBe('')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('does not execute node actions when active entity is null', () => {
      const logic = useAnimatorLogic()
      sceneStore.activeScene.entities = []

      logic.createCategory()
      logic.createClip(null)
      logic.deleteNode('some_id')

      expect(logic.activeEntityId.value).toBeUndefined()
      expect(logic.realClipsData.value).toEqual([])
    })

    it('rejects auto fill if prompt input is cancelled or invalid', async () => {
      const logic = useAnimatorLogic()
      logic.selectClip(mockEntityData.defaultClip.id)

      logic.activeClipData.value.assetId = null
      mockPrompt.mockResolvedValueOnce(null)

      const initialFrameCount = logic.frames.value.length
      await logic.autoFill()

      expect(logic.frames.value.length).toBe(initialFrameCount)
    })
  })
})

describe('useAnimatorMenu Unit Tests', () => {
  it('opens root context menu when node is null', () => {
    const handlers = {
      createCategory: vi.fn(),
      createClip: vi.fn(),
      pasteNode: vi.fn(),
      hasClipboardData: { value: true }
    }
    const menu = useAnimatorMenu(handlers)

    menu.openMenu({ clientX: 100, clientY: 200 }, null)

    expect(menu.contextMenu.value.visible).toBe(true)
    expect(menu.contextMenu.value.x).toBe(100)
    expect(menu.contextMenu.value.y).toBe(200)
    expect(menu.contextMenu.value.items.some(i => i.label === 'New Category')).toBe(true)
  })

  it('opens category context menu and executes action', () => {
    const createClipMock = vi.fn()
    const handlers = { createClip: createClipMock }
    const menu = useAnimatorMenu(handlers)

    menu.openMenu({ clientX: 50, clientY: 50 }, { id: 'cat_1', type: 'category' })
    const addClipItem = menu.contextMenu.value.items.find(i => i.label === 'Add Clip')
    addClipItem.action()

    expect(createClipMock).toHaveBeenCalledWith('cat_1')
    expect(menu.contextMenu.value.visible).toBe(false)
  })
})