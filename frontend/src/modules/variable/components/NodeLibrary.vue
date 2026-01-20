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

      <div class="flex-1 space-y-3 mt-1">
        <div v-for="group in filteredGroups" :key="group.id">
          
          <div class="flex items-center gap-1.5 px-1 mb-1 opacity-70">
            <component :is="group.icon" class="w-3 h-3 text-muted-foreground" />
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{{ group.label }}</span>
          </div>
          
          <div class="space-y-0.5">
            <div 
              v-for="item in group.items" 
              :key="item.type"
              draggable="true"
              @dragstart="onDragNode($event, item)"
              class="
                group flex items-center gap-2 px-2 py-1.5 rounded cursor-grab 
                hover:bg-accent hover:text-accent-foreground text-xs transition-colors
                border border-transparent hover:border-border/30
              "
            >
              <div 
                class="w-2 h-2 rounded-full shadow-sm ring-1 ring-black/10" 
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

        <div v-if="filteredGroups.length === 0" class="text-xs text-muted-foreground text-center py-4 italic border border-dashed border-border/40 rounded">
          No nodes match "{{ searchQuery }}"
        </div>
      </div>
    </div>
  </PropertySection>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Search, X, GripVertical, Zap, Box, Calculator, MessageSquare, Database } from 'lucide-vue-next';
import PropertySection from "@ui/display/PropertySection.vue";

// --- DATA NODE (Sama seperti sebelumnya) ---
const NODE_GROUPS = [
  {
    id: 'events', label: 'Events', color: '#E91E63', icon: Zap,
    items: [
      { type: 'event_on_interact', label: 'On Interact', description: 'Trigger when interacted', defaultData: { settings: { headerTitle: 'On Interact', headerColor: '#E91E63', category: 'Events' } } },
      { type: 'event_key_press', label: 'Keyboard Input', description: 'Trigger on key press', defaultData: { settings: { headerTitle: 'Key Input', headerColor: '#E91E63', category: 'Events', visibleDataFields: ['key'] }, data: { key: 'Space' } } },
    ]
  },
  {
    id: 'logic', label: 'Flow & Logic', color: '#FF9800', icon: Box,
    items: [
      { type: 'logic_branch', label: 'Branch (If/Else)', description: 'Conditional flow', defaultData: { settings: { headerTitle: 'Branch', headerColor: '#FF9800', category: 'Logic' } } },
    ]
  },
  {
    id: 'math', label: 'Math', color: '#009688', icon: Calculator,
    items: [
      { type: 'math_formula', label: 'Formula', description: 'Math expression', defaultData: { settings: { headerTitle: 'Math', headerColor: '#009688', category: 'Math' } } },
    ]
  },
  {
    id: 'data', label: 'Data', color: '#2196F3', icon: Database,
    items: [
       { type: 'data_player_info', label: 'Player Info', description: 'Get player stats', defaultData: { settings: { headerTitle: 'Player Info', headerColor: '#9C27B0', category: 'Data' } } },
    ]
  },
  {
    id: 'ui', label: 'Interface', color: '#607D8B', icon: MessageSquare,
    items: [
      { type: 'ui_show_advanced_dialogue', label: 'Dialogue', description: 'Show text box', defaultData: { settings: { headerTitle: 'Dialogue', headerColor: '#607D8B', category: 'UI' } } },
    ]
  }
];

const searchQuery = ref('');

const filteredGroups = computed(() => {
  if (!searchQuery.value) return NODE_GROUPS;
  const q = searchQuery.value.toLowerCase();
  
  return NODE_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(i => i.label.toLowerCase().includes(q))
  })).filter(g => g.items.length > 0);
});

function onDragNode(event, item) {
  event.dataTransfer.setData('application/node-template', JSON.stringify(item));
  event.dataTransfer.effectAllowed = 'copy';
}
</script>