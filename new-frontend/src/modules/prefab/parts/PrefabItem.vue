<template>
  <div 
    class="group relative select-none rounded-md border cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active 
        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/5' 
        : 'border-transparent hover:bg-secondary/60 hover:border-border/50'
    ]"
    @click="$emit('click', data)"
  >
    <div 
      class="flex items-center justify-center rounded-md overflow-hidden bg-secondary/30 border border-white/5 shrink-0"
      :class="[
        viewMode === 'grid' ? 'w-12 h-12 mb-2' : 'w-8 h-8 mr-3'
      ]"
    >
      <img 
        v-if="data.thumbnailUrl" 
        :src="data.thumbnailUrl" 
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
        loading="lazy"
      />
      <Box 
        v-else 
        class="text-pink-500/80 transition-colors group-hover:text-pink-500" 
        :class="viewMode === 'grid' ? 'w-6 h-6' : 'w-4 h-4'" 
        :stroke-width="1.5"
      />
    </div>

    <span 
      class="font-medium truncate transition-colors"
      :class="[
        viewMode === 'grid' ? 'text-[11px] w-full text-center px-1' : 'text-xs flex-1',
        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
      ]"
    >
      {{ data.name }}
    </span>

    <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" v-if="viewMode === 'grid'">
       <div class="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Box } from 'lucide-vue-next'

const props = defineProps({
  data: { type: Object, required: true }, // { name, thumbnailUrl, ... }
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false }
})

defineEmits(['click'])

const containerClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'flex flex-col items-center p-2'
    : 'flex items-center px-2 py-1.5'
})
</script>