import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefabStore, usePrefabActions } from '@prefabs/prefabs.js'
import { useSceneStore } from '@scenes/scenes.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useFolderStore } from '@folders/folders.js'
import { engineBridge } from '@engines/engines.js'
import { useSceneHistory } from '@historys/historys.js'
import { useConfirm, usePopAlert, usePrompt } from '@composables/composables.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock modul eksternal
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    linkEntitiesToPrefab: vi.fn(),
    createEntity: vi.fn(),
    selectEntity: vi.fn(),
    updateEntity: vi.fn(),
    getCameraPosition: vi.fn().mockReturnValue({ x: 100, y: 200 })
  }
}))

vi.mock('@historys/historys.js', () => ({
  useSceneHistory: vi.fn().mockReturnValue({
    recordCreatePrefab: vi.fn(),
    recordDeletePrefab: vi.fn(),
    recordRenamePrefab: vi.fn(),
    recordLinkPrefab: vi.fn(),
    recordInstantiatePrefab: vi.fn(),
    recordApplyMasterPrefab: vi.fn()
  })
}))

vi.mock('@composables/composables.js', () => ({
  useConfirm: vi.fn(),
  usePopAlert: vi.fn(),
  usePrompt: vi.fn()
}))

vi.mock('@prefabs/prefabs.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    prefabSchema: (data) => ({
      id: data.id || 'default-id',
      projectId: data.projectId || 'proj-1',
      folderId: data.folderId || 'root',
      name: data.name || 'Default',
      type: data.type || 'world',
      data: data.data || { components: {} },
      children: data.children || []
    })
  }
})

describe('Integrasi PrefabActions', () => {
  let actions
  let prefabStore
  let sceneStore
  let workspaceStore
  let folderStore
  let mockShowPop
  let mockConfirm
  let mockPrompt

  beforeEach(async () => {
    setActivePinia(createPinia())
    setupMockOPFS()

    mockShowPop = vi.fn()
    mockConfirm = vi.fn()
    mockPrompt = vi.fn()

    vi.mocked(usePopAlert).mockReturnValue({ showPop: mockShowPop })
    vi.mocked(useConfirm).mockReturnValue({ confirm: mockConfirm })
    vi.mocked(usePrompt).mockReturnValue({ prompt: mockPrompt })

    workspaceStore = useWorkspaceStore()
    prefabStore = usePrefabStore()
    sceneStore = useSceneStore()
    folderStore = useFolderStore()

    const project = await createMockEmptyProject({ projectName: 'Action Test Project' })
    workspaceStore.setProjectId(project.id)
    folderStore.activeFolderId = 'folder-root'

    // ✅ Mengisi state scenes dengan benar agar getter activeScene berfungsi
    sceneStore.initScenes([
      {
        id: 'scene-1',
        name: 'Main Scene',
        entities: [],
        layersWorld: [{ id: 'layer-world-1' }],
        layersUI: [{ id: 'layer-ui-1' }]
      }
    ])

    actions = usePrefabActions()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Integrasi Pembuatan dan Duplikasi Prefab', () => {
    it('membuat prefab baru dari data entity beserta anaknya dan menyimpannya ke OPFS', async () => {
      // Arrange: Set entities langsung di activeScene
      sceneStore.activeScene.entities = [
        { id: 'ent-1', name: 'ParentEntity', type: 'world', layerId: 'l1', orderIndex: 0, components: { Transform: { x: 10, y: 10 } } },
        { id: 'ent-2', parentId: 'ent-1', name: 'ChildEntity', type: 'world', layerId: 'l1', orderIndex: 1, components: {} }
      ]

      // Act
      const created = await actions.createPrefab('Player Hero', null, 'world', sceneStore.activeScene.entities[0])

      // Assert
      expect(created.name).toBe('Player_Hero')
      expect(created.folderId).toBe('folder-root')
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(prefabStore.getPrefabById(created.id)).toBeDefined()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))

      const { recordCreatePrefab } = useSceneHistory()
      expect(recordCreatePrefab).toHaveBeenCalledWith(created)
    })

    it('mendefinisikan nama unik otomatis saat nama prefab sudah digunakan', async () => {
      // Arrange
      await actions.createPrefab('Enemy')

      // Act
      const secondEnemy = await actions.createPrefab('Enemy')

      // Assert
      expect(secondEnemy.name).toBe('Enemy_1')
      expect(prefabStore.prefabs).toHaveLength(2)
    })

    it('Menduplikasi prefab yang ada dan menyimpan salinan baru', async () => {
      // Arrange
      const original = await actions.createPrefab('Collectible')

      // Act
      const duplicated = await actions.duplicatePrefab(original.id)

      // Assert
      expect(duplicated).not.toBeNull()
      expect(duplicated.name).toBe('Collectible_copy')
      expect(prefabStore.prefabs).toHaveLength(2)
    })
  })

  describe('Integrasi Manajemen Hapus, Ubah Nama, dan Update', () => {
    it('menghapus prefab dari store dan merekam riwayat undo', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Obstacle')

      // Act
      const result = await actions.deletePrefab(prefab.id)

      // Assert
      expect(result).toBe(true)
      expect(prefabStore.getPrefabById(prefab.id)).toBeUndefined()

      const { recordDeletePrefab } = useSceneHistory()
      expect(recordDeletePrefab).toHaveBeenCalled()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ title: 'Deleted' }))
    })

    it('mengubah nama prefab setelah dikonfirmasi via prompt dialog', async () => {
      // Arrange
      const prefab = await actions.createPrefab('OldName')
      mockPrompt.mockResolvedValue('New_Cool_Name')

      // Act
      await actions.renamePrefab(prefab.id)

      // Assert
      const updated = prefabStore.getPrefabById(prefab.id)
      expect(updated.name).toBe('New_Cool_Name')

      const { recordRenamePrefab } = useSceneHistory()
      expect(recordRenamePrefab).toHaveBeenCalledWith(prefab.id, 'OldName', 'New_Cool_Name')
    })
  })

  describe('Integrasi Instansiasi & Linking ke Engine Bridge', () => {
    it('menginstansiasi prefab ke dalam scene dan memanggil engine bridge', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Tree', null, 'world')
      prefab.data = {
        id: 'p-root',
        name: 'Tree',
        scriptId: 'Tree',
        type: 'world',
        components: { Transform: { x: 0, y: 0 } }
      }
      prefab.children = []

      // Act
      const instance = actions.instantiatePrefab(prefab.id, { x: 50, y: 75 })

      // Assert
      expect(instance.components.Transform.x).toBe(50)
      expect(instance.components.Transform.y).toBe(75)
      expect(sceneStore.activeScene.entities).toHaveLength(1)
      expect(engineBridge.createEntity).toHaveBeenCalled()
      expect(engineBridge.selectEntity).toHaveBeenCalledWith([instance.id])
    })

    it('menghubungkan (link) beberapa entity ke prefab setelah konfirmasi dialog', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Rock')
      prefab.data = { components: { Transform: { x: 0, y: 0 }, Render: { color: 'gray' } } }

      const entity1 = { id: 'e1', components: { Transform: { x: 10, y: 20 } } }
      const entity2 = { id: 'e2', components: { Transform: { x: 30, y: 40 } } }
      sceneStore.activeScene.entities = [entity1, entity2]

      mockConfirm.mockResolvedValue(true)

      // Act
      await actions.linkPrefabToEntities(prefab.id, ['e1', 'e2'])

      // Assert
      expect(entity1.prefabId).toBe(prefab.id)
      expect(entity1.components.Transform.x).toBe(10)
      expect(entity1.components.Render.color).toBe('gray')
      expect(engineBridge.linkEntitiesToPrefab).toHaveBeenCalled()
    })
  })

  describe('Integrasi Apply to Master Prefab', () => {
    it('memperbarui master prefab berdasarkan instance scene dan menyinkronkan instance lain', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Building')

      const rootEntity = {
        id: 'inst-1',
        prefabId: prefab.id,
        components: { Transform: { x: 0, y: 0, overridden: false } }
      }
      const otherRootEntity = {
        id: 'inst-2',
        prefabId: prefab.id,
        components: { Transform: { x: 100, y: 100, overridden: false } }
      }

      sceneStore.activeScene.entities = [rootEntity, otherRootEntity]
      mockConfirm.mockResolvedValue(true)

      // Act
      await actions.applyToMasterPrefab('inst-1')

      // Assert
      expect(engineBridge.updateEntity).toHaveBeenCalled()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ title: 'Master Updated' }))
    })
  })

  describe('Penanganan Kasus Batas dan Jalur Buruk [Bad Path]', () => {
    it('[Bad Path] mengabaikan proses hapus jika prefab ID tidak ditemukan di store', async () => {
      // Act
      const result = await actions.deletePrefab('non-existent-id')

      // Assert
      expect(result).toBe(false)
      expect(mockShowPop).not.toHaveBeenCalled()
    })

    it('[Bad Path] membatalkan penautan (link) entity jika pengguna menolak konfirmasi', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Fence')
      sceneStore.activeScene.entities = [
        { id: 'e1', components: { Transform: { x: 0, y: 0 } } },
        { id: 'e2', components: { Transform: { x: 5, y: 5 } } }
      ]
      mockConfirm.mockResolvedValue(false)

      // Act
      await actions.linkPrefabToEntities(prefab.id, ['e1', 'e2'])

      // Assert
      expect(engineBridge.linkEntitiesToPrefab).not.toHaveBeenCalled()
    })

    it('[Bad Path] tidak melakukan perubahan jika nama baru pada renamePrefab bernilai kosong', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Original')
      mockPrompt.mockResolvedValue('   ')

      // Act
      await actions.renamePrefab(prefab.id)

      // Assert
      expect(prefabStore.getPrefabById(prefab.id).name).toBe('Original')
    })
  })
})