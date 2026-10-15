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

// Mock external UI Alerts, Confirmations & Dialog Prompts composables
const mockPrompt = vi.fn()
const mockConfirm = vi.fn().mockResolvedValue(true)
const mockShowPop = vi.fn()

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPop }),
  usePrompt: () => ({ prompt: mockPrompt }),
  useConfirm: () => ({ confirm: mockConfirm })
}))

describe('ScriptWorkspace Integration Testing', () => {
  let storeRef
  let project

  // Helper to create mock script instances and save them to Store & OPFS
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

    // Initialize default scene for testing script attachment to entity
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

  describe('Script CRUD & Storage (OPFS) Synchronization Integration', () => {
    it('creates new script via actions and saves it to Pinia Store and physical OPFS files', async () => {
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

    it('renames script and aligns changes to metadata files in OPFS', async () => {
      const { renameScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const script = await createMockScript({ name: 'OldLogic', type: 'component' })

      // Mock prompt return value for rename
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

    it('deletes script from store and cleans up physical file from OPFS', async () => {
      const { deleteScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const script = await createMockScript({ name: 'TempScript', type: 'component' })
      
      const isDeleted = await deleteScript(script.id)

      expect(isDeleted).toBe(true)
      expect(scriptStore.getScriptById(script.id)).toBeUndefined()

      const scriptFileHandle = storeRef.store.get(`root/lupis-engine/projects/${project.id}/scripts/${script.id}.json`)
      expect(scriptFileHandle).toBeUndefined()
    })

    it('[Bad Path] safely handles attempt to delete invalid script ID', async () => {
      const { deleteScript } = useScriptActions()
      const scriptStore = useScriptStore()

      const initialCount = scriptStore.scripts.length
      const result = await deleteScript('invalid_script_id')

      expect(result).toBe(false)
      expect(scriptStore.scripts.length).toBe(initialCount)
    })
  })

  describe('Folder CRUD Integration on Scripts Section', () => {
    it('creates new folder specifically for scripts section', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('AI_Logic')

      await createNewFolder('New Folder', null, 'scripts')

      const created = folderStore.folders.find(f => f.name === 'AI_Logic')
      expect(created).toBeDefined()
      expect(created.section).toBe('scripts')
      expect(created.parentId).toBeNull()
    })

    it('deletes scripts folder along with state cleanup in folderStore', async () => {
      const folderStore = useFolderStore()
      const { createNewFolder, deleteFolder } = useFolderActions()

      mockPrompt.mockResolvedValue('UnusedFolder')
      await createNewFolder('New Folder', null, 'scripts')
      const folder = folderStore.folders.find(f => f.name === 'UnusedFolder')

      await deleteFolder(folder.id)

      expect(folderStore.getFolderById(folder.id)).toBeUndefined()
    })
  })

  describe('Script Movement & Folder Navigation Integration', () => {
    it('moves script to target folder and updates visibleScripts list', async () => {
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

    it('moves script back to root via breadcrumb navigation', async () => {
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

  describe('Clipboard Operations Feature Integration (Copy, Cut, Paste & Duplicate)', () => {
    it('moves script with Cut and Paste operation', async () => {
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

    it('duplicates script via Copy & Paste action on clipboard', async () => {
      const scriptStore = useScriptStore()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'HealthLogic', type: 'component' })

      logic.clipboard.value = { action: 'copy', item: { id: script.id, type: 'script' } }
      await logic.handlePaste()

      expect(scriptStore.scripts.length).toBe(2)
      expect(scriptStore.scripts.some(s => s.name === 'HealthLogic_Copy')).toBe(true)
    })
  })

  describe('Context Menu, Graph Editor & Scene Entity Interaction Integration', () => {
    it('opens script node graph diagram in new workspace tab when handleOpenGraph is called', async () => {
      const scriptStore = useScriptStore()
      const workspaceStore = useWorkspaceStore()
      const logic = useScriptLogic()

      const script = await createMockScript({ name: 'GraphTestScript', type: 'component' })

      logic.handleOpenGraph(script)

      expect(scriptStore.activeScript.id).toBe(script.id)
      expect(workspaceStore.tabs.some(t => t.id === script.id && t.type === 'diagram')).toBe(true)
      expect(workspaceStore.activeTabId).toBe(script.id)
    })

    it('attaches script to ScriptController component of active entity via Context Menu action', async () => {
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

    it('tests right-click menu option to copy Script ID to clipboard', async () => {
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

  describe('Script Search & Panel View Mode Integration', () => {
    it('filters visibleScripts and visibleFolders based on searchQuery', async () => {
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

    it('toggles viewMode between grid and list views', () => {
      const logic = useScriptLogic()

      expect(logic.viewMode.value).toBe('grid')
      logic.toggleViewMode()
      expect(logic.viewMode.value).toBe('list')
    })
  })
})