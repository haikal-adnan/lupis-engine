import { ref, shallowRef, triggerRef } from "vue";

const selectedEntity = shallowRef(null);
const isMultiSelection = ref(false);

export function useSelection() {
  
  const initSelectionListener = (bus) => {
    // 1. Handle Selection
    bus.on("entity:selected", (list) => {
      if (list && list.length > 0) {
        selectedEntity.value = list[0]; 
        isMultiSelection.value = list.length > 1;
      } else {
        selectedEntity.value = null;
        isMultiSelection.value = false;
      }
    });

    // 2. Handle Deselection
    bus.on("entity:deselected", () => {
      selectedEntity.value = null;
    });

    // 3. Handle Modification (Realtime dari Engine)
    bus.on("entity:modified", (payload, isTransient = false) => {
       const list = Array.isArray(payload) ? payload : [payload];
       
       // Cek apakah entity yang sedang dipilih ikut berubah
       if (selectedEntity.value) {
         const updated = list.find(e => e._id === selectedEntity.value._id);
         if (updated) {
           // Force Reactivity Vue karena kita memutasi properti dalam ShallowRef
           triggerRef(selectedEntity); 
         }
       }
    });
  };

  return {
    selectedEntity,
    isMultiSelection,
    initSelectionListener
  };
}