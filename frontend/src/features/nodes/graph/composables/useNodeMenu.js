import { ref } from 'vue'
import { Copy, Trash2, Code } from 'lucide-vue-next'
import { GenerateUUID } from '@utils/utils.js'
import { useScriptStore } from '@scripts/scripts.js'
import { useWorkspaceStore } from '@workspaces/workspaces.js'
import { useScriptHistory } from '@historys/historys.js'

export function useNodeMenu() {
  const store = useScriptStore()
  const workspaceStore = useWorkspaceStore()
  const scriptHistory = useScriptHistory()
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

      // 1. Dapatkan Objek Node yang akan dihapus
      const nodesToDelete = store.activeScript.nodes.filter(n => targetIds.includes(n.id))
      
      // 2. Dapatkan Edge yang terhubung ke Node-Node tersebut
      const connectedEdges = store.activeScript.edges.filter(e => 
        targetIds.includes(e.source) || targetIds.includes(e.target)
      )

      // 3. Catat transaksi ke History sebelum perubahan diterapkan di store
      scriptHistory.recordRemoveNodes(nodesToDelete, connectedEdges)

      // 4. Hapus dari Store
      targetIds.forEach(id => {
        store.removeNodeFromActive(id)
      })

      store.setSelectedNodes([])
      store.setSelectedNode(null)
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

    const items = [
      { 
        label: 'Edit Code', 
        icon: Code, 
        action: () => handlers.openCodeEditor(node) 
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
    ]

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      items,
      nodeId: node.id
    }
  }

  const closeMenu = () => {
    contextMenu.value.visible = false
  }

  return {
    contextMenu,
    openMenu,
    closeMenu
  }
}