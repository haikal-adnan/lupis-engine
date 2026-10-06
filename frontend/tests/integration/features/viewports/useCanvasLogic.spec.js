import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasLogic } from '@viewports/viewports.js'
import { useSceneStore } from '@scenes/scenes.js'
import { 
  createMockEntity, 
  createMockLayer, 
  setupMockSceneEnvironment 
} from '@tests/helper/projectMockHelper.js'

let canvasLogicHistoryRecords = []

const mockPrompt = vi.fn().mockResolvedValue('My_Prefab')
const mockPaste = vi.fn().mockResolvedValue(['pasted_1'])

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: vi.fn()
  }),
  usePrompt: () => ({
    prompt: mockPrompt
  }),
  useClipboard: () => ({
    paste: mockPaste
  })
}))

vi.mock('@historys/historys.js', () => ({
  useHistory: () => ({
    record: vi.fn((entry) => {
      canvasLogicHistoryRecords.push(entry)
    }),
    undo: vi.fn(),
    redo: vi.fn(),
    logHistory: vi.fn()
  }),
  useSceneHistory: () => ({
    recordAddLayer: vi.fn(),
    recordDeleteLayer: vi.fn(),
    recordLayerPropChange: vi.fn(),
    recordReorderLayer: vi.fn(),
    recordEntityCreate: vi.fn(),
    recordEntityDelete: vi.fn(),
    recordEntityMove: vi.fn(),
    recordPropChange: vi.fn(),
    recordAddComponent: vi.fn(),
    recordRemoveComponent: vi.fn(),
    recordComponentChange: vi.fn()
  })
}))

vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    updateComponentProp: vi.fn(),
    removeComponent: vi.fn(),
    getCameraPosition: vi.fn().mockReturnValue({ x: 0, y: 0 })
  }
}))

const mockCreatePrefab = vi.fn().mockResolvedValue({ id: 'prefab_99', name: 'My_Prefab' })
const mockLinkPrefabToEntities = vi.fn().mockResolvedValue(true)

vi.mock('@prefabs/prefabs.js', () => ({
  usePrefabActions: () => ({
    createPrefab: mockCreatePrefab,
    linkPrefabToEntities: mockLinkPrefabToEntities
  }),
  usePrefabStore: () => ({
    prefabs: [],
    getPrefabById: vi.fn()
  })
}))

describe('Integrasi Canvas Logic', () => {
  let sceneStore

  beforeEach(() => {
    setActivePinia(createPinia())
    sceneStore = useSceneStore()
    canvasLogicHistoryRecords = []
    
    mockPrompt.mockReset().mockResolvedValue('My_Prefab')
    mockPaste.mockReset().mockResolvedValue(['pasted_1'])
    mockCreatePrefab.mockClear()
    mockLinkPrefabToEntities.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Integrasi Pembuatan dan Manipulasi Entitas', () => {
    it('membuat entitas baru pada posisi tertentu dan mencatat perintah undo/redo', () => {
      const layer = createMockLayer({ id: 'layer_world_1' })
      setupMockSceneEnvironment({ layersWorld: [layer] })
      const { createEntityAtPosition } = useCanvasLogic()

      canvasLogicHistoryRecords = []

      createEntityAtPosition('sprite', 'layer_world_1', 100, 200)

      expect(sceneStore.activeEntities.length).toBe(1)
      const createdEntity = sceneStore.activeEntities[0]
      expect(createdEntity.components.Transform.x).toBe(100)
      expect(createdEntity.components.Transform.y).toBe(200)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(sceneStore.activeEntities.length).toBe(0)

      customHistory.redo()
      expect(sceneStore.activeEntities.length).toBe(1)
    })

    it('mengubah zIndex saat bringToFront dipanggil dan mendukung reversal undo/redo', () => {
      const entity = createMockEntity({ id: 'ent_1', zIndex: 0 })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { bringToFront } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      bringToFront()

      const targetEnt = sceneStore.activeEntities.find(e => e.id === 'ent_1')
      expect(targetEnt.zIndex).toBe(1)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(targetEnt.zIndex).toBe(0)

      customHistory.redo()
      expect(targetEnt.zIndex).toBe(1)
    })

    it('mengubah zIndex saat sendToBack dipanggil dan mendukung reversal undo/redo', () => {
      const entity = createMockEntity({ id: 'ent_1', zIndex: 5 })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { sendToBack } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      sendToBack()

      const targetEnt = sceneStore.activeEntities.find(e => e.id === 'ent_1')
      expect(targetEnt.zIndex).toBe(4)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(targetEnt.zIndex).toBe(5)
    })

    it('mengubah status kunci (_editor.locked) beberapa entitas saat toggleLock dipanggil', () => {
      const entityA = createMockEntity({ id: 'ent_a', _editor: { locked: false } })
      const entityB = createMockEntity({ id: 'ent_b', _editor: { locked: true } })
      setupMockSceneEnvironment({ entities: [entityA, entityB] })
      sceneStore.selectedEntityIds = ['ent_a', 'ent_b']

      const { toggleLock } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      toggleLock()

      const updatedA = sceneStore.activeEntities.find(e => e.id === 'ent_a')
      const updatedB = sceneStore.activeEntities.find(e => e.id === 'ent_b')

      expect(updatedA._editor.locked).toBe(true)
      expect(updatedB._editor.locked).toBe(false)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(updatedA._editor.locked).toBe(false)
      expect(updatedB._editor.locked).toBe(true)
    })

    it('mengubah visibilitas entitas terpilih saat toggleHidden dipanggil', () => {
      const entity = createMockEntity({ id: 'ent_1', visible: true })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { toggleHidden } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      toggleHidden()

      const targetEnt = sceneStore.activeEntities.find(e => e.id === 'ent_1')
      expect(targetEnt.visible).toBe(false)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(targetEnt.visible).toBe(true)
    })

    it('mengubah status aktif entitas terpilih saat toggleInactive dipanggil', () => {
      const entity = createMockEntity({ id: 'ent_1', active: true })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      const { toggleInactive } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      toggleInactive()

      const targetEnt = sceneStore.activeEntities.find(e => e.id === 'ent_1')
      expect(targetEnt.active).toBe(false)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(targetEnt.active).toBe(true)
    })

    it('menghapus entitas terpilih saat deleteEntity dipanggil', () => {
      const entity = createMockEntity({ id: 'ent_del', name: 'To Delete' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_del']

      const { deleteEntity } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      deleteEntity()

      expect(sceneStore.activeEntities.length).toBe(0)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(sceneStore.activeEntities.length).toBe(1)
      expect(sceneStore.activeEntities[0].id).toBe('ent_del')
    })

    it('menduplikasi entitas terpilih saat duplicateEntity dipanggil', () => {
      const entity = createMockEntity({ id: 'ent_src', name: 'Source' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_src']

      const { duplicateEntity } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      duplicateEntity()

      expect(sceneStore.activeEntities.length).toBe(2)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(sceneStore.activeEntities.length).toBe(1)
      expect(sceneStore.activeEntities[0].id).toBe('ent_src')
    })
  })

  describe('Integrasi Penempelan Paste at Position', () => {
    it('menghitung offset posisi dan memindahkan entitas yang ditempel ke target koordinat', async () => {
      const entity = createMockEntity({
        id: 'pasted_1',
        entityType: 'sprite',
        x: 0,
        y: 0
      })

      setupMockSceneEnvironment({ entities: [entity] })
      mockPaste.mockResolvedValue(['pasted_1'])

      const { pasteAtPosition } = useCanvasLogic()
      canvasLogicHistoryRecords = []

      await pasteAtPosition(200, 300)

      const targetEntity = sceneStore.activeEntities.find(e => e.id === 'pasted_1')

      expect(targetEntity).toBeDefined()
      expect(targetEntity.components.Transform.x).toBe(200)
      expect(targetEntity.components.Transform.y).toBe(300)

      expect(canvasLogicHistoryRecords.length).toBe(1)
      const customHistory = canvasLogicHistoryRecords[0]

      customHistory.undo()
      expect(targetEntity.components.Transform.x).toBe(0)
      expect(targetEntity.components.Transform.y).toBe(0)

      customHistory.redo()
      expect(targetEntity.components.Transform.x).toBe(200)
      expect(targetEntity.components.Transform.y).toBe(300)
    })
  })

  describe('Integrasi Pembuatan Prefab', () => {
    it('meminta nama prefab dan menghubungkan entitas dengan prefab yang baru dibuat', async () => {
      const entity = createMockEntity({ id: 'ent_prefab', name: 'Player', type: 'entity' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_prefab']

      const { useAsPrefab } = useCanvasLogic()

      await useAsPrefab()

      expect(mockCreatePrefab).toHaveBeenCalledWith(
        'My_Prefab',
        null,
        'entity',
        expect.objectContaining({ id: 'ent_prefab' })
      )
      expect(mockLinkPrefabToEntities).toHaveBeenCalledWith('prefab_99', ['ent_prefab'])
    })
  })

  describe('Pengujian Skenario Buruk [Bad Path]', () => {
    it('[Bad Path] tidak melakukan perubahan jika tidak ada entitas yang dipilih pada bringToFront', () => {
      setupMockSceneEnvironment()
      sceneStore.selectedEntityIds = []

      canvasLogicHistoryRecords = []
      const { bringToFront } = useCanvasLogic()

      bringToFront()

      expect(canvasLogicHistoryRecords.length).toBe(0)
    })

    it('[Bad Path] menghentikan proses pasteAtPosition jika clipboard kosong atau tidak valid', async () => {
      setupMockSceneEnvironment()
      mockPaste.mockResolvedValue([])

      canvasLogicHistoryRecords = []
      const { pasteAtPosition } = useCanvasLogic()

      await pasteAtPosition(100, 100)

      expect(canvasLogicHistoryRecords.length).toBe(0)
    })

    it('[Bad Path] menghentikan proses useAsPrefab jika dialog prompt dibatalkan atau mengembalikan string kosong', async () => {
      const entity = createMockEntity({ id: 'ent_1' })
      setupMockSceneEnvironment({ entities: [entity] })
      sceneStore.selectedEntityIds = ['ent_1']

      mockPrompt.mockResolvedValue('')

      const { useAsPrefab } = useCanvasLogic()

      await useAsPrefab()

      expect(mockCreatePrefab).not.toHaveBeenCalled()
    })
  })
})