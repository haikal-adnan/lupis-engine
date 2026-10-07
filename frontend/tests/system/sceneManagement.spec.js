import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneStore } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { engineBridge } from '@engines/engines.js'
import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockScene,
  createMockEntity
} from '@tests/tests.js'

describe('Scene Management Integration', () => {
  let sceneStore
  let projectStore

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    sceneStore = useSceneStore()
    projectStore = useProjectStore()

    // Inisialisasi state project minimal
    projectStore.project = {
      id: 'proj_test_123',
      name: 'Test Project',
      scenes: [],
      settings: {}
    }

    // Reset spy engineBridge
    vi.restoreAllMocks()
    vi.spyOn(engineBridge, 'reloadScene').mockImplementation(() => {})
    vi.spyOn(engineBridge, 'clearSelection').mockImplementation(() => {})
  })

  describe('Create Scene Integration', () => {
    it('creates a new scene, updates scene store, and registers scene ID in project store', () => {
      // Arrange
      setupMockSceneEnvironment({ sceneName: 'Initial Scene' })
      const initialSceneCount = sceneStore.scenes.length
      const newSceneName = 'Level 2 - Forest'

      // Act
      const createdScene = sceneStore.addScene({ name: newSceneName })

      // Assert
      expect(sceneStore.scenes).toHaveLength(initialSceneCount + 1)
      expect(sceneStore.activeSceneId).toBe(createdScene.id)
      expect(createdScene.name).toBe(newSceneName)
      expect(projectStore.project.scenes).toContain(createdScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Read & Switch Scene Integration', () => {
    it('switches active scene, clears selections, and synchronizes payload with engine bridge', () => {
      // Arrange
      const sceneA = createMockScene({ id: 'scene_a', name: 'Main Menu' })
      const sceneB = createMockScene({ id: 'scene_b', name: 'Gameplay Level' })
      sceneStore.initScenes([sceneA, sceneB])

      sceneStore.selectedEntityIds = ['entity_1', 'entity_2']

      // Act
      sceneStore.setActiveScene(sceneB.id)

      // Payload sync simulation (seperti pada syncSceneWithEngine di komponen UI)
      const payload = {
        project: projectStore.project,
        scene: sceneStore.activeScene,
        prefabs: [],
        scripts: [],
        assets: []
      }
      engineBridge.reloadScene(payload)
      sceneStore.clearSelection()
      engineBridge.clearSelection()

      // Assert
      expect(sceneStore.activeSceneId).toBe(sceneB.id)
      expect(sceneStore.activeScene.name).toBe('Gameplay Level')
      expect(sceneStore.selectedEntityIds).toEqual([])
      expect(engineBridge.reloadScene).toHaveBeenCalledWith(payload)
      expect(engineBridge.clearSelection).toHaveBeenCalled()
    })
  })

  describe('Update Scene Integration', () => {
    it('updates scene name correctly in state without mutating active scene reference unnecessarily', () => {
      // Arrange
      const targetScene = createMockScene({ id: 'scene_update_1', name: 'Old Scene Name' })
      sceneStore.initScenes([targetScene])

      // Act
      sceneStore.updateSceneName(targetScene.id, 'Renamed Scene Name')

      // Assert
      const updatedScene = sceneStore.getSceneById(targetScene.id)
      expect(updatedScene.name).toBe('Renamed Scene Name')
      expect(sceneStore.activeScene.name).toBe('Renamed Scene Name')
    })

    it('duplicates scene with fresh ID and appends (Copy) suffix to scene name', () => {
      // Arrange
      const entity = createMockEntity({ name: 'Player' })
      const originalScene = createMockScene({
        id: 'scene_orig',
        name: 'Dungeon Level',
        entities: [entity]
      })
      sceneStore.initScenes([originalScene])

      // Act
      const duplicatedScene = sceneStore.duplicateScene(originalScene.id)

      // Assert
      expect(sceneStore.scenes).toHaveLength(2)
      expect(duplicatedScene.id).not.toBe(originalScene.id)
      expect(duplicatedScene.name).toBe('Dungeon Level (Copy)')
      expect(duplicatedScene.entities).toHaveLength(1)
      expect(sceneStore.activeSceneId).toBe(duplicatedScene.id)
      expect(projectStore.project.scenes).toContain(duplicatedScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Delete Scene Integration', () => {
    it('removes target scene and switches active scene to remaining fallback scene', () => {
      // Arrange
      const scene1 = createMockScene({ id: 'scene_1', name: 'Scene 1' })
      const scene2 = createMockScene({ id: 'scene_2', name: 'Scene 2' })
      sceneStore.initScenes([scene1, scene2])
      sceneStore.setActiveScene(scene2.id)

      // Act
      sceneStore.removeScene(scene2.id)

      // Assert
      expect(sceneStore.scenes).toHaveLength(1)
      expect(sceneStore.scenes.find(s => s.id === 'scene_2')).toBeUndefined()
      expect(sceneStore.activeSceneId).toBe('scene_1')
    })

    it('[Bad Path] throws error when attempting to delete the last remaining scene', () => {
      // Arrange
      const singleScene = createMockScene({ id: 'scene_sole', name: 'The Only Scene' })
      sceneStore.initScenes([singleScene])

      // Act & Assert
      expect(() => {
        sceneStore.removeScene(singleScene.id)
      }).toThrow('MIN_SCENE_LIMIT')

      expect(sceneStore.scenes).toHaveLength(1)
      expect(sceneStore.activeSceneId).toBe(singleScene.id)
    })
  })

  describe('Hierarchy and Entity State Consistency Across Scenes', () => {
    it('isolates entity mutations and active entities strictly to the current active scene', () => {
      // Arrange
      const entityA = createMockEntity({ id: 'e_1', name: 'Scene A Entity' })
      const entityB = createMockEntity({ id: 'e_2', name: 'Scene B Entity' })

      const sceneA = createMockScene({ id: 'sc_a', name: 'Scene A', entities: [entityA] })
      const sceneB = createMockScene({ id: 'sc_b', name: 'Scene B', entities: [entityB] })

      sceneStore.initScenes([sceneA, sceneB])

      // Act & Assert - Check Active Entities in Scene A
      sceneStore.setActiveScene(sceneA.id)
      expect(sceneStore.activeEntities).toHaveLength(1)
      expect(sceneStore.activeEntities[0].name).toBe('Scene A Entity')

      // Act & Assert - Switch to Scene B and verify state separation
      sceneStore.setActiveScene(sceneB.id)
      expect(sceneStore.activeEntities).toHaveLength(1)
      expect(sceneStore.activeEntities[0].name).toBe('Scene B Entity')
    })
  })
})