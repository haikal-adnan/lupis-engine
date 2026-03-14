<template>
  <button
    type="button"
    @click="handleClick"
    class="group flex items-center justify-center shrink-0 transition-all duration-200 border outline-none 
           focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary 
           disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      'h-8 w-8',
      
      active 
        ? 'bg-primary/10 text-primary border-primary shadow-sm' 
        : ghost
          ? 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground'
          : 'bg-background text-muted-foreground border-input hover:text-foreground hover:bg-muted/20 hover:border-muted-foreground/50'
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
  tooltip: { type: String, default: null },
  radius: { type: String, default: '0.375rem' },
  active: { type: Boolean, default: false },
  ghost: { type: Boolean, default: false } 
})

const model = defineModel({ type: Boolean, default: undefined })

const active = computed(() => {
  if (model.value !== undefined) return model.value
  return props.active
})

function handleClick() {
  if (model.value !== undefined) {
    model.value = !model.value
  }
}
</script>