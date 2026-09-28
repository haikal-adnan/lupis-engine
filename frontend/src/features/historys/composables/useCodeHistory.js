import { ref, watch, onUnmounted } from 'vue'
import { useScriptHistory } from '@historys/historys.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useProjectStore } from '@projects/projects.js'

export function useCodeHistory(extractedNodeId, targetNode, options = {}) {
  const debounceMs = options.debounceMs || 800
  const scriptStore = useScriptStore()
  const projectStore = useProjectStore()
  const { recordNodeDataChange, undo: globalUndo, redo: globalRedo } = useScriptHistory()

  const codeContent = ref('')
  const isDirty = ref(false)
  let debounceTimer = null
  let snapshotBeforeEdit = ''

  // Sinkronisasi nilai lokal ketika targetNode berubah/pindah tab
  watch(
    () => targetNode.value,
    (newNode) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      if (newNode && newNode.data) {
        codeContent.value = newNode.data.code || ''
        snapshotBeforeEdit = codeContent.value
      } else {
        codeContent.value = ''
        snapshotBeforeEdit = ''
      }
      isDirty.value = false
    },
    { immediate: true }
  )

  // Auto Reset Kode dari Blueprint saat terjadi perubahan Dynamic Output Ports (khusus tanpa propertyOptions)
  watch(
    () => targetNode.value?.outputs,
    (newOutputs, oldOutputs) => {
      const node = targetNode.value
      if (!node || !oldOutputs) return

      const hasPropertyOptions = Array.isArray(node.data?.propertyOptions) && node.data.propertyOptions.length > 0

      // Reset otomatis hanya berjalan jika allowDynamicOutputs = true DAN tidak ada propertyOptions
      if (node.allowDynamicOutputs && !hasPropertyOptions) {
        resetCodeToBlueprint()
      }
    },
    { deep: true }
  )

  // Reset Kode ke Template Blueprint Asli
  const resetCodeToBlueprint = () => {
    const node = targetNode.value
    if (!node) return

    // Cari blueprint item asli berdasarkan tipe node
    const blueprintItem = scriptStore.blueprints
      ?.flatMap(group => group.items || [])
      .find(item => item.type === node.type)

    if (blueprintItem?.defaultData?.data?.code) {
      const defaultCode = blueprintItem.defaultData.data.code
      codeContent.value = defaultCode
      commitCode(defaultCode)
    }
  }

  // Fungsi Komit ke Pinia & Simpan Record ke History Engine
  const commitCode = (newCode) => {
    if (!targetNode.value || !extractedNodeId.value) return
    const nodeId = extractedNodeId.value
    const oldValue = snapshotBeforeEdit

    if (oldValue === newCode) return

    // 1. Simpan ke ScriptStore (Pinia)
    scriptStore.updateNodeInActive(nodeId, {
      data: {
        ...targetNode.value.data,
        code: newCode
      }
    })

    // 2. Transaksikan ke History Stack (Terisolasi per-tab / node via history key)
    recordNodeDataChange(nodeId, 'data.code', oldValue, newCode)

    // 3. Update state lokal
    projectStore.markAsDirty()
    snapshotBeforeEdit = newCode
    isDirty.value = false
  }

  // Auto Save dengan Debounce saat ada input teks
  const handleCodeInput = () => {
    isDirty.value = true
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
      commitCode(codeContent.value)
    }, debounceMs)
  }

  // Manual Save (Langsung mengabaikan timer debounce)
  const saveCode = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    commitCode(codeContent.value)
  }

  // Reset Teks ke State Terakhir di Pinia / Reset ke Blueprint
  const resetCode = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    resetCodeToBlueprint()
  }

  // Handler Undo / Redo khusus Code Panel
  const undo = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      commitCode(codeContent.value)
    }
    globalUndo()
    // Update tampilan editor lokal setelah undo diproses store
    if (targetNode.value?.data) {
      codeContent.value = targetNode.value.data.code || ''
      snapshotBeforeEdit = codeContent.value
      isDirty.value = false
    }
  }

  const redo = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      commitCode(codeContent.value)
    }
    globalRedo()
    if (targetNode.value?.data) {
      codeContent.value = targetNode.value.data.code || ''
      snapshotBeforeEdit = codeContent.value
      isDirty.value = false
    }
  }

  // Keydown Handler untuk Shortcut Ctrl+Z / Ctrl+Y / Ctrl+S di Textarea
  const handleEditorKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey
    if (!isCtrl) return

    const key = e.key.toLowerCase()
    if (key === 'z') {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
    } else if (key === 'y') {
      e.preventDefault()
      redo()
    } else if (key === 's') {
      e.preventDefault()
      saveCode()
    }
  }

  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      // Commit sisa perubahan saat komponen di-unmount/ditutup
      if (isDirty.value) {
        commitCode(codeContent.value)
      }
    }
  })

  return {
    codeContent,
    isDirty,
    handleCodeInput,
    saveCode,
    resetCode,
    resetCodeToBlueprint,
    undo,
    redo,
    handleEditorKeyDown
  }
}