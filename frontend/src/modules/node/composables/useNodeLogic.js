// src/modules/node/composables/useNodeLogic.js

import { computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore.js';

export function useNodeLogic() {
  const scriptStore = useScriptStore();

  // 1. Mendapatkan Node yang sedang diseleksi
  const selectedNode = computed(() => {
    if (!scriptStore.activeScript || !scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n._id === scriptStore.selectedNodeId);
  });

  console.log(selectedNode)

  // 2. Helper untuk v-model binding ke properti node yang dalam (nested)
  // Contoh penggunaan: const myVal = bindNodeProp('data.settings.headerTitle')
  function bindNodeProp(path) {
    return computed({
      get: () => {
        if (!selectedNode.value) return undefined;
        // Mengambil value dari path string, misal "data.variableId"
        return path.split('.').reduce((o, i) => o?.[i], selectedNode.value);
      },
      set: (val) => {
        if (!selectedNode.value) return;
        
        // Membangun object nested untuk update parsial
        const keys = path.split('.');
        const lastKey = keys.pop();
        const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: val });
        
        // Update ke store
        scriptStore.updateNodeInActive(selectedNode.value._id, deepObj);
      }
    });
  }

  // 3. Menghapus Node yang sedang aktif
  function deleteSelectedNode() {
    if (selectedNode.value && confirm('Delete this node?')) {
        scriptStore.removeNodeFromActive(selectedNode.value._id);
        scriptStore.selectedNodeId = null; 
    }
  }

  // 4. Cek apakah input port tertentu sudah terhubung kabel
  function isInputConnected(inputKey) {
    if (!selectedNode.value || !scriptStore.activeScript) return false;
    
    return scriptStore.activeScript.edges.some(edge => 
      edge.target === selectedNode.value._id && 
      edge.targetHandle === inputKey
    );
  }

  // =========================================================
  // LOGIC BARU: DYNAMIC INPUTS
  // Digunakan untuk node seperti Format String, Sequence, dll
  // =========================================================

  const addDynamicInput = () => {
    if (!selectedNode.value) return;

    // Clone array inputs agar aman (immutability)
    const currentInputs = [...(selectedNode.value.inputs || [])];
    
    // Tentukan Index berikutnya (0, 1, 2...)
    const nextIndex = currentInputs.length;
    const newId = String(nextIndex);

    // Buat definisi Input baru
    const newInput = {
      _id: newId,
      label: `{${nextIndex}}`, // Label otomatis {0}, {1}, dst
      type: 'any',             // Type default
      dataType: 'any',         // Konsistensi nama properti
      color: '#fff'            // Warna putih (netral/any)
    };

    // Update Node di Store
    scriptStore.updateNodeInActive(selectedNode.value._id, { 
      inputs: [...currentInputs, newInput] 
    });
  };

  const removeDynamicInput = (inputId) => {
    if (!selectedNode.value) return;
    
    const currentInputs = [...(selectedNode.value.inputs || [])];
    
    // Safety: Jangan hapus jika sisa input tinggal 2 (opsional)
    if (currentInputs.length <= 2) {
        // Bisa diganti dengan toast notification
        console.warn("Minimum 2 inputs required."); 
        return;
    }

    // Cari index input yang akan dihapus
    const indexToRemove = currentInputs.findIndex(i => i._id === inputId);
    if (indexToRemove === -1) return;

    // Hapus dari array
    currentInputs.splice(indexToRemove, 1);

    // RE-INDEXING (Penting!)
    // Agar urutan label kembali rapi ({0}, {1}, {2}) setelah ada yang dihapus.
    // Tanpa ini, urutan akan lompat (misal: {0}, {2}) dan merusak logic format string.
    const reindexedInputs = currentInputs.map((inp, idx) => ({
        ...inp,
        _id: String(idx), // Reset ID sesuai urutan array baru
        label: `{${idx}}` // Reset Label sesuai urutan array baru
    }));
    
    // Catatan: Re-indexing akan memutus koneksi kabel pada port yang bergeser.
    // Jika ingin lebih canggih, logic update edges harus ditambahkan di store.
    
    // Update Node di Store
    scriptStore.updateNodeInActive(selectedNode.value._id, { 
      inputs: reindexedInputs 
    });
  };

  return {
    selectedNode,
    scriptStore,
    
    // Existing Helpers
    bindNodeProp,
    deleteSelectedNode,
    isInputConnected,

    // New Dynamic Logic
    addDynamicInput,
    removeDynamicInput
  };
}