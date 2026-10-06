import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSceneStore, sceneSchema, entitySchema, layerSchema } from '@scenes/scenes.js'
import { useProjectStore } from '@projects/projects.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock dependency eksternal
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

describe('Integrasi Scene Store', () => {
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

  describe('Inisialisasi & Pengaturan Scene (initScenes, createDefaultScene, setActiveScene)', () => {
    it('menginisialisasi daftar scene dan menetapkan activeSceneId secara otomatis jika belum ada', () => {
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

    it('membuat default scene baru dan menjadikannya active scene', () => {
      // Act
      const defaultScene = sceneStore.createDefaultScene()

      // Assert
      expect(sceneStore.scenes.length).toBe(1)
      expect(sceneStore.activeSceneId).toBe(defaultScene.id)
      expect(sceneStore.activeScene.name).toBe('Main Scene')
      expect(sceneStore.activeScene.layersWorld.length).toBe(1)
      expect(sceneStore.activeScene.layersUI.length).toBe(1)
    })

    it('mengubah activeSceneId dan mengosongkan selectedEntityIds saat berpindah scene', () => {
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

    it('[Bad Path] mengabaikan setActiveScene jika sceneId tidak ditemukan', () => {
      // Arrange
      sceneStore.initScenes([sceneSchema({ id: 'sc_1', name: 'Level 1' })])

      // Act
      sceneStore.setActiveScene('non_existent_id')

      // Assert
      expect(sceneStore.activeSceneId).toBe('sc_1')
    })
  })

  describe('Getters Evaluasi (activeScene, sceneOptions, activeEntities, activeLayers)', () => {
    it('menghasilkan opsi pilihan scene, entitas aktif, dan gabungan layer dengan tag section', () => {
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

    it('[Bad Path] mengembalikan array kosong pada getters entitas/layer jika activeScene bernilai null', () => {
      // Assert
      expect(sceneStore.activeScene).toBeUndefined()
      expect(sceneStore.activeEntities).toEqual([])
      expect(sceneStore.activeLayers).toEqual([])
    })
  })

  describe('Sinkronisasi Komponen dari Engine (syncComponentFromEngine & syncTransformFromEngine)', () => {
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

    it('menyinkronkan data transform world dari engine ke store', () => {
      // Act
      sceneStore.syncTransformFromEngine('ent_world', { x: 120, y: 250 })

      // Assert
      const transform = sceneStore.activeEntities[0].components.Transform
      expect(transform.x).toBe(120)
      expect(transform.y).toBe(250)
      expect(transform.width).toBe(100) // Properti lain tidak tertimpa
    })

    it('menyinkronkan data transform UI dari engine ke store', () => {
      // Act
      sceneStore.syncTransformFromEngine('ent_ui', { x: 50, y: 80 })

      // Assert
      const uiTransform = sceneStore.activeEntities[1].components.UITransform
      expect(uiTransform.x).toBe(50)
      expect(uiTransform.y).toBe(80)
    })

    it('memperbarui komponen parsial menggunakan patchComponent', () => {
      // Arrange
      sceneStore.syncComponentFromEngine('ent_world', 'SpriteRenderer', { color: '#FF0000' })

      // Act
      sceneStore.patchComponent('ent_world', 'SpriteRenderer', { color: '#00FF00' })

      // Assert
      const sprite = sceneStore.activeEntities[0].components.SpriteRenderer
      expect(sprite.color).toBe('#00FF00')
    })
  })

  describe('Integrasi Action Komposisi dengan Project Store (useSceneActions via Store)', () => {
    it('menambahkan scene melalui action terkomposisi dan mendaftarkannya ke project store', async () => {
      // Arrange
      const projectStore = await prepareProjectStore()

      // Act
      const newScene = sceneStore.addScene({ name: 'Level Baru' })

      // Assert
      expect(sceneStore.scenes.length).toBe(1)
      expect(sceneStore.activeSceneId).toBe(newScene.id)
      expect(projectStore.project.scenes).toContain(newScene.id)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })
})