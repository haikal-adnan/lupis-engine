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

  watch(
    () => targetNode.value?.outputs,
    (newOutputs, oldOutputs) => {
      const node = targetNode.value
      if (!node || !oldOutputs) return

      const hasPropertyOptions = Array.isArray(node.data?.propertyOptions) && node.data.propertyOptions.length > 0

      if (node.allowDynamicOutputs && !hasPropertyOptions) {
        resetCodeToBlueprint()
      }
    },
    { deep: true }
  )

  const resetCodeToBlueprint = () => {
    const node = targetNode.value
    if (!node) return

    const blueprintItem = scriptStore.blueprints
      ?.flatMap(group => group.items || [])
      .find(item => item.type === node.type)

    if (blueprintItem?.defaultData?.data?.code) {
      const defaultCode = blueprintItem.defaultData.data.code
      codeContent.value = defaultCode
      commitCode(defaultCode)
    }
  }

  const commitCode = (newCode) => {
    if (!targetNode.value || !extractedNodeId.value) return
    const nodeId = extractedNodeId.value
    const oldValue = snapshotBeforeEdit

    if (oldValue === newCode) return

    scriptStore.updateNodeInActive(nodeId, {
      data: {
        ...targetNode.value.data,
        code: newCode
      }
    })

    recordNodeDataChange(nodeId, 'data.code', oldValue, newCode)

    projectStore.markAsDirty()
    snapshotBeforeEdit = newCode
    isDirty.value = false
  }

  const handleCodeInput = () => {
    isDirty.value = true
    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(() => {
      commitCode(codeContent.value)
    }, debounceMs)
  }

  const saveCode = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    commitCode(codeContent.value)
  }

  const resetCode = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    resetCodeToBlueprint()
  }

  const undo = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      commitCode(codeContent.value)
    }
    globalUndo()
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