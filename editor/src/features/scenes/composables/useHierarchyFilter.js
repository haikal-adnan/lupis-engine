import { ref, computed } from 'vue';

export function useHierarchyFilter(treeData) {
  const searchQuery = ref('');

  const filteredData = computed(() => {
    if (!searchQuery.value || !searchQuery.value.trim()) {
      return treeData.value;
    }

    const query = searchQuery.value.toLowerCase().trim();

    // Fungsi rekursif untuk memfilter node (Layer atau Entity)
    const filterNodes = (nodes) => {
      if (!Array.isArray(nodes)) return [];

      return nodes.reduce((acc, node) => {
        // Cek apakah name atau scriptId cocok dengan query
        const nameMatch = node.name && node.name.toLowerCase().includes(query);
        const scriptIdMatch = node.scriptId && node.scriptId.toLowerCase().includes(query);
        const matches = nameMatch || scriptIdMatch;

        // Cari rekursif ke anak-anaknya (child entities/nodes)
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        // Sertakan node jika node itu sendiri cocok ATAU jika ada anak yang cocok
        if (matches || filteredChildren.length > 0) {
          acc.push({ 
            ...node, 
            children: filteredChildren 
          });
        }
        return acc;
      }, []);
    };

    // Filter worldTree dan uiTree secara terpisah
    return {
      worldTree: filterNodes(treeData.value?.worldTree || []),
      uiTree: filterNodes(treeData.value?.uiTree || [])
    };
  });

  return {
    searchQuery,
    filteredData
  };
}