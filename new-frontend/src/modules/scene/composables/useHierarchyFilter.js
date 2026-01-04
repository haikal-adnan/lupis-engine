import { ref, computed } from 'vue';

export function useHierarchyFilter(treeData) {
  const searchQuery = ref('');

  const filteredData = computed(() => {
    if (!searchQuery.value) return treeData.value;
    
    const query = searchQuery.value.toLowerCase();

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const matches = node.name.toLowerCase().includes(query);
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        
        // Simpan jika nama match ATAU punya anak yang match
        if (matches || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };

    return filterNodes(treeData.value);
  });

  return {
    searchQuery,
    filteredData
  };
}