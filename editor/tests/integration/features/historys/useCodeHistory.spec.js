import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useCodeHistory } from '@historys/historys.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { setupMockScriptEnvironment, setupMockOPFS } from '@tests/tests.js'

// Mock dependencies external di luar batas pengujian integrasi
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    updateEntity: vi.fn(),
    updateComponentProp: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}))

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}))

vi.mock('@opfs/opfs.js', () => ({
  useOPFSActions: () => ({
    getProjectsRootDirectory: vi.fn().mockResolvedValue({}),
    resolveDirectoryPath: vi.fn().mockResolvedValue({}),
    writeFileToHandle: vi.fn().mockResolvedValue(true),
    removeFileFromHandle: vi.fn().mockResolvedValue(true)
  })
}))

describe('useCodeHistory Integration', () => {
  let scriptStore
  let projectStore
  let workspaceStore
  let extractedNodeId
  let targetNode
  let codeHistory

  beforeEach(async () => {
    // Inisialisasi OPFS Mock pada global navigator.storage
    setupMockOPFS()

    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia())

    vi.useFakeTimers()

    scriptStore = useScriptStore()
    projectStore = useProjectStore()
    workspaceStore = useWorkspaceStore()

    // Inisialisasi data proyek dasar
    projectStore.project = { id: 'proj_1', name: 'Test Project', tags: [], settings: {} }

    // Setup environment script mock dengan node tipe code
    const env = await setupMockScriptEnvironment({
      scriptName: 'Code History Script',
      nodes: [
        {
          id: 'node_code_1',
          type: 'custom_code',
          label: 'Custom Code Node',
          data: { code: 'console.log("initial code");' }
        }
      ]
    })

    const activeScript = env.script
    scriptStore.setActiveScript(activeScript)

    // Setup active tab di workspace agar history key dapat dikalkulasi (`tab_${id}`)
    workspaceStore.tabs = [{ id: 'tab_script_1', type: 'script', scriptId: activeScript.id }]

    // Inisialisasi reactive references yang selalu merefleksikan node terbaru di store
    extractedNodeId = ref('node_code_1')
    targetNode = computed(() => scriptStore.activeScript?.nodes?.find(n => n.id === extractedNodeId.value))

    codeHistory = useCodeHistory(extractedNodeId, targetNode, { debounceMs: 500 })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Code Modifications and Debounce Integration', () => {
    it('commits code change after debounce time and marks project as dirty', () => {
      // Arrange
      const initialCode = 'console.log("initial code");'
      const updatedCode = 'console.log("updated code");'

      expect(codeHistory.codeContent.value).toBe(initialCode)

      // Act: Simulasi ketikan pengguna
      codeHistory.codeContent.value = updatedCode
      codeHistory.handleCodeInput()

      expect(codeHistory.isDirty.value).toBe(true)

      // Majukan timer melampaui debounceMs (500ms)
      vi.advanceTimersByTime(550)

      // Assert
      expect(codeHistory.isDirty.value).toBe(false)
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(updatedCode)
      expect(projectStore.syncStatus).toBe('dirty')
    })

    it('saves code immediately when saveCode is explicitly called', () => {
      // Arrange
      const newCode = 'const x = 42;'
      codeHistory.codeContent.value = newCode
      codeHistory.handleCodeInput()

      // Act
      codeHistory.saveCode()

      // Assert
      expect(codeHistory.isDirty.value).toBe(false)
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(newCode)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Undo/Redo and State Synchronization', () => {
    it('restores previous code content on undo and reapplies updated code on redo', () => {
      // Arrange
      const initialCode = 'console.log("initial code");'
      const newCode = 'console.log("committed change");'

      codeHistory.codeContent.value = newCode
      codeHistory.saveCode()

      expect(scriptStore.activeScript.nodes[0].data.code).toBe(newCode)

      // Act & Assert Undo
      codeHistory.undo()
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(initialCode)
      expect(codeHistory.codeContent.value).toBe(initialCode)

      // Act & Assert Redo
      codeHistory.redo()
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(newCode)
      expect(codeHistory.codeContent.value).toBe(newCode)
    })

    it('flushes pending uncommitted debounced code changes before executing undo', () => {
      // Arrange
      const initialCode = 'console.log("initial code");'
      const uncommittedCode = 'let tempVal = 100;'

      codeHistory.codeContent.value = uncommittedCode
      codeHistory.handleCodeInput() // memicu debounce timer

      // Act: undo akan memicu commitCode(uncommittedCode) terlebih dahulu, lalu membatalkan (undo) commit tersebut
      codeHistory.undo()

      // Assert: Kode kembali ke initialCode
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(initialCode)
      expect(codeHistory.codeContent.value).toBe(initialCode)
    })
  })

  describe('Reset Code to Blueprint Integration', () => {
    it('resets code content to default blueprint code when resetCodeToBlueprint is triggered', () => {
      // Arrange
      const defaultBlueprintCode = '// Default Blueprint Code'
      scriptStore.blueprints = [
        {
          items: [
            {
              type: 'custom_code',
              defaultData: {
                data: { code: defaultBlueprintCode }
              }
            }
          ]
        }
      ]

      // Act
      codeHistory.resetCode()

      // Assert
      expect(codeHistory.codeContent.value).toBe(defaultBlueprintCode)
      expect(scriptStore.activeScript.nodes[0].data.code).toBe(defaultBlueprintCode)
      expect(projectStore.syncStatus).toBe('dirty')
    })
  })

  describe('Keyboard Shortcuts Handling', () => {
    it('triggers saveCode when Ctrl+S is pressed', () => {
      // Arrange
      codeHistory.codeContent.value = 'const saved = true;'
      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      // Act
      codeHistory.handleEditorKeyDown(event)

      // Assert
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(scriptStore.activeScript.nodes[0].data.code).toBe('const saved = true;')
    })

    it('triggers undo and redo via Ctrl+Z and Ctrl+Shift+Z', () => {
      // Arrange
      codeHistory.codeContent.value = 'code v2'
      codeHistory.saveCode()

      const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: false })
      const redoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })

      // Act & Assert Undo via Shortcut
      codeHistory.handleEditorKeyDown(undoEvent)
      expect(codeHistory.codeContent.value).toBe('console.log("initial code");')

      // Act & Assert Redo via Shortcut
      codeHistory.handleEditorKeyDown(redoEvent)
      expect(codeHistory.codeContent.value).toBe('code v2')
    })
  })

  describe('Edge Cases and Guard Clauses', () => {
    it('[Bad Path] ignores code commit when target node or extractedNodeId is null', () => {
      // Arrange
      extractedNodeId.value = null

      // Act
      codeHistory.codeContent.value = 'invalid update'
      codeHistory.saveCode()

      // Assert
      expect(scriptStore.activeScript.nodes[0].data.code).toBe('console.log("initial code");')
    })

    it('[Bad Path] ignores code commit if new code is identical to previous snapshot', () => {
      // Arrange
      const sameCode = 'console.log("initial code");'

      // Act
      codeHistory.codeContent.value = sameCode
      codeHistory.saveCode()

      // Assert: Status sync tidak berubah menjadi dirty
      expect(projectStore.syncStatus).toBe('synced')
    })
  })
})