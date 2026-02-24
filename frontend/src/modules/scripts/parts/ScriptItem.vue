<template>
  <div 
    class="group relative select-none rounded-md border cursor-pointer transition-all duration-200"
    :class="[
      containerClass,
      active 
        ? 'bg-blue-500/10 border-blue-500/50 shadow-sm shadow-blue-500/5' 
        : 'border-transparent hover:bg-secondary/60 hover:border-border/50'
    ]"
    @click="$emit('select', data)"
    @dblclick="$emit('open', data)"
  >
    <div 
      class="flex items-center justify-center rounded-md overflow-hidden bg-secondary/30 border border-white/5 shrink-0"
      :class="[viewMode === 'grid' ? 'w-12 h-12 mb-2' : 'w-8 h-8 mr-3']"
    >
      <component 
        :is="FileCode2"
        class="text-blue-500/80 transition-colors group-hover:text-blue-500" 
        :class="viewMode === 'grid' ? 'w-6 h-6' : 'w-4 h-4'" 
        :stroke-width="1.5"
      />
    </div>

    <div class="min-w-0 flex flex-col" :class="viewMode === 'grid' ? 'w-full text-center px-1' : 'flex-1'">
        <span 
            class="font-medium truncate transition-colors"
            :class="[
                viewMode === 'grid' ? 'text-[11px]' : 'text-xs',
                active ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'
            ]"
        >
        {{ data.name }}
        </span>
    </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { FileCode2, Workflow } from 'lucide-vue-next'

const props = defineProps({
  data: { type: Object, required: true }, 
  viewMode: { type: String, default: 'grid' },
  active: { type: Boolean, default: false }
})

defineEmits(['select', 'open'])

const containerClass = computed(() => {
  return props.viewMode === 'grid'
    ? 'flex flex-col items-center p-2'
    : 'flex items-center px-2 py-1.5'
}) 
</script>