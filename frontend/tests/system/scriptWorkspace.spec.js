import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { setupMockOPFS, createMockEmptyProject } from '@tests/tests.js'

import * as ScriptModule from '@scripts/scripts.js'
import { useFolderStore, useFolderActions } from '@folders/folders.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'

const { 
  useScriptStore, 
  useScriptActions, 
  useScriptLogic, 
  useScriptMenu,
  scriptSchema 
} = ScriptModule

// Mock composables eksternal UI Alerts, Confirmations & Dialog Prompts
const mockPrompt = vi.fn()
const mockConfirm = vi.fn().mockResolvedValue(true)
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm })
}))

describe('Pengujian Integrasi ScriptWorkspace', () => {
  let storeRef
  let project

  // Helper pembuat script mock instan dan menyimpannya ke Store & OPFS
  const createMockScript = async ({ name = 'TestScript', type = 'component', folderId = null } = {}) => {
    const scriptStore = useScriptStore()
    
    const script = scriptSchema({
      id: `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      type,
      folderId,
      nodes: [],
      edges: []
    })

    await scriptStore.addScript(script)
    return script
  }

  beforeEach(async () => {
    setActivePinia(createPinia())
    storeRef = setupMockOPFS()
    project = await createMockEmptyProject({ projectName: 'Script Workspace Integration Test' })
    
    const workspaceStore = useWorkspaceStore()
    workspaceStore.setProjectId(project.id)
    workspaceStore.activeBottomTabId = 'scripts'

    // Safe Mock Clipboard Navigator API
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true
    })

    // Inisialisasi scene default untuk pengujian attach script ke entity
    const sceneStore = useSceneStore()
    sceneStore.initScenes([{
      id: 'scene_main',
      name: 'Main Scene',
      entities: [
        {
          id: 'entity_player',
          name: 'Player',
          components: {
            ScriptController: { data: [] }
          }
        }
      ]
    }])
    sceneStore.setActiveScene('scene_main')

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

  describe('Integrasi CRUD Script & Sinkronisasi Storage (OPFS)', () => {
    it('membuat script baru via actions dan menyimpannya ke Pinia Store serta berkas fisik OPFS', async () => {
      const { createScript } = useScriptActions()
      const scriptStore = useScriptStore()

      mockPrompt.mockResolvedValue('PlayerController')

      const newScript = await createScript('component', null)

      expect(newScript).toBeDefined()
      expect(newScript.name).toBe('PlayerController')
      expect(scriptStore.scripts.some(s => s.id === newScript.id)).toBe(true)

      const scriptsJsonHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/workspaces/scripts.json`)
      expect(scriptsJsonHandle).toBeDefined()

      const scriptFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/scripts/${newScript.id}.json`)
      expect(scriptFileHandle).toBeDefined()
    })

    it('mengubah nama script dan menyelaraskan perubahan ke berkas metadata di OPFS', async () => {
      const { renameScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const script = await createMockScript({ name: 'OldLogic', type: 'component' })

      // Mock nilai return dari prompt rename
      mockPrompt.mockResolvedValue('NewLogic')

      await renameScript(script.id)

      const updatedScript = scriptStore.getScriptById(script.id)
      expect(updatedScript.name).toBe('NewLogic')

      const scriptsJsonHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/workspaces/scripts.json`)
      expect(scriptsJsonHandle).toBeDefined()

      const fileData = await scriptsJsonHandle.getFile()
      const content = JSON.parse(await fileData.text())
      expect(content.find(s => s.id === script.id).name).toBe('NewLogic')
    })

    it('menghapus script dari store dan membersihkan berkas fisiknya dari OPFS', async () => {
      const { deleteScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const script = await createMockScript({ name: 'TempScript', type: 'component' })
      
      const isDeleted = await deleteScript(script.id)

      expect(isDeleted).toBe(true)
      expect(scriptStore.getScriptById(script.id)).toBeUndefined()

      const scriptFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/scripts/${script.id}.json`)
      expect(scriptFileHandle).toBeUndefined()
    })

    it('[Bad Path] menangani percobaan hapus ID script yang tidak valid secara aman', async () => {
      const { deleteScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const initialCount = scriptStore.scripts.length
      const result = await deleteScript('invalid_script_id')

      expect(result).toBe(false)
      expect(scriptStore.scripts.length).toBe(initialCount)
    })
  })

  describe('Integrasi CRUD Folder pada Section Scripts', () => {
    it('membuat folder baru khusus section scripts', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('AI_Logic')

      await createNewFolder('New Folder', null, 'scripts')

      const created = folderStore.folders.find(f => f.name === 'AI_Logic')
      expect(created).toBeDefined()
      expect(created.section).toBe('scripts')
      expect(created.parentId).toBeNull()
    })

    it('menghapus folder scripts beserta pembersihan state di folderStore', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder, deleteFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('UnusedFolder')
      await createNewFolder('New Folder', null, 'scripts')
      const folder = folderStore.folders.find(f => f.name === 'UnusedFolder')

      await deleteFolder(folder.id)

      expect(folderStore.getFolderById(folder.id)).toBeUndefined()
    })
  })

  describe('Integrasi Perpindahan Script & Navigasi Folder', () => {
    it('memindahkan script ke folder target dan memperbarui daftar visibleScripts', async () => {
      const folderStore = useFolderStore()
      const scriptStore = useScriptStore()
      const { createNewFolder } = useFolderActions()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'Movement', type: 'component' })

      mockPrompt.mockResolvedValue('PlayerScripts')
      await createNewFolder('New Folder', null, 'scripts')
      const targetFolder = folderStore.folders.find(f => f.name === 'PlayerScripts')

      await logic.moveItem(script.id, 'script', targetFolder.id)

      const updatedScript = scriptStore.getScriptById(script.id)
      expect(updatedScript.folderId).toBe(targetFolder.id)
      expect(logic.visibleScripts.value.some(s => s.id === script.id)).toBe(false)

      logic.navigateTo(targetFolder)

      expect(folderStore.activeFolderId).toBe(targetFolder.id)
      expect(logic.visibleScripts.value.some(s => s.id === script.id)).toBe(true)
    })

    it('memindahkan script kembali ke root via navigasi breadcrumb', async () => {
      const folderStore = useFolderStore()
      const scriptStore = useScriptStore()
      const { createNewFolder } = useFolderActions()
      const logic = useScriptLogic()

      mockPrompt.mockResolvedValue('SubFolder')
      await createNewFolder('New Folder', null, 'scripts')
      const folder = folderStore.folders.find(f => f.name === 'SubFolder')

      folderStore.setActiveFolder(folder.id)
      const script = await createMockScript({ name: 'EnemyAI', type: 'component', folderId: folder.id })

      await logic.moveItem(script.id, 'script', null)

      const updatedScript = scriptStore.getScriptById(script.id)
      expect(updatedScript.folderId).toBeNull()
      expect(logic.visibleScripts.value.some(s => s.id === script.id)).toBe(false)

      logic.navigateTo(null)
      expect(logic.visibleScripts.value.some(s => s.id === script.id)).toBe(true)
    })
  })

  describe('Integrasi Fitur Clipboard Operations (Copy, Cut, Paste & Duplicate)', () => {
    it('memindahkan script dengan operasi Cut dan Paste', async () => {
      const folderStore = useFolderStore()
      const scriptStore = useScriptStore()
      const { createNewFolder } = useFolderActions()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'CutMe', type: 'component' })

      mockPrompt.mockResolvedValue('TargetFolder')
      await createNewFolder('New Folder', null, 'scripts')
      const targetFolder = folderStore.folders.find(f => f.name === 'TargetFolder')

      logic.clipboard.value = { action: 'cut', item: { id: script.id, type: 'script' } }

      logic.navigateTo(targetFolder)
      await logic.handlePaste()

      const updatedScript = scriptStore.getScriptById(script.id)
      expect(updatedScript.folderId).toBe(targetFolder.id)
      expect(logic.clipboard.value).toBeNull()
    })

    it('menduplikasi script melalui aksi Copy & Paste pada clipboard', async () => {
      const scriptStore = useScriptStore()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'HealthLogic', type: 'component' })

      logic.clipboard.value = { action: 'copy', item: { id: script.id, type: 'script' } }
      await logic.handlePaste()

      expect(scriptStore.scripts.length).toBe(2)
      expect(scriptStore.scripts.some(s => s.name === 'HealthLogic_Copy')).toBe(true)
    })
  })

  describe('Integrasi Context Menu, Graph Editor & Interaksi Scene Entity', () => {
    it('membuka diagram node graph script di workspace tab baru saat handleOpenGraph dipanggil', async () => {
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'GraphTestScript', type: 'component' })

      logic.handleOpenGraph(script)

      expect(scriptStore.activeScript.id).toBe(script.id)
      expect(workspaceStore.tabs.some(t => t.id === script.id && t.type === 'diagram')).toBe(true)
      expect(workspaceStore.activeTabId).toBe(script.id)
    })

    it('menempelkan script ke komponen ScriptController entitas aktif via Context Menu action', async () => {
      const sceneStore = useSceneStore()
      const selectedIdRef = { value: null }
      const logicActions = useScriptLogic()

      sceneStore.selectedEntityIds = ['entity_player']
      const script = await createMockScript({ name: 'PlayerMotor', type: 'component' })

      const menu = useScriptMenu(selectedIdRef, logicActions)
      menu.handleContextMenu({ clientX: 100, clientY: 100 }, script)

      const attachItem = menu.contextMenuItems.value.find(i => i.label === 'Add to Player')
      expect(attachItem).toBeDefined()

      attachItem.action()

      const playerEntity = sceneStore.activeScene.entities[0]
      const controllerData = playerEntity.components.ScriptController.data
      expect(controllerData.some(inst => inst.assetId === script.id)).toBe(true)
    })

    it('menguji opsi menu klik kanan untuk menyalin ID Script ke clipboard', async () => {
      const selectedIdRef = { value: null }
      const logicActions = useScriptLogic()

      const script = await createMockScript({ name: 'IDTestScript', type: 'component' })

      const menu = useScriptMenu(selectedIdRef, logicActions)
      menu.handleContextMenu({ clientX: 100, clientY: 100 }, script)

      const copyIdItem = menu.contextMenuItems.value.find(i => i.label === 'Copy ID')
      expect(copyIdItem).toBeDefined()

      await copyIdItem.action()

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(script.id)
      expect(mockShowPop).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    })
  })

  describe('Integrasi Pencarian Script & Mode Tampilan Panel', () => {
    it('menyaring daftar visibleScripts dan visibleFolders berdasarkan searchQuery', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()
      const logic = useScriptLogic()

      mockPrompt.mockResolvedValueOnce('PhysicsScripts').mockResolvedValueOnce('UIScripts')
      await createNewFolder('New Folder', null, 'scripts')
      await createNewFolder('New Folder', null, 'scripts')

      await createMockScript({ name: 'player_movement', type: 'component' })
      await createMockScript({ name: 'ui_button_click', type: 'component' })

      logic.searchQuery.value = 'movement'

      expect(logic.visibleFolders.value.length).toBe(0)
      expect(logic.visibleScripts.value.length).toBe(1)
      expect(logic.visibleScripts.value[0].name).toBe('player_movement')
    })

    it('mengubah viewMode antara tampilan grid dan list', () => {
      const logic = useScriptLogic()

      expect(logic.viewMode.value).toBe('grid')
      logic.toggleViewMode()
      expect(logic.viewMode.value).toBe('list')
    })
  })
})