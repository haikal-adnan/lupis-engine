import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneActions } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

describe('Integrasi Scene Actions', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    // Mempersiapkan mock state untuk sceneStore yang mengadopsi useSceneActions
    sceneStoreState = {
      scenes: [],
      activeSceneId: null,
      selectedEntityIds: [],
      ...useSceneActions
    }
  })

  // Helper untuk memastikan mock project memiliki properti scenes yang valid
  const prepareProjectStore = async (projectName = 'Test Project') => {
    const projectStore = useProjectStore()
    const mockProject = await createMockEmptyProject({ projectName })
    
    projectStore.project = {
      scenes: [],
      ...mockProject
    }

    return projectStore
  }

  describe('Tambah Scene (addScene)', () => {
    it('menambahkan scene baru dan mendaftarkannya ke project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore('Game Proyek')

      // Act
      const newScene = sceneStoreState.addScene({ name: 'Level Utama' })

      // Assert
      expect(sceneStoreState.scenes.length).toBe(1)
      expect(sceneStoreState.scenes[0].name).toBe('Level Utama')
      expect(sceneStoreState.activeSceneId).toBe(newScene.id)
      expect(sceneStoreState.selectedEntityIds).toEqual([])

      // Sinkronisasi dengan Project Store
      expect(projectStore.project.scenes).toContain(newScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('[Bad Path] melemparkan TypeError ketika dipanggil tanpa active project', () => {
      // Arrange
      const projectStore = useProjectStore()
      projectStore.project = null

      // Act & Assert
      expect(() => {
        sceneStoreState.addScene({ name: 'Scene Tanpa Project' })
      }).toThrow(TypeError)
    })
  })

  describe('Duplikasi Scene (duplicateScene)', () => {
    it('Menduplikasi scene yang ada dan memperbarui id scene pada project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore()
      const initialScene = sceneStoreState.addScene({ name: 'Stage 1' })

      // Act
      const duplicatedScene = sceneStoreState.duplicateScene(initialScene.id)

      // Assert
      expect(sceneStoreState.scenes.length).toBe(2)
      expect(duplicatedScene.name).toBe('Stage 1 (Copy)')
      expect(duplicatedScene.id).not.toBe(initialScene.id)
      expect(sceneStoreState.activeSceneId).toBe(duplicatedScene.id)

      // Verifikasi integrasi ke Project Store
      expect(projectStore.project.scenes).toContain(duplicatedScene.id)
      expect(projectStore.project.scenes.length).toBe(2)
    })

    it('[Bad Path] mengembalikan null jika sceneId tidak ditemukan', async () => {
      // Arrange
      await prepareProjectStore()

      // Act
      const result = sceneStoreState.duplicateScene('non_existent_scene_id')

      // Assert
      expect(result).toBeNull()
      expect(sceneStoreState.scenes.length).toBe(0)
    })
  })

  describe('Hapus Scene (removeScene)', () => {
    it('menghapus scene dan mengalihkan activeSceneId ke scene sebelumnya', async () => {
      // Arrange
      await prepareProjectStore()

      const scene1 = sceneStoreState.addScene({ name: 'Scene 1' })
      const scene2 = sceneStoreState.addScene({ name: 'Scene 2' })

      // Act
      sceneStoreState.removeScene(scene2.id)

      // Assert
      expect(sceneStoreState.scenes.length).toBe(1)
      expect(sceneStoreState.scenes.find(s => s.id === scene2.id)).toBeUndefined()
      expect(sceneStoreState.activeSceneId).toBe(scene1.id)
    })

    it('[Bad Path] melempar error MIN_SCENE_LIMIT jika scene yang tersisa hanya satu', async () => {
      // Arrange
      await prepareProjectStore()
      const singleScene = sceneStoreState.addScene({ name: 'Last Scene' })

      // Act & Assert
      expect(() => {
        sceneStoreState.removeScene(singleScene.id)
      }).toThrow('MIN_SCENE_LIMIT')
      expect(sceneStoreState.scenes.length).toBe(1)
    })
  })

  describe('Pembaruan Nama Scene (updateSceneName)', () => {
    it('mengubah nama scene jika input nama valid', async () => {
      // Arrange
      await prepareProjectStore()
      const scene = sceneStoreState.addScene({ name: 'Old Name' })

      // Act
      sceneStoreState.updateSceneName(scene.id, 'New Name')

      // Assert
      expect(sceneStoreState.scenes[0].name).toBe('New Name')
    })

    it('[Bad Path] mengabaikan pembaruan nama jika string kosong atau hanya spasi', async () => {
      // Arrange
      await prepareProjectStore()
      const scene = sceneStoreState.addScene({ name: 'Original Name' })

      // Act
      sceneStoreState.updateSceneName(scene.id, '   ')

      // Assert
      expect(sceneStoreState.scenes[0].name).toBe('Original Name')
    })
  })
})