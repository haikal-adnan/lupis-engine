<template>
  <div 
    @dblclick="$emit('add')"
    class="group flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-muted cursor-pointer transition-all"
  >
    <div 
      class="w-3 h-3 rounded-full shadow-sm ring-1 ring-black/10 shrink-0" 
      :style="{ backgroundColor: item.defaultData?.settings?.headerColor || '#ccc' }"
    ></div>
    
    <div class="flex-1 min-w-0">
      <div class="font-medium text-sm text-foreground truncate">{{ item.label }}</div>
      <div class="text-[10px] text-muted-foreground truncate">{{ item.description || 'Node action' }}</div>
    </div>

    <button 
      @click.stop="$emit('toggle-favorite')" 
      class="p-1.5 rounded hover:bg-background transition-colors"
      :class="isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      title="Toggle Favorite"
    >
      <Star 
        class="w-4 h-4 transition-colors"
        :class="isFavorite ? 'fill-current text-foreground' : 'text-muted-foreground hover:text-foreground'" 
      />
    </button>
  </div>
</template>

<script setup>
import { Star } from 'lucide-vue-next';
defineProps({
  item: Object,
  isFavorite: Boolean
});
defineEmits(['add', 'toggle-favorite']);
</script>