import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnimatorActions, entitySchema, layerSchema } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'

// Mock dependency eksternal sesuai batas sistem
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    patchComponent: vi.fn()
  }
}))

describe('Integrasi Animator Actions', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mempersiapkan mock state untuk sceneStore yang mengadopsi useAnimatorActions
    sceneStoreState = {
      activeScene: {
        id: 'scene_1',
        layersWorld: [
          layerSchema({ id: 'layer_world_1', name: 'World Root' })
        ],
        layersUI: [],
        entities: [
          entitySchema({
            id: 'ent_1',
            name: 'Animated Character',
            components: {
              SpriteAnimator: {
                currentClip: null,
                clips: [
                  {
                    id: 'cat_1',
                    name: 'Movement',
                    type: 'category',
                    parentId: null,
                    isOpen: true
                  },
                  {
                    id: 'clip_1',
                    name: 'Walk',
                    type: 'clip',
                    parentId: 'cat_1',
                    fps: 12,
                    isLooping: true,
                    frames: []
                  }
                ]
              }
            }
          })
        ]
      },
      // Stub method patchComponent yang dipanggil internal oleh _saveAnimatorClips
      patchComponent(entityId, componentName, updates) {
        const entity = this.activeScene?.entities.find(e => e.id === entityId)
        if (entity && entity.components[componentName]) {
          Object.assign(entity.components[componentName], updates)
        }
      },
      ...useAnimatorActions
    }
  })

  describe('Pembuatan Node Animator (animatorCreateCategory & animatorCreateClip)', () => {
    it('membuat kategori animator baru, menyimpan ke state store, dan memicu patchComponent ke engine bridge', () => {
      // Act
      sceneStoreState.animatorCreateCategory('ent_1')

      // Assert
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(animator.clips.length).toBe(3)

      const newCategory = animator.clips[2]
      expect(newCategory.name).toBe('New Category')
      expect(newCategory.type).toBe('category')
      expect(newCategory.parentId).toBeNull()

      expect(engineBridge.patchComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'SpriteAnimator',
        updates: { clips: animator.clips }
      })
    })

    it('membuat clip animator di bawah kategori yang ditentukan', () => {
      // Act
      sceneStoreState.animatorCreateClip('ent_1', 'cat_1')

      // Assert
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(animator.clips.length).toBe(3)

      const newClip = animator.clips[2]
      expect(newClip.name).toBe('New_Clip')
      expect(newClip.type).toBe('clip')
      expect(newClip.parentId).toBe('cat_1')
    })
  })

  describe('Penghapusan & Pengubahan Nama Node (animatorDeleteNode & animatorRenameNode)', () => {
    it('menghapus kategori animator beserta seluruh clip di bawahnya', () => {
      // Act
      const deletedNode = sceneStoreState.animatorDeleteNode('ent_1', 'cat_1')

      // Assert
      expect(deletedNode.id).toBe('cat_1')
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(animator.clips.length).toBe(0)

      expect(engineBridge.patchComponent).toHaveBeenCalled()
    })

    it('mengubah nama node animator jika nodeId ditemukan', () => {
      // Act
      sceneStoreState.animatorRenameNode('ent_1', 'clip_1', 'Run_Fast')

      // Assert
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      const clip = animator.clips.find(c => c.id === 'clip_1')
      expect(clip.name).toBe('Run_Fast')
    })

    it('[Bad Path] mengembalikan null saat menghapus nodeId yang tidak ada', () => {
      // Act
      const result = sceneStoreState.animatorDeleteNode('ent_1', 'non_existent_id')

      // Assert
      expect(result).toBeNull()
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(animator.clips.length).toBe(2)
    })
  })

  describe('Kloning & Tempel Node (animatorGetNodeClone & animatorPasteNode)', () => {
    it('mengambil paket klon kategori beserta seluruh anak-anaknya', () => {
      // Act
      const bundle = sceneStoreState.animatorGetNodeClone('ent_1', 'cat_1')

      // Assert
      expect(bundle).not.toBeNull()
      expect(bundle.node.id).toBe('cat_1')
      expect(bundle.children.length).toBe(1)
      expect(bundle.children[0].id).toBe('clip_1')
    })

    it('menempelkan paket klon kategori dan memperbarui ID anak-anaknya', () => {
      // Arrange
      const bundle = sceneStoreState.animatorGetNodeClone('ent_1', 'cat_1')

      // Act
      sceneStoreState.animatorPasteNode('ent_1', null, bundle)

      // Assert
      const animator = sceneStoreState.activeScene.entities[0].components.SpriteAnimator
      expect(animator.clips.length).toBe(4)

      const pastedCategory = animator.clips[2]
      const pastedClip = animator.clips[3]

      expect(pastedCategory.id).not.toBe('cat_1')
      expect(pastedClip.id).not.toBe('clip_1')
      expect(pastedClip.parentId).toBe(pastedCategory.id)
    })

    it('[Bad Path] mengembalikan array kosong atau null jika SpriteAnimator tidak ditemukan', () => {
      // Arrange
      sceneStoreState.activeScene.entities[0].components = {}

      // Act
      const clips = sceneStoreState._getAnimatorClips('ent_1')
      const clone = sceneStoreState.animatorGetNodeClone('ent_1', 'cat_1')

      // Assert
      expect(clips).toEqual([])
      expect(clone).toBeNull()
    })
  })
})