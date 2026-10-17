import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnimatorActions } from '@scenes/scenes.js' // Sesuaikan path alias ke useAnimatorActions
import { useSceneStore } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { setupMockSceneEnvironment, createMockEntity } from '@tests/tests.js'
import { GenerateUUID } from '@utils/utils.js'

// Mock engineBridge untuk memverifikasi sync ke runtime engine
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    patchComponent: vi.fn()
  }
}))

/**
 * Helper untuk membuat mock entity dengan SpriteAnimator
 */
function createMockEntityWithAnimator({
  entityId = `entity_${GenerateUUID().split('-')[0]}`,
  clipId = `clip_${GenerateUUID().split('-')[0]}`,
  catId = `cat_${GenerateUUID().split('-')[0]}`,
  ...overrides
} = {}) {
  const defaultCategory = {
    id: catId,
    scriptId: 'Locomotion',
    type: 'category',
    parentId: null,
    isOpen: true
  }

  const defaultClip = {
    id: clipId,
    scriptId: `clip_${clipId}`,
    type: 'clip',
    assetId: null,
    parentId: catId,
    fps: 12,
    isLooping: true,
    frames: ['s_0'],
    sources: { s_0: { x: 0, y: 0, w: 32, h: 32 } },
    baseSize: { w: 32, h: 32 },
    pivot: { x: 0.5, y: 1 },
    frameIndex: 0,
    filterMode: 'pixelated',
    useSDF: false
  }

  const entity = createMockEntity({
    id: entityId,
    scriptId: overrides.scriptId || 'TestEntity',
    attachComponents: {
      SpriteAnimator: {
        active: true,
        clips: overrides.clips || [defaultCategory, defaultClip]
      }
    }
  })

  return { entity, defaultCategory, defaultClip }
}

describe('useAnimatorActions Unit & Integration Tests', () => {
  let sceneStore
  let mockData

  beforeEach(() => {
    setActivePinia(createPinia())
    sceneStore = useSceneStore()

    mockData = createMockEntityWithAnimator()
    setupMockSceneEnvironment({ entities: [mockData.entity] })

    // Stub patchComponent pada store jika belum di-bind otomatis
    if (!sceneStore.patchComponent) {
      sceneStore.patchComponent = vi.fn((entityId, compName, updates) => {
        const ent = sceneStore.activeScene?.entities.find(e => e.id === entityId)
        if (ent?.components?.[compName]) {
          Object.assign(ent.components[compName], updates)
        }
      })
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Internal Helper Methods (_getAnimatorClips, _saveAnimatorClips, _cloneAnimatorNode)', () => {
    it('_getAnimatorClips returns array of clips for valid entity', () => {
      const clips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(clips).toHaveLength(2)
      expect(clips[0].id).toBe(mockData.defaultCategory.id)
    })

    it('_getAnimatorClips returns empty array if entity or animator is missing', () => {
      expect(sceneStore._getAnimatorClips('invalid_id')).toEqual([])
      
      const noAnimatorEntity = createMockEntity({ id: 'no_anim' })
      sceneStore.activeScene.entities.push(noAnimatorEntity)
      
      expect(sceneStore._getAnimatorClips('no_anim')).toEqual([])
    })

    it('_saveAnimatorClips strips _uiChildren and syncs with engineBridge', () => {
      const clipsWithUiChildren = [
        {
          ...mockData.defaultCategory,
          _uiChildren: [mockData.defaultClip]
        }
      ]

      sceneStore._saveAnimatorClips(mockData.entity.id, clipsWithUiChildren)

      const savedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(savedClips[0]._uiChildren).toBeUndefined()
      expect(engineBridge.patchComponent).toHaveBeenCalledWith({
        entityId: mockData.entity.id,
        componentName: 'SpriteAnimator',
        updates: { clips: [expect.not.objectContaining({ _uiChildren: expect.anything() })] }
      })
    })

    it('_cloneAnimatorNode generates a new ID and strips children properties', () => {
      const sourceNode = {
        ...mockData.defaultClip,
        children: [{ id: 'child_1' }],
        _uiChildren: [{ id: 'ui_child_1' }]
      }

      const cloned = sceneStore._cloneAnimatorNode(sourceNode)

      expect(cloned.id).toBeDefined()
      expect(cloned.id).not.toBe(sourceNode.id)
      expect(cloned.id.startsWith('anim_')).toBe(true)
      expect(cloned.children).toBeUndefined()
      expect(cloned._uiChildren).toBeUndefined()
      expect(cloned.scriptId).toBe(sourceNode.scriptId)
    })
  })

  describe('Category & Clip Creation (animatorCreateCategory, animatorCreateClip)', () => {
    it('animatorCreateCategory appends a new category node to entity clips', () => {
      const initialCount = sceneStore._getAnimatorClips(mockData.entity.id).length

      sceneStore.animatorCreateCategory(mockData.entity.id)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(updatedClips).toHaveLength(initialCount + 1)
      
      const newCategory = updatedClips[updatedClips.length - 1]
      expect(newCategory.type).toBe('category')
      expect(newCategory.scriptId).toBeDefined()
      expect(newCategory.parentId).toBeNull()
    })

    it('animatorCreateClip creates a clip under target category when target is a category', () => {
      sceneStore.animatorCreateClip(mockData.entity.id, mockData.defaultCategory.id)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      const newClip = updatedClips[updatedClips.length - 1]

      expect(newClip).toBeDefined()
      expect(newClip.parentId).toBe(mockData.defaultCategory.id)
      expect(newClip.type).toBe('clip')
    })

    it('animatorCreateClip creates a clip under same parent when target is another clip', () => {
      sceneStore.animatorCreateClip(mockData.entity.id, mockData.defaultClip.id)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      const newClip = updatedClips[updatedClips.length - 1]

      expect(newClip.scriptId).toBeDefined()
      expect(newClip.parentId).toBe(mockData.defaultClip.parentId)
    })

    it('animatorCreateClip creates a root clip when targetId is null', () => {
      sceneStore.animatorCreateClip(mockData.entity.id, null)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      const newClip = updatedClips[updatedClips.length - 1]

      expect(newClip.parentId).toBeNull()
    })
  })

  describe('Node Deletion & Renaming (animatorDeleteNode, animatorRenameNode)', () => {
    it('animatorDeleteNode removes single clip node and returns it', () => {
      const deleted = sceneStore.animatorDeleteNode(mockData.entity.id, mockData.defaultClip.id)

      expect(deleted.id).toBe(mockData.defaultClip.id)
      
      const remainingClips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(remainingClips.find(c => c.id === mockData.defaultClip.id)).toBeUndefined()
    })

    it('animatorDeleteNode removes category and cascades deletion to child clips', () => {
      // Menghapus category harus menghapus defaultClip juga karena defaultClip.parentId === category.id
      const deletedCategory = sceneStore.animatorDeleteNode(mockData.entity.id, mockData.defaultCategory.id)

      expect(deletedCategory.id).toBe(mockData.defaultCategory.id)

      const remainingClips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(remainingClips).toHaveLength(0)
    })

    it('animatorRenameNode updates node scriptId successfully', () => {
      sceneStore.animatorRenameNode(mockData.entity.id, mockData.defaultClip.id, 'Run_Animation')

      const clips = sceneStore._getAnimatorClips(mockData.entity.id)
      const target = clips.find(c => c.id === mockData.defaultClip.id)

      expect(target.scriptId).toBe('Run_Animation')
    })
  })

  describe('Node Cloning & Pasting (animatorGetNodeClone, animatorPasteNode)', () => {
    it('animatorGetNodeClone returns bundle with child clips for category node', () => {
      const bundle = sceneStore.animatorGetNodeClone(mockData.entity.id, mockData.defaultCategory.id)

      expect(bundle).not.toBeNull()
      expect(bundle.node.id).toBe(mockData.defaultCategory.id)
      expect(bundle.children).toHaveLength(1)
      expect(bundle.children[0].id).toBe(mockData.defaultClip.id)
    })

    it('animatorGetNodeClone returns bundle with empty children array for clip node', () => {
      const bundle = sceneStore.animatorGetNodeClone(mockData.entity.id, mockData.defaultClip.id)

      expect(bundle).not.toBeNull()
      expect(bundle.node.id).toBe(mockData.defaultClip.id)
      expect(bundle.children).toHaveLength(0)
    })

    it('animatorPasteNode pastes single clip node under target category', () => {
      const bundle = sceneStore.animatorGetNodeClone(mockData.entity.id, mockData.defaultClip.id)
      const initialCount = sceneStore._getAnimatorClips(mockData.entity.id).length

      sceneStore.animatorPasteNode(mockData.entity.id, mockData.defaultCategory.id, bundle)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      expect(updatedClips).toHaveLength(initialCount + 1)

      const pastedClip = updatedClips[updatedClips.length - 1]
      expect(pastedClip.id).not.toBe(mockData.defaultClip.id)
      expect(pastedClip.parentId).toBe(mockData.defaultCategory.id)
    })

    it('animatorPasteNode pastes category with its children at root level', () => {
      const categoryBundle = sceneStore.animatorGetNodeClone(mockData.entity.id, mockData.defaultCategory.id)
      const initialCount = sceneStore._getAnimatorClips(mockData.entity.id).length

      sceneStore.animatorPasteNode(mockData.entity.id, null, categoryBundle)

      const updatedClips = sceneStore._getAnimatorClips(mockData.entity.id)
      // Kategori + 1 anak disalin = +2 nodes total
      expect(updatedClips).toHaveLength(initialCount + 2)

      const pastedCategory = updatedClips.find(c => c.type === 'category' && c.id !== mockData.defaultCategory.id)
      expect(pastedCategory).toBeDefined()
      expect(pastedCategory.parentId).toBeNull()

      const pastedChildClip = updatedClips.find(c => c.type === 'clip' && c.parentId === pastedCategory.id)
      expect(pastedChildClip).toBeDefined()
    })
  })
})