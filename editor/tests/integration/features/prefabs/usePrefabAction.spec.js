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

// Mock external modules
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
      scriptId: data.scriptId || 'Default',
      type: data.type || 'world',
      data: data.data || { components: {} },
      children: data.children || []
    })
  }
})

describe('Integration Test: PrefabActions', () => {
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

    // Populate scenes state properly so activeScene getter works
    sceneStore.initScenes([
      {
        id: 'scene-1',
        scriptId: 'Main_Scene',
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

  describe('Prefab Creation and Duplication Integration', () => {
    it('creates new prefab from entity data with its children and saves to OPFS', async () => {
      // Arrange
      sceneStore.activeScene.entities = [
        { id: 'ent-1', scriptId: 'ParentEntity', type: 'world', layerId: 'l1', orderIndex: 0, components: { Transform: { x: 10, y: 10 } } },
        { id: 'ent-2', parentId: 'ent-1', scriptId: 'ChildEntity', type: 'world', layerId: 'l1', orderIndex: 1, components: {} }
      ]

      // Act
      const created = await actions.createPrefab('Player Hero', null, 'world', sceneStore.activeScene.entities[0])

      // Assert
      expect(created.scriptId).toBe('Player_Hero')
      expect(created.folderId).toBe('folder-root')
      expect(prefabStore.prefabs).toHaveLength(1)
      expect(prefabStore.getPrefabById(created.id)).toBeDefined()
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))

      const { recordCreatePrefab } = useSceneHistory()
      expect(recordCreatePrefab).toHaveBeenCalledWith(created)
    })

    it('automatically defines unique name when prefab name is already in use', async () => {
      // Arrange
      await actions.createPrefab('Enemy')

      // Act
      const secondEnemy = await actions.createPrefab('Enemy')

      // Assert: Under getValidUniqueName logic, if "Enemy" exists, the next name is "Enemy_1"
      expect(secondEnemy.scriptId).toBe('Enemy_1')
      expect(prefabStore.prefabs).toHaveLength(2)
    })

    it('duplicates existing prefab and saves new copy', async () => {
      // Arrange
      const original = await actions.createPrefab('Collectible')

      // Act
      const duplicated = await actions.duplicatePrefab(original.id)

      // Assert: First duplicate name is "Collectible_copy"
      expect(duplicated).not.toBeNull()
      expect(duplicated.scriptId).toBe('Collectible_copy')
      expect(prefabStore.prefabs).toHaveLength(2)
    })
  })

  describe('Delete, Rename, and Update Management Integration', () => {
    it('deletes prefab from store and records undo history', async () => {
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

    it('renames prefab after confirmation via prompt dialog', async () => {
      // Arrange
      const prefab = await actions.createPrefab('OldName')
      mockPrompt.mockResolvedValue('New_Cool_Name')

      // Act
      await actions.renamePrefab(prefab.id)

      // Assert
      const updated = prefabStore.getPrefabById(prefab.id)
      expect(updated.scriptId).toBe('New_Cool_Name')

      const { recordRenamePrefab } = useSceneHistory()
      expect(recordRenamePrefab).toHaveBeenCalledWith(prefab.id, 'OldName', 'New_Cool_Name')
    })
  })

  describe('Instantiation & Engine Bridge Linking Integration', () => {
    it('instantiates prefab into scene and calls engine bridge', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Tree', null, 'world')
      prefab.data = {
        id: 'p-root',
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

    it('links multiple entities to prefab after dialog confirmation', async () => {
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

  describe('Apply to Master Prefab Integration', () => {
    it('updates master prefab based on scene instance and syncs other instances', async () => {
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

  describe('Boundary Cases and Bad Path Handling', () => {
    it('[Bad Path] ignores deletion process if prefab ID is not found in store', async () => {
      // Act
      const result = await actions.deletePrefab('non-existent-id')

      // Assert
      expect(result).toBe(false)
      expect(mockShowPop).not.toHaveBeenCalled()
    })

    it('[Bad Path] cancels entity linking if user declines confirmation', async () => {
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

    it('[Bad Path] makes no change if new name in renamePrefab is empty', async () => {
      // Arrange
      const prefab = await actions.createPrefab('Original')
      mockPrompt.mockResolvedValue('   ')

      // Act
      await actions.renamePrefab(prefab.id)

      // Assert
      expect(prefabStore.getPrefabById(prefab.id).scriptId).toBe('Original')
    })
  })
})