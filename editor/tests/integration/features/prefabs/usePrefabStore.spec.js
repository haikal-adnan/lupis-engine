import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock composable external pendukung yang digunakan oleh useOPFSActions
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: vi.fn()
  })
}))

vi.mock('@opfs/opfs.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useOPFSStore: () => ({
      isLoading: false,
      isSaving: false,
      setLoading: vi.fn(),
      setSaving: vi.fn(),
      setError: vi.fn()
    })
  }
})

describe('Integrasi PrefabStore', () => {
  let mockStoreRef
  let prefabStore
  let workspaceStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockStoreRef = setupMockOPFS()

    workspaceStore = useWorkspaceStore()
    prefabStore = usePrefabStore()

    // Inisialisasi mock project kosong
    const project = await createMockEmptyProject({
      projectName: 'Game Test Project',
      description: 'Proyek untuk pengujian integrasi prefab'
    })

    workspaceStore.setProjectId(project.id)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Integrasi Operasi CRUD Prefab dengan OPFS dan WorkspaceStore', () => {
    it('menyimpan prefab baru ke state dan menulis file .json beserta metadata ke OPFS', async () => {
      // Arrange
      const newPrefab = {
        id: 'prefab-001',
        name: 'PlayerCharacter',
        type: 'character',
        folderId: 'root',
        data: { components: { Transform: { x: 10, y: 20 } } }
      }

      // Act
      await prefabStore.addPrefab(newPrefab)

      // Assert: Perubahan State Store
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(prefabStore.getPrefabById('prefab-001')).toBeDefined()

      // Assert: Verifikasi penulisan file spesifik prefab ke OPFS
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-001.json`
      expect(mockStoreRef.store.has(prefabFilePath)).toBe(true)

      const prefabFileHandle = mockStoreRef.store.get(prefabFilePath)
      const fileData = await prefabFileHandle.getFile()
      const savedContent = JSON.parse(await fileData.text())

      expect(savedContent.id).toBe('prefab-001')
      expect(savedContent.name).toBe('PlayerCharacter')
      expect(savedContent).not.toHaveProperty('projectId')
      expect(savedContent).not.toHaveProperty('folderId')

      // Assert: Verifikasi sinkronisasi metadata prefabs.json di OPFS
      const metaFilePath = `root/lupis-engine/projects/${projectId}/workspaces/prefabs.json`
      expect(mockStoreRef.store.has(metaFilePath)).toBe(true)

      const metaFileHandle = mockStoreRef.store.get(metaFilePath)
      const metaFileData = await metaFileHandle.getFile()
      const savedMeta = JSON.parse(await metaFileData.text())

      expect(savedMeta).toEqual([
        {
          id: 'prefab-001',
          projectId: projectId,
          folderId: 'root',
          name: 'PlayerCharacter',
          type: 'character'
        }
      ])
    })

    it('memperbarui properti prefab di state dan menyinkronkan perubahan ke file OPFS', async () => {
      // Arrange
      const initialPrefab = {
        id: 'prefab-002',
        name: 'Enemy',
        type: 'npc',
        folderId: 'folder-a',
        data: { components: { Health: { hp: 100 } } }
      }
      await prefabStore.addPrefab(initialPrefab)

      // Act
      await prefabStore.updatePrefab('prefab-002', { name: 'SuperEnemy' })

      // Assert: State terbarui
      const updatedPrefab = prefabStore.getPrefabById('prefab-002')
      expect(updatedPrefab.name).toBe('SuperEnemy')

      // Assert: File di OPFS terbarui
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-002.json`
      const prefabFileHandle = mockStoreRef.store.get(prefabFilePath)
      const fileData = await prefabFileHandle.getFile()
      const savedContent = JSON.parse(await fileData.text())

      expect(savedContent.name).toBe('SuperEnemy')
    })

    it('memindahkan folder prefab dan menyinkronkan ulang file metadata prefabs.json', async () => {
      // Arrange
      const prefab = {
        id: 'prefab-003',
        name: 'Coin',
        type: 'item',
        folderId: 'root'
      }
      await prefabStore.addPrefab(prefab)

      // Act
      await prefabStore.movePrefab('prefab-003', 'folder-items')

      // Assert: State terbarui
      expect(prefabStore.getPrefabById('prefab-003').folderId).toBe('folder-items')

      // Assert: Metadata OPFS mencerminkan folderId baru
      const projectId = workspaceStore.activeProjectId
      const metaFilePath = `root/lupis-engine/projects/${projectId}/workspaces/prefabs.json`
      const metaFileHandle = mockStoreRef.store.get(metaFilePath)
      const metaData = JSON.parse(await (await metaFileHandle.getFile()).text())

      expect(metaData[0].folderId).toBe('folder-items')
    })

    it('menghapus file prefab dari OPFS dan memperbarui file metadata serta state store', async () => {
      // Arrange
      const prefab = {
        id: 'prefab-004',
        name: 'Obstacle',
        type: 'environment',
        folderId: 'root'
      }
      await prefabStore.addPrefab(prefab)
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-004.json`

      expect(mockStoreRef.store.has(prefabFilePath)).toBe(true)

      // Act
      await prefabStore.removePrefab('prefab-004')

      // Assert: State dibersihkan
      expect(prefabStore.prefabs).toHaveLength(0)
      expect(prefabStore.getPrefabById('prefab-004')).toBeUndefined()

      // Assert: File individu terhapus dari OPFS
      expect(mockStoreRef.store.has(prefabFilePath)).toBe(false)

      // Assert: Metadata OPFS menjadi array kosong
      const metaFilePath = `root/lupis-engine/projects/${projectId}/workspaces/prefabs.json`
      const metaFileHandle = mockStoreRef.store.get(metaFilePath)
      const metaData = JSON.parse(await (await metaFileHandle.getFile()).text())

      expect(metaData).toEqual([])
    })

    it('memperbarui properti komponen internal pada state prefab', () => {
      // Arrange
      const prefab = {
        id: 'prefab-005',
        name: 'Hero',
        folderId: 'root',
        data: {
          components: {
            Transform: { x: 0, y: 0 },
            Sprite: { visible: true }
          }
        }
      }
      prefabStore.initPrefabs([prefab])

      // Act
      prefabStore.updateComponentProp('prefab-005', 'Transform', 'x', 150)

      // Assert
      const updated = prefabStore.getPrefabById('prefab-005')
      expect(updated.data.components.Transform.x).toBe(150)
      expect(updated.data.components.Transform.y).toBe(0)
    })
  })

  describe('Integrasi Getters', () => {
    it('mengembalikan daftar prefab terformat melalui getter getAllPrefabs', () => {
      // Arrange
      const list = [
        { id: 'p1', name: 'Prefab 1', folderId: 'root', type: 'a' },
        { id: 'p2', name: 'Prefab 2', folderId: 'f1', type: 'b' }
      ]
      prefabStore.initPrefabs(list)

      // Act
      const allPrefabs = prefabStore.getAllPrefabs

      // Assert
      expect(allPrefabs).toHaveLength(2)
      expect(allPrefabs[0]).toEqual({
        id: 'p1',
        name: 'Prefab 1',
        folderId: 'root',
        thumbnailUrl: null,
        originalData: list[0]
      })
    })
  })

  describe('Penanganan Kasus Batas dan Jalur Buruk [Bad Path]', () => {
    it('[Bad Path] mengabaikan proses hapus jika prefab ID tidak ditemukan', async () => {
      // Arrange
      const prefab = { id: 'p-valid', name: 'Valid', folderId: 'root' }
      await prefabStore.addPrefab(prefab)

      // Act
      await prefabStore.removePrefab('non-existent-id')

      // Assert
      expect(prefabStore.prefabs).toHaveLength(1)
    })

    it('[Bad Path] mengabaikan pembaruan komponen jika nama komponen tidak terdaftar', () => {
      // Arrange
      const prefab = {
        id: 'p-comp',
        name: 'Test',
        data: { components: { Collider: { active: true } } }
      }
      prefabStore.initPrefabs([prefab])

      // Act
      prefabStore.updateComponentProp('p-comp', 'NonExistentComp', 'prop', 123)

      // Assert
      const currentPrefab = prefabStore.getPrefabById('p-comp')
      expect(currentPrefab.data.components.NonExistentComp).toBeUndefined()
    })
  })
})