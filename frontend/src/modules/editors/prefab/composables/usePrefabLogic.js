import { ref, computed } from 'vue';
import { usePrefabStore } from '@/stores/usePrefabStore.js';
import { usePrefabActions } from '@editors/prefab/composables/usePrefabActions.js';

export function usePrefabLogic() {
  const store = usePrefabStore();
  const { createPrefab, deletePrefab, renamePrefab, duplicatePrefab } = usePrefabActions(); 
  
  const searchQuery = ref('');
  const selectedId = ref(null);

  const items = computed(() => store.getAllPrefabs);

  const filteredItems = computed(() => {
    if (!searchQuery.value) return items.value;
    const query = searchQuery.value.toLowerCase();
    return items.value.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  });

  const handleSelect = (item) => {
    selectedId.value = item.id;
  };

  const handleCreateEmpty = () => {
    const newPrefab = createPrefab("New Prefab");
    if(newPrefab) handleSelect({ id: newPrefab._id });
  };

  const handleDelete = (item) => {
    deletePrefab(item.id);
    if (selectedId.value === item.id) selectedId.value = null;
  };

  const handleDuplicate = (item) => {
    duplicatePrefab(item.id);
  };
  
  const handleRename = (item) => {
      renamePrefab(item.id); 
  }

  return {
    searchQuery,
    selectedId,
    filteredItems,
    handleSelect,
    createEmptyPrefab: handleCreateEmpty,
    handleDelete,
    handleDuplicate,
    handleRename
  };
}