<script setup>
import PropertyPanel from './Inspector/PropertyPanel.vue';

defineProps({
  collapsed: Boolean
});

defineEmits(['toggle']);
</script>

<template>
  <div class="h-full flex flex-col bg-panel overflow-hidden border-l border-border">
    
    <div v-if="!collapsed" class="h-10 flex items-center justify-between border-b border-border bg-panel-header px-2 shrink-0">
      <h3 class="font-semibold text-primary text-xs uppercase tracking-wide opacity-80 pl-1">
        Property Inspector
      </h3>
      
      <button @click="$emit('toggle')" class="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary" title="Collapse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M15 3v18"/></svg>
      </button>
    </div>

    <div v-else class="h-10 flex flex-col items-center justify-center border-b border-border bg-panel-header shrink-0">
      <button @click="$emit('toggle')" class="p-1 hover:bg-accent rounded text-primary" title="Expand">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M15 3v18"/><path d="m9 9 3 3-3 3"/></svg>
      </button>
    </div>

    <div v-if="!collapsed" class="flex-1 overflow-y-auto p-2 scrollbar-thin">
      <div class="flex flex-col space-y-2 text-sm">
        <PropertyPanel />
      </div>
    </div>
    
    <div v-else class="flex-1 py-4 flex flex-col items-center">
       <div class="writing-vertical-lr text-xs text-muted-foreground tracking-widest uppercase opacity-50 select-none">
          Inspector
       </div>
    </div>
  </div>
</template>

<style scoped>
.writing-vertical-lr {
  writing-mode: vertical-lr;
  text-orientation: mixed;
}
</style>