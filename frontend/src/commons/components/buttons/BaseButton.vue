<template>
  <button
    type="button"
    @click="handleClick"
    class="group relative flex items-center gap-2 px-3 text-xs font-medium transition-all duration-200 border outline-none 
           focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30
           disabled:opacity-50 disabled:cursor-not-allowed select-none"
    :class="[
      alignmentClass,
      heightClass,
      /* State: ACTIVE (Soft Blue Style) */
      active 
        ? 'bg-blue-500/10 text-blue-600 border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50 shadow-sm ' +
          'hover:bg-blue-500/20 hover:border-blue-500/60' 
        : ghost
          /* State: GHOST / INACTIVE (Netral, Hover Blue Halus) */
          ? 'bg-transparent border-slate-200 dark:border-slate-800 text-muted-foreground ' +
            'hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400' 
          /* State: NORMAL */
          : 'bg-white dark:bg-slate-900 text-foreground border-slate-200 dark:border-slate-700 shadow-sm ' +
            'hover:border-blue-500/40 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:bg-slate-800'
    ]"
    :style="{ borderRadius: radius }"
  >
    <slot />

    <span
      v-if="tooltip"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 
             bg-popover text-popover-foreground border border-border text-[10px] font-medium 
             rounded shadow-sm whitespace-nowrap z-50 pointer-events-none
             opacity-0 scale-95 translate-y-1 
             group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
             transition-all duration-200 delay-100 origin-bottom"
    >
      {{ tooltip }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  align: { type: String, default: 'center' },
  heightClass: { type: String, default: 'h-8' },
  radius: { type: String, default: '0.375rem' },
  tooltip: { type: String, default: null },
  active: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false } 
})

// Menggunakan defineModel untuk sinkronisasi state dua arah (v-model)
const model = defineModel({ type: Boolean, default: undefined })

// Prioritaskan model jika ada, jika tidak gunakan prop active
const isActive = computed(() => {
  if (model.value !== undefined) return model.value
  return props.active
})

const alignmentClass = computed(() => {
  switch (props.align) {
    case 'start': return 'justify-start'
    case 'end': return 'justify-end'
    case 'between': return 'justify-between'
    case 'center':
    default: return 'justify-center'
  }
})

function handleClick(e) {
  if (model.value !== undefined) {
    model.value = !model.value
  }
}
</script>