import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFolderActions } from '@folders/useFolderActions.js'
import { useFolderStore } from '@folders/useFolderStore.js'
import { useAssetStore } from '@assets/useAssetStore.js'
import { usePrefabStore } from '@prefabs/usePrefabStore.js'
import { useScriptStore } from '@scripts/useScriptStore.js'
import { useWorkspaceStore } from '@workspaces/useWorkspaceStore.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

const mockShowPop = vi.fn()
const mockPrompt = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt })
}))

describe('Integration Test: Folder Actions', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    setupMockOPFS()
    const project = await createMockEmptyProject({
      projectName: 'Folder Actions Project',
      description: 'Folder actions integration test project',
      type: 'empty'
    })

    const workspaceStore = useWorkspaceStore()
    workspaceStore.activeProjectId = project.id
  })

  describe('Action: createNewFolder', () => {
    it('processes prompt input, creates new folder in store, and shows notification', async () => {
      const folderActions = useFolderActions()
      const folderStore = useFolderStore()
      mockPrompt.mockResolvedValue('  New Created Folder  ')

      const newFolder = await folderActions.createNewFolder({
        defaultName: 'Default Name',
        parentId: 'parent_1',
        section: 'assets'
      })

      expect(mockPrompt).toHaveBeenCalledWith({
        title: 'Create New Folder',
        message: 'Enter folder name:',
        defaultValue: 'Default Name',
        confirmText: 'Create'
      })

      expect(folderStore.folders).toHaveLength(1)
      expect(folderStore.folders[0].name).toBe('New Created Folder')
      expect(folderStore.folders[0].parentId).toBe('parent_1')
      expect(newFolder.id).toBeDefined()

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Folder Created',
        message: 'Folder "New Created Folder" created successfully.',
        type: 'success'
      })
    })

    it('gracefully cancels folder creation when user clicks Cancel on prompt', async () => {
      const folderActions = useFolderActions()
      const folderStore = useFolderStore()
      mockPrompt.mockResolvedValue(null) // Prompt returns null when cancelled

      const result = await folderActions.createNewFolder({
        defaultName: 'Default Name',
        parentId: null,
        section: 'assets'
      })

      expect(result).toBeNull()
      expect(folderStore.folders).toHaveLength(0)
      expect(mockShowPop).not.toHaveBeenCalled()
    })
  })

  describe('Action: deleteFolder (Cascade Delete)', () => {
    it('deletes folder along with all sub-folders, assets, prefabs, and scripts inside it', async () => {
      const folderActions = useFolderActions()
      const folderStore = useFolderStore()
      const assetStore = useAssetStore()
      const prefabStore = usePrefabStore()
      const scriptStore = useScriptStore()

      await folderStore.createFolder({ id: 'parent_dir', name: 'Parent', section: 'assets', parentId: null })
      await folderStore.createFolder({ id: 'child_dir', name: 'Child', section: 'assets', parentId: 'parent_dir' })

      assetStore.assets = [{ id: 'asset_1', folderId: 'child_dir' }]
      prefabStore.prefabs = [{ id: 'prefab_1', folderId: 'parent_dir' }]
      scriptStore.scripts = [{ id: 'script_1', folderId: 'child_dir' }]

      assetStore.removeAsset = vi.fn(async (id) => {
        assetStore.assets = assetStore.assets.filter(a => a.id !== id)
      })
      prefabStore.removePrefab = vi.fn(async (id) => {
        prefabStore.prefabs = prefabStore.prefabs.filter(p => p.id !== id)
      })
      scriptStore.removeScript = vi.fn(async (id) => {
        scriptStore.scripts = scriptStore.scripts.filter(s => s.id !== id)
      })

      await folderActions.deleteFolder('parent_dir')

      expect(assetStore.removeAsset).toHaveBeenCalledWith('asset_1')
      expect(prefabStore.removePrefab).toHaveBeenCalledWith('prefab_1')
      expect(scriptStore.removeScript).toHaveBeenCalledWith('script_1')

      expect(folderStore.folders).toHaveLength(0)

      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Folder Deleted',
        message: 'Folder and its contents removed.',
        type: 'info'
      })
    })
  })

  describe('Action: renameFolder & duplicateFolder', () => {
    it('updates folder name in store and triggers success notification', async () => {
      const folderActions = useFolderActions()
      const folderStore = useFolderStore()
      await folderStore.createFolder({ id: 'f1', name: 'Old Name', section: 'assets', parentId: null })

      await folderActions.renameFolder('f1', '  New Name Clean  ')

      expect(folderStore.getFolderById('f1').name).toBe('New Name Clean')
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Success',
        message: 'Folder renamed.',
        type: 'success'
      })
    })

    it('duplicates existing folder and creates new entry in store', async () => {
      const folderActions = useFolderActions()
      const folderStore = useFolderStore()
      await folderStore.createFolder({ id: 'f_orig', name: 'Documents', section: 'assets', parentId: null })

      const duplicated = await folderActions.duplicateFolder('f_orig')

      expect(folderStore.folders).toHaveLength(2)
      expect(duplicated.name).toBe('Documents (Copy)')
      expect(duplicated.id).not.toBe('f_orig')
      expect(mockShowPop).toHaveBeenCalledWith({
        title: 'Folder Duplicated',
        message: 'Created copy of "Documents".',
        type: 'success'
      })
    })
  })
})