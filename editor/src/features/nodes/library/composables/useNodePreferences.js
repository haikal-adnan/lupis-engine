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

const favoriteNodesIds = ref(getStorageItem('lupis-fav-nodes'));
const recentNodesIds = ref(getStorageItem('lupis-recent-nodes'));

export function useNodePreferences() {
  const { nodeGroups } = useNodeBlueprint();

  const allNodesMap = computed(() => {
    const map = new Map();
    nodeGroups.forEach(g => {
      g.items?.forEach(item => map.set(item.type, item));
    });
    return map;
  });

  const favoriteNodes = computed(() => 
    favoriteNodesIds.value.map(id => allNodesMap.value.get(id)).filter(Boolean)
  );
  
  const recentNodes = computed(() => 
    recentNodesIds.value.map(id => allNodesMap.value.get(id)).filter(Boolean)
  );

  const toggleFavorite = (node) => {
    const type = node.type || node;
    const isFav = favoriteNodesIds.value.includes(type);
    
    if (isFav) {
      favoriteNodesIds.value = favoriteNodesIds.value.filter(id => id !== type);
    } else {
      favoriteNodesIds.value = [...favoriteNodesIds.value, type];
    }
    
    localStorage.setItem('lupis-fav-nodes', JSON.stringify(favoriteNodesIds.value));
  };

  const addToRecent = (type) => {
    let recents = recentNodesIds.value.filter(id => id !== type);
    recents.unshift(type); 
    if (recents.length > 15) recents.pop(); 
    
    recentNodesIds.value = recents;
    localStorage.setItem('lupis-recent-nodes', JSON.stringify(recents));
  };

  const isFavorite = (node) => favoriteNodesIds.value.includes(node.type || node);

  return {
    favoriteNodes,
    recentNodes,
    toggleFavorite,
    addToRecent,
    isFavorite
  };
}