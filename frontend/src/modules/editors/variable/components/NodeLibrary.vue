<template>
  <PropertySection 
    title="Node Library" 
    :showMenu="false"
    :defaultOpen="true"
  >
    <div class="flex flex-col gap-3 py-1">
      
      <BaseButton 
        @click="isModalOpen = true"
        variant="outline"
        class="w-full justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 text-foreground hover:text-primary transition-colors"
      >
        <Component class="w-4 h-4" />
        Open Node Library
      </BaseButton>

      <div class="relative mt-1">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input 
          type="text" 
          v-model="sidebarSearchQuery"
          placeholder="Search nodes or categories..." 
          class="w-full h-8 pl-8 pr-7 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-foreground"
        />
        <button 
          v-if="sidebarSearchQuery"
          @click="sidebarSearchQuery = ''"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <div v-if="!sidebarSearchQuery" class="flex flex-col gap-4 mt-1">
        
        <div v-if="favoriteNodes.length > 0">
          <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <Star class="w-3.5 h-3.5" /> Favorites
          </div>
          <div class="space-y-1">
            <div 
              v-for="node in favoriteNodes" :key="'fav-'+node.type"
              draggable="true"
              @dragstart="onDragNode($event, node)"
              @dblclick="handleAddNodeToCanvas(node)"
              class="
                group relative flex items-center gap-2 p-2 rounded border outline-none
                transition-all duration-200 select-none cursor-grab active:cursor-grabbing
                bg-card border-border text-muted-foreground text-xs
                hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-foreground
                dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40
              "
            >
              <div class="w-2 h-2 rounded-full shadow-sm border border-black/10 shrink-0" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
              <span class="truncate flex-1 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ node.label }}</span>
              <button @click.stop="toggleFavorite(node)" class="opacity-0 group-hover:opacity-100 shrink-0" title="Remove from Favorites">
                <X class="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="recentNodes.length > 0">
          <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2" :class="favoriteNodes.length > 0 ? 'mt-2' : ''">
            <Clock class="w-3.5 h-3.5" /> Recent
          </div>
          <div class="space-y-1">
            <div 
              v-for="node in recentNodes" :key="'rec-'+node.type"
              draggable="true"
              @dragstart="onDragNode($event, node)"
              @dblclick="handleAddNodeToCanvas(node)"
              class="
                group relative flex items-center gap-2 p-2 rounded border outline-none
                transition-all duration-200 select-none cursor-grab active:cursor-grabbing
                bg-card border-border text-muted-foreground text-xs
                hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-foreground
                dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40
              "
            >
              <div class="w-2 h-2 rounded-full shadow-sm border border-black/10 shrink-0" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
              <span class="truncate flex-1 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ node.label }}</span>
            </div>
          </div>
        </div>

      </div>

      <div v-else class="mt-1 flex flex-col">
        <div class="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Search Results
        </div>
        
        <div class="space-y-1 max-h-[300px] overflow-y-auto custom-scroll pr-1">
          <div 
            v-for="node in sidebarSearchResults" 
            :key="'search-' + node.groupLabel + '-' + node.type"
            draggable="true"
            @dragstart="onDragNode($event, node)"
            @dblclick="handleAddNodeToCanvas(node)"
            class="
              group relative flex flex-col gap-1 p-2 rounded border outline-none
              transition-all duration-200 select-none cursor-grab active:cursor-grabbing
              bg-card border-border text-muted-foreground text-xs
              hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-foreground
              dark:hover:bg-blue-500/10 dark:hover:border-blue-500/40
            "
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full shadow-sm border border-black/10 shrink-0" :style="{ backgroundColor: node.defaultData?.settings?.headerColor || '#ccc' }"></div>
              <span class="truncate flex-1 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">{{ node.label }}</span>
            </div>
            <span class="text-[9px] ml-4 truncate opacity-70 group-hover:opacity-100 transition-opacity">{{ node.groupLabel }}</span>
          </div>

          <div v-if="sidebarSearchResults.length === 0" class="text-xs text-muted-foreground/60 italic text-center py-6 border border-dashed border-border/50 rounded-lg">
            No results for "{{ sidebarSearchQuery }}"
          </div>
        </div>
      </div>

      <div class="h-16 shrink-0 pointer-events-none"></div>

    </div>
  </PropertySection>

  <NodeBlueprintModal 
    :is-open="isModalOpen" 
    @close="isModalOpen = false" 
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { Component, Star, Clock, X, Search } from 'lucide-vue-next';
import PropertySection from "@ui/display/PropertySection.vue";
import BaseButton from "@/commons/components/buttons/BaseButton.vue";
import NodeBlueprintModal from '@editors/variable/views/NodeBlueprintModal.vue'; 
import { useNodePreferences } from '@editors/variable/composables/useNodePreferences.js'; 
import { useGraphEditor } from '@editors/graph/composables/useGraphEditor.js';
import { STATIC_NODE_GROUPS } from '@editors/variable/composables/useNodeBlueprint.js';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

const isModalOpen = ref(false);
const sidebarSearchQuery = ref('');

const { favoriteNodes, recentNodes, toggleFavorite, addToRecent } = useNodePreferences();
const { getCenterPos, store } = useGraphEditor();

const sidebarSearchResults = computed(() => {
  if (!sidebarSearchQuery.value) return [];
  
  const query = sidebarSearchQuery.value.toLowerCase();
  let results = [];

  STATIC_NODE_GROUPS.forEach(group => {
    const isGroupMatch = group.label.toLowerCase().includes(query);

    group.items.forEach(item => {
      const isItemMatch = item.label.toLowerCase().includes(query);

      if (isGroupMatch || isItemMatch) {
        results.push({
          ...item,
          groupLabel: group.label
        });
      }
    });
  });

  return results;
});

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
};

const onDragNode = (event, item) => {
  const templateToDrag = { ...item };
  delete templateToDrag.groupLabel;
  
  event.dataTransfer.setData('application/node-template', JSON.stringify(templateToDrag));
  event.dataTransfer.effectAllowed = 'copy';
};
</script>

<style scoped>
.custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.3) transparent; }
.custom-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; margin-block: 2px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 9999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }
</style>