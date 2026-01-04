<template>
  <div 
    class="flex items-start gap-3 py-1.5 px-3 border-b border-border transition-colors font-mono text-xs group"
    :class="rowColorClass"
  >
    <div class="mt-0.5 shrink-0">
      <CircleX v-if="log.type === 'error'" class="w-3.5 h-3.5 text-rose-500" />
      <TriangleAlert v-else-if="log.type === 'warn'" class="w-3.5 h-3.5 text-amber-500" />
      <Info v-else class="w-3.5 h-3.5 text-blue-500" />
    </div>

    <div class="flex-1 leading-relaxed break-all">
      <span class="text-muted-foreground/60 mr-2 select-none">[{{ log.time }}]</span>
      
      <span 
        class="font-semibold mr-2 cursor-pointer hover:underline opacity-80 group-hover:opacity-100 transition-opacity"
        :class="sourceColorClass"
      >
        [{{ log.source }}]
      </span>

      <span :class="messageColorClass">
        {{ log.message }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Info, TriangleAlert, CircleX } from 'lucide-vue-next'

const props = defineProps({
  log: { type: Object, required: true } // { type: 'info'|'warn'|'error', time, source, message }
})

const rowColorClass = computed(() => {
  switch (props.log.type) {
    case 'error': return 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10'
    case 'warn': return 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10'
    default: return 'hover:bg-secondary/30'
  }
})

const messageColorClass = computed(() => {
  switch (props.log.type) {
    case 'error': return 'text-rose-400'
    case 'warn': return 'text-amber-400'
    default: return 'text-foreground'
  }
})

const sourceColorClass = computed(() => {
    switch (props.log.type) {
    case 'error': return 'text-rose-500'
    case 'warn': return 'text-amber-500'
    default: return 'text-primary'
  }
})
</script>