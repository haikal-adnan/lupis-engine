<template>
  <div 
    data-testid="node-library-item"
    :data-node-type="item.type"
    :data-node-label="item.label"
    @dblclick="$emit('add')"
    class="group flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted cursor-pointer transition-all select-none"
    title="Double-click to add to graph"
  >
    <div 
      class="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/10 shrink-0" 
      :style="{ backgroundColor: item.defaultData?.settings?.headerColor || '#ccc' }"
    ></div>
    
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm text-foreground truncate">{{ item.label }}</div>
      <div class="text-[10px] text-muted-foreground truncate">{{ item.description || 'Node action' }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object
});
defineEmits(['add']);
</script>