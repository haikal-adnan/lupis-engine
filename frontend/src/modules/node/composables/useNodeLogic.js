// src/modules/script/composables/useNodeLogic.js
import { computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore.js';

export function useNodeLogic() {
  const scriptStore = useScriptStore();

  // 1. Ambil Node yang sedang diseleksi
  // Asumsi: scriptStore memiliki state 'selectedNodeId'
  const selectedNode = computed(() => {
    if (!scriptStore.activeScript || !scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n._id === scriptStore.selectedNodeId);
  });

  // 2. Helper untuk Binding Properti Node (Settings/Data)
  // path contoh: 'settings.headerTitle' atau 'data.speed'
  function bindNodeProp(path) {
    return computed({
      get: () => {
        if (!selectedNode.value) return undefined;
        return path.split('.').reduce((o, i) => o?.[i], selectedNode.value);
      },
      set: (val) => {
        if (!selectedNode.value) return;
        
        // Buat objek update partial
        const keys = path.split('.');
        const lastKey = keys.pop();
        const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: val });
        
        // Kirim ke store
        scriptStore.updateNodeInActive(selectedNode.value._id, deepObj);
      }
    });
  }

  // 3. Actions
  function deleteSelectedNode() {
    if (selectedNode.value && confirm('Delete this node?')) {
        scriptStore.removeNodeFromActive(selectedNode.value._id);
        scriptStore.selectedNodeId = null; // Clear selection
    }
  }

  return {
    selectedNode,
    scriptStore,
    bindNodeProp,
    deleteSelectedNode
  };
}