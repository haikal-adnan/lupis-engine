<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div class="w-[900px] h-[650px] bg-card border border-border rounded-xl shadow-2xl flex flex-col relative overflow-hidden" @mousedown.stop>
          
          <div class="p-5 border-b border-border bg-muted/10 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Component class="w-5 h-5 text-foreground" /> Node Blueprint Library
                </h2>
                <p class="text-xs text-muted-foreground mt-0.5">Browse and double-click to add nodes to your graph</p>
              </div>
              <button @click="closeModal" class="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text" 
                v-model="localSearchQuery"
                placeholder="Search nodes... (e.g. 'branch', 'add vector')" 
                class="w-full h-10 pl-9 pr-10 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-foreground"
              />
              <button 
                v-if="localSearchQuery"
                @click="localSearchQuery = ''"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex flex-1 min-h-0">
            
            <div class="w-56 border-r border-border bg-muted/5 flex flex-col overflow-y-auto custom-scroll shrink-0 p-4 gap-6">
              
              <div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <Star class="w-3.5 h-3.5" /> Favorites
                </div>
                <div v-if="favoriteNodes.length === 0" class="text-xs text-muted-foreground italic px-2">No favorites yet</div>
                <div class="space-y-0.5">
                  <div 
                    v-for="node in favoriteNodes" :key="'mod-fav-'+node.type"
                    @click="openCategoryOfNode(node)"
                    @dblclick="handleAddNodeToCanvas(node)"
                    class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs cursor-pointer group transition-colors text-foreground"
                    title="Click to open category, Double-click to add"
                  >
                    <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
                    <span class="truncate flex-1">{{ node.label }}</span>
                    <button @click.stop="toggleFavorite(node)" class="opacity-0 group-hover:opacity-100" title="Remove Favorite">
                      <X class="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <Clock class="w-3.5 h-3.5" /> Recent
                </div>
                <div v-if="recentNodes.length === 0" class="text-xs text-muted-foreground/60 italic px-2">No recent nodes</div>
                <div class="space-y-0.5">
                  <div 
                    v-for="node in recentNodes" :key="'mod-rec-'+node.type"
                    @click="openCategoryOfNode(node)"
                    @dblclick="handleAddNodeToCanvas(node)"
                    class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs cursor-pointer group transition-colors text-foreground"
                    title="Click to open category, Double-click to add"
                  >
                    <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
                    <span class="truncate flex-1">{{ node.label }}</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="flex-1 bg-background overflow-y-auto custom-scroll p-6 relative">
              
              <div v-if="activeGroup && !localSearchQuery">
                <button @click="activeGroup = null" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ChevronLeft class="w-4 h-4" /> Back to Categories
                </button>
                <div class="flex items-center gap-3 mb-6">
                  <div class="p-2.5 rounded-xl bg-muted border border-border">
                    <component :is="activeGroup.icon || 'Box'" class="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-foreground">{{ activeGroup.label }}</h3>
                    <p class="text-xs text-muted-foreground">{{ activeGroup.description || 'Category items' }}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 xl:grid-cols-3 gap-2">
                  <NodeListItem 
                    v-for="item in activeGroup.items" 
                    :key="item.type" 
                    :item="item"
                    @add="handleAddNodeToCanvas(item)"
                  />
                </div>
              </div>

              <div v-else>
                <div v-if="!localSearchQuery" class="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  <div 
                    v-for="group in STATIC_NODE_GROUPS" 
                    :key="group.id"
                    @click="activeGroup = group"
                    class="group relative flex flex-col p-4 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-accent/50 cursor-pointer transition-all shadow-sm hover:shadow-md"
                  >
                    <div class="w-10 h-10 mb-3 rounded-lg bg-muted border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                      <component :is="group.icon || 'Box'" class="w-5 h-5 text-foreground" />
                    </div>
                    <h4 class="font-bold text-sm mb-1 text-foreground">{{ group.label }}</h4>
                    <p class="text-xs text-muted-foreground line-clamp-2 flex-1">{{ group.description || 'Browse nodes in this category' }}</p>
                    <div class="mt-3 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground w-max">
                      {{ group.items?.length || 0 }} nodes
                    </div>
                  </div>
                </div>

                <div v-else>
                  <div class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Search Results for "{{ localSearchQuery }}"
                  </div>
                  
                  <div v-if="flatSearchResults.length > 0" class="grid grid-cols-2 xl:grid-cols-3 gap-2">
                    <NodeListItem 
                      v-for="item in flatSearchResults" 
                      :key="item.type" 
                      :item="item"
                      @add="handleAddNodeToCanvas(item)"
                    />
                  </div>
                  <div v-else class="py-12 text-center text-sm text-muted-foreground italic border-2 border-dashed border-border rounded-xl">
                    No nodes match your search query.
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Search, X, ChevronLeft, Component, Box, Star, Clock } from 'lucide-vue-next';
import { STATIC_NODE_GROUPS } from '@editors/variable/composables/useNodeBlueprint.js';
import { useGraphEditor } from '@editors/graph/composables/useGraphEditor.js';
import { useNodePreferences } from '@editors/variable/composables/useNodePreferences.js'; 
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import NodeListItem from './NodeListItem.vue';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const { getCenterPos, store } = useGraphEditor();
const { toggleFavorite, addToRecent, favoriteNodes, recentNodes } = useNodePreferences();

const localSearchQuery = ref('');
const activeGroup = ref(null);
const isMouseDownOutside = ref(false);

const flatSearchResults = computed(() => {
  if (!localSearchQuery.value) return [];
  const query = localSearchQuery.value.toLowerCase();
  let results = [];
  STATIC_NODE_GROUPS.forEach(g => {
    g.items.forEach(item => {
      if (item.label.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query))) {
        results.push(item);
      }
    });
  });
  return results;
});

const openCategoryOfNode = (node) => {
  const targetGroup = STATIC_NODE_GROUPS.find(group => 
    group.items.some(item => item.type === node.type)
  );

  if (targetGroup) {
    activeGroup.value = targetGroup;
    localSearchQuery.value = ''; 
  }
};

const handleAddNodeToCanvas = (template) => {
  const centerPos = getCenterPos();
  const newNodePayload = {
    _id: GenerateUUID(),
    type: template.type,
    allowDynamicInputs: template.allowDynamicInputs ?? false,
    allowDynamicOutputs: template.allowDynamicOutputs ?? false,
    name: template.label,
    position: { x: centerPos.x - 100, y: centerPos.y - 50 },
    ...template.defaultData
  };

  store.addNodeToActive(newNodePayload);
  addToRecent(template.type);
  closeModal();
};

const onOutsideMouseDown = (e) => isMouseDownOutside.value = e.target === e.currentTarget;
const onOutsideMouseUp = (e) => {
  if (isMouseDownOutside.value && e.target === e.currentTarget) closeModal();
  isMouseDownOutside.value = false;
};

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.isOpen) closeModal();
};

const closeModal = () => emit('close');

onMounted(() => window.addEventListener('keydown', handleKeyDown));
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<style scoped>
.custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; margin-block: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 9999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }
</style>