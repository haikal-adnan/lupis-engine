import { ref } from 'vue'
import { Copy, Trash2, Code, RotateCcw, RefreshCw, Cpu, Save } from 'lucide-vue-next'
import { GenerateUUID } from '@utils/utils.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptHistory } from '@historys/historys.js'
import { useProjectStore } from '@projects/projects.js'
import { usePopAlert, usePrompt, useConfirm } from '@composables/composables.js'
import { resetNodeToDefault, overrideNodeFromBlueprint } from '@nodes/library/composables/useNodeOverride.js'
import { createCustomNodeInstance } from '@nodes/library/composables/useNodeBlueprint.js'
import { isUserCustomNode, saveCustomBlueprintToLibrary } from '../../inspector/layouts/custom/index.js'

export function useNodeMenu() {
  const store = useScriptStore()
  const workspaceStore = useWorkspaceStore()
  const scriptHistory = useScriptHistory()
  const projectStore = useProjectStore()
  const popAlertComposable = typeof usePopAlert === 'function' ? usePopAlert() : null
  const showPop = popAlertComposable?.showPop || (() => {})
  const promptComposable = typeof usePrompt === 'function' ? usePrompt() : null
  const prompt = promptComposable?.prompt || (async () => null)
  const confirmComposable = typeof useConfirm === 'function' ? useConfirm() : null
  const confirm = confirmComposable?.confirm || (async () => true)
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [], nodeId: null })

  const handlers = {
    duplicateNode: (nodeId) => {
      const targetIds = store.selectedNodeIds.length > 0 ? store.selectedNodeIds : [nodeId]

      targetIds.forEach(id => {
        const originalNode = store.activeScript.nodes.find(n => n.id === id)
        if (!originalNode) return

        const newNode = JSON.parse(JSON.stringify(originalNode))
        newNode.id = GenerateUUID()
        newNode.position.x += 40
        newNode.position.y += 40
        
        store.addNodeToActive(newNode)
        scriptHistory.recordAddNode(newNode)
      })
    },
    
    deleteSelectedNodes: (nodeId) => {
      const targetIds = store.selectedNodeIds.length > 0 ? [...store.selectedNodeIds] : [nodeId]

      if (targetIds.length === 0) return

      const nodesToDelete = store.activeScript.nodes.filter(n => targetIds.includes(n.id))
      
      const connectedEdges = store.activeScript.edges.filter(e => 
        targetIds.includes(e.source) || targetIds.includes(e.target)
      )

      scriptHistory.recordRemoveNodes(nodesToDelete, connectedEdges)

      targetIds.forEach(id => {
        store.removeNodeFromActive(id)
      })

      store.setSelectedNodes([])
      store.setSelectedNode(null)
      store.saveActiveScript()
    },

    resetNode: (nodeId) => {
      const targetIds = store.selectedNodeIds.length > 0 ? [...store.selectedNodeIds] : [nodeId]
      if (!store.activeScript) return

      const oldNodes = JSON.parse(JSON.stringify(store.activeScript.nodes))
      const oldEdges = JSON.parse(JSON.stringify(store.activeScript.edges))

      targetIds.forEach(id => {
        const targetNode = store.activeScript.nodes.find(n => n.id === id)
        if (!targetNode) return
        resetNodeToDefault(targetNode, store.activeScript)
      })

      const newNodes = JSON.parse(JSON.stringify(store.activeScript.nodes))
      const newEdges = JSON.parse(JSON.stringify(store.activeScript.edges))

      if (scriptHistory?.recordOverrideNodes) {
        scriptHistory.recordOverrideNodes(oldNodes, oldEdges, newNodes, newEdges, 'Reset Node')
      }
      store.saveActiveScript()
    },

    applyUpdateToNode: (nodeId) => {
      const targetIds = store.selectedNodeIds.length > 0 ? [...store.selectedNodeIds] : [nodeId]
      if (!store.activeScript) return

      const oldNodes = JSON.parse(JSON.stringify(store.activeScript.nodes))
      const oldEdges = JSON.parse(JSON.stringify(store.activeScript.edges))

      targetIds.forEach(id => {
        const targetNode = store.activeScript.nodes.find(n => n.id === id)
        if (!targetNode) return
        overrideNodeFromBlueprint(targetNode, store.activeScript)
      })

      const newNodes = JSON.parse(JSON.stringify(store.activeScript.nodes))
      const newEdges = JSON.parse(JSON.stringify(store.activeScript.edges))

      if (scriptHistory?.recordOverrideNodes) {
        scriptHistory.recordOverrideNodes(oldNodes, oldEdges, newNodes, newEdges, 'Apply update to Node')
      }
      store.saveActiveScript()
    },

    openCodeEditor: (node) => {
      if (!node || !node.id) return
      const nodeTitle = node.settings?.headerTitle || 'Node'

      workspaceStore.openTab({
        id: `code_${node.id}`,
        name: `${nodeTitle}`,
        type: 'code_editor'
      })
    }
  }

  const openMenu = (event, node) => {
    if (!store.selectedNodeIds.includes(node.id)) {
      store.setSelectedNode(node.id)
    }

    const count = store.selectedNodeIds.length
    const deleteLabel = count > 1 ? `Delete Selected (${count})` : 'Delete Node'
    const duplicateLabel = count > 1 ? `Duplicate Selected (${count})` : 'Duplicate Node'
    const resetLabel = count > 1 ? `Reset Selected (${count})` : 'Reset Node'
    const updateLabel = count > 1 ? `Apply update to Selected (${count})` : 'Apply update to Node'

    const items = [
      { 
        label: 'Edit Code', 
        icon: Code, 
        action: () => handlers.openCodeEditor(node) 
      }
    ]

    if (isUserCustomNode(node)) {
      items.push({
        label: 'Save as Blueprint',
        icon: Save,
        action: async () => {
          await saveCustomBlueprintToLibrary(node, projectStore, { prompt, showPop })
        }
      })
    }

    items.push(
      { separator: true },
      {
        label: updateLabel,
        icon: RefreshCw,
        action: () => handlers.applyUpdateToNode(node.id)
      },
      {
        label: resetLabel,
        icon: RotateCcw,
        action: () => handlers.resetNode(node.id)
      },
      { separator: true },
      { 
        label: duplicateLabel, 
        icon: Copy, 
        shortcut: 'Ctrl+D', 
        action: () => handlers.duplicateNode(node.id) 
      },
      { separator: true },
      { 
        label: deleteLabel, 
        icon: Trash2, 
        shortcut: 'Del / Backspace', 
        action: () => handlers.deleteSelectedNodes(node.id) 
      }
    )

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      items,
      nodeId: node.id
    }
  }

  const openBackgroundMenu = (event, graphPos) => {
    const items = [
      { 
        label: 'Add Custom Node', 
        icon: Cpu, 
        action: () => {
          const newNode = createCustomNodeInstance(graphPos)
          store.addNodeToActive(newNode)
          scriptHistory.recordAddNode(newNode)
          store.setSelectedNode(newNode.id)
          showPop({
            title: 'Custom Node Added',
            message: 'A new custom node template has been added to the graph canvas.',
            type: 'success'
          })
        } 
      }
    ]

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      items,
      nodeId: null
    }
  }

  const closeMenu = () => {
    contextMenu.value.visible = false
  }

  return {
    contextMenu,
    openMenu,
    openBackgroundMenu,
    closeMenu
  }
}