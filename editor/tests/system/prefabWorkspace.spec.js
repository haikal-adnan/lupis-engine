import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'
import { componentSchema, entitySchema } from '@scenes/scenes.js'
import * as PrefabModule from '@prefabs/prefabs.js'
import { useFolderStore, useFolderActions } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'

const { 
  usePrefabStore, 
  usePrefabActions, 
  usePrefabLogic, 
  usePrefabMenu,
  prefabSchema 
} = PrefabModule

// Mock external UI Alerts, Confirmations & Dialog Prompts composables
const mockPrompt = vi.fn()
const mockConfirm = vi.fn().mockResolvedValue(true)
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm })
}))

// Mock Engine Bridge for engine interaction
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    linkEntitiesToPrefab: vi.fn(),
    createEntity: vi.fn(),
    selectEntity: vi.fn(),
    updateEntity: vi.fn(),
    getCameraPosition: vi.fn().mockReturnValue({ x: 100, y: 200 })
  }
}))

// Mock URL API for jsdom/node environment
if (typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}
if (typeof window.URL.revokeObjectURL !== 'function') {
  window.URL.revokeObjectURL = vi.fn()
}

describe('PrefabWorkspace Integration Testing', () => {
  let storeRef
  let project

  beforeEach(async () => {
    setActivePinia(createPinia())
    storeRef = setupMockOPFS()
    project = await createMockEmptyProject({ projectName: 'Prefab Integration Test' })

    const workspaceStore = useWorkspaceStore()
    workspaceStore.activeProjectId = project.id

    // Setup initial active scene
    const sceneStore = useSceneStore()
    sceneStore.initScenes([{
      id: 'scene_default',
      name: 'Default Scene',
      layersWorld: [{ id: 'layer_world_1', name: 'World Layer', _section: 'world' }],
      layersUI: [{ id: 'layer_ui_1', name: 'UI Layer', _section: 'ui' }],
      entities: []
    }])
    sceneStore.setActiveScene('scene_default')

    mockPrompt.mockReset()
    mockConfirm.mockReset().mockResolvedValue(true)
    mockShowPop.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (storeRef?.store) {
      storeRef.store.clear()
    }
  })

  describe('Prefab CRUD Integration (World & UI)', () => {
    it('creates a new empty prefab and consolidates it to Store and OPFS', async () => {
      const { createPrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()

      const newPrefab = await createPrefab('Player_Prefab', null, 'world')

      expect(newPrefab).toBeDefined()
      expect(newPrefab.name).toBe('Player_Prefab')
      expect(newPrefab.type).toBe('world')
      expect(prefabStore.prefabs.some(p => p.id === newPrefab.id)).toBe(true)

      const prefabsMetaHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/workspaces/prefabs.json`)
      expect(prefabsMetaHandle).toBeDefined()

      const prefabFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/prefabs/${newPrefab.id}.json`)
      expect(prefabFileHandle).toBeDefined()
    })

    it('creates a new UI prefab and adapts its type and schema', async () => {
      const { createPrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()

      const uiPrefab = await createPrefab('Health_Bar', null, 'ui')

      expect(uiPrefab.type).toBe('ui')
      expect(prefabStore.getPrefabById(uiPrefab.id).type).toBe('ui')
    })

    it('renames prefab and updates file data in OPFS', async () => {
      const { createPrefab, renamePrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()

      const prefab = await createPrefab('Enemy_Base', null, 'world')
      mockPrompt.mockResolvedValue('Enemy_Boss')

      await renamePrefab(prefab.id)

      const updatedPrefab = prefabStore.getPrefabById(prefab.id)
      expect(updatedPrefab.name).toBe('Enemy_Boss')

      const prefabFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/prefabs/${prefab.id}.json`)
      const fileData = await prefabFileHandle.getFile()
      const content = JSON.parse(await fileData.text())
      expect(content.name).toBe('Enemy_Boss')
    })

    it('duplicates prefab and saves copy to OPFS with unique name', async () => {
      const { createPrefab, duplicatePrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()

      const original = await createPrefab('Coin', null, 'world')
      const duplicate = await duplicatePrefab(original.id)

      expect(duplicate).toBeDefined()
      expect(duplicate.id).not.toBe(original.id)
      expect(duplicate.name).toBe('Coin_copy')
      expect(prefabStore.prefabs.length).toBe(2)

      const duplicateFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/prefabs/${duplicate.id}.json`)
      expect(duplicateFileHandle).toBeDefined()
    })

    it('deletes prefab from store and cleans up physical file in OPFS', async () => {
      const logic = usePrefabLogic()
      const { createPrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()

      const prefab = await createPrefab('Obstacle', null, 'world')
      await logic.handleDelete({ id: prefab.id, isFolder: false })

      expect(prefabStore.getPrefabById(prefab.id)).toBeUndefined()
      const prefabFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/prefabs/${prefab.id}.json`)
      expect(prefabFileHandle).toBeUndefined()
    })

    it('[Bad Path] safely handles operations on invalid prefab ID', async () => {
      const prefabStore = usePrefabStore()
      const initialCount = prefabStore.prefabs.length

      prefabStore.removePrefab('invalid_prefab_id')

      expect(prefabStore.prefabs.length).toBe(initialCount)
    })
  })

  describe('Prefab Section Folder CRUD Integration', () => {
    it('creates new folder in prefabs-world section', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('Characters')
      await createNewFolder({ defaultName: 'New Folder', section: 'prefabs-world', parentId: null })

      const created = folderStore.folders.find(f => f.name === 'Characters')
      expect(created).toBeDefined()
      expect(created.section).toBe('prefabs-world')
      expect(created.parentId).toBeNull()
    })

    it('deletes folder along with references in folderStore', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder, deleteFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('Unused_Folder')
      await createNewFolder({ section: 'prefabs-world', parentId: null })
      const folder = folderStore.folders.find(f => f.name === 'Unused_Folder')

      await deleteFolder(folder.id)

      expect(folderStore.getFolderById(folder.id)).toBeUndefined()
    })
  })

  describe('Prefab Movement & Folder Navigation Integration', () => {
    it('moves prefab into target folder and filters visiblePrefabs', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const { createPrefab } = usePrefabActions()
      const logic = usePrefabLogic()

      const prefab = await createPrefab('Tree', null, 'world')

      mockPrompt.mockResolvedValue('Environment')
      await createNewFolder({ section: 'prefabs-world', parentId: null })
      const targetFolder = folderStore.folders.find(f => f.name === 'Environment')

      await logic.moveItem(prefab.id, 'prefab', targetFolder.id)

      expect(prefab.folderId).toBe(targetFolder.id)
      expect(logic.visiblePrefabs.value.some(p => p.id === prefab.id)).toBe(false)

      logic.navigateTo(targetFolder)

      expect(folderStore.activeFolderId).toBe(targetFolder.id)
      expect(logic.visiblePrefabs.value.some(p => p.id === prefab.id)).toBe(true)
    })

    it('breadcrumb navigation resets structural hierarchy to root folder', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const { createPrefab } = usePrefabActions()
      const logic = usePrefabLogic()

      mockPrompt.mockResolvedValue('Props')
      await createNewFolder({ section: 'prefabs-world', parentId: null })
      const folder = folderStore.folders.find(f => f.name === 'Props')

      folderStore.setActiveFolder(folder.id)
      const prefab = await createPrefab('Rock', folder.id, 'world')

      await logic.moveItem(prefab.id, 'prefab', null)

      expect(prefab.folderId).toBeNull()
      expect(logic.visiblePrefabs.value.some(p => p.id === prefab.id)).toBe(false)

      logic.navigateTo(null)
      expect(logic.visiblePrefabs.value.some(p => p.id === prefab.id)).toBe(true)
    })
  })

  describe('Clipboard & Shortcut Key Operations Feature Integration', () => {
    it('moves prefab using Cut and Paste action', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const { createPrefab } = usePrefabActions()
      const logic = usePrefabLogic()

      const prefab = await createPrefab('Movable_Box', null, 'world')

      mockPrompt.mockResolvedValue('TargetDir')
      await createNewFolder({ section: 'prefabs-world', parentId: null })
      const targetFolder = folderStore.folders.find(f => f.name === 'TargetDir')

      logic.clipboard.value = { action: 'cut', item: { id: prefab.id, type: 'prefab' } }

      logic.navigateTo(targetFolder)
      await logic.handlePaste()

      expect(prefab.folderId).toBe(targetFolder.id)
      expect(logic.clipboard.value.action).toBeNull()
    })

    it('copies prefab using Copy and Paste action', async () => {
      const { createPrefab } = usePrefabActions()
      const prefabStore = usePrefabStore()
      const logic = usePrefabLogic()

      const prefab = await createPrefab('Bullet', null, 'world')

      logic.clipboard.value = { action: 'copy', item: { id: prefab.id, type: 'prefab' } }
      await logic.handlePaste()

      expect(prefabStore.prefabs.length).toBe(2)
      expect(prefabStore.prefabs.some(p => p.name === 'Bullet_copy')).toBe(true)
    })
  })

  describe('Context Menu & Scene Entity Operations Integration', () => {
    it('instantiates prefab into scene on target layer', async () => {
      const { createPrefab, instantiatePrefab } = usePrefabActions()
      const sceneStore = useSceneStore()

      const prefab = await createPrefab('Hero_Character', null, 'world')
      const targetLayerId = sceneStore.activeScene.layersWorld[0].id

      const instantiatedEntity = instantiatePrefab(prefab.id, { parentId: targetLayerId })

      expect(instantiatedEntity).toBeDefined()
      expect(instantiatedEntity.prefabId).toBe(prefab.id)
      expect(instantiatedEntity.layerId).toBe(targetLayerId)
      expect(sceneStore.activeScene.entities.some(e => e.id === instantiatedEntity.id)).toBe(true)
    })

    it('links selected entities in scene to prefab (Link to Selected)', async () => {
      const { createPrefab, linkPrefabToEntities } = usePrefabActions()
      const sceneStore = useSceneStore()

      const rawUnlinked = entitySchema({
        name: 'Unlinked Entity',
        type: 'entity',
        x: 10,
        y: 20
      })
      sceneStore.activeScene.entities.push(rawUnlinked)

      const prefab = await createPrefab('Base_Building', null, 'world')
      await linkPrefabToEntities(prefab.id, [rawUnlinked.id])

      const linkedEntity = sceneStore.activeScene.entities.find(e => e.id === rawUnlinked.id)
      expect(linkedEntity.prefabId).toBe(prefab.id)
    })

    it('applies entity structure in scene back to Master Prefab (Apply to Master)', async () => {
      const { createPrefab, instantiatePrefab, applyToMasterPrefab } = usePrefabActions()
      const sceneStore = useSceneStore()
      const prefabStore = usePrefabStore()

      // 1. Create valid source entity using entitySchema
      const rawEntity = entitySchema({
        name: 'Upgradeable_Tower',
        type: 'entity',
        x: 0,
        y: 0
      })

      // 2. Create master prefab from source entity
      const prefab = await createPrefab('Upgradeable_Tower', null, 'world', rawEntity)

      // 3. Instantiate into scene
      const instance = instantiatePrefab(prefab.id, {})

      // Get instantiated entity in scene
      const entityInScene = sceneStore.activeScene.entities.find(e => e.id === instance.id)
      expect(entityInScene).toBeDefined()
      expect(entityInScene.components?.Transform).toBeDefined()

      // 4. Modify Transform position on entity in scene
      entityInScene.components.Transform.x = 999

      // 5. Apply changes to Master Prefab
      await applyToMasterPrefab(entityInScene.id)

      // 6. Verify Master Prefab in store
      const masterPrefab = prefabStore.getPrefabById(prefab.id)
      expect(masterPrefab).toBeDefined()
      expect(masterPrefab.data).toBeDefined()
      expect(masterPrefab.data.components).toBeDefined()
      expect(masterPrefab.data.components.Transform).toBeDefined()
      expect(masterPrefab.data.components.Transform.x).toBe(999)
    })
  })

  describe('Search & UI/World Tab Filtering Integration', () => {
    it('filters prefabs based on active tab (world vs ui) and search query', async () => {
      const { createPrefab } = usePrefabActions()
      const logic = usePrefabLogic()

      await createPrefab('World_Tree', null, 'world')
      await createPrefab('UI_Button', null, 'ui')

      logic.activeTab.value = 'world'
      expect(logic.visiblePrefabs.value.length).toBe(1)
      expect(logic.visiblePrefabs.value[0].name).toBe('World_Tree')

      logic.activeTab.value = 'ui'
      expect(logic.visiblePrefabs.value.length).toBe(1)
      expect(logic.visiblePrefabs.value[0].name).toBe('UI_Button')

      logic.searchQuery.value = 'Non_Existent'
      expect(logic.visiblePrefabs.value.length).toBe(0)
    })
  })

  describe('Utility Logic & Interface State Integration', () => {
    it('toggles viewMode between grid and list', () => {
      const logic = usePrefabLogic()

      expect(logic.viewMode.value).toBe('grid')
      logic.toggleViewMode()
      expect(logic.viewMode.value).toBe('list')
    })
  })
})