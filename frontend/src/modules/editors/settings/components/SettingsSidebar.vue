<template>
  <div class="w-64 bg-muted/5 border-r border-border flex flex-col shrink-0">
    <div class="h-14 px-5 border-b border-border flex items-center shrink-0">
      <h2 class="text-sm font-bold flex items-center gap-2.5 text-foreground tracking-tight">
        <div class="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Settings2 class="w-4 h-4 text-primary" />
        </div>
        Project Settings
      </h2>
    </div>
    
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto custom-scroll">
      <div class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">
        Configuration
      </div>
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="active = tab.id"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all outline-none relative overflow-hidden group"
        :class="active === tab.id ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
      >
        <div 
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full transition-transform duration-300"
          :class="active === tab.id ? 'scale-y-100' : 'scale-y-0'"
        ></div>
        
        <component :is="tab.icon" class="w-4 h-4 shrink-0" :class="active === tab.id ? 'text-primary' : 'group-hover:text-foreground'" />
        {{ tab.label }}
      </button>
    </nav>
  </div>
</template>

<script setup>
import { Settings2 } from 'lucide-vue-next';

defineProps({
  tabs: Array
});

const active = defineModel('active', { type: String });
</script>

<style scoped>
.custom-scroll { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.4) transparent; }
.custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 9999px; }
</style>