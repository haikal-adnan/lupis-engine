// src/editors/graph/composables/useNodePreferences.js (sesuaikan path Anda)
import { ref, computed } from 'vue';
import { STATIC_NODE_GROUPS } from '@editors/variable/composables/useNodeBlueprint.js';

// Global state agar reaktif di semua komponen yang memanggilnya
const favoriteNodesIds = ref(JSON.parse(localStorage.getItem('lupis-fav-nodes') || '[]'));
const recentNodesIds = ref(JSON.parse(localStorage.getItem('lupis-recent-nodes') || '[]'));

export function useNodePreferences() {
  const allNodesMap = computed(() => {
    const map = new Map();
    STATIC_NODE_GROUPS.forEach(g => {
      g.items.forEach(item => map.set(item.type, item));
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
    const isFav = favoriteNodesIds.value.includes(node.type);
    if (isFav) {
      favoriteNodesIds.value = favoriteNodesIds.value.filter(id => id !== node.type);
    } else {
      favoriteNodesIds.value.push(node.type);
    }
    localStorage.setItem('lupis-fav-nodes', JSON.stringify(favoriteNodesIds.value));
  };

  const addToRecent = (type) => {
    let recents = [...recentNodesIds.value];
    recents = recents.filter(id => id !== type); // Hapus duplikat
    recents.unshift(type); // Tambah ke awal
    if (recents.length > 15) recents.pop(); // Max 15 recent
    recentNodesIds.value = recents;
    localStorage.setItem('lupis-recent-nodes', JSON.stringify(recents));
  };

  const isFavorite = (node) => favoriteNodesIds.value.includes(node.type);

  return {
    favoriteNodes,
    recentNodes,
    toggleFavorite,
    addToRecent,
    isFavorite
  };
}