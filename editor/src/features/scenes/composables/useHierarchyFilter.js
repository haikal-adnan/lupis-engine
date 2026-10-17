import { ref, computed } from 'vue';

export function useHierarchyFilter(treeData) {
  const searchQuery = ref('');

  const filteredData = computed(() => {
    if (!searchQuery.value || !searchQuery.value.trim()) {
      return treeData.value;
    }

    const query = searchQuery.value.toLowerCase().trim();

    // Recursive function to filter nodes (Layer or Entity)
    const filterNodes = (nodes) => {
      if (!Array.isArray(nodes)) return [];

      return nodes.reduce((acc, node) => {
        // Check if scriptId matches query
        const matches = Boolean(node.scriptId && node.scriptId.toLowerCase().includes(query));

        // Search recursively into children (child entities/nodes)
        const filteredChildren = node.children ? filterNodes(node.children) : [];

        // Include node if the node itself matches OR if any child matches
        if (matches || filteredChildren.length > 0) {
          acc.push({ 
            ...node, 
            children: filteredChildren 
          });
        }
        return acc;
      }, []);
    };

    // Filter worldTree and uiTree separately
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