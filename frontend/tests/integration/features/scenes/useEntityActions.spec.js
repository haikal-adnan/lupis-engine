import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntityActions, entitySchema, layerSchema } from '@scenes/scenes.js'
import { engineBridge } from '@engines/engines.js'
import { usePopAlert, useConfirm } from '@composables/composables.js'
import { useSceneHistory } from '@historys/historys.js'

// Mock dependency eksternal sesuai batas sistem
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    getCameraPosition: vi.fn(() => ({ x: 100, y: 150 })),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn(),
    moveEntity: vi.fn(),
    updateEntityProp: vi.fn(),
    updateComponentProp: vi.fn(),
    removeComponent: vi.fn()
  }
}))

vi.mock('@composables/composables.js', () => {
  const showPopMock = vi.fn()
  const confirmMock = vi.fn().mockResolvedValue(true)
  return {
    usePopAlert: () => ({ showPop: showPopMock }),
    useConfirm: () => ({ confirm: confirmMock })
  }
})

vi.mock('@historys/historys.js', () => {
  const recordEntityCreateMock = vi.fn()
  const recordEntityDeleteMock = vi.fn()
  const recordPropChangeMock = vi.fn()
  const recordEntityMoveMock = vi.fn()
  const recordAddComponentMock = vi.fn()
  const recordRemoveComponentMock = vi.fn()

  return {
    useSceneHistory: () => ({
      recordEntityCreate: recordEntityCreateMock,
      recordEntityDelete: recordEntityDeleteMock,
      recordPropChange: recordPropChangeMock,
      recordEntityMove: recordEntityMoveMock,
      recordAddComponent: recordAddComponentMock,
      recordRemoveComponent: recordRemoveComponentMock
    })
  }
})

describe('Integrasi Entity Actions', () => {
  let sceneStoreState

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mempersiapkan mock state untuk sceneStore yang mengadopsi useEntityActions
    sceneStoreState = {
      selectedEntityIds: [],
      activeScene: {
        id: 'scene_1',
        layersWorld: [
          layerSchema({ id: 'layer_world_1', name: 'World Root' })
        ],
        layersUI: [
          layerSchema({ id: 'layer_ui_1', name: 'UI Root' })
        ],
        entities: [
          entitySchema({
            id: 'ent_1',
            scriptId: 'sprite_1',
            name: 'Player',
            layerId: 'layer_world_1',
            type: 'entity',
            x: 0,
            y: 0,
            components: {
              SpriteRenderer: { color: '#FFFFFF' }
            }
          })
        ]
      },
      ...useEntityActions
    }
  })

  describe('Pembuatan Entitas (createEntity)', () => {
    it('membuat entitas sprite baru berdasarkan posisi kamera, memperbarui store, dan mencatat ke history', () => {
      // Act
      const newEntity = sceneStoreState.createEntity('sprite')

      // Assert
      expect(sceneStoreState.activeScene.entities.length).toBe(2)
      expect(newEntity.name).toBe('Sprite 2')
      expect(newEntity.type).toBe('entity')
      expect(newEntity.layerId).toBe('layer_world_1')
      expect(newEntity.components.Transform.x).toBe(100)
      expect(newEntity.components.Transform.y).toBe(150)
      expect(sceneStoreState.selectedEntityIds).toEqual([newEntity.id])

      // Verification pada dependency eksternal
      expect(engineBridge.createEntity).toHaveBeenCalledWith(newEntity)
      expect(engineBridge.selectEntity).toHaveBeenCalledWith([newEntity.id])

      const { recordEntityCreate } = useSceneHistory()
      expect(recordEntityCreate).toHaveBeenCalledWith(newEntity)
    })

    it('membuat entitas UI dengan posisi overrides khusus dan menargetkan layer UI', () => {
      // Act
      const uiEntity = sceneStoreState.createEntity('ui_text', 'layer_ui_1', { x: 50, y: 50 })

      // Assert
      expect(uiEntity.type).toBe('ui')
      expect(uiEntity.layerId).toBe('layer_ui_1')
      expect(uiEntity.components.UITransform.x).toBe(50)
      expect(uiEntity.components.UITransform.y).toBe(50)
    })

    it('[Bad Path] mencegah pembuatan entitas anak jika parent berada di dalam instansi Prefab', () => {
      // Arrange
      const prefabParent = entitySchema({
        id: 'prefab_root',
        prefabId: 'prefab_123',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(prefabParent)

      // Act
      const result = sceneStoreState.createEntity('sprite', prefabParent)

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Tidak dapat menambahkan entitas baru ke dalam hierarki instansi Prefab'),
        type: 'warning'
      })
    })

    it('[Bad Path] mengembalikan false jika activeScene bernilai null', () => {
      // Arrange
      sceneStoreState.activeScene = null

      // Act
      const result = sceneStoreState.createEntity('sprite')

      // Assert
      expect(result).toBe(false)
      expect(engineBridge.createEntity).not.toHaveBeenCalled()
    })
  })

  describe('Duplikasi & Salin Entitas (duplicateEntity & pasteEntity)', () => {
    it('menduplikasi entitas beserta hirarki keturunan dengan ID baru', () => {
      // Arrange
      const childEntity = entitySchema({
        id: 'ent_child',
        parentId: 'ent_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(childEntity)

      // Act
      const newRootIds = sceneStoreState.duplicateEntity('ent_1')

      // Assert
      expect(newRootIds.length).toBe(1)
      expect(sceneStoreState.activeScene.entities.length).toBe(4) // 2 awal + 2 klon
      expect(engineBridge.createEntity).toHaveBeenCalled()
      expect(engineBridge.selectEntity).toHaveBeenCalledWith(newRootIds)

      const { recordEntityCreate } = useSceneHistory()
      expect(recordEntityCreate).toHaveBeenCalledTimes(2)
    })

    it('[Bad Path] mencegah duplikasi jika entitas merupakan bagian dari instansi Prefab', () => {
      // Arrange
      const prefabEntity = entitySchema({
        id: 'prefab_child',
        parentId: 'prefab_root',
        layerId: 'layer_world_1'
      })
      const prefabRoot = entitySchema({
        id: 'prefab_root',
        prefabId: 'pf_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(prefabRoot, prefabEntity)

      // Act
      const result = sceneStoreState.duplicateEntity('prefab_child')

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Tidak dapat memodifikasi, memindahkan, atau menghapus entitas di dalam instansi Prefab'),
        type: 'warning'
      })
    })
  })

  describe('Penghapusan Entitas (deleteEntity)', () => {
    it('menghapus entitas beserta seluruh anak-anaknya dari scene dan mereset seleksi', () => {
      // Arrange
      const childEntity = entitySchema({
        id: 'ent_child',
        parentId: 'ent_1',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(childEntity)
      sceneStoreState.selectedEntityIds = ['ent_1']

      // Act
      const success = sceneStoreState.deleteEntity('ent_1')

      // Assert
      expect(success).toBe(true)
      expect(sceneStoreState.activeScene.entities.length).toBe(0)
      expect(sceneStoreState.selectedEntityIds).toEqual([])

      expect(engineBridge.clearSelection).toHaveBeenCalled()
      expect(engineBridge.deleteEntity).toHaveBeenCalledWith('ent_1')

      const { recordEntityDelete } = useSceneHistory()
      expect(recordEntityDelete).toHaveBeenCalled()
    })
  })

  describe('Pemindahan Entitas (moveEntity)', () => {
    it('memindahkan entitas ke parent baru dan menyinkronkan urutan indeks ke engine bridge', () => {
      // Arrange
      const parent2 = entitySchema({
        id: 'ent_parent_2',
        layerId: 'layer_world_1'
      })
      sceneStoreState.activeScene.entities.push(parent2)

      const targetContext = {
        newParentId: 'ent_parent_2',
        newLayerId: 'layer_world_1',
        insertionType: 'inside',
        referenceId: null
      }

      // Act
      const success = sceneStoreState.moveEntity('ent_1', targetContext)

      // Assert
      expect(success).toBe(true)
      const movedEntity = sceneStoreState.activeScene.entities.find(e => e.id === 'ent_1')
      expect(movedEntity.parentId).toBe('ent_parent_2')

      expect(engineBridge.moveEntity).toHaveBeenCalledWith({
        draggedId: 'ent_1',
        newParentId: 'ent_parent_2',
        newLayerId: 'layer_world_1',
        insertionType: 'inside',
        referenceId: null
      })

      const { recordEntityMove } = useSceneHistory()
      expect(recordEntityMove).toHaveBeenCalled()
    })
  })

  describe('Manajemen Komponen (updateComponentProp, addComponent & removeComponent)', () => {
    it('memperbarui properti komponen dan menyesuaikan rasio tinggi ketika ratio locked aktif', () => {
      // Arrange
      const entity = sceneStoreState.activeScene.entities[0]
      entity.components.Transform = {
        width: 100,
        height: 50,
        isRatioLocked: true
      }

      // Act
      sceneStoreState.updateComponentProp('ent_1', 'Transform', 'width', 200)

      // Assert
      expect(entity.components.Transform.width).toBe(200)
      expect(entity.components.Transform.height).toBe(100) // Rasio 2:1 dijaga
      expect(engineBridge.updateComponentProp).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Transform',
        path: 'height',
        value: 100
      })
    })

    it('menambahkan komponen baru jika belum ada dan mencatat history', () => {
      // Act
      const result = sceneStoreState.addComponent('ent_1', 'Physics')

      // Assert
      expect(result.componentName).toBe('Physics')
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeDefined()

      const { recordAddComponent } = useSceneHistory()
      expect(recordAddComponent).toHaveBeenCalledWith('ent_1', 'Physics')
    })

    it('menghapus komponen setelah konfirmasi pengguna disetujui', async () => {
      // Arrange
      sceneStoreState.addComponent('ent_1', 'Physics', null, false)

      // Act
      const result = await sceneStoreState.removeComponent('ent_1', 'Physics', true)

      // Assert
      expect(result).toEqual({ entityId: 'ent_1', componentName: 'Physics' })
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeUndefined()

      const { confirm } = useConfirm()
      expect(confirm).toHaveBeenCalled()
      expect(engineBridge.removeComponent).toHaveBeenCalledWith({
        entityId: 'ent_1',
        componentName: 'Physics'
      })

      const { recordRemoveComponent } = useSceneHistory()
      expect(recordRemoveComponent).toHaveBeenCalled()
    })

    it('[Bad Path] membatalkan penghapusan komponen jika konfirmasi ditolak', async () => {
      // Arrange
      const { confirm } = useConfirm()
      vi.mocked(confirm).mockResolvedValueOnce(false)
      sceneStoreState.addComponent('ent_1', 'Physics', null, false)

      // Act
      const result = await sceneStoreState.removeComponent('ent_1', 'Physics', true)

      // Assert
      expect(result).toBe(false)
      expect(sceneStoreState.activeScene.entities[0].components.Physics).toBeDefined()
      expect(engineBridge.removeComponent).not.toHaveBeenCalled()
    })

    it('[Bad Path] mencegah penambahan komponen pada instansi Prefab', () => {
      // Arrange
      sceneStoreState.activeScene.entities[0].prefabId = 'pf_123'

      // Act
      const result = sceneStoreState.addComponent('ent_1', 'Physics')

      // Assert
      expect(result).toBe(false)
      const { showPop } = usePopAlert()
      expect(showPop).toHaveBeenCalledWith({
        title: 'Prefab Restriction',
        message: expect.stringContaining('Cannot add components to a Prefab instance'),
        type: 'warning'
      })
    })
  })
})