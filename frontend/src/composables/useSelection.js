import { ref, shallowRef, triggerRef } from "vue";

const selectedEntity = shallowRef(null);
const isMultiSelection = ref(false);
// Tambahkan state baru untuk mengetahui konteks seleksi
const selectionMode = ref('SCENE'); // 'SCENE' | 'ASSET'

export function useSelection() {
  
  const initSelectionListener = (bus) => {
    // Fungsi helper untuk handle logika update state
    const updateSelection = (list, mode) => {
      selectionMode.value = mode; // Set mode (SCENE atau ASSET)

      if (list && list.length > 0) {
        selectedEntity.value = list[0]; 
        isMultiSelection.value = list.length > 1;
      } else {
        selectedEntity.value = null;
        isMultiSelection.value = false;
      }
    };

    // 1. Handle Selection dari SCENE (Canvas/Hierarchy)
    bus.on("entity:selected", (list) => {
       updateSelection(list, 'SCENE');
    });

    // 2. Handle Selection dari PREFAB/ASSET (Baru)
    bus.on("prefab:selected", (list) => {
       updateSelection(list, 'ASSET');
    });

    // Handle Deselect
    bus.on("entity:deselected", () => {
      selectedEntity.value = null;
      selectionMode.value = 'SCENE'; // Reset ke default
    });

    // ... (kode modified listener tetap sama) ...
    bus.on("entity:modified", (payload) => {
       const list = Array.isArray(payload) ? payload : [payload];
       if (selectedEntity.value) {
         const updated = list.find(e => e._id === selectedEntity.value._id);
         if (updated) triggerRef(selectedEntity); 
       }
    });
  };

  return {
    selectedEntity,
    isMultiSelection,
    selectionMode, // Return ini agar bisa dipakai di Component lain
    initSelectionListener
  };
}