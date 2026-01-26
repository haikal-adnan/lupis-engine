import { ref } from 'vue'
import { Copy, Trash2 } from 'lucide-vue-next'
import { GenerateUUID } from '@/commons/utils/generateUUID.js'
import { useScriptStore } from '@/stores/useScriptStore'

export function useNodeMenu() {
  const store = useScriptStore()
  const contextMenu = ref({ visible: false, x: 0, y: 0, items: [], nodeId: null })

  const handlers = {
    duplicateNode: (nodeId) => {
      const originalNode = store.activeScript.nodes.find(n => n._id === nodeId)
      if (!originalNode) return

      const newNode = JSON.parse(JSON.stringify(originalNode))
      newNode._id = GenerateUUID()
      newNode.position.x += 50
      newNode.position.y += 50
      
      store.addNodeToActive(newNode)
    },
    
    deleteNode: (nodeId) => {
      store.removeNodeFromActive(nodeId) 
    }
  }

  const openMenu = (event, node) => {
    store.setSelectedNode(node._id)

    const items = [
      { 
        label: 'Duplicate Node', 
        icon: Copy, 
        shortcut: 'Ctrl+D', 
        action: () => handlers.duplicateNode(node._id) 
      },
      { separator: true },
      { 
        label: 'Delete Node', 
        icon: Trash2, 
        shortcut: 'Del', 
        action: () => handlers.deleteNode(node._id) 
      }
    ]

    contextMenu.value = {
      visible: true,
      x: event.clientX,
      y: event.clientY,
      items,
      nodeId: node._id
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
