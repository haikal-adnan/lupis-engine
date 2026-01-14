<template>
  <button
    type="button"
    @click="$emit('click')"
    class="group relative flex items-center justify-start h-full min-w-[140px] max-w-[200px] gap-2 px-3 outline-none select-none transition-all duration-200 text-xs font-medium border-t-2 border-x-0 border-b-0"
    :class="[
      active 
        ? 'border-primary bg-primary/10 text-foreground' 
        : 'border-transparent bg-background text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
    ]"
  >
    <slot name="icon">
      <component 
        v-if="icon" 
        :is="icon" 
        class="w-4 h-4 shrink-0 transition-colors"
        :class="iconColor"
        :stroke-width="1.5"
      />
    </slot>

    <span class="truncate pr-5 mb-[1px]">{{ label }}</span>
    
    <div 
      v-if="closable"
      class="absolute right-1.5 p-0.5 rounded-sm hover:bg-muted/50 transition-all duration-200 z-10 text-muted-foreground hover:text-destructive flex items-center justify-center"
      :class="active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      @click.stop="$emit('close')"
    >
      <X class="w-3 h-3" :stroke-width="2.5" />
    </div>
  </button>
</template>

<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  label: { type: String, required: true },
  active: { type: Boolean, default: false },
  closable: { type: Boolean, default: true },
  icon: { type: [Object, String, Function], default: null },
  iconColor: { type: String, default: 'text-muted-foreground' }
})

defineEmits(['click', 'close'])
</script>