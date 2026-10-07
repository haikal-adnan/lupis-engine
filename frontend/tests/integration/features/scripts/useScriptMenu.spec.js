import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

import { useFolderStore } from '@folders/folders.js'
import { useScriptStore, useScriptMenu } from '@scripts/scripts.js'
import { useSceneStore } from '@scenes/scenes.js'

// Import helper mock project dari test utilities
import {
  setupMockOPFS,
  setupMockSceneEnvironment,
  createMockEntity
} from '@tests/tests.js'

// 1. Buat spy instance terpusat di luar vi.mock
const mockPromptFn = vi.fn()
const mockConfirmFn = vi.fn()
const mockShowPopFn = vi.fn()

// 2. Mock module composables agar selalu mengembalikan spy instance terpusat ini
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: mockShowPopFn }),
  usePrompt: () => ({ prompt: mockPromptFn }),
  useConfirm: () => ({ confirm: mockConfirmFn })
}))

describe('useScriptMenu Integration Testing', () => {
  let selectedIdRef
  let logicActions

  beforeEach(() => {
    setActivePinia(createPinia())
    setupMockOPFS()

    selectedIdRef = ref(null)
    logicActions = {
      clipboard: ref(null),
      createScript: vi.fn(),
      handlePaste: vi.fn(),
      handleOpenGraph: vi.fn()
    }

    // Reset spies sebelum setiap pengujian
    mockPromptFn.mockReset()
    mockConfirmFn.mockReset()
    mockShowPopFn.mockReset()

    // Mock Navigator Clipboard API untuk lingkungan Node/Vitest
    Object.defineProperty(global.navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      },
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  describe('Menu State & Context Handling', () => {
    it('initializes with default hidden menu state and empty context items', () => {
      // Arrange
      const { menu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)

      // Assert
      expect(menu.value.visible).toBe(false)
      expect(menu.value.item).toBeNull()

      const labels = contextMenuItems.value.map(i => i.label)
      expect(labels).toContain('New Folder')
      expect(labels).toContain('New Script')
      expect(labels).toContain('Paste')
    })

    it('updates selectedIdRef and opens context menu on handleContextMenu', () => {
      // Arrange
      const { menu, handleContextMenu } = useScriptMenu(selectedIdRef, logicActions)
      const mockEvent = { clientX: 150, clientY: 250 }
      const mockItem = { id: 'script_123', name: 'PlayerController', type: 'script' }

      // Act
      handleContextMenu(mockEvent, mockItem)

      // Assert
      expect(selectedIdRef.value).toBe('script_123')
      expect(menu.value.visible).toBe(true)
      expect(menu.value.x).toBe(150)
      expect(menu.value.y).toBe(250)
      expect(menu.value.item).toEqual(mockItem)
    })

    it('closes menu correctly when closeMenu is invoked', () => {
      // Arrange
      const { menu, handleContextMenu, closeMenu } = useScriptMenu(selectedIdRef, logicActions)
      handleContextMenu({ clientX: 100, clientY: 100 }, { id: 'folder_1', isFolder: true })

      // Act
      closeMenu()

      // Assert
      expect(menu.value.visible).toBe(false)
    })
  })

  describe('Folder Actions Integration', () => {
    it('creates new folder via default empty menu action', async () => {
      // Arrange
      const folderStore = useFolderStore()
      const { contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      mockPromptFn.mockResolvedValue('ScriptsFolder')

      const newFolderItem = contextMenuItems.value.find(i => i.label === 'New Folder')

      // Act
      await newFolderItem.action()

      // Assert
      expect(folderStore.folders).toHaveLength(1)
      expect(folderStore.folders[0].name).toBe('ScriptsFolder')
    })

    it('renames folder when confirmed via context menu item', async () => {
      // Arrange
      const folderStore = useFolderStore()
      folderStore.folders = [{ id: 'f_1', name: 'OldFolder', section: 'scripts', parentId: null }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      const folderItem = { id: 'f_1', name: 'OldFolder', isFolder: true }

      handleContextMenu({ clientX: 0, clientY: 0 }, folderItem)
      mockPromptFn.mockResolvedValue('RenamedFolder')

      const renameAction = contextMenuItems.value.find(i => i.label === 'Rename').action

      // Act
      await renameAction()

      // Assert
      expect(folderStore.folders[0].name).toBe('RenamedFolder')
    })

    it('deletes folder when deletion is confirmed', async () => {
      // Arrange
      const folderStore = useFolderStore()
      folderStore.folders = [{ id: 'f_del', name: 'TargetFolder', section: 'scripts', parentId: null }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      const folderItem = { id: 'f_del', name: 'TargetFolder', isFolder: true }

      handleContextMenu({ clientX: 0, clientY: 0 }, folderItem)
      mockConfirmFn.mockResolvedValue(true)

      const deleteAction = contextMenuItems.value.find(i => i.label === 'Delete').action

      // Act
      await deleteAction()

      // Assert
      expect(folderStore.folders.find(f => f.id === 'f_del')).toBeUndefined()
    })
  })

  describe('Script Actions Integration', () => {
    it('renames script via useScriptActions when Rename item is executed', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.scripts = [{ id: 's_1', name: 'GameLoop', type: 'component' }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      const scriptItem = { id: 's_1', name: 'GameLoop', isFolder: false }

      handleContextMenu({ clientX: 0, clientY: 0 }, scriptItem)
      mockPromptFn.mockResolvedValue('MainGameLoop')

      const renameAction = contextMenuItems.value.find(i => i.label === 'Rename').action

      // Act
      await renameAction()

      // Assert
      expect(scriptStore.scripts[0].name).toBe('MainGameLoop')
    })

    it('duplicates script and updates scriptStore state', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.scripts = [{ id: 's_orig', name: 'PlayerMove', type: 'component' }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      const scriptItem = { id: 's_orig', name: 'PlayerMove', isFolder: false }

      handleContextMenu({ clientX: 0, clientY: 0 }, scriptItem)

      const duplicateAction = contextMenuItems.value.find(i => i.label === 'Duplicate').action

      // Act
      await duplicateAction()

      // Assert
      expect(scriptStore.scripts).toHaveLength(2)
      expect(scriptStore.scripts[1].name).toBe('PlayerMove_Copy')
    })

    it('attaches script to eligible entity in active scene', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const sceneStore = useSceneStore()

      const targetScript = { id: 'script_attach', name: 'EnemyAI', type: 'component' }
      scriptStore.scripts = [targetScript]

      const entityWithController = createMockEntity({
        id: 'ent_1',
        name: 'EnemyObject',
        attachComponents: { ScriptController: { data: [] } }
      })

      setupMockSceneEnvironment({
        entities: [entityWithController],
        selectedEntityIds: ['ent_1']
      })

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      handleContextMenu({ clientX: 0, clientY: 0 }, targetScript)

      const attachItem = contextMenuItems.value.find(i => i.label === 'Add to EnemyObject')

      // Act
      attachItem.action()

      // Assert
      const updatedEntity = sceneStore.activeScene.entities.find(e => e.id === 'ent_1')
      const attachedScripts = updatedEntity.components.ScriptController.data
      expect(attachedScripts).toHaveLength(1)
      expect(attachedScripts[0].assetId).toBe('script_attach')
    })
  })

  describe('Clipboard & Graph Operations', () => {
    it('sets clipboard state for cut operation on script item', () => {
      // Arrange
      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      const scriptItem = { id: 's_cut', name: 'ScriptToCut', isFolder: false }

      handleContextMenu({ clientX: 0, clientY: 0 }, scriptItem)

      const cutAction = contextMenuItems.value.find(i => i.label === 'Cut').action

      // Act
      cutAction()

      // Assert
      expect(logicActions.clipboard.value).toEqual({
        action: 'cut',
        item: { id: 's_cut', type: 'script' }
      })
    })

    it('copies item ID to clipboard and closes menu', async () => {
      // Arrange
      const { handleContextMenu, contextMenuItems, menu } = useScriptMenu(selectedIdRef, logicActions)
      const scriptItem = { id: 'script_uuid_999', name: 'TestScript', isFolder: false }

      handleContextMenu({ clientX: 0, clientY: 0 }, scriptItem)

      const copyIdAction = contextMenuItems.value.find(i => i.label === 'Copy ID').action

      // Act
      await copyIdAction()

      // Assert
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith('script_uuid_999')
      expect(menu.value.visible).toBe(false)
    })

    it('triggers handleOpenGraph logic action when Open Graph is selected', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const targetScript = { id: 'script_graph', name: 'GraphScript', type: 'component' }
      scriptStore.scripts = [targetScript]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      handleContextMenu({ clientX: 0, clientY: 0 }, targetScript)

      const openGraphAction = contextMenuItems.value.find(i => i.label === 'Open Graph').action

      // Act
      openGraphAction()

      // Assert
      expect(logicActions.handleOpenGraph).toHaveBeenCalledWith(targetScript)
    })
  })

  describe('Edge Cases & [Bad Path]', () => {
    it('[Bad Path] handles script rename when prompt returns empty string without altering store', async () => {
      // Arrange
      const scriptStore = useScriptStore()
      scriptStore.scripts = [{ id: 's_keep', name: 'OriginalName', type: 'component' }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      handleContextMenu({ clientX: 0, clientY: 0 }, { id: 's_keep', name: 'OriginalName', isFolder: false })

      mockPromptFn.mockResolvedValue('')

      const renameAction = contextMenuItems.value.find(i => i.label === 'Rename').action

      // Act
      await renameAction()

      // Assert
      expect(scriptStore.scripts[0].name).toBe('OriginalName')
    })

    it('[Bad Path] cancels folder deletion when confirm dialog is rejected', async () => {
      // Arrange
      const folderStore = useFolderStore()
      folderStore.folders = [{ id: 'f_safe', name: 'SafeFolder', section: 'scripts', parentId: null }]

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)
      handleContextMenu({ clientX: 0, clientY: 0 }, { id: 'f_safe', name: 'SafeFolder', isFolder: true })

      mockConfirmFn.mockResolvedValue(false)

      const deleteAction = contextMenuItems.value.find(i => i.label === 'Delete').action

      // Act
      await deleteAction()

      // Assert
      expect(folderStore.folders).toHaveLength(1)
      expect(folderStore.folders[0].id).toBe('f_safe')
    })

    it('[Bad Path] does not display entity attachment action if selected entity lacks ScriptController', () => {
      // Arrange
      const scriptStore = useScriptStore()
      const targetScript = { id: 's_no_ctrl', name: 'Script1', type: 'component' }
      scriptStore.scripts = [targetScript]

      const plainEntity = createMockEntity({
        id: 'ent_plain',
        name: 'PlainEntity',
        components: {}
      })

      setupMockSceneEnvironment({
        entities: [plainEntity],
        selectedEntityIds: ['ent_plain']
      })

      const { handleContextMenu, contextMenuItems } = useScriptMenu(selectedIdRef, logicActions)

      // Act
      handleContextMenu({ clientX: 0, clientY: 0 }, targetScript)

      // Assert
      const attachItem = contextMenuItems.value.find(i => i.label && i.label.startsWith('Add to'))
      expect(attachItem).toBeUndefined()
    })
  })
})