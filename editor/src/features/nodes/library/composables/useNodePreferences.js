import { ref, computed } from 'vue';
import { useNodeBlueprint } from '@nodes/nodes.js';

const getStorageItem = (key, fallback = []) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    }
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
  }
  return fallback;
};

// Batasi maksimal 10 item saat memuat dari localStorage
const recentNodesIds = ref(getStorageItem('lupis-recent-nodes').slice(0, 10));

export function useNodePreferences() {
  const { nodeGroups } = useNodeBlueprint();

  const allNodesMap = computed(() => {
    const map = new Map();
    nodeGroups.forEach(g => {
      g.items?.forEach(item => map.set(item.type, item));
    });
    return map;
  });

  const recentNodes = computed(() => 
    recentNodesIds.value.map(id => allNodesMap.value.get(id)).filter(Boolean)
  );

  const addToRecent = (nodeOrType) => {
    const type = typeof nodeOrType === 'object' ? nodeOrType?.type : nodeOrType;
    if (!type) return;

    let recents = recentNodesIds.value.filter(id => id !== type);
    recents.unshift(type); 
    
    // Batasi hingga 10 item
    if (recents.length > 10) recents.pop(); 
    
    recentNodesIds.value = recents;
    localStorage.setItem('lupis-recent-nodes', JSON.stringify(recents));
  };

  return {
    recentNodes,
    addToRecent
  };
}