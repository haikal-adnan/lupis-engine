<template>
  <div 
    class="h-full flex flex-col bg-background text-foreground select-none"
    @click="closeMenu"
    @contextmenu.prevent="handleContextMenu($event, null)"
  >
    <div class="flex items-center gap-2 px-3 h-10 border-b border-border bg-background shrink-0">
      <button 
        @click.stop="toggleView" 
        class="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
      >
        <component :is="viewMode === 'grid' ? List : LayoutGrid" class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 text-xs font-medium">
        <Box class="w-3.5 h-3.5 text-purple-500" />
        <span>Prefabs</span>
        <span class="bg-secondary px-1.5 rounded-full text-[10px]">{{ filteredItems.length }}</span>
      </div>

      <div class="flex-1"></div>

      <div class="flex bg-secondary/50 p-0.5 rounded-md h-7">
        <button 
          @click="activeTab = 'world'"
          class="px-2 flex items-center justify-center text-[10px] rounded-sm transition-colors font-medium"
          :class="activeTab === 'world' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        >
          World
        </button>
        <button 
          @click="activeTab = 'ui'"
          class="px-2 flex items-center justify-center text-[10px] rounded-sm transition-colors font-medium"
          :class="activeTab === 'ui' ? 'bg-pink-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'"
        >
          UI
        </button>
      </div>

      <BaseSearchInput v-model="searchQuery" placeholder="Search..." />
    </div>

    <div class="flex-1 overflow-y-auto p-2 bg-background/50" @contextmenu.prevent>
      <div v-if="viewMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
        <PrefabItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="grid"
          :active="selectedId === item.id"
          @click="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-else class="flex flex-col gap-1">
        <PrefabItem 
          v-for="item in filteredItems" 
          :key="item.id" 
          :data="item" 
          view-mode="list"
          :active="selectedId === item.id"
          @click="handleSelect(item)"
          @contextmenu.prevent.stop="handleContextMenu($event, item)"
        />
      </div>

      <div v-if="filteredItems.length === 0" class="h-full flex flex-col items-center justify-center text-muted-foreground/50">
        <Box class="w-8 h-8 mb-2 opacity-20" />
        <span class="text-xs">No {{ activeTab }} prefabs found.</span>
      </div>
    </div>

    <Teleport to="body">
      <BaseContextMenu 
        v-if="menu.visible"
        :position="{ x: menu.x, y: menu.y }"
        :items="contextMenuItems"
        @close="closeMenu"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { 
  LayoutGrid, List, Box, 
  PlusSquare, Edit3, Trash2, RefreshCw, Copy, Layers, Plus,
  Folder 
} from 'lucide-vue-next';

import { usePrefabStore } from '@/stores/usePrefabStore.js';
import { useSceneStore } from '@/stores/scene/useSceneStore.js';
import { usePrefabActions } from '@/modules/prefab/composables/usePrefabActions.js';

import BaseSearchInput from '@/commons/components/inputs/BaseSearchInput.vue';
import BaseContextMenu from '@/commons/components/overlay/BaseContextMenu.vue';
import PrefabItem from '@/modules/prefab/parts/PrefabItem.vue';

const store = usePrefabStore();
const sceneStore = useSceneStore();
const { selectedEntityIds, activeLayers } = storeToRefs(sceneStore);

const { 
  createPrefab, 
  deletePrefab, 
  duplicatePrefab, 
  renamePrefab,
  linkPrefabToEntities,
  instantiatePrefab 
} = usePrefabActions();

const searchQuery = ref('');
const selectedId = ref(null);
const activeTab = ref('world');
const viewMode = ref('grid');
const menu = ref({ visible: false, x: 0, y: 0, item: null });

const allPrefabs = computed(() => store.getAllPrefabs);

const filteredItems = computed(() => {
  let list = allPrefabs.value.filter(p => {
    const type = p.originalData?.data?.type || 'world'; 
    return activeTab.value === 'ui' ? type === 'ui' : type !== 'ui';
  });

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    list = list.filter(item => item.name.toLowerCase().includes(query));
  }
  return list;
});

const contextLayers = computed(() => {
  if (!activeLayers.value) return [];
  return activeLayers.value.filter(layer => layer._section === activeTab.value);
});

const handleSelect = (item) => {
  selectedId.value = item.id;
};

const handleRenameRequest = (item) => {
  renamePrefab(item.id); 
};

const toggleView = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

const handleContextMenu = (e, item) => {
  if (item) handleSelect(item);
  
  menu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item: item
  };
};

const closeMenu = () => {
  menu.value.visible = false;
};

const contextMenuItems = computed(() => {
  const targetItem = menu.value.item;

  if (targetItem) {
    const items = [
      { label: targetItem.name, disabled: true },
      { separator: true },
    ];

    items.push({ 
        label: 'Instantiate to...', 
        icon: PlusSquare,
        children: contextLayers.value.map(layer => ({
            label: layer.name,
            icon: Layers, 
            action: () => instantiatePrefab(targetItem.id, { 
                parentId: layer._id,
                parentName: layer.name 
            })
        }))
    });

    if (selectedEntityIds.value.length > 0) {
      items.push({ 
        label: `Link to Selected (${selectedEntityIds.value.length})`, 
        icon: Layers, 
        action: () => linkPrefabToEntities(targetItem.id, selectedEntityIds.value) 
      });
    }

    items.push(
      { separator: true },
      { label: 'Rename', icon: Edit3, action: () => handleRenameRequest(targetItem) },
      { label: 'Duplicate', icon: Copy, action: () => duplicatePrefab(targetItem.id) },
      { separator: true },
      { label: 'Delete', icon: Trash2, shortcut: 'Del', action: () => deletePrefab(targetItem.id) }
    );

    return items;
  }

  return [
    { label: 'Refresh Library', icon: RefreshCw, action: () => console.log('Refresh') }
  ];
});
</script>