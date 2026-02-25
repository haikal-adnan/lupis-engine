<template>
  <PropertySection 
    title="Node Library" 
    :showMenu="false"
    :defaultOpen="true"
  >
    <div class="flex flex-col gap-2">
      
      <div class="flex items-center gap-1.5">
        <div class="relative flex-1">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          
          <input 
            type="text" 
            v-model="searchQuery"
            placeholder="Search nodes..." 
            class="w-full h-7 pl-8 pr-7 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/50 transition-colors"
          />

          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <div class="flex-1 space-y-3 mt-1 overflow-y-auto pr-1">

        <ScrollArea class="flex-1">
              
          <div v-for="group in filteredGroups" :key="group.id">
            
            <div class="flex items-center gap-1.5 px-1 mb-1 opacity-70">
              <component :is="group.icon" class="w-3 h-3 text-muted-foreground" />
              <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{{ group.label }}</span>
            </div>
            
            <div class="space-y-0.5">
              <div 
                v-for="item in group.items" 
                :key="item.type + item.label" 
                draggable="true"
                @dragstart="onDragNode($event, item)"
                class="
                  group flex items-center gap-2 px-2 py-1.5 rounded cursor-grab 
                  hover:bg-accent hover:text-accent-foreground text-xs transition-colors
                  border border-transparent hover:border-border/30
                "
              >
                <div 
                  class="w-2 h-2 rounded-full shadow-sm ring-1 ring-black/10 flex-shrink-0" 
                  :style="{ backgroundColor: item.defaultData?.settings?.headerColor || group.color }"
                ></div>
                
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ item.label }}</div>
                  <div class="text-[9px] text-muted-foreground/60 truncate hidden group-hover:block">
                    {{ item.description }}
                  </div>
                </div>

                <GripVertical class="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          </div>

        </ScrollArea>

        <div v-if="filteredGroups.length === 0" class="text-xs text-muted-foreground text-center py-4 italic border border-dashed border-border/40 rounded">
          No nodes match "{{ searchQuery }}"
        </div>
      </div>
    </div>
  </PropertySection>
</template>

<script setup>
import { Search, X, GripVertical } from 'lucide-vue-next';
import PropertySection from "@ui/display/PropertySection.vue";
import { useNodeBlueprint } from '@editors/variable/composables/useNodeBlueprint.js';
import ScrollArea from '@/commons/components/overlay/ScrollArea.vue';

const { searchQuery, filteredGroups, onDragNode } = useNodeBlueprint();
</script>