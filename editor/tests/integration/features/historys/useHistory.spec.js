import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useHistory } from '@historys/historys.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useSceneStore } from '@scenes/scenes.js'
import { setupMockSceneEnvironment } from '@tests/tests.js'

describe('useHistory Integration', () => {
  let workspaceStore
  let sceneStore
  let history
  let historyStoreRef

  // Helper untuk membaca key aktif secara presisi
  const getExpectedKey = () => {
    const tab = workspaceStore.activeTab
    if (!tab) return null
    if (tab.type === 'scene' && sceneStore.activeSceneId) {
      return `scene_${sceneStore.activeSceneId}`
    }
    return `tab_${tab.id}`
  }

  beforeEach(() => {
    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia())

    workspaceStore = useWorkspaceStore()
    sceneStore = useSceneStore()

    // Setup active scene dan tab workspace
    const { scene } = setupMockSceneEnvironment()
    sceneStore.activeSceneId = scene.id

    const tabId = 'scene_tab_1'
    workspaceStore.tabs = [
      { id: tabId, name: 'Scene Editor', type: 'scene', sceneId: scene.id }
    ]
    workspaceStore.setActiveTab(tabId)

    // Inisialisasi composable useHistory & dapatkan referensi store global
    history = useHistory({ maxHistory: 3 })
    historyStoreRef = typeof window !== 'undefined' ? window.__HISTORY_STORE__ : {}

    // Clean up objek store sebelum tiap test
    if (historyStoreRef) {
      Object.keys(historyStoreRef).forEach((k) => delete historyStoreRef[k])
    }
  })

  afterEach(() => {
    if (history && typeof history.cleanupListeners === 'function') {
      history.cleanupListeners()
    }
    vi.restoreAllMocks()
  })

  describe('Record & Transaction Consolidation Integration', () => {
    it('records action to undo stack under current history key', () => {
      // Arrange
      const undoFn = vi.fn()
      const redoFn = vi.fn()
      const action = { type: 'TEST_ACTION', undo: undoFn, redo: redoFn }

      // Act
      history.record(action)

      // Assert
      const key = getExpectedKey()
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].undoStack).toHaveLength(1)
      expect(historyStoreRef[key].undoStack[0].type).toBe('TEST_ACTION')
    })

    it('merges continuous transactions with identical transactionKey instead of creating new entries', () => {
      // Arrange
      const undoFn1 = vi.fn()
      const redoFn1 = vi.fn()
      const redoFn2 = vi.fn()

      const action1 = {
        type: 'DRAG_PROP',
        transactionKey: 'trans_drag_1',
        undo: undoFn1,
        redo: redoFn1
      }

      const action2 = {
        type: 'DRAG_PROP',
        transactionKey: 'trans_drag_1',
        undo: undoFn1,
        redo: redoFn2
      }

      // Act
      history.record(action1)
      history.record(action2)

      // Assert: Stack undo hanya berisi 1 item, dengan redoFn diperbarui ke redoFn2
      const key = getExpectedKey()
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].undoStack).toHaveLength(1)
      expect(historyStoreRef[key].undoStack[0].redo).toBe(redoFn2)
    })

    it('enforces maxHistory limit by shifting oldest action when limit is exceeded', () => {
      // Arrange: History dikonfigurasi dengan maxHistory = 3
      const action1 = { type: 'ACTION_1', undo: vi.fn(), redo: vi.fn() }
      const action2 = { type: 'ACTION_2', undo: vi.fn(), redo: vi.fn() }
      const action3 = { type: 'ACTION_3', undo: vi.fn(), redo: vi.fn() }
      const action4 = { type: 'ACTION_4', undo: vi.fn(), redo: vi.fn() }

      // Act
      history.record(action1)
      history.record(action2)
      history.record(action3)
      history.record(action4)

      // Assert: Aksi pertama tergeser (shifted), sisa aksi 2, 3, dan 4
      const key = getExpectedKey()
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].undoStack).toHaveLength(3)
      expect(historyStoreRef[key].undoStack[0].type).toBe('ACTION_2')
      expect(historyStoreRef[key].undoStack[2].type).toBe('ACTION_4')
    })
  })

  describe('Undo and Redo Flow Integration', () => {
    it('executes undo callback, pops action from undo stack, and pushes it onto redo stack', () => {
      // Arrange
      const undoFn = vi.fn()
      const redoFn = vi.fn()
      const action = { type: 'MUTATE_STATE', undo: undoFn, redo: redoFn }

      history.record(action)
      const key = getExpectedKey()

      // Act
      history.undo()

      // Assert
      expect(undoFn).toHaveBeenCalledTimes(1)
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].undoStack).toHaveLength(0)
      expect(historyStoreRef[key].redoStack).toHaveLength(1)
      expect(historyStoreRef[key].redoStack[0].type).toBe('MUTATE_STATE')
    })

    it('executes redo callback, pops action from redo stack, and pushes it back onto undo stack', () => {
      // Arrange
      const undoFn = vi.fn()
      const redoFn = vi.fn()
      const action = { type: 'MUTATE_STATE', undo: undoFn, redo: redoFn }

      history.record(action)
      history.undo()
      const key = getExpectedKey()

      // Act
      history.redo()

      // Assert
      expect(redoFn).toHaveBeenCalledTimes(1)
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].undoStack).toHaveLength(1)
      expect(historyStoreRef[key].redoStack).toHaveLength(0)
    })

    it('clears redo stack whenever a new action is recorded', () => {
      // Arrange
      const action1 = { type: 'ACTION_1', undo: vi.fn(), redo: vi.fn() }
      const action2 = { type: 'ACTION_2', undo: vi.fn(), redo: vi.fn() }

      history.record(action1)
      history.undo()

      const key = getExpectedKey()
      expect(historyStoreRef[key]).toBeDefined()
      expect(historyStoreRef[key].redoStack).toHaveLength(1)

      // Act: Catat aksi baru saat redo stack memiliki isi
      history.record(action2)

      // Assert
      expect(historyStoreRef[key].redoStack).toHaveLength(0)
      expect(historyStoreRef[key].undoStack).toHaveLength(1)
      expect(historyStoreRef[key].undoStack[0].type).toBe('ACTION_2')
    })
  })

  describe('Automatic Store Cleanup via Watcher', () => {
    it('removes history entry when a closed tab or deleted scene is removed from store', async () => {
      // Arrange
      const tabId = 'tab_script_99'
      workspaceStore.openTab({ id: tabId, name: 'Test Script', type: 'diagram' })

      // Record aksi pada tab baru ini (`tab_tab_script_99`)
      history.record({ type: 'SCRIPT_EDIT', undo: vi.fn(), redo: vi.fn() })
      expect(historyStoreRef[`tab_${tabId}`]).toBeDefined()

      // Act: Tutup tab dari workspaceStore dan tunggu ticks Vue watcher
      workspaceStore.closeTab(tabId)
      await nextTick()

      // Assert: Memory key untuk tab yang ditutup otomatis dibersihkan oleh watcher
      expect(historyStoreRef[`tab_${tabId}`]).toBeUndefined()
    })
  })

  describe('Keyboard Shortcuts Handling', () => {
    it('triggers undo on Ctrl+Z and redo on Ctrl+Y or Ctrl+Shift+Z', () => {
      // Arrange
      const undoFn = vi.fn()
      const redoFn = vi.fn()

      history.setupListeners()
      history.record({ type: 'SHORTCUT_TEST', undo: undoFn, redo: redoFn })

      const ctrlZ = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: false })
      const ctrlShiftZ = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true })

      // Act & Assert: Trigger Ctrl+Z (Undo)
      window.dispatchEvent(ctrlZ)
      expect(undoFn).toHaveBeenCalledTimes(1)

      // Act & Assert: Trigger Ctrl+Shift+Z (Redo)
      window.dispatchEvent(ctrlShiftZ)
      expect(redoFn).toHaveBeenCalledTimes(1)
    })

    it('[Bad Path] ignores keyboard shortcuts when input or textarea elements are focused', () => {
      // Arrange
      const undoFn = vi.fn()
      history.setupListeners()
      history.record({ type: 'INPUT_FOCUS_TEST', undo: undoFn, redo: vi.fn() })

      const inputElement = document.createElement('input')
      document.body.appendChild(inputElement)

      const ctrlZ = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })

      // Act: Dispatch event dari elemen input
      inputElement.dispatchEvent(ctrlZ)

      // Assert: Action undo tidak dipanggil karena sedang fokus pada elemen input
      expect(undoFn).not.toHaveBeenCalled()
      document.body.removeChild(inputElement)
    })
  })

  describe('Edge Cases and Guard Clauses', () => {
    it('[Bad Path] handles undo and redo gracefully when history stack is empty', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // Act & Assert
      expect(() => history.undo()).not.toThrow()
      expect(() => history.redo()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Undo stack empty'), expect.any(String))
    })

    it('[Bad Path] ignores record call when no active tab or active history key exists', () => {
      // Arrange
      workspaceStore.tabs = []
      workspaceStore.activeTabId = null

      // Act
      history.record({ type: 'NO_TAB_ACTION', undo: vi.fn(), redo: vi.fn() })

      // Assert
      const activeKeys = Object.keys(historyStoreRef || {}).filter(
        (k) => historyStoreRef[k]?.undoStack?.length > 0
      )
      expect(activeKeys).toHaveLength(0)
    })
  })
})