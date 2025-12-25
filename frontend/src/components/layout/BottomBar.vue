<template>
  <div class="h-10 bg-background border-t border-border flex items-center justify-start px-2 select-none z-40 relative">
    
    <div class="flex items-center gap-1">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="$emit('toggle', tab.id)"
        :class="[
          'flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-sm transition-colors border border-transparent',
          activeTab === tab.id 
            ? 'bg-secondary text-foreground border-border/50 shadow-sm' 
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        ]"
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <div class="ml-auto flex items-center gap-4 text-[10px] text-muted-foreground px-2">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>Ready</span>
      </div>
      <span>UTF-8</span>
    </div>

  </div>
</template>

<script setup>

const props = defineProps({ activeTab: String });
const emit = defineEmits(['toggle']);

const FallbackIcon = { template: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>' };

const tabs = [
  { id: 'assets', label: 'Assets', icon:FallbackIcon },
  { id: 'console', label: 'Console', icon: FallbackIcon },
  { id: 'library', label: 'Library', icon: FallbackIcon },
];
</script>