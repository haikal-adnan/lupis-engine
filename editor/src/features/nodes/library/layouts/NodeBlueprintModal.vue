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
        data-testid="node-library-modal-backdrop"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2.5 sm:p-4 md:p-6"
        @mousedown="onOutsideMouseDown"
        @mouseup="onOutsideMouseUp"
      >
        <div data-testid="node-library-modal" class="w-full max-w-[900px] h-[min(650px,calc(100vh-1.5rem))] sm:h-[min(650px,calc(100vh-2.5rem))] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col relative overflow-hidden" @mousedown.stop>
          
          <div class="p-3.5 sm:p-5 border-b border-border bg-muted/10 shrink-0">
            <div class="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 class="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                  <Component class="w-4 h-4 sm:w-5 sm:h-5 text-foreground" /> Node Blueprint Library
                </h2>
                <p class="text-xs text-muted-foreground mt-0.5">Browse and double-click to add nodes to your graph</p>
              </div>
              <IconButton 
                data-testid="node-library-modal-close-btn" 
                ghost
                tooltip="Close (Esc)"
                aria-label="Close"
                @click="closeModal"
              >
                <X class="w-4 h-4 sm:w-5 sm:h-5" />
              </IconButton>
            </div>

            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text" 
                data-testid="node-library-modal-search-input"
                v-model="searchQuery"
                placeholder="Search nodes... (e.g. 'branch', 'add vector')" 
                class="w-full h-9 sm:h-10 pl-9 pr-10 text-xs sm:text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-foreground"
              />
              <button 
                v-if="searchQuery"
                data-testid="node-library-modal-search-clear-button"
                @click="searchQuery = ''"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex flex-1 min-h-0">
            
            <div class="w-44 sm:w-56 border-r border-border bg-muted/5 flex flex-col justify-between overflow-y-auto custom-scroll shrink-0 p-3 sm:p-4 gap-4 sm:gap-6">
              <div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  <Clock class="w-3.5 h-3.5" /> Recent
                </div>
                <div v-if="recentNodes.length === 0" data-testid="node-library-modal-recent-empty" class="text-xs text-muted-foreground/60 italic px-2">No recent nodes</div>
                <div class="space-y-0.5">
                  <div 
                    v-for="node in recentNodes" :key="'mod-rec-'+node.type"
                    data-testid="node-library-modal-recent-item"
                    :data-node-type="node.type"
                    @dblclick="handleAddNodeToCanvas(node)"
                    class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs cursor-pointer group transition-colors text-foreground"
                    title="Double-click to add to graph"
                  >
                    <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
                    <span class="truncate flex-1">{{ node.label }}</span>
                  </div>
                </div>
              </div>

              <!-- Align Bottom Recent: Add Custom Node Button -->
              <div class="pt-3 border-t border-border/50">
                <button
                  type="button"
                  @click="handleAddCustomNodeToCanvas"
                  class="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded border border-dashed border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer group"
                  data-testid="node-library-modal-add-custom-btn"
                  title="Add Custom Node directly to Graph"
                >
                  <Cpu class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>+ Add Custom Node</span>
                </button>
              </div>
            </div>

            <div class="flex-1 bg-background overflow-y-auto custom-scroll p-4 sm:p-6 relative">
              
              <div v-if="activeGroup && !searchQuery">
                <button data-testid="node-library-modal-back-btn" @click="activeGroup = null" class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
                  <ChevronLeft class="w-4 h-4" /> Back to Categories
                </button>
                <div class="flex items-center gap-3 mb-6">
                  <div class="p-2.5 rounded-xl bg-muted border border-border">
                    <component :is="activeGroup.icon || 'Box'" class="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-foreground">{{ activeGroup.label }}</h3>
                  </div>
                </div>
                
                <div v-if="activeGroup.items?.length > 0" data-testid="node-library-modal-category-items" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
                  <NodeListItem 
                    v-for="item in activeGroup.items" 
                    :key="item.type" 
                    :item="item"
                    @add="handleAddNodeToCanvas(item)"
                  />
                </div>
                <div v-else class="py-12 text-center text-sm text-muted-foreground italic border-2 border-dashed border-border rounded-xl">
                  No custom nodes saved in this project yet.
                </div>
              </div>

              <div v-else>
                <div v-if="!searchQuery" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  <div 
                    v-for="group in libraryGroups" 
                    :key="group.label"
                    data-testid="node-library-modal-category-card"
                    :data-category-label="group.label"
                    @click="activeGroup = group"
                    class="group relative flex flex-col p-4 rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-accent/50 cursor-pointer transition-all shadow-sm hover:shadow-md"
                  >
                    <div class="w-10 h-10 mb-3 rounded-lg bg-muted border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                      <component :is="group.icon || 'Box'" class="w-5 h-5 text-foreground" />
                    </div>
                    <h4 class="font-bold text-sm mb-1 text-foreground">{{ group.label }}</h4>
                    <div class="mt-3 inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground w-max">
                      {{ group.items?.length || 0 }} nodes
                    </div>
                  </div>
                </div>

                <div v-else>
                  <div class="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Search Results for "{{ searchQuery }}"
                  </div>
                  
                  <div v-if="flatSearchResults.length > 0" data-testid="node-library-modal-search-results" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
                    <NodeListItem 
                      v-for="item in flatSearchResults" 
                      :key="item.type" 
                      :item="item"
                      @add="handleAddNodeToCanvas(item)"
                    />
                  </div>
                  <div v-else data-testid="node-library-modal-no-results" class="py-12 text-center text-sm text-muted-foreground italic border-2 border-dashed border-border rounded-xl">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { IconButton } from '@components/components.js';
import { Search, X, ChevronLeft, Component, Clock, Cpu } from 'lucide-vue-next';
import { useNodeBlueprint, useNodePreferences, useGraphEditor, NodeListItem, createCustomNodeInstance } from '@nodes/nodes.js';
import { useScriptHistory } from '@historys/historys.js';
import { usePopAlert } from '@composables/composables.js';

const props = defineProps({ isOpen: Boolean });
const emit = defineEmits(['close']);

const { addNodeAtSpawn, getCenterPos, store } = useGraphEditor();
const { nodeGroups, libraryGroups, searchQuery, filteredGroups } = useNodeBlueprint();
const { recentNodes } = useNodePreferences();
const scriptHistory = useScriptHistory();
const { showPop } = usePopAlert();

const activeGroup = ref(null);

watch(() => props.isOpen, (open) => {
  if (open) {
    activeGroup.value = null;
    searchQuery.value = '';
  }
});

const isMouseDownOutside = ref(false);

const flatSearchResults = computed(() => {
  if (!searchQuery.value) return [];
  
  const results = [];
  filteredGroups.value.forEach(g => {
    g.items.forEach(item => results.push(item));
  });
  
  return results;
});

const handleAddNodeToCanvas = (template) => {
  addNodeAtSpawn(template);
  closeModal();
};

const handleAddCustomNodeToCanvas = () => {
  const centerPos = getCenterPos();
  const newNode = createCustomNodeInstance({
    x: Math.round((centerPos.x - 100) / 20) * 20,
    y: Math.round((centerPos.y - 50) / 20) * 20
  });

  store.addNodeToActive(newNode);
  scriptHistory.recordAddNode(newNode);
  store.setSelectedNode(newNode.id);
  closeModal();
  showPop({
    title: 'Custom Node Added',
    message: 'A new custom node template has been added to the graph canvas.',
    type: 'success'
  });
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