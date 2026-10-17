import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneActions } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

describe('Scene Actions Integration', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    // Prepare mock state for sceneStore adopting useSceneActions
    sceneStoreState = {
      scenes: [],
      activeSceneId: null,
      selectedEntityIds: [],
      ...useSceneActions
    }
  })

  // Helper to ensure mock project has valid scenes property
  const prepareProjectStore = async (projectName = 'Test Project') => {
    const projectStore = useProjectStore()
    const mockProject = await createMockEmptyProject({ projectName })
    
    projectStore.project = {
      scenes: [],
      ...mockProject
    }

    return projectStore
  }

  describe('Add Scene (addScene)', () => {
    it('adds new scene and registers it in project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore('Game Project')

      // Act
      const newScene = sceneStoreState.addScene({ scriptId: 'Main_Level' })

      // Assert
      expect(sceneStoreState.scenes.length).toBe(1)
      expect(sceneStoreState.scenes[0].scriptId).toBe('Main_Level')
      expect(sceneStoreState.activeSceneId).toBe(newScene.id)
      expect(sceneStoreState.selectedEntityIds).toEqual([])

      // Sync with Project Store
      expect(projectStore.project.scenes).toContain(newScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('[Bad Path] throws TypeError when called without active project', () => {
      // Arrange
      const projectStore = useProjectStore()
      projectStore.project = null

      // Act & Assert
      expect(() => {
        sceneStoreState.addScene({ scriptId: 'Scene_Without_Project' })
      }).toThrow(TypeError)
    })
  })

  describe('Duplicate Scene (duplicateScene)', () => {
    it('duplicates existing scene and updates scene id in project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore()
      const initialScene = sceneStoreState.addScene({ scriptId: 'Stage_1' })

      // Act
      const duplicatedScene = sceneStoreState.duplicateScene(initialScene.id)

      // Assert
      expect(sceneStoreState.scenes.length).toBe(2)
      expect(duplicatedScene.scriptId).toBe('Stage_1_copy')
      expect(duplicatedScene.id).not.toBe(initialScene.id)
      expect(sceneStoreState.activeSceneId).toBe(duplicatedScene.id)

      // Verify integration into Project Store
      expect(projectStore.project.scenes).toContain(duplicatedScene.id)
      expect(projectStore.project.scenes.length).toBe(2)
    })

    it('[Bad Path] returns null if sceneId is not found', async () => {
      // Arrange
      await prepareProjectStore()

      // Act
      const result = sceneStoreState.duplicateScene('non_existent_scene_id')

      // Assert
      expect(result).toBeNull()
      expect(sceneStoreState.scenes.length).toBe(0)
    })
  })

  describe('Remove Scene (removeScene)', () => {
    it('removes scene and switches activeSceneId to previous scene', async () => {
      // Arrange
      await prepareProjectStore()

      const scene1 = sceneStoreState.addScene({ scriptId: 'Scene_1' })
      const scene2 = sceneStoreState.addScene({ scriptId: 'Scene_2' })

      // Act
      sceneStoreState.removeScene(scene2.id)

      // Assert
      expect(sceneStoreState.scenes.length).toBe(1)
      expect(sceneStoreState.scenes.find(s => s.id === scene2.id)).toBeUndefined()
      expect(sceneStoreState.activeSceneId).toBe(scene1.id)
    })

    it('[Bad Path] throws MIN_SCENE_LIMIT error if only one scene remains', async () => {
      // Arrange
      await prepareProjectStore()
      const singleScene = sceneStoreState.addScene({ scriptId: 'Last_Scene' })

      // Act & Assert
      expect(() => {
        sceneStoreState.removeScene(singleScene.id)
      }).toThrow('MIN_SCENE_LIMIT')
      expect(sceneStoreState.scenes.length).toBe(1)
    })
  })

  describe('Update Scene ScriptId (updateSceneScriptId)', () => {
    it('updates scene scriptId when scriptId input is valid', async () => {
      // Arrange
      await prepareProjectStore()
      const scene = sceneStoreState.addScene({ scriptId: 'Old_Name' })

      // Act
      sceneStoreState.updateSceneScriptId(scene.id, 'New_Name')

      // Assert
      expect(sceneStoreState.scenes[0].scriptId).toBe('New_Name')
    })

    it('[Bad Path] ignores scriptId update if string is empty or whitespace only', async () => {
      // Arrange
      await prepareProjectStore()
      const scene = sceneStoreState.addScene({ scriptId: 'Original_Name' })

      // Act
      sceneStoreState.updateSceneScriptId(scene.id, '   ')

      // Assert
      expect(sceneStoreState.scenes[0].scriptId).toBe('Original_Name')
    })
  })
})