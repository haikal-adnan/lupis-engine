import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFolderStore } from '@folders/useFolderStore.js'
import { useFolderActions } from '@folders/useFolderActions.js'
import { useWorkspaceStore } from '@workspaces/useWorkspaceStore.js'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  usePrompt: () => ({ prompt: vi.fn().mockResolvedValue('Folder Baru') })
}))

describe('Integrasi Folder Store dan Folder Actions', () => {
  let mockStoreRef

  beforeEach(async () => {
    setActivePinia(createPinia())
    mockStoreRef = setupMockOPFS()

    const project = await createMockEmptyProject({
      projectName: 'Folder Integration Project',
      description: 'Project pengujian integrasi folder',
      type: 'empty'
    })

    const workspaceStore = useWorkspaceStore()
    workspaceStore.activeProjectId = project.id
  })

  describe('Pembuatan dan Sinkronisasi Folder', () => {
    it('membuat folder baru dan menyinkronkan data ke OPFS', async () => {
      const folderStore = useFolderStore()
      const folderActions = useFolderActions()
      const workspaceStore = useWorkspaceStore()

      const newFolder = await folderActions.createNewFolder({
        defaultName: 'Asset Folder',
        parentId: null,
        section: 'assets'
      })

      expect(folderStore.folders).toHaveLength(1)
      expect(folderStore.folders[0].name).toBe('Folder Baru')
      expect(folderStore.folders[0].section).toBe('assets')

      // FIX: Sertakan 'lupis-engine' pada path OPFS mock
      const opfsFilePath = `root/lupis-engine/projects/${workspaceStore.activeProjectId}/workspaces/folders.json`
      const fileHandle = mockStoreRef.store.get(opfsFilePath)
      
      expect(fileHandle).toBeDefined()

      const fileData = await fileHandle.getFile()
      const content = JSON.parse(await fileData.text())

      expect(content).toHaveLength(1)
      expect(content[0].id).toBe(newFolder.id)
      expect(content[0].name).toBe('Folder Baru')
    })

    it('membuat folder anak dan menghasilkan path string hierarki dengan benar', async () => {
      const folderStore = useFolderStore()

      await folderStore.createFolder({
        id: 'parent_1',
        name: 'ParentFolder',
        section: 'assets',
        parentId: null
      })

      await folderStore.createFolder({
        id: 'child_1',
        name: 'ChildFolder',
        section: 'assets',
        parentId: 'parent_1'
      })

      const pathString = folderStore.getFolderPathString('child_1')
      expect(pathString).toBe('ParentFolder/ChildFolder')
      expect(folderStore.folders).toHaveLength(2)
    })
  })

  describe('Pengubahan dan Pemindahan Folder', () => {
    it('mengubah nama folder di state dan memperbarui file sinkronisasi OPFS', async () => {
      const folderStore = useFolderStore()
      const folderActions = useFolderActions()
      const workspaceStore = useWorkspaceStore()

      const folder = await folderActions.createNewFolder({
        defaultName: 'Original Name',
        parentId: null,
        section: 'assets'
      })

      await folderActions.renameFolder(folder.id, 'Renamed Folder')

      const updatedFolder = folderStore.getFolderById(folder.id)
      expect(updatedFolder.name).toBe('Renamed Folder')

      // FIX: Sertakan 'lupis-engine' pada path OPFS mock
      const opfsFilePath = `root/lupis-engine/projects/${workspaceStore.activeProjectId}/workspaces/folders.json`
      const fileHandle = mockStoreRef.store.get(opfsFilePath)
      
      expect(fileHandle).toBeDefined()

      const fileData = await fileHandle.getFile()
      const content = JSON.parse(await fileData.text())

      expect(content[0].name).toBe('Renamed Folder')
    })

    it('memindahkan folder ke parent baru dan menyinkronkan perubahan', async () => {
      const folderStore = useFolderStore()

      await folderStore.createFolder({ id: 'f1', name: 'Folder 1', section: 'assets', parentId: null })
      await folderStore.createFolder({ id: 'f2', name: 'Folder 2', section: 'assets', parentId: null })

      const isMoved = await folderStore.moveFolder('f2', 'f1')

      expect(isMoved).toBe(true)
      expect(folderStore.getFolderById('f2').parentId).toBe('f1')
      expect(folderStore.getFolderPathString('f2')).toBe('Folder 1/Folder 2')
    })
  })

  describe('Penghapusan Folder secara Cascading', () => {
    it('menghapus folder utama beserta seluruh sub-folder di dalamnya', async () => {
      const folderStore = useFolderStore()
      const folderActions = useFolderActions()

      await folderStore.createFolder({ id: 'root_dir', name: 'Root', section: 'assets', parentId: null })
      await folderStore.createFolder({ id: 'sub_dir_1', name: 'Sub 1', section: 'assets', parentId: 'root_dir' })
      await folderStore.createFolder({ id: 'sub_dir_2', name: 'Sub 2', section: 'assets', parentId: 'sub_dir_1' })

      expect(folderStore.folders).toHaveLength(3)

      await folderActions.deleteFolder('root_dir')

      expect(folderStore.folders).toHaveLength(0)
      expect(folderStore.getFolderById('root_dir')).toBeUndefined()
    })
  })

  describe('Pengujian Skenario Gagal [Bad Path]', () => {
    it('[Bad Path] gagal menyinkronkan ke OPFS ketika navigator.storage tidak tersedia', async () => {
      const folderStore = useFolderStore()

      const originalStorage = global.navigator.storage
      delete global.navigator.storage

      await expect(folderStore.syncFoldersToOPFS()).rejects.toThrow(TypeError)

      global.navigator.storage = originalStorage
    })

    it('[Bad Path] mengembalikan null secara anggun saat mencoba menduplikasi folder yang tidak terdaftar', async () => {
      const folderActions = useFolderActions()
      const result = await folderActions.duplicateFolder('non_existent_id')
      
      expect(result).toBeNull()
    })
  })
})