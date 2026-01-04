<template>
  <div class="w-full">
    <button 
      type="button"
      @click="toggle" 
      class="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground w-full select-none transition-colors group outline-none"
    >
      <slot name="icon">
        <component 
          :is="icon" 
          class="w-3 h-3 transition-transform duration-200 text-muted-foreground/70 group-hover:text-foreground"
          :class="{ 'rotate-90': isOpen }" 
        />
      </slot>
      
      {{ title }}
    </button>

    <div 
      v-show="isOpen" 
      class="mt-2 animate-in slide-in-from-top-1 duration-200"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },

  icon: { type: [Object, Function], default: () => ChevronRight },
  defaultOpen: { type: Boolean, default: false }
})

const isOpen = defineModel({ type: Boolean, default: undefined })

const internalOpen = ref(props.defaultOpen)

watchEffect(() => {
  if (isOpen.value === undefined) {
    isOpen.value = internalOpen.value
  } else {
    internalOpen.value = isOpen.value
  }
})

function toggle() {
  isOpen.value = !isOpen.value
}
</script>