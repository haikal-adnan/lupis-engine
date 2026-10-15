import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneStore, sceneSchema, entitySchema, layerSchema } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock external dependencies
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    addLayer: vi.fn(),
    deleteLayer: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    getCameraPosition: vi.fn(() => ({ x: 0, y: 0 }))
  }
}))

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}))

vi.mock('@historys/historys.js', () => ({
  useSceneHistory: () => ({
    recordAddLayer: vi.fn(),
    recordDeleteLayer: vi.fn(),
    recordEntityCreate: vi.fn(),
    recordEntityDelete: vi.fn(),
    recordPropChange: vi.fn()
  })
}))

describe('Scene Store Integration', () => {
  let sceneStore

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()
    sceneStore = useSceneStore()
  })

  const prepareProjectStore = async () => {
    const projectStore = useProjectStore()
    const mockProject = await createMockEmptyProject({ projectName: 'Store Test Project' })
    projectStore.project = {
      scenes: [],
      ...mockProject
    }
    return projectStore
  }

  describe('Scene Initialization & Settings (initScenes, createDefaultScene, setActiveScene)', () => {
    it('initializes scenes list and sets activeSceneId automatically if not set', () => {
      // Arrange
      const rawScenes = [
        sceneSchema({ id: 'sc_1', name: 'Level 1' }),
        sceneSchema({ id: 'sc_2', name: 'Level 2' })
      ]

      // Act
      sceneStore.initScenes(rawScenes)

      // Assert
      expect(sceneStore.scenes.length).toBe(2)
      expect(sceneStore.activeSceneId).toBe('sc_1')
      expect(sceneStore.activeScene.name).toBe('Level 1')
    })

    it('creates a new default scene and sets it as active scene', () => {
      // Act
      const defaultScene = sceneStore.createDefaultScene()

      // Assert
      expect(sceneStore.scenes.length).toBe(1)
      expect(sceneStore.activeSceneId).toBe(defaultScene.id)
      expect(sceneStore.activeScene.name).toBe('Main Scene')
      expect(sceneStore.activeScene.layersWorld.length).toBe(1)
      expect(sceneStore.activeScene.layersUI.length).toBe(1)
    })

    it('changes activeSceneId and clears selectedEntityIds when switching scenes', () => {
      // Arrange
      sceneStore.initScenes([
        sceneSchema({ id: 'sc_1', name: 'Level 1' }),
        sceneSchema({ id: 'sc_2', name: 'Level 2' })
      ])
      sceneStore.selectedEntityIds = ['ent_1']

      // Act
      sceneStore.setActiveScene('sc_2')

      // Assert
      expect(sceneStore.activeSceneId).toBe('sc_2')
      expect(sceneStore.selectedEntityIds).toEqual([])
    })

    it('[Bad Path] ignores setActiveScene if sceneId is not found', () => {
      // Arrange
      sceneStore.initScenes([sceneSchema({ id: 'sc_1', name: 'Level 1' })])

      // Act
      sceneStore.setActiveScene('non_existent_id')

      // Assert
      expect(sceneStore.activeSceneId).toBe('sc_1')
    })
  })

  describe('Getters Evaluation (activeScene, sceneOptions, activeEntities, activeLayers)', () => {
    it('produces scene options, active entities, and merged layers with section tag', () => {
      // Arrange
      const scene = sceneSchema({
        id: 'sc_1',
        name: 'Stage 1',
        layersWorld: [layerSchema({ id: 'lw_1', name: 'World Layer' })],
        layersUI: [layerSchema({ id: 'lu_1', name: 'UI Layer' })],
        entities: [entitySchema({ id: 'ent_1', name: 'Player' })]
      })
      sceneStore.initScenes([scene])

      // Assert Getters
      expect(sceneStore.sceneOptions).toEqual([
        { label: 'Stage 1', value: 'sc_1' }
      ])
      expect(sceneStore.activeEntities.length).toBe(1)
      expect(sceneStore.activeEntities[0].id).toBe('ent_1')

      const layers = sceneStore.activeLayers
      expect(layers.length).toBe(2)
      expect(layers.find(l => l.id === 'lw_1')._section).toBe('world')
      expect(layers.find(l => l.id === 'lu_1')._section).toBe('ui')
    })

    it('[Bad Path] returns empty array for entity/layer getters if activeScene is undefined', () => {
      // Assert
      expect(sceneStore.activeScene).toBeUndefined()
      expect(sceneStore.activeEntities).toEqual([])
      expect(sceneStore.activeLayers).toEqual([])
    })
  })

  describe('Component Synchronization from Engine (syncComponentFromEngine & syncTransformFromEngine)', () => {
    beforeEach(() => {
      sceneStore.initScenes([
        sceneSchema({
          id: 'sc_1',
          entities: [
            entitySchema({
              id: 'ent_world',
              type: 'entity',
              components: {
                Transform: { x: 0, y: 0, width: 100, height: 100 }
              }
            }),
            entitySchema({
              id: 'ent_ui',
              type: 'ui',
              components: {
                UITransform: { x: 0, y: 0, width: 100, height: 100 }
              }
            })
          ]
        })
      ])
    })

    it('synchronizes world transform data from engine to store', () => {
      // Act
      sceneStore.syncTransformFromEngine('ent_world', { x: 120, y: 250 })

      // Assert
      const transform = sceneStore.activeEntities[0].components.Transform
      expect(transform.x).toBe(120)
      expect(transform.y).toBe(250)
      expect(transform.width).toBe(100) // Other properties preserved
    })

    it('synchronizes UI transform data from engine to store', () => {
      // Act
      sceneStore.syncTransformFromEngine('ent_ui', { x: 50, y: 80 })

      // Assert
      const uiTransform = sceneStore.activeEntities[1].components.UITransform
      expect(uiTransform.x).toBe(50)
      expect(uiTransform.y).toBe(80)
    })

    it('updates partial component using patchComponent', () => {
      // Arrange
      sceneStore.syncComponentFromEngine('ent_world', 'SpriteRenderer', { color: '#FF0000' })

      // Act
      sceneStore.patchComponent('ent_world', 'SpriteRenderer', { color: '#00FF00' })

      // Assert
      const sprite = sceneStore.activeEntities[0].components.SpriteRenderer
      expect(sprite.color).toBe('#00FF00')
    })
  })

  describe('Action Composition Integration with Project Store (useSceneActions via Store)', () => {
    it('adds scene via composed action and registers it in project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore()

      // Act
      const newScene = sceneStore.addScene({ name: 'New Level' })

      // Assert
      expect(sceneStore.scenes.length).toBe(1)
      expect(sceneStore.activeSceneId).toBe(newScene.id)
      expect(projectStore.project.scenes).toContain(newScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })
})