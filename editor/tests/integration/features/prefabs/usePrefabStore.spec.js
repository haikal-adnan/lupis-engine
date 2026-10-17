import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefabStore } from '@prefabs/prefabs.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

// Mock external supporting composable used by useOPFSActions
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

describe('Integration Test: PrefabStore', () => {
  let mockStoreRef
  let prefabStore
  let workspaceStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockStoreRef = setupMockOPFS()

    workspaceStore = useWorkspaceStore()
    prefabStore = usePrefabStore()

    // Initialize empty mock project
    const project = await createMockEmptyProject({
      projectName: 'Game Test Project',
      description: 'Project for prefab integration tests'
    })

    workspaceStore.setProjectId(project.id)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Prefab CRUD Operations Integration with OPFS and WorkspaceStore', () => {
    it('saves new prefab to state and writes .json file and metadata to OPFS', async () => {
      // Arrange
      const newPrefab = {
        id: 'prefab-001',
        scriptId: 'PlayerCharacter',
        type: 'character',
        folderId: 'root',
        data: { components: { Transform: { x: 10, y: 20 } } }
      }

      // Act
      await prefabStore.addPrefab(newPrefab)

      // Assert: Store State Changes
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(prefabStore.getPrefabById('prefab-001')).toBeDefined()

      // Assert: Verify specific prefab file write to OPFS
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-001.json`
      expect(mockStoreRef.store.has(prefabFilePath)).toBe(true)

      const prefabFileHandle = mockStoreRef.store.get(prefabFilePath)
      const fileData = await prefabFileHandle.getFile()
      const savedContent = JSON.parse(await fileData.text())

      expect(savedContent.id).toBe('prefab-001')
      expect(savedContent.scriptId).toBe('PlayerCharacter')
      expect(savedContent).not.toHaveProperty('projectId')
      expect(savedContent).not.toHaveProperty('folderId')

      // Assert: Verify metadata synchronization in prefabs.json in OPFS
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
          scriptId: 'PlayerCharacter',
          type: 'character'
        }
      ])
    })

    it('updates prefab properties in state and syncs changes to OPFS file', async () => {
      // Arrange
      const initialPrefab = {
        id: 'prefab-002',
        scriptId: 'Enemy',
        type: 'npc',
        folderId: 'folder-a',
        data: { components: { Health: { hp: 100 } } }
      }
      await prefabStore.addPrefab(initialPrefab)

      // Act
      await prefabStore.updatePrefab('prefab-002', { scriptId: 'SuperEnemy' })

      // Assert: Updated state
      const updatedPrefab = prefabStore.getPrefabById('prefab-002')
      expect(updatedPrefab.scriptId).toBe('SuperEnemy')

      // Assert: Updated file in OPFS
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-002.json`
      const prefabFileHandle = mockStoreRef.store.get(prefabFilePath)
      const fileData = await prefabFileHandle.getFile()
      const savedContent = JSON.parse(await fileData.text())

      expect(savedContent.scriptId).toBe('SuperEnemy')
    })

    it('moves prefab folder and resynchronizes prefabs.json metadata file', async () => {
      // Arrange
      const prefab = {
        id: 'prefab-003',
        scriptId: 'Coin',
        type: 'item',
        folderId: 'root'
      }
      await prefabStore.addPrefab(prefab)

      // Act
      await prefabStore.movePrefab('prefab-003', 'folder-items')

      // Assert: Updated state
      expect(prefabStore.getPrefabById('prefab-003').folderId).toBe('folder-items')

      // Assert: OPFS metadata reflects new folderId
      const projectId = workspaceStore.activeProjectId
      const metaFilePath = `root/lupis-engine/projects/${projectId}/workspaces/prefabs.json`
      const metaFileHandle = mockStoreRef.store.get(metaFilePath)
      const metaData = JSON.parse(await (await metaFileHandle.getFile()).text())

      expect(metaData[0].folderId).toBe('folder-items')
    })

    it('removes prefab file from OPFS and updates metadata file and store state', async () => {
      // Arrange
      const prefab = {
        id: 'prefab-004',
        scriptId: 'Obstacle',
        type: 'environment',
        folderId: 'root'
      }
      await prefabStore.addPrefab(prefab)
      const projectId = workspaceStore.activeProjectId
      const prefabFilePath = `root/lupis-engine/projects/${projectId}/prefabs/prefab-004.json`

      expect(mockStoreRef.store.has(prefabFilePath)).toBe(true)

      // Act
      await prefabStore.removePrefab('prefab-004')

      // Assert: State cleared
      expect(prefabStore.prefabs).toHaveLength(0)
      expect(prefabStore.getPrefabById('prefab-004')).toBeUndefined()

      // Assert: Individual file removed from OPFS
      expect(mockStoreRef.store.has(prefabFilePath)).toBe(false)

      // Assert: OPFS metadata becomes empty array
      const metaFilePath = `root/lupis-engine/projects/${projectId}/workspaces/prefabs.json`
      const metaFileHandle = mockStoreRef.store.get(metaFilePath)
      const metaData = JSON.parse(await (await metaFileHandle.getFile()).text())

      expect(metaData).toEqual([])
    })

    it('updates internal component properties on prefab state', () => {
      // Arrange
      const prefab = {
        id: 'prefab-005',
        scriptId: 'Hero',
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

  describe('Getters Integration', () => {
    it('returns formatted prefab list via getAllPrefabs getter', () => {
      // Arrange
      const list = [
        { id: 'p1', scriptId: 'Prefab 1', folderId: 'root', type: 'a' },
        { id: 'p2', scriptId: 'Prefab 2', folderId: 'f1', type: 'b' }
      ]
      prefabStore.initPrefabs(list)

      // Act
      const allPrefabs = prefabStore.getAllPrefabs

      // Assert
      expect(allPrefabs).toHaveLength(2)
      expect(allPrefabs[0]).toEqual({
        id: 'p1',
        scriptId: 'Prefab 1',
        folderId: 'root',
        thumbnailUrl: null,
        originalData: list[0]
      })
    })
  })

  describe('Boundary Cases and Bad Path Handling', () => {
    it('[Bad Path] ignores deletion if prefab ID is not found', async () => {
      // Arrange
      const prefab = { id: 'p-valid', scriptId: 'Valid', folderId: 'root' }
      await prefabStore.addPrefab(prefab)

      // Act
      await prefabStore.removePrefab('non-existent-id')

      // Assert
      expect(prefabStore.prefabs).toHaveLength(1)
    })

    it('[Bad Path] ignores component update if component name is unregistered', () => {
      // Arrange
      const prefab = {
        id: 'p-comp',
        scriptId: 'Test',
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